# M5 Platform V17+V18 生产部署指南

> **版本**: v1.0.0  
> **更新日期**: 2026-07-16  
> **适用范围**: V17 + V18 全模块生产部署  
> **维护者**: 树哥 (Trae Assistant)  
> **审核人**: 大飞哥

---

## 1. 部署概述

### 1.1 部署目标

| 目标项 | 描述 |
|--------|------|
| **全量模块** | V17 (7模块) + V18 (6模块) = 13个核心模块 |
| **部署环境** | 阿里云 ACK 生产集群 |
| **预期RTO** | < 30分钟 (恢复时间目标) |
| **预期RPO** | < 5分钟 (恢复点目标) |

### 1.2 部署模块清单

#### V17 核心模块 (已验证)

| 模块ID | 模块名称 | 部署优先级 | 依赖模块 | 状态 |
|--------|----------|------------|----------|------|
| P-53 | 基础设施 | P0 | 无 | ✅ 就绪 |
| P-31 | 多租户架构 | P0 | P-53 | ✅ 就绪 |
| P-30 | 物流模块 | P1 | P-31 | ✅ 就绪 |
| P-48 | 营销券系统 | P1 | P-31 | ✅ 就绪 |
| P-49 | SEO/GEO系统 | P2 | P-31 | ✅ 就绪 |
| P-54 | 自动化测试 | P2 | P-30, P-48 | ✅ 就绪 |
| P-55 | 性能优化 | P2 | 所有模块 | ✅ 就绪 |

#### V18 数据智能模块 (待验证)

| 模块ID | 模块名称 | 部署优先级 | 依赖模块 | 状态 |
|--------|----------|------------|----------|------|
| P-60 | 数据智能与BI | P1 | P-31 | ⏳ 待部署验证 |
| P-61 | 用户画像中心 | P1 | P-60 | ⏳ 待部署验证 |
| P-62 | 预测分析引擎 | P2 | P-60 | ⏳ 待部署验证 |
| P-63 | 数据治理平台 | P2 | P-60 | ⏳ 待部署验证 |
| P-64 | 数据API网关 | P1 | P-31 | ⏳ 待部署验证 |
| P-65 | 数据可视化平台 | P2 | P-64 | ⏳ 待部署验证 |

---

## 2. 环境要求

### 2.1 阿里云资源规格

| 资源类型 | 规格建议 | 数量 | 用途 |
|----------|----------|------|------|
| ACK 集群 | 标准版 | 1 | Kubernetes 集群 |
| Worker 节点 | ecs.c7.2xlarge (8C16G) | 6 | 应用部署 |
| RDS PostgreSQL | rds.pg.c2.2xlarge | 1 | 主数据库 |
| RDS 只读实例 | rds.pg.c1.xlarge | 2 | 读扩展 |
| Redis | redis.shard.small.2 | 1 | 缓存/会话 |
| OSS | 标准存储 | - | 静态资源/备份 |
| SLB | 性能容量型 | 2 | 入口负载均衡 |
| NAT 网关 | 小型 | 1 | 出站流量 |

### 2.2 依赖中间件

| 中间件 | 版本 | 部署方式 | 用途 |
|--------|------|----------|------|
| RabbitMQ | 3.12+ | ACK 部署 | 消息队列 |
| Elasticsearch | 8.11+ | ACK 部署 | 搜索引擎 |
| ClickHouse | 23.8+ | ACK 部署 | 实时数仓 |
| Prometheus | 2.48+ | ACK 部署 | 监控采集 |
| Grafana | 10.2+ | ACK 部署 | 监控展示 |
| Loki | 2.9+ | ACK 部署 | 日志聚合 |
| Jaeger | 1.50+ | ACK 部署 | 链路追踪 |

---

## 3. 部署前检查清单

### 3.1 基础设施检查

| 检查项 | 检查命令 | 期望结果 |
|--------|----------|----------|
| ACK 集群状态 | `kubectl cluster-info` | Kubernetes master 正常运行 |
| 节点状态 | `kubectl get nodes` | 所有节点 Ready |
| 存储类 | `kubectl get sc` | 默认 SC 可用 |
| Ingress 控制器 | `kubectl get svc -n ingress-nginx` | LoadBalancer 有 EXTERNAL-IP |

### 3.2 数据库检查

| 检查项 | 检查命令 | 期望结果 |
|--------|----------|----------|
| RDS 连通性 | `psql -h $DB_HOST -U $DB_USER -c "SELECT 1"` | 返回 1 |
| 主从同步 | `psql -c "SELECT pg_is_in_recovery()"` | 主库 false, 从库 true |
| 扩展安装 | `psql -c "SELECT * FROM pg_extension"` | postgis, uuid-ossp 等已安装 |
| 连接池 | `psql -c "SELECT count(*) FROM pg_stat_activity"` | < max_connections * 0.8 |

### 3.3 缓存检查

| 检查项 | 检查命令 | 期望结果 |
|--------|----------|----------|
| Redis 连通性 | `redis-cli -h $REDIS_HOST ping` | 返回 PONG |
| 集群状态 | `redis-cli cluster info` | cluster_state:ok |
| 内存使用 | `redis-cli info memory` | used_memory < maxmemory * 0.8 |

### 3.4 消息队列检查

| 检查项 | 检查命令 | 期望结果 |
|--------|----------|----------|
| RabbitMQ 状态 | `rabbitmqctl status` | 无告警 |
| 集群状态 | `rabbitmqctl cluster_status` | 所有节点 running |
| 队列积压 | RabbitMQ Management UI | 无队列 > 10000 消息 |

---

## 4. 部署流程

### 4.1 部署顺序

```
Phase 1: 基础设施 (P-53)
├── 1.1 创建命名空间
├── 1.2 部署监控栈 (Prometheus/Grafana/Loki)
├── 1.3 部署日志聚合
└── 1.4 验证基础设施

Phase 2: 基础服务 (P-31)
├── 2.1 执行数据库迁移
├── 2.2 部署配置中心
├── 2.3 部署租户管理服务
└── 2.4 验证多租户隔离

Phase 3: 核心业务 (P-30, P-48)
├── 3.1 部署物流模块
├── 3.2 部署营销券系统
├── 3.3 验证业务流
└── 3.4 执行集成测试

Phase 4: 增值服务 (P-49, P-54, P-55)
├── 4.1 部署SEO/GEO系统
├── 4.2 部署自动化测试
├── 4.3 配置性能优化
└── 4.4 验证非功能需求

Phase 5: 数据智能 (P-60~P-65)
├── 5.1 部署实时数仓
├── 5.2 部署BI服务
├── 5.3 部署用户画像
├── 5.4 部署预测分析
├── 5.5 部署数据治理
├── 5.6 部署API网关
├── 5.7 部署可视化平台
└── 5.8 验证数据链路
```

### 4.2 部署命令

#### Step 1: 环境准备

```bash
# 设置环境变量
export ENVIRONMENT=production
export NAMESPACE=m5-platform
export VERSION=v17-v18

# 创建命名空间
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# 配置镜像拉取密钥
kubectl create secret docker-registry aliyun-registry-secret \
  --docker-server=registry.cn-hangzhou.aliyuncs.com \
  --docker-username=$ALIYUN_USERNAME \
  --docker-password=$ALIYUN_PASSWORD \
  -n $NAMESPACE
```

#### Step 2: 数据库迁移

```bash
# 执行 Prisma 迁移
pnpm prisma:migrate:deploy

# 验证迁移状态
pnpm prisma:migrate:status

# 生成 Prisma Client
pnpm prisma:generate
```

#### Step 3: 应用部署

```bash
# 使用 Helm 部署 (推荐)
helm upgrade --install m5-platform ./helm-chart \
  --namespace $NAMESPACE \
  --values values-production.yaml \
  --set image.tag=$VERSION \
  --wait --timeout 10m

# 或使用 kubectl 直接部署
kubectl apply -k ./kustomize/overlays/production
```

#### Step 4: 验证部署

```bash
# 检查 Pod 状态
kubectl get pods -n $NAMESPACE

# 检查服务状态
kubectl get svc -n $NAMESPACE

# 检查 Ingress
kubectl get ingress -n $NAMESPACE

# 执行健康检查
curl https://api.m5-platform.com/health
```

---

## 5. 回滚策略

### 5.1 自动回滚触发条件

| 条件 | 阈值 | 动作 |
|------|------|------|
| 错误率 | > 5% | 触发告警 |
| 错误率 | > 10% | 自动回滚 |
| P95 延迟 | > 500ms | 触发告警 |
| P95 延迟 | > 1s | 自动回滚 |
| 健康检查失败 | 连续 3 次 | 自动回滚 |

### 5.2 回滚命令

```bash
# Helm 回滚
helm rollback m5-platform [REVISION] -n $NAMESPACE

# 查看历史版本
helm history m5-platform -n $NAMESPACE

# Kubernetes 原生回滚
kubectl rollout undo deployment/[DEPLOYMENT_NAME] -n $NAMESPACE

# 查看回滚状态
kubectl rollout status deployment/[DEPLOYMENT_NAME] -n $NAMESPACE
```

---

## 6. 监控与告警

### 6.1 监控大盘

| 大盘名称 | URL | 用途 |
|----------|-----|------|
| 基础设施监控 | https://grafana.m5-platform.com/d/infrastructure | 节点/容器资源 |
| 应用性能监控 | https://grafana.m5-platform.com/d/apm | APM 黄金指标 |
| 业务指标监控 | https://grafana.m5-platform.com/d/business | 业务 KPI |
| 日志分析 | https://grafana.m5-platform.com/d/logs | Loki 日志聚合 |
| 链路追踪 | https://jaeger.m5-platform.com | 分布式追踪 |

### 6.2 关键告警规则

| 告警名称 | 条件 | 级别 | 通知渠道 |
|----------|------|------|----------|
| 服务不可用 | 错误率 > 10% | P0 | 电话 + 短信 + 钉钉 |
| 高延迟告警 | P95 > 500ms | P1 | 短信 + 钉钉 |
| 资源不足 | CPU/Mem > 80% | P1 | 钉钉 |
| 数据库慢查询 | > 1s | P2 | 钉钉 |
| 缓存命中率低 | < 90% | P2 | 钉钉 |

---

## 7. 附录

### 7.1 环境变量清单

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `production` |
| `DATABASE_URL` | 数据库连接串 | `postgresql://...` |
| `REDIS_URL` | Redis连接串 | `redis://...` |
| `JWT_SECRET` | JWT密钥 | `[加密]` |
| `ALIYUN_ACCESS_KEY` | 阿里云AK | `[加密]` |
| `SENTRY_DSN` | 错误追踪 | `https://...` |

### 7.2 部署检查清单

- [ ] 基础设施检查通过
- [ ] 数据库迁移执行成功
- [ ] 配置中心和密钥管理就绪
- [ ] 核心服务健康检查通过
- [ ] 集成测试全部通过
- [ ] 监控告警配置完成
- [ ] 回滚方案验证通过
- [ ] 业务验收测试通过

---

**文档生成时间**: 2026-07-16  
**维护者**: 树哥 (Trae Assistant)  
**审核状态**: 待大飞哥确认
