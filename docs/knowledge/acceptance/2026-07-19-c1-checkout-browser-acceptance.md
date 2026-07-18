# 2026-07-19 · PLAN-REV-C1 checkout 金额链浏览器验收记录

> 目标: 验证 `checkout` 金额准确性已切到 L3 浏览器验收
> 页面: `storefront-web /checkout`
> 验收方式: 浏览器走查 + Playwright 自动化
> 结论: `✅ 通过`

---

## 验收链路

1. 打开 `/checkout`
2. 确认默认购物车小计为 `¥675.00`
3. 切换 `加急配送（1-2天）`，确认运费变为 `¥10.00`，合计变为 `¥685.00`
4. 切换 `门店自提`，确认运费变为 `免运费（自提）`，合计回到 `¥675.00`
5. 输入无效券 `invalid`，确认提示 `无效的优惠券码` 且总额不变
6. 输入有效券 `WELCOME10`，确认优惠变为 `-¥10.00`，合计变为 `¥665.00`
7. 填写收件人、手机号、地址、城市
8. 选择 `标准配送（3-5天）`、`微信支付` 并勾选服务条款
9. 点击 `确认支付 ¥665.00`
10. 看到成功文案 `订单已提交成功！订单金额 ¥665.00，支付方式：微信支付`

---

## 验收结果

| 检查项 | 结果 | 说明 |
|--------|:----:|------|
| 页面可访问 | ✅ | `/checkout` 正常加载 |
| 小计准确 | ✅ | 默认 `subtotal = ¥675.00` |
| 配送切换准确 | ✅ | `express = ¥10.00`，`pickup = 免运费（自提）` |
| 无效券不污染金额 | ✅ | 显示 `无效的优惠券码`，总额保持 `¥675.00` |
| 有效券抵扣准确 | ✅ | `WELCOME10` 抵扣 `¥10.00`，总额变为 `¥665.00` |
| 提交按钮金额准确 | ✅ | 按钮文案为 `确认支付 ¥665.00` |
| 提交成功金额准确 | ✅ | 成功文案显示 `订单金额 ¥665.00` |
| 支付方式口径准确 | ✅ | 成功文案显示 `微信支付` |

---

## 自动化证据

- 浏览器用例: [checkout-amount-l3.spec.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/e2e/tests/checkout-amount-l3.spec.ts)
- 执行命令:

```bash
BASE_URL=http://127.0.0.1:3000 pnpm exec playwright test e2e/tests/checkout-amount-l3.spec.ts --project=pc-chromium
```

- 执行结果:

```text
Running 2 tests using 2 workers
✓ PLAN-REV-C1 · checkout 金额链 L3 › 配送与优惠券切换时金额链保持准确
✓ PLAN-REV-C1 · checkout 金额链 L3 › 提交订单时成功文案与应付金额一致
2 passed
```

- 成功截图: `playwright-report/c1-checkout-amount-success.png`

---

## 补充说明

- 本次验收重点覆盖 `subtotal / shipping / discount / total / submit-result` 五个金额节点
- 为保证 L3 自动化稳定性，已补齐:
  - `Select` 组件 `data-testid` 透传
  - `SubmitButton` 组件 `data-testid` 透传
- 当前已满足 `C1` 的“金额准确性浏览器级证据”要求

---

## 结论

- `PLAN-REV-C1`: `✅ 完成`
- `G3` 退回条件: 已完成 `2/3` 项，达到复签前最低要求
- 下一优先级: `PLAN-REV-C2` -> `PLAN-REV-C3`
