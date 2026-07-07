# V12 Sprint 任务拆解 (Tasks)

> 18 Sprint × 5 天 = 90 任务日  
> 每个 Day 一个原子化任务, 每个 Sprint 一个 HEARTBEAT

---

## Sprint 1 (Day 49-53, 2026-06-28 → 2026-07-02) 业务基础 · 会员 + 盲盒

### T104-1 [Day 49, member-level-system]
**Phase 104-A**: 会员等级体系 (6阶18级 + 成长值五大来源)
- 文件: `apps/api/src/modules/member/member-level.service.ts` (~250 行)
- 文件: `apps/api/src/modules/member/member-level.entity.ts` (~80 行)
- 文件: `apps/api/src/modules/member/member-level.test.ts` (28 tests)
- DTO: CreateLevelDto / UpgradeDto / GrowthValueDto
- 接口: GET /member/level/:id / POST /member/level/upgrade / GET /member/level/progress
- 责任: 树哥A

### T104-2 [Day 50, svip-subscription]
**Phase 104-B**: SVIP 付费订阅 + 会员休眠策略
- 文件: `apps/api/src/modules/svip/svip.service.ts` (~200 行)
- 文件: `apps/api/src/modules/svip/svip.entity.ts` (~60 行)
- 文件: `apps/api/src/modules/svip/svip.test.ts` (22 tests)
- 落地: P0-4 SVIP 提醒升级 P1 推送 / P1-4 成长值衰减 / P1-14 SVIP 阶梯优惠 / P2-8 等级维持条件
- 责任: 树哥B

### T105-1 [Day 51, blindbox-engine]
**Phase 105-A**: BlindBox 引擎 (四级奖池 + 概率公示 + 端盒保底)
- 文件: `apps/api/src/modules/blindbox/blindbox.service.ts` (~280 行)
- 文件: `apps/api/src/modules/blindbox/blindbox.entity.ts` (~80 行)
- 文件: `apps/api/src/modules/blindbox/blindbox.test.ts` (30 tests)
- 落地: P0-5 Redis Lua 原子操作
- 责任: 树哥A

### T104-3 [Day 52, member-center-frontend]
**Phase 104-U**: MemberCenter 会员中心前台
- 文件: `packages/ui/src/member-center/` (6 文件)
- 类型 + hooks + mock + 组件 + index + test
- 20 tests (等级进度 + SVIP 开通 + 积分明细 + 跨店)
- 责任: 树哥C

### T105-2 [Day 53, blindbox-showcase-frontend]
**Phase 105-U**: BlindBoxShowcase + 整合 + HEARTBEAT-55
- 文件: `packages/ui/src/blindbox-showcase/` (6 文件)
- 25 tests (奖池展示 + 概率 + 抽盒动画 + 记录)
- HEARTBEAT part-55
- 责任: 树哥C

---

## Sprint 2 (Day 54-58) 业务基础 · 收银 + 积分

### T106-1 [Day 54, cashier-offline-mode]
**Phase 106-A**: Cashier 升级 (离线模式 + 多渠道 + 退款)
- 文件: `apps/api/src/modules/cashier/cashier.service.ts` 扩展 (~150 行新增)
- 26 tests
- 责任: 树哥A

### T106-2 [Day 55, cashier-edge-sync]
**Phase 106-B**: 离线收银边缘计算
- 文件: `apps/api/src/modules/cashier/offline-sync.service.ts` (~180 行)
- 18 tests
- 落地: P1-2 LYT Webhook 异步确认 / P1-12 数据同步幂等性
- 责任: 树哥B

### T107-1 [Day 56, points-risk-control]
**Phase 107-A**: Points 风控 (熔断 + 通胀实时 + 过期提醒 5 次)
- 文件: `apps/api/src/modules/points/points-risk.service.ts` (~220 行)
- 30 tests
- 落地: P0-6 通胀实时预警 / P2-7 熔断机制 / P1-6 过期提醒 5 次
- 责任: 树哥A

### T107-2 [Day 57, points-redis-lua]
**Phase 107-B**: 积分 Redis Lua 原子操作 + 配置校验
- 文件: `apps/api/src/modules/points/points-atomic.service.ts` (~150 行)
- 20 tests
- 落地: P0-10 配置合理性校验
- 责任: 树哥B

### T106-3 [Day 58, cashier-pos-frontend]
**Phase 106-U**: CashierPOS 收银前台 + HEARTBEAT-56
- 24 tests
- 责任: 树哥C

---

## Sprint 3 (Day 59-63) 业务基础 · 优惠券 + 赛事

### T108-1 [Day 59, coupon-alliance]
**Phase 108-A**: Coupon 联盟券 (跨店 + 满减阶梯 + AI 发放)
- 28 tests
- 责任: 树哥A

### T108-2 [Day 60, coupon-ai-distribute]
**Phase 108-B**: 优惠券 AI 自动发放引擎
- 18 tests
- 责任: 树哥B

### T109-1 [Day 61, tournament-l1-l4]
**Phase 109-A**: Tournament L1-L4 (日常+周擂台+月度+城市)
- 32 tests
- 落地: P1-9 让分机制 / P1-17 短信高峰预发
- 责任: 树哥A

### T109-2 [Day 62, tournament-l5-l7]
**Phase 109-B**: Tournament L5-L7 + 让分机制完整化
- 22 tests
- 落地: P1-3 等待时间预估 / P2-3 繁忙指数 / P2-9 取号幂等性
- 责任: 树哥B

### T108-3 + T109-3 [Day 63, frontends]
**Phase 108/109-U**: 优惠券 + 赛事前台 + HEARTBEAT-57
- 28 tests
- 责任: 树哥C

---

## Sprint 4 (Day 64-68) 基础设施 I

### T119-1 [Day 64, clickhouse]
**Phase 119-A**: ClickHouse Docker + Prisma 桥接 + 数据管道
- 14 tests
- 责任: 树哥A

### T119-2 [Day 65, qdrant]
**Phase 119-B**: Qdrant 向量数据库 + embedding 写入
- 16 tests
- 责任: 树哥A

### T119-3 [Day 66, rabbitmq]
**Phase 119-C**: RabbitMQ 事件总线 + 业务模块解耦
- 18 tests
- 责任: 树哥B

### T119-4 [Day 67, ollama]
**Phase 119-D**: Ollama Qwen2.5:14b 本地模型 + RAG 集成
- 14 tests
- 责任: 树哥B

### T119-5 [Day 68, infra-e2e]
**Phase 119-T**: Infra E2E 集成测试 + HEARTBEAT-58
- 22 tests
- 责任: 树哥A + B

---

## Sprint 5 (Day 69-73) 商业化 · 进销存 + 财务

### T110-1 [Day 69, inventory-product]
**Phase 110-A**: Inventory 商品中心 + SKU 关联 LYT
- 26 tests
- 责任: 树哥A

### T110-2 [Day 70, inventory-mgmt]
**Phase 110-B**: 采购 + 库存 + 盘点 + 跨店调拨
- 24 tests
- 落地: P1-13 调拨成本模型
- 责任: 树哥B

### T111-1 [Day 71, finance-ai-booking]
**Phase 111-A**: Finance AI 自动记账 + 自动对账
- 22 tests
- 落地: P0-7 联名分账退货扣减
- 责任: 树哥A

### T111-2 [Day 72, finance-dashboard]
**Phase 111-B**: 门店损益看板 + 品牌级损益表
- 18 tests
- 落地: P2-1 内部往来凭证 / P2-11 分账状态流转日志
- 责任: 树哥B

### T110-3 + T111-3 [Day 73, frontends]
**Phase 110/111-U**: Inventory 前台 + FinanceDashboard 前台 + HEARTBEAT-59
- 24 tests
- 责任: 树哥C

---

## Sprint 6 (Day 74-78) 异业联盟 + 全渠道

### T112-1 [Day 74, alliance-grading]
**Phase 112-A**: Alliance 20 伙伴 + S/A/B/C 分级 + 健康度预警
- 28 tests
- 落地: P1-10 联盟分级 / P2-2 低效伙伴预警
- 责任: 树哥A

### T112-2 [Day 75, alliance-settlement]
**Phase 112-B**: 异业分账 + 未关联订单补录 + 跨商户关联异常检测
- 24 tests
- 落地: P0-8 跨商户关联 / P1-18 未关联订单补录 / P2-12 用户行为分析
- 责任: 树哥B

### T112-3 [Day 76, omnichannel]
**Phase 112-C**: 全渠道触达 P0-P3 + 短信双通道 + 海外邮件
- 20 tests
- 落地: P0-3 短信双通道 / P1-7 海外邮件 / P1-8 iOS 推送优先级
- 责任: 树哥A

### T112-4 [Day 77, push-realtime]
**Phase 112-D**: iOS 推送 + WebSocket 重连 + LYT Webhook 异步
- 18 tests
- 落地: P1-1 WebSocket 重连
- 责任: 树哥B

### T112-5 [Day 78, alliance-frontend]
**Phase 112-U**: AllianceDashboard 前台 + HEARTBEAT-60
- 26 tests
- 责任: 树哥C

---

## Sprint 7 (Day 79-83) AI 营销

### T113-1 [Day 79, ai-marketing-cmo]
**Phase 113-A**: AI Marketing 营销参谋 (ROI + 文案)
- 26 tests
- 责任: 树哥A

### T113-2 [Day 80, ai-push]
**Phase 113-B**: AI 精准推送 (分群 + 时机 + A/B)
- 22 tests
- 责任: 树哥B

### T113-3 [Day 81, ai-recommend]
**Phase 113-C**: 协同过滤推荐 + 用户画像
- 18 tests
- 落地: P2-15 协同过滤
- 责任: 树哥A

### T113-4 [Day 82, lowcode-audit]
**Phase 113-D**: 低代码页面 + 实时审计告警 (阈值 2%)
- 16 tests
- 落地: P2-14 低代码 / P1-5 审计阈值
- 责任: 树哥B

### T113-5 [Day 83, ai-marketing-frontend]
**Phase 113-U**: AIMarketing 前台 + HEARTBEAT-61
- 24 tests
- 责任: 树哥C

---

## Sprint 8 (Day 84-88) AI 导购 + AI 预测

### T114-1 [Day 84, ai-sales-copilot]
**Phase 114-A**: AI Sales 导购副驾 (推荐 + 异议 + 跟进)
- 26 tests
- 落地: P1-15 生日特效倒计时 / P1-20 入场特效预加载
- 责任: 树哥A

### T114-2 [Day 85, ai-rag]
**Phase 114-B**: RAG 知识库 + NLP 话术生成 + Chunk 优化
- 22 tests
- 责任: 树哥B

### T115-1 [Day 86, ai-forecast]
**Phase 115-A**: AI 需求预测 (销量 + 库存 + 调拨)
- 20 tests
- 落地: P1-13 调拨三项成本 / P2-5 设备状态校验
- 责任: 树哥A

### T114-3 [Day 87, ai-content]
**Phase 114-C**: 团建报告 AI + 裁判审核 + AI 剪辑去重
- 18 tests
- 落地: P1-16 团建 AI+审核 / P2-4 画面去重 / P2-6 进步幅度
- 责任: 树哥B

### T114-4 [Day 88, ai-frontend]
**Phase 114-U**: AISalesPanel + 团建报告前台 + HEARTBEAT-62
- 28 tests
- 责任: 树哥C

---

## Sprint 9 (Day 89-93) 硬件 + 边缘

### T120-1 [Day 89, iot-abstract]
**Phase 120-A**: IoT 硬件抽象 (ESP32 + MQTT + 自适应心跳)
- 22 tests
- 落地: P1-19 自适应心跳
- 责任: 树哥A

### T120-2 [Day 90, iot-ota]
**Phase 120-B**: OTA 空中升级 + 设备状态校验 + 工单转派
- 18 tests
- 落地: P2-5 设备状态校验 / P2-10 工单自动转派 / P2-13 硬件健康度
- 责任: 树哥B

### T123-1 [Day 91, edge-offline]
**Phase 123-A**: Edge 边缘计算 (离线取号 + 时间同步)
- 24 tests
- 落地: P1-11 离线取号
- 责任: 树哥A

### T123-2 [Day 92, edge-ai]
**Phase 123-B**: Edge AI 推理 (轻量模型 + 离线识别)
- 16 tests
- 责任: 树哥B

### T120-3 + T123-3 [Day 93, e2e]
**Phase 120/123-T**: IoT + Edge E2E + HEARTBEAT-63
- 22 tests
- 责任: 树哥A + B

---

## Sprint 10 (Day 94-98) 协同 + 数据血缘

### T126-1 [Day 94, crdt]
**Phase 126-A**: Realtime CRDT + WebSocket + 多设备同步
- 22 tests
- 责任: 树哥A

### T126-2 [Day 95, collab]
**Phase 126-B**: 协同编辑 + 在线状态 + 冲突解决
- 18 tests
- 责任: 树哥B

### T125-1 [Day 96, lineage]
**Phase 125-A**: DataLineage 数据血缘 (字段级 + 影响)
- 22 tests
- 责任: 树哥A

### T125-2 [Day 97, sensitive]
**Phase 125-B**: 敏感数据流 + 自动分类 + 合规
- 16 tests
- 责任: 树哥B

### T125-3 + T126-3 [Day 98, e2e]
**Phase 125/126-T**: Realtime + Lineage E2E + HEARTBEAT-64
- 24 tests
- 责任: 树哥C

---

## Sprint 11 (Day 99-103) AIOps + 区块链

### T124-1 [Day 99, aiops-prediction]
**Phase 124-A**: AIOps 异常预测 (时序 + 自愈)
- 22 tests
- 责任: 树哥A

### T124-2 [Day 100, chaos]
**Phase 124-B**: 混沌工程 (故障注入 + 自动回滚)
- 18 tests
- 责任: 树哥B

### T122-1 [Day 101, chain-hash]
**Phase 122-A**: Chain-Audit 操作不可篡改 (哈希链 + Merkle)
- 22 tests
- 责任: 树哥A

### T122-2 [Day 102, chain-contract]
**Phase 122-B**: 智能合约工作流 (积分清算 + 分账)
- 16 tests
- 责任: 树哥B

### T122-3 + T124-3 [Day 103, e2e]
**Phase 122/124-T**: AIOps + Chain E2E + HEARTBEAT-65
- 24 tests
- 责任: 树哥C

---

## Sprint 12 (Day 104-108) 开放平台

### T116-1 [Day 104, gateway]
**Phase 116-A**: OpenAPI 网关 (统一路由 + 限流 + API Key)
- 26 tests
- 落地: P0-9 API 网关 IP 注入
- 责任: 树哥A

### T116-2 [Day 105, sandbox-isv]
**Phase 116-B**: 沙箱 + ISV 应用商店 + SDK 多语言
- 24 tests
- 责任: 树哥B

### T116-3 [Day 106, webhook]
**Phase 116-C**: Webhook 配置 + 事件订阅 + 重试
- 18 tests
- 责任: 树哥A

### T116-4 [Day 107, gateway-ip]
**Phase 116-D**: API 网关 IP 注入 + 分账日志 + 配置校验
- 16 tests
- 责任: 树哥B

### T116-5 [Day 108, openapi-frontend]
**Phase 116-U**: OpenAPIPortal 前台 + HEARTBEAT-66
- 26 tests
- 责任: 树哥C

---

## Sprint 13 (Day 109-113) 国际化

### T117-1 [Day 109, i18n-text]
**Phase 117-A**: i18n 9 语言 + 本地化文案
- 18 tests
- 责任: 树哥A

### T117-2 [Day 110, multi-currency]
**Phase 117-B**: 多币种 + 汇率服务 + 自动换算
- 16 tests
- 责任: 树哥B

### T117-3 [Day 111, local-payment]
**Phase 117-C**: 本地化支付 (PayPal/Stripe/PayPay/本地钱包)
- 18 tests
- 责任: 树哥A

### T117-4 [Day 112, locale-format]
**Phase 117-D**: 时区自适应 + 日期格式 + 数字格式
- 12 tests
- 责任: 树哥B

### T117-5 [Day 113, i18n-e2e]
**Phase 117-T**: 国际化 E2E + HEARTBEAT-67
- 18 tests
- 责任: 树哥C

---

## Sprint 14 (Day 114-118) 合规 + 安全

### T118-1 [Day 114, gdpr]
**Phase 118-A**: Compliance GDPR + 数据删除权 + 用户授权
- 20 tests
- 责任: 树哥A

### T118-2 [Day 115, audit]
**Phase 118-B**: 审计追踪全链路 + 分账日志 + IP 注入
- 18 tests
- 责任: 树哥B

### T128-1 [Day 116, security-pentest]
**Phase 128-A**: Security E8 渗透测试 + 漏洞修复 + WAF
- 22 tests
- 责任: 树哥A

### T128-2 [Day 117, rbac]
**Phase 128-B**: RBAC 完整化 (5级权限 + Controller 全覆盖)
- 18 tests
- 责任: 树哥B

### T118-3 + T128-3 [Day 118, e2e]
**Phase 118/128-T**: 合规+安全 E2E + HEARTBEAT-68
- 24 tests
- 责任: 树哥C

---

## Sprint 15 (Day 119-123) 独立 SaaS

### T121-1 [Day 119, device-adapter]
**Phase 121-A**: 通用设备适配层 (POS/门闸/扫码枪)
- 22 tests
- 责任: 树哥A

### T121-2 [Day 120, brand-custom]
**Phase 121-B**: 品牌定制 (主题/Logo/域名/邮件)
- 18 tests
- 责任: 树哥B

### T121-3 [Day 121, deploy]
**Phase 121-C**: 私有化部署方案 (单机/集群/K8s Helm)
- 18 tests
- 责任: 树哥A

### T121-4 [Day 122, saas-billing]
**Phase 121-D**: 独立 SaaS 控制台 + 计费 + 配额
- 16 tests
- 责任: 树哥B

### T121-5 [Day 123, e2e]
**Phase 121-T**: 独立 SaaS E2E + HEARTBEAT-69
- 22 tests
- 责任: 树哥C

---

## Sprint 16 (Day 124-128) 性能压测

### T127-1 [Day 124, k6]
**Phase 127-A**: 性能压测 (k6 5000 VU) + 瓶颈定位
- 14 tests
- 责任: 树哥A

### T127-2 [Day 125, db-opt]
**Phase 127-B**: 读写分离 + 连接池 + 索引调优
- 16 tests
- 责任: 树哥B

### T127-3 [Day 126, cache]
**Phase 127-C**: Redis Cluster + 多级缓存 + 预聚合
- 18 tests
- 责任: 树哥A

### T127-4 [Day 127, k8s-scale]
**Phase 127-D**: Kubernetes 横向扩展 + 自动伸缩
- 14 tests
- 责任: 树哥B

### T127-5 [Day 128, perf-verify]
**Phase 127-T**: 性能基线达标验证 + HEARTBEAT-70
- 20 tests
- 责任: 树哥C

---

## Sprint 17 (Day 129-133) 文档 + 培训

### T129-1 [Day 129, api-docs]
**Phase 129-A**: API 文档自动生成 (Swagger + Redoc + 多语言)
- 14 tests
- 责任: 树哥A

### T129-2 [Day 130, ops-manual]
**Phase 129-B**: 运营手册 (店长/导购/收银/客服)
- 12 tests
- 责任: 树哥B

### T129-3 [Day 131, training]
**Phase 129-C**: 培训体系 (Onboarding + 视频 + 考试)
- 12 tests
- 责任: 树哥A

### T129-4 [Day 132, ops-runbook]
**Phase 129-D**: 运维手册 (部署/扩容/故障/灾备)
- 12 tests
- 责任: 树哥B

### T129-5 [Day 133, doc-review]
**Phase 129-T**: 文档评审 + HEARTBEAT-71
- 14 tests
- 责任: 树哥C

---

## Sprint 18 (Day 134-138) 收官

### T130-1 [Day 134, full-regression]
**Phase 130-A**: 全量回归测试 (28 模块 + 5 基础设施 + 6 端)
- 80 tests
- 责任: 全员

### T130-2 [Day 135, launch-checklist]
**Phase 130-B**: 上线条件 100 条逐条打勾 + 阻塞项清单
- 0 tests (流程)
- 责任: 龙虾哥

### T130-3 [Day 136, final-review]
**Phase 130-C**: 性能/安全/合规最终审查
- 0 tests (流程)
- 责任: 龙虾哥 + 40 专家

### T130-4 [Day 137, deploy-rehearsal]
**Phase 130-D**: 部署预演 + 灾备演练 + 回滚预案
- 0 tests (流程)
- 责任: 树哥C

### T130-5 [Day 138, close]
**Phase 130-E**: Tag `v2.0.0-v12-complete` + HEARTBEAT-72 + 复盘
- 0 tests
- 责任: 龙虾哥

---

## 任务统计

- **总 Day 数**: 90
- **总 Phase**: 27 (Phase 104-130)
- **总 Tests**: 1827
- **总 HEARTBEAT**: 19 (part-54 ~ part-72)
- **3 路并行树哥**: A (业务) / B (优化) / C (前台+整合)

---

> **任务已科学化**: 每个 Day 一个原子化任务, 边界精确, 不可扩散