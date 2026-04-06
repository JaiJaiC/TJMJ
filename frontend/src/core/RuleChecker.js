// frontend/src/core/RuleChecker.js

export class RuleChecker {
  
  /**
   * 判断能否【碰】
   * 规则：手里有 >= 2 张与打出牌完全相同的牌
   * @param {Array} handTiles 手牌数组
   * @param {Number} targetTile 别人打出的牌
   */
  static canPeng(handTiles, targetTile) {
    const count = handTiles.filter(t => t === targetTile).length;
    return count >= 2;
  }

  /**
   * 判断能否【明杠】（别人打出一张，你手里有三张）
   */
  static canMingGang(handTiles, targetTile) {
    const count = handTiles.filter(t => t === targetTile).length;
    return count === 3;
  }

  /**
   * 判断能否【暗杠】（你自己摸到四张）
   * @returns {Number|null} 如果能暗杠，返回那张牌的值，否则返回 null
   */
  static canAnGang(handTiles) {
    const counts = {};
    for (let tile of handTiles) {
      counts[tile] = (counts[tile] || 0) + 1;
      if (counts[tile] === 4) return tile; 
    }
    return null;
  }

  /**
   * 判断能否【吃】（只能吃上家打出的牌）
   * 规则：手里的两张牌和打出的牌能凑成顺子 (不能用王代替，必须是真牌)
   * @returns {Array} 返回所有能吃的组合，例如：[[21, 22], [22, 24]]
   */
  static canChi(handTiles, targetTile) {
    // 提取手牌中所有的唯一牌值（去重，方便判断）
    const uniqueTiles = [...new Set(handTiles)];
    const has = (tile) => uniqueTiles.includes(tile);
    
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