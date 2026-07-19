# G8 Today Action Board

- date: `2026-07-19`
- window_id: `formal-window-20260719-154427`
- today_goal: `clear external blockers enough to rerun readiness`

## Today Deliveries

| Owner | Must Deliver Today | Done Means Complete |
|-------|--------------------|---------------------|
| `E18 / E46` | 已确认企业级部署正式 host 为 `api/admin/store/tob.sportsant.net`，保持口径不回退 | 后续证书 SAN 和发布脚本只认 `sportsant.net` |
| `E41` | 已在阿里云 DNS 控制台持有 `sportsant.net` 并配置 `api/admin/store/tob` 8 条 A 记录 | 新版 readiness 不再报 DNS blocker |
| `E46 / E49` | 走 `cert-manager + AliDNS webhook + Let's Encrypt DNS01` 免费可信证书路径，为 `api/admin/store/tob.sportsant.net` 生成 `m5-tls` | `pnpm g8:tls:provision` 成功，`kubectl -n m5 get secret m5-tls` 返回成功，详见 [TLS-RECOMMENDATION.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/TLS-RECOMMENDATION.md) |
| `E52` | 在 `m5` namespace 下发 live `m5-tls` | `kubectl -n m5 get secret m5-tls` 返回成功 |
| `E49` | 在以上交付完成后重跑 readiness | `run-g8-formal-window-ready.sh` 通过，无新的阻塞失败输出 |

## Verification Commands

### 0. One-Click Recheck

```bash
pnpm g8:recheck
```

### 1. DNS Check

```bash
for h in api.sportsant.net admin.sportsant.net store.sportsant.net tob.sportsant.net; do
  echo "===== $h ====="
  dig +short A "$h"
done
```

### 2. TLS Secret Check

```bash
kubectl -n m5 get secret m5-tls
```

### 3. cert-manager Base Precheck

```bash
pnpm g8:tls:precheck
```

### 4. Install cert-manager If Missing

```bash
pnpm g8:tls:install-cert-manager
```

### 5. Install AliDNS Webhook

```bash
pnpm g8:tls:install-alidns-webhook
```

### 6. Create AliDNS Secret

```bash
ALIDNS_ACCESS_KEY_ID=... ALIDNS_ACCESS_KEY_SECRET=... pnpm g8:tls:create-alidns-secret
```

### 7. TLS Provision

```bash
pnpm g8:tls:provision
```

### 8. Readiness Recheck

```bash
bash scripts/run-g8-formal-window-ready.sh \
  --env-file infra/k8s/templates/m5-public-endpoints.env.example \
  --release-env-file infra/k8s/templates/m5-release-images.env.example \
  --window-id formal-window-$(date +%Y%m%d-%H%M%S) \
  --log-root infra/k8s/cutover-logs
```

## Rule

- If any one of DNS, TLS, or host decision is still missing, do not run real `apply`.
- Today's success line is: readiness rerun turns green.
- Prefer `pnpm g8:tls:precheck` first; if base is missing, run `pnpm g8:tls:install-cert-manager`, then install `alidns-webhook`, create the AliDNS secret, and finally run `pnpm g8:tls:provision`.
- Root shortcut is now available in [package.json](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/package.json).
- When readiness turns green, move to [G8-SUCCESS-CHECKLIST.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/G8-SUCCESS-CHECKLIST.md).
