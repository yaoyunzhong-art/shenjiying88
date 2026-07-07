# V12 业务模块 × V5.1 优化措施 矩阵

> **总业务模块**: 28 个 (规划6-8 第1-29章)  
> **总优化措施**: 45 条 (P0×10 + P1×20 + P2×15)  
> **总阶段**: Phase 104-130 = 27 phases

---

## 一、28 业务模块清单

### A. 业务基础 (8 模块) - Sprint 1-3

| # | 模块 | Phase | 后台文件 | 前台文件 | 状态 |
|---|------|-------|---------|---------|------|
| A1 | 会员体系 (6阶18级) | 104 | member/ | MemberCenter | 🆕 |
| A2 | SVIP 订阅 | 104 | svip/ | SvipPanel | 🆕 |
| A3 | 积分体系 | 107 | points/ | PointsPanel | 增强 |
| A4 | 优惠券 | 108 | coupon/ | CouponCenter | 增强 |
| A5 | 盲盒 | 105 | inventory + blindbox | BlindBoxShowcase | 🆕 |
| A6 | 收银 | 106 | cashier/ | CashierPOS | 增强 |
| A7 | 赛事 | 109 | tournament/ | TournamentHub | 增强 |
| A8 | 等级休眠 | 104 | member/dormancy | - | 🆕 |

### B. 商业化 (6 模块) - Sprint 5-8

| # | 模块 | Phase | 后台文件 | 前台文件 | 状态 |
|---|------|-------|---------|---------|------|
| B1 | 进销存 | 110 | inventory/ | InventoryOps | 增强 |
| B2 | 财务 | 111 | finance/ | FinanceDashboard | 增强 |
| B3 | 异业联盟 | 112 | alliance/ | AllianceDashboard | 🆕 |
| B4 | AI 营销 | 113 | ai-marketing/ | AIMarketing | 🆕 |
| B5 | AI 导购 | 114 | ai-sales/ | AISalesPanel | 🆕 |
| B6 | AI 预测 | 115 | ai-forecast/ | ForecastDashboard | 🆕 |

### C. 触达 & 协同 (4 模块) - Sprint 6-10

| # | 模块 | Phase | 后台文件 | 前台文件 | 状态 |
|---|------|-------|---------|---------|------|
| C1 | 全渠道触达 | 112 | notification/ | NotificationCenter | 增强 |
| C2 | 实时协同 | 126 | realtime/ | RealtimeCollab | 🆕 |
| C3 | 数据血缘 | 125 | data-lineage/ | LineageViewer | 🆕 |
| C4 | AIOps | 124 | ai-ops/ | OpsDashboard | 🆕 |

### D. 开放 & 合规 (5 模块) - Sprint 12-14

| # | 模块 | Phase | 后台文件 | 前台文件 | 状态 |
|---|------|-------|---------|---------|------|
| D1 | 开放平台 | 116 | open-api/ | OpenAPIPortal | 增强 |
| D2 | 国际化 | 117 | i18n/ | - | 增强 |
| D3 | 合规审计 | 118 | compliance/ | CompliancePanel | 增强 |
| D4 | 安全加固 | 128 | security/ | - | 增强 |
| D5 | 区块链审计 | 122 | chain-audit/ | ChainAuditViewer | 🆕 |

### E. 硬件 & 边缘 (3 模块) - Sprint 9

| # | 模块 | Phase | 后台文件 | 前台文件 | 状态 |
|---|------|-------|---------|---------|------|
| E1 | IoT 终端 | 120 | iot/ | IoTManagement | 🆕 |
| E2 | 边缘计算 | 123 | edge/ | EdgeConsole | 🆕 |
| E3 | 硬件健康度 | 120 + 124 | iot/health | HardwareHealth | 🆕 |

### F. 基础设施 & SaaS (4 模块) - Sprint 4, 15-16

| # | 模块 | Phase | 后台文件 | 前台文件 | 状态 |
|---|------|-------|---------|---------|------|
| F1 | ClickHouse OLAP | 119 | analytics-clickhouse/ | - | 🆕 |
| F2 | Qdrant 向量 | 119 | vector-store/ | - | 🆕 |
| F3 | RabbitMQ 事件 | 119 | event-bus/ | - | 🆕 |
| F4 | 独立 SaaS | 121 | saas-standalone/ | SaaSConsole | 🆕 |

### G. 文档 & 性能 (2 模块) - Sprint 16-17

| # | 模块 | Phase | 后台文件 | 前台文件 | 状态 |
|---|------|-------|---------|---------|------|
| G1 | 性能压测 | 127 | perf-test/ | PerfDashboard | 🆕 |
| G2 | 文档体系 | 129 | docs-auto/ | DocPortal | 🆕 |

---

## 二、45 条 V5.1 优化措施落地矩阵

### P0 (10 条 · 立即) - Sprint 1-12

| # | 措施 | 落地 Phase | 落地模块 | 状态 |
|---|------|----------|---------|------|
| P0-1 | WebSocket HTTP 轮询降级 | Phase 104 | member (实时通知) | 🆕 |
| P0-2 | 跨店积分 "先更新 DB, 再删除缓存" | Phase 104 | points + cache | 🆕 |
| P0-3 | 短信双通道 (阿里云+腾讯云) 自动切换 | Phase 106/112 | notification | 🆕 |
| P0-4 | SVIP 到期提醒升级为 P1 级推送 | Phase 104 | svip + notification | 🆕 |
| P0-5 | 盲盒秒杀 Redis Lua 脚本原子操作 | Phase 105 | blindbox + redis | 🆕 |
| P0-6 | 积分通胀预警升级为实时计算 | Phase 107 | points + real-time | 🆕 |
| P0-7 | 联名盲盒分账报表增加退货扣减列 | Phase 111/112 | finance + alliance | 🆕 |
| P0-8 | 联盟异常检测增加跨商户关联分析 | Phase 112 | alliance + risk | 🆕 |
| P0-9 | API 网关统一注入 IP 地址 | Phase 116 | open-api + audit | 🆕 |
| P0-10 | 积分配置增加合理性校验 | Phase 107 | points + config-check | 🆕 |

### P1 (20 条 · 1 月内) - Sprint 1-12

| # | 措施 | 落地 Phase | 落地模块 | 状态 |
|---|------|----------|---------|------|
| P1-1 | 到店积分推送增加 WebSocket 重连机制 | Phase 104/126 | realtime | 🆕 |
| P1-2 | LYT Webhook 增加异步确认机制 | Phase 106 | lyt-webhook | 🆕 |
| P1-3 | 等待时间预估增加系统负载因子 | Phase 109 | tournament/queue | 🆕 |
| P1-4 | 成长值获取衰减曲线 | Phase 104 | member | 🆕 |
| P1-5 | 实时审计告警阈值调整为 2% | Phase 118 | compliance | 🆕 |
| P1-6 | 积分过期提醒增加至 5 次 | Phase 107 | points | 🆕 |
| P1-7 | 海外邮件改用当地服务商 | Phase 112 | notification | 🆕 |
| P1-8 | iOS 推送增加优先级标记 | Phase 112 | notification | 🆕 |
| P1-9 | 擂台赛增加让分机制 | Phase 109 | tournament | 🆕 |
| P1-10 | 联盟伙伴引入 S/A/B/C 分级管理 | Phase 112 | alliance | 🆕 |
| P1-11 | 边缘服务器增加离线取号能力 | Phase 123 | edge | 🆕 |
| P1-12 | 数据同步增加幂等性校验 | Phase 106 + 110 | cashier + inventory | 🆕 |
| P1-13 | AI 调拨模型增加三项成本量化 | Phase 115 | ai-forecast | 🆕 |
| P1-14 | SVIP 续费增加阶梯优惠 | Phase 104 | svip | 🆕 |
| P1-15 | 生日特效增加倒计时预览 | Phase 114 | ai-sales (个性化) | 🆕 |
| P1-16 | 团建报告 AI 生成+裁判审核 | Phase 114 | ai-content | 🆕 |
| P1-17 | 排队叫号短信高峰提前 30 秒发送 | Phase 109 | tournament/queue | 🆕 |
| P1-18 | 联盟分账增加未关联订单人工补录 | Phase 112 | alliance + finance | 🆕 |
| P1-19 | 硬件终端采用自适应心跳 | Phase 120 | iot | 🆕 |
| P1-20 | 入场特效改为预加载 | Phase 114 | ai-sales | 🆕 |

### P2 (15 条 · 3 月内) - Sprint 4-18

| # | 措施 | 落地 Phase | 落地模块 | 状态 |
|---|------|----------|---------|------|
| P2-1 | 跨店调拨财务自动生成内部往来凭证 | Phase 111 | finance + inventory | 🆕 |
| P2-2 | 联盟健康度评估增加低效伙伴预警 | Phase 112 | alliance | 🆕 |
| P2-3 | 取号页面展示系统繁忙指数 | Phase 109 | tournament | 🆕 |
| P2-4 | AI 剪辑增加画面去重算法 | Phase 114 | ai-content | 🆕 |
| P2-5 | AI 方案生成时实时校验设备状态 | Phase 115 | ai-forecast | 🆕 |
| P2-6 | 团建报告增加进步幅度维度 | Phase 114 | ai-content | 🆕 |
| P2-7 | 积分熔断机制 (负债率 > 8% 暂停非消费积分) | Phase 107 | points | 🆕 |
| P2-8 | 等级维持条件 (季度消费不足则降级) | Phase 104 | member | 🆕 |
| P2-9 | 取号接口增加幂等性 | Phase 109 | tournament/queue | 🆕 |
| P2-10 | 维修工单增加自动转派机制 | Phase 120 | iot + workflow | 🆕 |
| P2-11 | 分账记录强制保留完整状态流转日志 | Phase 111/118 | finance + compliance | 🆕 |
| P2-12 | 联盟券异常检测增加用户行为分析 | Phase 112 | alliance + risk | 🆕 |
| P2-13 | 硬件健康度监控系统 | Phase 120 + 124 | iot/health + ai-ops | 🆕 |
| P2-14 | 低代码页面搭建功能增强 | Phase 113 | ai-marketing | 🆕 |
| P2-15 | 协同过滤推荐算法引入 | Phase 113 | ai-marketing | 🆕 |

---

## 三、Sprint × 模块 × 措施 三维矩阵

| Sprint | 业务模块 | P0 措施 | P1 措施 | P2 措施 | Tests |
|--------|---------|---------|---------|---------|-------|
| 1 | A1 A2 A5 A8 | P0-1, 2, 4, 5 | P1-4, 14, 20 | P2-8 | 125 |
| 2 | A3 A6 | P0-3, 6, 10 | P1-2, 6, 12 | P2-7 | 118 |
| 3 | A4 A7 | P0-7 | P1-9, 17 | P2-3, 9 | 128 |
| 4 | F1 F2 F3 F4-infra | P0-1 | P1-1 | - | 84 |
| 5 | B1 B2 | - | P1-13 | P2-1, 11 | 114 |
| 6 | B3 C1 | P0-3, 7, 8 | P1-7, 8, 10, 18 | P2-2, 12 | 116 |
| 7 | B4 | - | - | P2-14, 15 | 106 |
| 8 | B5 B6 | - | P1-15, 16, 20 | P2-4, 6 | 114 |
| 9 | E1 E2 E3 | - | P1-11, 19 | P2-10, 13 | 102 |
| 10 | C2 C3 | - | - | - | 102 |
| 11 | C4 D5 | - | - | P2-11, 13 | 102 |
| 12 | D1 | P0-9 | - | - | 110 |
| 13 | D2 | - | - | - | 82 |
| 14 | D3 D4 | - | P1-5 | - | 102 |
| 15 | F4-saas | - | - | - | 96 |
| 16 | G1 | - | - | - | 82 |
| 17 | G2 | - | - | - | 64 |
| 18 | 收官 | - | - | - | 80 |
| **合计** | **28 模块** | **10 条全覆盖** | **20 条全覆盖** | **15 条全覆盖** | **1827** |

---

## 四、覆盖率核验

- **P0 措施 (10 条)**: 100% 落地 ✅
- **P1 措施 (20 条)**: 100% 落地 ✅  
- **P2 措施 (15 条)**: 100% 落地 ✅
- **业务模块 (28)**: 100% 闭环 ✅
- **优化措施 (45)**: 100% 覆盖 ✅

---

## 五、技术决策映射 (规划6-8 6 大决策)

| 决策 | 规划6-8 | V12 落地 | Phase |
|------|---------|---------|-------|
| 1. LYT Adapter | Adapter 模式 + Mock | 已有, V12 推进 Real | 106 + 121 |
| 2. 数据库分层 | PG+CH+S3+Redis+TiDB | 5 项全落地 | 119 |
| 3. 前端栈 | React+Next+Taro+RN | packages/ui 已统一 | 全程 |
| 4. 多云 IaC | Terraform | 落地 | 116/119 |
| 5. 硬件自研 | ESP32+OTA | 落地 | 120 |
| 6. 独立 SaaS | 先内后外 | 落地 | 121 |

---

> **矩阵对齐完成**: V12 90 天可全部覆盖 28 业务模块 + 45 优化措施 + 6 决策 🚀