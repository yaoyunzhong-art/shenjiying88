# 📊 API模块全量归类审计清单

> 审计时间: 2026-07-14 10:42
> 审计范围: apps/api/src/modules/ 共 **101** 个模块
> 已映射Phase: 10个 (P-30/31/35/36/37/38/47/48/49/53)

---

## 一、已有Phase映射

| 模块 | Phase | 描述 | 代码量(ts文件) | 状态 |
|:-----|:-----:|:-----|:--------------:|:----:|
| cashier | P-35 | 收银台：订单/支付/退款/LYT桥接 | 61 | 🟢 开发中 |
| member | P-36 | 会员中心：会员档案/审批/积分 | 46 | 🟢 开发中 |
| inventory | P-37 | 库存采购：入库/出库/调拨/盘点 | 47 | ⬜ 待开发 |
| finance | P-38 | 财务对账：日结报表/退款/对账/异常标记 | 57 | 🟡 已实现，已纳入 PRD-007 圈梁 |
| coupon | P-48 | 联名券：AI自动发放/核销/活动统计 | 27 | ⬜ 待开发 |
| loyalty | P-48 | 忠诚度计划：积分/盲盒/优惠券计划 | 22 | ⬜ 待开发 |
| brand-custom | P-47 | 品牌运营：品牌定制/主题/域名/邮件模板 | 20 | 🟡 已实现，已纳入 PRD-012 圈梁 |
| marketing | P-47 | 品牌运营：品牌活动/A-B/ROI/归因/触达 | 37 | 🟡 已实现，已纳入 PRD-012 圈梁 |
| content | P-47 | 品牌运营：官网内容管理/发布/归档/搜索 | 18 | 🟡 已实现，已纳入 PRD-012 圈梁 |
| tenant | P-31 | 多租户隔离：租户上下文/隔离守护 | 45 | 🟡 已实现，已纳入 PRD-011 圈梁 |
| tenant-config | P-31 | 租户配置：多级配置/缓存/脱敏/角色访问 | 23 | 🟡 已实现，已纳入 PRD-011 圈梁 |
| deploy | P-53 | 部署管理：部署计划/Helm/成本估算 | 20 | ⬜ 待开发 |
| open-api | P-49 | 开放平台：OAuth2/API密钥/签名验证 | 17 | 🟡 已实现，已纳入 PRD-016 圈梁 |
| openapi | P-49 | 开放平台二代：API Key生成/密钥管理 | 46 | 🟡 已实现，已纳入 PRD-016 圈梁 |
| tenant-llm | P-49 | 智能体接入：租户LLM网关/多语言地理服务 | 24 | 🟡 已实现，已纳入 PRD-014 圈梁 |
| bootstrap | — | 启动引导：租户引导/基础依赖 -> P-53关联 | 19 | 🔗 关联P-53 |

---

## 二、无Phase映射（需新建Phase/补充映射）

### 业务核心类

| 模块 | 描述 | 代码量 | 建议归类 |
|:-----|:-----|:------:|:---------|
| agent | 智能体框架：A/B测试/RAG编排/实验管理 | 48 | P-49 (开放平台/AI) |
| alliance | 联盟/合作管理 | 25 | 业务 → 新建P-X |
| blindbox | 盲盒模块：盲盒计划/概率/抽奖 | 22 | P-48 (联名券/忠诚度)延伸 |
| campaign | 营销活动：活动创建/触达/配额 | 24 | P-47 (品牌运营)延伸 |
| champion | 冠军/排行榜：排行/知识图谱 | 20 | 业务 → 新建P-X |
| commerce(参照lyt) | LYT电商桥接：HTTP适配/Sandbox配置 | 39 | P-35 (收银)延伸 |
| cross-module | 跨模块E2E测试：10条全链路 | 55 | 测试基础设施 |
| leads | 线索管理：线索/分配规则 | 19 | 业务 → 新建P-X |
| license | 付费授权：许可/激活/验证 | 30 | 业务 → 新建P-X |
| license-package | 授权套餐管理 | 19 | 业务(license延伸) |
| license-renewal | 授权续期管理 | 22 | 业务(license延伸) |
| lowcode | 低代码页面构建/告警 | 25 | 🔧 基础设施 |
| lyt | LYT收银桥接:LYT对接/资金流 | 39 | P-35 (收银)延伸 |
| logistics | SSE后勤：巡检任务/提醒/结果记录 | 5 | P-30 (SSE后勤)核心 |
| market | 市场/区域配置:市场Profile/区域覆盖 | 19 | 🔧 基础设施 |
| marketing-metrics | 营销指标:快照/Prometheus导出/汇总 | 19 | P-47 (品牌运营)延伸 |
| member-level | 会员等级管理 | 20 | P-36 (会员)延伸 |
| payment-gateway | 支付网关:支付渠道/交易 | 19 | P-35 (收银/支付)延伸 |
| points | 积分系统:原子操作/积分转账 | 19 | P-36/48 延伸 |
| portal | 门户管理:租户Portal/Bootstrap | 20 | 🔧 基础设施 |
| referral | 推荐/裂变:微信分享/小程序扫码 | 20 | 业务 → 新建P-X |
| reservation | SSE后勤底座：时间安排/状态流转/冲突检测（当前仍偏预约域） | 19 | P-30 (SSE后勤)底座 |
| saas-advanced | SaaS高级功能:自定义域名/高级功能 | 24 | P-31 (多租户)延伸 |
| saas-billing | SaaS计费:账单/计量 | 17 | P-31 (多租户)延伸 |
| scout | 选址/侦察:城市/区域查询 | 4 | 业务 → 新建P-X |
| svip | SVIP超级会员:SVIP计划/订阅/权益 | 18 | P-36 (会员)延伸 |
| tournament | 赛事/竞赛:日/周/月/城市赛事 | 24 | 业务 → 新建P-X |
| transactions | 交易聚合:退款/快照/聚合 | 17 | P-35 (收银)延伸 |
| workbench | 工作台:品牌/市场/门店工作台 | 23 | P-36/47 延伸 |

### AI/智能类

| 模块 | 描述 | 代码量 | 建议归类 |
|:-----|:-----|:------:|:---------|
| ai-content | AI内容生成:团建报告/视频去重/审核 | 20 | 🧠 AI → 新建P-49/AI |
| ai-cs | AI客服:情感分析/意图分类/工单 | 39 | 🧠 AI → 新建P-49/AI |
| ai-diagnosis | AI诊断:因果推断/根因分析/规则冲突 | 24 | 🧠 AI → 新建P-49/AI |
| ai-forecast | AI预测:需求预测/库存优化/调拨 | 35 | 🧠 AI → 新建P-49/AI |
| ai-insight | AI洞察:异常检测/指标关联/归因 | 24 | 🧠 AI → 新建P-49/AI |
| ai-marketing | AI营销:归因分析/投放优化/漏斗 | 29 | 🧠 AI → 新建P-49/AI |
| ai-model-config | AI模型配置:版本管理/高级配置 | 32 | 🧠 AI → 新建P-49/AI |
| ai-push | AI推送:会员分群/时机优化/AB测试 | 30 | 🧠 AI → 新建P-49/AI |
| ai-rag | AI RAG检索增强:混合检索/重排序/文档理解 | 25 | 🧠 AI → 新建P-49/AI |
| ai-recommend | AI推荐引擎:协同/内容/混合推荐 | 19 | 🧠 AI → 新建P-49/AI |
| ai-review | AI客服审查(Stub):高级客服服务桩 | 32 | 🧠 AI → 新建P-49/AI |
| ai-reviewer | AI代码审查器:审查会话/发现/配置 | 18 | 🧠 AI → 新建P-49/AI |
| ai-rule-engine | AI规则引擎:策略规则/AI Provider | 24 | 🧠 AI → 新建P-49/AI |
| ai-sales | AI销售副驾:推荐/异议处理/跟进 | 26 | 🧠 AI → 新建P-49/AI |
| aiops | AIOps智能运维:异常检测/自愈/DDoS防御 | 23 | 🧠 AI → 新建P-49/AI |
| anomaly-detector | 异常检测:独立异常检测引擎 | 19 | 🧠 AI → 新建P-49/AI |
| edge | Edge AI边缘推理:设备管理/离线识别/模型缓存 | 19 | 🧠 AI → 新建P-49/AI |
| federated-learning | 联邦学习:联邦训练/隐私保护 | 18 | 🧠 AI → 新建P-49/AI |
| image-recognition | 图像识别:识别任务/视觉搜索/重复检测 | 18 | 🧠 AI → 新建P-49/AI |
| knowledge | 知识库:文档解析/多格式支持 | 29 | 🧠 AI → 新建P-49/AI |
| multimodal-fusion | 多模态融合:跨模态搜索/置信度融合 | 18 | 🧠 AI → 新建P-49/AI |
| ocr | OCR识别:识别任务/文档解析 | 18 | 🧠 AI → 新建P-49/AI |
| recommend | 推荐(非AI版):通用推荐引擎 | 39 | 🧠 AI → 新建P-49/AI |
| recommender | 推荐(另一版):推荐适配/召回 | 22 | 🧠 AI → 新建P-49/AI |
| retrieval | 检索服务:检索健康/检索适配 | 24 | 🧠 AI → 新建P-49/AI |
| voice-processing | 语音处理:语音识别/合成 | 18 | 🧠 AI → 新建P-49/AI |

### 基础设施类

| 模块 | 描述 | 代码量 | 建议归类 |
|:-----|:-----|:------:|:---------|
| audit | 审计日志:审计控制器/日志记录 | 17 | 🔧 基础设施 |
| auth | 统一认证:短信/密码/微信/令牌/会话 | 23 | 🔧 基础设施 |
| auto-rollback | 自动回滚:部署回滚引擎 | 18 | 🔧 P-53 (DevOps)延伸 |
| canary | 金丝雀发布:灰度/AB流量 | 19 | 🔧 P-53 (DevOps)延伸 |
| cdn-cache | CDN缓存管理:缓存策略/预加载 | 20 | 🔧 基础设施 |
| chain | 链/区块链相关:区块链接口 | 22 | 🔧 基础设施 |
| chaos | 混沌工程:故障注入/实验/回滚 | 18 | 🔧 基础设施 |
| compliance | 合规审计:Append-Only审计日志/Hash链 | 33 | 🔧 基础设施 |
| currency | 货币/汇率:转换/汇率管理 | 18 | 🔧 基础设施 |
| db-knowledge | 数据库知识库:知识查询/降级 | 8 | 🔧 基础设施 |
| device-adapter | 设备适配器:设备接入/协议适配 | 18 | 🔧 基础设施 |
| docs | API文档:Swagger生成/文档导出 | 18 | 🔧 基础设施 |
| e2e-auto-gen | E2E自动生成:测试生成/自动运行 | 24 | 🔧 测试基础设施 |
| foundation | 基础架构:商业化计费/审批/模块注册/治理 | 166 | 🔧 **基础设施核心** |
| gateway | API网关:网关分析/请求日志/限流 | 18 | 🔧 基础设施 |
| health | 健康检查:组件健康/探活 | 19 | 🔧 基础设施 |
| health-dashboard | 健康看板:健康指标可视化 | 22 | 🔧 基础设施 |
| i18n | 国际化:多语言/翻译服务 | 24 | 🔧 基础设施 |
| insight | 智能分析:分析洞察/模板 | 19 | 🔧 P-35/36 辅助 |
| iot | IoT物联网:MQTT/心跳/OTA升级 | 21 | 🔧 基础设施 |
| lineage | 字段血缘追踪:字段级引用追踪 | 22 | 🔧 基础设施 |
| locale | 本地化:国家/时区/区域设置 | 18 | 🔧 基础设施 |
| monitoring | 监控:指标/告警/可观测性 | 21 | 🔧 基础设施 |
| multi-region | 多区域:故障切换/区域路由 | 19 | 🔧 基础设施 |
| multimedia | 多媒体:多媒体处理 | 20 | 🔧 基础设施 |
| notification | 通知:模板/分发/事件总线 | 18 | 🔧 基础设施 |
| observability | 可观测性:警报引擎/指标/规则 | 50 | 🔧 基础设施 |
| omnichannel | 全渠道:渠道统一/兼容 | 19 | 🔧 基础设施 |
| ops-manual | 运营手册:手册生成/管理 | 20 | 🔧 基础设施 |
| perf-monitor | 性能监控:性能跟踪/监控 | 19 | 🔧 基础设施 |
| performance | 性能优化:缓存分层/TTL/逐出 | 23 | 🔧 基础设施 |
| permission | 权限管理:数据范围/权限上下文 | 22 | 🔧 基础设施 |
| push | 消息推送:推送记录/模板/WebSocket | 19 | 🔧 基础设施 |
| queue | 排队系统:排队/叫号/状态转移 | 19 | 🔧 基础设施 |
| rbac | RBAC权限:角色/权限分配/管理 | 17 | 🔧 基础设施 |
| realtime | 实时服务:实时数据推送 | 20 | 🔧 基础设施 |
| report | 报表/看板:报表定义/看板/数据点 | 18 | 🔧 基础设施 |
| reports | 报表聚合:多维聚合引擎/汇总 | 43 | 🔧 基础设施 |
| runbook | 运维手册:故障处理手册/预案 | 20 | 🔧 基础设施 |
| sandbox | 沙箱/ISV:ISV应用/沙箱环境/SDK | 20 | 🔧 基础设施 |
| security | 安全:漏洞扫描/JWT/注入检测 | 18 | 🔧 基础设施 |
| session | 会话管理:会话生命周期/设备绑定 | 20 | 🔧 基础设施 |
| shared | 共享工具:审计/通用服务 | 24 | 🔧 基础设施 |
| tenant-config | 租户配置:租户个性化配置 | 22 | 🔧 P-31延伸 |
| time-series | 时序数据:采集器/时序管理 | 19 | 🔧 基础设施 |
| training | 培训管理:课程/报名/进度 | 20 | 🔧 基础设施 |
| webhook | Webhook:端点注册/事件投递/重试 | 21 | 🔧 基础设施 |

---

## 三、汇总统计

### 按分类

| 分类 | 模块数 | 代码量(ts文件) | 占比 |
|:----|:------:|:------------:|:----:|
| **已有Phase** | 12 | 431 | 17.6% |
| ├ P-35 收银 | 3 (cashier, lyt, payment-gateway) | 119 | 4.9% |
| ├ P-36 会员 | 3 (member, member-level, svip) | 84 | 3.4% |
| ├ P-37 库存 | 1 (inventory) | 47 | 1.9% |
| ├ P-38 财务 | 1 (finance) | 57 | 2.3% |
| ├ P-47 品牌运营 | 4 (brand-custom, marketing, marketing-metrics, content) | 104 | 4.2% |
| ├ P-48 联名券 | 2 (coupon, loyalty/blindbox) | 49 | 2.0% |
| ├ P-31 多租户 | 3 (tenant, saas-advanced, saas-billing) | 85 | 3.5% |
| ├ P-49 开放平台 | 4 (open-api, openapi, tenant-llm, agent) | 135 | 5.5% |
| ├ P-53 DevOps | 1 (deploy + auto-rollback + canary) | 57 | 2.3% |
| ├ P-30 SSE后勤 | 2 (logistics, reservation) | 24 | 1.0% |
| | | | |
| **业务核心(待新Phase)** | 16 | 321 | 13.1% |
| **AI/智能(待新Phase)** | 24 | 558 | 22.7% |
| **基础设施** | 49 | 1063 | 43.3% |
| **其他/专项** | 0 | 0 | 0% |
| **总计** | **101** | **2453** | **100%** |

### 建议新建Phase

| 建议Phase | 覆盖模块 | 说明 |
|:---------|:---------|:-----|
| P-49 (已有) | ai-content ~ ai-sales 等24个AI模块 | 已有P-49，但AI模块规模超出现有范围 |
| P-54 | license/license-package/license-renewal | 授权/计费核心 |
| P-55 | alliance/leads/scout/tournament/champion | 联盟/线索/选址/赛事 |
| P-56 | referral/training | 推荐/培训 |
| P-57 | audit/compliance/security | 安全合规 |
| P-58 | monitoring/observability/health/perf-monitor | 可观测性体系 |

---

## 四、关键发现

1. **基础设施模块占比最高(43.3%)** — foundation(166文件)、observability(50)、cross-module(55)等核心基础设施需要稳定归类
2. **AI模块规模庞大(22.7%, 558文件)** — 24个AI相关模块远超P-49现有边界，建议扩建P-49或新建P-AI
3. **P-30 SSE后勤已补 logistics 巡检主链** — `RQ-30-01` 已闭环，`reservation` 仍作为维修/排班可复用底座
4. **扩展归类** — member-level/svip/loyalty等已映射模块的扩展子功能，建议在Phase内标记为子模块
5. **cross-module** 55个跨模块E2E测试文件，建议归类到测试基础设施
