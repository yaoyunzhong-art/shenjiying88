# 合同管理模块 (Contract Manager)

## 用途
多租户合同全生命周期管理引擎。支持合同 CRUD、状态变更（生效/终止/续签）、条款增删改查与批量导入、到期/过期合同智能分析，提供 mock 数据种子辅助开发与演示。

## 关键端点
| 路由 | 说明 |
|------|------|
| `POST /contracts` | 创建合同 |
| `GET /contracts` | 合同列表（按状态/类型/关键词查询） |
| `GET /contracts/:contractId` | 合同详情 |
| `PATCH /contracts/:contractId/status` | 更新合同状态 |
| `GET /contracts/analysis/expiring` | 即将到期合同分析 |
| `GET /contracts/analysis/expired` | 已过期合同分析 |
| `POST /contracts/:contractId/clauses` | 添加条款 |
| `POST /contracts/:contractId/clauses/bulk` | 批量导入条款 |

## 测试位置
`apps/api/src/modules/contract-manager/` — **5** 个测试文件（controller、service、module、role、role-extended）。
