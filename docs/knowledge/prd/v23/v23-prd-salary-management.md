# 🗺️ PRD: 薪资/薪酬管理模块

> 状态: 🟢 已交付
> 日期: 2026-07-21 | 圈梁: 代码✅ 测试✅ TSC✅ PRD补写
> 关联Phase: V23
> 产出: `apps/api/src/modules/salary/`

---

## 1. 业务背景

薪资/薪酬管理是门店运营中的核心财务管理功能。企业需要对员工的月度薪资、提成、绩效奖金等进行精确计算、审批和发放。

**现有基础**: 已有 `expense`（费用报销V23）和 `finance`（财务对账P-38）模块，但缺少独立的薪资管理模块。

**本次新增**: `salary` 模块，覆盖薪资计算→审批→发放全流程，支持多种薪资模式，并提供薪资统计能力。

**业务收益**:
- 财务人员可根据考勤/业绩数据快速计算薪资，减少人工计算错误
- 管理人员可审批薪资单，确保薪资发放合规
- 财务人员可完成银行转账/现金等发放操作
- 管理层可按门店/薪资模式/时间维度统计薪资支出

---

## 2. 需求卡

| RQ | 标题 | 优先级 | 验收标准 |
|:---|:-----|:------:|:---------|
| RQ-SAL-01 | 薪资计算并创建（草稿） | P0 | 根据输入的收入项和扣款项自动计算 grossPay / deductions / netPay |
| RQ-SAL-02 | 提交审批（draft → pending） | P0 | 仅草稿可提交，提交后状态变为待审批 |
| RQ-SAL-03 | 审批操作（approve / reject） | P0 | 待审批状态可审批通过或驳回，记录审批人和备注 |
| RQ-SAL-04 | 发放操作（approved → paid） | P0 | 已通过状态可发放，记录发放方式和账户 |
| RQ-SAL-05 | 薪资单列表（支持筛选） | P1 | 按状态/门店/员工/周期筛选 |
| RQ-SAL-06 | 薪资详情（含审批历史） | P1 | 查看薪资单详情及完整审批记录 |
| RQ-SAL-07 | 薪资统计汇总 | P1 | 按周期/门店/模式聚合，统计金额和人数 |
| RQ-SAL-08 | 取消薪资单 | P1 | 已发放状态不可取消 |
| RQ-SAL-09 | 删除草稿 | P1 | 仅草稿状态可删除 |
| RQ-SAL-10 | 四种薪资模式支持 | P2 | 月度薪资/时薪制/纯提成制/混合模式 |
| RQ-SAL-11 | 10 种薪资项目 | P2 | 基本工资/奖金/加班费/提成/津贴/社保/公积金/个税/其他扣款/报销补发 |

---

## 3. 验收卡

| AC | 场景 | 前置 | 预期 |
|:---|:-----|:-----|:-----|
| AC-SAL-01 | 创建薪资单（基本工资+社保） | 输入 base=8000, social=1000, tax=500 | grossPay=8000, deductions=1500, netPay=6500 |
| AC-SAL-02 | 创建薪资单（提成制） | mode=commission, commission=7500 | mode=commission, grossPay=7500 |
| AC-SAL-03 | 提交审批 | 草稿薪资单 | status=changed to pending |
| AC-SAL-04 | 审批通过 | 待审批薪资单 | status=approved，记录审批人/时间/备注 |
| AC-SAL-05 | 审批驳回 | 待审批薪资单 | status=rejected，记录驳回原因 |
| AC-SAL-06 | 发放操作 | 已通过薪资单 | status=paid，记录方式/账户/时间 |
| AC-SAL-07 | 完整生命周期 | 计算→提交→审批→发放 | 4 个状态正确流转 |
| AC-SAL-08 | 薪资统计 | 有 3 条种子数据 | totalGross/totalNet/totalPaid 正确 |
| AC-SAL-09 | 门店统计 | 种子数据含 store-001/store-002 | byStore 值正确 |
| AC-SAL-10 | 模式统计 | 种子数据含 monthly/commission/mixed | byMode 值正确 |
| AC-SAL-11 | 异常：待审批不可删除 | 状态=pending | 抛出错误 |
| AC-SAL-12 | 异常：已审批不可重复审批 | 审批通过 | 抛出错误 |
| AC-SAL-13 | 异常：已发放不可取消 | 已发放 | 抛出错误 |
| AC-SAL-14 | 9 条路由元数据注册 | — | 9 个端点全部注册 |
| AC-SAL-15 | 8 角色视角 | 店长/前台/HR/安监/导玩员/运行专员/团建/营销 | 各自场景用例通过 |

---

## 4. 数据模型

### PayrollRecord (薪资发放记录)

```typescript
interface PayrollRecord {
  id: string
  code: string         // 薪资单号 SAL000001
  storeId: string      // 所属门店
  period: string       // 薪资周期 2026-07
  employeeId: string   // 员工 ID
  employeeName: string // 员工姓名
  mode: SalaryMode     // 薪资模式
  grossPay: number     // 应发合计
  totalDeductions: number // 扣款合计
  netPay: number       // 实发金额
  items: SalaryLineItem[] // 明细项
  status: SalaryStatus // 当前状态
  approverId?: string
  approvalRemark?: string
  approvalAt?: string
  paymentMethod?: PaymentMethod
  paymentAccount?: string
  paidAt?: string
  paidBy?: string
  paidByName?: string
  remark?: string
  createdAt: string
  updatedAt: string
}
```

### SalaryStatus (6 种状态流转)

```
draft ──submit──→ pending ──approve──→ approved ──pay──→ paid
                      │                    │
                  └──reject──→ rejected     │
                                           │
                      ┌────────────────────┘
                      ↓
                 cancel (draft/pending/approved/rejected → cancelled)
                 (paid 不可取消)
```

### SalaryMode (4 种薪资模式)

| 编码 | 中文名 | 说明 |
|:-----|:-------|:-----|
| monthly | 月度薪资 | 固定月薪+绩效 |
| hourly | 时薪制 | 按小时计薪 |
| commission | 纯提成制 | 完全按业绩提成 |
| mixed | 混合模式 | 底薪+提成 |

### SalaryItem (10 种薪资项目)

| 编码 | 中文名 | 类型 |
|:-----|:-------|:-----|
| base | 基本工资 | 收入 |
| bonus | 绩效奖金 | 收入 |
| overtime | 加班费 | 收入 |
| commission | 提成 | 收入 |
| allowance | 津贴补助 | 收入 |
| reimbursement | 报销补发 | 收入 |
| social_security | 社保扣款 | 扣款 |
| housing_fund | 公积金扣款 | 扣款 |
| tax | 个税扣款 | 扣款 |
| deduction | 其他扣款 | 扣款 |

---

## 5. API 端点

| 方法 | 路径 | 请求 | 响应 | 说明 |
|:----|:-----|:-----|:-----|:-----|
| POST | `/salary/calculate` | `{ employeeId, employeeName, storeId, period, mode, baseSalary?, bonus?, ... }` | `PayrollRecord` | 创建薪资草稿 |
| POST | `/salary/submit/:id` | — | `PayrollRecord` | 提交审批 |
| POST | `/salary/approve/:id` | `{ action, approverId, approverName, remark? }` | `PayrollRecord` | 审批/驳回 |
| POST | `/salary/pay/:id` | `{ method, account, operatorId, operatorName }` | `PayrollRecord` | 发放 |
| POST | `/salary/cancel/:id` | `{ operatorId, operatorName, remark? }` | `PayrollRecord` | 取消 |
| GET | `/salary/list` | `?status&storeId&employeeId&period&from&to` | `{ items, total }` | 列表查询 |
| GET | `/salary/:id` | — | `PayrollDetail` | 含审批历史 |
| DELETE | `/salary/:id` | — | `{ success, id }` | 删除草稿 |
| GET | `/salary/summary` | `?period&from&to&storeId?` | `SalarySummary` | 统计汇总 |

---

## 6. 接口草图

```typescript
// Controller
@Controller('salary')
@UseGuards(TenantGuard)
export class SalaryController {
  @Post('calculate')
  calculatePayroll(@Body() body: CreatePayrollDto): PayrollRecord

  @Post('submit/:id')
  submitPayroll(@Param('id') id: string): PayrollRecord

  @Post('approve/:id')
  approvePayroll(@Param('id') id: string, @Body() body: ApproveDto): PayrollRecord

  @Post('pay/:id')
  payPayroll(@Param('id') id: string, @Body() body: PayDto): PayrollRecord

  @Post('cancel/:id')
  cancelPayroll(@Param('id') id: string, @Body() body: CancelDto): PayrollRecord

  @Get('list')
  listPayrolls(@Query() query: ListQuery): { items: PayrollRecord[]; total: number }

  @Get(':id')
  getPayroll(@Param('id') id: string): PayrollDetail

  @Delete(':id')
  deletePayroll(@Param('id') id: string): { success: boolean; id: string }

  @Get('summary')
  getSummary(@Query('period') period: string, @Query('from') from: string, @Query('to') to: string, @Query('storeId') storeId?: string): SalarySummary
}
```

---

## 7. 不在范围

- 不与实际银行/支付网关对接（发放操作仅更新状态）
- 不生成工资条/PDF（可后续基于 detail 扩展）
- 不涉及审批流多级审批（仅单级审批）
- 不与考勤系统自动联动（workingDays/attendanceDays 由外部传入）
- 不涉及税务申报凭证生成
- 不做与已有 `finance` / `expense` 模块的数据同步（本次独立运行）

---

## 8. 影响面

| 端 | 影响范围 | 说明 |
|:---|:---------|:-----|
| ✅ API | `salary/` 模块 | 全新模块 10 个文件 |
| ✅ API | 实体 `salary.entity.ts` | 类型定义+状态常量+标签常量 |
| ✅ API | 合约 `salary.contract.ts` | 对外暴露的安全合约+Mapper |
| ✅ API | DTO `salary.dto.ts` | 请求/响应 DTO |
| ✅ API | Service `salary.service.ts` | 薪资计算+审批流+统计 |
| ✅ API | Controller `salary.controller.ts` | 9 个端点 |
| ✅ API | Module `salary.module.ts` | NestJS Module |
| ❌ admin-web | 无 | 暂不涉及前端 |
| ❌ storefront | 无 | 暂不涉及前端 |

---

## 9. 验证方式

| 项 | 方法 | 说明 |
|:---|:-----|:-----|
| 单元测试 | `vitest run src/modules/salary/` | entity test + controller test |
| 路由元数据 | `salary.controller.test.ts` | 9 个路由验证 |
| TSC | `tsc --noEmit` | 零错误 |
| 审批流程验证 | 测试完整生命周期 | 4 步流转验证 |
| 统计数据验证 | 注入+聚合测试 | byStore/byMode 正确 |
| 8 角色视角 | 角色场景测试 | 店长/前台/HR/安监/导玩员/运行专员/团建/营销 |
