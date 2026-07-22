# 2026-07-22 当前可发布结论卡

## 结论

- 当前结论: `可发布`
- 结论等级: `GREEN`
- 适用范围:
  - `admin.sportsant.net`
  - `store.sportsant.net`
  - `tob.sportsant.net`
  - `api.sportsant.net`
- 发布判断:
  - 生产核心服务已恢复稳态
  - 发布前门禁已全绿
  - 当前不存在阻断正式发布的 `FAIL` 或 `WARN`

## 结论摘要

- 今日已完成 `pre-release-check` 真机复跑
- 最终门禁结果为:
  - `PASS: 19`
  - `FAIL: 0`
  - `WARN: 0`
- 生产 `m5` namespace 内 4 个核心 Deployment 均处于可用状态:
  - `m5-api`
  - `m5-admin-web`
  - `m5-storefront-web`
  - `m5-tob-web`
- 正式公网 4 个入口均已通过可访问性复核
- `acr-regcred` 已完成固定密码方案闭环，且用户名口径已修正为阿里云账户全名邮箱

## 本次放行依据

### 1. 发布门禁结果

- 执行命令:

```bash
KUBECONFIG="$HOME/.kube/m5-prod-config" \
NAMESPACE=m5 \
EXPECTED_NAMESPACE=m5 \
ALIYUN_BALANCE_CNY=109.37 \
bash scripts/pre-release-check.sh
```

- 放行结果:
  - `19 PASS / 0 FAIL / 0 WARN`
- 门禁已覆盖的关键检查:
  - 生产命名空间必须为 `m5`
  - `m5-tls` 必须存在且证书有效
  - `m5-api / m5-admin-web / m5-storefront-web / m5-tob-web` 必须全部 Ready
  - `api/admin/store/tob.sportsant.net` 必须可访问
  - `acr-regcred` 必须存在于 `m5`
  - ACR Docker 登录用户名必须为阿里云账户全名邮箱
  - 阿里云账户余额必须高于告警线

### 2. 生产运行状态

- 当前核心服务 Ready:
  - `m5-api`
  - `m5-admin-web`
  - `m5-storefront-web`
  - `m5-tob-web`
- 当前未见新的:
  - `ImagePullBackOff`
  - `ErrImagePull`
  - `insufficient_scope`
- 当前公网入口复核结果:
  - `https://admin.sportsant.net/` 返回后台首页
  - `https://store.sportsant.net/` 返回 Storefront 首页
  - `https://tob.sportsant.net/` 返回 ToB Admin 页面
  - `https://api.sportsant.net/api/v1/health/ping` 返回 `success: true`

### 3. 证书与余额

- `m5-tls` 证书到期时间:
  - `Jan 19 23:59:59 2027 GMT`
- 阿里云账户可用余额:
  - `109.37 元`
- 当前判断:
  - 证书有效期充足
  - 余额高于 `100` 元告警线
  - 不构成当前发布阻断

## 风险边界

- 本结论卡仅说明:
  - 当前生产基础设施、镜像拉取、核心服务可用性、公网入口、证书与余额门禁均满足发布条件
- 本结论卡不等于:
  - 任何新业务改动已经自动完成回归验收
  - 所有外部依赖未来都不会波动
- 当前仍需保持的发布纪律:
  - 正式发布前必须重新执行一次 `scripts/pre-release-check.sh`
  - 若 `acr-regcred` 被重置，必须重新校验用户名是否为阿里云账户全名邮箱
  - 发布后仍需复核 `api/admin/store/tob` 四个正式入口

## 口径归档

- 当前推荐汇报口径:
  - `神机营 SaaS 当前生产主链已恢复稳态，发布前门禁 19 项全绿，满足正式发布条件。`
- 当前推荐执行口径:
  - `先跑 pre-release-check，全绿后再进入正式发布窗口。`

## 关联材料

- 事故结案卡: [2026-07-22-prod-503-acr-regcred-closeout.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-22-prod-503-acr-regcred-closeout.md)
- 正式窗口执行包: [2026-07-19-g8-formal-window-execution-package.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g8-formal-window-execution-package.md)
- 发布前检查脚本: [pre-release-check.sh](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/scripts/pre-release-check.sh)
- ACR 凭据刷新脚本: [refresh-acr-regcred.sh](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/scripts/refresh-acr-regcred.sh)
