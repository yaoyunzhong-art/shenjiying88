# 🗺️ PRD: 费用报销模块

> 状态: 🟢 已交付
> 日期: 2026-07-21 | 圈梁: 代码✅ 测试✅ TSC✅ PRD补写
> 关联Phase: V23
> 产出: `apps/api/src/modules/expense/`

---

## 1. 业务背景

费用报销是企业日常运营中必不可少的财务功能。门店员工需要提交各类费用申请（差旅、办公用品、设备采购等），经管理人员审批后由财务完成报销。

**现有基础**: 财务相关模块有 `finance`（财务对账P-38）和 `report`（报表看板V10/V23），但缺少独立的费用报销模块。

**本次新增**: `expense` 模块，覆盖费用申请→审批→报销全流程，并提供费用统计能力。

**业务收益**:
- 门店员工可在线提交费用申请，减少纸质单据
- 管理人员可审批/驳回费用请求，加强费用管控
- 财务人员可完成报销操作，跟踪报销状态
- 管理层可按类别/门店/时间维度统计费用支出

---

## 2. 需求卡

| RQ | 标题 | 优先级 | 验收标准 |
|:---|:-----|:------:|:---------|
| RQ-EXP-01 | 创建费用申请（草稿） | P0 | 填写标题/类别/金额/申请人/门店等信息，返回 code 和 id |
| RQ-EXP-02 | 提交审批（draft → pending） | P0 | 仅草稿可提交，提交后状态变为待审批 |
| RQ-EXP-03 | 审批操作（approve / reject） | P0 | 待审批状态可审批通过或驳回，记录审批人和备注 |
| RQ-EXP-04 | 报销操作（approved → reimbursed） | P0 | 已通过状态可报销，记录报销方式和账户 |
| RQ-EXP-05 | 费用申请列表（支持筛选） | P1 | 按状态/类别/申请人/门店/时间筛选 |
| RQ-EXP-06 | 费用详情（含审批历史） | P1 | 查看申请详情及完整审批记录 |
| RQ-EXP-07 | 费用统计汇总 | P1 | 按周期/类别/门店聚合，统计金额和数量 |
| RQ-EXP-08 | 取消申请（任意状态 → cancelled） | P1 | 已报销状态不可取消 |
| RQ-EXP-09 | 删除草稿 | P1 | 仅草稿状态可删除 |
| RQ-EXP-10 | 9 种费用类别支持 | P2 | 差旅/住宿/餐饮/办公/设备/市场/培训/维修/其他 |

---

## 3. 验收卡

| AC | 场景 | 前置 | 预期 |
|:---|:-----|:-----|:-----|
| AC-EXP-01 | 创建费用申请 | 填写完整信息 | 返回 code（EXP 开头），status=draft |
| AC-EXP-02 | 提交审批 | 草稿申请 | status=changed to pending |
| AC-EXP-03 | 审批通过 | 待审批申请 | status=approved，记录审批人/时间/备注 |
| AC-EXP-04 | 审批驳回 | 待审批申请 | status=rejected，记录驳回原因 |
| AC-EXP-05 | 报销操作 | 已通过申请 | status=reimbursed，记录方式/账户/时间 |
| AC-EXP-06 | 完整生命周期 | 创建→提交→审批→报销 | 4 个状态正确流转 |
| AC-EXP-07 | 费用统计 | 有 3 条种子数据 | totalAmount/totalReimbursed/totalPending/totalRejected 正确 |
| AC-EXP-08 | 分类统计 | 种子数据含差旅/餐饮/办公 | byCategory 值正确（travel=2500, meals=1800, office=3500） |
| AC-EXP-09 | 门店统计 | 种子数据含 store-001/store-002 | byStore 值正确 |
| AC-EXP-10 | 异常：待审批不可删除 | 状态=pending | 抛出错误 |
| AC-EXP-11 | 异常：已审批不可重复审批 | 审批通过 | 抛出错误 |
| AC-EXP-12 | 异常：已报销不可取消 | 已报销 | 抛出错误 |
| AC-EXP-13 | 9 条路由元数据注册 | — | 9 个端点全部注册 |
| AC-EXP-14 | 8 角色视角 | 店长/前台/HR/安监/导玩员/运行专员/团建/营销 | 各自场景用例通过 |

---

## 4. 数据模型

### ExpenseReimbursement (费用报销申请)

```typescript
interface ExpenseReimbursement {
  id: string
  code: string       // 申请单号 EXP000001
  title: string      // 标题
  category: ExpenseCategory  // 费用类别
  amount: number     // 金额
  applicantId: string
  applicantName: string
  storeId: string    // 所属门店
  expenseDate: string
  description: string
  attachments: string[]
  status: ExpenseStatus  // draft/pending/approved/rejected/reimbursed/cancelled
  approverId?: string
  approvalRemark?: string
  approvalAt?: string
  reimbursementMethod?: 'bank' | 'cash' | 'wechat' | 'alipay'
  reimbursementAccount?: string
  reimbursedAt?: string
  createdAt: string
  updatedAt: string
}
```

### ExpenseStatus (6 种状态流转)

```
draft ──submit──→ pending ──approve──→ approved ──reimburse──→ reimbursed
                      │                    │
                  └──reject──→ rejected     │
                                           │
                      ┌────────────────────┘
                      ↓
                 cancel (draft/pending/approved/rejected → cancelled)
                 (reimbursed 不可取消)
```

### ExpenseCategory (9 种费用类别)

| 编码 | 中文名 |
|:-----|:-------|
| travel | 差旅交通 |
| accommodation | 住宿 |
| meals | 餐饮招待 |
| office | 办公用品 |
| equipment | 设备采购 |
| marketing | 市场推广 |
| training | 培训教育 |
| maintenance | 维修保养 |
| other | 其他 |

---

## 5. API 端点

| 方法 | 路径 | 请求 | 响应 | 说明 |
|:----|:-----|:-----|:-----|:-----|
| POST | `/expense/create` | `{ title, category, amount, applicantId, applicantName, storeId, expenseDate, description, attachments? }` | `ExpenseReimbursement` | 创建草稿 |
| POST | `/expense/submit/:id` | — | `ExpenseReimbursement` | 提交审批 |
| POST | `/expense/approve/:id` | `{ action, approverId, approverName, remark? }` | `ExpenseReimbursement` | 审批/驳回 |
| POST | `/expense/reimburse/:id` | `{ method, account, operatorId, operatorName }` | `ExpenseReimbursement` | 报销 |
| POST | `/expense/cancel/:id` | `{ operatorId, operatorName, remark? }` | `ExpenseReimbursement` | 取消 |
| GET | `/expense/list` | `?status&category&applicantId&storeId&from&to` | `{ items, total }` | 列表查询 |
| GET | `/expense/:id` | — | `ExpenseDetail` | 含审批历史 |
| DELETE | `/expense/:id` | — | `{ success, id }` | 删除草稿 |
| GET | `/expense/summary` | `?period&from&to&storeId?` | `ExpenseSummary` | 统计汇总 |

---

## 6. 接口草图

```typescript
// Controller
@Controller('expense')
@UseGuards(TenantGuard)
export class ExpenseController {
  @Post('create')
  createExpense(@Body() body: CreateExpenseDto): ExpenseReimbursement

  @Post('submit/:id')
  submitExpense(@Param('id') id: string): ExpenseReimbursement

  @Post('approve/:id')
  approveExpense(@Param('id') id: string, @Body() body: ApproveDto): ExpenseReimbursement

  @Post('reimburse/:id')
  reimburseExpense(@Param('id') id: string, @Body() body: ReimburseDto): ExpenseReimbursement

  @Post('cancel/:id')
  cancelExpense(@Param('id') id: string, @Body() body: CancelDto): ExpenseReimbursement

  @Get('list')
  listExpenses(@Query() query: ListQuery): { items: ExpenseReimbursement[]; total: number }

  @Get(':id')
  getExpense(@Param('id') id: string): ExpenseDetail

  @Delete(':id')
  deleteExpense(@Param('id') id: string): { success: boolean; id: string }

  @Get('summary')
  getSummary(@Query('period') period: string, @Query('from') from: string, @Query('to') to: string, @Query('storeId') storeId?: string): ExpenseSummary
}
```

---

## 7. 不在范围

- 不与实际支付网关对接（报销操作仅更新状态）
- 不自动生成凭证/总账分录
- 不涉及审批流多级审批（仅单级审批）
- 不包含文件上传功能（attachments 使用 URL 引用）
- 不做与已有 `finance` 模块的数据同步（本次独立运行）

---

## 8. 影响面

| 端 | 影响范围 | 说明 |
|:---|:---------|:-----|
| ✅ API | `expense/` 模块 | 全新模块 10 个文件 |
| ✅ API | 实体 `expense.entity.ts` | 类型定义+状态常量+标签常量 |
| ✅ API | 合约 `expense.contract.ts` | 对外暴露的安全合约+Mapper |
| ✅ API | DTO `expense.dto.ts` | 请求/响应 DTO |
| ✅ API | Service `expense.service.ts` | 业务逻辑+审批流+统计 |
| ✅ API | Controller `expense.controller.ts` | 9 个端点 |
| ✅ API | Module `expense.module.ts` | NestJS Module |
| ❌ admin-web | 无 | 暂不涉及前端 |
| ❌ storefront | 无 | 暂不涉及前端 |

---

## 9. 验证方式

| 项 | 方法 | 说明 |
|:---|:-----|:-----|
| 单元测试 | `vitest run src/modules/expense/` | entity test + controller test |
| 路由元数据 | `expense.controller.test.ts` | 9 个路由验证 |
| TSC | `tsc --noEmit` | 零错误 |
| 审批流程验证 | 测试完整生命周期 | 4 步流转验证 |
| 统计数据验证 | 注入+聚合测试 | byCategory/byStore 正确 |
| 8 角色视角 | 角色场景测试 | 店长/前台/HR/安监/导玩员/运行专员/团建/营销 |
