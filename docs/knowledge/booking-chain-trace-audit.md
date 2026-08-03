# 预约主链穿透审计表

## 1. 目的

本表用于把预约主链按“导流 -> 发现 -> 预约 -> API -> 履约 -> 支撑控制面”逐节点拆开，明确当前哪些节点已真实接线，哪些仍停留在 `mock / fallback / 半联调`。

本表对应跨端断点 `GAP-LINK-0001`，用于支撑后续《缺口清单》与 `M2 交易与履约闭环` 的排期判断。

## 2. 目标闭环

目标链：

1. TOB 门户展示与导流
2. TOC 门店首页 / 服务详情
3. TOC 在线预约页
4. API `storefront` 预约创建 / 查询 / 改期 / 取消 / 核销
5. Admin 门店配置 / 预约执行 / 履约反馈

当前总判定：

- `部分通`

原因：

- TOC 执行面最接近真实闭环。
- TOB 目前主要导向 B 端联系页，不是 TOC 消费预约真入口。
- Admin 仍缺“配置 -> 生效 -> 履约反馈”的真实控制面证据。

## 3. 逐节点穿透表

| 节点 | 路径 / 模块 | 当前状态 | 说明 | 证据等级 |
| --- | --- | --- | --- | --- |
| `BK-01` | TOB PRD 导流基线 | 已冻结 | B2B 官网 PRD 已明确“预约线下洽谈 / 实地考察”入口 | `B` |
| `BK-02` | `apps/tob-web/app/brand-website/digital-sports/page.tsx` | 断点 | CTA “预约实地考察”跳 `/contact`，不是 TOC 消费预约页 | `A` |
| `BK-03` | `apps/tob-web/app/brand-website/epc/page.tsx` | 断点 | CTA “预约线下考察”同样跳 `/contact` | `A` |
| `BK-04` | `apps/tob-web/app/sports-ants/cases/page.tsx` | 部分通 | 有商务预约弹窗，但属于 B 端商务预约，不是 TOC 服务预约 | `A` |
| `BK-05` | `apps/tob-web/app/runtime-governance.ts` | 部分通 | runtime preset 已预置 `booking-submit -> /api/v1/storefront/bookings`，说明存在联动意图 | `A` |
| `BK-06` | `apps/storefront-web/app/store/[slug]/page.tsx` | 部分通 | 门店首页 CTA 已跳真实预约页，但页面本身仍含 mock 门店数据 | `A` |
| `BK-07` | `apps/storefront-web/app/store/[slug]/services/[id]/page.tsx` | 部分通 | 服务详情已跳 `/book?serviceId=...`，但详情本身仍偏 mock | `A` |
| `BK-08` | `apps/storefront-web/app/store/[slug]/book/page.tsx` | 已通 | 在线预约页可拉服务、拉时段、创建预约、查预约、取消预约，是当前最强执行面 | `A` |
| `BK-09` | `apps/api/src/modules/storefront/storefront.controller.ts` | 已通 | 控制器已提供服务、时段、预约、取消、改期、核销全链端点 | `A` |
| `BK-10` | `apps/api/src/modules/storefront/storefront.service.ts` | 已通 | 服务层已走 Prisma 持久化，包含冲突控制、二维码与核销逻辑 | `A` |
| `BK-11` | `apps/api/prisma/schema.prisma` 中 `StorefrontBooking` | 已通 | 真实预约持久化模型已存在，且有唯一约束 | `A` |
| `BK-12` | `apps/admin-web/app/stores/[id]/reservations/page.tsx` | 断点 | 页面存在，但数据仍为本地 `DATA` | `A` |
| `BK-13` | `apps/admin-web/app/stores/[id]/page.tsx` | 断点 | 门店详情与 capability access 已存在，但编辑提交仍是 mock submit | `A` |
| `BK-14` | `apps/admin-web/app/audit-trail/page.tsx` | 断点 | 有治理门禁，但日志仍是 mock，无法作为履约反馈证据 | `A` |
| `BK-15` | `apps/api/src/modules/reservation/*` | 断点 | 仓内还并存一套内存 `reservation` 模块，与 `storefront booking` 不是同一真链 | `A` |

## 4. 关键断点

| gapId | 断点 | 当前表现 | 影响 |
| --- | --- | --- | --- |
| `GAP-BOOK-0001` | TOB 导流未接入 TOC 真预约页 | 多数 CTA 落到 `/contact` 或商务预约弹窗，而不是 `/store/[slug]/book` | 导流与消费预约主链脱节 |
| `GAP-BOOK-0002` | 发现页与预约页半真半假 | 门店首页、服务详情仍依赖 mock 门店 / 服务数据，只有预约页和 booking 持久化较真 | 发现 -> 预约证据链不完整 |
| `GAP-BOOK-0003` | `serviceId` 传参未真正接入预约页初始化 | 服务详情会带 `?serviceId=...`，但预约页未读取 query 参数回填 | 页面间跳转语义未完全闭环 |
| `GAP-BOOK-0004` | Admin 预约控制面仍是 mock | 门店预约页、门店详情页、审计页均存在，但核心数据不是实时后端结果 | 无法证明“配置 -> 生效 -> 履约反馈” |
| `GAP-BOOK-0005` | API 存在双轨预约口径 | `storefront booking` 与通用 `reservation` 模块并存 | 后续统计和验收易混口径 |
| `GAP-BOOK-0006` | 核销签名未完全强校验 | 未传签名也可进入核销逻辑 | 履约防伪与审计可信度不足 |

## 5. 当前冻结结论

1. 当前最可信的预约真链是：
   - `TOC /store/[slug]/book`
   - `API storefront bookings`
   - `Prisma StorefrontBooking`
2. 当前不能宣称“预约主链三端闭环”，因为：
   - TOB 主要导流未接 TOC 真预约入口
   - Admin 控制面仍是 mock
   - 发现页与详情页仍有较强 mock 成分
3. 当前不能把 `apps/api/src/modules/reservation/*` 与 `storefront booking` 混成同一条主链。

## 6. 修复优先级

### 6.1 P0

- 让 TOB 预约 CTA 直接导到 TOC 真预约入口
- 让 Admin 预约页接真实预约列表 / 状态 / 履约结果
- 收束预约正式口径，只保留一条主链作为验收主线

### 6.2 P1

- 让预约页真正读取 `serviceId`
- 把门店首页 / 服务详情页从 mock 数据切到真实门店 / 服务数据
- 收紧核销签名校验

## 7. 下一步执行建议

1. 以 `storefront booking` 作为预约主链唯一正式口径。
2. 为 TOB 导流新增“品牌页 -> 门店页 -> 预约页”真实路径。
3. 把 Admin 门店预约页改成真实接口消费，并补履约反馈视图。
4. 补预约链的事件、审计与回放证据，避免后续履约链复签失真。

## 8. 关联文档

- `docs/knowledge/triple-end-requirement-current-state-alignment.md`
- `docs/knowledge/cross-end-link-breakpoints.md`
