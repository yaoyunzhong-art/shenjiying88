# PRD-009-R2: 考勤管理 — Attendance (P-00)

> 版本: v1.0-R2 · 签发人: 🦞 龙虾哥 · 对接专家: E30 人力资源
> 发布日期: 2026-07-28 · 状态: 🟢 已签发
> 关联Phase: P-00 · 基于: attendance.service.ts / attendance.controller.ts / attendance.entity.ts
> 圈梁标记: 🏗️ 圈梁五道箍

---

## 1. 目标

### 1.1 业务目标
搭建门店员工考勤管理系统，实现上下班打卡自动记录、迟到/早退/加班自动计算、请假申请与审批流程闭环，替代门店当前手工签到方式。

### 1.2 产品目标
- 员工手机端扫码/手动打卡
- 系统自动判断考勤状态(正常/迟到/早退/缺勤/加班)
- 日/周/月考勤统计一键查看
- 请假在线申请+上级审批
- 按门店汇总考勤报表

### 1.3 成功指标
| 指标 | 目标值 | 测量方式 |
|:----|:------|:---------|
| 打卡成功率 | 99.9% | 打卡日志 |
| 考勤状态准确率 | 100% (规则匹配无误) | 单元测试 |
| 统计查询响应 | ≤3秒 | APM |
| 请假审批时效 | 提交后24h内审批覆盖≥90% | 审批统计 |
| 晚打卡自动判断迟到 | 精确到分钟 | 边界测试 |

---

## 2. 用户故事

### 2.1 员工
| US | 用户故事 | 优先级 |
|:---|:---------|:------:|
| US-09-01 | 作为员工，我想上班打卡记录考勤，以便证明出勤 | P0 |
| US-09-02 | 作为员工，我想下班打卡记录工时，以便计算加班 | P0 |
| US-09-03 | 作为员工，我想请年假/病假/事假，以便休假有据可查 | P0 |
| US-09-04 | 作为员工，我想查看自己某时间段的考勤记录，以便核对 | P1 |
| US-09-05 | 作为员工，我想看到请假审批状态(待审批/已通过/已驳回)，以便跟进 | P1 |

### 2.2 店长/经理
| US | 用户故事 | 优先级 |
|:---|:---------|:------:|
| US-09-06 | 作为店长，我想查看门店员工的考勤汇总(出勤/迟到/早退/缺勤/加班)，以便管理 | P0 |
| US-09-07 | 作为店长，我想审批/驳回下属的请假申请，以便安排排班 | P0 |
| US-09-08 | 作为店长，我想按日/周/月查看考勤报表，以便分析 | P1 |

### 2.3 人力资源
| US | 用户故事 | 优先级 |
|:---|:---------|:------:|
| US-09-09 | 作为HR，我想查看所有门店的考勤统计并按门店对比，以便考核 | P1 |
| US-09-10 | 作为HR，我想导出某个月的考勤数据，以便核算薪资 | P2 |

---

## 3. 功能列表

| 功能ID | 功能名称 | 描述 | 优先级 | 关联模块 |
|:-------|:---------|:-----|:------:|:--------|
| F-09-01 | 上班打卡(clockIn) | 记录员工上班打卡时间，自动判断正常/迟到 | P0 | clock |
| F-09-02 | 下班打卡(clockOut) | 记录员工下班打卡时间，自动判断早退/加班 | P0 | clock |
| F-09-03 | 打卡状态自动判定 | 09:00前=正常, 09:00后=迟到(w分钟内), 18:00前=早退 | P0 | calc |
| F-09-04 | 加班分钟计算 | 18:00后打卡自动算加班(分钟) | P0 | calc |
| F-09-05 | 打卡记录查询 | 按员工/门店/日期/状态筛选打卡记录 | P0 | list |
| F-09-06 | 请假申请 | 员工提交请假(年假/病假/事假/婚假/产假/丧假) | P0 | leave |
| F-09-07 | 请假审批 | 店长审批/驳回请假申请 | P0 | leave |
| F-09-08 | 请假状态管理 | 已批准/已驳回/已取消状态流转 | P0 | leave |
| F-09-09 | 请假查询 | 按员工/门店/状态筛选请假记录 | P1 | leave |
| F-09-10 | 考勤统计汇总 | 按时间范围统计出勤/迟到/早退/缺勤/请假/加班 | P0 | summary |
| F-09-11 | 门店考勤对比 | 按门店维度统计出勤、迟到、加班时长 | P1 | summary |
| F-09-12 | 异常状态标记 | 迟到≥30分钟自动标记异常 | P1 | alert |

---

## 4. 非功能需求

| 需求ID | 类别 | 标准 | 测量方式 |
|:-------|:-----|:-----|:---------|
| NFR-09-01 | 打卡响应 | 打卡操作 <1s | APM P99 |
| NFR-09-02 | 状态计算 | 迟到/加班分钟数计算精确 | 边界测试 |
| NFR-09-03 | 防重复打卡 | 同一员工同日不能重复clockIn(已clockIn则提示) | 单元测试 |
| NFR-09-04 | 防重复clockOut | 已clockOut的记录不可再次clockOut | 单元测试 |
| NFR-09-05 | 请假状态约束 | 仅pending状态可审批/驳回/取消 | 状态机测试 |
| NFR-09-06 | 可用性 | 99.5% (月掉线<3.6h) | 监控告警 |
| NFR-09-07 | 数据精度 | 打卡时间精确到分钟 | 存储设计 |

---

## 5. 数据约束

### 5.1 数据库约束

| 约束 | 说明 | 理由 |
|:-----|:-----|:-----|
| 打卡记录不可删除 | 记录只追加不删除 | 考勤合规 |
| 请假状态流转单向 | pending → approved/rejected/cancelled | 状态机规则 |
| 日期必须有效 | date 格式 yyyy-MM-dd | 查询条件 |
| 打卡时间格式 | clockIn/clockOut HH:mm | 时间计算 |
| 员工唯一 | employeeId 唯一标识员工 | 关联外部系统 |

### 5.2 关键数据实体

```typescript
interface ClockRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  storeId: string;
  date: string;                          // yyyy-MM-dd
  clockIn: string;                       // HH:mm
  clockOut: string | null;               // HH:mm
  status: AttendanceStatus;              // normal | late | early_leave | absent | leave | overtime
  lateMinutes: number;                   // 迟到分钟数
  earlyLeaveMinutes: number;             // 早退分钟数
  overtimeMinutes: number;               // 加班分钟数
  note?: string;
  createdAt: string;
  updatedAt: string;
}

type AttendanceStatus = 'normal' | 'late' | 'early_leave' | 'absent' | 'leave' | 'overtime';

interface AttendanceSummary {
  period: string;                        // daily | weekly | monthly
  from: string;
  to: string;
  totalEmployees: number;
  totalDays: number;
  normalCount: number;
  lateCount: number;
  earlyLeaveCount: number;
  absentCount: number;
  leaveCount: number;
  overtimeCount: number;
  totalOvertimeMinutes: number;
  byStore: Record<string, AttendanceStoreStats>;
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  storeId: string;
  leaveType: LeaveType;                  // annual | sick | personal | marriage | maternity | bereavement
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;                   // pending | approved | rejected | cancelled
  approverId?: string;
  approverName?: string;
  approvalRemark?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 6. 考勤规则

| 规则 | 判定标准 |
|:----|:---------|
| 正常上班 | clockIn ≤ 09:00 |
| 迟到判定 | clockIn > 09:00, lateMinutes = (h-9)*60+m |
| 早退判定 | clockOut < 18:00, earlyLeaveMinutes = (17-h)*60+(60-m) |
| 加班判定 | clockOut > 18:00, overtimeMinutes = (h-18)*60+m |
| 状态优先级 | overtime > early_leave > late > normal |

---

## 7. 不在此PRD范围

- 排班管理 → 归 Scheduling 模块
- 薪资核算(考勤→工资联动) → 归 Payroll 模块
- GPS位置打卡 → v2
- 面部识别打卡 → 归 Biometric 模块

---

## 8. 变更记录

| 版本 | 日期 | 变更内容 | 变更人 |
|:----|:-----|:---------|:------|
| v1.0 | 2026-07-28 | 初版签发，基于attendance.service.ts/controller.ts/entity.ts分析 | 树哥A |
| v1.0-R2 | 2026-07-28 | 补充考勤规则表、请假类型枚举、门店统计维度 | 树哥A |
