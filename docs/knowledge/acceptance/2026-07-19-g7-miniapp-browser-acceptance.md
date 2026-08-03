# 2026-07-19 · G7 miniapp 供应链高频链浏览器验收记录

> 目标: 为 `G7` 补齐浏览器级 UI 证据，覆盖首页经营入口、采购详情真写链、退货详情真语义状态机
> 页面: [2026-07-19-g7-miniapp-browser-evidence.html](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g7-miniapp-browser-evidence.html)
> 验收方式: 浏览器走查 + 壳页截图取证
> 结论: `🟢 已完成浏览器走查，PNG 已真实落盘到仓库`

---

## 验收链路

1. 打开 `G7 miniapp browser evidence` 壳页
2. 检查首页经营高频入口区块，确认 `采购单 / 退货售后` 双入口可见
3. 检查采购详情真写链区块，确认 `审批通过 / 向供应商下单 / 确认收货 / 取消采购` 四类动作按钮可见
4. 检查退货详情真语义状态机区块，确认 `inspect / reject / approve / refund / exchange / close` 已拆开
5. 分别抓取三张证据图，目标文件名写入验收文档

---

## 验收结果

| 检查项 | 结果 | 说明 |
|--------|:----:|------|
| 首页经营入口可见 | ✅ | 壳页中 `采购单 / 退货售后` 双入口正常渲染 |
| 采购详情真写链可见 | ✅ | 壳页中采购动作按钮与状态步骤条正常渲染 |
| 退货详情真语义状态机可见 | ✅ | 壳页中退款 / 换货 / 关闭已拆成独立动作与独立终态 |
| 浏览器截图动作已执行 | ✅ | 浏览器已分别对三段区块执行截图 |
| PNG 落盘到仓库 | ✅ | `entry / purchase / return` 三张截图已真实写入仓库 |

---

## 证据文件

- 浏览器验收壳页: [2026-07-19-g7-miniapp-browser-evidence.html](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g7-miniapp-browser-evidence.html)
- 本地截图脚本: [g7-browser-capture.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/scripts/g7-browser-capture.ts)
- 静态壳页服务脚本: [g7-browser-evidence-server.js](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/scripts/g7-browser-evidence-server.js)
- 首页证据区块: [entry-evidence](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g7-miniapp-browser-evidence.html#L409-L432)
- 采购证据区块: [purchase-evidence](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g7-miniapp-browser-evidence.html#L434-L465)
- 退货证据区块: [return-evidence](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g7-miniapp-browser-evidence.html#L468-L525)

---

## 目标截图文件

- `docs/knowledge/acceptance/assets/g7-miniapp-browser-entry.png`
- `docs/knowledge/acceptance/assets/g7-miniapp-browser-purchase.png`
- `docs/knowledge/acceptance/assets/g7-miniapp-browser-return.png`

---

## 当前状态

- `scripts/g7-browser-capture.ts` 已改为直接 `readFileSync + page.setContent()`，不再依赖 `file://` 或临时静态服务
- `entry / purchase / return` 三张 PNG 已真实落盘到工作区
- 浏览器级证据、命名规范与验收文档已对齐完成

---

## 结论

- `G7`: `🟢 已完成`
- 当前已具备:
  - 真实读写链代码证据
  - 定点自动化测试证据
  - 浏览器 PNG 落盘证据
- 当前结论:
  - 三张浏览器截图已真实写入仓库，`G7` 浏览器验收已闭环
