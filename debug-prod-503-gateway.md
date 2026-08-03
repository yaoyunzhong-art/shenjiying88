# Debug Session: prod-503-gateway

## Status
- [RESOLVED]

## Symptom
- `https://admin.sportsant.net/` 返回 `503 Service Temporarily Unavailable`
- `https://store.sportsant.net/` 返回 `503 Service Temporarily Unavailable`
- `https://tob.sportsant.net/` 返回 `503 Service Temporarily Unavailable`
- `https://api.sportsant.net/api/v1/health/ping` 返回 `503 Service Temporarily Unavailable`
- 仅本地 `http://localhost:3002/workbench/guide` 当前可正常显示

## Expected
- `api.sportsant.net/api/v1/health/ping = 200`
- `admin/store/tob.sportsant.net` 均返回业务页面，不返回 nginx 503

## Hypotheses
1. `nginx`/Ingress 在线，但后端 `api/admin/store/tob` 工作负载全部未就绪，导致统一 503。
2. 最新部署后容器已被重建，但健康检查失败，网关没有健康 upstream。
3. 阿里云侧的负载均衡、Ingress 或容器服务路由异常，流量到了网关但转不到正确服务。
4. 应用发布层出现系统性故障，如镜像、环境变量、数据库迁移或启动脚本问题，导致多服务集体启动失败。

## Evidence Collected
- 浏览器核实：
  - `localhost:3002/workbench/guide = 200`
  - `admin.sportsant.net = 503`
  - `store.sportsant.net = 503`
  - `tob.sportsant.net = 503`
  - `api.sportsant.net/api/v1/health/ping = 503`
- 三个公网前端域名和 API 健康检查返回的页面正文均为 `nginx` 默认 503 页。
- 仓库中的网关映射显示：
  - `api -> api:3001`
  - `admin -> admin-web:3002`
  - `store -> storefront-web:3003`
  - `tob -> tob-web:3004`
- 阿里云控制台首页与 DNS 控制台可正常访问，说明账号会话与主控台入口可用。
- `sportsant.net` DNS 记录页可正常打开，且当前列表存在 9 条记录，说明正式域名记录未整体丢失。
- 历史 handoff 记录曾明确为正式域名全绿：
  - `api/admin/store/tob.sportsant.net = 200`
  - `m5-api 1/1`
  - `m5-admin-web 2/2`
  - `m5-storefront-web 2/2`
- 当前 ACK 控制台在打开 `m5-prod-cluster` 的 Deployment 列表时出现：
  - `错误码 PostonlyOrTokenError`
  - 随后多次出现 `WebView is not ready yet`
  - 这导致工作负载列表无法稳定渲染出 Deployment 行，只能看到表头与搜索框，控制台取证受阻。
- 进一步核对仓库生产清单后确认，正式工作负载运行在 `m5` namespace，而不是 ACK 页面最初默认展示的 `default`：
  - Deployment: `m5-api` / `m5-admin-web` / `m5-storefront-web` / `m5-tob-web`
  - Ingress: `m5-ingress`
- 在 ACK `m5` namespace 的 `无状态` 列表中，4 个正式 Deployment 均存在，但副本全部掉为 `0/N`：
  - `m5-admin-web = 0/2`
  - `m5-api = 0/1`
  - `m5-storefront-web = 0/2`
  - `m5-tob-web = 0/1`
- 在 ACK `m5` namespace 的 `容器组` 列表中，对应正式 Pod 当前统一为：
  - `ImagePullBackOff`
  - `Back-off pulling image`
  - 涉及 `m5-admin-web`、`m5-api`、`m5-storefront-web`、`m5-tob-web`
- `ImagePullBackOff` 影响跨多个节点：
  - `cn-hangzhou.10.0.1.34`
  - `cn-hangzhou.10.0.1.35`
  - `cn-hangzhou.10.0.2.103`
  - `cn-hangzhou.10.0.2.104`
  - 说明更像统一镜像拉取凭证/仓库权限问题，而非单节点故障
- 仓库中的生产 K8s 清单显示业务 Deployment 全部依赖：
  - `imagePullSecrets: acr-regcred`
  - registry: `shenjiying88acr20260717-registry.cn-hangzhou.cr.aliyuncs.com`
- 仓库内 `infra/k8s/secret.yaml` 中的 `acr-regcred` 仅为占位模板，不包含真实 ACR 凭据。
- 仓库已提供专门的恢复脚本 `scripts/refresh-acr-regcred.sh`，用途注明为：
  - `一键刷新 acr-regcred 避免 ImagePullBackOff`

## Resolution

- 已确认根因是 `m5/acr-regcred` 的 ACR 鉴权身份错误，而非 DNS、Ingress 或应用代码故障。
- 临时密码路径已完成一次止血，证明刷新 `acr-regcred` 后 4 个正式工作负载可恢复拉镜像。
- 固定密码路径首次失败后，进一步确认 Docker 登录用户名必须使用阿里云账户全名邮箱，不能使用数字 `userId`。
- 仅修正 `acr-regcred.username` 后，再次重启 `m5-api / m5-admin-web / m5-storefront-web / m5-tob-web`，新 Pod 已恢复正常拉镜像并进入 `Running`。
- `admin/store/tob/api.sportsant.net` 已恢复可访问，`api` 健康检查返回 `success: true`。
- 结案与证据归档见：
  - [2026-07-22-prod-503-acr-regcred-closeout.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-22-prod-503-acr-regcred-closeout.md)

## Rejected Hypotheses
- 域名解析整体丢失
  - 当前证据：已排除
- 阿里云控制台整体不可用
  - 当前证据：已排除
- 集群不存在或已整体销毁
  - 当前证据：已排除
- 仅 Ingress/网关层单独故障
  - 当前证据：基本排除；当前更直接的上游故障是 4 个正式工作负载均未拉起

## Next Step
- 将本次正确口径固化到发布前检查：
  - `acr-regcred` 存在且位于 `m5`
  - ACR Docker 登录用户名使用阿里云账户全名邮箱
  - 发布后复核 4 个公网域名与新 Pod 拉镜像事件
