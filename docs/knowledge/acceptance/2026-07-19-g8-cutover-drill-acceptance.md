# 2026-07-19 · G8 切流演练证据

> 目标: 为 `G8` 补齐 `render / preflight / dry-run / verify / rollback ready` 的运行证据
> 范围: `K8s release preflight`、`public cutover preflight`、`client dry-run`、`verify --use-resolve`
> 验收方式: 安全离线演练 + 真实网络探测 + 脚本入口固化
> 结论: `🟡 已完成离线演练、预跑日志与正式窗口门禁；当前被 DNS/TLS 外部硬阻塞卡住，仍待真实 apply / rollback 日志`

---

## 本轮修复

1. 清理四个 deployment 中遗留的 `ghcr-pull-secret`
2. 将 `secret.yaml` 拉回 `acr-regcred` 占位模板
3. 将 `configmap.yaml` 中的 `DATABASE_URL` 明文移除
4. 将 `kustomization.yaml` 从 `commonLabels` 切到 `labels`
5. 新增统一演练入口 `pnpm cutover:drill`
6. 新增正式窗口门禁 `preflight-prod-formal-window.sh`
7. 将 `DNS + TLS` 失败结果写回 `G1/G8` 外部硬阻塞口径

---

## 执行命令

```bash
bash scripts/render-k8s-release-manifests.sh \
  --env-file infra/k8s/templates/m5-release-images.env.example \
  --output-dir infra/k8s/rendered-release-drill
```

```bash
bash scripts/preflight-k8s-release.sh \
  --k8s-dir infra/k8s \
  --public-env-file infra/k8s/templates/m5-public-endpoints.env.example \
  --release-env-file infra/k8s/templates/m5-release-images.env.example
```

```bash
bash scripts/preflight-prod-public-cutover.sh \
  --env-file infra/k8s/templates/m5-public-endpoints.env.example \
  --rendered-dir infra/k8s/rendered-public-preflight-drill \
  --offline \
  --allow-missing-tls
```

```bash
bash scripts/apply-prod-public-cutover.sh \
  --env-file infra/k8s/templates/m5-public-endpoints.env.example \
  --rendered-dir infra/k8s/rendered-public-apply-drill \
  --kubectl-dry-run client \
  --offline \
  --skip-tls-check
```

```bash
bash scripts/verify-prod-public-endpoints.sh \
  --env-file infra/k8s/templates/m5-public-endpoints.env.example \
  --use-resolve
```

```bash
pnpm cutover:drill
```

```bash
bash scripts/preflight-prod-formal-window.sh \
  --env-file infra/k8s/templates/m5-public-endpoints.env.example
```

```bash
bash scripts/preflight-prod-formal-window.sh \
  --env-file infra/k8s/templates/m5-public-endpoints.env.example \
  --tls-manifest infra/k8s/rendered-public/m5-tls.yaml
```

---

## 执行结果

```text
render-k8s-release-manifests.sh -> exit 0
preflight-k8s-release.sh -> exit 0
preflight-prod-public-cutover.sh --offline --allow-missing-tls -> exit 0
apply-prod-public-cutover.sh --kubectl-dry-run client --offline --skip-tls-check -> exit 0
pnpm cutover:drill -> exit 0
preflight-prod-formal-window.sh -> exit 1
  - DNS has no A record for api/admin/store/tob.m5-platform.com
  - secrets "m5-tls" not found
preflight-prod-formal-window.sh --tls-manifest infra/k8s/rendered-public/m5-tls.yaml -> exit 1
  - DNS has no A record for api/admin/store/tob.m5-platform.com
  - TLS manifest does not exist: infra/k8s/rendered-public/m5-tls.yaml
```

`verify-prod-public-endpoints.sh --use-resolve` 的真实探测结果:

```text
Certificate api.m5-platform.com:
subject=O=Acme Co, CN=Kubernetes Ingress Controller Fake Certificate
issuer=O=Acme Co, CN=Kubernetes Ingress Controller Fake Certificate

curl https://api.m5-platform.com -> SSL_ERROR_SYSCALL
```

说明:

- 该结果符合当前未完成正式 DNS/TLS 切换前的预期
- 当前已证明 NLB 前仍是 fake cert 阶段，不能据此宣称已完成正式窗口切流

---

## 当前产物

- release 渲染目录: `infra/k8s/rendered-release-drill`
- public 预检目录: `infra/k8s/rendered-public-preflight-drill`
- public dry-run 目录: `infra/k8s/rendered-public-apply-drill`
- cutover bundle 目录:
  - `infra/k8s/cutover-bundles/drill-20260719`
  - `infra/k8s/cutover-bundles/drill-20260719-v2`
- 演练脚本: [run-cutover-drill.sh](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/scripts/run-cutover-drill.sh)
- 正式窗口门禁脚本: [preflight-prod-formal-window.sh](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/scripts/preflight-prod-formal-window.sh)
- 正式窗口就绪入口: [run-g8-formal-window-ready.sh](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/scripts/run-g8-formal-window-ready.sh)
- `G1/G8` 外部硬阻塞板: [EXTERNAL-BLOCKERS-OWNER-BOARD.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/EXTERNAL-BLOCKERS-OWNER-BOARD.md)

---

## 判定

| 判定项 | 结果 | 说明 |
|--------|:----:|------|
| 离线 render 证据 | ✅ | 已生成 release 与 public 渲染产物 |
| K8s release preflight | ✅ | 已通过 |
| public client dry-run | ✅ | 已通过 |
| verify 命令已探测 | ✅ | 已拿到 fake cert 与 SSL 现状证据 |
| rollback ready | ✅ | rollback 命令入口已固化到 runbook 和脚本 |
| 正式窗口门禁 | ✅ | 已将 `DNS -> TLS -> m5-tls Secret/manifest` 做成显式阻断 |
| `DNS + TLS` 外部硬阻塞已责任化 | ✅ | 已同步到 `G1/G8` 口径与责任板 |
| server dry-run / 正式窗口日志 | ⬜ | 外部硬阻塞未解除前禁止真实集群窗口执行 |

---

## 结论

- `G8` 已不再是“没有运行证据”，而是“已有离线演练证据、正式窗口门禁与失败证据，待 DNS/TLS 落地后补最后一圈”
- 当前 `G8` 保持 `🟡` 合理，且在外部硬阻塞解除前不得误报为 `🟢` 或强行执行真实 `apply`
