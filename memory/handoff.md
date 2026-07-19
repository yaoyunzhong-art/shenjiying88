# 龙虾哥同步稿 - 2026-07-19

> 最新口径：神机营 SaaS 已从“冲刺写功能”切到“Release Bundle 驱动交付”。

---

## 1. 当前生产状态

- `sportsant.net` 正式公网入口已切换完成。
- 当前正式域名：
  - `api.sportsant.net`
  - `admin.sportsant.net`
  - `store.sportsant.net`
  - `tob.sportsant.net`
- 生产 TLS 已切为 DigiCert 通配符证书：`CN=*.sportsant.net`
- live Ingress 已切到正式域名口径。
- live Config 已切到正式口径：
  - `NEXT_PUBLIC_API_URL=https://api.sportsant.net/api/v1`
  - `NEXT_PUBLIC_WS_URL=wss://api.sportsant.net`
  - `CORS_ORIGIN=https://admin.sportsant.net,https://store.sportsant.net,https://tob.sportsant.net`

## 2. 当前线上验收结果

- `api.sportsant.net/api/v1/health/ping = 200`
- `admin.sportsant.net = 200`
- `store.sportsant.net = 200`
- `tob.sportsant.net = 200`
- 浏览器验收已通过：
  - `admin.sportsant.net` 页面成功加载
  - `store.sportsant.net` 页面成功加载
  - `tob.sportsant.net` 页面成功加载
- 当前核心 Deployment 稳态：
  - `m5-api 1/1`
  - `m5-admin-web 2/2`
  - `m5-storefront-web 2/2`
  - `m5-tob-web 1/1`

## 3. 本次线上问题与确认经验

- 阿里云账户欠费会导致 SLB 锁定，典型表现：
  - TCP 可达
  - TLS 握手直接 EOF / `SSL_ERROR_SYSCALL`
- `acr-regcred` 当前依赖 ACR 临时令牌，过期后会导致：
  - `401 Unauthorized`
  - `ImagePullBackOff`
  - Pod 不 Ready
  - 公网入口统一返回 `503`
- 域名切换不能只改证书和 Ingress，必须同步改：
  - `m5-config`
  - `NEXT_PUBLIC_API_URL`
  - `NEXT_PUBLIC_WS_URL`
  - `CORS_ORIGIN`

## 4. 已拍板的标准开发流程

- 从现在开始统一采用：`Release Bundle 驱动开发流程`
- 核心原则：
  - 任一时刻只允许 `1 条业务主线 + 1 条稳态主线`
  - 上线只认：`Git -> 镜像 -> ACR -> K8s -> 验收 -> 留证 -> 可回滚`
  - 禁止直接 SSH 上生产改源码
  - 禁止容器内手改代码
  - 没有验收证据，不算完成
  - 没有回滚口径，不得上线

## 5. 未来 14 天推进方向

- 先稳生产，再收收入主链，最后做平台化。
- 第一周：
  - `acr-regcred` 自动刷新
  - 发布前检查脚本
  - 阿里云余额 / SLB 锁定告警
  - 唯一业务主线确认
- 第二周：
  - 只推进 1 条真实业务主链闭环
  - 推荐优先：`POS / Checkout / 支付 / 退款`
- 禁止多线平推，禁止新模块插队。

## 6. 本周任务板

- 唯一业务主线：`POS / Checkout / 支付 / 退款`
- 唯一稳态主线：`acr-regcred 自动刷新 + 发布前检查`
- 本周目标：
  - 把生产稳态做成制度
  - 把唯一交易主链做成可演示、可验收、可回滚

## 7. 后续执行硬规则

- 所有生产口径统一以 `sportsant.net` 为准。
- 不得回到：
  - `.m5.local`
  - `m5-platform.com`
  - 旧 TLS / 旧 Ingress / 旧 Config 口径
- 所有任务必须按四层拆分：
  - 代码层
  - 配置层
  - 验收层
  - 回滚层

## 8. 当前权威文件

- `infra/k8s/rendered-cert-manager/m5-ingress-public.yaml`
- `infra/k8s/rendered-cert-manager/m5-config-public.yaml`
- `scripts/verify-m5-tls-secret.sh`
- `scripts/verify-prod-public-endpoints.sh`
- `TASKS_STATUS.md`
- `WEEKLY-RYG-STATUS-BOARD.md`

## 9. 给龙虾哥的一句话执行令

- 从现在起，神机营只按标准流程推进：先稳生产，再收唯一主链，不再多线乱战。
