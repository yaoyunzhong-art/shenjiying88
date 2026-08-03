# Day14 T2: 高优先级模块 @Public 注解补充

**日期:** 2026-07-26
**作者:** 树哥 Trae
**耗时:** 6分钟
**状态:** ✅ 完成

## 任务目标

从最高优先级 controller 开始补充 `@Public()` 注解。目标 10 个。

## 执行过程

### 1. 高优模块扫描

预设的高优模块列表（`cashier inventory product logistics stock store billing payment marketing loyalty coupon analytics notification report`）在项目中均不存在独立目录，因为项目模块结构为中文业务命名。

### 2. 全量未注解 Controller 扫描

```
find apps/api/src/modules -name "*.controller.ts" -not -name "*.spec.ts" -not -name "*.test.ts"
```

全量发现：**202 个无注解 controller**。

### 3. 精选 10 个高优先级 Controller

按业务核心度（租户系统、权限系统、分析系统、支付/费用、营销核心、合同管理、考勤）选择：

| # | 文件 | 模块 | 优先级理由 |
|---|------|------|-----------|
| 1 | `rbac/rbac.controller.ts` | 权限控制 | 核心安全模块 |
| 2 | `tenant/tenant.controller.ts` | 多租户管理 | SAAS 基石 |
| 3 | `tenant/tenant-quota.controller.ts` | 租户配额 | 资源管控 |
| 4 | `webhook/webhook.controller.ts` | Webhook | 集成通道 |
| 5 | `analytics-v2/analytics-v2.controller.ts` | 分析 v2 | 数据驱动 |
| 6 | `expense/expense.controller.ts` | 费用管理 | 财务核心 |
| 7 | `marketing-metrics/marketing-metrics.controller.ts` | 营销指标 | 营销数据 |
| 8 | `contract-manager/contract-manager.controller.ts` | 合同管理 | 合同系统 |
| 9 | `store-revenue-report/store-revenue-report.controller.ts` | 门店收入报表 | 门店核心 |
| 10 | `attendance/attendance.controller.ts` | 考勤管理 | HR 核心 |

### 4. 操作步骤

每文件执行：
1. 使用 `sed` 在 `export class` 前插入 `@Public()`
2. 在最后一个 import 行后添加 `import { Public } from '../foundation/identity-access/public.decorator'`

### 5. 修复

`marketing-metrics/marketing-metrics.controller.ts` 因 import 块被 sed 拆分，手动修复了 import 顺序。

## 验证结果

| 检查项 | 结果 |
|--------|------|
| TSC `--noEmit` | ✅ 0 errors |
| @Public() 存在 | ✅ 10/10 |
| import 存在 | ✅ 10/10 |
| Git commit | ✅ `df8e28ff7` |
| Git push | ✅ origin (GitHub) |

## 剩余工作

- 仍有 **192 个 controller** 无注解，建议后续批次覆盖
- 建议按模块优先级分批（Day15-T2 可覆盖下一批 20 个）
