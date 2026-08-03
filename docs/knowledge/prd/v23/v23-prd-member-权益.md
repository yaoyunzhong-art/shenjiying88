# V23 WP-08A 会员权益底座 — PRD 摘要卡

> 签发日期: 2026-07-23 · Sprint-1 · P0  
> 关联 BS: BS-0114~BS-0121  
> 对应总表: `docs/knowledge/2026-07-23-6-8-development-master-backlog-v2.md §5`

---

## 1. 业务背景

### 1.1 为什么要做
《规划6-8》要求将"会员权益"从独立的散点模块提升为贯通交易/优惠券/推送的底座能力。  
当前(`tree/codeup-acr-ci-20260717`)已有：

- `member` 模块：会员档案、积分/成长值、运营画像、休眠、跨租户 —— 但等级判断仅用旧 5 级体系(Bronze~Diamond, 仅 points 维度)
- `member-level` 模块：6 阶 18 级体系(REGULAR_L1~MYTH_L3, 基于 growth/spend/visit 三维) —— 但完全独立，未与 member 模块打通
- `loyalty` 模块：积分引擎、盲盒、优惠券、订单结算 —— 已通过 `awardPoints` 注入成长值
- `membership` 模块：旧 4 级体系(regular~diamond), 仅用于 P-36 店A
- `svip` 模块：SVIP 订阅管理，独立

**核心问题:** 有 3 个等级体系并存，无权益决议层，跨模块权益链路未形成。

### 1.2 本 WP 目标
- 桥接 `member` ↔ `member-level`：当成长值变更时自动触发 6 阶 18 级评估
- 定义等级升级事件类型，供交易/优惠券/推送等消费方监听
- 建立权益基础决议能力（等级 → 折扣/权益）
- **严禁重写已有功能** — 仅补缺失的门禁级桥接

### 1.3 成功标准
- `MemberProfile` 可反映 `member-level` 6 阶 18 级结果
- 成长值跨阈值时，升级事件结构可被消费方接收
- 权益决议层能根据等级返回折扣倍率

---

## 2. 现状覆盖度

| 模块 | 功能 | 覆盖度 | 说明 |
|:-----|:------|:------:|:----|
| member | 会员档案(增删改查/积分/成长值/运营/休眠/跨租户) | ✅ 完备 | `MemberService` ~2800行, 含持久化+审批+运营任务 |
| member | 等级评估 (old) | ⚠️ 旧体系 | `computeMemberLevel()` 仅 points → old 5级 |
| member-level | 6阶18级评估 | ✅ 完备 | `MemberLevelService.evaluateMemberLevel()` 三维评估, 含批量+全局配置+升级路径 |
| member-level | 阈值配置 | ✅ 完备 | 18级阈值, benefit 字符串, 后台可调用 config 接口 |
| member-level | 升级事件 | ❌ 缺失 | 无事件类型定义, 无发射机制 |
| member ↔ member-level | 桥接 | ❌ 缺失 | `MemberService` 未注入 `MemberLevelService` |
| member · benefit resolver | 权益决议 | ❌ 缺失 | benefits 仅是字符串标签, 无折扣/权益计算 |
| loyalty · settlePaidOrder | 积分/成长值注入 | ⚠️ 单向 | 通过 `awardPoints` 加成长值, 但不触发等级重算 |
| loyalty · coupon | 优惠券 | ✅ 完备 | CouponPlan + Redemption + Quota |
| svip | SVIP 订阅 | ✅ 完备 | 独立, 未与 member-level 权益打通 |

---

## 3. 本 WP 补缺范围

### 3.1 等级升级事件 (BS-0114/0115 门禁)
- 定义 `MemberLevelUpgradeEvent` 事件类型
- 事件载荷: memberId, tenantId, fromLevelKey, toLevelKey, growthValue, evaluatedAt

### 3.2 Member ↔ member-level 桥接 (BS-0115)
- `MemberService` 注入 `MemberLevelService`
- `evaluateMemberTier()` 方法: 根据 MemberProfile 的 growthValue/totalSpend/totalVisits 调用 `MemberLevelService.evaluateMemberLevel()`
- 返回 6 阶 18 级结果, 含 benefits
- 在 `awardPoints` / `rollbackPoints` 后自动触发评估

### 3.3 权益基础决议 (BS-0120/0121 门禁)
- 定义 `MemberBenefitEffect` 权益效果类型
- 提供 `resolveMemberBenefits()` 方法: 根据等级返回折扣倍率等权益效果
- 注册 `MEMBER_BENEFIT_RESOLVER` 提供者令牌

---

## 4. 约束
- **不重写** member/member-level/loyalty 已有功能
- 仅新增桥接+事件文件, 不改动核心业务逻辑
- TSC 零生产代码错误
- `6-8_refs: [BS-0114..BS-0121]`

## 5. 回滚
- `git revert HEAD` 一键回滚
- `commit` 粒度: 桥接代码 + 文档 统一提交
