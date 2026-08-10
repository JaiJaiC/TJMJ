// frontend/src/ai/NpcStrategy.js
// NPC AI 出牌与决策策略

import { HuCalculator } from '../core/HuCalculator.js';
import { is258 } from '../core/constants.js';

export class NpcStrategy {
  /**
   * @param {Array} handTiles - NPC当前手牌
   * @param {Number} wangTile - 王牌(癞子)
   * @param {Array} exposed - NPC的副露(吃碰杠)
   * @param {Array} discards - 弃牌池
   * @param {Number} deckRemaining - 剩余牌数
   */
  constructor(handTiles, wangTile, exposed = [], discards = [], deckRemaining = 108) {
    this.hand = [...handTiles];
    this.wangTile = wangTile;
    this.exposed = exposed;
    this.discards = discards;
    this.deckRemaining = deckRemaining;
  }

  /**
   * 选择要打出的牌
   * @returns {Number} 要打出的牌值
   */
  chooseDiscard() {
    const hand = this.hand;
    if (hand.length === 0) return null;

    // 1. 检查是否已听牌（每张牌都试去掉，看剩下的是否听牌）
    const tingResult = this.findBestDiscardToTing();
    if (tingResult !== null) {
      // 已听牌或差一张听牌，打出最不影响听牌的牌
      return tingResult;
    }

    // 2. 未听牌，按优先级选择要打的牌
    return this.chooseWorstTile();
  }

  /**
   * 找出去掉后最接近听牌的牌
   */
  findBestDiscardToTing() {
    const hand = this.hand;
    // 如果手牌数不是 3n+2，无法判断（正常是14/11/8/5/2张时，打一张变13/10/7/4/1）
    if (hand.length % 3 !== 2) return null;

    // 先检查是否有听牌选项
    let tingCandidates = [];
    for (let i = 0; i < hand.length; i++) {
      const remaining = [...hand];
      remaining.splice(i, 1);
      // 检查去掉第i张后是否听牌
      if (this.isHandTing(remaining)) {
        tingCandidates.push(hand[i]);
      }
    }

    if (tingCandidates.length > 0) {
      // 已听牌：优先打孤张（避免破坏听牌结构）
      // 选分值最低的（最不重要的）
      return this.pickWorst(tingCandidates);
    }

    return null; // 未听牌，返回 null 让 chooseWorstTile 处理
  }

  /**
   * 检查给定的手牌是否听牌
   */
  isHandTing(hand) {
    if (hand.length % 3 !== 1) return false;

    const suits = [1, 2, 3];
    for (let suit of suits) {
      for (let num = 1; num <= 9; num++) {
        const testHand = [...hand, suit * 10 + num];
        if (HuCalculator.checkHu(testHand, this.wangTile, null, false).canHu) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * 吃碰后需要先打出一张牌，再判断剩余手牌是否听牌。
   */
  canTingAfterDiscard(hand) {
    if (hand.length % 3 !== 2) return false;

    const checkedTiles = new Set();
    for (let i = 0; i < hand.length; i++) {
      if (checkedTiles.has(hand[i])) continue;
      checkedTiles.add(hand[i]);

      const remaining = [...hand];
      remaining.splice(i, 1);
      if (this.isHandTing(remaining)) return true;
    }
    return false;
  }

  /**
   * 未听牌时，选择最差的牌打出
   */
  chooseWorstTile() {
    const hand = this.hand;
    // 给每张牌打分（越低越该打）
    const scores = hand.map((tile, index) => {
      return { tile, index, score: this.evaluateTile(tile, hand) };
    });

    // 按分数升序排列（最低分最先打）
    scores.sort((a, b) => a.score - b.score);
    return scores[0].tile;
  }

  /**
   * 评估一张牌的重要性（分数越高越重要，越不能打）
   */
  evaluateTile(tile, hand) {
    let score = 0;

    // 王牌(癞子)价值最高
    if (tile === this.wangTile) return 100;

    const digit = tile % 10;
    const suit = Math.floor(tile / 10);
    const count = hand.filter(t => t === tile).length;

    // 258可以作将，价值高
    if (is258(tile)) score += 15;

    // 对子：有2张相同，可能碰
    if (count >= 2) score += 20;
    // 三张：接近杠/刻子
    if (count >= 3) score += 30;

    // 搭子（有相邻牌）：价值较高
    const hasMinus1 = hand.some(t => t === tile - 1 && Math.floor(t / 10) === suit);
    const hasMinus2 = hand.some(t => t === tile - 2 && Math.floor(t / 10) === suit);
    const hasPlus1 = hand.some(t => t === tile + 1 && Math.floor(t / 10) === suit);
    const hasPlus2 = hand.some(t => t === tile + 2 && Math.floor(t / 10) === suit);

    if (hasMinus1 && hasPlus1) score += 25; // 中间牌（如4在3和5之间）
    if (hasMinus1 || hasPlus1) score += 15; // 有相邻牌
    if (hasMinus2 && hasMinus1) score += 15; // 边搭（如12等3）
    if (hasPlus1 && hasPlus2) score += 15;

    // 边张(1/9)价值稍低，中张(3-7)价值稍高
    if (digit >= 3 && digit <= 7) score += 5;

    // 孤张（无相邻、无双张、非258）几乎0分
    if (count === 1 && !is258(tile) && !hasMinus1 && !hasPlus1 && !hasMinus2 && !hasPlus2) {
      score += 1;
    }

    return score;
  }

  /**
   * 从候选中挑出最不重要的
   */
  pickWorst(candidates) {
    const hand = this.hand;
    let worst = candidates[0];
    let worstScore = Infinity;
    for (let tile of candidates) {
      const s = this.evaluateTile(tile, hand);
      if (s < worstScore) {
        worstScore = s;
        worst = tile;
      }
    }
    return worst;
  }

  /**
   * 决策：从多个吃法中选择最优的
   * @param {Array} combinations - 可选吃法组合
   * @param {Number} targetTile - 上家打出的牌
   * @returns {Array|null} 选中的组合，或 null 表示不chi
   */
  shouldChi(combinations, targetTile) {
    if (!combinations || combinations.length === 0) return null;

    // 评估每个吃法：模拟吃牌后检查是否听牌或接近听牌
    let bestCombo = null;
    let bestScore = -1;

    for (let combo of combinations) {
      const simulatedHand = [...this.hand];
      // 从手牌中移除combo中的两张牌
      for (let t of combo) {
        const idx = simulatedHand.indexOf(t);
        if (idx !== -1) simulatedHand.splice(idx, 1);
      }
      // chi后手牌减少2张（因为combo是手里的2张），加上副露

      // 吃牌后仍需出一张；优先选择出牌后能立即听牌的组合。
      if (this.canTingAfterDiscard(simulatedHand)) {
        return combo; // 吃后听牌，直接选
      }

      // 算分：接近听牌的程度（手牌越少越好）
      const score = 30 - simulatedHand.length; // 牌越少越接近
      if (score > bestScore) {
        bestScore = score;
        bestCombo = combo;
      }
    }

    return bestCombo || combinations[0]; // 默认选第一个
  }

  /**
   * 决策：是否碰牌
   */
  shouldPeng(targetTile) {
    // 模拟碰牌后的手牌
    const simulatedHand = [...this.hand];
    for (let i = 0; i < 2; i++) {
      const idx = simulatedHand.indexOf(targetTile);
      if (idx !== -1) simulatedHand.splice(idx, 1);
    }

    // 碰牌后仍需出一张；若出牌后能听则一定碰。
    if (this.canTingAfterDiscard(simulatedHand)) return true;

    // 碰后手牌接近听牌（≤4张） → 碰
    if (simulatedHand.length <= 4) return true;

    // 否则不碰（保持手牌灵活性）
    return simulatedHand.length <= 7;
  }

  /**
   * 决策：是否杠牌（仅在被询问明杠时）
   * 注意：此时 canMingGang 已经通过了听牌检查，所以直接返回 true
   */
  shouldGang(targetTile) {
    return true;
  }
}
