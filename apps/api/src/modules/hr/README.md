# HR 模块 (Human Resources)

## 用途
人力资源全链路管理：员工信息 CRUD、考勤打卡与统计、合同续签、入职/离职流程、绩效考核（KPI/OKR/360评估/面谈）、招聘职位与候选人管理、内推机制。

## 关键端点
| 路由 | 说明 |
|------|------|
| `GET/POST /hr/employees` | 员工列表 / 新增 |
| `GET/PUT/DELETE /hr/employees/:id` | 员工详情 / 更新 / 删除 |
| `GET /hr/stats` | HR 统计概览 |
| `GET /hr/departments` | 部门列表 |
| `POST /hr/employees/:id/attendance` | 打卡记录 |
| `POST /hr/employees/:id/onboard\|offboard` | 入职 / 离职 |
| `POST /hr/performance/evaluations` | 发起考核评估 |
| `POST /hr/performance/interviews` | 面谈记录 |
| `POST /hr/recruitment/positions` | 创建招聘职位 |
| `POST /hr/recruitment/candidates` | 添加候选人 |

## 测试位置
`apps/api/src/modules/hr/` — **4** 个测试文件：服务单测、角色权限测试（role/role-extended）。
