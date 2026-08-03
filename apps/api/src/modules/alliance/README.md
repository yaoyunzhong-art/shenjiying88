# 联盟管理模块 (Alliance)

## 模块概述

联盟管理模块（T112 异业联盟）负责异业联盟合作伙伴的全生命周期管理，涵盖伙伴注册、S/A/B/C 分级评定、健康度评分、跨商户分账结算、未关联订单检测及异常行为告警。

采用 Facade 模式，由 `AllianceService` 统一封装 6 个子服务，对外提供简洁的编排接口。

## 核心功能

### 1. 伙伴管理 (`AlliancePartner`)

| 功能 | 描述 |
|------|------|
| 伙伴注册 | 注册新联盟伙伴，记录基本信息（名称、业务类型、联系方式、地址） |
| 信息更新 | 更新伙伴资料 |
| 伙伴查询 | 按 ID 查询或按业务类型/状态/等级多维度过滤 |

### 2. 分级评定 (`PartnerGradingService`)

| 功能 | 描述 |
|------|------|
| 等级制度 | S/A/B/C 四级评定体系 |
| 自动评定 | 基于业务指标自动计算等级 |
| 手动指定 | 运营人员可手动指定等级 |
| 自动升降级 | 根据健康度趋势自动检测升级/降级条件 |

### 3. 健康度评分 (`HealthScoreService`)

| 维度 | 说明 |
|------|------|
| 营收得分 | 基于伙伴贡献的营收金额 |
| 订单数得分 | 基于订单数量 |
| 投诉率得分 | 投诉率越低得分越高 |
| 活跃度得分 | 基于活跃天数 |

健康度综合评分（0-100），支持多日趋势追踪。

### 4. 跨商户分账 (`CrossMerchantSettlementService`)

| 功能 | 描述 |
|------|------|
| 分账创建 | 按比例（ratio）或固定金额（fixed）分账 |
| 分账审批 | 审批流控制 |
| 分账执行 | 资金划拨执行 |
| 分账历史 | 按伙伴查询历史分账记录 |

### 5. 未关联订单检测 (`UnlinkedOrderDetector`)

| 功能 | 描述 |
|------|------|
| 未关联订单扫描 | 按店铺和时间范围扫描未归属的订单 |
| 手动关联 | 运营人员手动将订单关联到伙伴 |
| 自动关联 | 基于业务规则自动匹配伙伴 |

### 6. 异常检测 (`AnomalyDetectionService`)

| 功能 | 描述 |
|------|------|
| 异常模式检测 | 检测频繁小额交易、异常时段、地点漂移等 |
| 异常报告 | 生成伙伴异常行为汇总报告 |
| 可疑分账标记 | 标记可疑分账记录供人工审核 |

## 接口说明

### REST API

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/alliance/partner/register` | 注册联盟伙伴 |
| PUT | `/alliance/partner/:partnerId` | 更新伙伴信息 |
| GET | `/alliance/partner/:partnerId` | 获取伙伴详情 |
| GET | `/alliance/partner` | 列出伙伴（支持过滤） |
| GET | `/alliance/grading/criteria` | 获取分级标准 |
| POST | `/alliance/grading/:partnerId/calculate` | 计算评定等级 |
| PUT | `/alliance/grading/:partnerId/assign` | 手动指定等级 |
| GET | `/alliance/grading/:partnerId` | 获取当前等级 |
| POST | `/alliance/grading/:partnerId/auto-upgrade` | 自动升级检测 |
| POST | `/alliance/grading/:partnerId/auto-downgrade` | 自动降级检测 |
| POST | `/alliance/health/:partnerId/calculate` | 计算健康度 |
| GET | `/alliance/health/:partnerId/factors` | 获取健康度因素详情 |
| GET | `/alliance/health/:partnerId/trend` | 获取健康度趋势 |
| POST | `/alliance/health/:partnerId/metrics` | 设置指标（测试辅助） |
| POST | `/alliance/settlement/create` | 创建分账单 |
| POST | `/alliance/settlement/:settlementId/approve` | 审批分账 |
| POST | `/alliance/settlement/:settlementId/execute` | 执行分账 |
| GET | `/alliance/settlement/:settlementId` | 查询分账 |
| GET | `/alliance/settlement/history/:partnerId` | 获取伙伴分账历史 |
| POST | `/alliance/order/scan-unlinked` | 扫描未关联订单 |
| POST | `/alliance/order/:orderId/link` | 手动关联订单 |
| POST | `/alliance/order/:orderId/auto-link` | 自动关联订单 |
| POST | `/alliance/anomaly/detect/:partnerId` | 检测异常模式 |
| GET | `/alliance/anomaly/report/:partnerId` | 获取异常报告 |
| POST | `/alliance/settlement/:settlementId/flag-suspicious` | 标记可疑分账 |

所有接口受 `TenantGuard` 保护，使用 `ValidationPipe` 校验请求参数。

### 跨模块合约 (Contract)

模块通过 `alliance.contract.ts` 暴露以下合约类型供其他模块消费：

- `AlliancePartnerContract` — 伙伴基本信息合约
- `GradeCriteriaContract` — 分级标准合约
- `SettlementContract` — 分账信息合约
- `HealthScoreContract` — 健康度合约
- `AnomalyDetectionContract` — 异常检测合约
- `OrderLinkContract` — 订单关联合约
- 事件合约：`AllianceRegistrationEvent`、`AllianceGradeChangeEvent`、`AllianceSettlementEvent`、`AllianceAnomalyAlertEvent`

## 依赖模块

| 模块 | 关系 | 说明 |
|------|------|------|
| audit | 强依赖 | 审计日志模块，记录伙伴注册/更新/分账等关键操作 |
| agent | 强依赖 | `TenantGuard` 多租户鉴权守卫 |

## 配置项

暂无独立的环境变量配置。联盟模块的行为由子服务内部算法参数控制（如分级阈值、健康度权重、异常检测规则等）。
