# G8 TLS Recommendation

- target_domain: `sportsant.net`
- deployment_mode: `企业级部署`
- current_fact: `当前阿里云账号下未发现 sportsant.net 相关现有 SSL 证书`
- cost_decision: `不走高价 OV，不走 wildcard，不临时改成 path-based 架构`

## Preferred Path

- preferred_option: `cert-manager + AliDNS webhook + Let's Encrypt DNS01`
- certificate_dns_names:
  - `api.sportsant.net`
  - `admin.sportsant.net`
  - `store.sportsant.net`
  - `tob.sportsant.net`
- result_secret: `m5/m5-tls`
- reason:
  - 直接满足当前 G8 多 host 架构
  - 不需要购买 wildcard 或 OV
  - 产物仍然是现有脚本链认可的 `m5-tls`
  - 绕开阿里云备案拦截，避免 `HTTP-01` 被 `403 Non-compliance ICP Filing` 截胡

## Repo Entry

- base_precheck:

```bash
pnpm g8:tls:precheck
```

- install_cert_manager_if_missing:

```bash
pnpm g8:tls:install-cert-manager
```

- one_click_provision:

```bash
pnpm g8:tls:provision
```

- install_alidns_webhook:

```bash
pnpm g8:tls:install-alidns-webhook
```

- create_alidns_secret:

```bash
ALIDNS_ACCESS_KEY_ID=... ALIDNS_ACCESS_KEY_SECRET=... pnpm g8:tls:create-alidns-secret
```

- then_recheck:

```bash
pnpm g8:recheck
```

## Current TLS Gap

- no formal certificate found in current Aliyun SSL console
- current repo previously had no `ClusterIssuer` / `Certificate` delivery chain
- no live `m5-tls` secret in cluster evidence chain

## Prerequisites

- DNS for `api/admin/store/tob.sportsant.net` already points to production NLB
- cluster has cert-manager CRDs and controller running
- `cert-manager/alidns-webhook` is installed and healthy
- `cert-manager/alidns-credentials` exists with AliDNS AccessKey pair
- if the base is missing, install it first via `pnpm g8:tls:install-cert-manager`

## Fallback

- fallback_option: `手工 PEM -> m5-tls secret`
- accepted_files:
  - `fullchain.pem`
  - `privkey.pem`
- note: `仅作为 cert-manager 未就绪时的兜底，不再主推 wildcard 采购`

## Done Means Green

- certificate SAN covers `api/admin/store/tob.sportsant.net`
- `kubectl -n m5 get secret m5-tls` succeeds
- `pnpm g8:recheck` no longer reports TLS blocker

## Current Blocker Learned

- `HTTP-01` path is externally blocked by Aliyun ICP interception on `api.sportsant.net`
- `curl http://api.sportsant.net/.well-known/acme-challenge/...` returns `403 Non-compliance ICP Filing`
- therefore `HTTP-01` cannot be the production path for this domain on the current network path

## Next Command

```bash
pnpm g8:tls:precheck || pnpm g8:tls:install-cert-manager
pnpm g8:tls:install-alidns-webhook
ALIDNS_ACCESS_KEY_ID=... ALIDNS_ACCESS_KEY_SECRET=... pnpm g8:tls:create-alidns-secret
pnpm g8:tls:provision && pnpm g8:recheck
```
