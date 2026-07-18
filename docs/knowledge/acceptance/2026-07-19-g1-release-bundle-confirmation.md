# 2026-07-19 · G1 唯一生产交付口径复签确认

> 目标: 确认 `release bundle` 已成为唯一生产交付口径，并把主计划、runbook、预检脚本与复签材料统一到同一结论
> 范围: `release bundle / preflight / cutover bundle / rollback ready`
> 验收方式: 主计划回正 + 预检脚本执行 + 复签入口统一
> 结论: `🟡 已具备正式发起前条件，待外部资产落地后再发起`

---

## 当前事实

1. 主计划已回正到 `V7.2` 执行态
2. `release bundle` 政策文件已明确为唯一生产交付口径
3. `preflight-k8s-release.sh` 已能在示例 env 下安全通过
4. `G1~G9` 复签总包已生成，可作为单入口交付
5. 当前仍缺 DNS/TLS 真实落地，因此不建议直接将 `G1` 标为可正式发起

---

## 证据文件

- 主计划: [DEVELOP-PLAN-v7.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/DEVELOP-PLAN-v7.md)
- 交付口径: [PRODUCTION-RELEASE-BUNDLE-POLICY.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/PRODUCTION-RELEASE-BUNDLE-POLICY.md)
- 切流 runbook: [PROD-INGRESS-CUTOVER-20260718.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/PROD-INGRESS-CUTOVER-20260718.md)
- 批次检查表: [PROD-BATCH-CHECKLIST-20260718.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/PROD-BATCH-CHECKLIST-20260718.md)
- 复签总包: [2026-07-19-v72-resign-bundle.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-v72-resign-bundle.md)

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

---

## 执行结果

```text
preflight-k8s-release.sh -> exit 0
pnpm resign:bundle -> exit 0
```

---

## 当前判定

| 判定项 | 结果 | 说明 |
|--------|:----:|------|
| 唯一生产交付口径已确立 | ✅ | 不认源码清单、不认 `latest`、不认临时 `kubectl apply` |
| 主计划与复签口径一致 | ✅ | `DEVELOP-PLAN-v7` 已回正到 `V7.2` |
| 复签入口已统一 | ✅ | `G1~G9` 总包已生成 |
| 可正式发起复签 | ⬜ | 仍待外部资产真实落地与 `G8` 运行证据进一步补齐 |

---

## 结论

- `G1` 已从“缺统一入口”推进到“已具备正式发起前条件”
- 当前 `G1` 保持 `🟡` 更准确，不能误标为 `🟢`
