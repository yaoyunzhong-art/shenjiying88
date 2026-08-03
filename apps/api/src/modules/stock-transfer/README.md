# 📦 stock-transfer — 库存调拨

> V23 | 圈梁: 代码✅ 测试✅

库存调拨管理模块，处理门店/仓库之间的库存转移全生命周期。

## 端点
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/stock-transfer` | 调拨单列表 |
| POST | `/stock-transfer` | 创建调拨单 |
| GET | `/stock-transfer/:id` | 调拨单详情 |
| PATCH | `/stock-transfer/:id` | 更新调拨单 |
| POST | `/stock-transfer/:id/submit` | 提交调拨 |
| POST | `/stock-transfer/:id/approve` | 审批通过 |
| POST | `/stock-transfer/:id/reject` | 审批拒绝 |
| POST | `/stock-transfer/:id/ship` | 发货确认 |
| POST | `/stock-transfer/:id/receive` | 收货确认 |
| POST | `/stock-transfer/:id/cancel` | 取消调拨 |
| GET | `/stock-transfer/stats` | 调拨统计 |

## 调拨生命周期
```
草稿 → 已提交 → 已审批 → 已发货 → 已收货
              ↘ 已拒绝
                      ↘ 已取消
```

## 测试
- `stock-transfer.service.spec.ts`
- `stock-transfer.controller.spec.ts`
