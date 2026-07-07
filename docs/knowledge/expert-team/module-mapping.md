# 🔗 模块-专家映射表

> 每模块3人评审小组（1技术+1业务+1用户/监督）
> 创建: 2026-07-08

## A: AI/数据类模块

| 模块 | 技术 | 业务 | 用户/监督 |
|------|------|------|-----------|
| ai-content | T-04 AI/ML | B-05 导玩员 | U-01 玩家 |
| campaign | T-04 AI/ML | B-08 营销 | U-03 店长 |
| anomaly-detector | T-05 性能 | B-06 运行 | S-01 审计师 |
| federated-learning | T-04 AI/ML | B-12 数据分析 | S-03 财务 |
| image-recognition | T-04 AI/ML | B-05 导玩员 | U-01 玩家 |
| insight | T-04 AI/ML | B-12 数据分析 | U-03 店长 |
| multimodal-fusion | T-04 AI/ML | B-12 数据分析 | U-01 玩家 |
| recommend | T-04 AI/ML | B-08 营销 | U-01 玩家 |
| recommender | T-04 AI/ML | B-08 营销 | U-01 玩家 |
| voice-processing | T-04 AI/ML | B-01 店长 | U-01 玩家 |

## B: 后端基础/业务类模块

| 模块 | 技术 | 业务 | 用户/监督 |
|------|------|------|-----------|
| auth | T-02 安全 | B-06 运行 | S-02 监管合规 |
| permission | T-02 安全 | B-03 HR | S-01 审计师 |
| rbac | T-02 安全 | B-03 HR | U-04 运维员 |
| audit | T-02 安全 | B-14 合规 | S-01 审计师 |
| compliance | T-02 安全 | B-14 合规 | S-02 监管合规 |
| security | T-02 安全 | B-04 安监 | U-08 陪同家长 |
| tenant | T-01 架构师 | B-06 运行 | U-03 店长 |
| tenant-config | T-01 架构师 | B-06 运行 | U-04 运维员 |
| gateway | T-05 性能 | B-01 店长 | S-06 治理 |
| health | T-05 性能 | B-06 运行 | U-04 运维员 |
| health-dashboard | T-05 性能 | B-06 运行 | U-04 运维员 |
| monitoring | T-05 性能 | B-06 运行 | U-04 运维员 |
| performance | T-05 性能 | B-06 运行 | U-04 运维员 |
| perf-monitor | T-05 性能 | B-06 运行 | U-04 运维员 |
| deploy | T-08 DevOps | B-06 运行 | S-06 治理 |
| canary | T-08 DevOps | B-06 运行 | S-06 治理 |
| chaos | T-08 DevOps | B-06 运行 | S-06 治理 |
| auto-rollback | T-08 DevOps | B-06 运行 | S-06 治理 |

## C: 财务/支付/交易类

| 模块 | 技术 | 业务 | 用户/监督 |
|------|------|------|-----------|
| finance | T-05 性能 | B-09 财务 | S-03 财务审计 |
| payment-gateway | T-02 安全 | B-09 财务 | S-03 财务审计 |
| transactions | T-03 数据库 | B-09 财务 | S-03 财务审计 |
| saas-billing | T-03 数据库 | B-09 财务 | S-03 财务审计 |
| currency | T-07 测试 | B-09 财务 | S-03 财务审计 |

## D: 门店运营类

| 模块 | 技术 | 业务 | 用户/监督 |
|------|------|------|-----------|
| cashier | T-07 测试 | B-02 前台 | U-01 玩家 |
| member | T-03 数据库 | B-02 前台 | U-02 家庭用户 |
| member-level | T-03 数据库 | B-13 票务 | U-07 学生 |
| points | T-03 数据库 | B-05 导玩员 | U-07 学生 |
| loyalty | T-03 数据库 | B-05 导玩员 | U-02 家庭用户 |
| device-adapter | T-06 前端 | B-04 安监 | U-04 运维员 |
| iot | T-06 前端 | B-04 安监 | U-04 运维员 |
| inventory | T-03 数据库 | B-10 采购 | U-04 运维员 |

## E: 营销/活动/内容类

| 模块 | 技术 | 业务 | 用户/监督 |
|------|------|------|-----------|
| marketing | T-04 AI/ML | B-08 营销 | U-05 社交达人 |
| push | T-10 消息 | B-08 营销 | U-05 社交达人 |
| referral | T-04 AI/ML | B-08 营销 | U-02 家庭用户 |
| blindbox | T-04 AI/ML | B-05 导玩员 | U-01 玩家 |
| tournament | T-04 AI/ML | B-05 导玩员 | U-01 玩家 |
| market | T-07 测试 | B-05 导玩员 | U-01 玩家 |
| reservation | T-03 数据库 | B-07 团建 | U-02 家庭用户 |

## F: 通讯/集成类

| 模块 | 技术 | 业务 | 用户/监督 |
|------|------|------|-----------|
| notification | T-10 消息 | B-06 运行 | U-04 运维员 |
| queue | T-10 消息 | B-06 运行 | S-06 治理 |
| webhook | T-09 API设计 | B-06 运行 | U-09 开发者 |
| open-api | T-09 API设计 | B-06 运行 | U-09 开发者 |
| alliance | T-09 API设计 | B-11 招商 | U-03 店长 |

## G: SaaS/租户类

| 模块 | 技术 | 业务 | 用户/监督 |
|------|------|------|-----------|
| saas-advanced | T-01 架构师 | B-11 招商 | U-03 店长 |
| svip | T-01 架构师 | B-11 招商 | U-03 店长 |
| portal | T-06 前端 | B-06 运行 | U-03 店长 |
| workbench | T-06 前端 | B-03 HR | U-04 运维员 |

## H: 文档/本地化/共享

| 模块 | 技术 | 业务 | 用户/监督 |
|------|------|------|-----------|
| docs | T-09 API设计 | B-14 合规 | S-05 文档审计 |
| i18n | T-06 前端 | B-01 店长 | U-02 家庭用户 |
| locale | T-06 前端 | B-01 店长 | U-02 家庭用户 |
| shared | T-01 架构师 | B-14 合规 | S-06 治理 |
| bootstrap | T-01 架构师 | B-06 运行 | S-06 治理 |
