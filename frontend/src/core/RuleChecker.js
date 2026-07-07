// frontend/src/core/RuleChecker.js

import { HuCalculator } from './HuCalculator.js';

export class RuleChecker {

  /**
   * 判断能否【碰】
   * 规则：手里有 >= 2 张与打出牌完全相同的牌
   */
  static canPeng(handTiles, targetTile) {
    const count = handTiles.filter(t => t === targetTile).length;
    return count >= 2;
  }

  /**
   * 判断能否【明杠】（别人打出一张，你手里有三张）
   * 新增规则：杠掉后必须听牌
   * @param {Array} handTiles 手牌数组
   * @param {Number} targetTile 别人打出的牌
   * @param {Number} wangTile 王牌(癞子)
   * @returns {Boolean}
   */
  static canMingGang(handTiles, targetTile, wangTile) {
    const count = handTiles.filter(t => t === targetTile).length;
    if (count < 3) return false;

    // 模拟: 从手牌中移除3张 targetTile，检查剩余牌是否听牌
    const remaining = [...handTiles];
    for (let i = 0; i < 3; i++) {
      remaining.splice(remaining.indexOf(targetTile), 1);
    }

    // 杠后手牌数应为 3n+1 形式（差一张成胡）
    if (remaining.length % 3 !== 1) return false;

    return RuleChecker.isTing(remaining, wangTile);
  }

  /**
   * 判断能否【暗杠】（你自己摸到四张）
   * 新增规则：杠掉后必须听牌
   * @param {Array} handTiles 手牌数组
   * @param {Number} wangTile 王牌(癞子)
   * @returns {Array} 返回所有可以暗杠的牌值列表
   */
  static canAnGang(handTiles, wangTile) {
    const counts = {};
    for (let tile of handTiles) {
      counts[tile] = (counts[tile] || 0) + 1;
    }

    const gangTiles = [];
    for (let [tile, count] of Object.entries(counts)) {
      if (count >= 4) {
        const tileVal = parseInt(tile);
        // 模拟: 从手牌中移除4张该牌，检查剩余牌是否听牌
        const remaining = [...handTiles];
        for (let i = 0; i < 4; i++) {
          remaining.splice(remaining.indexOf(tileVal), 1);
        }

        // 杠后手牌数应为 3n+1 形式
        if (remaining.length % 3 === 1 && RuleChecker.isTing(remaining, wangTile)) {
          gangTiles.push(tileVal);
        }
      }
    }
    return gangTiles;
  }

  /**
   * 判断当前手牌是否【听牌】（差任意一张牌就能胡）
   *
   * 原理：枚举所有可能摸到的牌（34种），如果任意一种能使手牌胡，则听牌
   * 效率优化：只枚举手牌中已有花色 ±2 范围内的牌
   *
   * @param {Array} handTiles 手牌（3n+1 张）
   * @param {Number} wangTile 王牌(癞子)
   * @returns {Boolean}
   */
  static isTing(handTiles, wangTile) {
    if (handTiles.length % 3 !== 1) return false;

    // 收集已有花色
    const suitSet = new Set(handTiles.map(t => Math.floor(t / 10)));
    // 也加入王牌的花色
    if (wangTile) suitSet.add(Math.floor(wangTile / 10));

    // 枚举所有可能的牌
    const candidates = [];
    for (let suit of suitSet) {
      for (let num = 1; num <= 9; num++) {
        candidates.push(suit * 10 + num);
      }
    }
    // 也加入其他花色的258（可能作将）
    for (let suit = 1; suit <= 3; suit++) {
      if (!suitSet.has(suit)) {
        for (let num of [2, 5, 8]) {
          candidates.push(suit * 10 + num);
        }
      }
    }

    for (let tile of candidates) {
      const testHand = [...handTiles, tile];
      const result = HuCalculator.checkHu(testHand, wangTile, null, false);
      if (result.canHu) return true;
    }

    return false;
  }

  /**
   * 判断能否【吃】（只能吃上家打出的牌）
   * 规则：手里的两张牌和打出的牌能凑成顺子 (不能用王代替，必须是真牌)
   * @returns {Array|false} 返回所有能吃的组合 [ [...2cards], ... ]
   */
  static canChi(handTiles, targetTile, wangTile = null) {
    // 吃必须是同一花色的真实顺子；王不能作为吃牌替代，也不能吃别人打出的王。
    if (!targetTile || targetTile === wangTile) return false;
    const suit = Math.floor(targetTile / 10);
    const isValidSameSuit = (tile) => (
      tile !== wangTile &&
      Math.floor(tile / 10) === suit &&
      tile % 10 >= 1 && tile % 10 <= 9
    );

    // 提取手牌中所有的唯一牌值（去重，方便判断）
    const uniqueTiles = [...new Set(handTiles.filter(isValidSameSuit))];
    const has = (tile) => isValidSameSuit(tile) && uniqueTiles.includes(tile);

    let combinations = [];

    // 组合1: 目标牌是最大的 (比如打出 3，你手里有 1 和 2)
    if (has(targetTile - 2) && has(targetTile - 1)) {
      combinations.push([targetTile - 2, targetTile - 1]);
    }
    // 组合2: 目标牌在中间 (比如打出 3，你手里有 2 和 4)
    if (has(targetTile - 1) && has(targetTile + 1)) {
      combinations.push([targetTile - 1, targetTile + 1]);
    }
    // 组合3: 目标牌是最小的 (比如打出 3，你手里有 4 和 5)
    if (has(targetTile + 1) && has(targetTile + 2)) {
      combinations.push([targetTile + 1, targetTile + 2]);
    }

    return combinations.length > 0 ? combinations : false;
  }
}
