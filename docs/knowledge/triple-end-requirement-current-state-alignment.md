# TOB / TOC / 管理后台需求与现状对齐表

## 1. 目的

本表用于把 `TOB 官网`、`TOC 官网`、`管理后台` 三个主应用放到同一张对齐表中，统一回答以下问题：

1. 需求基线来自哪里。
2. 三端各自当前已经做到什么程度。
3. 哪些属于真实链路，哪些仍是 `mock / fallback / demo`。
4. 哪些能力已具备跨端闭环基础，哪些仍存在阻断项。

本文件是 `54名行业与技术专家联合审计与规划方案 v2` 中《三端需求与现状对齐表》的首版底稿，后续缺口清单、优先级路线图和里程碑计划必须复用本表。

## 2. 使用规则

1. 只以主三端口径入表：
   - `apps/tob-web`
   - `apps/storefront-web`
   - `apps/admin-web`
2. `App / Pad / Miniapp / OpenAPI Portal` 只作为补充说明，不直接替代主三端判断。
3. `已存在页面` 不等于 `已闭环`，必须区分：
   - `真实链路`
   - `部分真实 / 部分 fallback`
   - `mock / demo`
4. 对齐判断必须同时看：
   - 需求基线
   - 页面入口
   - 后端服务
   - 当前风险

## 3. 证据基线

| evidenceId | level | claimType | 摘要 | 来源 |
| --- | --- | --- | --- | --- |
| `EV-TRI-0001` | `B` | `存在性` | 三端主口径冻结为 `api`、`admin-web`、`storefront-web`、`tob-web`，其他客户端只做抽样或专项纳入。 | `docs/knowledge/system-boundary-matrix.md` |
| `EV-TRI-0002` | `B` | `存在性` | `expert54` 总控方案要求产出《TOB / TOC / 管理后台对齐表》作为正式审计产物。 | `docs/knowledge/expert54-full-process-audit-plan.md` |
| `EV-TRI-0003` | `B` | `存在性` | PRD 总索引已冻结当前活跃 Phase PRD，可作为三端需求来源主键。 | `docs/knowledge/prd/prd-index.md` |
| `EV-TRI-0004` | `B` | `存在性` | `P-55` TOC 单门店主 PRD 明确覆盖门店首页、服务详情、在线预约和套餐下单。 | `docs/knowledge/prd/prd-storefront-toc-p55.md` |
| `EV-TRI-0005` | `B` | `存在性` | `phase-to-module-mapping` 已给出多 Phase 到模块的映射与全端覆盖统计。 | `docs/knowledge/phase-to-module-mapping.md` |
| `EV-TRI-0006` | `B` | `存在性` | POS / Pad / Storefront / API 业务链需求卡已给出三端联动样板。 | `docs/knowledge/requirement-cards/2026-07-19-PLAN-REV-B1-pos-pad.md` |
| `EV-TRI-0007` | `B` | `存在性` | 收银 -> H5 支付 -> 财务页的收入闭环需求卡已冻结。 | `docs/knowledge/requirement-cards/2026-07-20-P54-checkout-revenue.md` |
| `EV-TRI-0008` | `A` | `存在性` | `tob-web` 已形成企业/品牌门户、治理、开放平台与运营面混合形态。 | `apps/tob-web/README.md` |
| `EV-TRI-0009` | `A` | `存在性` | `storefront-web` 已形成预约、交易、会员三条主链，但部分页面仍为 mock。 | `apps/storefront-web/app` |
| `EV-TRI-0010` | `A` | `存在性` | `admin-web` 已形成工作台、审批、报表、财务、治理等控制面，但多处仍含 mock / fallback。 | `apps/admin-web/README.md` |

## 4. 对齐维度

| 维度 | 说明 |
| --- | --- |
| 模块域 | 用一级业务域做主键，避免三端粒度失衡 |
| 需求基线 | 记录 PRD / 需求卡 / Phase 映射来源 |
| TOB 现状 | 企业门户、品牌门户、治理控制面、企业协同面 |
| TOC 现状 | 门店门户、预约、交易、会员主链 |
| Admin 现状 | 工作台、审批、报表、财务、治理控制面 |
| API / 后端 | 是否存在真实服务支撑 |
| 当前判定 | `已形成基线` / `部分对齐` / `存在阻断` |
| 阻断项 | mock、fallback、缺接线、角色未闭环、口径未统一 |

## 5. 三端对齐主表

| 域 | 需求基线 | TOB 现状 | TOC 现状 | Admin 现状 | API / 后端支撑 | 当前判定 | 主要阻断项 | 下一步 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 门户 / 官网入口 | `EV-TRI-0003` `EV-TRI-0005` | 已形成根首页、租户门户、品牌门户、官网 SEO、多市场多语言 | 以门店门户为主，聚焦门店消费入口 | 首页更偏管理指挥台和工作台入口，不承担外部官网角色 | 主要靠前端门户装配与基础治理契约 | 部分对齐 | TOB 是外部门户，Admin 是内部控制面，三端职责天然不同，不能强行按同构页面对齐 | 把该域拆成“门户展示面”与“内部控制面”两类统计口径 |
| 角色工作台 / 指挥台 | `EV-TRI-0002` `EV-TRI-0005` | 存在 Dashboard、运营台、RBAC、开放平台、告警与治理联动 | TOC 无完整角色工作台，只存在面向消费者的门店入口 | 工作台目录、角色工作台、Pad 工作台已完整成型 | 后端权限角色和治理 API 已存在，但仍有部分角色未完成正式权限闭环 | 部分对齐 | TOC 侧没有工作台等价物；Admin 与 TOB 都有控制面，但角色边界不同 | 后续拆成“运营控制面”专项，不再要求 TOC 对齐角色工作台 |
| 组织 / 租户 / 品牌 / 门店 | `EV-TRI-0005` | `tob-web` 有 tenants / brands / stores / enterprise 门户与协同入口 | TOC 主要体现为门店消费侧页面，不承担组织治理 | `admin-web` 有 tenant、brand、store 及三层配置治理 | API 已有 tenant、brand、store 相关服务与权限治理基础 | 已形成基线 | TOC 不承担治理职责；TOB 与 Admin 在组织域存在职责重叠但分层未完全写清 | 沉淀“组织治理域”分层边界：TOB 偏企业可见面，Admin 偏运营治理面 |
| 预约 / 到店 / 服务预订 | `EV-TRI-0004` `EV-TRI-0006` | TOB 更偏企业展示和品牌招商，不是主预约入口 | `storefront-web` 已有门店预约真链路，但 `appointments`、`booking` 等页仍偏 mock | Admin 主要承担运营配置和门店执行支撑，不是消费者预约入口 | `storefront` 模块已存在服务、时段、预约、取消、改期、核销链路 | 部分对齐 | TOC 预约主链较强，但 TOB/Admin 侧还缺“配置 -> 生效 -> 履约反馈”的统一穿透表 | 先按“TOC 主链 + Admin 配置支撑 + TOB 展示导流”三层重写预约域对齐 |
| 交易 / 收银 / 支付 | `EV-TRI-0006` `EV-TRI-0007` | TOB 有企业侧收银/合同/财务看板入口，但不是消费者支付承载页 | `storefront-web` 已形成 `cashier`、`checkout`、`self-recharge` 主链 | Admin 有财务中心、退款、对账、规则与报表控制面 | API 已有 cashier、transaction、member 等真实服务支撑 | 已形成基线 | 三端都覆盖交易域，但前后职责不同；Admin 财务页与部分 TOC 页仍混有 mock / fallback | 以“交易执行面 / 财务控制面 / 企业经营面”三层拆表，并补真实接线状态 |
| 会员 / 登录 / 权益 | `EV-TRI-0004` `EV-TRI-0007` | TOB 有会员运营、客户、SVIP、优惠券中心等运营视图 | `storefront-web` 已形成登录、注册、会员中心、会员卡主链 | Admin 侧更多是会员管理、会员策略与运营控制 | API 已有 `member` 与 `membership`，但存在双入口口径 | 部分对齐 | `member` / `membership` 口径分裂；TOC 会员主链最完整，TOB/Admin 偏运营面 | 先统一会员域正式口径，再补三端“执行面 / 运营面 / 配置面”映射 |
| 报表 / 分析 | `EV-TRI-0005` | TOB 有经营分析、财务看板、AI 分析入口 | TOC 侧财务摘要和经营视图开始出现，但深度有限 | Admin 报表中心独立完整，适合做主控制面 | API 报表域已具真实 controller 和权限收口 | 部分对齐 | 报表指标口径尚未完全冻结，`reports` 与 `finance.summary` 一致性仍是风险 | 以报表 PRD 为统一指标定义，补跨端口径一致性说明 |
| 财务 / 对账 / 发票 / 结算 | `EV-TRI-0007` | TOB 有 `finance-dashboard` 等经营财务视图 | TOC 侧只有交易后半链与财务摘要页，不是完整财务控制面 | Admin 财务一级中心和多二级子域已成型 | API 财务、结算、报表、审计等域已逐步收口 | 部分对齐 | Admin 财务页仍有 mock；TOC 财务页偏消费者视角；TOB 偏企业经营视角 | 财务域按“控制面 / 经营面 / 消费者感知面”分层，不再简单按页面对齐 |
| 审批 / 治理 / 配置 | `EV-TRI-0002` `EV-TRI-0005` | TOB 有 alert、operations、RBAC、openapi、runtime governance 等治理联动 | TOC 基本不承担审批治理主职责 | Admin 有 foundation、configuration、approvals、openapi、workbench 等主治理面 | 后端治理与权限域真实存在，但前端多个治理页仍有 mock/demo 成分 | 部分对齐 | TOB 和 Admin 同时承载治理能力，但一个偏门户联动，一个偏主控制面；审批页当前偏 mock | 把治理域拆成“主控制面 Admin”和“联动展示面 TOB”，TOC 只保留被治理影响的消费者结果面 |
| 营销 / 活动 / 优惠券 / 联盟 | `EV-TRI-0005` | TOB 有 campaigns、franchise、alliance-dashboard、brand 网站活动承接 | TOC 有促销承接、会员活动、核销和消费者互动 | Admin 有营销规则、投放、券模板、运营配置 | API 营销与会员相关域基本存在，但跨端状态不均衡 | 部分对齐 | TOB 偏招商/品牌活动，TOC 偏活动承接，Admin 偏配置控制，跨端链路尚未统一验收 | 下一步做“活动配置 -> 消费者承接 -> 数据回流”穿透表 |
| 开放平台 / RBAC / 开发者面 | `EV-TRI-0005` `EV-TRI-0008` | TOB 有 `openapi-portal`、`rbac-admin`、开发者门户 | TOC 不承担开放平台职责 | Admin 有 `openapi`、`identity-access`、`integration-orchestration` | API 已有 openapi、gateway、security 等真实域，且已完成一轮权限收口 | 已形成基线 | `openapi-portal` 更适合作为 TOB 子面附录，不能直接计入 TOB 全域完成率 | 开放平台域转入专项附录，不与 TOC 强行做对等对齐 |

## 6. 当前冻结结论

1. 三端目前不能用“同构页面数”做对齐，只能用“同一业务域下的不同职责层”做对齐。
2. 当前最适合继续深挖的真实共域有：
   - 预约 / 服务预订
   - 交易 / 收银 / 支付
   - 会员 / 权益
   - 报表 / 财务
   - 营销 / 活动
3. 当前最容易误判的域有：
   - 审批 / 治理 / 配置
   - 财务中心
   - 报表统计
   - 工作台 / 控制面
4. TOC 当前是真实链路最集中的执行面；Admin 当前是治理与控制面最完整的一端；TOB 当前是门户、企业协同和治理联动面最强的一端。

## 7. 主要阻断项

| riskId | 风险 | 当前表现 | 影响 |
| --- | --- | --- | --- |
| `RISK-TRI-0001` | 把不同职责层误判成同构页面 | TOB 门户、TOC 消费页、Admin 控制台被直接横向比较 | 导致对齐结论失真 |
| `RISK-TRI-0002` | mock / fallback 页面误计入闭环 | Admin 治理页、审批页、财务页以及 TOC 部分预约页仍存在 mock 痕迹 | 导致完成率虚高 |
| `RISK-TRI-0003` | 会员域口径分裂 | `member` / `membership` 双入口并存 | 导致三端会员链无法统一判定 |
| `RISK-TRI-0004` | 报表统计口径未完全冻结 | 报表 PRD 已有指标定义，但跨报表一致性机制仍缺失 | 导致跨端经营数字不可直接对齐 |
| `RISK-TRI-0005` | 工作台和治理域缺少职责分层说明 | TOB 和 Admin 都有治理面，但边界未完全写清 | 导致重复建设和错误验收 |

## 8. 下一步执行建议

1. 基于本表继续产出《跨端链路断点清单》。
2. 优先深挖三条高价值真实链路：
   - 预约主链
   - 收银支付主链
   - 会员主链
3. 对 Admin 的审批、财务、治理页补 `mock / fallback / real API` 状态标注。
4. 对 TOB 的门户、企业协同和治理联动页补“控制面 / 展示面”职责标签。
5. 对报表和财务域补“统一指标口径”附录，禁止直接用页面展示值做跨端结论。

## 9. 关联文档

- `docs/knowledge/expert54-full-process-audit-plan.md`
- `docs/knowledge/system-boundary-matrix.md`
- `docs/knowledge/evidence-field-standard.md`
- `docs/knowledge/role-workbench-capability-matrix.md`
- `docs/knowledge/role-permission-flow-consistency-audit.md`
