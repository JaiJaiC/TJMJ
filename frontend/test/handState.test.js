import test from 'node:test';
import assert from 'node:assert/strict';

import {
  mergeHandTilesPreservingOrder,
  needsDiscardedWinningTile,
} from '../src/utils/handState.js';

test('keeps the local drag order when the server multiset is unchanged', () => {
  assert.deepEqual(
    mergeHandTilesPreservingOrder([13, 11, 12, 12], [11, 12, 12, 13]),
    [13, 11, 12, 12],
  );
});

test('adds and removes only the required number of duplicate tiles', () => {
  assert.deepEqual(
    mergeHandTilesPreservingOrder([11, 12], [11, 11, 12]),
    [11, 12, 11],
  );
  assert.deepEqual(
    mergeHandTilesPreservingOrder([11, 11, 12], [11, 12]),
    [11, 12],
  );
});

test('applies simultaneous additions and removals without reordering retained tiles', () => {
  assert.deepEqual(
    mergeHandTilesPreservingOrder([13, 11, 12, 12], [11, 12, 12, 14]),
    [11, 12, 12, 14],
  );
});

test('recognizes a discarded winning tile even when the hand already has that value', () => {
  assert.equal(needsDiscardedWinningTile(Array(13).fill(11), 11), true);
  assert.equal(needsDiscardedWinningTile(Array(14).fill(11), 11), false);
  assert.equal(needsDiscardedWinningTile(Array(13).fill(11), null), false);
});
