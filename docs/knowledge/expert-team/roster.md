# 👥 40人超级专家团 — 测试全生命周期参与手册

> 创建: 2026-07-08 | 宪法级
> 四层: 技术层(10) + 业务层(14) + 用户层(10) + 监督层(6)

## 一、专家角色分配

### 🔧 技术层 (10人) — 事前评审+事中代码审查

| 专家 | 专长 | 参与模块 | 门 |
|------|------|----------|:--:|
| T-01 架构师 | 系统架构/微服务/模块拆分 | 全模块 | Gate1 架构 |
| T-02 安全专家 | OWASP/权限/加密/审计 | permission/auth/security | Gate1 安全 |
| T-03 数据库专家 | ORM/查询优化/索引/shard | database/all | Gate3 数据 |
| T-04 AI/ML专家 | 推荐/诊断/排班引擎 | ai-content/campaign/insight | Gate3 AI |
| T-05 性能工程师 | 缓存/并发/Redis/负载 | performance/monitoring/gateway | Gate3 数据 |
| T-06 前端架构师 | 组件化/SSR/状态管理 | ui/storefront-web/admin-web | Gate1 架构 |
| T-07 测试架构师 | 测试策略/覆盖率/L1-L3 | 全模块 | Gate1 测试 |
| T-08 DevOps | CI/CD/部署/监控 | deploy/canary/chaos | Gate1 运维 |
| T-09 API设计师 | RESTful/OpenAPI/版本 | open-api/api/webhook | Gate1 API |
| T-10 消息专家 | 队列/事件/WebSocket | queue/notification/push | Gate3 数据 |

### 🏪 业务层 (14人) — 事中同僚评审+事后验收

| 专家 | 专长 | 参与模块 | 门 |
|------|------|----------|:--:|
| B-01 👔 店长 | 门店运营/收银/排班 | cashier/member/reservation | Gate2 业务 |
| B-02 🛒 前台收银 | POS/会员开卡/充值 | cashier/member-level/points | Gate2 业务 |
| B-03 👥 HR | 员工管理/排班/培训 | rbac/permission/runbook | Gate2 业务 |
| B-04 🔧 安监 | 门闸/监控/设备 | security/device-adapter/iot | Gate2 业务 |
| B-05 🎮 导玩员 | 赛事/盲盒/活动 | tournament/blindbox/market | Gate2 业务 |
| B-06 🎯 运行专员 | 系统运行/监控/告警 | monitoring/performance/health | Gate2 业务 |
| B-07 🤝 团建经理 | 团购/预约/活动 | reservation/marketing/campaign | Gate2 业务 |
| B-08 📢 营销专员 | 促销/优惠券/推送 | marketing/push/referral | Gate2 业务 |
| B-09 💰 财务 | 支付/退款/结算 | payment-gateway/finance/transactions | Gate5 财务 |
| B-10 📦 采购 | 设备/库存/供应商 | inventory/multimedia/iot | Gate2 业务 |
| B-11 🏢 招商 | 商户入驻/联盟/分成 | alliance/saas-advanced/svip | Gate2 业务 |
| B-12 📊 数据分析 | 报表/指标/BI | analytics/report/marketing-metrics | Gate5 财务 |
| B-13 🎟️ 票务 | 门票/会员/套餐 | member/member-level/license-package | Gate2 业务 |
| B-14 ⚖️ 合规 | 法务/数据保护/GDPR | compliance/audit/tenant | Gate5 合规 |

### 👤 用户层 (10人) — 事中体验评审+事后验收

| 专家 | 专长 | 参与模块 | 门 |
|------|------|----------|:--:|
| U-01 🎮 玩家 | 盲盒/赛事/积分体验 | blindbox/tournament/points | Gate4 体验 |
| U-02 🎂 家庭用户 | 亲子/团购/活动 | reservation/marketing/referral | Gate4 体验 |
| U-03 🧑‍💻 店长(租户) | SaaS后台/配置/报表 | saas-advanced/tenant/portal | Gate4 体验 |
| U-04 🧑‍🔧 运维员 | 系统管理/日志/监控 | monitoring/audit/health-dashboard | Gate4 体验 |
| U-05 🧑‍🎤 社交达人 | 抖音/小红书/分享 | social/cx-constraints/insight | Gate4 体验 |
| U-06 🧑‍💼 企业HR | 团建/员工福利 | reservation/runbook/ | Gate4 体验 |
| U-07 🧑‍🎓 学生 | 优惠/积分/兑换 | points/member-level/ | Gate4 体验 |
| U-08 🧑‍🤝‍🧑 陪同家长 | 安全/时间/花费 | security/iot/cx-constraints | Gate4 体验 |
| U-09 🧑‍💻 开发者 | API/Webhook/SDK | open-api/webhook/sandbox | Gate4 体验 |
| U-10 🧑‍🔬 测试员 | 功能/异常/边界 | 全模块盲测 | Gate4 体验 |

### 🏛️ 监督层 (6人) — 事后验收+签署

| 专家 | 专长 | 参与模块 | 门 |
|------|------|----------|:--:|
| S-01 🏛️ 审计师 | 操作日志/数据追溯 | audit/compliance/observability | Gate6 审计 |
| S-02 ⚖️ 监管合规 | 数据保护/隐私/法规 | compliance/tenant/security | Gate5 合规 |
| S-03 🧾 财务审计 | 交易/流水/对账 | finance/transactions/payment-gateway | Gate5 财务 |
| S-04 📋 质量保证 | QA流程/缺陷跟踪 | 全模块 | Gate6 QA |
| S-05 📑 文档审计 | 知识库/API文档/代码注释 | 知识库整体 | Gate6 文档 |
| S-06 🏢 治理 | 架构合规/技术债务 | 全模块决策 | Gate6 治理 |

## 二、6道专家检查门

### Gate1 🏗️ 架构+安全+测试 — 事前验证
- [ ] 模块依赖无循环引用
- [ ] 接口设计符合RESTful规范
- [ ] 安全基线检查通过（权限校验/输入验证）
- [ ] 测试策略文档完整
- [ ] 模块边界清晰无泄漏

### Gate2 🏪 业务+用户 — 事中验证
- [ ] 业务流程覆盖8角色
- [ ] 核心业务路径≤30秒
- [ ] 角色权限映射完整
- [ ] 业务异常处理完整（余额不足/超时/并发）
- [ ] 业务规则与文档一致

### Gate3 📊 数据+AI — 事中验证
- [ ] 数据模型符合存储规范
- [ ] 查询有适当索引覆盖
- [ ] AI模型输入/输出契约完整
- [ ] 数据一致性策略实现
- [ ] 缓存策略合理

### Gate4 👤 用户体验+租户 — 事后验证
- [ ] 加载状态/空状态/错误状态覆盖
- [ ] 移动端适配（如适用）
- [ ] 国际化支持
- [ ] 多租户隔离测试通过
- [ ] 无障碍基础检查

### Gate5 💰 合规+财务 — 事后验证
- [ ] 交易数据完整审计日志
- [ ] 退款/支付流程有状态机
- [ ] PII数据处理合规
- [ ] 财务报表一致性
- [ ] 数据保留策略符合法规

### Gate6 🏛️ 审计+监管 — 签署验收
- [ ] 操作日志可追溯
- [ ] QA测试报告完整
- [ ] 知识库更新完成
- [ ] 技术债务已记录
- [ ] 签署人确认

## 三、每日三会机制

### 09晨会 🏗️ 技术层 (10人)
产出: 评审报告 → docs/knowledge/expert-team/morning-review-YYYY-MM-DD.md
内容:
- 今日技术类任务评审
- 架构合规检查
- 安全基线复核

### 15午会 🏪 业务层(14)+用户层(10) (24人)
产出: 评审报告 → docs/knowledge/expert-team/afternoon-review-YYYY-MM-DD.md
内容:
- 业务流完整性检查
- 用户体验评审
- 模块验收复审

### 20晚会 🏛️ 全体40人+监督层(6)
产出: 签署报告 → docs/knowledge/expert-team/evening-signoff-YYYY-MM-DD.md
内容:
- 今日全部产出验收
- 6道门状态汇总
- 签署/退回/待修标记

## 四、模块-专家映射（每位专家参与哪些模块）

每个模块指派3位专家（1技术+1业务+1用户/监督），组成3人评审小组。

评审小组负责:
- 事前 — 审核测试计划（5分钟review）
- 事中 — 抽查代码质量（10分钟review）
- 事后 — 签署验收（5分钟sign-off）
