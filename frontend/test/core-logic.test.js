import test from 'node:test';
import assert from 'node:assert/strict';

import { NpcStrategy } from '../src/ai/NpcStrategy.js';
import { HuCalculator } from '../src/core/HuCalculator.js';

test('uses wang before high tiles without crossing a suit boundary', () => {
  const oneWang = HuCalculator.checkHu([14, 28, 29, 38, 38], 14);
  assert.equal(oneWang.canHu, true);

  const twoWang = HuCalculator.checkHu([14, 14, 19, 38, 38], 14);
  assert.equal(twoWang.canHu, true);

  const crossSuit = HuCalculator.checkHu([14, 19, 21, 38, 38], 14);
  assert.equal(crossSuit.canHu, false);
});

test('rejects a hand whose tile count cannot form a pair plus sentences', () => {
  assert.equal(HuCalculator.checkHu([14, 22, 22], 14).canHu, false);
  assert.equal(HuCalculator.checkHu([22, 22], 14).canHu, true);
});

test('prefers a pengpeng decomposition when the same hand also has sequences', () => {
  const result = HuCalculator.checkHu(
    [16, 18, 18, 18, 23, 23, 23, 28, 28, 32, 32, 32, 37, 37],
    37,
  );

  assert.equal(result.type, '碰碰胡');
  assert.equal(result.canCatchCannon, true);
});

test('chooses the chi combination that can reach ting after the required discard', () => {
  const hand = [12, 15, 18, 18, 21, 22, 22, 23, 32, 33, 34, 35, 37];
  const strategy = new NpcStrategy(hand, 15);

  assert.deepEqual(
    strategy.shouldChi([[34, 35], [35, 37]], 36),
    [35, 37],
  );
});

test('pengs when the following discard can leave the hand in ting', () => {
  const hand = [11, 11, 22, 22, 12, 13, 24, 25, 26, 31, 32, 33, 37];
  const strategy = new NpcStrategy(hand, 19);

  assert.equal(strategy.shouldPeng(11), true);
});

test('does not test ting against a hand with the wrong tile count', () => {
  const strategy = new NpcStrategy([], 19);
  assert.equal(strategy.isHandTing([11, 12, 13]), false);
});
