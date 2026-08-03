# 🗺️ PRD: 用户反馈/评价管理模块

> 日期: 2026-07-21 | 圈梁: 代码✅ 测试✅(35+ tests) PRD补写

**用途**: 统一管理用户投诉/建议/评价/问题报告四种反馈类型
**产出**: `apps/api/src/modules/feedback/`
**作用**: V23 用户运营核心能力——打通用户→门店→管理层的反馈闭环

## 🎯 目标

为平台提供集中的用户反馈/评价管理能力，覆盖 APP/小程序/门店扫码/AI客服/Web 等多渠道来源，支持反馈提交→处理→回复→关闭全生命周期管理。

### 核心功能

| 功能 | 说明 | 优先级 |
|------|------|--------|
| 反馈提交 (Submit) | 投诉/建议/评价/问题报告 四种类型 | P0 |
| 反馈列表+筛选 | 按类型/状态/门店/时间/关键字筛选+分页 | P0 |
| 反馈详情 | 单条反馈完整信息+回复记录+附件 | P0 |
| 回复反馈 (Reply) | 客服/门店回复用户，自动更新状态 | P0 |
| 状态更新 | pending→processing→resolved→closed | P0 |
| 分配处理人 | 指派给对应责任部门/员工 | P0 |
| 统计看板 | 类型分布/状态分布/严重度/平均评分/响应时间 | P1 |
| 删除反馈 | 管理端删除违规/重复反馈 | P1 |
| 租户隔离 | 多门店数据隔离 | P0 |

## 📐 架构设计

```
FeedbackController ──→ FeedbackService ──→ [InMemory Store (Phase 1)]
     │                       │
     │                       ├── create()     反馈提交 + 参数校验
     │                       ├── query()      列表+多维度筛选+分页
     │                       ├── getById()    详情+回复记录
     │                       ├── reply()      回复+自动状态流转
     │                       ├── update()     状态/分配/解决
     │                       ├── delete()     删除
     │                       └── getStats()   多维统计聚合
     │
     ├── TenantGuard (多租户隔离)
     └── DTO Validation
```

### 模块结构

```
feedback/
├── feedback.controller.ts        # 7+ REST 端点
├── feedback.service.ts           # 业务逻辑 + 内存存储 + 种子数据
├── feedback.dto.ts               # 请求/响应 DTO (6类)
├── feedback.entity.ts            # 实体类型 + 枚举 (8类)
├── feedback.module.ts            # NestJS 模块注册
└── feedback.controller.test.ts   # 35+ tests
```

## 🧩 数据结构

### 1. 反馈实体 (Feedback)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识 (fb-{uuid}) |
| feedbackNo | string | 反馈编号 (FB-000001) |
| type | enum | complaint/suggestion/rating/issue |
| content | string | 反馈内容正文 |
| title | string | 反馈标题/主题 |
| status | enum | pending/processing/resolved/closed |
| source | enum | app/miniapp/store_qr/ai_cs/web |
| severity | enum | low/medium/high/critical |
| tags | Tag[] | 标签数组 (service/product/environment/device/app/staff/price/other) |
| userId | string | 提交用户ID |
| userName | string | 用户昵称 |
| userContact | string? | 用户联系方式 |
| storeId | string? | 关联门店 |
| orderId | string? | 关联订单 |
| attachments | string[] | 附件/图片URL列表 |
| rating | number? | 评分 (1-5, 仅rating类型) |
| replies | Reply[] | 回复记录列表 |
| assignedTo | string? | 处理人ID |
| assignedToName | string? | 处理人姓名 |
| resolution | string? | 处理备注 |
| resolvedAt | string? | 解决时间 |
| createdAt | string | 创建时间 |
| updatedAt | string | 更新时间 |

### 2. 回复记录 (ReplyRecord)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 回复唯一标识 |
| content | string | 回复内容 |
| repliedBy | string | 回复人ID |
| repliedByName | string | 回复人姓名 |
| repliedAt | string | 回复时间 |
| isSystem | boolean? | 是否系统自动回复 |

## 🔄 状态机

```
                    ┌──────────────┐
                    │   pending    │
                    │   (待处理)    │
                    └──────┬───────┘
                           │ 回复/人工分配
                           ↓
                    ┌──────────────┐
                    │  processing  │
                    │   (处理中)    │
                    └──────┬───────┘
                           │ 办结
                           ↓
                    ┌──────────────┐
                    │   resolved   │
                    │   (已解决)    │
                    └──────┬───────┘
                           │ 确认关闭
                           ↓
                    ┌──────────────┐
                    │    closed    │
                    │   (已关闭)    │
                    └──────────────┘
```

## 📋 API 端点

| 方法 | 路径 | 说明 |
|:----|:-----|:-----|
| POST | /feedback | 提交反馈 |
| GET | /feedback | 反馈列表+筛选+分页 |
| GET | /feedback/stats | 反馈统计 |
| GET | /feedback/:id | 反馈详情 |
| POST | /feedback/:id/reply | 回复反馈 |
| PATCH | /feedback/:id | 更新反馈 |
| DELETE | /feedback/:id | 删除反馈 |

### 查询参数 (GET /feedback)

| 参数 | 类型 | 说明 |
|:----|:-----|:-----|
| type | string | 筛选类型 |
| status | string | 筛选状态 |
| severity | string | 筛选严重程度 |
| source | string | 筛选来源 |
| storeId | string | 筛选门店 |
| userId | string | 筛选用户 |
| tags | string[] | 筛选标签 |
| fromDate | string | 起始日期 |
| toDate | string | 截止日期 |
| keyword | string | 全文关键字搜索 |
| page | number | 页码 (默认1) |
| pageSize | number | 每页数量 (默认20) |

## 🧪 测试覆盖

| 测试层 | 文件 | 数量 | 覆盖 |
|--------|------|:----:|:----|
| Controller | feedback.controller.test.ts | 35+ | 路由+提交+列表+详情+回复+更新+删除+统计+流程 |

### 测试场景明细

**路由元数据 (8 tests)**
- Controller Path: /feedback
- 7 个端点 (POST/GET/GET/POST/PATCH/DELETE + stats)

**提交反馈 (5 tests)**
- 投诉提交 → 完整实体
- 评价提交 → 含评分
- 建议提交 → 含门店
- 问题报告 → 含附件
- feedbackNo 自动生成格式

**列表/筛选/分页 (7 tests)**
- 空白查询 → 所有数据
- 按类型筛选
- 按状态筛选
- 按门店筛选
- 关键字搜索
- 分页生效
- 空结果

**统计 (3 tests)**
- 完整统计数据
- 来源分布
- 严重度分布

**详情 (4 tests)**
- 正常获取
- 已关闭含回复
- 已解决含解决信息
- 不存在 → 400

**回复 (3 tests)**
- pending→processing 自动流转
- 多次回复追加
- 系统回复标记

**更新 (6 tests)**
- 状态更新 processing
- 分配处理人
- resolved 记录解决时间
- closed 自动系统回复
- 严重程度更新
- 标签更新

**删除 (3 tests)**
- 正常删除
- 删除后查询报错
- 不存在报错

**业务流程 (2 tests)**
- 完整闭环: 提交→回复→解决→关闭
- 统计覆盖完整流程后数据变化

## 🛡️ 角色权限

| 资源 | 管理员 | 客服 | 门店店长 | 普通用户 |
|------|:------:|:----:|:--------:|:--------:|
| feedback:list | ✅ | ✅ | ✅ (本店) | ❌ |
| feedback:create | ✅ | ✅ | ✅ | ✅ |
| feedback:detail | ✅ | ✅ | ✅ (本店) | ✅ (自己) |
| feedback:reply | ✅ | ✅ | ✅ (本店) | ❌ |
| feedback:update | ✅ | ✅ | ✅ (本店) | ❌ |
| feedback:delete | ✅ | ❌ | ❌ | ❌ |
| feedback:stats | ✅ | ✅ | ✅ | ❌ |

## 📊 离线数据

- **6 条种子反馈数据**: 涵盖所有 4 种类型、4 种状态、4 种严重度、3 种来源
  - 1 条 pending 投诉 (排队问题)
  - 1 条 processing 建议 (自助下单)
  - 1 条 closed 评价 (5星好评含回复)
  - 1 条 resolved 问题报告 (设备故障含2条回复)
  - 1 条 pending 建议 (亲子活动)
  - 1 条 processing 投诉 (饮料质量)

## 🔗 跨模块对接

| 对端模块 | 对接方式 | 说明 |
|:---------|:---------|:-----|
| notification | 新反馈通知 | 高优先级投诉→管理员通知 |
| notification | 回复通知 | 客服回复→用户 APP 推送 |
| analytics | 反馈统计 | 汇总推送分析模块 |
| ai-cs | AI 总结 | AI客服会话自动生成反馈 (Phase 2) |
| crm | 用户画像 | 反馈数据丰富用户行为 (Phase 2) |

## 📋 验收标准

| # | 场景 | 步骤 |
|:-:|:-----|:-----|
| AC-1 | 提交投诉 | POST /feedback → 返回 pending 投诉 |
| AC-2 | 提交评价 | POST /feedback {type:rating, rating:5} → 返回含评分 |
| AC-3 | 反馈列表 | GET /feedback → 分页列表 |
| AC-4 | 筛选 | GET /feedback?type=complaint&status=pending → 精准筛选 |
| AC-5 | 详情 | GET /feedback/:id → 完整信息+回复 |
| AC-6 | 回复 | POST /feedback/:id/reply → 状态变 processing |
| AC-7 | 解决 | PATCH /feedback/:id {status:resolved} → 记录解决时间 |
| AC-8 | 关闭 | PATCH /feedback/:id {status:closed} → 自动系统回复 |
| AC-9 | 统计 | GET /feedback/stats → 多维聚合 |
| AC-10 | 分配 | PATCH /feedback/:id {assignedTo} → 处理人更新 |
