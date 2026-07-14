# P-30 SSE后勤模块专项审计

> 更新时间: 2026-07-14 18:20
> 范围: `PRD-010` / `apps/api/src/modules/logistics/` / `apps/admin-web/app/stores/[id]/inspection/` / `apps/api/src/modules/reservation/`
> 审计人: 🦞 龙虾哥 × 🌲 树哥

## 1. 审计结论

**评级: 🟡 已补主圈梁（3.7/5）**

P-30 当前已经把 `RQ-30-01 设备巡检` 做成了主闭环：`apps/api/src/modules/logistics/` 提供了巡检任务、提醒发送、结果记录与“已巡检”状态回写，前端巡检页可以作为配套展示样板。其余 `清洁排班 / 维修工单 / 物料申领` 仍未完成，所以还不能报成整体完成。

## 2. PRD需求覆盖检查

| RQ-ID | 需求 | 代码 | 测试 | 状态 |
|:-----:|:-----|:----:|:----:|:----:|
| RQ-30-01 | 设备巡检 | `logistics.service.ts` / `logistics.controller.ts` / `inspection/page.tsx` | ✅ `logistics-ringbeam.test.ts` / `logistics.e2e.test.ts` / `inspection/page.test.ts` | ✅ |
| RQ-30-02 | 清洁排班 | ❌ | ❌ | 🔴 |
| RQ-30-03 | 维修工单 | `inspection/page.tsx`(按钮) + `reservation.service.ts`(可复用状态机) | ✅ `reservation.service.test.ts` / `reservation.e2e.test.ts` | 🟡 |
| RQ-30-04 | 物料申领 | ❌ | ❌ | 🔴 |

**PRD覆盖率: 1 / 4 完整闭环，1 / 4 有可复用后端底座，2 / 4 未实现。**

## 3. 现有可复用资产

### 3.1 巡检主链

| 文件 | 说明 |
|:----|:-----|
| `apps/api/src/modules/logistics/logistics.service.ts` | 巡检任务创建、提醒发送、结果记录、状态回写 |
| `apps/api/src/modules/logistics/logistics.controller.ts` | 巡检 HTTP 入口 |
| `apps/api/src/modules/logistics/logistics-ringbeam.test.ts` | AC-30-01 / AC-30-02 主圈梁 |
| `apps/api/src/modules/logistics/logistics.e2e.test.ts` | 创建 -> 提醒 -> 记录结果 全链路 |

### 3.2 巡检前端样板

| 文件 | 说明 |
|:----|:-----|
| `apps/admin-web/app/stores/[id]/inspection/page.tsx` | 巡检列表、统计、筛选、新建巡检、失败项派单维修按钮 |
| `apps/admin-web/app/stores/[id]/inspection/page.test.ts` | 前端静态证据，覆盖标题、筛选、统计、表格、按钮 |

### 3.3 后端排班/状态机底座

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
  ├── 清洁排班: 尚无模块
  ├── 维修工单: 有按钮和通用状态机底座，缺工单语义
  └── 物料申领: 尚无模块
```

当前应把 `reservation` 视作“可复用底座”，而不是直接等同于 “SSE后勤模块已实现”。

## 5. 缺口清单

| 缺口 | 类型 | 严重度 | 建议 |
|:-----|:----:|:------:|:-----|
| 清洁排班缺排班与考勤模型 | 功能 | 🔴 P0 | 新增 clean schedule 子模块 |
| 维修工单缺工单语义与派单通知 | 功能 | 🔴 P0 | 从 reservation 底座拆出 repair order 子模块 |
| 物料申领缺审批与出库 | 功能 | 🟡 P1 | 新增 material request 子模块 |

## 6. 建议的下一轮最小闭环

1. 继续沿 `logistics` 模块补 `RQ-30-03`，不要继续沿用 `reservation` 语义去包装维修工单。
2. 清洁排班优先补独立排班/考勤模型。
3. 物料申领在文档中继续保留缺口，避免被误报成已实现。

## 7. 验证记录

```bash
pnpm --dir apps/api exec vitest run src/modules/logistics/logistics-ringbeam.test.ts src/modules/logistics/logistics.e2e.test.ts
pnpm --dir apps/api exec vitest run src/modules/reservation/reservation.service.test.ts src/modules/reservation/reservation.e2e.test.ts
pnpm --dir apps/admin-web exec node --import tsx ./app/stores/[id]/inspection/page.test.ts
bash scripts/prd-validate.sh
```
