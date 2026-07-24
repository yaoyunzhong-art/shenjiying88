# attendance — 考勤管理

## 端点
| 方法 | 路径 | 说明 |
|:-----|:-----|:-----|
| POST | `/attendance/clock-in` | 打卡 |
| POST | `/attendance/records` | 打卡记录查询 |
| POST | `/attendance/summary` | 考勤统计 (日/周/月) |
| POST | `/attendance/leave/approve` | 请假审批 |
| POST | `/attendance/leave/reject` | 请假驳回 |

## 实体
- ClockRecord: 打卡记录
- AttendanceSummary: 统计汇总
- LeaveRequest: 请假申请

## V23 完成状态
- ✅ 打卡CRUD + 统计 + 请假审批
- ✅ Entity + Service + Controller
- ⏳ Prisma 持久化 (内存存储)
