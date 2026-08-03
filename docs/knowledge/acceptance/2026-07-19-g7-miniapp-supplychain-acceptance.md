# 2026-07-19 · G7 miniapp 供应链高频链验收记录

> 目标: 验证 `miniapp` 采购 / 退货高频链已具备真实读链、真实写链和 fallback 降级能力
> 验收范围: `pages/purchase-orders/*`、`pages/return-orders/*`、`supplychain-runtime.ts`
> 验收方式: 静态契约审计 + 定点自动化测试
> 结论: `🟢 通过（真实读写链、浏览器 PNG 证据与验收文档已闭环）`

---

## 验收链路

1. 确认 `miniapp` 已注册采购单 / 退货单列表与详情路由
2. 确认采购列表与退货列表进入页优先读取真实供应链接口，失败时回退本地演示数据
3. 确认采购详情页按路由 `id` 读取真实订单详情
4. 确认退货详情页按路由 `id` 聚合真实退货详情
5. 确认采购详情页状态按钮已接真实 `submit / approve / place / receive / cancel`
6. 确认采购详情页删除按钮已接真实 `delete`
7. 确认退货详情页状态按钮已接真实 `inspect / reject / approve / refund / exchange / close`
8. 确认真实接口失败时页面保留 `fallback` 提示，不误报全通

---

## 验收结果

| 检查项 | 结果 | 说明 |
|--------|:----:|------|
| miniapp 路由已注册 | ✅ | 采购 / 退货列表与详情页均已纳入 `app.config.ts` |
| 采购列表真实读链 | ✅ | 走 `/inventory/purchase/orders`，失败回退 mock |
| 采购详情真实读链 | ✅ | 走 `/inventory/purchase/orders/:orderId` |
| 退货列表真实读链 | ✅ | 从采购单 `returns` 聚合退货记录 |
| 退货详情真实读链 | ✅ | 从采购单 `returns` 聚合指定 `returnId` |
| 采购详情真实写链 | ✅ | 已接 `submit / approve / place / receive / cancel / delete` |
| 退货详情真实写链 | ✅ | 已接 `inspect / reject / approve / refund / exchange / close` |
| 前端降级提示 | ✅ | 真实接口失败时显示 `deliveryNote`，切回演示态 |
| 后端退货动作能力补齐 | ✅ | 新增 `inspectReturn / rejectReturn / refundReturn / exchangeReturn / closeReturn` 与对应 REST 端点 |
| 已知缺口 | ✅ | 浏览器 PNG 证据、正式验收文档与代码/测试证据均已闭环 |

---

## 证据文件

- miniapp 运行时读写模型: [supplychain-runtime.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/miniapp/src/supplychain-runtime.ts)
- 采购详情页: [index.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/miniapp/src/pages/purchase-orders/detail/index.tsx)
- 退货详情页: [index.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/miniapp/src/pages/return-orders/detail/index.tsx)
- 后端采购控制器: [inventory-purchase.controller.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/inventory/inventory-purchase.controller.ts)
- 后端采购服务: [inventory-purchase.service.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/inventory/inventory-purchase.service.ts)
- 浏览器验收记录: [2026-07-19-g7-miniapp-browser-acceptance.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g7-miniapp-browser-acceptance.md)

---

## 自动化证据

- miniapp 读写链测试:

```bash
node --import tsx --test apps/miniapp/src/supplychain-runtime.test.ts apps/miniapp/src/pages/return-orders/detail/page.test.ts apps/miniapp/src/pages/purchase-orders/detail/page.test.ts
```

- API 服务退货动作测试:

```bash
pnpm --dir apps/api exec vitest run src/modules/inventory/inventory-purchase.service.spec.ts
```

- 本轮结果:

```text
inventory-purchase.service.spec.ts passed
supplychain-runtime.test.ts passed
purchase-orders/detail/page.test.ts passed
return-orders/detail/page.test.ts passed
```

---

## 本轮新增能力

- 新增后端退货质检接口: `POST /api/inventory/purchase/returns/:returnId/inspect`
- 新增后端退货驳回接口: `POST /api/inventory/purchase/returns/:returnId/reject`
- 新增后端退货退款接口: `POST /api/inventory/purchase/returns/:returnId/refund`
- 新增后端退货换货接口: `POST /api/inventory/purchase/returns/:returnId/exchange`
- 新增后端退货关闭接口: `POST /api/inventory/purchase/returns/:returnId/close`
- 放宽退货审批条件: `Pending / Shipped -> Approved`
- 明确退货终态语义: `Approved -> Refunded / Exchanged`，`Pending / Approved / Rejected / Refunded / Exchanged -> Closed`
- miniapp 退货状态动作已从“部分演示态”推进到“inspect / reject / approve / refund / exchange / close 真接”

---

## 结论

- `G7`: `🟢 通过`
- 当前已满足 “miniapp 供应链高频链读写可证据化” 要求
- 当前结论:
  - 真实读写链、浏览器 PNG 证据与正式验收文档均已闭环
- 下一刀建议:
  - 保持 `G7` 绿灯口径，除非后续真实 API 或浏览器证据出现回归
