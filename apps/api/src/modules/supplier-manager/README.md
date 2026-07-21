# 供应商管理模块 (Supplier Manager)

## 用途
多租户供应商基础信息管理引擎。支持供应商 CRUD 全流程，按状态/评级/分类/关键词多维查询。为后勤模块供应商评价体系提供底层数据支撑。

## 关键端点
| 路由 | 说明 |
|------|------|
| `POST /suppliers` | 创建供应商 |
| `GET /suppliers` | 供应商列表（按状态/评级/分类/关键词筛选） |
| `GET /suppliers/:supplierId` | 供应商详情 |
| `PATCH /suppliers/:supplierId` | 更新供应商 |
| `DELETE /suppliers/:supplierId` | 删除供应商 |

## 测试位置
`apps/api/src/modules/supplier-manager/` — **6** 个测试文件（controller、service、DTO、entity、module、role、role-extended）。
