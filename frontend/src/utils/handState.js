export const mergeHandTilesPreservingOrder = (currentTiles, serverTiles) => {
  if (!Array.isArray(serverTiles)) return [];

  const remaining = new Map();
  for (const tile of serverTiles) {
    remaining.set(tile, (remaining.get(tile) || 0) + 1);
  }

  const merged = [];
  for (const tile of currentTiles || []) {
    const count = remaining.get(tile) || 0;
    if (count === 0) continue;
    merged.push(tile);
    remaining.set(tile, count - 1);
  }

  for (const tile of serverTiles) {
    const count = remaining.get(tile) || 0;
    if (count === 0) continue;
    merged.push(tile);
    remaining.set(tile, count - 1);
  }

  return merged;
};

export const needsDiscardedWinningTile = (concealedHand, winningTile) => (
  winningTile != null && Array.isArray(concealedHand) && concealedHand.length % 3 === 1
);
