# 监控体系文档

## 概览

M5 平台采用 Prometheus + Grafana + Loki + AlertManager 四件套构建完整的可观测性体系。覆盖**指标监控**（Metrics）、**日志收集**（Logging）、**告警通知**（Alerting）三大支柱，为生产环境提供实时的系统健康观测与故障响应能力。

## 核心概念

### 监控栈架构

```text
┌──────────────────────────────────────────────────────────────────────┐
│                          Grafana (UI)                                 │
│                     http://localhost:3005                             │
│                 统一仪表盘 · 数据源聚合 · 告警管理                      │
└────────┬──────────────┬───────────────────┬──────────────────────────┘
         │              │                   │
         ▼              ▼                   ▼
┌──────────────┐ ┌──────────┐ ┌──────────────────────┐
│  Prometheus   │ │   Loki   │ │    Tempo (预留)       │
│  指标存储     │ │ 日志存储  │ │    分布式追踪          │
│  :9090       │ │ :3100    │ │    :3200             │
└──────┬───────┘ └────┬─────┘ └──────────────────────┘
       │              │
       ▼              ▼
┌──────────┐  ┌─────────────┐
│ Promtail │  │ Node/cAdvisor │
│ 日志采集 │  │  主机/容器指标 │
└──────────┘  └─────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                     AlertManager                                 │
│                    http://localhost:9093                          │
│    告警去重 · 分组 · 静默 · 路由 · 通知                           │
└───────────┬──────────┬──────────┬──────────┬─────────────────────┘
            │          │          │          │
            ▼          ▼          ▼          ▼
      ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
      │ 邮件   │ │ Slack  │ │PagerDuty│ │ 企微    │
      │ SMTP   │ │Webhook │ │ API    │ │ 机器人  │
      └────────┘ └────────┘ └────────┘ └────────┘
```

### 组件说明

| 组件 | 镜像版本 | 端口 | 数据持久化 | 职责 |
|------|---------|------|-----------|------|
| **Prometheus** | `v2.53.0` | 9090 | `prometheus_data` | 指标采集、存储、告警规则评估 |
| **Grafana** | `11.0.0` | 3005 | `grafana_data` | 可视化仪表盘、告警管理、数据源代理 |
| **AlertManager** | `v0.27.0` | 9093 | `alertmanager_data` | 告警去重/分组/路由/通知 |
| **Loki** | `3.0.0` | 3100 | `loki_data` | 日志聚合存储（类 Prometheus 标签模型） |
| **Promtail** | `3.0.0` | 9080 | `promtail_positions` | 日志采集代理，收集 Docker 容器日志 |
| **Node Exporter** | `v1.8.1` | 9100 | 无 | 主机指标（CPU/内存/磁盘/网络） |
| **cAdvisor** | `v0.49.1` | 8080 | 无 | 容器运行时指标 |
| **Postgres Exporter** | `v0.15.0` | 9187 | 无 | PostgreSQL 性能指标 |
| **Redis Exporter** | `v1.62.0` | 9121 | 无 | Redis 性能指标 |

### 告警规则体系

告警规则按严重级别分为 `critical`（严重）和 `warning`（警告）两级，覆盖以下领域：

| 领域 | 告警示例 | 严重级别 | 触发条件 |
|------|---------|---------|---------|
| **API 服务** | `APIHighErrorRate` | critical | 5 分钟错误率 > 5% |
| | `APIHighLatency` | warning | P99 延迟 > 2s |
| | `APIDown` | critical | 服务不可达 |
| **数据库** | `DatabaseHighConnectionPoolUsage` | warning | 连接池使用率 > 80% |
| | `DatabaseSlowQueries` | warning | 平均查询时间 > 1000ms |
| **缓存** | `CacheLowHitRate` | warning | 命中率 < 50% |
| | `RedisDown` | critical | 服务宕机 |
| **消息队列** | `QueueHighDepth` | warning | 队列深度 > 10000 |
| | `RabbitMQDown` | critical | 服务宕机 |
| **基础设施** | `NodeHighCPUUsage` | warning | CPU > 80% |
| | `NodeHighMemoryUsage` | warning | 内存 > 85% |
| | `NodeHighDiskUsage` | critical | 磁盘 > 85% |
| | `NodeDown` | critical | 节点宕机 |

### SLO 指标

通过 Prometheus Recording Rules 预先计算的聚合指标（`m5:api:error_rate:5m`、`m5:api:latency:p99` 等），用于 SLO 跟踪和仪表盘渲染。

## 配置项

### 环境变量（.env）

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `GRAFANA_ADMIN_USER` | `admin` | Grafana 管理员用户名 |
| `GRAFANA_ADMIN_PASSWORD` | `admin` | Grafana 管理员密码（生产环境必须修改） |
| `PROMETHEUS_RETENTION_TIME` | `15d` | Prometheus 数据保留时间 |
| `PROMETHEUS_RETENTION_SIZE` | `10GB` | Prometheus 数据保留大小 |
| `ALERTMANAGER_RETENTION` | `120h` | AlertManager 数据保留时间 |
| `SMTP_HOST` | `smtp.example.com` | 邮件告警 SMTP 服务器 |
| `SLACK_WEBHOOK_URL` | — | Slack 告警 Webhook |
| `PAGERDUTY_SERVICE_KEY` | — | PagerDuty 服务密钥 |

## 快速开始

### 启动监控栈

```bash
# 使用启动脚本（自动读取 .env）
cd infra/monitoring
cp .env.example .env    # 首次使用需复制配置
./scripts/start-monitoring.sh

# 或直接 docker compose
docker compose -f infra/monitoring/docker-compose.monitoring.yml up -d
```

### 访问服务

| 服务 | 地址 | 说明 |
|------|------|------|
| Grafana | `http://localhost:3005` | 仪表盘与告警管理 |
| Prometheus | `http://localhost:9090` | 指标查询与规则监控 |
| AlertManager | `http://localhost:9093` | 告警状态与静默管理 |
| Loki | `http://localhost:3100` | 日志查询 API |

### 停止监控栈

```bash
./scripts/stop-monitoring.sh

# 或
docker compose -f infra/monitoring/docker-compose.monitoring.yml down
```

### 查看告警状态

```bash
# Prometheus 告警规则状态
curl -s http://localhost:9090/api/v1/alerts | jq .

# AlertManager 当前活跃告警
curl -s http://localhost:9093/api/v2/alerts | jq .
```

### 数据清理

```bash
# 删除所有监控数据卷（⚠️ 不可逆）
docker compose -f infra/monitoring/docker-compose.monitoring.yml down -v
```

## FAQ

### Q1: 如何添加自定义告警？

编辑 `infra/monitoring/prometheus/rules/alerting_rules.yml`，在对应组中添加新的规则条目，然后通过 Prometheus API 热加载：`curl -X POST http://localhost:9090/-/reload`。

### Q2: 如何添加新的仪表盘？

将 JSON 仪表盘文件放入 `infra/monitoring/grafana/dashboards/` 目录，并在 `dashboards.yml` provisioning 配置中注册。Grafana 会在启动时自动加载。

### Q3: 告警通知渠道如何配置？

在 `infra/monitoring/.env` 中配置对应渠道的凭证（SMTP/Slack Webhook/PagerDuty Key/企业微信），AlertManager 会根据 `alertmanager.yml` 的 route 规则分发告警。

### Q4: 数据保留期太长导致磁盘满了怎么办？

调整 `.env` 中的 `PROMETHEUS_RETENTION_TIME` 和 `PROMETHEUS_RETENTION_SIZE`，然后重启 Prometheus。或手动清理 WAL：删除 `prometheus_data` 卷中的旧数据块。

### Q5: 日志采集不到怎么办？

确认 Promtail 有权限读取 Docker 容器的日志目录（`/var/lib/docker/containers`），检查 Promtail 的状态页 `http://localhost:9080/targets` 确认目标是否正常运行。
