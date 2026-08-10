import test from 'node:test';
import assert from 'node:assert/strict';

import {
  connect,
  disconnect,
  netState,
  off,
  on,
  resolveWebSocketUrl,
  send,
} from '../src/network/client.js';

class FakeWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances = [];

  constructor(url) {
    this.url = url;
    this.readyState = FakeWebSocket.CONNECTING;
    this.sent = [];
    FakeWebSocket.instances.push(this);
  }

  open() {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }

  receive(message) {
    this.onmessage?.({ data: JSON.stringify(message) });
  }

  fail() {
    this.onerror?.(new Error('connection failed'));
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.();
  }

  send(data) {
    this.sent.push(data);
  }

  close() {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.();
  }
}

globalThis.WebSocket = FakeWebSocket;

const resetClient = () => {
  disconnect();
  FakeWebSocket.instances = [];
};

test('resolves local, public, and configured WebSocket endpoints', () => {
  assert.equal(resolveWebSocketUrl('', { hostname: 'localhost' }), 'ws://localhost:8080');
  assert.equal(resolveWebSocketUrl('', { hostname: '127.0.0.1' }), 'ws://localhost:8080');
  assert.equal(
    resolveWebSocketUrl(' wss://game.example/ws ', { hostname: 'example.github.io' }),
    'wss://game.example/ws',
  );
  assert.match(resolveWebSocketUrl('', { hostname: 'example.github.io' }), /^wss:/);
});

test('reuses an in-flight connection and flushes messages queued during the handshake', async () => {
  resetClient();

  const first = connect();
  const second = connect();
  assert.strictEqual(second, first);
  assert.equal(FakeWebSocket.instances.length, 1);

  assert.equal(send({ type: 'chat', text: 'hello' }), true);
  const socket = FakeWebSocket.instances[0];
  socket.open();
  await first;

  assert.equal(netState.connected, true);
  assert.deepEqual(socket.sent.map(JSON.parse), [{ type: 'chat', text: 'hello' }]);
  disconnect();
});

test('rejects promptly when the WebSocket handshake fails', async () => {
  resetClient();

  const connection = connect();
  FakeWebSocket.instances[0].fail();

  await assert.rejects(connection, /连接服务器失败/);
  assert.equal(netState.connected, false);
  disconnect();
});

test('active disconnect clears room state without emitting a remote disconnect event', async () => {
  resetClient();
  let remoteDisconnects = 0;
  const handler = () => { remoteDisconnects += 1; };
  on('disconnected', handler);

  const connection = connect();
  const socket = FakeWebSocket.instances[0];
  socket.open();
  await connection;
  socket.receive({ type: 'room_joined', roomId: '1234', playerIndex: 2 });

  disconnect();
  assert.equal(remoteDisconnects, 0);
  assert.equal(netState.connected, false);
  assert.equal(netState.roomId, null);
  assert.deepEqual(netState.players, []);
  off('disconnected', handler);
});
