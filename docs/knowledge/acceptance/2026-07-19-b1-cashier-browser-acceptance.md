# 2026-07-19 · PLAN-REV-B1 收银链浏览器验收记录

> 目标: 验证 `POS/Pad` 一线经营链至少 1 条可跑通
> 页面: `storefront-web /cashier`
> 验收方式: 手工浏览器走查 + Playwright 自动化
> 结论: `✅ 通过`

---

## 验收链路

1. 打开 `/cashier`
2. 搜索商品 `射击`
3. 加入购物车
4. 输入会员手机号 `13800138001`
5. 查询会员并应用金卡折扣
6. 选择 `微信扫码`
7. 点击结算
8. 看到支付成功与新订单按钮

---

## 验收结果

| 检查项 | 结果 | 说明 |
|--------|:----:|------|
| 页面可访问 | ✅ | `/cashier` 可正常打开 |
| 选品成功 | ✅ | `射击体验` 可加入购物车 |
| 金额更新 | ✅ | 初始应付 `¥30.00` |
| 会员识别 | ✅ | 识别到 `张三 / 黄金会员 / 2560分` |
| 折扣生效 | ✅ | 结算金额变为 `¥27.00` |
| 微信支付态 | ✅ | 显示 `请使用微信扫码支付` |
| 结算成功 | ✅ | 显示 `支付成功！金额 ¥27.00，方式：微信扫码` |
| 新订单入口 | ✅ | 显示 `🔄 新订单` |

---

## 自动化证据

- 浏览器用例: [cashier-pos-minimal.spec.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/e2e/tests/cashier-pos-minimal.spec.ts)
- 执行命令:

```bash
BASE_URL=http://127.0.0.1:3000 pnpm exec playwright test e2e/tests/cashier-pos-minimal.spec.ts --project=pc-chromium --reporter=list
```

- 执行结果:

```text
Running 1 test using 1 worker
✓ PLAN-REV-B1 · POS/Pad 最小收银链 › 前台收银员完成选品 -> 会员识别 -> 微信支付成功
1 passed
```

- 成功截图: `playwright-report/b1-cashier-minimal-success.png`

---

## 补充说明

- 当前这条链路为前端稳定 mock 驱动，已满足 `B1` 的“至少 1 条可跑通”要求
- 当前尚未满足“真实后端收银贯通”的更高标准，后续应继续推进:
  - `members/products/events` 接口合同收口
  - 页面与真实 `cashier` API 接线
  - 退款查询闭环补齐

---

## 结论

- `PLAN-REV-B1`: `✅ 完成`
- `G3` 退回条件: 已完成 `1/2` 项
- 下一优先级: `PLAN-REV-B2` -> `PLAN-REV-C1`
