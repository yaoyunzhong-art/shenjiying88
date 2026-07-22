# 合同管理 (Contracts)

## 功能概述

合同管理模块负责企业各类商业合同的全生命周期管理，包括合同创建、审批、签署、履行跟踪、变更、续签及归档。支持供应商合同、客户合同、租赁合同、服务协议等多种合同类型。提供合同模板管理、条款库管理、自动提醒（到期预警、续签提醒）、合同金额与支付节点跟踪等功能。与采购、销售、财务等模块深度集成，确保合同执行过程中的数据一致性和业务闭环。

## 核心概念

- **合同**：具有法律效力的商业协议，包含合同主体、标的、金额、期限、条款等核心信息
- **合同模板**：预定义的合同范本，包含标准条款和可配置字段，用于快速生成合同
- **合同条款**：合同中的具体权利义务约定，支持从条款库引用标准条款
- **合同审批流**：合同生效前的多级审批流程，支持会签、或签、加签等模式
- **合同签署**：支持电子签章/纸质签署两种模式，记录签署时间、签署人、签署方式
- **合同变更**：合同执行过程中对条款、金额、期限等的变更记录与控制
- **合同归档**：已履行完毕或终止的合同转入归档状态，保留完整历史记录
- **到期预警**：基于合同期限的自动预警机制，支持多级提醒（如提前30天、15天、7天）

## 主要页面/路由

| 路由 | 页面 | 说明 |
|------|------|------|
| `/contracts` | 合同列表 | 合同查询、筛选、列表展示，支持多维度搜索 |
| `/contracts/create` | 新建合同 | 选择模板/空白创建，填写合同信息 |
| `/contracts/:id` | 合同详情 | 合同全景视图：基本信息、条款、附件、审批进度、履行记录 |
| `/contracts/:id/edit` | 编辑合同 | 编辑合同信息（仅草稿/待审批状态可编辑） |
| `/contracts/:id/sign` | 合同签署 | 签署页面，支持电子签章 |
| `/contracts/:id/amend` | 合同变更 | 创建变更单，记录变更内容 |
| `/contracts/templates` | 模板管理 | 合同模板列表、预览、启用/停用 |
| `/contracts/templates/create` | 新建模板 | 创建合同模板，定义变量字段 |
| `/contracts/templates/:id/edit` | 编辑模板 | 编辑模板内容与字段配置 |
| `/contracts/clause-library` | 条款库 | 标准条款管理，分类检索 |
| `/contracts/approvals` | 审批管理 | 待审批、已审批、我的申请等视图 |

## 相关服务/API

| 服务 | 用途 |
|------|------|
| `ContractService` | 合同 CRUD、状态流转、查询 |
| `ContractTemplateService` | 模板管理、模板变量解析、合同生成 |
| `ContractClauseService` | 条款库管理、条款引用关系 |
| `ContractApprovalService` | 审批流驱动、审批意见记录 |
| `ContractSignService` | 电子签章对接、签署状态管理 |
| `ContractAmendService` | 变更单管理、变更版本控制 |
| `ContractReminderService` | 到期预警计算与通知推送 |
| `ContractArchiveService` | 归档策略执行、归档文件存储 |

## 使用示例

### 创建合同（伪代码）

```typescript
// 1. 获取合同模板
const template = await contractTemplateService.getById(templateId);

// 2. 根据模板创建合同草稿
const contract = await contractService.create({
  title: '2026年度物流服务合同',
  templateId: template.id,
  partyA: { id: 'company-001', name: '某科技有限公司' },
  partyB: { id: 'supplier-023', name: '某物流有限公司' },
  amount: 5000000, // 合同总金额（分）
  currency: 'CNY',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  clauses: [
    { clauseId: 'clause-001', content: '付款方式：月结60天...' },
    { clauseId: 'clause-005', content: '违约责任：...' },
  ],
  attachments: [{ fileId: 'file-xxx', name: '报价单.pdf' }],
});

// 3. 提交审批
const approval = await contractApprovalService.submit(contract.id, {
  approvers: ['user-001', 'user-002'],
  strategy: 'countersign', // 会签
});
```

### 合同审批与签署

```typescript
// 审批通过
await contractApprovalService.approve(approval.id, {
  approverId: 'user-001',
  comment: '审批通过，请安排签署',
});

// 发起电子签署
await contractSignService.initiateSign(contract.id, {
  signType: 'electronic',
  signers: [
    { party: 'A', signerId: 'user-001', email: 'ceo@company.com' },
    { party: 'B', signerId: 'supplier-signer', email: 'sign@supplier.com' },
  ],
});
```

### 合同到期提醒配置

```typescript
// 配置到期提醒规则
await contractReminderService.setReminder(contract.id, {
  triggers: [
    { daysBefore: 60, level: 'info', message: '合同将于60天后到期' },
    { daysBefore: 30, level: 'warning', message: '合同将于30天后到期，请安排续签' },
    { daysBefore: 7, level: 'urgent', message: '合同将于7天后到期，请立即处理' },
  ],
  notifyChannels: ['system', 'email'],
  notifyUsers: ['contract-manager', 'procurement-manager'],
});
```
