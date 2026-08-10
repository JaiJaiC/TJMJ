import test from 'node:test';
import assert from 'node:assert/strict';

import { HuCalculator } from '../src/core/HuCalculator.js';
import { buildInterceptPlan, distanceOrder, findNextAction } from '../src/core/intercepts.js';

test('orders players by distance from the discarder (下家优先)', () => {
  assert.deepEqual(distanceOrder(0), [1, 2, 3]);
  assert.deepEqual(distanceOrder(3), [0, 1, 2]);
});

test('allows chi only for the immediate next player', () => {
  const plan = buildInterceptPlan(
    1, // 下家出牌
    23,
    19,
    null,
    (p) => {
      if (p === 2) return [21, 22, 24]; // 对家能吃到 21-22-23 / 22-23-24
      if (p === 3) return [21, 22, 24]; // 上家也有牌，但不是下家，不能吃
      return [21, 22, 24];
    },
  );

  assert.equal(plan.byPlayer[2].chi, true);
  assert.equal(plan.byPlayer[3].chi, false);
  assert.equal(plan.byPlayer[0].chi, false);
});

test('hu without wang is catchable, and canPeng/canGang are detected', () => {
  // 13 张暗牌 + 打出 18 → 碰碰胡（无王，可抓炮）
  const hand13 = [16, 18, 18, 23, 23, 23, 28, 28, 32, 32, 32, 37, 37];
  const precondition = HuCalculator.checkHu([...hand13, 18], 37, null, false);
  assert.equal(precondition.canHu, true);
  assert.equal(precondition.canCatchCannon, true);

  const plan = buildInterceptPlan(0, 18, 37, null, () => hand13);
  assert.equal(plan.byPlayer[1].hu, true);
  assert.equal(plan.byPlayer[1].peng, true);
  assert.equal(plan.byPlayer[1].gang, false);
});

test('hu with wang as plain hand cannot catch a discard', () => {
  // 12,13,15 用王(14)补顺子 → 平胡（有王），不能抓炮
  const hand13 = [12, 13, 15, 21, 22, 23, 31, 32, 33, 28, 28, 25, 25];
  const plan = buildInterceptPlan(0, 15, 14, null, () => hand13);
  assert.equal(plan.byPlayer[1].hu, false);
});

test('global priority: hu beats a closer player gang', () => {
  const plan = {
    order: [0, 1, 2],
    byPlayer: {
      0: { hu: false, gang: true, peng: false, chi: false },
      1: { hu: true, gang: false, peng: false, chi: false },
      2: { hu: false, gang: false, peng: false, chi: false },
    },
  };
  assert.deepEqual(findNextAction(plan), { player: 1, actionType: 'hu', priority: 0, cursor: 1 });
});

test('same priority respects distance order and resumes after cursor', () => {
  const plan = {
    order: [0, 1, 2],
    byPlayer: {
      0: { hu: false, gang: false, peng: true, chi: false },
      1: { hu: false, gang: false, peng: true, chi: false },
      2: { hu: false, gang: false, peng: false, chi: false },
    },
  };
  assert.equal(findNextAction(plan, 2).player, 0);
  assert.equal(findNextAction(plan, 2, 1).player, 1);
  assert.equal(findNextAction(plan, 2, 2), null);
});

test('returns null when nobody can act', () => {
  const plan = {
    order: [0, 1, 2],
    byPlayer: {
      0: { hu: false, gang: false, peng: false, chi: false },
      1: { hu: false, gang: false, peng: false, chi: false },
      2: { hu: false, gang: false, peng: false, chi: false },
    },
  };
  assert.equal(findNextAction(plan), null);
});
