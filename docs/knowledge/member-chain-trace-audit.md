# 会员主链穿透审计表

## 1. 目的

本表用于把会员主链按“注册 / 登录 -> 会员中心 / 会员卡 -> API 会员模型 -> Admin 会员运营 -> TOB 会员经营视图”逐节点拆开，明确当前真链、伪链和口径分裂点。

本表对应跨端断点 `GAP-LINK-0003`，用于支撑会员域口径统一、运营面可信化和后续优先级排序。

## 2. 目标闭环

目标链：

1. TOC 会员注册
2. TOC 登录
3. TOC 会员中心 / 会员卡
4. API `member` / `membership`
5. Admin 会员运营
6. TOB 会员经营视图

当前总判定：

- `部分通`

原因：

- TOC 登录到会员中心的骨架已存在。
- 会员卡、注册、Admin 会员运营深水区、TOB 经营视图仍有明显 mock / fallback。
- API `member` / `membership` 双口径并存，是当前最核心的正式口径风险。

## 3. 逐节点穿透表

| 节点 | 路径 / 模块 | 当前状态 | 说明 | 证据等级 |
| --- | --- | --- | --- | --- |
| `MEM-01` | 会员系统需求卡 / PRD / 验收卡 | 已冻结 | 业务目标已覆盖注册、等级、积分、余额、权益、会员前台能力 | `B` |
| `MEM-02` | `apps/storefront-web/app/member-register/page.tsx` | 断点 | 注册页并未真正调用会员注册接口，只发验证码后跳登录 | `A` |
| `MEM-03` | `apps/storefront-web/app/member-login/page.tsx` | 已通 | 登录真实走 `/auth/login/sms`，成功后写 token 并跳会员中心 | `A` |
| `MEM-04` | `apps/storefront-web/lib/member-auth-service.ts` | 已通 | 已真实消费 `/auth/login/sms`、`/auth/sms-code`、`/auth/me` | `A` |
| `MEM-05` | `apps/storefront-web/app/member-center/page.tsx` | 部分通 | 最近订单走真实链，但余额仍是随机模拟，充值入口未落地 | `A` |
| `MEM-06` | `apps/storefront-web/app/member-card/page.tsx` | 断点 | 页面存在，但未接到正式卡券后端，异常时直接回退 mock 卡和 mock 券 | `A` |
| `MEM-07` | `apps/storefront-web/lib/member-card-service.ts` | 断点 | 依赖 `/member-card/me`、`/member-coupons`，主仓未见对应正式 API 模块 | `A` |
| `MEM-08` | `apps/api/src/modules/member/member.controller.ts` | 部分通 | `/members` 覆盖档案、画像、任务、余额等，但部分接口仍返回空数组 | `A` |
| `MEM-09` | `apps/api/src/modules/membership/membership.controller.ts` | 部分通 | `/membership` 同时覆盖注册、等级、积分、余额、统计，是另一套正式会员语义 | `A` |
| `MEM-10` | `apps/api/src/modules/membership/membership.controller.metadata.test.ts` | 已通 | metadata 测试存在，说明 `membership` 被当成正式模块维护 | `A` |
| `MEM-11` | `apps/admin-web/app/members/page.tsx` | 部分通 | 列表页优先接 `/members/persistent`，失败才回退 mock，是 Admin 最接近真链的入口 | `A` |
| `MEM-12` | `apps/admin-web/app/members/[id]/page.tsx` | 断点 | 详情页仍完全依赖 mock member / points / recharges / visits | `A` |
| `MEM-13` | `apps/admin-web/app/members/cards/page.tsx` | 断点 | 会员卡页全部基于本地 `MOCK_MEMBER_CARDS` | `A` |
| `MEM-14` | `apps/admin-web/app/members/tiers/page.tsx` | 断点 | 等级页仍是 `MOCK_TIERS` | `A` |
| `MEM-15` | `apps/admin-web/app/members/reports/page.tsx` | 断点 | 运营报表基于本地生成函数，不是实时后端数据 | `A` |
| `MEM-16` | `apps/tob-web/app/members/page.tsx` | 断点 | TOB 会员列表仍基于 `MOCK_MEMBERS` | `A` |
| `MEM-17` | `apps/tob-web/app/members/[id]/page.tsx` | 断点 | TOB 会员详情仍本地 mock 编辑 / 状态流转 | `A` |
| `MEM-18` | `apps/tob-web/app/svip/page.tsx` | 断点 | SVIP 服务先请求，再 fallback 到 `MOCK_*` | `A` |
| `MEM-19` | `apps/tob-web/app/member-center/member-center-service.ts` | 断点 | 内部 `/api/member/:id/*` 服务失败直接退回 mock，且仓内未见完整对应实现 | `A` |

## 4. 关键断点

| gapId | 断点 | 当前表现 | 影响 |
| --- | --- | --- | --- |
| `GAP-MEM-0001` | 注册未接正式会员注册链 | 注册页只发验证码后跳登录，没有真正创建会员 | TOC 注册闭环不成立 |
| `GAP-MEM-0002` | 会员卡 / 券包未接正式后端 | `/member-card/me`、`/member-coupons` 在主仓缺正式模块支撑 | 会员权益链不可信 |
| `GAP-MEM-0003` | `member` / `membership` 双口径并存 | 两套控制器都覆盖注册 / 等级 / 积分 / 余额语义 | 三端无法用单一正式口径验收 |
| `GAP-MEM-0004` | `member` 模块局部能力仍为空实现 | login-history / security-events / payments 等接口返回空数组 | 登录后结果面与后端能力脱节 |
| `GAP-MEM-0005` | Admin 会员运营面大面积 mock | 列表页稍真，详情 / 卡 / 等级 / 报表基本都是假数据 | 运营闭环无法复签 |
| `GAP-MEM-0006` | TOB 会员经营视图大面积 fallback | members / svip / member-center 均偏 mock | 经营面不可作为可信结果视图 |

## 5. 当前冻结结论

1. 当前最可信的会员真骨架是：
   - `TOC 登录`
   - `Auth API`
   - `TOC 会员中心`
   - `Admin /members` 列表
2. 当前不能宣称“会员主链已闭环”，因为：
   - 注册未接正式会员注册
   - 会员卡 / 券包后端未正式落地
   - `member` / `membership` 双口径未统一
3. TOB 与 Admin 当前更多是“会员运营视图存在”，而不是“可信经营结果面”。

## 6. 修复优先级

### 6.1 P0

- 统一会员域正式口径，明确 `member` 与 `membership` 的唯一主线或职责拆分
- 让 TOC 注册页接入正式会员注册
- 补会员卡 / 券包正式后端能力

### 6.2 P1

- 把 Admin 会员详情、会员卡、等级、报表改成真实接口消费
- 把 TOB 会员 / SVIP / 会员中心从 mock/fallback 改为真实运营结果面
- 把 `login-history`、`security-events` 等空实现补齐

## 7. 下一步执行建议

1. 先出一张“会员域正式口径统一表”，收敛 `member` / `membership`。
2. 把 TOC 注册、会员卡两段补成真实链，再谈三端会员闭环。
3. Admin 先从列表页向详情页、卡页、报表页逐步去 mock。
4. TOB 会员经营视图放在第二阶段接真，避免先修经营面、后修主链的顺序倒挂。

## 8. 关联文档

- `docs/knowledge/triple-end-requirement-current-state-alignment.md`
- `docs/knowledge/cross-end-link-breakpoints.md`
