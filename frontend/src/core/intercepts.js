// frontend/src/core/intercepts.js
// 吃/碰/杠/胡拦截决策：纯逻辑，便于单测与前后端规则对齐。
import { HuCalculator } from './HuCalculator.js';
import { RuleChecker } from './RuleChecker.js';

// 全局动作优先级：胡 > 杠 > 碰 > 吃
export const ACTION_PRIORITY = ['hu', 'gang', 'peng', 'chi'];

/**
 * 从打出牌的人开始，按逆时针（下家→对家→上家）的距离顺序返回玩家列表。
 */
export const distanceOrder = (sourceIndex) => [1, 2, 3].map(offset => (sourceIndex + offset) % 4);

/**
 * 收集所有玩家对某张打出牌的可选操作。
 * @param {number} sourceIndex 出牌人
 * @param {number} targetTile 打出的牌
 * @param {number} wangTile 王牌(癞子)
 * @param {number|null} diTile 地牌
 * @param {(playerIndex: number) => number[]} getHand 获取指定玩家手牌
 * @returns {{ order: number[], byPlayer: Record<number, {hu: boolean, gang: boolean, peng: boolean, chi: boolean, chiCombinations: number[][]}> }}
 */
export const buildInterceptPlan = (sourceIndex, targetTile, wangTile, diTile, getHand) => {
  const order = distanceOrder(sourceIndex);
  const byPlayer = {};

  for (const p of order) {
    const hand = getHand(p);
    const huCheck = HuCalculator.checkHu([...hand, targetTile], wangTile, diTile, false);
    const can = {
      hu: !!(huCheck.canHu && huCheck.canCatchCannon),
      gang: RuleChecker.canMingGang(hand, targetTile, wangTile),
      peng: RuleChecker.canPeng(hand, targetTile),
      chi: false,
      chiCombinations: [],
    };

    // 吃只能由下家（打出牌人的下一家）执行
    if (p === order[0]) {
      const combos = RuleChecker.canChi(hand, targetTile, wangTile);
      if (combos) {
        can.chi = true;
        can.chiCombinations = combos;
      }
    }
    byPlayer[p] = can;
  }

  return { order, byPlayer };
};

/**
 * 在“全局优先级 + 距离顺序”下寻找下一个可执行的动作。
 * @param {{ order: number[], byPlayer: Record<number, any> }} plan
 * @param {number} priority 起始优先级下标（ACTION_PRIORITY 中的位置）
 * @param {number} cursor 起始玩家在 order 中的位置
 * @returns {{ player: number, actionType: string, priority: number, cursor: number } | null}
 */
export const findNextAction = (plan, priority = 0, cursor = 0) => {
  if (!plan) return null;
  for (let pr = priority; pr < ACTION_PRIORITY.length; pr++) {
    const actionType = ACTION_PRIORITY[pr];
    for (let i = cursor; i < plan.order.length; i++) {
      const p = plan.order[i];
      if (plan.byPlayer[p]?.[actionType]) {
        return { player: p, actionType, priority: pr, cursor: i };
      }
    }
    cursor = 0;
  }
  return null;
};
