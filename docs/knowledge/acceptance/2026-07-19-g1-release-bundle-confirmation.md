# 2026-07-19 · G1 唯一生产交付口径复签确认

> 目标: 确认 `release bundle` 已成为唯一生产交付口径，并把主计划、runbook、预检脚本与复签材料统一到同一结论
> 范围: `release bundle / preflight / cutover bundle / rollback ready`
> 验收方式: 主计划回正 + 预检脚本执行 + 复签入口统一
> 结论: `🟡 唯一交付口径已成立，但 DNS/TLS 已升格为 G1/G8 外部硬阻塞，未解除前禁止正式发起`

---

## 当前事实

1. 主计划已回正到 `V7.2` 执行态
2. `release bundle` 政策文件已明确为唯一生产交付口径
3. `preflight-k8s-release.sh` 已能在示例 env 下安全通过
4. `G1~G9` 复签总包已生成，可作为单入口交付
5. 当前仍缺 DNS/TLS 真实落地，且 `preflight-prod-formal-window.sh` 已实证 `DNS 无 A 记录 + m5-tls 缺失`
6. 因此 `G1` 只能保持 `🟡`，未解除硬阻塞前禁止正式发起复签

---

## 证据文件

- 主计划: [DEVELOP-PLAN-v7.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/DEVELOP-PLAN-v7.md)
- 交付口径: [PRODUCTION-RELEASE-BUNDLE-POLICY.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/PRODUCTION-RELEASE-BUNDLE-POLICY.md)
- 切流 runbook: [PROD-INGRESS-CUTOVER-20260718.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/PROD-INGRESS-CUTOVER-20260718.md)
- 批次检查表: [PROD-BATCH-CHECKLIST-20260718.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/PROD-BATCH-CHECKLIST-20260718.md)
- 复签总包: [2026-07-19-v72-resign-bundle.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-v72-resign-bundle.md)
- 外部阻塞责任板: [EXTERNAL-BLOCKERS-OWNER-BOARD.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/EXTERNAL-BLOCKERS-OWNER-BOARD.md)
- `G8` 正式窗口门禁证据: [2026-07-19-g8-cutover-drill-acceptance.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g8-cutover-drill-acceptance.md)

---

## 执行命令

```bash
bash scripts/preflight-k8s-release.sh \
  --k8s-dir infra/k8s \
  --public-env-file infra/k8s/templates/m5-public-endpoints.env.example \
  --release-env-file infra/k8s/templates/m5-release-images.env.example
```

```bash
pnpm resign:bundle
```

```bash
bash scripts/preflight-prod-formal-window.sh \
  --env-file infra/k8s/templates/m5-public-endpoints.env.example
```

---

## 执行结果

```text
preflight-k8s-release.sh -> exit 0
pnpm resign:bundle -> exit 0
preflight-prod-formal-window.sh -> exit 1
  - api/admin/store/tob.m5-platform.com 均无 A 记录
  - secrets "m5-tls" not found
```

---

## 当前判定

| 判定项 | 结果 | 说明 |
|--------|:----:|------|
| 唯一生产交付口径已确立 | ✅ | 不认源码清单、不认 `latest`、不认临时 `kubectl apply` |
| 主计划与复签口径一致 | ✅ | `DEVELOP-PLAN-v7` 已回正到 `V7.2` |
| 复签入口已统一 | ✅ | `G1~G9` 总包已生成 |
| `DNS + TLS` 已升格为外部硬阻塞 | ✅ | 已写入责任板、runbook 与 `G8` 验收记录 |
| 可正式发起复签 | ⬜ | `DNS 无 A 记录 + m5-tls 缺失` 未解除前，禁止正式发起 |

---

## 结论

- `G1` 已从“缺统一入口”推进到“唯一生产交付口径已锁定，外部硬阻塞也已显式化”
- 当前 `G1` 保持 `🟡` 更准确，且原因已经不是“准备不足”，而是 `DNS + TLS` 外部资产尚未真实落地
