# 已恢复文件总清单（2026-07-19）

> 用途：记录本轮“误撤销后重新补回”的关键文件，便于逐项人工复核。

## Top 10 优先复核顺序

> 建议先看这 10 个文件，基本能判断本轮恢复是否已经回到正确轨道。

1. [ ] `apps/miniapp/src/supplychain-runtime.ts`
2. [ ] `apps/api/src/modules/inventory/inventory-purchase.service.ts`
3. [ ] `apps/api/src/modules/inventory/inventory-purchase.controller.ts`
4. [ ] `apps/miniapp/src/pages/purchase-orders/detail/index.tsx`
5. [ ] `apps/miniapp/src/pages/return-orders/detail/index.tsx`
6. [ ] `apps/miniapp/src/page-navigation.test.ts`
7. [ ] `scripts/run-prod-cutover-window.sh`
8. [ ] `scripts/preflight-prod-formal-window.sh`
9. [ ] `TASKS_STATUS.md`
10. [ ] `V7.2-RESIGN-CHECKLIST.md`

## 推荐复核顺序

- 第 1 轮：先看 `G7` 主链
- 第 2 轮：再看 `G8` 正式窗口脚本链
- 第 3 轮：最后看 `G6` 联动链与总表口径

## Top 10 重点看哪里

1. `apps/miniapp/src/supplychain-runtime.ts`
   - 看采购单是否仍有 `executeMiniappPurchaseOrderAction`
   - 看删除是否仍有 `deleteMiniappPurchaseOrder`
   - 看退货是否仍有 `resolveMiniappReturnActionExecution`
   - 看退货终态是否仍覆盖 `refunded / exchanged / closed`

2. `apps/api/src/modules/inventory/inventory-purchase.service.ts`
   - 看是否仍有 `inspectReturn`
   - 看是否仍有 `rejectReturn`
   - 看是否仍有 `refundReturn / exchangeReturn / closeReturn`
   - 看 `completeReturn()` 是否仍回落到 `closeReturn()`

3. `apps/api/src/modules/inventory/inventory-purchase.controller.ts`
   - 看是否仍暴露 `/inspect / reject / refund / exchange / close`
   - 看这些入口是否仍直接转到 `purchaseService`

4. `apps/miniapp/src/pages/purchase-orders/detail/index.tsx`
   - 看是否仍从 runtime 引入 `executeMiniappPurchaseOrderAction`
   - 看是否仍从 runtime 引入 `deleteMiniappPurchaseOrder`
   - 看按钮点击后是否仍根据 `result.deliveryMode` 给出提示

5. `apps/miniapp/src/pages/return-orders/detail/index.tsx`
   - 看是否仍从 runtime 引入 `executeMiniappPurchaseReturnAction`
   - 看动作提交时是否仍把 `remark` 传进去
   - 看步骤条是否仍兼容 `rejected / exchanged / closed`

6. `apps/miniapp/src/page-navigation.test.ts`
   - 看是否仍注册 `sales-tools / redeem-center / customer-service`
   - 看是否仍有游客拦截断言
   - 看总 routes 数量是否仍包含 `G6 + G7` 页面

7. `scripts/run-prod-cutover-window.sh`
   - 看是否仍生成 `01~05` 日志链
   - 看正式窗口是否仍先调 `preflight-prod-formal-window.sh`
   - 看结尾是否仍输出 `summary_file=...`

8. `scripts/preflight-prod-formal-window.sh`
   - 看是否仍检查 `api/admin/store/tob` 四个正式域名
   - 看是否仍校验 live `m5-tls` 或 `--tls-manifest`
   - 看失败时是否仍阻断真实窗口

9. `TASKS_STATUS.md`
   - 看 `G6` 是否是 `🟢`
   - 看 `G7` 是否是 `🟢`
   - 看 `G1/G8` 是否仍保留 `DNS + TLS` 外部硬阻塞口径

10. `V7.2-RESIGN-CHECKLIST.md`
   - 看 `G6 / G7` 是否仍为 `✅/🟢`
   - 看 `G8` 是否仍写明 `DNS 无 A 记录 + m5-tls 缺失`
   - 看总体复签是否仍保持“未解阻前不得正式发起”

## Top 10 快速口令版

> 打开对应文件后，直接搜下面这些词；能搜到，基本就说明这轮恢复还在。

1. `apps/miniapp/src/supplychain-runtime.ts`
   - 搜：`executeMiniappPurchaseOrderAction`
   - 搜：`deleteMiniappPurchaseOrder`
   - 搜：`resolveMiniappReturnActionExecution`
   - 搜：`refunded`
   - 搜：`exchanged`
   - 搜：`closed`

2. `apps/api/src/modules/inventory/inventory-purchase.service.ts`
   - 搜：`inspectReturn(`
   - 搜：`rejectReturn(`
   - 搜：`refundReturn(`
   - 搜：`exchangeReturn(`
   - 搜：`closeReturn(`
   - 搜：`return this.closeReturn`

3. `apps/api/src/modules/inventory/inventory-purchase.controller.ts`
   - 搜：`returns/:returnId/inspect`
   - 搜：`returns/:returnId/reject`
   - 搜：`returns/:returnId/refund`
   - 搜：`returns/:returnId/exchange`
   - 搜：`returns/:returnId/close`

4. `apps/miniapp/src/pages/purchase-orders/detail/index.tsx`
   - 搜：`executeMiniappPurchaseOrderAction`
   - 搜：`deleteMiniappPurchaseOrder`
   - 搜：`result.deliveryMode === 'api'`

5. `apps/miniapp/src/pages/return-orders/detail/index.tsx`
   - 搜：`executeMiniappPurchaseReturnAction`
   - 搜：`remark`
   - 搜：`status === 'exchanged'`
   - 搜：`status === 'rejected' || status === 'closed'`

6. `apps/miniapp/src/page-navigation.test.ts`
   - 搜：`pages/sales-tools/index`
   - 搜：`pages/redeem-center/index`
   - 搜：`pages/customer-service/index`
   - 搜：`AUTH_REQUIRED`

7. `scripts/run-prod-cutover-window.sh`
   - 搜：`00-formal-ready.log`
   - 搜：`01-preflight.log`
   - 搜：`02-server-dry-run.log`
   - 搜：`03-apply.log`
   - 搜：`04-verify.log`
   - 搜：`05-rollback.log`
   - 搜：`summary_file=`

8. `scripts/preflight-prod-formal-window.sh`
   - 搜：`formal window readiness start`
   - 搜：`DNS has no A record`
   - 搜：`live tls secret verify`
   - 搜：`TLS manifest does not exist`

9. `TASKS_STATUS.md`
   - 搜：`` `G6`: 🟢 ``
   - 搜：`` `G7`: 🟢 ``
   - 搜：`DNS + TLS`

10. `V7.2-RESIGN-CHECKLIST.md`
   - 搜：`| G6 | 🟢 |`
   - 搜：`| G7 | 🟢 |`
   - 搜：`DNS 无 A 记录 + m5-tls 缺失`
   - 搜：`不得正式发起`

## G6 Miniapp 联动链

- [x] `apps/miniapp/src/app.config.ts`
- [x] `apps/miniapp/src/pages/index/index.tsx`
- [x] `apps/miniapp/src/pages/member/index.tsx`
- [x] `apps/miniapp/src/page-navigation.test.ts`
- [x] `docs/knowledge/acceptance/2026-07-19-g6-miniapp-linkage-acceptance.md`
- [x] `docs/knowledge/acceptance/2026-07-19-g6-miniapp-browser-evidence.html`
- [x] `scripts/g6-browser-capture.ts`
- [x] `docs/knowledge/acceptance/assets/g6-miniapp-browser-index.png`
- [x] `docs/knowledge/acceptance/assets/g6-miniapp-browser-member.png`
- [x] `docs/knowledge/acceptance/assets/g6-miniapp-browser-roles.png`

## G7 Miniapp 供应链闭环

- [x] `apps/miniapp/src/supplychain-runtime.ts`
- [x] `apps/miniapp/src/supplychain-runtime.test.ts`
- [x] `apps/miniapp/src/pages/purchase-orders/detail/index.tsx`
- [x] `apps/miniapp/src/pages/purchase-orders/detail/page.test.ts`
- [x] `apps/miniapp/src/pages/return-orders/detail/index.tsx`
- [x] `apps/miniapp/src/pages/return-orders/detail/page.test.ts`
- [x] `apps/api/src/modules/inventory/inventory-purchase.service.ts`
- [x] `apps/api/src/modules/inventory/inventory-purchase.controller.ts`
- [x] `apps/api/src/modules/inventory/inventory-purchase.service.spec.ts`
- [x] `docs/knowledge/acceptance/2026-07-19-g7-miniapp-supplychain-acceptance.md`
- [x] `docs/knowledge/acceptance/2026-07-19-g7-miniapp-browser-acceptance.md`
- [x] `docs/knowledge/acceptance/2026-07-19-g7-miniapp-browser-evidence.html`
- [x] `scripts/g7-browser-capture.ts`
- [x] `docs/knowledge/acceptance/assets/g7-miniapp-browser-entry.png`
- [x] `docs/knowledge/acceptance/assets/g7-miniapp-browser-purchase.png`
- [x] `docs/knowledge/acceptance/assets/g7-miniapp-browser-return.png`

## G8 正式窗口脚本链

- [x] `scripts/lib-m5-kubeconfig.sh`
- [x] `scripts/preflight-prod-public-cutover.sh`
- [x] `scripts/apply-prod-public-cutover.sh`
- [x] `scripts/verify-prod-public-endpoints.sh`
- [x] `scripts/preflight-prod-formal-window.sh`
- [x] `scripts/run-prod-cutover-window.sh`
- [x] `scripts/prepare-prod-cutover-bundle.sh`
- [x] `docs/knowledge/acceptance/2026-07-19-g8-cutover-drill-acceptance.md`
- [x] `PROD-INGRESS-CUTOVER-20260718.md`

## G1/G8 外部阻塞口径

- [x] `EXTERNAL-BLOCKERS-OWNER-BOARD.md`
- [x] `docs/knowledge/acceptance/2026-07-19-g1-release-bundle-confirmation.md`
- [x] `docs/knowledge/acceptance/2026-07-19-v72-resign-bundle.md`

## 总表与状态板

- [x] `TASKS_STATUS.md`
- [x] `WEEKLY-RYG-STATUS-BOARD.md`
- [x] `V7.2-RESIGN-CHECKLIST.md`
- [x] `DEVELOP-PLAN-v7.md`

## 当前未恢复为绿灯的项

- [ ] `G1`：仍受 `DNS + TLS` 外部硬阻塞影响
- [ ] `G8`：脚本链已恢复，但真实窗口 `apply / rollback` 日志尚未补齐

## 备注

- 上述清单表示“文件与口径已恢复到本轮对话最终状态”。
- `G1/G8` 保持黄灯不是漏恢复，而是当前真实外部条件尚未满足。

## 终端一键核对

```bash
cd /Users/yaoyunzhong/Desktop/shenjiying/shenjiying88
bash scripts/check-restored-files.sh
```

- 脚本文件: `scripts/check-restored-files.sh`
- 通过标准: 末尾显示 `fail=0`
