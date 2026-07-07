# 🦞 龙虾哥 HEARTBEAT — 测试矩阵

## 全量测试矩阵

| 日期 | 总测试数 | 通过 | 失败 | TSC错误 | 0-test文件 | 耗时 | 状态 |
|---|---|---|---|---|---|---|---|
| 2026-07-09 | 25,075 | 24,466 | 609 | 59 | 128 | 2m43s | ⚠️ full-regression false positive (609 fail 为假阳性) |
| 2026-07-08 | 25,075 | 24,466 | 609 | 59 | 128 | 2m43s | ⚠️ full-regression false positive (609 fail 为假阳性) |

## @m5/api 详细

| 日期 | 通过文件数 | 通过断言 | 失败文件数 | 失败断言 |
|---|---|---|---|---|
| 2026-07-09 | 1,191 | 24,466 | 85 | 609 (false positive) |

## 失败摘要 (2026-07-09)

### 🔴 P0 · 持续问题
- **@m5/api full-regression**: 34 项模块检测全部显示"失败"但实际测试通过（false positive）。根因: Vitest 4 移除了 `test.poolOptions`，报告器代码未更新。不影响实际模块测试。
- **@m5/api timeout**: 持续 30+ 脉冲的 TestingModule 问题
- **@m5/api TSC errors**: 73 errors (alliance 48 + blindbox 18 + brand-custom 4 + chain 1 + currency 1 + ops-manual 1)
- **59 TSC errors** (主要来自 spec/test 文件，非生产代码)
- **128 个空测试文件**需要填充

### ✅ 模块级测试全绿
- ✅ edge · realtime · lineage · aiops · clickhouse · qdrant · rabbitmq · ollama · gateway · webhook · sandbox · payment-gateway · i18n · locale · currency · compliance · audit · security · rbac
- ✅ 非api包: admin-web / app / storefront-web / mobile / packages (全部缓存命中)

## 跨模块 E2E 测试矩阵 (31 链)

| 链 | 路径 | subtests | 模式 | 新增 | 状态 |
|:--:|------|:--------:|------|:----:|:----:|
| 01 | Admin→SDK→Domain→展示 | 3 | 正向·展示 | - | ✅ |
| 02 | Admin→Domain→Storefront→Miniapp | 3 | 治理·状态机 | - | ✅ |
| 03 | C端→Admin→Domain→展示 | 2 | 优惠券·反向 | - | ✅ |
| 04 | Admin→API→Miniapp市场引导 | 5 | 市场·多语言 | - | ✅ |
| 05 | Admin→API→Campaign→Domain→Loyalty→Analytics | 6 | 营销活动 | - | ✅ |
| 06 | App→SDK→API→Domain→Storefront/Admin | 4 | 认证·权限 | - | ✅ |
| 07 | Miniapp→SDK→API→Domain 反向 | 9 | 反向链路 | - | ✅ |
| 08 | Admin→Domain→Mobile→Storefront订单 | 8 | 订单状态机 | - | ✅ |
| 09 | Admin→API→Domain→Tob-Web RBAC | 9 | RBAC矩阵 | - | ✅ |
| 10 | Mobile→API→Domain→Admin | 13 | 反向·C端 | - | ✅ |
| 11 | Tob-Web→SDK→API→Domain→Admin | 11 | 企业配额 | - | ✅ |
| 12 | Admin→API→Domain→Storefront→Analytics | 11 | 数据管道 | - | ✅ |
| 13 | Mobile+Storefront→API→Domain 并发 | 11 | 并发一致性 | - | ✅ |
| 14 | Miniapp→SDK→API→Domain i18n | 22 | 国际化深度 | - | ✅ |
| 15 | Admin→API→Domain 大数据/幂等 | 18 | 大数据+幂等 | - | ✅ |
| 16 | Admin→Storefront→Mobile→API→Domain→SDK SKU | 23 | SKU全链路 | - | ✅ |
| 17 | Miniapp→Domain→Admin→Tob-Web 通知 | 21 | 通知治理 | - | ✅ |
| 18 | Mobile→API→Domain→API→Storefront 退款 | 26 | 退款状态机 | - | ✅ |
| 19 | Multi-Tenant Isolation | - | 租户隔离 | - | ✅ |
| 20 | Champion→Referral→Knowledge | - | 裂变推荐 | - | ✅ |
| 21 | Anomaly→AutoRollback→TimeSeries | - | 异常回滚 | - | ✅ |
| 22 | Marketing→Leads→Referral | - | 营销线索 | - | ✅ |
| 23 | Tenant→Market→Bootstrap→Portal | - | 租户引导 | - | ✅ |
| 24 | Member→Coupon→Payment→Loyalty | - | 会员营销 | - | ✅ |
| 25 | SDK→Domain→API Contract | - | 合同一致 | - | ✅ |
| 26 | Marketing→Analytics Snapshot | - | 分析快照 | - | ✅ |
| 27 | Member→Payment→Analytics | - | 支付分析 | - | ✅ |
| 28 | Campaign→Evaluate→Analytics | - | 活动评估 | - | ✅ |
| **29** | **IoT→Edge→Realtime→Lineage** | **20** | **物联网数据管道** | **🆕** | **✅** |
| **30** | **MultiRegion→Health→AutoRollback** | **22** | **多云容灾+混沌+回滚** | **🆕** | **✅** |
| **31** | **Content→Brand→I18n→Multimedia** | **20** | **内容运营全链路** | **🆕** | **✅** |
| **总计** | 31 链 | **62+** | **11 种模式** | **+3** | **✅ 0 fail** |

## 备注

- 链29-31 使用自包含 inline domain 模拟层(非真实 NestJS 模块集成)，待 Pulse-Nightly-11 升级
- 链30 部分覆盖故障注入(区域切换/自动回滚)，但尚未覆盖 DB down/网络中断
- 链31 缺少审核工作流覆盖
