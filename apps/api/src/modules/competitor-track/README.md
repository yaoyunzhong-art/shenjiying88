# 竞品追踪模块 (Competitor Track)

## 用途
街区竞品分析：竞品门店 CRUD、多维度筛选（城市/品类/评分）、竞品对比分析（评分/价格/客流）、数据汇总摘要。为运营决策提供竞品情报支持。

## 关键端点
| 路由 | 说明 |
|------|------|
| `GET /competitor-track` | 竞品列表（支持 city/category/minRating 筛选） |
| `POST /competitor-track` | 创建竞品 |
| `PATCH /competitor-track/:id` | 更新竞品 |
| `DELETE /competitor-track/:id` | 删除竞品 |
| `GET /competitor-track/summary` | 汇总统计 |
| `GET /competitor-track/comparison?ids=` | 多竞品对比分析 |

## 测试位置
`apps/api/src/modules/competitor-track/` — **2** 个测试文件：集成测试、角色权限扩展测试。
