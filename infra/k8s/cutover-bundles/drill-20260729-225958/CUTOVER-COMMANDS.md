# Cutover Commands

## 0. G8 Readiness Only

```bash
bash scripts/run-g8-formal-window-ready.sh \
  --env-file /Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-bundles/drill-20260729-225958/public-endpoints.env \
  --release-env-file /Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-bundles/drill-20260729-225958/release-images.env \
  --window-id formal-window-$(date +%Y%m%d-%H%M%S) \
  --log-root infra/k8s/cutover-logs
```

## 1. G8 Formal Window Execute

```bash
bash scripts/run-g8-formal-window-ready.sh \
  --env-file /Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-bundles/drill-20260729-225958/public-endpoints.env \
  --release-env-file /Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-bundles/drill-20260729-225958/release-images.env \
  --window-id formal-window-$(date +%Y%m%d-%H%M%S) \
  --log-root infra/k8s/cutover-logs \
  --execute-apply \
  --execute-rollback
```

## 2. With PEM Material

```bash
bash scripts/run-g8-formal-window-ready.sh \
  --env-file /Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-bundles/drill-20260729-225958/public-endpoints.env \
  --release-env-file /Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-bundles/drill-20260729-225958/release-images.env \
  --cert-file /secure/path/fullchain.pem \
  --key-file /secure/path/privkey.pem \
  --window-id formal-window-$(date +%Y%m%d-%H%M%S) \
  --log-root infra/k8s/cutover-logs \
  --execute-apply \
  --execute-rollback
```

## 3. K8s Release Preflight

```bash
bash scripts/preflight-k8s-release.sh \
  --k8s-dir infra/k8s \
  --public-env-file /Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/templates/m5-public-endpoints.env.example \
  --release-env-file /Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-bundles/drill-20260729-225958/release-images.env
```

## 4. TLS Verify

```bash
bash scripts/verify-m5-tls-secret.sh \
  --env-file /Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-bundles/drill-20260729-225958/public-endpoints.env
```

## 5. Public Cutover Preflight

```bash
bash scripts/preflight-prod-public-cutover.sh \
  --env-file /Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-bundles/drill-20260729-225958/public-endpoints.env
```

## 6. Public Cutover Dry Run

```bash
bash scripts/apply-prod-public-cutover.sh \
  --env-file /Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-bundles/drill-20260729-225958/public-endpoints.env \
  --kubectl-dry-run server

```

## 7. Public Cutover Apply

```bash
bash scripts/apply-prod-public-cutover.sh \
  --env-file /Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-bundles/drill-20260729-225958/public-endpoints.env

```

## 8. Verify and Rollback Ready

```bash
bash scripts/verify-prod-public-endpoints.sh \
  --env-file /Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-bundles/drill-20260729-225958/public-endpoints.env

bash scripts/rollback-prod-public-cutover.sh
```
