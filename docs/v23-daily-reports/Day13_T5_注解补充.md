# Day13 T5 — 店A核心controller补@Public注解（第1批5个）

**日期**: 2026-07-25  
**分支**: `tree/codeup-acr-ci-20260717`  
**提交**: `278c34102`

## 背景

T3 修复将全局守卫从 `默认拒绝` 改为 `默认放行`，这是临时方案。  
Day12 完成后需逐步给各模块补 `@Public()` 注解，为后续收紧全局守卫做准备。

## 本次范围

店A核心模块第1批，共 **5 个 controller**：

| # | Controller | 路径 | 状态 |
|---|-----------|------|------|
| 1 | CashierBillingController | `modules/cashier/cashier-billing.controller.ts` | ✅ |
| 2 | CashierTransactionController | `modules/cashier/cashier-transaction/transaction.controller.ts` | ✅ |
| 3 | FinanceController | `modules/finance/finance.controller.ts` | ✅ |
| 4 | MemberController | `modules/member/member.controller.ts` | ✅ |
| 5 | NotificationController | `modules/notification/notification.controller.ts` | ✅ |

## 修改内容

每个 controller 做两处修改：

1. **Import**: 添加 `import { Public } from '../foundation/identity-access/public.decorator'`
2. **类装饰器**: 在 `export class` 前添加 `@Public()`

> 注: `member.controller.ts` 已有 `Public` import，仅补充类装饰器。

## TSC 验证

```bash
cd apps/api && npx tsc --noEmit
# exit code: 0 ✅ 无类型错误
```

## 提交信息

```
feat(api): Day13-T5 店A核心controller补@Public注解
```

## 后续

- 第2批覆盖剩余店A模块（如 agent、tenant 等）
- 全部 controller 标注完成后，将全局守卫恢复为 `默认拒绝`
