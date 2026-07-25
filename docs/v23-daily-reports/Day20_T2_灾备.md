# Day20 T2: 灾备预案评审

> 扫描时间: 2026-07-26 01:45 CST
> 评审范围: 备份 / 恢复 / 监控告警 / 健康检查
> 结论: 🟡 基础完整，缺少异地存储和自动化恢复演练

---

## 一、备份能力 ✅

| 维度 | 状态 | 说明 |
|:-----|:----:|:-----|
| 数据库定时备份 | ✅ | `DatabaseBackupService` 每小时执行 `pg_dump \| gzip` |
| 备份保留策略 | ✅ | 保留最近 7 个，自动清理旧备份 |
| 备份状态 API | ✅ | `GET /health/backup` 返回 `BackupStatus` |
| 手动触发备份 | ✅ | `GET /health/backup/trigger` |
| 备份目录 | ✅ | `/tmp/m5-backups/`（可通过 `BACKUP_DIR` 环境变量配置） |
| PostgreSQL WAL 归档 | 🔴 缺失 | `archive_mode` 和 `archive_command` 未在 K8s StatefulSet 配置 |
| Qdrant 向量快照 | ✅ | `docker-compose.dev.yml` 挂载 `qdrant_snapshots` 卷 |
| 异地备份/对象存储 | 🔴 缺失 | 当前仅本地 `/tmp` 存储，无 OSS/S3 异地副本 |
| 备份加密 | 🔴 缺失 | `pg_dump` 输出未加密，DATABASE_URL 明文拼接 |

### 代码位置
- `apps/api/src/modules/health/database-backup.service.ts` — 数据库自动备份服务
- `apps/api/src/modules/health/health.controller.ts` — 备份状态与手动触发端点
- `docker-compose.yml` — PostgreSQL 持久卷 `m5_postgres_data`
- `docker-compose.dev.yml` — Qdrant 快照卷 `shenjiying_qdrant_snapshots`
- `infra/k8s/postgres-statefulset.yaml` — WAL 配置仅 `wal_level = replica`

---

## 二、恢复能力 ⚠️

| 维度 | 状态 | 说明 |
|:-----|:----:|:-----|
| 恢复计划定义 | ✅ | `ResilienceOperationsService` 定义 3 个 `RecoveryPlanRecord` |
| postgres-primary 恢复计划 | ✅ | RTO=30min, RPO=10min, lastDrill=2026-05-28 |
| edge-sync-pipeline 恢复 | ⚠️ | status=attention, lastDrill=2026-04-01（已过期） |
| observability-stack 恢复 | ✅ | RTO=15min, RPO=15min, lastDrill=2026-06-01 |
| 恢复计划 API | ✅ | `ResilienceOperationsController.describeRecoveryPlan` / `listRecoveryPlans` |
| pg_restore 自动化 | 🔴 缺失 | 无自动化恢复脚本，仅知识库文档提及 |
| PITR (时间点恢复) | 🔴 缺失 | 无 WAL 归档 → 无法做秒级精确恢复 |
| 灾备切换演练 | 🔴 缺失 | 仅静态定义，无自动化切换流程 |
| 恢复验证 | 🔴 缺失 | `kb-054` 强调"必须验证"但无代码实现 |

### 恢复计划详情

| 资源 | RTO | RPO | 状态 | 最后演练 | 过期 |
|:-----|:---:|:---:|:----:|:---------|:----:|
| postgres-primary | 30min | 10min | ready | 2026-05-28 | ⚠️ 59天前 |
| edge-sync-pipeline | 20min | 5min | attention | 2026-04-01 | 🔴 116天前 |
| observability-stack | 15min | 15min | ready | 2026-06-01 | ⚠️ 55天前 |

### 灾备知识库
- `docs/knowledge/expert-insights/kb-054-disaster-recovery.md` — 完整的 3-2-1 策略、PITR、演练流程文档

---

## 三、监控告警 ✅

| 维度 | 状态 | 说明 |
|:-----|:----:|:-----|
| 指标采集 (Prometheus) | ✅ | `observabilitySignals` 中 metrics=healthy, coverage=96% |
| 日志采集 (Loki) | ⚠️ | status=warning, coverage=88%, lag=92s |
| 链路追踪 (Tempo) | ⚠️ | status=warning, coverage=84%, lag=74s |
| 告警路由 (Alertmanager) | ✅ | routes: `alertmanager/platform-primary`, `ops-oncall-wecom` |
| 时间序列告警规则 | ✅ | `TimeSeriesService` 支持 `gt/lt/gte/lte/eq` 操作符 |
| Webhook 平台集成 | ✅ | 飞书、钉钉、企业微信 + `monitoring.alert.fired/resolved` 事件类型 |
| 健康仪表盘 | ✅ | `HealthDashboardModule` + `HealthScoreService` |
| Slack/PagerDuty | 🔴 缺失 | 无官方集成，仅 IM 平台 |
| AI 模型热重载健康检查 | ✅ | `HotReloadService.healthCheck` + 自动回滚 |
| 支付通道健康检查 | ✅ | `PaymentChannelPort.healthCheck()` |

### 告警事件类型 (builtin)
```typescript
'monitoring.alert.fired'   → '监控告警'
'monitoring.alert.resolved' → '告警恢复'
```

### 可观测性信号

| 信号 | 状态 | 覆盖率 | 延迟 | 告警路由 |
|:-----|:----:|:------:|:----:|:---------|
| metrics | healthy | 96% | 18s | alertmanager, ops-oncall-wecom |
| logs | warning | 88% | 92s | alertmanager |
| traces | warning | 84% | 74s | alertmanager, ops-oncall-wecom |

---

## 四、健康检查 ✅

| 维度 | 状态 | 说明 |
|:-----|:----:|:-----|
| 基础存活检查 | ✅ | `GET /health` / `GET /health/ping` → `{ alive: true }` |
| 完整健康检查 | ✅ | `GET /health/readiness` → 7 个组件逐项探测 |
| 探测组件 | ✅ | database, redis, lyt-adapter, memory, disk, event-bus, queue-producer |
| 数据库探测 | ✅ | `SELECT 1` + connected/provider |
| Redis 探测 | ✅ | ioredis PING / raw socket fallback |
| LYT 适配器探测 | ✅ | 返回 mode/adapter/dependencies |
| 内存/磁盘 | ✅ | `os.freemem()` / `statfs()` |
| EventBus 探测 | ✅ | `eventBus.ping()` |
| Queue 统计 | ✅ | pending/completed/failed counts |
| Docker Compose healthcheck | ✅ | PostgreSQL, Redis, API 均有 `healthcheck` 配置 |
| 备份健康度 | ✅ | `backupStatus.healthy = lastBackupAge < 2h` |
| 版本信息 | ✅ | 从 `package.json` 读取 |
| 审计健康度 (analytics-v2) | ✅ | `GET /analytics-v2/metrics/health` → healthy/degraded/unhealthy |
| AI 模型健康评估 | ✅ | `AiModelConfigAdvancedService` 组件级 health + overall 评分 |

### 健康端点总览

| 端点 | 权限 | 内容 |
|:-----|:----:|:-----|
| `GET /health` | Public | `{ alive: true }` |
| `GET /health/ping` | Public | `{ alive: true }` |
| `GET /health/readiness` | RBAC | 完整组件探测 (7 组件) |
| `GET /health/backup` | Public | 备份状态 |
| `GET /health/backup/trigger` | Public | 手动触发备份 |
| `GET /analytics-v2/retention/health` | RBAC | 留存健康度 |
| `GET /analytics-v2/metrics/health` | RBAC | 综合健康报告 |

---

## 五、重试 & 熔断 ✅

| 维度 | 状态 | 说明 |
|:-----|:----:|:-----|
| 边缘同步重试 | ✅ | 指数退避 (30s→5m), 最多 6 次 |
| Webhook 投递重试 | ✅ | 渐进退避 (15s→10m), 死信队列 |
| 备份恢复验证重试 | ✅ | 固定 10min 间隔, 3 次 |
| 熔断器 | ✅ | `circuit-breaker.ts` + `heterogeneous-router.ts` |
| 限流器 | ✅ | `rate-limiter.ts` |

---

## 六、综合评估

### 🟢 做得好的
1. **`DatabaseBackupService`** — 设计清晰：定时 `pg_dump` + gzip + 自动清理，含健康度判断
2. **健康检查体系** — 7 组件完整探测 + Docker healthcheck + analytics-v2 健康报告
3. **`ResilienceOperationsService`** — 灾备计划定义完整，RTO/RPO/演练日期可追踪
4. **Webhook 告警平台** — 飞书/钉钉/企业微信全覆盖，builtin 告警事件类型
5. **重试 + 熔断 + 限流** — 三层弹性基础设施齐备

### 🔴 必须改进 (P0)
1. **备份仅本地 `/tmp` 存储** — 容器重启即丢失，必须添加 OSS/S3 异地副本
2. **`archive_mode` 未开启** — 无 WAL 归档就没有 PITR，RPO 无法做到 5 分钟以内
3. **无自动化恢复脚本** — `kb-054` 文档描述的场景在代码中无实现
4. **恢复演练已严重过期** — postgres 59 天，edge-sync 116 天（已超 staleAfterDays）

### 🟡 建议优化 (P1)
1. **备份加密** — `pg_dump` 输出未加密，DATABASE_URL 明文传入命令行
2. **自动化演练** — 将 `kb-054` 中的演练流程代码化为 CronJob/CI pipeline
3. **Slack/PagerDuty 集成** — 补充国际主流告警通道
4. **备份触发改为 CronJob** — 当前依赖 Node.js `setInterval`，应用重启会丢失间隔精度

### 代码覆盖汇总

| 搜索维度 | 非测试命中 | 关键模块 |
|:---------|:----------:|:---------|
| backup/pg_dump | 1 服务 | `DatabaseBackupService` |
| restore/recovery | 1 模块 | `ResilienceOperationsService` |
| alert/alarm/notification | 5 模块 | webhook, time-series, inventory-alert, notification, webhook-eventbus |
| health/readiness | 4 模块 | health, health-dashboard, analytics-v2, ai-model-config |

---

## 七、改进路线图建议

| 优先级 | 任务 | 工作量 | 依赖 |
|:------:|:-----|:------:|:-----|
| P0 | 添加 OSS/S3 备份上传 | 2h | 阿里云 OSS SDK |
| P0 | 开启 PostgreSQL `archive_mode` + `archive_command` | 1h | K8s config |
| P0 | 编写 `pg_restore` 自动恢复脚本 | 3h | backup 文件结构 |
| P1 | 添加备份加密 (AES-256) | 2h | crypto 库 |
| P1 | 灾备切换自动化 (Cloudflare DNS API) | 4h | DNS 权限 |
| P1 | 定时恢复演练 CronJob | 3h | 恢复脚本完成后 |
| P2 | Slack/PagerDuty 通道适配器 | 2h | webhook.platforms.ts 扩展 |

---

*🐜 树哥 Trae · Day20 T2 灾备预案评审 · 2026-07-26*
