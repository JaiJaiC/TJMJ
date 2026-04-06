import { is258 } from './constants.js';

export class HuCalculator {
  /**
   * 核心胡牌与计分引擎
   * @param {Array} handTiles 手牌
   * @param {Number} wangTile 王牌(癞子)
   * @param {Number} diTile 地牌(用于判断地胡)
   * @param {Boolean} isFirstTurn 是否是开局第一轮(用于判断黑天胡/起手胡)
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

    // 1. 拦截黑天胡 (首轮、14张、无王、无258、无一句话)
    if (isFirstTurn && handTiles.length === 14 && wangCount === 0) {
       let hasJiang = handTiles.some(t => is258(t));
       let hasSentence = this.hasAnySentence(handTiles);
       if (!hasJiang && !hasSentence) {
          return { canHu: true, type: "黑天胡", score: 6 };
       }
    }

    let isHu = false;
    let isPengPeng = false;

    // 2. 检查常规胡牌 (258作将 + 4句话)
    let normalHuRes = this.checkNormalHu(normalTiles, wangCount);
    if (normalHuRes.canHu) {
        isHu = true;
        isPengPeng = normalHuRes.isPengPeng; // 顺便查出是不是碰碰胡
    }

    // 3. 检查七小对 (特殊门子)
    let is7Pairs = false;
    if (handTiles.length === 14) {
        is7Pairs = this.check7Pairs(normalTiles, wangCount);
        if (is7Pairs) isHu = true;
    }

    if (!isHu) return { canHu: false, type: "", score: 0 };

    // --- 4. 算分与加番规则 ---
    let isJiangJiang = handTiles.every(t => t === wangTile || is258(t));
    let isQingYiSe = new Set(normalTiles.map(t => Math.floor(t / 10))).size === 1;

    // 顶级胡法优先判定
    if (wangCount === 4) return { canHu: true, type: "天天胡", score: 15 };
    if (wangCount === 3) return { canHu: true, type: "天胡", score: 9 };
    if (diCount === 3) return { canHu: true, type: "地胡", score: 6 }; // 地胡带拖后续在具体游戏流转中加分

    // 门子胡法判定
    if (isJiangJiang) return { canHu: true, type: "将将胡", score: 6 };
    if (isQingYiSe) return { canHu: true, type: "清一色", score: 6 };
    if (is7Pairs) return { canHu: true, type: "七小对", score: 6 };
    if (isPengPeng) return { canHu: true, type: "碰碰胡", score: 6 };

    // 基础胡法判定
    if (wangCount === 0) return { canHu: true, type: "硬庄", score: 6 };
    return { canHu: true, type: "平胡", score: 3 };
  }

  // 常规胡法检测
  static checkNormalHu(normalTiles, wangCount) {
    for (let i = 0; i < normalTiles.length; i++) {
      let tile = normalTiles[i];
      if (is258(tile)) { // 必须 258 作将
        // 真将牌
        if (i < normalTiles.length - 1 && normalTiles[i + 1] === tile) {
          let temp = [...normalTiles];
          temp.splice(i, 2);
          let res = this.checkSentences(temp, wangCount);
          if (res.canHu) return res;
        }
        // 用王凑将
        if (wangCount >= 1) {
          let temp = [...normalTiles];
          temp.splice(i, 1);
          let res = this.checkSentences(temp, wangCount - 1);
          if (res.canHu) return res;
        }
      }
    }
    // 全靠王凑将
    if (wangCount >= 2) {
       let res = this.checkSentences([...normalTiles], wangCount - 2);
       if (res.canHu) return res;
    }
    return { canHu: false };
  }

  // 递归检查是否能全凑成顺子或刻子
  static checkSentences(tiles, wangCount, isPengPeng = true) {
    if (tiles.length === 0) return { canHu: true, isPengPeng };
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

    // 试着凑顺子 (ABC) -> 此时就不是碰碰胡了
    let idx2 = tiles.indexOf(firstTile + 1);
    let idx3 = tiles.indexOf(firstTile + 2);
    if (idx2 !== -1 && idx3 !== -1) {
      let newTiles = tiles.slice();
      newTiles.splice(idx3, 1); newTiles.splice(idx2, 1); newTiles.splice(0, 1);
      let res = this.checkSentences(newTiles, wangCount, false);
      if (res.canHu) return res;
    } else if ((idx2 !== -1 || idx3 !== -1) && wangCount >= 1) {
      let newTiles = tiles.slice();
      if (idx2 !== -1) newTiles.splice(idx2, 1); else newTiles.splice(idx3, 1);
      newTiles.splice(0, 1);
      let res = this.checkSentences(newTiles, wangCount - 1, false);
      if (res.canHu) return res;
    } else if (wangCount >= 2) {
      let newTiles = tiles.slice();
      newTiles.splice(0, 1);
      let res = this.checkSentences(newTiles, wangCount - 2, false);
      if (res.canHu) return res;
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
        if (tiles.includes(t+1) && tiles.includes(t+2)) return true;
     }
     return false;
  }
}