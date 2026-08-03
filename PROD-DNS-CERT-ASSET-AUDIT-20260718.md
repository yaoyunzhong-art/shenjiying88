# Production DNS And Certificate Asset Audit

## Current Result

- Public ingress routing is working.
- External assets required for formal cutover are not in place yet.
- The remaining blocker is not application runtime, but DNS plus certificate inventory.

## Verified Facts

- Current production NLB:
  - `nlb-gjgd785d7s4albohcx.cn-hangzhou.nlb.aliyuncsslb.com`
  - `121.41.69.154`
  - `120.26.66.40`
- Current ingress hosts are still:
  - `api.m5.local`
  - `admin.m5.local`
  - `store.m5.local`
  - `tob.m5.local`
- Current HTTPS certificate served by ingress:
  - `Kubernetes Ingress Controller Fake Certificate`
- Current cluster state:
  - no `m5-tls` secret
  - no cert-manager CRDs
  - no cert-manager Pods

## Alibaba Cloud DNS Audit

- `aliyun alidns DescribeDomains` does not show `m5-platform.com`
- `aliyun alidns DescribeDomainRecords --DomainName m5-platform.com` returns:
  - `InvalidDomainName.NoExist`

Conclusion:

- `m5-platform.com` is not currently managed in the active Alibaba Cloud DNS account
- DNS cutover cannot proceed from this account until the domain is either:
  - added into Alibaba Cloud DNS, or
  - managed and updated in another DNS provider/account

## Alibaba Cloud Certificate Audit

- `aliyun cas` plugin is available
- current account audit did not reveal an obvious issued or uploaded certificate bound to `m5-platform.com`
- no certificate is currently mounted into namespace `m5`

Conclusion:

- there is no ready-to-use in-cluster TLS artifact for the intended production hosts

## Naming Gaps

Confirmed repo intent:

- `m5-platform.com`
- `www.m5-platform.com`
- `api.m5-platform.com`
- `admin.m5-platform.com`
- `cdn.m5-platform.com`

Still unresolved:

- storefront formal hostname
- tob formal hostname

## Ready Artifacts In Repo

- [PROD-INGRESS-CUTOVER-20260718.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/PROD-INGRESS-CUTOVER-20260718.md)
- [m5-public-endpoints.env.example](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/templates/m5-public-endpoints.env.example)
- [m5-ingress-public.template.yaml](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/templates/m5-ingress-public.template.yaml)
- [m5-config-public.template.yaml](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/templates/m5-config-public.template.yaml)
- [m5-tls-secret.template.yaml](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/templates/m5-tls-secret.template.yaml)
- [m5-public-dns-records.template.csv](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/templates/m5-public-dns-records.template.csv)
- [render-prod-public-cutover.sh](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/scripts/render-prod-public-cutover.sh)
- [verify-prod-public-endpoints.sh](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/scripts/verify-prod-public-endpoints.sh)
- [build-m5-tls-secret.sh](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/scripts/build-m5-tls-secret.sh)

## Next External Actions

1. Confirm final formal hostnames for `storefront` and `tob`
2. Confirm where `m5-platform.com` DNS is actually hosted
3. Create DNS records to the production NLB
4. Issue or import a real certificate covering the final SAN list
5. Create `m5-tls` in namespace `m5`
6. Apply the prepared ingress/config cutover slice
