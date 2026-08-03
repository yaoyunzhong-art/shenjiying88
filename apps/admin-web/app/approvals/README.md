# 治理审批中心

## 模块定位

治理审批中心是 shenjiying88 管理后台的审批流程管控平台，提供采购审批、报销审批、活动审批与请假审批等四大类审批事项的全生命周期管理。该模块面向具备 `foundation.governance.read` 权限的后台管理员，支持待办审批列表查看、审批统计概览、审批通过/驳回操作及审批意见记录。

## 核心能力

- **多类型审批支持**：覆盖采购审批(purchase)、报销审批(expense)、活动审批(campaign)和请假审批(leave)四种业务场景，每种审批类型包含申请人、门店、金额、描述等字段。
- **审批状态流转**：支持待审批(pending) → 已通过(approved) / 已驳回(rejected) 的主流程，以及发起方撤回(withdrawn)状态。通过 Tab 切换可分别查看待审批、已处理或全部记录。
- **审批统计概览**：顶部仪表盘展示待审批数、本月审批总金额与审批通过率三项关键指标。
- **审批动作执行**：对每笔待审批记录提供「批准」和「驳回」按钮，单击后更新本地状态并在页面顶部反馈操作结果。
- **审批意见管理**：展开审批意见输入框，录入文字后提交，记录审批意见。所有写操作（提交意见/批准/驳回）暂时走本地 Mock 链路，仅更新前端内存态。
- **动态路由详情**：`[ticket]` 动态路由支持通过审批单 ID 查看单条审批的详情页面。

## 目录结构

```
approvals/
├── page.tsx                           # 服务端入口页面（async 组件）
├── page.test.ts / page.test.tsx       # L1+L2 综合测试
├── approvals-client.tsx               # 客户端组件：审批列表、统计、审批操作
├── approvals-data.ts                  # 数据层：类型定义、默认审批数据、Mock 写操作
├── error.tsx                          # 错误边界 UI
├── loading.tsx                        # 加载状态 UI
├── not-found.tsx                      # 404 回退页
└── [ticket]/                          # 审批单详情动态路由
    ├── page.tsx / page.test.tsx
```

## 使用示例

```tsx
// 服务端：加载审批快照
import { loadApprovalsSnapshot } from './approvals-data';

const snapshot = await loadApprovalsSnapshot();
// 返回: { deliveryMode: 'mock', approvals: ApprovalRecord[], generatedAt: string }

// 客户端：批准审批单
import { approveApproval } from './approvals-data';
await approveApproval('APR-001');
// 返回: { id: 'APR-001', status: 'approved' }

// 客户端：驳回审批单
import { rejectApproval } from './approvals-data';
await rejectApproval('APR-002');
// 返回: { id: 'APR-002', status: 'rejected' }

// 客户端：提交审批意见
import { submitApprovalComment } from './approvals-data';
const result = await submitApprovalComment('APR-001', '预算合理，同意采购');
// 返回: { id: 'APR-001', comment: '预算合理，同意采购', createdAt: '2026-07-27T...' }

// 审批记录类型声明（数据层导出）
import type { ApprovalRecord, ApprovalType, ApprovalStatus } from './approvals-data';
// ApprovalRecord: { id, type, applicant, store, amount, status, createdAt, updatedAt, description, comment, approver }
// ApprovalType: 'purchase' | 'expense' | 'campaign' | 'leave'
// ApprovalStatus: 'pending' | 'approved' | 'rejected' | 'withdrawn'
```

## 相关 REST API

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/v1/approvals` | 获取审批列表（支持 status/type 查询参数筛选） |
| GET | `/api/v1/approvals/:ticketId` | 获取单条审批详情 |
| POST | `/api/v1/approvals/:ticketId/approve` | 批准指定审批单 |
| POST | `/api/v1/approvals/:ticketId/reject` | 驳回指定审批单 |
| POST | `/api/v1/approvals/:ticketId/comment` | 提交审批意见 |
| GET | `/api/v1/approvals/stats` | 获取审批统计（待审批数/本月金额/通过率等） |

> 当前页面使用本地 Mock 样本数据（`DEFAULT_APPROVALS`），写操作（`submitApprovalComment`/`approveApproval`/`rejectApproval`）为状态变更模拟，仅更新前端内存态，不会影响真实审批系统。部署时需替换为真实后端审批服务。
