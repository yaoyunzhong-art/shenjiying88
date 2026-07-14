# P-30 SSE后勤模块专项审计

> 更新时间: 2026-07-14 15:25
> 范围: `PRD-010` / `apps/admin-web/app/stores/[id]/inspection/` / `apps/api/src/modules/reservation/`
> 审计人: 🦞 龙虾哥 × 🌲 树哥

## 1. 审计结论

**评级: 🔴 已建档但未形成主链（2.4/5）**

P-30 当前不是“完全没有代码”，但也绝不能报成“已补主圈梁”。现状更准确地说是：前端有一页巡检管理样板，后端有一个通用预约/状态机底座，二者能支撑后勤模块继续开发，却还没有真正对齐 `PRD-010` 的后勤闭环。

## 2. PRD需求覆盖检查

| RQ-ID | 需求 | 代码 | 测试 | 状态 |
|:-----:|:-----|:----:|:----:|:----:|
| RQ-30-01 | 设备巡检 | `inspection/page.tsx` | ✅ `inspection/page.test.ts` | 🟡 |
| RQ-30-02 | 清洁排班 | ❌ | ❌ | 🔴 |
| RQ-30-03 | 维修工单 | `inspection/page.tsx`(按钮) + `reservation.service.ts`(可复用状态机) | ✅ `reservation.service.test.ts` / `reservation.e2e.test.ts` | 🔴 |
| RQ-30-04 | 物料申领 | ❌ | ❌ | 🔴 |

**PRD覆盖率: 0 / 4 完整闭环，1 / 4 有前端样板，1 / 4 仅有后端底座。**

## 3. 现有可复用资产

### 3.1 巡检前端样板

| 文件 | 说明 |
|:----|:-----|
| `apps/admin-web/app/stores/[id]/inspection/page.tsx` | 巡检列表、统计、筛选、新建巡检、失败项派单维修按钮 |
| `apps/admin-web/app/stores/[id]/inspection/page.test.ts` | 前端静态证据，覆盖标题、筛选、统计、表格、按钮 |

### 3.2 后端排班/状态机底座

| 文件 | 说明 |
|:----|:-----|
| `apps/api/src/modules/reservation/reservation.service.ts` | 时间范围、冲突检测、状态流转、多租户隔离 |
| `apps/api/src/modules/reservation/reservation.service.test.ts` | ReservationService 业务规则测试 |
| `apps/api/src/modules/reservation/reservation.e2e.test.ts` | Reservation HTTP 链路与状态机测试 |
| `docs/knowledge/reservation-audit.md` | reservation 模块级审计，不等于 P-30 Phase 审计 |

## 4. 关键判断

```text
PRD-010
  ├── 设备巡检: 前端样板已存在，但缺提醒/落库/结果回写
  ├── 清洁排班: 尚无模块
  ├── 维修工单: 只有按钮和通用状态机底座，缺工单语义
  └── 物料申领: 尚无模块
```

当前应把 `reservation` 视作“可复用底座”，而不是直接等同于 “SSE后勤模块已实现”。

## 5. 缺口清单

| 缺口 | 类型 | 严重度 | 建议 |
|:-----|:----:|:------:|:-----|
| 巡检结果缺后端落库与提醒 | 功能 | 🔴 P0 | 新增 inspection task / result 后端链路 |
| 清洁排班缺排班与考勤模型 | 功能 | 🔴 P0 | 新增 clean schedule 子模块 |
| 维修工单缺工单语义与派单通知 | 功能 | 🔴 P0 | 从 reservation 底座拆出 repair order 子模块 |
| 物料申领缺审批与出库 | 功能 | 🟡 P1 | 新增 material request 子模块 |

## 6. 建议的下一轮最小闭环

1. 先把 `RQ-30-01` 做成真闭环：巡检任务 + 到点提醒 + 结果保存 + 已巡检状态。
2. 复用 `reservation` 的时间/状态机能力，但不要继续沿用 “reservation” 语义去包装维修工单。
3. 清洁排班和物料申领在文档中保留缺口，避免被误报成已实现。

## 7. 验证记录

```bash
pnpm --dir apps/api exec vitest run src/modules/reservation/reservation.service.test.ts src/modules/reservation/reservation.e2e.test.ts
pnpm --dir apps/admin-web exec node --import tsx ./app/stores/[id]/inspection/page.test.ts
bash scripts/prd-validate.sh
```
