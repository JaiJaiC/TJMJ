// frontend/src/core/constants.js

// 定义牌的花色范围
export const TILE_TYPES = {
  WAN: 1, // 万 (11-19)
  TIAO: 2, // 条 (21-29)
  TONG: 3  // 筒 (31-39)
};

// 判断一张牌是不是 2, 5, 8
export const is258 = (tileValue) => {
  const value = tileValue % 10;
  return value === 2 || value === 5 || value === 8;
};

// 根据“地”牌计算“王（癞子）”
export const calculateWang = (diTile) => {
  const type = Math.floor(diTile / 10);
  const value = diTile % 10;
  // 如果扳出来的是 9，癞子循环回 1
  if (value === 9) {
    return type * 10 + 1;
  }
  return diTile + 1;
};