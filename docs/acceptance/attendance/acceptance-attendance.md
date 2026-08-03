# ACC-005: 考勤管理 — Attendance 验收文档

> 版本: v1.0 · 验收人: 树哥A · 验收日期: 2026-07-28
> 关联PRD: [PRD-009 考勤管理](../prd/attendance/prd-attendance.md)
> 关联Phase: P-00
> 圈梁标记: 🏗️ 圈梁五道箍

---

## 1. 模块概述

考勤管理系统为门店员工提供上下班打卡、迟到/早退/加班自动判定、请假申请与审批、考勤统计汇总等核心能力。本验收档覆盖打卡记录、请假管理、统计汇总三大子功能。

**验收范围:**
- 上班打卡(正常/迟到判定)
- 下班打卡(早退/加班判定)
- 打卡记录查询与筛选
- 请假申请与审批全流程
- 考勤统计(按门店/时间范围)
- 异常场景(重复打卡/状态冲突)

---

## 2. 验收标准

### 2.1 打卡记录

#### AC-ATTENDANCE-09-01: 正常上班打卡
- **Given** 员工 员工A(emp-a), 门店 store-001, 上班时间 08:55
- **When** 调用 POST /attendance/clock-in
- **Then** status=normal, lateMinutes=0, id格式=clock-*

#### AC-ATTENDANCE-09-02: 迟到打卡
- **Given** 迟到员工, 打卡时间 10:15
- **When** 调用 clockIn
- **Then** status=late, lateMinutes=75 (10:15 - 09:00)

#### AC-ATTENDANCE-09-03: 下班打卡正常
- **Given** 已有上班打卡记录(09:00)
- **When** 下班打卡 18:00
- **Then** clockOut=18:00, earlyLeaveMinutes=0, overtimeMinutes=0

#### AC-ATTENDANCE-09-04: 早退判定
- **Given** 已有上班打卡记录(09:00)
- **When** 下班打卡 16:00
- **Then** status=early_leave, earlyLeaveMinutes=120

#### AC-ATTENDANCE-09-05: 加班判定
- **Given** 已有上班打卡记录(09:00)
- **When** 下班打卡 19:30
- **Then** status=overtime, overtimeMinutes=90

#### AC-ATTENDANCE-09-06: 加班优先于早退
- **Given** 员工 18:00下班但实际打卡 18:15(加班15分钟), 但早退计算为??(固定下班18:00)
- **When** clockOut=18:15
- **Then** overtimeMinutes=15 > 0, status=overtime (早退算0)

#### AC-ATTENDANCE-09-07: 缺少必填字段拒绝
- **Given** 请求中缺少 employeeId
- **When** 调用 clockIn
- **Then** 抛出 BadRequestException, 提示"Missing required fields"

#### AC-ATTENDANCE-09-08: 打卡记录列表
- **Given** 有3条打卡记录(不同员工/门店)
- **When** POST /attendance/records
- **Then** 返回3条记录

#### AC-ATTENDANCE-09-09: 按门店筛选打卡记录
- **Given** store-001有2条, store-002有1条
- **When** POST /attendance/records, filter storeId=store-001
- **Then** 返回2条

#### AC-ATTENDANCE-09-10: 按状态筛选打卡记录
- **Given** 含normal和late状态的记录
- **When** POST /attendance/records, filter status=late
- **Then** 仅返回late状态的记录

#### AC-ATTENDANCE-09-11: 按日期范围筛选打卡记录
- **Given** 记录分布在7/20~7/22
- **When** POST /attendance/records, filter from=2026-07-21, to=2026-07-22
- **Then** 仅返回7/21~7/22的记录

### 2.2 请假管理

#### AC-ATTENDANCE-09-12: 提交请假申请
- **Given** 员工张三(emp-001), store-001, 年假 8/1~8/2
- **When** 创建请假
- **Then** status=pending, leaveType=annual, id=leave-*

#### AC-ATTENDANCE-09-13: 请假审批通过
- **Given** 请假处于pending状态
- **When** POST /attendance/leave/approve, approver=店长
- **Then** status=approved, approverId/approverName有值

#### AC-ATTENDANCE-09-14: 请假审批驳回
- **Given** 请假pending状态
- **When** POST /attendance/leave/reject, remark=理由不充分
- **Then** status=rejected, approvalRemark=理由不充分

#### AC-ATTENDANCE-09-15: 不可重复审批
- **Given** 请假已approved
- **When** 再次调用 approve 或 reject
- **Then** 抛出 BadRequestException, 提示"Cannot approve/reject leave in status approved"

#### AC-ATTENDANCE-09-16: 取消请假
- **Given** 请假pending状态
- **When** 取消请假
- **Then** status=cancelled

#### AC-ATTENDANCE-09-17: 不可重复取消
- **Given** 请假已cancelled
- **When** 再次取消
- **Then** 抛出 BadRequestException

### 2.3 考勤统计

#### AC-ATTENDANCE-09-18: 考勤统计汇总
- **Given** 有6条记录: normal×2, late×1, early_leave×1, overtime×1(加班记录)
- **When** POST /attendance/summary
- **Then** normalCount=2, lateCount=1, earlyLeaveCount=1, overtimeCount=1, totalOvertimeMinutes有值

#### AC-ATTENDANCE-09-19: 按门店筛选统计
- **Given** store-001有4条记录, store-002有1条
- **When** summary filter storeId=store-001
- **Then** byStore中只有store-001的数据

#### AC-ATTENDANCE-09-20: 按时间范围筛选统计
- **Given** 记录分布在7/20~7/22
- **When** summary filter from=2026-07-22, to=2026-07-22
- **Then** 仅统计该日期的记录

#### AC-ATTENDANCE-09-21: 门店考勤明细统计
- **Given** 多门店有打卡记录
- **When** POST /attendance/summary
- **Then** byStore字段包含每个门店的 totalEmployees/normalCount/lateCount/absentCount/totalOvertimeMinutes

---

## 3. 测试场景清单

| 场景ID | 场景标题 | 模块 | 自动化 | 优先级 | 关联验收标准 |
|:-------|:---------|:-----|:------:|:------:|:------------|
| TC-09-01 | 正常上班打卡 | clock | ✅ | P0 | AC-ATTENDANCE-09-01 |
| TC-09-02 | 迟到打卡判定 | clock | ✅ | P0 | AC-ATTENDANCE-09-02 |
| TC-09-03 | 正常下班打卡 | clock | ✅ | P0 | AC-ATTENDANCE-09-03 |
| TC-09-04 | 早退判定 | clock | ✅ | P0 | AC-ATTENDANCE-09-04 |
| TC-09-05 | 加班判定 | clock | ✅ | P0 | AC-ATTENDANCE-09-05 |
| TC-09-06 | 加班优先于早退 | clock | ✅ | P1 | AC-ATTENDANCE-09-06 |
| TC-09-07 | 缺必填字段拒绝 | clock | ✅ | P0 | AC-ATTENDANCE-09-07 |
| TC-09-08 | 打卡记录列表 | records | ✅ | P0 | AC-ATTENDANCE-09-08 |
| TC-09-09 | 按门店筛选记录 | records | ✅ | P1 | AC-ATTENDANCE-09-09 |
| TC-09-10 | 按状态筛选记录 | records | ✅ | P1 | AC-ATTENDANCE-09-10 |
| TC-09-11 | 按日期范围筛选 | records | ✅ | P1 | AC-ATTENDANCE-09-11 |
| TC-09-12 | 提交请假申请 | leave | ✅ | P0 | AC-ATTENDANCE-09-12 |
| TC-09-13 | 请假审批通过 | leave | ✅ | P0 | AC-ATTENDANCE-09-13 |
| TC-09-14 | 请假审批驳回 | leave | ✅ | P0 | AC-ATTENDANCE-09-14 |
| TC-09-15 | 不可重复审批 | leave | ✅ | P0 | AC-ATTENDANCE-09-15 |
| TC-09-16 | 取消请假 | leave | ✅ | P1 | AC-ATTENDANCE-09-16 |
| TC-09-17 | 不可重复取消 | leave | ✅ | P1 | AC-ATTENDANCE-09-17 |
| TC-09-18 | 考勤统计汇总 | summary | ✅ | P0 | AC-ATTENDANCE-09-18 |
| TC-09-19 | 按门店筛选统计 | summary | ✅ | P1 | AC-ATTENDANCE-09-19 |
| TC-09-20 | 按时间范围统计 | summary | ✅ | P1 | AC-ATTENDANCE-09-20 |
| TC-09-21 | 门店明细统计 | summary | ✅ | P1 | AC-ATTENDANCE-09-21 |

**测试场景汇总:** 21场景 | P0=13 | P1=8 | 自动化覆盖=100%

---

## 4. 验收结论

| 验收项 | 结果 | 说明 |
|:-------|:----:|:-----|
| 功能完整度 | ⬜ 待测 | 等待开发完成后执行 |
| 自动化测试 | 21/21 | 全量测试用例已定义 |
| 异常覆盖 | 5/5 | 缺字段/重复审批/重复取消/状态冲突/已取消的请假不可审批 |
| 边界覆盖 | 有 | 加班与早退优先级、打卡时间边界 |
