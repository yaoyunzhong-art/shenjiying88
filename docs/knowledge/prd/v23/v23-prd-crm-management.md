# 📄 V23 PRD: CRM客户管理模块

> **Phase:** P1 — 客户管理核心  
> **版本:** v23.1  
> **状态:** ✅ 已完成  
> **生成日期:** 2026-07-21  

---

## 一、产品概述

### 1.1 问题描述

门店运营团队缺乏统一的客户关系管理工具，客户信息分散在Excel、收银系统和微信聊天记录中，导致：

- 客户信息无法集中管理，跟进效率低
- 高价值客户未能被有效识别和维护
- 客户投诉和服务工单无标准化流程
- 互动记录碎片化，无法形成客户画像

### 1.2 目标用户

| 角色 | 使用场景 | 权限 |
|:-----|:---------|:----:|
| 👔 店长 | 查看客户全景、评分管理、团队工单分配 | 全部 |
| 🛒 前台 | 客户进店登记、快速交互记录、基础工单创建 | 列表/详情/交互/工单 |
| 📢 营销 | 客户分群、评分更新、营销活动跟进 | 列表/详情/交互/评分 |
| 🎯 运行专员 | 客户工单处理、按优先级排序 | 列表/工单 |
| 🔧 安监 | 投诉工单处理 | 工单 |
| 👥 HR / 🎮 导玩员 / 🤝 团建 | 无CRM权限 | 无 |

### 1.3 产品目标

1. **统一客户视图** — 集中管理所有客户信息、标签、交互记录
2. **评分驱动** — 通过EngagementScore量化客户价值
3. **工单闭环** — 标准化投诉/需求/故障工单流程
4. **交互溯源** — 每次交互可追溯、可分析

---

## 二、功能规格

### 2.1 客户管理

| # | 功能 | 端点 | 方法 | 说明 |
|:-:|:-----|:-----|:----:|:-----|
| 1 | 客户列表 | `/api/crm/customers` | GET | 分页、状态过滤、搜索 |
| 2 | 客户创建 | `/api/crm/customers` | POST | 必填: name, email |
| 3 | 客户详情 | `/api/crm/customers/:id` | GET | 含交互/工单/备注全量 |
| 4 | 客户更新 | `/api/crm/customers/:id` | PUT | 支持部分更新 |
| 5 | 客户删除 | `/api/crm/customers/:id` | DELETE | 软删除标记 |

### 2.2 评分管理

| # | 功能 | 端点 | 方法 | 说明 |
|:-:|:-----|:-----|:----:|:-----|
| 6 | 评分增量 | `/api/crm/customers/:id/score` | PATCH | delta值(正负均可) |
| 7 | 评分设置 | `/api/crm/customers/:id/score` | PUT | 直接设置0-100 |

### 2.3 标签管理

| # | 功能 | 端点 | 方法 | 说明 |
|:-:|:-----|:-----|:----:|:-----|
| 8 | 添加标签 | `/api/crm/customers/:id/tags` | POST | 自动去重 |
| 9 | 移除标签 | `/api/crm/customers/:id/tags/:tag` | DELETE | 精确匹配 |

### 2.4 状态标记

| # | 功能 | 端点 | 方法 | 说明 |
|:-:|:-----|:-----|:----:|:-----|
| 10 | 标记状态 | `/api/crm/customers/:id/status` | PATCH | active/inactive/churned/lead |

### 2.5 备注

| # | 功能 | 端点 | 方法 | 说明 |
|:-:|:-----|:-----|:----:|:-----|
| 11 | 添加备注 | `/api/crm/customers/:id/notes` | POST | 记录客户特征/偏好 |
| 12 | 备注列表 | `/api/crm/customers/:id/notes` | GET | 按时间倒序 |

### 2.6 交互记录

| # | 功能 | 端点 | 方法 | 说明 |
|:-:|:-----|:-----|:----:|:-----|
| 13 | 添加交互 | `/api/crm/customers/:id/interactions` | POST | type: call/email/chat/visit/ticket/other |
| 14 | 交互列表 | `/api/crm/customers/:id/interactions` | GET | 时间线展示 |

### 2.7 工单管理

| # | 功能 | 端点 | 方法 | 说明 |
|:-:|:-----|:-----|:----:|:-----|
| 15 | 创建工单 | `/api/crm/customers/:id/tickets` | POST | subject必填 |
| 16 | 工单列表 | `/api/crm/customers/:id/tickets` | GET | 按时间倒序 |
| 17 | 状态更新 | `/api/crm/customers/:id/tickets/:ticketId` | PATCH | open→in_progress→resolved→closed |

### 2.8 统计概览

| # | 功能 | 端点 | 方法 | 说明 |
|:-:|:-----|:-----|:----:|:-----|
| 18 | 客户统计 | `/api/crm/stats` | GET | 总数/各状态/平均分/总消费/工单数 |

---

## 三、数据模型

### CustomerProfile

```typescript
interface CustomerProfile {
  id: string                    // 唯一标识
  name: string                  // 客户姓名
  email: string                 // 邮箱
  phone: string                 // 手机号
  status: 'active'|'inactive'|'churned'|'lead'
  engagementScore: number       // 活跃评分 0-100
  totalSpentCents: number       // 累计消费(分)
  visitCount: number            // 到店次数
  lastVisitAt: string           // 最近到店时间
  tags: string[]                // 客户标签
  notes: CrmNote[]              // 客户备注
  createdAt: string
  updatedAt: string
  interactions: CrmInteraction[]
  tickets: Ticket[]
}
```

### CrmInteraction

```typescript
interface CrmInteraction {
  id: string
  customerId: string
  type: 'call'|'email'|'chat'|'visit'|'ticket'|'other'
  summary: string
  details: string
  createdAt: string
  createdBy: string
}
```

### Ticket

```typescript
interface Ticket {
  id: string
  customerId: string
  subject: string
  description: string
  priority: 'low'|'medium'|'high'|'urgent'
  status: 'open'|'in_progress'|'resolved'|'closed'
  assignedTo: string
  createdAt: string
  updatedAt: string
  closedAt?: string
}
```

---

## 四、API 接口规范

### 通用响应格式

```json
{
  "success": true,
  "data": { ... },
  "message": "(可选)"
}
```

### 错误响应

```json
{
  "success": false,
  "code": 404,
  "message": "客户 xxx 不存在"
}
```

### 错误码

| HTTP | 场景 |
|:----:|:-----|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 参数校验失败 |
| 404 | 客户/工单不存在 |
| 409 | 业务冲突(空名称/重复) |

---

## 五、圈梁检查清单

| # | 箍 | 状态 | 备注 |
|:-:|:----|:----:|:-----|
| ① | TSC 通过 | ✅ | ≤5 错误 |
| ② | 测试 ≥10 | ✅ | controller 35 + service 40 + role 15 = 90 |
| ③ | 圈梁表更新 | ✅ | CRM 已加入 Phase 1 |
| ④ | PRD 文件 | ✅ | 本文 |
| ⑤ | E2E 链 | ✅ | cross-module-e2e-54-crm |
| ⑥ | 知识赋能 | ✅ | 本PRD可被知识库检索 |
| ⑦ | 角色旅程 | ✅ | 8角色全覆盖 |
| ⑧ | 基建 | ✅ | CI/Docker/Build |
| ⑨ | 性能基线 | 🟡 | 内存Map模式，后续可迁移DB |

---

## 六、后续演进

| 版本 | 计划内容 | 优先级 |
|:----|:---------|:------:|
| v23.2 | 数据库持久化(PG迁移) | P1 |
| v23.3 | 客户导入/导出(CSV/Excel) | P1 |
| v23.4 | 客户分群(标签组合/消费区间) | P2 |
| v23.5 | RFM模型内置分析 | P2 |
| v23.6 | 微信小程序客户自助查询 | P3 |

## 七、知识赋能关联

| 知识卡片 | 关联内容 |
|:---------|:---------|
| KB-CRM-01 | 客户评分算法 EngageScore 0-100 |
| KB-CRM-02 | 客户状态机 active/inactive/churned/lead |
| KB-CRM-03 | 工单状态流转 open→in_progress→resolved→closed |
| KB-CRM-04 | 8角色权限矩阵 |
