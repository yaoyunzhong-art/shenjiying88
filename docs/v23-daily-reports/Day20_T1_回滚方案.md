# Day20 T1: 回滚方案审核 — 2026-07-26 01:38 CST

> 🐜 树哥 Trae · V23 Day20 T1 子任务
> 审核范围: 部署回滚、数据库回滚、镜像策略、自动回滚机制

---

## 一、检查项总览

| 维度 | 产物 | 状态 |
|:-----|:-----|:----:|
| 部署回滚 | `scripts/rollback-guide.sh` | 🟢 完善 |
| 基线文档 | `docs/knowledge/v22-rollback-baseline.md` | 🟢 完善 |
| 公网切流回滚 | `scripts/rollback-prod-public-cutover.sh` | 🟢 完善 |
| DB 初始化回滚 | `scripts/rollback-prod-db-bootstrap-draft.sh` + 9 个 phase SQL | 🟢 完善 |
| 自动回滚服务 | `apps/api/src/modules/auto-rollback/` 6 源文件 + 13 测试 | 🟢 完善 |
| 资源预留回滚 | `knowledge/patterns/reserve-rollback.md` | 🟢 已标准化 |
| 预发布检查 | `scripts/preflight-k8s-release.sh` + 5 个 preflight 脚本 | 🟢 完善 |
| ConfigMap 备份 | `infra/k8s/backups/public-cutover/` ~2000+ 快照 | 🟢 高频备份 |
| Prisma 迁移 | 16 个 migration (无 down.sql) | 🟡 需人工回滚 |
| K8s revision 保留 | 未设置 `revisionHistoryLimit` (默认 10) | 🟢 K8s 默认值 |
| Docker tag 策略 | 镜像仓库: ACR + sha256 digest | 🟢 可追溯 |

---

## 二、逐维度详细审核

### 2.1 部署回滚 (`scripts/rollback-guide.sh`)

**能力矩阵:**

| 场景 | 命令 | 耗时 |
|:-----|:-----|:----:|
| A 全员快速回滚 | `kubectl rollout undo` × 4 | < 2min |
| B 指定 revision | `--to-revision=REVISION` | < 2min |
| C 脚本化 + wait | `for D in ... do rollout undo; done` + `rollout status` | 3-5min |
| D 单服务回滚 | 只回滚 1 个 deployment | < 1min |
| E rollout undo 失效 | `kubectl set image` 直接用 sha256 | 手动 5min |

**回滚后验证:** Pod 状态、API 健康检查、3 个前端页面 HTTP 200。

**评价:** 🟢 覆盖 4 个部署 × 5 种场景，验证步骤完整。脚本化一键执行。

---

### 2.2 基线文档 (`docs/knowledge/v22-rollback-baseline.md`)

记录了：
- K8s 集群 (ACK cn-hangzhou)、Namespace `m5`
- 4 节点 IP、K8s 版本
- 当前运行镜像 sha256 digest（精确可回滚）
- 4 个 deployment 的 revision 号
- ConfigMap 关键配置（37 项）
- 镜像仓库迁移记录（GHCR → 国际 ACR → 国内 ACR）

**评价:** 🟢 每次发布前应更新此文件，当前记录截至 2026-07-20。

---

### 2.3 公网切流回滚 (`scripts/rollback-prod-public-cutover.sh`)

1. 备份当前 Ingress + ConfigMap 到 `infra/k8s/backups/public-cutover/YYYYMMDD-HHMMSS/`
2. 重新 apply 仓库基线 (`infra/k8s/ingress.yaml` + `configmap.yaml`)
3. Restart 4 个 deployment
4. 等待 rollout 完成 (300s timeout)

**评价:** 🟢 覆盖切流失败场景。备份目录已有 2000+ 快照（2026-07-18 生产发布当天高频触发）。

---

### 2.4 数据库回滚

**Prisma 迁移:**
- 16 个 migration，全部只有 `migration.sql`（up 方向）
- 无标准 `down.sql`
- 回滚依赖外部脚本

**SQL 回滚脚本 (`infra/sql/prod-db/rollback/`):**

| 文件 | 覆盖范围 |
|:-----|:-----|
| `rollback-foundation-wave0.sql` | Foundation 枚举类型 |
| `rollback-foundation-wave1.sql` | 21 个基础表 + 26 个枚举 |
| `rollback-foundation-wave2-wave3.sql` | 9 个上层表 + FKs |
| `rollback-phase-a.sql` | Tenant/Brand/Store/User/MarketProfile + FKs |
| `rollback-phase-b.sql` | Tax/Email/Social/Portal/Regional + FKs |
| `rollback-phase-c.sql` | Member/LYT 快照表 |
| `rollback-phase-d.sql` | Inspection/Audit/Operations 表 |
| `rollback-remaining-wave0.sql` | 剩余枚举类型 |
| `rollback-all.sql` | 聚合全部 |

**Bootstrap 脚本 (`scripts/rollback-prod-db-bootstrap-draft.sh`):**
- Bash 封装，dry-run / --execute 两模式
- 按依赖顺序：先 DROP 外键约束 → DROP 表 → DROP 枚举
- 需要 `DATABASE_URL` 环境变量

**评价:** 🟡 Prisma 本身不支持自动 down migration；项目用独立 SQL 脚本覆盖了全部表和枚举的逆操作，结构完善。**风险提示**: 16 个 migration 中后 8 个（2026-07-17 之后）没有对应的独立 phase SQL（rollback 脚本是 bootstrap 级，非增量 migration 级）。如需回滚特定单个 migration，需要判断该迁移对应的表和约束，然后手动操作。

---

### 2.5 自动回滚模块 (`apps/api/src/modules/auto-rollback/`)

| 维度 | 数值 |
|:-----|:----:|
| 业务源文件 | 6 |
| 测试文件 | 13 |
| 代码行 | 853 |
| 测试行 | 4,913 |
| 测试/代码比 | 5.76x |

模块文件: `dto.ts` / `service.ts` / `controller.ts` / `contract.ts` / `module.ts` / `entity.ts`

**评价:** 🟢 代码和测试密度高（5.76x），属于 P-53 部署 DevOps 体系。ringbeam 测试已覆盖。

---

### 2.6 资源预留回滚模式 (`knowledge/patterns/reserve-rollback.md`)

标准化三步模式：
1. `reserve` — 原子预留 quota/lock/token
2. 业务执行
3. 异常 `catch` → `decrement` 回滚

已在 8 个 service 中使用。

**评价:** 🟢 模式文档化 + 验证通过。

---

### 2.7 预发布检查

| 脚本 | 目的 |
|:-----|:-----|
| `preflight-k8s-release.sh` | 校验 K8s 清单、ConfigMap 无敏感值、ACR 凭据 |
| `preflight-prod-public-cutover.sh` | 切流前 DNS / TLS / endpoint 探活 |
| `preflight-prod-formal-window.sh` | 正式发布窗口前 DNS + TLS 验证 |
| `preflight-compose-deploy.sh` | Docker Compose 部署前检查 |
| `preflight-local-api-runtime.sh` | 本地 API 运行时检查 |
| `pre-release-check.sh` | 通用预发布检查 |

**评价:** 🟢 6 个 preflight 脚本覆盖发布前、切流前、正式窗口前，出错前拦截。

---

### 2.8 ConfigMap 备份

`infra/k8s/backups/public-cutover/` 包含 2074 个子目录（每个时间戳一个快照），主要来自 2026-07-18 生产发布当天。

每个备份目录包含：
- `m5-ingress.before-rollback.yaml`
- `m5-config.before-rollback.yaml`

**评价:** 🟢 高频快照。需注意存储膨胀 — 2074 个目录 ~66KB（目录元数据），后续可考虑保留最近 N 个。

---

### 2.9 K8s revision 保留

- K8s deployment YAML 未显式设置 `revisionHistoryLimit`
- K8s 默认值为 **10**
- `m5-api` 当前 revision 24（共 11 个保留: 12, 13, 16-24）
- `m5-admin-web` / `m5-storefront-web` / `m5-tob-web` 当前 revision 9（共 9 个保留: 1-9）

**评价:** 🟢 默认 10 个 revision 足够日常回滚。

---

### 2.10 Docker 镜像策略

- 仓库: `shenjiying88acr20260717-registry.cn-hangzhou.cr.aliyuncs.com/shenjiying88`（阿里云 ACR 杭州）
- 引用方式: `@sha256:...`（digest 不可变引用），可精确定位到任意历史镜像
- 构建: `infra/k8s/kaniko-build-*.yaml`
- 发布: `scripts/render-k8s-release-manifests.sh` 参数化注入 image tag

**评价:** 🟢 使用 sha256 digest 是最佳实践，即使 tag 被覆盖也能精确回滚。

---

## 三、风险评估

| 风险 | 级别 | 缓解 |
|:-----|:----:|:-----|
| Prisma 无 down migration | 🟡 中 | 独立 SQL 脚本覆盖 bootstrap 整体回滚；但单 migration 精准回滚需手工操作 |
| ConfigMap 备份存储增长 | 🟡 低 | 当前 ~66KB 可忽略；长期建议加 `max_backups` |
| 回滚时 ConfigMap 同步 | 🟡 中 | 如果 schema 变更需要新配置项，回滚镜像后 ConfigMap 需同步回滚 |
| DB 回滚业务数据丢失 | 🔴 高 | 所有 rollback SQL 是 DROP 操作，不可逆。需在操作前 pg_dump 备份 |

---

## 四、改进建议

1. **Prisma 迁移增加 down.sql**：为 2026-07-17 后的 8 个 migration 补充反向 SQL，放入 `infra/sql/prod-db/rollback/` 对应 phase
2. **ConfigMap 备份清理**：加 cron 保留最近 30 天 + 每月 1 个归档
3. **DB 回滚前置快照**：`rollback-prod-db-bootstrap-draft.sh` 应在 `--execute` 之前强制 pg_dump
4. **回滚演练**：建议在 staging 环境每月执行一次完整回滚演练

---

## 五、结论

🟢 **回滚方案整体完备**，覆盖 K8s 部署回滚（4 部署 × 5 场景）、数据库回滚（9 个 phase SQL）、自动回滚服务（6 源文件 + 13 测试）、资源预留回滚模式。Docker 镜像使用 sha256 digest 可精确定位。

🟡 **关注点**: 单个 Prisma migration 的精准回滚缺少自动化脚本；DB rollback 全部是 DROP 操作，执行前需要强制 pg_dump 作为安全网。

---

*🐜 树哥 Trae · Day20 T1 · 审核完成 · 2026-07-26 01:38 CST*
