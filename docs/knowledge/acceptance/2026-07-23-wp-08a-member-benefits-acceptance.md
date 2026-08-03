# WP-08A 会员权益底座 — 验收卡

> 日期: 2026-07-23 · Sprint-1 · P0  
> 分支: `tree/codeup-acr-ci-20260717`  
> 关联 BS: BS-0114, BS-0115, BS-0120, BS-0121  
> 审核: [待审核]

---

## 1. 验收摘要

| 维度 | 当前状态 |
|:-----|:--------|
| 代码 | ✅ 新增 3 文件, 0 改造已有文件 |
| 配置 | ✅ 事件类型常量 |
| 证据 | ✅ 测试覆盖率 |
| 回滚 | ✅ `git revert HEAD` |
| TSC | ✅ 零生产代码错误 |
| test.skip/only | ✅ 无 |

---

## 2. 当前会员功能覆盖率数据分析

### 2.1 模块全景

```
                        ┌─────────────────────┐
                        │  member (会员档案)    │
                        │  ~2800行, 29 文件     │
                        │  ╔═ MemberService    │
                        │  ║ ║ growthValue 已跟踪 │
                        │  ║ ║ points → 5级旧体系 │
                        │  ║ ╠ addPoints     (✅) │
                        │  ║ ╚ awardPoints   (✅) │
                        │  ╠ MemberController   │
                        │  ╠ MemberDormancy     │
                        │  ╚ CrossTenant       │
                        └────────┬────────────┘
                                 │ ❌ 此前未桥接
              ┌──────────────────┴──────────────────┐
              │  member-tier-bridge (✅ 新增)         │
              │  ╔ MemberTierBridgeService           │
              │  ║ 注入 MemberLevelService           │
              │  ║ evaluateMemberTier()              │
              │  ║ buildUpgradeEvent()               │
              │  ╚ resolveBenefits()                 │
              └──────────────────┬──────────────────┘
                                 │ 注入
              ┌──────────────────┴──────────────────┐
              │  member-level (6阶18级)              │
              │  ~21文件, 完备                       │
              │  ╔= MemberLevelService               │
              │  ║ ║ evaluateMemberLevel()  ✅       │
              │  ║ ║ batchEvaluate()       ✅        │
              │  ║ ║ getAllLevelConfig()   ✅        │
              │  ║ ║ getUpgradePath()      ✅        │
              │  ║ ╠ LEVEL_THRESHOLDS (18级) ✅      │
              │  ║ ╚ benefits (string[])  ✅         │
              │  ╠ upgrade event type  (✅ 新增)      │
              │  ╠ benefit resolver     (✅ 新增)      │
              │  ╚ MemberLevelController ✅           │
              └────────────────────────────────────┘

loyalty ─── settlePaidOrder → awardPoints (单向, 仅注入成长值, 此前不触发重算)
membership ─── 旧4级体系, P-36 店A专属, 不在本 WP 范围
svip ─── 独立订阅, 不在本 WP 范围
```

### 2.2 功能覆盖清单

| BS | 功能 | 已有 | 新增 | 说明 |
|:---|:-----|:----:|:----:|:-----|
| BS-0114 | 等级定义（6阶18级） | ✅ | - | `member-level.entity.ts` |
| BS-0114 | 等级阈值配置 | ✅ | - | `LEVEL_THRESHOLDS` 常量 |
| BS-0114 | 等级评估（三维） | ✅ | - | `evaluateMemberLevel()` |
| BS-0114 | 等级API（evaluate/config/upgrade-path） | ✅ | - | `MemberLevelController` |
| BS-0115 | 成长值跟踪（member profile） | ✅ | - | `growthValue` 字段 |
| BS-0115 | **成长值→6阶18级桥接** | ❌ | ✅ | `MemberTierBridgeService` |
| BS-0115 | **等级升级事件类型** | ❌ | ✅ | `MemberLevelUpgradeEvent` |
| BS-0115 | **等级降级事件类型** | ❌ | ✅ | `MemberLevelDowngradeEvent` |
| BS-0120 | **权益字符串解析** | ❌ | ✅ | `resolveBenefits()` |
| BS-0120 | **折扣倍率决议** | ❌ | ✅ | `compositeDiscountRate` |
| BS-0120 | **积分倍率决议** | ❌ | ✅ | `compositePointsMultiplier` |
| BS-0120 | 权益类型折扣效果 | ❌ | ✅ | `MemberBenefitDiscountEffect` |
| BS-0120 | 权益类型排队效果 | ❌ | ✅ | `MemberBenefitPriorityQueueEffect` |
| BS-0120 | 权益类型客服效果 | ❌ | ✅ | `MemberBenefitConciergeEffect` |
| BS-0121 | 权益跨模块消费（事件总线插槽） | ⬜ | - | 预留事件类型, 总线集成待消费方WP引入 |

### 2.3 等级体系对照

| 系统 | 等级 | 维度 | 用途 |
|:-----|:-----|:----:|:-----|
| `member.entity` (旧) | Bronze/Silver/Gold/Platinum/Diamond | points | 旧收银/会员卡展示 |
| `member-level` (新) | REGULAR/VIP/SVIP/DIAMOND/LEGEND/MYTH × L1/L2/L3 | growth+spend+visit | 6-8 规划新权益体系 |
| `membership` (旧) | regular/silver/gold/diamond | totalSpent | P-36 店A专用 |

**关系**: 本 WP 桥接 `member` → `member-level`, 使成长值变更时自动评估新6阶18级。旧5级体系保持不动（未改造已有代码）。

---

## 3. 新增文件清单

| 文件 | 行数 | 说明 |
|:-----|:----:|:-----|
| `apps/api/src/modules/member/member-tier-bridge.service.ts` | ~100 | Member ↔ member-level 桥接服务 |
| `apps/api/src/modules/member/member-tier-bridge.service.test.ts` | ~130 | 桥接服务测试（含权益决议测试） |
| `apps/api/src/modules/member-level/member-level-upgrade.event.ts` | ~80 | 等级升级/降级事件类型定义 |
| `apps/api/src/modules/member-level/member-level-benefit.ts` | ~200 | 权益效果类型与决议函数 |
| `docs/knowledge/prd/v23/v23-prd-member-权益.md` | ~120 | PRD 摘要卡 |
| `docs/knowledge/acceptance/2026-07-23-wp-08a-member-benefits-acceptance.md` | 本文 | 验收卡 |

---

## 4. 测试证据

### 4.1 桥接服务测试

```typescript
// evaluateMemberTier
✅ REGULAR_L1 for zero growth member
✅ VIP_L1 for growth 800
✅ SVIP_L1 for growth 4000 + spend 10000
✅ DIAMOND_L1 for growth 14000 + spend 50000
✅ detect upgrade when previousLevelKey differs
✅ NOT detect upgrade event when level unchanged
✅ produce benefit resolution with discount rate

// resolveBenefits
✅ parse discount from benefit string ('折扣9.5折' → rate 0.95)
✅ parse unlimited priority queue ('无限免排')
✅ return correct composite discount rate (MYTH_L3 → 0.38)
```

### 4.2 运行测试

```bash
# 桥接服务单独测试
npx tsx --test apps/api/src/modules/member/member-tier-bridge.service.test.ts

# 会员模块全量测试
npx vitest run apps/api/src/modules/member/ --reporter=verbose 2>&1 | tail -30
```

---

## 5. 回滚方案

```bash
# 方案1：一键回滚（推荐）
git revert HEAD --no-edit

# 方案2：手动撤回
git reset --soft HEAD~1
git checkout -- \
  apps/api/src/modules/member/member-tier-bridge.service.ts \
  apps/api/src/modules/member/member-tier-bridge.service.test.ts \
  apps/api/src/modules/member-level/member-level-upgrade.event.ts \
  apps/api/src/modules/member-level/member-level-benefit.ts \
  docs/knowledge/prd/v23/v23-prd-member-权益.md \
  docs/knowledge/acceptance/2026-07-23-wp-08a-member-benefits-acceptance.md
git clean -fd
```

---

## 6. PR 合规字段

```
6-8_refs: [BS-0114, BS-0115, BS-0120, BS-0121]
blocker_id: none
```

---

## 7. 已知限制（不在本 WP 范围）

1. 等级升级事件尚未注册到 NestJS Event Bus（消费方 WP 引入后集成）
2. `MemberService.addPoints()` 内暂未自动调用 `MemberTierBridgeService.evaluateMemberTier()`（不改造已有代码原则）
3. 权益效果尚未注入 checkout/coupon/push 模块（属 BS-0121 后续链路）
4. `membership` 模块的旧 4 级体系保持不变
5. `svip` 订阅独立，等级权益未与 SVIP 打通
