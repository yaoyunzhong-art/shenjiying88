# E2E 自动生成模块 (E2E Auto Gen)

## 用途
基于 OpenAPI Spec 自动生成并执行 E2E 测试用例：OpenAPI 解析器、测试用例生成引擎、自动执行器、任务与报告管理。支持配置持久化与多版本控制（role/role-v3）。

## 关键端点
| 路由 | 说明 |
|------|------|
| `POST /api/e2e-auto-gen/generate` | 根据 OpenAPI 生成测试用例 |
| `POST /api/e2e-auto-gen/execute` | 执行已生成的测试 |
| `GET /api/e2e-auto-gen/tasks/:taskId` | 获取任务状态 |
| `GET /api/e2e-auto-gen/reports/:reportId` | 获取执行报告 |
| `GET/POST /api/e2e-auto-gen/configs` | 配置管理与持久化 |

## 测试位置
`apps/api/src/modules/e2e-auto-gen/` — **15** 个测试文件：控制器/DTO/Entity/Service 单测、E2E、圈梁测试、合同测试、AutoRunner/OpenAPI 解析器/测试生成器单元测试、角色权限测试（3 个版本）。
