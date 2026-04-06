// src/utils/mjLogic.js

// 洗牌算法：Fisher-Yates Shuffle
export const shuffle = (tiles) => {
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  return tiles;
};

// 初始化桃江麻将牌堆 (108张：万筒条，不含风牌)
// 假设：11-19万, 21-29条, 31-39筒
export const initTiles = () => {
  let tiles = [];
  [10, 20, 30].forEach(type => {
    for (let i = 1; i <= 9; i++) {
      for (let j = 0; j < 4; j++) {
        tiles.push(type + i);
      }
    }
  });
  return shuffle(tiles);
};