# 2026-07-19 · G8 切流演练证据

> 目标: 为 `G8` 补齐 `render / preflight / dry-run / verify / rollback ready` 的运行证据
> 范围: `K8s release preflight`、`public cutover preflight`、`client dry-run`、`verify --use-resolve`
> 验收方式: 安全离线演练 + 真实网络探测 + 脚本入口固化
> 结论: `🟡 已完成离线演练证据，仍待 server dry-run / 正式窗口日志`

---

## 本轮修复

1. 清理四个 deployment 中遗留的 `ghcr-pull-secret`
2. 将 `secret.yaml` 拉回 `acr-regcred` 占位模板
3. 将 `configmap.yaml` 中的 `DATABASE_URL` 明文移除
4. 将 `kustomization.yaml` 从 `commonLabels` 切到 `labels`
5. 新增统一演练入口 `pnpm cutover:drill`

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

---

## 执行结果

```text
render-k8s-release-manifests.sh -> exit 0
preflight-k8s-release.sh -> exit 0
preflight-prod-public-cutover.sh --offline --allow-missing-tls -> exit 0
apply-prod-public-cutover.sh --kubectl-dry-run client --offline --skip-tls-check -> exit 0
pnpm cutover:drill -> exit 0
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

---

## 判定

| 判定项 | 结果 | 说明 |
|--------|:----:|------|
| 离线 render 证据 | ✅ | 已生成 release 与 public 渲染产物 |
| K8s release preflight | ✅ | 已通过 |
| public client dry-run | ✅ | 已通过 |
| verify 命令已探测 | ✅ | 已拿到 fake cert 与 SSL 现状证据 |
| rollback ready | ✅ | rollback 命令入口已固化到 runbook 和脚本 |
| server dry-run / 正式窗口日志 | ⬜ | 仍待真实集群窗口执行 |

---

## 结论

- `G8` 已不再是“没有运行证据”，而是“已有离线演练证据，待正式窗口补最后一圈”
- 当前 `G8` 保持 `🟡` 合理，不应误报为 `🟢`
