# V23 PRD: 联盟营销管理模块

> 版本: v23 (2026-07-21)
> 状态: ✅ 已交付
> 树哥: v23-day2

## 1. 概述

联盟营销管理（Alliance Management）是 ShenJiYing 平台 Phase 1 核心业务模块，旨在建立 **异业联盟合作伙伴** 的全生命周期管理能力。通过本模块，商家可以注册/管理联盟伙伴、基于 S/A/B/C 分级体系评估伙伴质量、使用健康度评分监控伙伴表现、创建/审批/执行跨商户分账、扫描并关联未关联订单、以及检测异常行为。

### 业务价值

- 打通线上线下商户联盟，促进交叉客流
- 精细化分级运营，优升劣降
- 自动化分账减少人工对账成本
- 异常检测风控，防止刷单/欺诈

## 2. 功能范围

### 2.1 伙伴管理
| 特性 | 说明 |
|------|------|
| 注册伙伴 | 填写名称、业务类型、联系方式、地址 |
| 更新伙伴 | 修改已有伙伴的信息 |
| 伙伴查询 | 按 ID 查询单个伙伴详情 |
| 列表筛选 | 按业务类型、状态、等级过滤 |

### 2.2 分级评定
| 特性 | 说明 |
|------|------|
| 分级标准 | S(金牌)/A(优质)/B(普通)/C(待改进) 四级 |
| 自动计算 | 基于健康度评分自动匹配等级 |
| 手动指定 | 运营手动覆盖等级 |
| 自动升级 | 连续 N 月达标自动升一级 |
| 自动降级 | 连续 N 月不达标自动降一级 |

### 2.3 健康度评分
| 特性 | 说明 |
|------|------|
| 营收得分 | 基于月营收 (基准10万) 线性评分 |
| 订单得分 | 基于月订单数 (基准500单) 评分 |
| 投诉得分 | 投诉率越低得分越高 |
| 活跃得分 | 基于月活跃天数 (基准30天) |
| 综合评分 | 加权综合 (35%/25%/25%/15%) |

### 2.4 分账管理
| 特性 | 说明 |
|------|------|
| 比例分账 | 按比例分摊 (所有比例合计=1) |
| 固定金额分账 | 按固定金额分 (合计=总金额) |
| 审批流程 | pending → approved → executed |
| 分账查询 | 按 ID 或按伙伴查询历史 |

### 2.5 未关联订单
| 特性 | 说明 |
|------|------|
| 订单扫描 | 按店铺+时间范围扫描未关联订单 |
| 手动关联 | 指定订单关联到伙伴 |
| 自动关联 | 按金额+时间规则自动匹配 |

### 2.6 异常检测
| 特性 | 说明 |
|------|------|
| 频繁小额检测 | 多笔小额 (<1000分) 交易 |
| 异常时间检测 | 0-6AM 时间段交易 |
| 地点漂移检测 | 两次交易距离 >50km |
| 可疑标记 | 标记可疑分账 |

## 3. API 设计

### 伙伴管理
```
POST   /alliance/partner/register      → 注册伙伴
PUT    /alliance/partner/:partnerId    → 更新伙伴
GET    /alliance/partner/:partnerId    → 获取伙伴
GET    /alliance/partner               → 列表 (支持 ?businessType&status&grade)
```

### 分级评定
```
GET    /alliance/grading/criteria               → 获取分级标准
POST   /alliance/grading/:partnerId/calculate   → 计算等级
PUT    /alliance/grading/:partnerId/assign      → 手动指定
GET    /alliance/grading/:partnerId             → 获取当前等级
POST   /alliance/grading/:partnerId/auto-upgrade   → 自动升级
POST   /alliance/grading/:partnerId/auto-downgrade → 自动降级
```

### 健康度
```
POST   /alliance/health/:partnerId/calculate    → 计算健康度
GET    /alliance/health/:partnerId/factors      → 获取因素详情
GET    /alliance/health/:partnerId/trend        → 获取趋势
POST   /alliance/health/:partnerId/metrics      → 设置指标
```

### 分账
```
POST   /alliance/settlement/create              → 创建分账
POST   /alliance/settlement/:settlementId/approve → 审批
POST   /alliance/settlement/:settlementId/execute → 执行
GET    /alliance/settlement/:settlementId        → 查询
GET    /alliance/settlement/history/:partnerId   → 查询历史
POST   /alliance/settlement/:settlementId/flag-suspicious → 标记可疑
```

### 未关联订单
```
POST   /alliance/order/scan-unlinked            → 扫描
POST   /alliance/order/:orderId/link            → 手动关联
POST   /alliance/order/:orderId/auto-link       → 自动关联
```

### 异常检测
```
POST   /alliance/anomaly/detect/:partnerId      → 检测异常
GET    /alliance/anomaly/report/:partnerId      → 获取报告
```

## 4. 数据模型

```
AlliancePartner
├── id              string     主键
├── name            string     伙伴名称 (唯一)
├── businessType    enum       RETAIL|F&B|SERVICE|TECH|OTHER
├── contact         string     联系方式
├── address         string     地址
├── status          enum       ACTIVE|INACTIVE|SUSPENDED
├── currentGrade    enum|null  S|A|B|C
├── healthScore     number|null 健康度
├── registeredAt    string     注册时间
└── updatedAt       string     更新时间

Settlement
├── settlementId    string     分账ID
├── orderId         string     订单ID
├── type            enum       ratio|fixed
├── totalAmount     number     总金额(分)
├── participants    array      参与方
│   ├── partnerId   string
│   ├── partnerName string
│   ├── ratio       number?    比例(0-1)
│   └── fixedAmount number?    固定金额
├── status          enum       pending|approved|executed|cancelled
├── createdAt       Date
├── approvedAt      Date?
└── executedAt      Date?
```

## 5. 依赖模块

| 模块 | 关系 | 合约文件 |
|------|------|----------|
| Notification | 消费注册/等级变更/分账/异常告警事件 | `alliance.contract.ts` |
| Analytics | 消费伙伴健康度趋势 | `alliance.contract.ts` |
| Marketing | 消费伙伴等级变更事件 | `alliance.contract.ts` |

## 6. 验收标准

- [x] 伙伴全生命周期 CRUD 可用
- [x] S/A/B/C 分级评定可用
- [x] 健康度评分可用
- [x] 分账创建/审批/执行流水线可用
- [x] 未关联订单扫描与关联可用
- [x] 异常检测与可疑标记可用
- [x] 跨模块合约 (alliance.contract.ts) 定义完整
- [x] E2E 测试覆盖 (cross-module-e2e-53) 全链路
- [x] Controller 测试 ≥10 个
- [x] TSC 编译通过
- [x] Scorecard 9道箍 PASS
