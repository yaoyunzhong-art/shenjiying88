# V22 回滚基线

> 生成时间: 2026-07-20 01:05 CST
> 用途: 每次发布前固定当前稳态, 出问题 5-15 分钟内回到此基线

## 环境概览

| 项目 | 值 |
|------|-----|
| K8s 集群 | ACK (cn-hangzhou) |
| Namespace | `m5` |
| 正式域名 | `*.sportsant.net` |
| 镜像仓库 (当前运行) | `shenjiying88acr20260717-registry.cn-hangzhou.cr.aliyuncs.com/shenjiying88` |
| 镜像仓库 (原) | `registry-intl.cn-hongkong.aliyuncs.com/shenjiying88` |
| ConfigMap | `m5-config` (37 个配置项) |
| Secrets | `m5-secrets` |

## 节点

| IP | 状态 | 版本 |
|----|------|------|
| cn-hangzhou.10.0.1.34 | Ready | v1.34.3-aliyun.1 |
| cn-hangzhou.10.0.1.35 | Ready | v1.34.3-aliyun.1 |
| cn-hangzhou.10.0.2.103 | Ready | v1.34.3-aliyun.1 |
| cn-hangzhou.10.0.2.104 | Ready | v1.34.3-aliyun.1 |

## 当前 Deployment 状态

| Deployment | Revision | Replicas | 镜像 (sha256 digest) |
|-----------|----------|----------|----------------------|
| m5-api | **24** | 1 | `shenjiying88acr20260717-registry.cn-hangzhou.cr.aliyuncs.com/shenjiying88/m5-api@sha256:bffffe15e2333e92e72a812bfeeb127f564944f1f3463631118d867d23da7ad3` |
| m5-admin-web | **9** | 2 | `shenjiying88acr20260717-registry.cn-hangzhou.cr.aliyuncs.com/shenjiying88/m5-admin-web@sha256:d0a2fcfd9349da5009da6638d5d9c956aff4fa5123d1de77c33ccad49e37c401` |
| m5-storefront-web | **9** | 2 | `shenjiying88acr20260717-registry.cn-hangzhou.cr.aliyuncs.com/shenjiying88/m5-storefront-web@sha256:9e2c75c3f0afb24e55d453b1173cb3ad2a396e4f114cb14918241dbeeb0d1872` |
| m5-tob-web | **9** | 1 | `shenjiying88acr20260717-registry.cn-hangzhou.cr.aliyuncs.com/shenjiying88/m5-tob-web@sha256:a793182fbc1b6cbd12a6232e9289567488cdfed65e858a07261193d5f67b07a4` |

> **注意**: 实际运行镜像已从 `registry-intl.cn-hongkong.aliyuncs.com` 迁移到 `shenjiying88acr20260717-registry.cn-hangzhou.cr.aliyuncs.com` (国内 ACR, 2026-07-17 创建)。`last-applied-configuration` 中仍是 `ghcr.io/shenjiying88/...:latest`, 但已被直接更新覆盖。

## Rollout History

### m5-api
24 个 revision: 12, 13, 16 ~ 24 (当前 revision=24)

### m5-admin-web
9 个 revision: 1 ~ 9 (当前 revision=9)

### m5-storefront-web
9 个 revision: 1 ~ 9 (当前 revision=9)

### m5-tob-web
9 个 revision: 1 ~ 9 (当前 revision=9)

所有 revision 的 CHANGE-CAUSE 均未设置 (`<none>`), 因此回滚时需要通过 revision 号来定位。

## 回滚命令

### 场景 A: 快速回滚 (全员回退到上一版本)
```bash
export KUBECONFIG="$HOME/.kube/m5-prod-config"
kubectl --kubeconfig=$KUBECONFIG rollout undo deployment/m5-api -n m5
kubectl --kubeconfig=$KUBECONFIG rollout undo deployment/m5-admin-web -n m5
kubectl --kubeconfig=$KUBECONFIG rollout undo deployment/m5-storefront-web -n m5
kubectl --kubeconfig=$KUBECONFIG rollout undo deployment/m5-tob-web -n m5
```

### 场景 B: 回滚到指定 Revision
```bash
# m5-api 回滚到 revision 23 (当前 24, 退 1)
kubectl --kubeconfig=$KUBECONFIG rollout undo deployment/m5-api -n m5 --to-revision=23

# 全部回滚到 revision 8 (当前 9, 退 1)
kubectl --kubeconfig=$KUBECONFIG rollout undo deployment/m5-admin-web -n m5 --to-revision=8
kubectl --kubeconfig=$KUBECONFIG rollout undo deployment/m5-storefront-web -n m5 --to-revision=8
kubectl --kubeconfig=$KUBECONFIG rollout undo deployment/m5-tob-web -n m5 --to-revision=8
```

### 场景 C: 脚本化回滚
```bash
export KUBECONFIG="$HOME/.kube/m5-prod-config"
for D in m5-api m5-admin-web m5-storefront-web m5-tob-web; do
  echo "→ 回滚 $D..."
  kubectl --kubeconfig=$KUBECONFIG rollout undo deployment/$D -n m5
done
echo "→ 等待所有服务就绪..."
kubectl --kubeconfig=$KUBECONFIG rollout status deployment -n m5 --timeout=120s
```

### 场景 D: 应急 — rollout history 不可用时直接 set image
```bash
# 手动指定旧镜像 digest (从本文件上方 "当前 Deployment 状态" 表中获取)
kubectl --kubeconfig=$KUBECONFIG set image deployment/m5-api -n m5 \
  api=shenjiying88acr20260717-registry.cn-hangzhou.cr.aliyuncs.com/shenjiying88/m5-api@sha256:bffffe15e2333e92e72a812bfeeb127f564944f1f3463631118d867d23da7ad3
```

## 回滚后验证

```bash
# 1. Pod 状态
kubectl --kubeconfig=$KUBECONFIG get pods -n m5

# 2. API 健康检查
curl -s -o /dev/null -w "%{http_code}" https://api.sportsant.net/api/v1/health/ping

# 3. 前端页面
curl -s -o /dev/null -w "%{http_code}" https://admin.sportsant.net/
curl -s -o /dev/null -w "%{http_code}" https://store.sportsant.net/
curl -s -o /dev/null -w "%{http_code}" https://tob.sportsant.net/
```

## ConfigMap 摘要 (m5-config)

| Key | Value |
|-----|-------|
| NODE_ENV | production |
| LOG_LEVEL | info |
| NEXT_PUBLIC_API_URL | https://api.sportsant.net/api/v1 |
| NEXT_PUBLIC_WS_URL | wss://api.sportsant.net |
| CORS_ORIGIN | https://admin.sportsant.net,https://store.sportsant.net,https://tob.sportsant.net |
| LLM_DEFAULT_PROVIDER | deepseek |
| LLM_DEEPSEEK_BASE_URL | https://api.deepseek.com/v1 |
| LLM_DEEPSEEK_MODEL | deepseek-chat |
| LLM_FALLBACK_CHAIN | deepseek,openai,claude |
| DATABASE_URL | REUSE_CURRENT_VALUE (Secret) |
| POSTGRES_HOST | pgm-bp1dp000v7y96z50.pg.rds.aliyuncs.com |
| REDIS_HOST | r-bp1db6d2422ff374.redis.rds.aliyuncs.com |
| RABBITMQ_HOST | m5-rabbitmq |
| MINIO_ENDPOINT | m5-minio |
| QDRANT_HOST | m5-qdrant |

## 首次部署信息 (ACR 迁移记录)

- 之前仓库: `registry-intl.cn-hongkong.aliyuncs.com/shenjiying88`
- 当前仓库: `shenjiying88acr20260717-registry.cn-hangzhou.cr.aliyuncs.com/shenjiying88`
- 迁移时间: 2026-07-16 ~ 2026-07-17
- 之前 pull secret: `ghcr-pull-secret` (仍在 last-applied-configuration 中)
- 当前 pull secret: 新 ACR 对应的 `aliyun-docker-regcred` (于 2026-07-17 部署后切换, 参见 `scripts/refresh-acr-regcred.sh` / `scripts/check-acr-regcred-expiry.sh`)

## 回滚流程清单

1. **确认问题** → 5xx / 业务异常 / 监控告警
2. **打开脚本** → `bash scripts/rollback-guide.sh`
3. **执行回滚** → 选择场景 A/B/C 复制命令执行
4. **验证** → 检查 Pod 状态 + 健康检查 endpoint
5. **通报** → 记录回滚原因和耗时

## 相关文件

- `scripts/rollback-guide.sh` — 可执行回滚指南脚本
- `scripts/rollback-prod-public-cutover.sh` — 生产公开域名切换回滚
- `scripts/rollback-prod-db-bootstrap-draft.sh` — 数据库初始化回滚
- `scripts/preflight-k8s-release.sh` — 发布前检查脚本
- `scripts/pre-release-check.sh` — 预发布检查
