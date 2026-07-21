# 设备故障报表模块 (Equipment Fault Report)

## 用途
设备故障报告与统计引擎。支持故障报告创建、列表查询、故障统计汇总，辅助运维团队追踪设备健康状态与服务响应时效，为设备维护决策提供数据支撑。

## 关键端点
| 路由 | 说明 |
|------|------|
| `GET /equipment-fault-report` | 故障列表（支持分页/筛选） |
| `POST /equipment-fault-report` | 创建故障报告 |
| `GET /equipment-fault-report/summary` | 故障统计汇总 |
| `GET /equipment-fault-report/:id` | 单个故障详情 |
| `DELETE /equipment-fault-report/:id` | 删除故障报告 |

## 测试位置
`apps/api/src/modules/equipment-fault-report/` — **3** 个测试文件：角色测试（`.role.test.ts`）、角色扩展测试（`.role-extended.test.ts`）、服务单测（`.service.test.ts`）。
