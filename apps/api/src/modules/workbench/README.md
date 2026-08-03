# 工作台模块 (Workbench)

## 用途
多租户角色工作台管理引擎。提供角色引导初始化（bootstrap）、导航项查询与能力检查、运行时审批执行、密钥轮转、回单操作及 Handler 回调节流管理。权限精细到角色+权限双维度，对接 Foundation、Market、Portal、TenantConfig 模块。

## 关键端点
| 路由 | 说明 |
|------|------|
| `GET /workbenches/bootstrap` | 工作台引导数据载荷 |
| `GET /workbenches` | 角色工作台列表（按角色/渠道/初始化状态筛选） |
| `GET /workbenches/nav-items` | 导航项查询（角色/渠道/市场/能力） |
| `GET /workbenches/capability-check` | 角色能力检查 |
| `POST /workbenches/approvals/execute` | 执行审批流转 |
| `POST /workbenches/secrets/rotate` | 密钥轮转 |
| `POST /workbenches/actions/runtime-replay` | 运行时回放提交 |
| `POST /workbenches/actions/replay` | 回单重放 |

## 测试位置
`apps/api/src/modules/workbench/` — **20** 个测试文件（controller/spec、service/spec、DTO、entity、module、contract、e2e、ringbeam、role*3、role-access、action/contract、bootstrap/contract、locale、receipt/e2e）。
