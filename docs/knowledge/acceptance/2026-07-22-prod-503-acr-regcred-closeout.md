# 2026-07-22 Production 503 ACR Regcred Closeout

## 背景

- 事故对象:
  - `https://admin.sportsant.net/`
  - `https://store.sportsant.net/`
  - `https://tob.sportsant.net/`
  - `https://api.sportsant.net/api/v1/health/ping`
- 事故现象:
  - 4 个正式公网入口统一返回 `503 Service Temporarily Unavailable`
  - ACK `m5` namespace 下 `m5-api / m5-admin-web / m5-storefront-web / m5-tob-web` 全部掉为 `0/N`
  - 对应 Pod 统一出现 `ImagePullBackOff`
- 调试入口:
  - [debug-prod-503-gateway.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/debug-prod-503-gateway.md)
- 使用恢复脚本:
  - [refresh-acr-regcred.sh](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/scripts/refresh-acr-regcred.sh)

## 影响范围

- 对外影响:
  - `admin/store/tob/api.sportsant.net` 全量不可用
  - 公网请求统一命中网关 `503`
- 集群影响:
  - `m5` namespace 的 4 个核心业务 Deployment 统一无法拉取 ACR 私有镜像
- 业务判断:
  - 本次属于生产主链中断事故

## 根因结论

- 第一层根因:
  - `m5/acr-regcred` 失效，导致 ACK 无法从 ACR 拉取私有镜像
- 第二层根因:
  - 固定密码路径下，Docker 登录用户名一度错误写成阿里云数字 `userId`
  - ACR 实际要求使用阿里云账户全名邮箱作为 Docker 登录用户名
- 直接结果:
  - 新 Pod 拉镜像时报 `insufficient_scope: authorization failed`
  - 随后出现 `ErrImagePull` 和 `ImagePullBackOff`
  - 旧 Pod 淘汰后，公网入口统一退化为 `503`

## 排查与修复动作

### 1. 现场确认

- 确认正式 namespace 为 `m5`
- 确认 4 个目标 Deployment:
  - `m5-api`
  - `m5-admin-web`
  - `m5-storefront-web`
  - `m5-tob-web`
- 确认 ACR 实例 `shenjiying88acr20260717` 存在且运行中
- 确认 4 个私有仓库存在且正常
- 确认 Deployment 统一依赖 `imagePullSecrets: acr-regcred`

### 2. 临时恢复

- 在 ACR 控制台生成临时密码
- 用临时凭证刷新 `m5/acr-regcred`
- 重启 4 个正式 Deployment
- 新 Pod 成功拉镜像并恢复 `Running`
- 4 个公网域名恢复可访问

说明:

- 该步骤完成了短时止血
- 但临时凭证存在过期时间，不满足稳态要求

### 3. 固化恢复

- 用户完成阿里云安全校验后，转入固定密码方案
- 在 ACR 控制台设置固定密码
- 首轮固定密码切换失败，事件明确报:
  - `insufficient_scope: authorization failed`
- 继续核对 ACR 登录身份后确认:
  - Docker 登录用户名必须使用阿里云账户全名邮箱
  - 不能使用数字 `userId`
- 仅修正 `m5/acr-regcred` 中的 `username`
- 保持固定密码不变，再次对 4 个 Deployment 做最小重启
- 新 Pod 拉镜像成功并进入 `Running`

## 运行证据

### 1. Secret 证据

- `m5` namespace 内 `acr-regcred` 存在
- 类型为 `kubernetes.io/dockerconfigjson`
- 已切换为固定密码方案

### 2. 拉镜像证据

4 个目标服务的新 Pod 均出现完整成功链路:

- `Pulling image`
- `Successfully pulled image`
- `Created container`
- `Started container`

关键新 Pod:

- `m5-api-77ff9b97b7-hcp8s`
- `m5-admin-web-5f84fbc548-7f964`
- `m5-admin-web-5f84fbc548-bbcvl`
- `m5-storefront-web-54d8bf5876-4z9qg`
- `m5-storefront-web-54d8bf5876-j659g`
- `m5-tob-web-7778fb8756-48cq7`

### 3. Pod 状态证据

- 当前未再观察到新的:
  - `ImagePullBackOff`
  - `ErrImagePull`
  - `insufficient_scope`
- 4 个目标 Deployment 已恢复到正常滚更状态

### 4. 公网复核证据

- `https://admin.sportsant.net/`
  - 返回管理后台首页
- `https://store.sportsant.net/`
  - 返回 Storefront 首页
- `https://tob.sportsant.net/`
  - 返回 ToB Admin 页面
- `https://api.sportsant.net/api/v1/health/ping`
  - 返回 `success: true`

## 配置层结论

- 正确口径:
  - ACR 拉取地址使用生产 Deployment 当前引用的 registry
  - `acr-regcred` 必须落在 `m5` namespace
  - Docker 登录用户名必须使用阿里云账户全名邮箱
  - 不得把阿里云数字 `userId` 当作 Docker 登录用户名
- 恢复入口:
  - 优先使用 [refresh-acr-regcred.sh](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/scripts/refresh-acr-regcred.sh)
  - 在脚本执行前确保输入的是正确的 ACR 登录身份

## 回滚口径

- 本次修复未改业务代码，属于生产 Secret 与滚更修复
- 若未来固定密码再次异常，可采用以下受控回滚口径:

1. 重新在 ACR 控制台生成临时密码
2. 刷新 `m5/acr-regcred`
3. 最小重启 `m5-api / m5-admin-web / m5-storefront-web / m5-tob-web`
4. 复核 Pod 事件与 4 个公网域名

- 不允许:
  - 直接 SSH 上生产改源码
  - 在容器内手工写凭据
  - 绕过 `m5` namespace 直接操作其他命名空间

## 防呆与制度化动作

- 发布前检查必须新增:
  - `acr-regcred` 是否存在
  - `acr-regcred` 所属 namespace 是否为 `m5`
  - ACR 登录用户名是否为阿里云账户全名邮箱
  - 新 Pod 是否能成功 `pull image`
- 运维文档必须明确:
  - ACR Docker 登录身份与阿里云数字 `userId` 不是同一概念
- 生产稳态主线继续保持:
  - `acr-regcred` 自动刷新
  - 发布前检查
  - 公网 4 域名验收

## 最终结论

- 本次事故已收口
- 四个正式公网入口已恢复
- `m5` namespace 下 4 个核心 Deployment 已恢复到可持续滚更状态
- 根因不是应用代码、不是 DNS、不是 Ingress，而是 `acr-regcred` 的 ACR 鉴权身份错误
- 本次修复完成后，生产链路重新回到:
  - `Git -> 镜像 -> ACR -> K8s -> 验收 -> 留证 -> 可回滚`
