# 客户满意度模块 (Customer Satisfaction)

## 用途
客户满意度调查与评估引擎。支持满意度问卷评分、汇总统计、多维查询，辅助门店/品牌运营团队掌握客户体验趋势，为服务质量改进提供数据支撑。

## 关键端点
| 路由 | 说明 |
|------|------|
| `GET /customer-satisfaction` | 满意度列表（支持分页/筛选） |
| `POST /customer-satisfaction` | 创建满意度记录 |
| `GET /customer-satisfaction/summary` | 满意度汇总统计 |
| `GET /customer-satisfaction/:id` | 单个满意度详情 |
| `DELETE /customer-satisfaction/:id` | 删除记录 |

## 测试位置
`apps/api/src/modules/customer-satisfaction/` — **2** 个测试文件：服务+权限扩展测试（`.test.ts`、`.role-extended.test.ts`）。
