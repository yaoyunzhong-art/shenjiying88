# P-30 SSE后勤模块专项审计

> 更新时间: 2026-07-14 23:12
> 范围: `PRD-010` / `apps/api/src/modules/logistics/` / `apps/admin-web/app/stores/[id]/inspection/` / `apps/admin-web/app/stores/[id]/scheduling/` / `apps/admin-web/app/stores/[id]/inventory/` / `apps/api/src/modules/reservation/`
> 审计人: 🦞 龙虾哥 × 🌲 树哥

## 1. 审计结论

**评级: 🟡 已补主圈梁（5.0/5）**

P-30 当前已经把 `RQ-30-01 设备巡检`、`RQ-30-02 清洁排班`、`RQ-30-03 维修工单` 与 `RQ-30-04 物料申领` 做成了四条主闭环：`apps/api/src/modules/logistics/` 既提供巡检任务、提醒发送、结果记录与“已巡检”状态回写，也提供清洁排班的 `排班 -> 区域分配 -> 考勤签到` 主链、维修工单的 `报修 -> 派单 -> 维修 -> 验收` 主链，以及物料申领的 `申领 -> 审批 -> 出库` 主链。前端巡检页、排班页与库存页已分别承担巡检、排班与物料流转展示，其中 `inventory/page.tsx` 已接入 `/api/logistics/material-requests` 的真实申领、审批、出库链路，并通过 `x-tenant-id` 维持租户隔离。当前 Phase 口径可更新为 `🟡 已补主圈梁`，仍待浏览器级证据与持续回归收口。

## 2. PRD需求覆盖检查

| RQ-ID | 需求 | 代码 | 测试 | 状态 |
|:-----:|:-----|:----:|:----:|:----:|
| RQ-30-01 | 设备巡检 | `logistics.service.ts` / `logistics.controller.ts` / `inspection/page.tsx` | ✅ `logistics-ringbeam.test.ts` / `logistics.e2e.test.ts` / `inspection/page.test.ts` | ✅ |
| RQ-30-02 | 清洁排班 | `logistics.service.ts` / `logistics.controller.ts` / `scheduling/page.tsx` | ✅ `logistics-ringbeam.test.ts` / `logistics.e2e.test.ts` / `scheduling/page.test.tsx` | ✅ |
| RQ-30-03 | 维修工单 | `logistics.service.ts` / `logistics.controller.ts` / `inspection/page.tsx`(派单样板) | ✅ `logistics-ringbeam.test.ts` / `logistics.e2e.test.ts` | ✅ |
| RQ-30-04 | 物料申领 | `logistics.service.ts` / `logistics.controller.ts` / `inventory/page.tsx` | ✅ `logistics-ringbeam.test.ts` / `logistics.e2e.test.ts` / `inventory/page.test.tsx` | ✅ |

**PRD覆盖率: 4 / 4 完整闭环，0 / 4 仅底座，0 / 4 未实现。**

## 3. 现有可复用资产

### 3.1 巡检主链

| 文件 | 说明 |
|:----|:-----|
| `apps/api/src/modules/logistics/logistics.service.ts` | 巡检任务创建、提醒发送、结果记录、状态回写 |
| `apps/api/src/modules/logistics/logistics.controller.ts` | 巡检 HTTP 入口 |
| `apps/api/src/modules/logistics/logistics-ringbeam.test.ts` | AC-30-01 / AC-30-02 主圈梁 |
| `apps/api/src/modules/logistics/logistics.e2e.test.ts` | 创建 -> 提醒 -> 记录结果 全链路 |

### 3.2 维修工单主链

| 文件 | 说明 |
|:----|:-----|
| `apps/api/src/modules/logistics/logistics.service.ts` | 工单创建、派单通知、开始维修、维修完成、验收回写 |
| `apps/api/src/modules/logistics/logistics.controller.ts` | 维修工单 HTTP 入口 |
| `apps/api/src/modules/logistics/logistics-ringbeam.test.ts` | AC-30-03 / AC-30-04 主圈梁 |
| `apps/api/src/modules/logistics/logistics.e2e.test.ts` | 报修 -> 派单 -> 维修 -> 验收 全链路 |

### 3.3 清洁排班主链

| 文件 | 说明 |
|:----|:-----|
| `apps/api/src/modules/logistics/logistics.service.ts` | 排班创建、区域分配、考勤签到回写 |
| `apps/api/src/modules/logistics/logistics.controller.ts` | 清洁排班 HTTP 入口 |
| `apps/api/src/modules/logistics/logistics-ringbeam.test.ts` | `RQ-30-02` service 主圈梁 |
| `apps/api/src/modules/logistics/logistics.e2e.test.ts` | 排班 -> 区域分配 -> 签到 全链路 |

### 3.4 前端样板

| 文件 | 说明 |
|:----|:-----|
| `apps/admin-web/app/stores/[id]/inspection/page.tsx` | 巡检列表、统计、筛选、新建巡检、失败项派单维修按钮 |
| `apps/admin-web/app/stores/[id]/inspection/page.test.ts` | 前端静态证据，覆盖标题、筛选、统计、表格、按钮 |
| `apps/admin-web/app/stores/[id]/scheduling/page.tsx` | 排班列表、班次视图、状态统计、新建排班、调班申请、考勤统计入口 |
| `apps/admin-web/app/stores/[id]/scheduling/page.test.tsx` | 排班静态证据，覆盖排班数据、列定义、统计卡、防御检查 |
| `apps/admin-web/app/stores/[id]/inventory/page.tsx` | 耗材列表、库存状态、入库/出库按钮，并已接入 `material-requests` 真实申领流转 |
| `apps/admin-web/app/stores/[id]/inventory/page.test.tsx` | 物料静态证据，覆盖耗材数据、`material-requests` 接口、`x-tenant-id` 与三态流转 |

### 3.5 后端排班/状态机底座

| 文件 | 说明 |
|:----|:-----|
| `apps/api/src/modules/reservation/reservation.service.ts` | 时间范围、冲突检测、状态流转、多租户隔离 |
| `apps/api/src/modules/reservation/reservation.service.test.ts` | ReservationService 业务规则测试 |
| `apps/api/src/modules/reservation/reservation.e2e.test.ts` | Reservation HTTP 链路与状态机测试 |
| `docs/knowledge/reservation-audit.md` | reservation 模块级审计，不等于 P-30 Phase 审计 |

## 4. 关键判断

```text
PRD-010
  ├── 设备巡检: 已有任务/提醒/结果/状态闭环
  ├── 清洁排班: 已有排班/区域分配/考勤签到闭环
  ├── 维修工单: 已有报修/派单/维修/验收闭环
  └── 物料申领: 已有申领/审批/出库闭环
```

当前应把 `reservation` 视作通用状态机底座，不再承担清洁排班、维修工单与物料申领的主语义。

## 5. 缺口清单

| 缺口 | 类型 | 严重度 | 建议 |
|:-----|:----:|:------:|:-----|
| 浏览器级实操证据未补 | 验收 | 🟡 P1 | 增加 admin-web / 门店端真实操作抽检 |
| `inspection / scheduling` 仍是静态样板页 | 前端 | 🟡 P1 | 按 `inventory` 的接法补真接口联调，再进入浏览器验收 |
| P-30 专项脚本已接 Nightly，但尚未形成首轮归档证据 | 流程 | 🟡 P2 | 观察下一轮 `08c-phase30-logistics.log` 与归档产物，再决定是否补独立 CI job |

## 6. 建议的下一轮最小闭环

1. 优先补 `inspection / scheduling` 真接口联调，避免浏览器验收只剩 `inventory` 一页可实操。
2. 下一轮转去浏览器级验收，补 `inspection / scheduling / inventory` 页面与真实接口联动抽检。
3. 观察 P-30 Nightly 专项的首轮日志与留档，再决定是否补独立 CI job / summary / artifact。
4. 继续保留 `reservation` 为通用状态机底座，避免和已独立的后勤主语义混淆。

## 7. 验证记录

```bash
pnpm --dir apps/api exec vitest run src/modules/logistics/logistics-ringbeam.test.ts src/modules/logistics/logistics.e2e.test.ts
pnpm --dir apps/api exec vitest run src/modules/reservation/reservation.service.test.ts src/modules/reservation/reservation.e2e.test.ts
pnpm --dir apps/admin-web exec node --import tsx ./app/stores/[id]/inspection/page.test.ts
pnpm --dir apps/admin-web exec node --import tsx ./app/stores/[id]/scheduling/page.test.tsx
pnpm --dir apps/admin-web exec node --import tsx ./app/stores/[id]/inventory/page.test.tsx
pnpm --dir apps/admin-web exec node --import tsx --test app/api/logistics/material-requests/route.test.ts
pnpm --dir apps/admin-web exec tsc -p tsconfig.json --noEmit
pnpm run test:phase30:logistics
bash scripts/prd-validate.sh
```
