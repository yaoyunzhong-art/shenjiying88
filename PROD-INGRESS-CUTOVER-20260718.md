# Production Ingress Cutover Runbook

## Current Facts

- Namespace: `m5`
- Ingress: `m5-ingress`
- Current ingress hosts:
  - `api.m5.local`
  - `admin.m5.local`
  - `store.m5.local`
  - `tob.m5.local`
- Current NLB:
  - `nlb-gjgd785d7s4albohcx.cn-hangzhou.nlb.aliyuncsslb.com`
  - `121.41.69.154`
  - `120.26.66.40`
- Current TLS state:
  - No `m5-tls` secret exists in namespace `m5`
  - No cert-manager `Certificate/CertificateRequest/Order/Challenge` exists in namespace `m5`
  - Current HTTPS serves `Kubernetes Ingress Controller Fake Certificate`

## Verified Routing

- HTTP on port `80` redirects correctly to HTTPS for all current hosts.
- HTTPS with `Host` override already routes correctly to:
  - `m5-api`
  - `m5-admin-web`
  - `m5-storefront-web`
  - `m5-tob-web`
- This means the ingress routing plane is working; the remaining public blocker is DNS plus real TLS.

## Intended Production Domains

Confirmed from `infra/production-config.yaml`:

- `m5-platform.com`
- `www.m5-platform.com`
- `api.m5-platform.com`
- `admin.m5-platform.com`
- `cdn.m5-platform.com`

Still unresolved:

- formal host for `storefront-web`
- formal host for `tob-web`

Prepared default candidates in `infra/k8s/templates/m5-public-endpoints.env.example`:

- `store.m5-platform.com`
- `tob.m5-platform.com`

These defaults are only render-time placeholders until product/business confirms the final names.

## External Blockers

- DNS records for `*.m5-platform.com` are not present yet.
- `storefront` and `tob` do not have final production hostnames.
- No real TLS secret is mounted to the production ingress.

## Required DNS Records

Create these records to the NLB:

```text
api.m5-platform.com      -> 121.41.69.154 / 120.26.66.40
admin.m5-platform.com    -> 121.41.69.154 / 120.26.66.40
```

After storefront/tob naming is confirmed, add:

```text
<storefront-host>        -> 121.41.69.154 / 120.26.66.40
<tob-host>               -> 121.41.69.154 / 120.26.66.40
```

Optional apex records if needed by product/marketing:

```text
m5-platform.com          -> 121.41.69.154 / 120.26.66.40
www.m5-platform.com      -> 121.41.69.154 / 120.26.66.40
```

## Required TLS Artifacts

Choose one path:

- Path A: cert-manager issues a new multi-SAN certificate after DNS is ready
- Path B: upload an external certificate and create `m5-tls` manually

Minimum SANs already supported by repo intent:

```text
m5-platform.com
www.m5-platform.com
api.m5-platform.com
admin.m5-platform.com
cdn.m5-platform.com
```

Add storefront/tob SANs after final naming is confirmed.

## Repo Cutover Scope

These files must be updated together in one cutover slice:

- `infra/k8s/ingress.yaml`
- `infra/k8s/configmap.yaml`

Prepared templates:

- `infra/k8s/templates/m5-public-endpoints.env.example`
- `infra/k8s/templates/m5-ingress-public.template.yaml`
- `infra/k8s/templates/m5-config-public.template.yaml`
- `infra/k8s/templates/m5-tls-secret.template.yaml`
- `infra/k8s/templates/m5-public-dns-records.template.csv`

Prepared scripts:

- `scripts/lib-m5-kubeconfig.sh`
- `scripts/render-prod-public-cutover.sh`
- `scripts/verify-prod-public-endpoints.sh`
- `scripts/build-m5-tls-secret.sh`
- `scripts/verify-m5-tls-secret.sh`
- `scripts/preflight-prod-public-cutover.sh`
- `scripts/apply-prod-public-cutover.sh`
- `scripts/rollback-prod-public-cutover.sh`

At minimum, these values must be changed together:

- `spec.tls.hosts`
- `spec.rules[*].host`
- `secretName`
- `nginx.ingress.kubernetes.io/cors-allow-origin`
- `CORS_ORIGIN`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WS_URL`

## Recommended Cutover Sequence

1. Finalize production hostnames for `storefront` and `tob`
2. Create DNS records to the NLB
3. Issue or import real TLS certificate
4. Render final manifests from the prepared template set
5. Create `m5-tls` in namespace `m5`
6. Patch `Ingress` and `ConfigMap` in the same change window
7. Roll restart:
   - `m5-api`
   - `m5-admin-web`
   - `m5-storefront-web`
   - `m5-tob-web`
8. Verify:
   - `curl -I https://api.<prod-host>/api/v1/health/ping`
   - admin home
   - storefront home
   - tob home
   - browser certificate subject/issuer

## Render Commands

```bash
chmod +x scripts/render-prod-public-cutover.sh scripts/verify-prod-public-endpoints.sh
scripts/render-prod-public-cutover.sh \
  --env-file infra/k8s/templates/m5-public-endpoints.env.example \
  --output-dir infra/k8s/rendered-public
```

After DNS is ready:

```bash
scripts/verify-prod-public-endpoints.sh \
  --env-file infra/k8s/templates/m5-public-endpoints.env.example
```

Before DNS is ready but after NLB is confirmed:

```bash
scripts/verify-prod-public-endpoints.sh \
  --env-file infra/k8s/templates/m5-public-endpoints.env.example \
  --use-resolve
```

Expected result before the ingress host rules are switched:

- fake ingress certificate is still returned
- HTTP `404` is still returned for future public hostnames

This is normal before the formal host rules are applied.

If you already have the certificate files:

```bash
scripts/build-m5-tls-secret.sh \
  --cert-file /path/to/fullchain.pem \
  --key-file /path/to/privkey.pem \
  --secret-name m5-tls \
  --namespace m5
```

After the TLS secret is applied, verify the live secret before any public cutover:

```bash
kubectl apply -f infra/k8s/rendered-public/m5-tls.yaml

scripts/verify-m5-tls-secret.sh \
  --env-file infra/k8s/templates/m5-public-endpoints.env.example
```

This verification checks:

- secret exists in namespace `m5`
- secret type is `kubernetes.io/tls`
- certificate subject / issuer / validity
- SAN coverage for `api/admin/storefront/tob`

## Apply Command

When DNS, TLS and final hosts are all ready, use the one-shot apply script instead of patching live resources by hand:

```bash
chmod +x \
  scripts/render-prod-public-cutover.sh \
  scripts/verify-prod-public-endpoints.sh \
  scripts/build-m5-tls-secret.sh \
  scripts/apply-prod-public-cutover.sh \
  scripts/rollback-prod-public-cutover.sh

scripts/apply-prod-public-cutover.sh \
  --env-file infra/k8s/templates/m5-public-endpoints.env.example
```

If the rendered directory does not contain `m5-tls-secret.yaml`, the apply script requires an existing `m5-tls` secret in namespace `m5`, or an explicit TLS manifest:

```bash
scripts/apply-prod-public-cutover.sh \
  --env-file infra/k8s/templates/m5-public-endpoints.env.example \
  --tls-manifest infra/k8s/rendered-public/m5-tls.yaml
```

The apply script will:

- render final manifests
- back up the live `Ingress` and `ConfigMap`
- apply TLS, `ConfigMap`, `Ingress`
- restart `m5-api`, `m5-admin-web`, `m5-storefront-web`, `m5-tob-web`
- wait for rollout completion by default

## Preflight And Dry-Run

When formal DNS binding is intentionally deferred, continue with non-mutating checks first:

```bash
scripts/preflight-prod-public-cutover.sh \
  --env-file infra/k8s/templates/m5-public-endpoints.env.example \
  --allow-missing-tls
```

This preflight will:

- confirm `kubectl` can reach namespace `m5`
- print the live `Ingress` hosts and current public runtime URLs
- print readiness for `m5-api`, `m5-admin-web`, `m5-storefront-web`, `m5-tob-web`
- render the future public manifests
- run `kubectl apply --dry-run=server` against rendered `ConfigMap` and `Ingress`
- treat missing TLS as a warning when `--allow-missing-tls` is set

The current scripts now auto-discover kubeconfig in this order:

1. `KUBECONFIG`
2. `~/.kube/m5-prod-config`
3. `./.tmp/ack-kubeconfig.yaml`

This removes the need to export `KUBECONFIG` manually in the common production path.

If the current terminal does not have ACK kubeconfig/context, use offline mode first:

```bash
scripts/preflight-prod-public-cutover.sh \
  --env-file infra/k8s/templates/m5-public-endpoints.env.example \
  --offline \
  --allow-missing-tls
```

Offline mode skips live cluster reads and falls back to rendered-manifest sanity checks, because kubectl resource discovery still needs a real API server.

If you want the apply script itself to stop before mutation, use:

```bash
scripts/apply-prod-public-cutover.sh \
  --env-file infra/k8s/templates/m5-public-endpoints.env.example \
  --kubectl-dry-run server \
  --skip-tls-check
```

This mode still renders manifests and backs up the live `Ingress/ConfigMap`, but it does not persist changes or restart workloads.

If kubeconfig is unavailable in the current terminal, use the offline client-side path:

```bash
scripts/apply-prod-public-cutover.sh \
  --env-file infra/k8s/templates/m5-public-endpoints.env.example \
  --kubectl-dry-run client \
  --offline \
  --skip-tls-check
```

This offline path renders the manifests and checks that no template placeholders remain, but it does not replace a later cluster-connected `server dry-run`.

## Latest Evidence

Latest cluster-connected verification in ACK has already been executed successfully:

- live ingress hosts confirmed:
  - `api.m5.local`
  - `admin.m5.local`
  - `store.m5.local`
  - `tob.m5.local`
- live runtime URLs confirmed:
  - `NEXT_PUBLIC_API_URL=https://api.m5.local/api/v1`
  - `NEXT_PUBLIC_WS_URL=wss://api.m5.local`
  - `CORS_ORIGIN=https://admin.m5.local,https://store.m5.local,https://tob.m5.local`
- live deployment readiness confirmed:
  - `m5-api = 1/1`
  - `m5-admin-web = 2/2`
  - `m5-storefront-web = 2/2`
  - `m5-tob-web = 1/1`
- `scripts/preflight-prod-public-cutover.sh --allow-missing-tls` passed
- `scripts/apply-prod-public-cutover.sh --kubectl-dry-run server --skip-tls-check` passed

The only remaining hard blocker observed in the same verification window is:

- `m5-tls` secret still does not exist in namespace `m5`
- rendered TLS manifest is still absent until certificate material is provided

## Certificate Hand-Off

When certificate material is provided later, use this exact shortest path:

```bash
scripts/build-m5-tls-secret.sh \
  --cert-file /path/to/fullchain.pem \
  --key-file /path/to/privkey.pem \
  --secret-name m5-tls \
  --namespace m5 \
  --output-file infra/k8s/rendered-public/m5-tls.yaml

kubectl apply -f infra/k8s/rendered-public/m5-tls.yaml

scripts/verify-m5-tls-secret.sh \
  --env-file infra/k8s/templates/m5-public-endpoints.env.example

scripts/apply-prod-public-cutover.sh \
  --env-file infra/k8s/templates/m5-public-endpoints.env.example \
  --kubectl-dry-run server
```

Only after the four steps above are green, execute the real apply:

```bash
scripts/apply-prod-public-cutover.sh \
  --env-file infra/k8s/templates/m5-public-endpoints.env.example
```

## Rollback Command

If public host cutover causes routing or runtime regression, roll back to the repo `.local` baseline with:

```bash
scripts/rollback-prod-public-cutover.sh
```

The rollback script will:

- back up the current live `Ingress` and `ConfigMap`
- re-apply `infra/k8s/configmap.yaml`
- re-apply `infra/k8s/ingress.yaml`
- restart the same four Deployments
- keep the TLS secret untouched

## Cutover Stop Conditions

- DNS still does not resolve to the NLB
- HTTPS still serves fake ingress certificate
- `m5-tls` secret is missing
- storefront/tob formal hosts are still undecided
- rollback script is not prepared in the change window terminal
- preflight or server dry-run has not been executed after the latest manifest change

## Current Recommendation

- Do not patch production ingress hosts yet.
- First complete DNS plus real certificate plus storefront/tob hostname decisions.
- While DNS is deferred, keep advancing with `preflight -> server dry-run -> final apply` instead of waiting idly.
- Once those three prerequisites are in place, the repo and cluster cutover can be executed as a single aligned slice.
- Use the prepared template set plus `scripts/apply-prod-public-cutover.sh` instead of editing scattered values by hand.
- Keep `scripts/rollback-prod-public-cutover.sh` ready in the same terminal session before the public cutover window starts.
