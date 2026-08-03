# 品牌运营模块 (Brand Operations)

## 用途
品牌资产与营销活动全链路管理：品牌素材 CRUD（图片/视频/文档）、营销活动编排与审批流、活动模板与 AB 测试、多方协作与合同管理、分账结算、排期日历调度、回收站与导出。分 Phase-80（基础能力）和 Phase-100（高级能力）两阶段实现。

## 关键端点
| 路由 | 说明 |
|------|------|
| `GET/POST /brand-operations/assets` | 品牌素材列表 / 创建 |
| `GET/POST /brand-operations/campaigns` | 活动列表 / 创建 |
| `PATCH /brand-operations/campaigns/:id/approve\|reject\|publish` | 审批 / 驳回 / 发布 |
| `POST /brand-operations/collaborations` | 创建协作 |
| `POST /brand-operations/schedules` | 排期创建 |
| `POST /brand-operations/ab-tests` | AB 测试创建 |
| `POST /brand-operations/export` | 导出记录 |

## 测试位置
`apps/api/src/modules/brand-operations/` — **13** 个测试文件：控制器/DTO/Entity/Service 单测、Phase-80/100 模块测试、圈梁测试、模板测试、角色权限测试。
