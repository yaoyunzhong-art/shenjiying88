# Cutover Commands

## 1. Formal Window Wrapper (Recommended)

```bash
bash scripts/run-prod-cutover-window.sh \
  --env-file infra/k8s/cutover-logs/g8-pre-window-20260719-115345/cutover-bundle/public-endpoints.env \
  --release-env-file infra/k8s/cutover-logs/g8-pre-window-20260719-115345/cutover-bundle/release-images.env \

  --window-id formal-window-20260719-115346 \
  --log-root infra/k8s/cutover-logs \
  --execute-apply
```

If rollback evidence is also required in the same formal window:

```bash
bash scripts/run-prod-cutover-window.sh \
  --env-file infra/k8s/cutover-logs/g8-pre-window-20260719-115345/cutover-bundle/public-endpoints.env \
  --release-env-file infra/k8s/cutover-logs/g8-pre-window-20260719-115345/cutover-bundle/release-images.env \

  --window-id formal-window-20260719-115346 \
  --log-root infra/k8s/cutover-logs \
  --execute-apply \
  --execute-rollback
```

## 2. K8s Release Preflight

```bash
bash scripts/preflight-k8s-release.sh \
  --k8s-dir infra/k8s \
  --public-env-file infra/k8s/templates/m5-public-endpoints.env.example \
  --release-env-file infra/k8s/templates/m5-release-images.env.example
```

## 3. TLS Verify

```bash
bash scripts/verify-m5-tls-secret.sh \
  --env-file infra/k8s/cutover-logs/g8-pre-window-20260719-115345/cutover-bundle/public-endpoints.env
```

## 4. Public Cutover Preflight

```bash
bash scripts/preflight-prod-public-cutover.sh \
  --env-file infra/k8s/cutover-logs/g8-pre-window-20260719-115345/cutover-bundle/public-endpoints.env
```

## 5. Public Cutover Dry Run

```bash
bash scripts/apply-prod-public-cutover.sh \
  --env-file infra/k8s/cutover-logs/g8-pre-window-20260719-115345/cutover-bundle/public-endpoints.env \
  --kubectl-dry-run server

```

## 6. Public Cutover Apply

```bash
bash scripts/apply-prod-public-cutover.sh \
  --env-file infra/k8s/cutover-logs/g8-pre-window-20260719-115345/cutover-bundle/public-endpoints.env

```

## 7. Verify and Rollback Ready

```bash
bash scripts/verify-prod-public-endpoints.sh \
  --env-file infra/k8s/cutover-logs/g8-pre-window-20260719-115345/cutover-bundle/public-endpoints.env

bash scripts/rollback-prod-public-cutover.sh
```
