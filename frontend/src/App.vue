<template>
  <div class="app-container">
    
    <div class="portrait-overlay">
      <div class="portrait-content">
        <div class="rotate-icon">📱</div>
        <p>为获得最佳体验<br/>请将手机<span style="color:#ffd700">横屏</span>放置</p>
      </div>
    </div>

    <div class="mahjong-desk">
      
      <div class="ready-overlay" v-if="gameState.gamePhase === 'WAITING'">
        <h2>等待玩家准备</h2>
        <div class="ready-players">
          <div class="ready-player" v-for="(player, index) in gameState.players" :key="index">
             <img :src="`${basePath}images/avatars/${player.avatar}.png`" class="ready-avatar" :class="{'is-ready': gameState.readyStatus[index]}" />
             <p>{{ player.name }}</p>
             <span v-if="gameState.readyStatus[index]" class="ready-badge">已准备</span>
          </div>
        </div>
        <button v-if="!gameState.readyStatus[0]" class="btn-ready" @click="handleReady">准备</button>
      </div>

      <div class="walls-container" v-show="gameState.gamePhase === 'PLAYING' || gameState.gamePhase === 'SETTLEMENT'">
        <div class="wall wall-top"><div v-for="n in 14" :key="'top'+n" class="wall-stack-wrapper h-stack"><img v-if="gameState.wallTiles[(27 + n - 1) * 2 + 1]" src="/images/3d/back_3.png" class="stack-bottom h-bg" /><img v-if="gameState.wallTiles[(27 + n - 1) * 2]" src="/images/3d/back_3.png" class="stack-top h-bg" /><img v-if="gameState.diIndex === (27 + n - 1) * 2" :src="`${basePath}images/tiles/${gameState.diTile}.png`" class="stack-top di-face h-face" /></div></div>
        <div class="wall wall-left"><div v-for="n in 13" :key="'left'+n" class="wall-stack-wrapper v-stack"><img v-if="gameState.wallTiles[(26 - (n - 1)) * 2 + 1]" src="/images/3d/back_4.png" class="stack-bottom v-bg" /><img v-if="gameState.wallTiles[(26 - (n - 1)) * 2]" src="/images/3d/back_4.png" class="stack-top v-bg" /><img v-if="gameState.diIndex === (26 - (n - 1)) * 2" :src="`${basePath}images/tiles/${gameState.diTile}.png`" class="stack-top di-face v-face" /></div></div>
        <div class="wall wall-right"><div v-for="n in 13" :key="'right'+n" class="wall-stack-wrapper v-stack"><img v-if="gameState.wallTiles[(41 + n - 1) * 2 + 1]" src="/images/3d/back_2.png" class="stack-bottom v-bg" /><img v-if="gameState.wallTiles[(41 + n - 1) * 2]" src="/images/3d/back_2.png" class="stack-top v-bg" /><img v-if="gameState.diIndex === (41 + n - 1) * 2" :src="`${basePath}images/tiles/${gameState.diTile}.png`" class="stack-top di-face v-face" /></div></div>
        <div class="wall wall-bottom"><div v-for="n in 14" :key="'bottom'+n" class="wall-stack-wrapper h-stack"><img v-if="gameState.wallTiles[(13 - (n - 1)) * 2 + 1]" src="/images/3d/back_1.png" class="stack-bottom h-bg" /><img v-if="gameState.wallTiles[(13 - (n - 1)) * 2]" src="/images/3d/back_1.png" class="stack-top h-bg" /><img v-if="gameState.diIndex === (13 - (n - 1)) * 2" :src="`${basePath}images/tiles/${gameState.diTile}.png`" class="stack-top di-face h-face" /></div></div>
      </div>

      <div class="player-top">
        <div class="avatar-box" :class="{ 'active-glow': gameState.currentPlayerIndex === 2 }">
          <img :src="`${basePath}images/avatars/${gameState.players[2].avatar}.png`" class="avatar-img" />
          <span class="name">对家</span>
          <span class="score" :class="gameState.players[2].score >= 0 ? 'score-up' : 'score-down'">{{ gameState.players[2].score >= 0 ? '+' : '' }}{{ gameState.players[2].score }}</span>
        </div>
        <div class="cards-container-top">
           <div class="npc-exposed top-exposed" v-if="gameState.exposed[2].length > 0">
              <div v-for="(t, i) in getFlatExposed(2)" :key="i" class="rotator-top">
                  <img src="/images/3d/lay_1.png" class="center-tile-bg" />
                  <img :src="`${basePath}images/tiles/${t}.png`" class="center-tile-face" />
              </div>
           </div>
           <div class="hand-tiles-top"><img v-for="n in gameState.npcTileCounts[2]" :key="n" src="/images/3d/hand_3.png" class="tile-back-top" /></div>
        </div>
      </div>
      
      <div class="player-left">
        <div class="avatar-box" :class="{ 'active-glow': gameState.currentPlayerIndex === 3 }">
          <img :src="`${basePath}images/avatars/${gameState.players[3].avatar}.png`" class="avatar-img" />
          <span class="name">上家</span>
          <span class="score" :class="gameState.players[3].score >= 0 ? 'score-up' : 'score-down'">{{ gameState.players[3].score >= 0 ? '+' : '' }}{{ gameState.players[3].score }}</span>
        </div>
        <div class="cards-container-side">
           <div class="npc-exposed left-exposed" v-if="gameState.exposed[3].length > 0">
              <div v-for="(t, i) in getFlatExposed(3)" :key="i" class="npc-exposed-wrapper-side">
                  <div class="rotator rotator-left">
                     <img src="/images/3d/lay_1.png" class="center-tile-bg" />
                     <img :src="`${basePath}images/tiles/${t}.png`" class="center-tile-face" />
                  </div>
              </div>
           </div>
           <div class="hand-tiles-left"><img v-for="n in gameState.npcTileCounts[3]" :key="n" src="/images/3d/hand_4.png" class="tile-back-side" /></div>
        </div>
      </div>
      
      <div class="player-right">
        <div class="cards-container-side">
           <div class="hand-tiles-right"><img v-for="n in gameState.npcTileCounts[1]" :key="n" src="/images/3d/hand_2.png" class="tile-back-side" /></div>
           <div class="npc-exposed right-exposed" v-if="gameState.exposed[1].length > 0">
              <div v-for="(t, i) in getFlatExposed(1)" :key="i" class="npc-exposed-wrapper-side">
                  <div class="rotator rotator-right">
                     <img src="/images/3d/lay_1.png" class="center-tile-bg" />
                     <img :src="`${basePath}images/tiles/${t}.png`" class="center-tile-face" />
                  </div>
              </div>
           </div>
        </div>
        <div class="avatar-box" :class="{ 'active-glow': gameState.currentPlayerIndex === 1 }">
          <img :src="`${basePath}images/avatars/${gameState.players[1].avatar}.png`" class="avatar-img" />
          <span class="name">下家</span>
          <span class="score" :class="gameState.players[1].score >= 0 ? 'score-up' : 'score-down'">{{ gameState.players[1].score >= 0 ? '+' : '' }}{{ gameState.players[1].score }}</span>
        </div>
      </div>

      <div class="player-bottom">
        <div class="avatar-box" :class="{ 'active-glow': gameState.currentPlayerIndex === 0 }">
          <img :src="`${basePath}images/avatars/${gameState.players[0].avatar}.png`" class="avatar-img" />
          <span class="name">我</span>
          <span class="score" :class="gameState.players[0].score >= 0 ? 'score-up' : 'score-down'">{{ gameState.players[0].score >= 0 ? '+' : '' }}{{ gameState.players[0].score }}</span>
        </div>
        
        <div class="hand-tiles-bottom">
          <div class="exposed-area" v-if="gameState.exposed[0].length > 0">
             <div v-for="(group, gIndex) in gameState.exposed[0]" :key="'exp'+gIndex" class="exposed-group">
                <div v-for="(tile, tIndex) in group.tiles" :key="'expt'+tIndex" class="center-tile-wrapper exposed-tile">
                   <img :src="group.type === 'angang' && tIndex < 3 ? '/images/3d/back_1.png' : '/images/3d/lay_1.png'" class="center-tile-bg" />
                   <img v-if="group.type !== 'angang' || tIndex === 3" :src="`${basePath}images/tiles/${tile}.png`" class="center-tile-face" />
                </div>
             </div>
          </div>

          <div v-for="(tile, index) in gameState.handTiles" :key="index" class="hand-tile-wrapper" :class="{ 'selected': gameState.selectedTileIndex === index, 'new-drawn-tile': isNewDrawnTile(index) }" @click="onTapTile(index)">
            <img src="/images/3d/hand_1.png" class="tile-bg" />
            <img :src="`${basePath}images/tiles/${tile}.png`" class="tile-face" />
          </div>
        </div>
      </div>

      <div class="center-area" v-show="gameState.gamePhase === 'PLAYING'">
        <div class="dice-circle">
          <img :src="`${basePath}images/dice/${gameState.dice[0]}.png`" class="dice" />
          <img :src="`${basePath}images/dice/${gameState.dice[1]}.png`" class="dice" />
        </div>
        <div class="discard-pool">
          <div v-for="(item, index) in gameState.discards" :key="index" 
               class="center-tile-wrapper"
               :style="{ gridRow: getDiscardGridPos(index).row, gridColumn: getDiscardGridPos(index).col }">
             <img src="/images/3d/lay_1.png" class="center-tile-bg" />
             <img :src="`${basePath}images/tiles/${item.value}.png`" class="center-tile-face" />
          </div>
        </div>
      </div>

      <div class="action-buttons" v-show="gameState.gamePhase === 'PLAYING'">
        <div class="action-btn chi" :class="{ 'active': actionState.canChi }" @click="handleChi">吃</div>
        <div class="action-btn peng" :class="{ 'active': actionState.canPeng }" @click="handlePeng">碰</div>
        <div class="action-btn gang" :class="{ 'active': actionState.canGang }" @click="handleGang">杠</div>
        <div class="action-btn hu" :class="{ 'active': actionState.canHu || (gameState.currentPlayerIndex === 0 && gameState.handTiles.length % 3 === 2) }" @click="handleHu">胡</div>
        <div class="action-btn pass active" v-if="actionState.isWaiting" @click="passAction">过</div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue';
import { initTiles } from './utils/mjLogic.js';
import { calculateWang } from './core/constants.js';
import { HuCalculator } from './core/HuCalculator.js';
import { RuleChecker } from './core/RuleChecker.js';

// 【核心解法】动态读取环境路径，彻底消灭 404！
const basePath = import.meta.env.BASE_URL;

const generateRandomAvatars = () => {
  let arr = [];
  while(arr.length < 4) {
    let r = Math.floor(Math.random() * 70) + 1;
    if(!arr.includes(r)) arr.push(r);
  }
  return arr;
};
const initialAvatars = generateRandomAvatars();

const gameState = reactive({
  gamePhase: 'WAITING', 
  readyStatus: [false, false, false, false], 
  wallTiles: Array(108).fill(null), drawCursor: 0, deckRemaining: 108,
  handTiles: [], selectedTileIndex: -1, discards: [], 
  currentPlayerIndex: 0,
  npcHands: [[], [], [], []], npcTileCounts: [13, 13, 13, 13],
  exposed: [[], [], [], []],
  dice: [1, 1], diTile: null, wangTile: null, diIndex: -1, 
  players: [
    { name: '我', avatar: `${initialAvatars[0]}`, score: 0 }, 
    { name: '下家', avatar: `${initialAvatars[1]}`, score: 0 }, 
    { name: '对家', avatar: `${initialAvatars[2]}`, score: 0 }, 
    { name: '上家', avatar: `${initialAvatars[3]}`, score: 0 }
  ]
});

const actionState = reactive({ 
  isWaiting: false, targetTile: null, sourceIndex: -1, 
  canChi: false, chiCombinations: [], canPeng: false, canGang: false, canHu: false 
});

const getDiscardGridPos = (index) => {
  let gridSpots = [];
  for (let r = 1; r <= 5; r++) { 
     for (let c = 1; c <= 8; c++) { 
        if ((r === 3 || r === 4) && (c === 3 || c === 4 || c === 5)) continue; 
        gridSpots.push({ row: r, col: c });
     }
  }
  if (index < gridSpots.length) return gridSpots[index];
  return { row: 6, col: (index % 8) + 1 };
};

const getFlatExposed = (pIndex) => {
  let flat = [];
  gameState.exposed[pIndex].forEach(group => flat.push(...group.tiles));
  return flat;
};

const handleReady = () => {
  gameState.readyStatus[0] = true;
  [1, 2, 3].forEach(i => {
    setTimeout(() => {
      gameState.readyStatus[i] = true;
      if (gameState.readyStatus.every(r => r)) setTimeout(startRound, 800);
    }, Math.random() * 1500 + 500);
  });
};

const startRound = () => {
  actionState.isWaiting = false;
  actionState.targetTile = null;
  actionState.canChi = actionState.canPeng = actionState.canGang = actionState.canHu = false;

  gameState.gamePhase = 'PLAYING';
  gameState.readyStatus = [false, false, false, false];
  gameState.discards = [];
  gameState.exposed = [[], [], [], []]; 
  
  const deck = initTiles();
  gameState.wallTiles = [...deck];
  gameState.deckRemaining = 108;

  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  gameState.dice = [d1, d2];
  const sum = d1 + d2;
  const minD = Math.min(d1, d2);
  const maxD = Math.max(d1, d2);

  const drawWall = (sum - 1) % 4; 
  const wallRanges = { 0: { start: 0, end: 13 }, 3: { start: 14, end: 26 }, 2: { start: 27, end: 40 }, 1: { start: 41, end: 53 } };
  gameState.drawCursor = (wallRanges[drawWall].start + minD) * 2;
  
  const wangWall = (drawWall + 1) % 4;
  const wangStack = wallRanges[wangWall].end - maxD + 1;
  gameState.diIndex = wangStack * 2; 
  gameState.diTile = gameState.wallTiles[gameState.diIndex];
  gameState.wangTile = calculateWang(gameState.diTile);

  gameState.handTiles = []; gameState.npcHands = [[], [], [], []];
  
  for(let i=0; i<53; i++) {
    let tile = physicalDraw();
    let player = Math.floor(i / 4) % 4; 
    if (i >= 48) player = i - 48; 
    if (i === 52) player = 0;     
    if (player === 0) gameState.handTiles.push(tile);
    else gameState.npcHands[player].push(tile);
  }
  
  gameState.handTiles.sort((a,b)=>a-b);
  gameState.npcHands.forEach(hand => hand.sort((a,b)=>a-b));
  gameState.npcTileCounts = [13, 13, 13, 13];
  gameState.currentPlayerIndex = 0;
};

const physicalDraw = () => {
  if (gameState.drawCursor === gameState.diIndex) gameState.drawCursor = (gameState.drawCursor + 1) % 108;
  const tile = gameState.wallTiles[gameState.drawCursor];
  gameState.wallTiles[gameState.drawCursor] = null; 
  gameState.drawCursor = (gameState.drawCursor + 1) % 108; 
  gameState.deckRemaining--;
  return tile;
};

const isNewDrawnTile = (index) => index === gameState.handTiles.length - 1 && gameState.handTiles.length % 3 === 2;

const drawTile = (playerIndex) => {
  if (gameState.deckRemaining === 0) {
    alert("牌山空了，流局！");
    gameState.gamePhase = 'SETTLEMENT';
    return;
  }
  const newTile = physicalDraw();
  if (playerIndex === 0) {
    gameState.handTiles.push(newTile);
    actionState.canGang = RuleChecker.canAnGang(gameState.handTiles) !== null;
  } else {
    gameState.npcHands[playerIndex].push(newTile);
    gameState.npcTileCounts[playerIndex] = gameState.npcHands[playerIndex].length;
    setTimeout(() => npcPlayPhase(playerIndex), 1000);
  }
};

const onTapTile = (index) => {
  if (gameState.selectedTileIndex === index) {
    if (gameState.currentPlayerIndex === 0 && gameState.handTiles.length % 3 === 2 && !actionState.isWaiting) {
      playTile(index);
    }
  } else {
    gameState.selectedTileIndex = index;
  }
};

const playTile = (index) => {
  const val = gameState.handTiles.splice(index, 1)[0];
  gameState.discards.push({ value: val });
  gameState.handTiles.sort((a, b) => a - b);
  gameState.selectedTileIndex = -1;
  handleTileDiscarded(0, val);
};

const npcPlayPhase = (playerIndex) => {
  let hand = gameState.npcHands[playerIndex];
  const tileToPlay = hand.splice(Math.floor(Math.random() * hand.length), 1)[0];
  gameState.discards.push({ value: tileToPlay });
  gameState.npcTileCounts[playerIndex] = hand.length;
  handleTileDiscarded(playerIndex, tileToPlay); 
};

const handleTileDiscarded = (sourceIndex, targetTile) => {
  let intercepts = { hu: [], gang: [], peng: [], chi: [] };
  actionState.chiCombinations = [];

  for(let i=1; i<=3; i++) {
    let p = (sourceIndex + i) % 4;
    let hand = (p === 0) ? gameState.handTiles : gameState.npcHands[p];

    if (HuCalculator.checkHu([...hand, targetTile], gameState.wangTile, gameState.diTile, false).canHu) intercepts.hu.push(p);
    if (RuleChecker.canMingGang(hand, targetTile)) intercepts.gang.push(p);
    if (RuleChecker.canPeng(hand, targetTile)) intercepts.peng.push(p);

    if (i === 1) { 
       let combos = RuleChecker.canChi(hand, targetTile);
       if (combos) {
          intercepts.chi.push(p);
          if (p === 0) actionState.chiCombinations = combos;
       }
    }
  }

  if (intercepts.hu.length > 0) {
    if (intercepts.hu.includes(0)) return promptPlayerAction(sourceIndex, targetTile, { canHu: true });
    else return executeNpcAction(intercepts.hu[0], 'hu', targetTile);
  }
  if (intercepts.gang.length > 0) {
    if (intercepts.gang.includes(0)) return promptPlayerAction(sourceIndex, targetTile, { canGang: true });
    else return executeNpcAction(intercepts.gang[0], 'gang', targetTile);
  }
  if (intercepts.peng.length > 0) {
    if (intercepts.peng.includes(0)) return promptPlayerAction(sourceIndex, targetTile, { canPeng: true });
    else return executeNpcAction(intercepts.peng[0], 'peng', targetTile);
  }
  if (intercepts.chi.length > 0) {
    if (intercepts.chi.includes(0)) return promptPlayerAction(sourceIndex, targetTile, { canChi: true });
    else return executeNpcAction(intercepts.chi[0], 'chi', targetTile);
  }

  nextTurn();
};

const promptPlayerAction = (sourceIndex, targetTile, actions) => {
  actionState.sourceIndex = sourceIndex;
  actionState.targetTile = targetTile;
  actionState.canHu = !!actions.canHu;
  actionState.canGang = !!actions.canGang;
  actionState.canPeng = !!actions.canPeng;
  actionState.canChi = !!actions.canChi;
  actionState.isWaiting = true;
};

const executeNpcAction = (npcIndex, actionType, targetTile) => {
  setTimeout(() => {
    let hand = gameState.npcHands[npcIndex];
    if (actionType === 'hu') {
       const scoreRes = HuCalculator.checkHu([...hand, targetTile], gameState.wangTile, gameState.diTile, false);
       gameState.players[npcIndex].score += scoreRes.score;
       alert(`【${gameState.players[npcIndex].name}】胡牌了！${scoreRes.type}，抓住了 ${targetTile}！得 ${scoreRes.score} 分。`);
       gameState.gamePhase = 'WAITING';
    } else if (actionType === 'gang') {
       for(let i=0; i<3; i++) hand.splice(hand.indexOf(targetTile), 1);
       gameState.discards.pop();
       gameState.exposed[npcIndex].push({ type: 'minggang', tiles: [targetTile, targetTile, targetTile, targetTile] });
       gameState.npcTileCounts[npcIndex] = hand.length;
       gameState.currentPlayerIndex = npcIndex;
       setTimeout(() => npcPlayPhase(npcIndex), 800);
    } else if (actionType === 'peng') {
       for(let i=0; i<2; i++) hand.splice(hand.indexOf(targetTile), 1);
       gameState.discards.pop();
       gameState.exposed[npcIndex].push({ type: 'peng', tiles: [targetTile, targetTile, targetTile] });
       gameState.npcTileCounts[npcIndex] = hand.length;
       gameState.currentPlayerIndex = npcIndex;
       setTimeout(() => npcPlayPhase(npcIndex), 800);
    } else if (actionType === 'chi') {
       let combos = RuleChecker.canChi(hand, targetTile);
       let combo = combos[0];
       combo.forEach(t => hand.splice(hand.indexOf(t), 1));
       gameState.discards.pop();
       gameState.exposed[npcIndex].push({ type: 'chi', tiles: [combo[0], targetTile, combo[1]].sort((a,b)=>a-b) });
       gameState.npcTileCounts[npcIndex] = hand.length;
       gameState.currentPlayerIndex = npcIndex;
       setTimeout(() => npcPlayPhase(npcIndex), 800);
    }
  }, 600); 
};

const handlePeng = () => {
  if (!actionState.canPeng) return;
  const target = actionState.targetTile;
  for(let i=0; i<2; i++) gameState.handTiles.splice(gameState.handTiles.indexOf(target), 1);
  gameState.discards.pop(); 
  gameState.exposed[0].push({ type: 'peng', tiles: [target, target, target] });
  actionState.isWaiting = false;
  gameState.currentPlayerIndex = 0;
};

const handleChi = () => {
  if (!actionState.canChi) return;
  const target = actionState.targetTile;
  const combo = actionState.chiCombinations[0]; 
  combo.forEach(t => gameState.handTiles.splice(gameState.handTiles.indexOf(t), 1));
  gameState.discards.pop();
  gameState.exposed[0].push({ type: 'chi', tiles: [combo[0], target, combo[1]].sort((a,b)=>a-b) });
  actionState.isWaiting = false;
  gameState.currentPlayerIndex = 0;
};

const handleGang = () => {
  if (!actionState.canGang) return;
  let gangTile = null; let type = '';
  if (actionState.isWaiting && actionState.targetTile) {
    gangTile = actionState.targetTile; type = 'minggang';
    for(let i=0; i<3; i++) gameState.handTiles.splice(gameState.handTiles.indexOf(gangTile), 1);
    gameState.discards.pop();
    gameState.exposed[0].push({ type, tiles: [gangTile, gangTile, gangTile, gangTile] });
  } else {
    gangTile = RuleChecker.canAnGang(gameState.handTiles); type = 'angang';
    for(let i=0; i<4; i++) gameState.handTiles.splice(gameState.handTiles.indexOf(gangTile), 1);
    gameState.exposed[0].push({ type, tiles: [gangTile, gangTile, gangTile, gangTile] });
  }
  actionState.isWaiting = false;
  gameState.currentPlayerIndex = 0;
  alert(`触发${type === 'angang' ? '暗杠' : '明杠'}！\n重新掷骰子摸牌。`);
  drawTile(0); 
};

const passAction = () => {
  actionState.isWaiting = false;
  actionState.canChi = actionState.canPeng = actionState.canGang = actionState.canHu = false;
  nextTurn(); 
};

const handleHu = () => {
  if (!actionState.canHu && !(gameState.currentPlayerIndex === 0 && gameState.handTiles.length % 3 === 2)) return;
  
  let handToCheck = [...gameState.handTiles];
  if (actionState.isWaiting && actionState.targetTile) handToCheck.push(actionState.targetTile);

  const isFirst = gameState.deckRemaining >= 54; 
  const result = HuCalculator.checkHu(handToCheck, gameState.wangTile, gameState.diTile, isFirst);
  
  if (result.canHu) {
    gameState.players[0].score += (result.score || 2); 
    alert(`恭喜！胡牌了！\n胡牌类型：${result.type}\n赢得分数：${result.score || 2}分`);
    gameState.gamePhase = 'WAITING'; 
  } else {
    alert("系统判定没胡！");
  }
};

const nextTurn = () => {
  actionState.isWaiting = false;
  actionState.canChi = actionState.canPeng = actionState.canGang = actionState.canHu = false;
  gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % 4;
  setTimeout(() => drawTile(gameState.currentPlayerIndex), 500);
};
</script>

<style scoped>
.app-container {
  display: flex; justify-content: center; align-items: center; width: 100vw; height: 100vh;
  background-color: #000; overflow: hidden; position: fixed; top: 0; left: 0;
}

.mahjong-desk {
  position: relative;
  width: 96vw; max-width: 100%; height: auto; max-height: 96vh;
  aspect-ratio: 2 / 1; 
  background-color: #215c32; overflow: hidden; box-shadow: 0 0 5vw #000; color: white; border: 0.5vw solid #1a472a; border-radius: 1vw; z-index: 10;
}

.portrait-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.95);
  z-index: 2000; display: none; flex-direction: column; justify-content: center; align-items: center; color: white; text-align: center; pointer-events: auto;
}

.portrait-content { display: flex; flex-direction: column; align-items: center; gap: 20px; }
.rotate-icon { font-size: 80px; animation: rotateScreen 2s infinite ease-in-out; }
.portrait-overlay p { font-size: 20px; line-height: 1.6; font-weight: bold; }

@keyframes rotateScreen {
  0% { transform: rotate(0deg); }
  30% { transform: rotate(-90deg); }
  70% { transform: rotate(-90deg); }
  100% { transform: rotate(0deg); }
}

@media (orientation: portrait) {
  .portrait-overlay { display: flex; }
}

.ready-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 999; }
.ready-players { display: flex; gap: 4vw; margin: 3vw 0; }
.ready-player { display: flex; flex-direction: column; align-items: center; position: relative; }
.ready-avatar { width: 6vw; height: 6vw; border-radius: 1vw; border: 0.3vw solid #555; transition: 0.3s; }
.ready-avatar.is-ready { border-color: #4CAF50; box-shadow: 0 0 1.5vw #4CAF50; }
.ready-badge { position: absolute; bottom: 2vw; background: #4CAF50; color: white; padding: 0.2vw 0.8vw; border-radius: 1vw; font-size: 1.2vw; font-weight: bold; }
.btn-ready { padding: 1.2vw 4vw; font-size: 2vw; font-weight: bold; background: linear-gradient(145deg, #ffcc00, #ff9900); border: none; border-radius: 3vw; cursor: pointer; color: white; box-shadow: 0 0.4vw 1.5vw rgba(255,153,0,0.5); transition: 0.2s; }
.btn-ready:active { transform: scale(0.95); }

.walls-container { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 55%; height: 50%; pointer-events: none; z-index: 1;}
.wall { position: absolute; display: flex; }

.wall-top { top: -0.8vw; left: 50%; transform: translateX(-50%); }
.wall-bottom { bottom: -3vw; left: 50%; transform: translateX(-50%); }
.wall-left { top: 45%; left: -1vw; transform: translateY(-50%); flex-direction: column; }
.wall-right { top: 45%; right: -1vw; transform: translateY(-50%); flex-direction: column; }
.wall-stack-wrapper { position: relative; }
.h-stack { width: 2vw; height: 2.8vw; margin: -0.1vw; }
.v-stack { width: 2.8vw; height: 2vw; margin: -0.1vw; }
.stack-bottom { position: absolute; top: 0; left: 0; }
.stack-top { position: absolute; top: -0.8vw; left: 0; z-index: 2; }
.h-bg { width: 2vw; height: 2.8vw; }
.v-bg { width: 2.8vw; height: 2vw; }

.di-face { background: white; border: 1px solid #ccc; border-radius: 2px; box-shadow: 0 0px 0px rgba(0,0,0,0.6); z-index: 5;}
.h-face { top: -0.9vw; left: 0.2vw; width: 1.5vw; height: 2.1vw; }
.v-face { top: -1.2vw; left: 0.6vw; width: 1.5vw; height: 2.3vw; transform: rotate(-90deg); }

.avatar-box { display: flex; flex-direction: column; align-items: center; width: 5vw; z-index: 10; transition: 0.3s; opacity: 0.7;}
.avatar-img { width: 4vw; height: 4vw; border-radius: 0.8vw; border: 0.2vw solid #444; background: #fff; }
.active-glow { opacity: 1; transform: scale(1.1); }
.active-glow .avatar-img { border-color: #ffd700; box-shadow: 0 0 1.2vw #ffd700; }
.name { font-size: 1.2vw; margin-top: 0.2vw; text-shadow: 1px 1px 2px #000; }
.score { font-size: 1.4vw; font-weight: bold; margin-top: 0.2vw; text-shadow: 1px 1px 2px #000;}
.score-up { color: #4CAF50; }
.score-down { color: #F44336; }

.cards-container-top { display: flex; flex-direction: column; align-items: center; gap: 0.8vw; }
.cards-container-side { display: flex; flex-direction: row; align-items: center; gap: 1.5vw; }

.player-top { position: absolute; top: 2%; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 1.5vw; }
.player-left { position: absolute; left: 2%; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; align-items: center; gap: 1vw; }
.player-right { position: absolute; right: 2%; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; align-items: center; gap: 1vw; }

.hand-tiles-right, .hand-tiles-left { display: flex; flex-direction: column; gap: -0.5vw; }
.tile-back-side { width: 1.8vw; height: 2.8vw; margin-top: -1vw; } 
.tile-back-top { width: 2.4vw; height: 3.4vw; margin-left: 0vw; }

.npc-exposed { display: flex; gap: 1px; } 
.left-exposed, .right-exposed { flex-direction: column; }

.rotator-top { position: relative; width: 2vw; height: 2.8vw; }
.rotator-top .center-tile-bg { width: 100%; height: 100%; position: absolute; top:0; left:0; }
.rotator-top .center-tile-face { position: absolute; top: 0.1vw; left: 50%; transform: translateX(-50%); width: 1.5vw; height: 2.1vw; z-index: 2; }

.npc-exposed-wrapper-side { width: 2.8vw; height: 1.8vw; position: relative; display: flex; justify-content: center; align-items: center; }
.rotator { width: 1.8vw; height: 2.8vw; position: relative; } 
.rotator-left { transform: rotate(-90deg); } 
.rotator-right { transform: rotate(90deg); }  
.rotator .center-tile-bg { width: 100%; height: 100%; position: absolute; top:0; left:0; }
.rotator .center-tile-face { position: absolute; top: 0.1vw; left: 50%; transform: translateX(-50%); width: 1.4vw; height: 2.1vw; z-index: 2; }


.player-bottom { position: absolute; bottom: 2%; left: 50%; transform: translateX(-50%); display: flex; align-items: flex-end; gap: 1.5vw; z-index: 20; }
.hand-tiles-bottom { display: flex; align-items: flex-end; height: 7.5vw; }

.exposed-area { display: flex; gap: 0.8vw; margin-right: 1.5vw; }
.exposed-group { display: flex; gap: 2px; border-radius: 5px; }
.exposed-tile { width: 3vw; height: 4.2vw; }

.hand-tile-wrapper { position: relative; width: 3.8vw; height: 5.6vw; cursor: pointer; transition: 0.2s; margin-left: 0.1vw; }
.hand-tile-wrapper:first-child { margin-left: 0; }
.hand-tile-wrapper.selected { transform: translateY(-1.5vw); }
.new-drawn-tile { margin-left: 1.2vw !important; }

.tile-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; }
.tile-face { position: absolute; top: 1vw; left: 50%; transform: translateX(-50%); width: 3vw; height: 4vw; z-index: 2; }

.action-buttons {
  position: absolute;
  bottom: 12vw; 
  right: 5%;
  display: flex;
  gap: 0.5vw;
  z-index: 100;
}
.action-btn { width: 5vw; height: 5vw; border-radius: 50%; background: #555; border: 0.2vw solid #333; color: #aaa; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 1.8vw; transition: 0.3s; }
.action-btn.active { background: linear-gradient(145deg, #ffcc00, #ff9900); border-color: #fff; color: #fff; cursor: pointer; box-shadow: 0 0.4vw 1vw rgba(255,215,0,0.5); }
.action-btn.active:active { transform: scale(0.9); }
.action-btn.pass.active { background: linear-gradient(145deg, #66bb6a, #43a047); } 

.center-area {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 25vw;
  height: 20vw;
  z-index: 2;
}
.dice-circle { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 6vw; height: 6vw; border: 0.2vw solid rgba(255, 215, 0, 0.6); border-radius: 50%; display: flex; justify-content: center; align-items: center; gap: 0.4vw; background: rgba(0,0,0,0.4); z-index: 1; }
.dice { width: 1.8vw; height: 1.8vw; }

.discard-pool {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 5;
  display: grid;
  grid-template-columns: repeat(8, 1fr); 
  grid-template-rows: repeat(5, 1fr); 
  gap: 0.2vw;
}
.center-tile-wrapper { position: relative; width: 100%; height: 100%; }
.center-tile-bg { position: absolute; width: 100%; height: 100%; }
.center-tile-face { position: absolute; top: 0.1vw; left: 50%; transform: translateX(-50%); width: 80%; height: 80%; z-index: 2;}
</style>