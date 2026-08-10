// frontend/src/network/client.js — WebSocket 多人联机客户端（含断线重连）
import { reactive } from 'vue';

// 服务器地址。部署时可通过 VITE_WS_URL 覆盖默认公网隧道。
export const resolveWebSocketUrl = (configuredUrl, currentLocation = globalThis.location) => {
  const configured = configuredUrl?.trim();
  if (configured) return configured;

  const hostname = currentLocation?.hostname || 'localhost';
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  const protocol = isLocal ? 'ws:' : 'wss:';
  const host = isLocal ? 'localhost:8080' : 'synapse-squander-finale.ngrok-free.dev';
  return `${protocol}//${host}`;
};

const WS_URL = resolveWebSocketUrl(import.meta.env?.VITE_WS_URL);

export const netState = reactive({
  connected: false,
  roomId: null,
  playerIndex: -1,
  players: [],
  error: null,
});

let ws = null;
let connectPromise = null;
let cancelPendingConnect = null;
let listeners = new Map();
let sendQueue = [];
let reconnectTimer = null;
let reconnectAttempts = 0;
const MAX_RECONNECT = 8;
const CONNECT_TIMEOUT_MS = 10000;
let lastRoomId = null;
let lastPlayerName = '';
let lastAvatar = '';
let reconnectToken = null;
const TOKEN_KEY = 'tjmj_reconnect_token';

// 连接服务器
export const connect = () => {
  if (ws?.readyState === WebSocket.OPEN) return Promise.resolve();
  if (ws?.readyState === WebSocket.CONNECTING && connectPromise) return connectPromise;

  let socket;
  try {
    socket = new WebSocket(WS_URL);
  } catch (error) {
    netState.error = '无法连接服务器';
    return Promise.reject(error);
  }
  ws = socket;

  const promise = new Promise((resolve, reject) => {
    let settled = false;
    let timeoutId = null;

    const clearPending = () => {
      if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
      if (connectPromise === promise) connectPromise = null;
      if (cancelPendingConnect === cancel) cancelPendingConnect = null;
    };

    const fail = (message) => {
      if (settled) return;
      settled = true;
      clearPending();
      reject(new Error(message));
    };

    const cancel = () => fail('连接已取消');
    cancelPendingConnect = cancel;
    timeoutId = setTimeout(() => {
      netState.error = '连接超时';
      fail('连接服务器超时');
      if (ws === socket) ws = null;
      socket.close();
    }, CONNECT_TIMEOUT_MS);

    socket.onopen = () => {
      if (settled || ws !== socket) {
        socket.close();
        return;
      }
      settled = true;
      clearPending();
      netState.connected = true;
      netState.error = null;
      if (sendQueue.length > 0) {
        console.log('[client] 冲刷缓冲消息:', sendQueue.length, '条');
        sendQueue.forEach(m => socket.send(JSON.stringify(m)));
        sendQueue = [];
      }
      resolve();
    };

    socket.onmessage = (e) => {
      let msg;
      try { msg = JSON.parse(e.data); } catch (err) { return; }
      handleMessage(msg);
    };

    socket.onclose = () => {
      const isCurrentSocket = ws === socket;
      if (isCurrentSocket) ws = null;
      fail('连接已关闭');
      if (!isCurrentSocket) return;
      netState.connected = false;
      stopHeartbeat();
      updateLatency(0);
      // 尝试自动重连（指数退避）
      if (lastRoomId) {
        scheduleReconnect();
      } else {
        emit('disconnected');
      }
    };

    socket.onerror = () => {
      netState.error = '连接错误';
      fail('连接服务器失败');
    };
  });

  connectPromise = promise;
  return promise;
};

// 断线重连（指数退避：1s → 2s → 4s → ... → 最大 128s）
const scheduleReconnect = () => {
  if (reconnectTimer) return;
  if (reconnectAttempts >= MAX_RECONNECT) {
    console.log('[client] 重连失败，已达最大尝试次数');
    emit('disconnected');
    return;
  }
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 120000);
  reconnectAttempts++;
  console.log(`[client] ${delay/1000}s 后尝试第 ${reconnectAttempts} 次重连...`);
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    try {
      await connect();
      // 重连成功后自动重新加入房间
      if (lastRoomId && lastPlayerName) {
        send({
          type: 'join_room',
          roomId: lastRoomId,
          name: lastPlayerName,
          avatar: lastAvatar,
          reconnectToken: getReconnectToken(),
        });
        console.log('[client] 重连成功，已重新加入房间', lastRoomId);
      }
      emit('reconnected');
    } catch (e) {
      scheduleReconnect();
    }
  }, delay);
};

// 记录当前房间信息（用于重连）
export const setRoomInfo = (roomId, playerName, avatar) => {
  lastRoomId = roomId;
  lastPlayerName = playerName;
  lastAvatar = avatar;
};

// 断线重连令牌（跨页面刷新存 sessionStorage，仅当前标签页有效）
export const getReconnectToken = () => {
  return reconnectToken || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(TOKEN_KEY) : null) || undefined;
};

const saveReconnectToken = (token) => {
  if (!token) return;
  reconnectToken = token;
  try { sessionStorage.setItem(TOKEN_KEY, token); } catch (error) {}
};

// 断开连接（主动断开，不重连）
export const disconnect = () => {
  lastRoomId = null;
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  reconnectAttempts = 0;
  const socket = ws;
  ws = null;
  if (cancelPendingConnect) cancelPendingConnect();
  if (socket) {
    socket.onopen = null;
    socket.onmessage = null;
    socket.onclose = null;
    socket.onerror = null;
    socket.close();
  }
  connectPromise = null;
  cancelPendingConnect = null;
  sendQueue = [];
  reconnectToken = null;
  try { sessionStorage.removeItem(TOKEN_KEY); } catch (error) {}
  stopHeartbeat();
  updateLatency(0);
  netState.connected = false;
  netState.roomId = null;
  netState.playerIndex = -1;
  netState.players = [];
};

// 发送消息
const _lastSend = {};
const _THROTTLE = 400;
const _NO_THROTTLE = ['webrtc_offer', 'webrtc_answer', 'webrtc_ice', 'chat'];
export const send = (msg) => {
  const now = Date.now();
  if (!_NO_THROTTLE.includes(msg.type)) {
    const last = _lastSend[msg.type] || 0;
    if (now - last < _THROTTLE) {
      console.log('[client] 节流跳过:', msg.type, `(距上次${now - last}ms)`);
      return false;
    }
  }
  console.log('[client] send:', msg.type, 'ws状态:', ws?.readyState);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
    if (!_NO_THROTTLE.includes(msg.type)) _lastSend[msg.type] = now;
    return true;
  } else if (ws && ws.readyState === WebSocket.CONNECTING) {
    sendQueue.push(msg);
    if (!_NO_THROTTLE.includes(msg.type)) _lastSend[msg.type] = now;
    return true;
  } else {
    console.error('[client] 无法发送! ws=', ws, 'readyState=', ws?.readyState);
    return false;
  }
};

// 心跳（保持连接活跃，防 NAT 超时断开）+ 延迟测量
let heartbeatTimer = null;
let pingSentTime = 0;
export const netLatency = reactive({ ms: 0, level: 0 }); // 0=离线 1-4=信号格数
const startHeartbeat = () => {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      pingSentTime = Date.now();
      send({ type: 'ping' });
    } else {
      netLatency.level = 0;
    }
  }, 10000); // 每 10 秒测一次
};
const stopHeartbeat = () => {
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
};

// 更新延迟等级
const updateLatency = (ms) => {
  netLatency.ms = ms;
  if (ms <= 0) netLatency.level = 0;
  else if (ms < 100) netLatency.level = 4;
  else if (ms < 200) netLatency.level = 3;
  else if (ms < 400) netLatency.level = 2;
  else netLatency.level = 1;
};

// 事件监听
export const on = (event, fn) => {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(fn);
};

export const off = (event, fn) => {
  const set = listeners.get(event);
  if (set) set.delete(fn);
};

const emit = (event, data) => {
  const set = listeners.get(event);
  if (set) set.forEach(fn => fn(data));
};

// 处理服务器消息
const handleMessage = (msg) => {
  switch (msg.type) {
    case 'room_created':
    case 'room_joined':
      reconnectAttempts = 0;
      netState.roomId = msg.roomId;
      netState.playerIndex = msg.playerIndex;
      saveReconnectToken(msg.reconnectToken);
      setRoomInfo(msg.roomId, msg.name || lastPlayerName, msg.avatar || lastAvatar);
      startHeartbeat();
      break;

    case 'room_players':
      netState.players = msg.players;
      break;

    case 'pong':
      updateLatency(Date.now() - pingSentTime);
      break;

    case 'error':
      netState.error = msg.message;
      break;

    default:
      break;
  }
  emit(msg.type, msg);
};
