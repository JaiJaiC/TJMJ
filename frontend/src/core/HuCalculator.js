import { is258 } from './constants.js';

export class HuCalculator {
  /**
   * 核心胡牌与计分引擎
   * @param {Array} handTiles 手牌
   * @param {Number} wangTile 王牌(癞子)
   * @param {Number} diTile 地牌(用于判断地胡)
   * @param {Boolean} isFirstTurn 是否是开局第一轮(用于判断黑天胡/起手胡)
   * @returns {{ canHu: boolean, type: string, score: number, hasWang: boolean, canCatchCannon: boolean, canDrag: boolean }}
   */
  static checkHu(handTiles, wangTile, diTile = null, isFirstTurn = false) {
    let normalTiles = [];
    let wangCount = 0;
    let diCount = 0;

    handTiles.forEach(tile => {
      if (tile === wangTile) wangCount++;
      else {
         normalTiles.push(tile);
         if (tile === diTile) diCount++;
      }
    });
    normalTiles.sort((a, b) => a - b);

    const hasWang = wangCount > 0;
    // 基础规则：普通平胡有王不能抓炮；部分门子胡法按规则允许“有王抓炮”。
    const baseFields = { hasWang, canCatchCannon: !hasWang, canDrag: false };
    const canCatchWithWangTypes = new Set(["碰碰胡", "清一色", "七小对", "将将胡"]);
    const makeHu = (type, score, extra = {}) => ({
      canHu: true,
      type,
      score,
      ...baseFields,
      canCatchCannon: !hasWang || canCatchWithWangTypes.has(type),
      ...extra,
    });

    // 吃碰后的手牌也可能少于 14 张，但胡牌手牌始终应为 3n+2。
    if (handTiles.length % 3 !== 2) {
      return { canHu: false, type: "", score: 0, ...baseFields };
    }

    // 1. 拦截黑天胡 (首轮、14张、无王、无258、无一句话)
    if (isFirstTurn && handTiles.length === 14 && wangCount === 0) {
       let hasJiang = handTiles.some(t => is258(t));
       let hasSentence = this.hasAnySentence(handTiles);
       if (!hasJiang && !hasSentence) {
          return makeHu("黑天胡", 6);
       }
    }

    let isHu = false;
    let isPengPeng = false;

    // 2. 检查常规胡牌 (258作将 + 4句话)
    let normalHuRes = this.checkNormalHu(normalTiles, wangCount);
    if (normalHuRes.canHu) {
        isHu = true;
        isPengPeng = normalHuRes.isPengPeng;
    }

    // 3. 检查七小对 (特殊门子)
    let is7Pairs = false;
    if (handTiles.length === 14) {
        is7Pairs = this.check7Pairs(normalTiles, wangCount);
        if (is7Pairs) isHu = true;
    }

    if (!isHu) return { canHu: false, type: "", score: 0, ...baseFields };

    // --- 4. 算分与加番规则 ---
    let isJiangJiang = handTiles.every(t => t === wangTile || is258(t));
    let isQingYiSe = new Set(normalTiles.map(t => Math.floor(t / 10))).size === 1;

    // 顶级胡法优先判定
    if (wangCount === 4) return makeHu("天天胡", 15);
    if (wangCount === 3) return makeHu("天胡", 9);
    if (diCount === 3) return makeHu("地胡", 6, { canDrag: true });

    // 门子胡法判定
    if (isJiangJiang) return makeHu("将将胡", 6);
    if (isQingYiSe) return makeHu("清一色", 6);
    if (is7Pairs) return makeHu("七小对", 6);
    if (isPengPeng) return makeHu("碰碰胡", 6);

    // 基础胡法判定
    if (!hasWang) return makeHu("硬庄", 6);
    return makeHu("平胡", 3);
  }

  // 常规胡法检测
  static checkNormalHu(normalTiles, wangCount) {
    let normalHuResult = null;

    for (let i = 0; i < normalTiles.length; i++) {
      let tile = normalTiles[i];
      if (is258(tile)) { // 必须 258 作将
        // 真将牌
        if (i < normalTiles.length - 1 && normalTiles[i + 1] === tile) {
          let temp = [...normalTiles];
          temp.splice(i, 2);
          let res = this.checkSentences(temp, wangCount);
          if (res.canHu) {
            if (res.isPengPeng) return res;
            normalHuResult ??= res;
          }
        }
        // 用王凑将
        if (wangCount >= 1) {
          let temp = [...normalTiles];
          temp.splice(i, 1);
          let res = this.checkSentences(temp, wangCount - 1);
          if (res.canHu) {
            if (res.isPengPeng) return res;
            normalHuResult ??= res;
          }
        }
      }
    }
    // 全靠王凑将
    if (wangCount >= 2) {
       let res = this.checkSentences([...normalTiles], wangCount - 2);
       if (res.canHu) {
         if (res.isPengPeng) return res;
         normalHuResult ??= res;
       }
    }
    return normalHuResult ?? { canHu: false };
  }

  // 递归检查是否能全凑成顺子或刻子
  static checkSentences(tiles, wangCount, isPengPeng = true) {
    if (tiles.length === 0) {
      return { canHu: wangCount % 3 === 0, isPengPeng };
    }
    let firstTile = tiles[0];
    let count = tiles.filter(t => t === firstTile).length;

    // 试着凑刻子 (AAA)
    if (count >= 3) {
      let newTiles = tiles.slice();
      newTiles.splice(0, 3);
      let res = this.checkSentences(newTiles, wangCount, isPengPeng);
      if (res.canHu) return res;
    } else if (count === 2 && wangCount >= 1) {
      let newTiles = tiles.slice();
      newTiles.splice(0, 2);
      let res = this.checkSentences(newTiles, wangCount - 1, isPengPeng);
      if (res.canHu) return res;
    } else if (count === 1 && wangCount >= 2) {
      let newTiles = tiles.slice();
      newTiles.splice(0, 1);
      let res = this.checkSentences(newTiles, wangCount - 2, isPengPeng);
      if (res.canHu) return res;
    }

    // 最小实牌通常是顺子起点；8、9 则需要让王补在它前面。
    // 将顺子窗口限制在同一花色的 1-9，避免把 19、21 等跨花色牌拼在一起。
    const value = firstTile % 10;
    if (value >= 1 && value <= 9) {
      const sequenceStart = firstTile - Math.max(0, value - 7);
      const companions = [sequenceStart, sequenceStart + 1, sequenceStart + 2]
        .filter(tile => tile !== firstTile);
      const newTiles = tiles.slice();
      newTiles.splice(0, 1);

      let missingCount = 0;
      for (const tile of companions) {
        const index = newTiles.indexOf(tile);
        if (index === -1) missingCount++;
        else newTiles.splice(index, 1);
      }

      if (missingCount <= wangCount) {
        const res = this.checkSentences(newTiles, wangCount - missingCount, false);
        if (res.canHu) return res;
      }
    }

    return { canHu: false };
  }

  // 检查七小对
  static check7Pairs(normalTiles, wangCount) {
    let pairs = 0, i = 0;
    while (i < normalTiles.length) {
       if (i + 1 < normalTiles.length && normalTiles[i] === normalTiles[i+1]) {
          pairs++; i += 2;
       } else { i += 1; }
    }
    return (normalTiles.length - (pairs * 2)) <= wangCount;
  }

  // 简易检查手牌中是否含有一句话 (用于黑天胡排他判定)
  static hasAnySentence(tiles) {
     let unique = [...new Set(tiles)];
     for (let t of unique) {
        if (tiles.filter(x => x === t).length >= 3) return true;
        if (t % 10 <= 7 && tiles.includes(t+1) && tiles.includes(t+2)) return true;
     }
     return false;
  }

  /**
   * 起手检测：庄家起手胡 / 闲家起手报听
   * @param {Array} handTiles 手牌
   * @param {Number} wangTile 王牌
   * @param {Boolean} isDealer 是否庄家
   * @returns {{ canFirstTurnHu: boolean, canFirstTurnTing: boolean, type: string, score: number }}
   */
  static checkFirstTurn(handTiles, wangTile, isDealer) {
    if (isDealer && handTiles.length === 14) {
      // 庄家：检查14张能否直接胡
      const result = this.checkHu(handTiles, wangTile, null, true);
      if (result.canHu) {
        return { canFirstTurnHu: true, canFirstTurnTing: false, type: "起手胡", score: 6 };
      }
    }
    if (!isDealer && handTiles.length === 13) {
      // 闲家：检查13张是否听牌（差一张胡）
      // 枚举每张可能摸到的牌
      const suits = [1, 2, 3];
      for (let suit of suits) {
        for (let num = 1; num <= 9; num++) {
          const testHand = [...handTiles, suit * 10 + num];
          const result = this.checkHu(testHand, wangTile, null, false);
          if (result.canHu) {
            return { canFirstTurnHu: false, canFirstTurnTing: true, type: "起手报听", score: 6 };
          }
        }
      }
    }
    return { canFirstTurnHu: false, canFirstTurnTing: false, type: "", score: 0 };
  }
}
