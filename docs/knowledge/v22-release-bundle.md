# V22 Release Bundle 发布包

> 生成日期: 2026-07-20 01:36
> 周期: V22 MVP 交付
> 状态: 📋 预发布文档 · 准备就绪

---

## 1. 镜像清单

| 服务 | 镜像 | Dockerfile | 构建状态 |
|:-----|:-----|:-----------|:--------:|
| API | `m5-api:latest` | `apps/api/Dockerfile` | ✅ 已通过 |
| Admin-web | `m5-admin-web:latest` | `apps/admin-web/Dockerfile` | ✅ 已通过 |
| Storefront-web | `m5-storefront-web:latest` | `apps/storefront-web/Dockerfile` | ✅ 已通过 |
| Tob-web | `m5-tob-web:latest` | `apps/tob-web/Dockerfile` | ✅ 已通过 |
| Nginx | `m5-nginx:latest` | `nginx/Dockerfile` | ✅ 已通过 |

## 2. 发布前检查清单

> 参考: `scripts/pre-release-check.sh`

| # | 检查项 | 本地 | 生产 |
|:-:|:-------|:----:|:----:|
| 0 | 生产命名空间 = `m5` | N/A | 🔴 |
| 1 | Ingress 配置 | N/A | 🔴 |
| 2 | TLS Secret (m5-tls) | N/A | 🔴 |
| 3 | ConfigMap (m5-config) | N/A | 🔴 |
| 4 | Deployment 镜像版本 | ✅ | 🔴 |
| 5 | Pod 状态 | ✅ | 🔴 |
| 6 | API Health | ✅ | 🔴 |
| 7 | `acr-regcred` 存在且位于 `m5` | N/A | 🔴 |
| 8 | Web 首屏 | ✅ | 🔴 |
| 9 | 阿里云余额 | N/A | 🔴 |
| 10 | ACR 登录用户名为阿里云账户全名邮箱 | N/A | 🔴 |

> N/A = 本地非生产环境不适用 · 🔴 = 需发布时在生产环境验证
>
> 新增硬门槛:
> - 正式发布只允许 `namespace=m5`
> - `acr-regcred.username` 不得是数字 `userId`
> - `acr-regcred.username` 不得是 `cr_temp_user`
> - 正式发布必须使用阿里云账户全名邮箱作为 ACR Docker 登录用户名

## 3. 变更清单

### 后端新增模块
| 模块 | 文件 | 路由 |
|:-----|:-----|:-----|
| Categories | `apps/api/src/modules/categories/` | `GET /api/v1/categories` |
| Team Building | `apps/api/src/modules/team-building/` | `GET /api/v1/team-building` |

### 后端增强模块
| 模块 | 变更 | 说明 |
|:-----|:-----|:-----|
| Cashier | Seed数据 + 去Mock | `lookupProduct()` 无mock回落 · `getChannelStats()` 真数据 |
| PaymentGateway | TenantGuard 添加 | IAM 跨租户保护 |
| Orders page | SDK 真实 API 调用 | admin-web `stores/[id]/orders` |

### 基础设施新增
| 类型 | 文件 | 说明 |
|:-----|:-----|:-----|
| Script | `scripts/refresh-acr-regcred.sh` | ACR 令牌自动刷新 |
| Script | `scripts/check-acr-regcred-expiry.sh` | ACR 过期告警 |
| Script | `scripts/pre-release-check.sh` | 发布前 11 项检查，含 `m5/acr-regcred` 与 ACR 用户名防呆 |
| Script | `scripts/rollback-guide.sh` | 生产回滚全流程 |
| Script | `scripts/check-aliyun-billing.sh` | 阿里云余额告警 |
| Script | `scripts/cron-billing-check.sh` | 定时余额检查 |
| Script | `scripts/check-amount-alignment.sh` | 金额口径一致性 |
| Script | `scripts/check-permissions.sh` | 权限链审计 |
| E2E | `apps/admin-web/app/__e2e__/pos-checkout-journey.test.ts` | POS 3场景 |

### 文档新增
| 文档 | 说明 |
|:-----|:-----|
| `docs/knowledge/v22-trade-chain-scope.md` | 35接口主链冻结 |
| `docs/knowledge/v22-api-chain-verification.md` | 28接口真链路 |
| `docs/knowledge/v22-amount-chain-alignment.md` | 金额一致性 |
| `docs/knowledge/v22-fps-page-audit.md` | 543页首屏审计 |
| `docs/knowledge/v22-build-prod-audit.md` | 三端构建口径 |
| `docs/knowledge/v22-rollback-baseline.md` | 回滚基线 |
| `docs/knowledge/v22-pos-e2e-verification.md` | POS E2E验收 |
| `docs/knowledge/v22-release-bundle.md` | 本发布包 |

## 4. 回滚方案

参照 `scripts/rollback-guide.sh`:

```bash
export KUBECONFIG="$HOME/.kube/m5-prod-config"
bash scripts/rollback-guide.sh
```

回滚基线: 当前 `main` 分支 HEAD
镜像仓库: `shenjiying88acr20260717-registry.cn-hangzhou.cr.aliyuncs.com`
Namespace: `m5`

## 5. 未完成

| # | 任务 | 状态 | 说明 |
|:-:|:-----|:----:|:-----|
| 1 | 生产 Ingress 更新 | 🔴 | 需在 K8s 上 apply |
| 2 | 生产 ConfigMap 更新 | 🔴 | 需在 K8s 上 apply |
| 3 | ACR 令牌存入 K8s Secret | 🔴 | `refresh-acr-regcred.sh` 准备就绪 |
| 4 | GitHub Actions CI 触发 | 🔴 | 手动/自动 |
| 5 | `rollback-guide.sh` 镜像仓库修正 | 🔴 | 旧 `registry-intl.cn-hongkong` → 新 ACR |

## 6. 发布命令（准备就绪）

```bash
# 1. ACR 登录
bash scripts/refresh-acr-regcred.sh

# 2. docker compose build (已通过)
docker compose build --parallel

# 3. 推送镜像到 ACR（结合 infra/k8s/）
docker tag m5-api:latest shenjiying88acr20260717-registry.cn-hangzhou.cr.aliyuncs.com/shenjiying88/m5-api:latest

# 4. 发布前检查
NAMESPACE=m5 bash scripts/pre-release-check.sh

# 5. 更新 K8s 部署
kubectl --kubeconfig="$KUBECONFIG" apply -f infra/k8s/rendered-public-preflight/

# 6. 验证
curl https://api.sportsant.net/api/v1/health/ping

# 7. 如有问题
bash scripts/rollback-guide.sh
```
