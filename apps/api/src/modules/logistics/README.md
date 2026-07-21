# 后勤管理模块 (Logistics)

## 用途
多租户后勤综合管理引擎。涵盖设备巡检与维保、耗材请购与采购审批、供应商管理（含评价/合同）、库存预留、定时调度计划、维修反馈闭环与知识沉淀、场馆巡检记录、耗材库存预警，以及后勤报表汇总。

## 关键端点
| 路由 | 说明 |
|------|------|
| `POST /logistics/inspections` | 创建设备巡检 |
| `POST /logistics/maintenance-orders` | 创建设备维保工单 |
| `POST /logistics/procurement-requests` | 创建耗材采购申请 |
| `POST /logistics/suppliers` | 新增供应商 |
| `POST /logistics/inventory/reservations` | 创建库存预留 |
| `POST /logistics/schedule-plans` | 创建定时调度计划 |
| `POST /logistics/repair-feedbacks` | 提交维修反馈 |
| `POST /logistics/repair-knowledge` | 录入维修知识 |
| `POST /logistics/consumable-alert-rules` | 创建耗材预警规则 |
| `GET /logistics/reports` | 后勤报表汇总 |

## 测试位置
`apps/api/src/modules/logistics/` — **11** 个测试文件（service、e2e、ringbeam、role、maintenance、procurement、inventory/phase-p30-80、phase60、schedule）。
