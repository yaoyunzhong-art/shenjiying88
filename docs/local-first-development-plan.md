# 🏠 本地优先 (Local-First) 开发推进计划

> **作者**: 树哥
> **日期**: 2026-07-29
> **适用**: 神机营 SaaS 全栈 (admin-web / storefront-web / tob-web / api / mobile)
> **核心原则**: 本地能完成的，绝不上线做

---

## 〇. 核心信条

```
┌─────────────────────────────────────────────────────────────┐
│  本地能做的 = 必须在本地做完 + 跑通 + 留证 + 通过门禁        │
│  才能进入 release-bundle                                    │
│                                                             │
│  上线做的事 = 仅以下 3 件事（不可本地化）：                  │
│     1. 镜像推送到 ACR                                       │
│     2. kubectl apply 到生产集群                             │
│     3. 真实流量的健康检查 + 线上验收（10-15 min 一次性）     │
│                                                             │
│  一切演练、压测、迁移、验证、回滚 = 100% 本地可重放          │
└─────────────────────────────────────────────────────────────┘
```

**为什么是本地优先**：
- 生产环境不可测试 — 错一次就是事故
- 本地可重现、可回滚、可多人协作
- 本地有完整门禁矩阵（TSC/Lint/Unit/E2E/RLS/审计）
- 本地有完整脚本（200+）已经覆盖所有场景

---

## 一、本地化工作矩阵（已盘点现状）

| 类别 | 子项 | 现状 | 已有脚本 |
|:---|:---|:---:|:---|
| **代码** | TSC 零错误 | ✅ | `tsc --noEmit` |
| | Lint | ✅ | `commit-lint.sh` |
| | 单元测试 | ✅ 96.8% | `node --test` |
| | E54 拍平 (client/data) | ⏳ 推进中 | — |
| **数据** | Prisma schema | ✅ 126 models | `prisma validate` |
| | Prisma generate | ✅ | `prisma generate` |
| | DB migration dry-run | ✅ | `run-prod-db-bootstrap.sh` |
| | Seed 数据 | ✅ | `seed-patterns.sql` |
| | 数据迁移演练 | ⏳ 缺 | `run-cutover-drill.sh` |
| **测试** | L0 E2E (5条生命线) | ✅ 脚本化 | `e2e-tier-check.sh --tier L0` |
| | L1 E2E (26条核心) | ✅ 脚本化 | `e2e-tier-check.sh --tier L1` |
| | L2 E2E (27条扩展) | ✅ 脚本化 | `e2e-tier-check.sh --tier L2` |
| | L3 性能基线 (15条) | ✅ 脚本化 | `e2e-tier-check.sh --tier L3` |
| | VRT 视觉回归 | ✅ | `scripts/vrt/run-vrt.sh` |
| | 压测 (k6) | ✅ 任意 URL | `run-load-test.sh` |
| **验证** | 本地 API 启动基线 | ✅ | `preflight-local-api-runtime.sh` |
| | K8s manifest 渲染 | ✅ | `render-k8s-release-manifests.sh` |
| | K8s release 预检 | ✅ | `preflight-k8s-release.sh` |
| | 公网切换预检 (offline) | ✅ | `preflight-prod-public-cutover.sh --offline` |
| | 公网 apply dry-run | ✅ | `apply-prod-public-cutover.sh --kubectl-dry-run` |
| | DB bootstrap dry-run | ✅ | `run-prod-db-bootstrap.sh` (默认) |
| | 切换演练 (5 步全离线) | ✅ | `run-cutover-drill.sh` |
| | 健康检查 7 组件 | ✅ | `deploy-check.sh` |
| **回滚** | 镜像回滚指南 | ✅ | `rollback-guide.sh` |
| | 公网回滚 | ✅ | `rollback-prod-public-cutover.sh` |
| | DB 回滚 (bootstrap) | ✅ | `rollback-prod-db-bootstrap-draft.sh` |
| | 回滚方案演练 | ⏳ Day 4 待跑 | — |
| **CI/CD** | GitLab CI | ✅ | `.gitlab-ci.yml` |
| | GitHub Actions | ✅ | `.github/workflows/ci.yml` |
| | GitHub Deploy | ✅ | `.github/workflows/deploy.yml` |
| | ACR 镜像自动刷新 | ⏳ Day 1 标记未闭环 | `refresh-acr-regcred.sh` |
| **文档** | Launch checklist | ✅ | `docs/launch-checklist.md` |
| | Launch plan v3 | ✅ | `docs/launch-plan.md` |
| | Deployment guide | ✅ | `docs/deployment-guide.md` |
| | 9 门闸门审计 | ✅ | `docs/knowledge/audit-toc-phase1-20260726.md` |
| | E2E 分级 | ✅ | `docs/knowledge/e2e-tier-grading.md` |
| | Knowledge base | ✅ 100+ | `docs/knowledge/kb-001~kb-083` |
| **监控** | K8s 监控栈 | ✅ | `infra/k8s/monitoring-stack.yaml` |
| | Prometheus + Grafana | ✅ | `infra/monitoring/` |
| | Loki 日志 | ✅ | — |
| | 健康检查 7 组件 | ✅ | — |

**结论**：仓库已有 **90% 工具就绪**，3 项缺口的本地化路径也已明确。

---

## 二、本地化基础设施（目标态）

### 2.1 必装工具（开发者机）

```bash
# 一次性安装
brew install node pnpm docker kubectl helm k6 postgresql redis minio/stable/minio jq
brew install --cask lens  # K8s IDE

# 项目根目录
pnpm install
pnpm turbo build
```

### 2.2 本地 K8s 集群（k3d 推荐）

```bash
# 启动本地 K8s
bash scripts/setup-local-k8s.sh   # 即将创建，封装 k3d + 必要 manifest

# 部署本地全栈
bash scripts/deploy-local-full.sh  # 封装：PG + Redis + RabbitMQ + MinIO + 4 个 app
```

### 2.3 本地服务依赖

| 服务 | 端口 | 启动命令 |
|:---|:---:|:---|
| PostgreSQL 16 | 5432 | `docker compose up -d postgres` |
| Redis 7 | 6379 | `docker compose up -d redis` |
| RabbitMQ 3 | 5672 | `docker compose up -d rabbitmq` |
| MinIO | 9000/9001 | `docker compose up -d minio` |
| MailHog (dev mail) | 1025 | `docker compose up -d mailhog` |

### 2.4 本地启动 API

```bash
# 单条命令
bash scripts/verify-local-api-startup-baseline.sh
# 默认端口 3145，校验启动日志 + health/docs/foundation 端点
```

---

## 三、本地门禁矩阵（不可绕过）

### 3.1 提交前（开发者自检）

```bash
# 必跑（每改一行代码）
pnpm turbo typecheck                 # TSC 零错误
pnpm turbo lint                       # Lint
pnpm turbo test:unit                  # Unit test

# 必跑（改 cross-module 链路）
bash scripts/e2e-tier-check.sh --tier L0   # 5 条生命线

# 必跑（改 schema / migration）
pnpm --filter @m5/api exec prisma validate
pnpm --filter @m5/api exec prisma generate
```

### 3.2 PR 合并前（CI 强制）

```yaml
# .github/workflows/ci.yml
- typecheck    → 必须 0 error
- unit-test    → 必须 100% pass
- e2e-tier-L0  → 必须 100% pass（5 条生命线，失败阻断）
- e2e-tier-L3  → 性能基线（不退化 > 5%）
- rls-scan     → RLS 72 模型白名单（失败阻断）
- audit-scan   → 审计日志（失败阻断）
- security-scan → 依赖漏洞（critical 阻断）
```

### 3.3 合并到 main 后（CD 触发）

```bash
# 1. 镜像构建
docker build -f apps/api/Dockerfile -t m5-api:git-$SHA .
docker build -f apps/admin-web/Dockerfile -t m5-admin-web:git-$SHA .

# 2. 本地 dry-run K8s 渲染
bash scripts/render-k8s-release-manifests.sh --env-file release.env
bash scripts/preflight-k8s-release.sh

# 3. 本地 dry-run 公网切换
bash scripts/preflight-prod-public-cutover.sh --offline
bash scripts/apply-prod-public-cutover.sh --kubectl-dry-run client --offline

# 4. 本地切流演练（5 步全离线）
bash scripts/run-cutover-drill.sh
```

### 3.4 上线日（D-Day）

```bash
# ⚠️ 这是唯一允许连接生产的环节
export KUBECONFIG=$HOME/.kube/m5-prod-config

# 1. 推镜像到 ACR
docker push acr-registry/m5-api:git-$SHA

# 2. 部署到 K8s
kubectl apply -k infra/k8s/overlays/production
kubectl rollout status deployment/m5-api -n m5

# 3. 部署验收（6 项检查）
bash scripts/deploy-check.sh production

# 4. 健康检查 7 组件
bash scripts/verify-prod-public-endpoints.sh

# 5. 业务验收（收银 → 支付 → 退款）
# 仅做：核心业务流 1 次烟囱测试，10-15 min 一次性

# 6. 留证 + 发版公告
```

---

## 四、本地优先 Sprint 推进（7/29 → 7/31）

### 🎯 Sprint 目标
- **Day 4 (7/29 周二)**: 本地完成预发布所有演练 + 修完剩余 103 fail
- **Day 5 (7/30 周三)**: 本地演练零问题后，10-15 min 一次性上线放量
- **Day 6 (7/31 周四)**: 缓冲日，本地补齐商户号 / 依赖漏洞

### 4.1 Day 4 (7/29) — 预发布 / 本地化冲刺

**上午 09:00-12:00 — 本地验收冲刺**

| 时段 | 任务 | 验证脚本 | 阻塞条件 |
|:---|:---|:---|:---:|
| 09:00-09:30 | 修完 4 batch 剩余 103 fail | `xargs node --test` | < 100% |
| 09:30-10:30 | L0 5 条生命线 E2E 全跑 | `e2e-tier-check.sh --tier L0` | 任意 1 条 fail |
| 10:30-11:00 | 本地 API 启动基线 | `preflight-local-api-runtime.sh` | 失败 |
| 11:00-11:30 | K8s manifest 渲染 + dry-run | `render-k8s-release-manifests.sh` | 失败 |
| 11:30-12:00 | 公网切换 dry-run (offline) | `preflight-prod-public-cutover.sh --offline` | 失败 |

**下午 13:00-18:00 — 压测 + 演练**

| 时段 | 任务 | 验证脚本 | 阻塞条件 |
|:---|:---|:---|:---:|
| 13:00-14:00 | 50 VU 压测 (本地) | `k6 run -e VUS=50 -e BASE_URL=https://api.sportsant.net scripts/load-test.js` | p95 > 2s |
| 14:00-15:00 | 200 VU 极限压测 (本地) | `k6 run -e VUS=200 scripts/load-test.js` | 失败率 > 5% |
| 15:00-16:00 | DB 数据迁移演练 (dry-run) | `run-prod-db-bootstrap.sh --from foundation-wave0.sql` | 失败 |
| 16:00-17:00 | 切换演练 (5 步全离线) | `run-cutover-drill.sh` | 任意 1 步 fail |
| 17:00-18:00 | 回滚演练 (本地 K8s) | `kubectl rollout undo` (本地) | 演练失败 |

**晚上 19:00-21:00 — 留证 + 收口**

- [ ] 写 `docs/knowledge/2026-07-29-pre-release-drill.md` 报告
- [ ] 补 7/28 / 7/29 memory 断更
- [ ] 更新 `debt.md`（7/18 之后状态）
- [ ] 更新 `known-issues-status.md`

### 4.2 Day 5 (7/30) — 上线日

| 时段 | 任务 | 备注 |
|:---|:---|:---|
| 09:00-10:00 | 复跑全部 Day 4 演练 | 任何 1 项 fail 推迟到 D6 |
| 10:00-10:15 | **唯一允许**：推镜像 + kubectl apply | 10-15 min 一次性 |
| 10:15-10:30 | 部署验收 (6 项) | `deploy-check.sh production` |
| 10:30-11:00 | 健康检查 7 组件 | `verify-prod-public-endpoints.sh` |
| 11:00-12:00 | 业务烟囱测试（收银→支付→退款）| 一次性 |
| 12:00-12:30 | 发版公告 + 留证 | `docs/release/v1.0.0.md` |
| 12:30+ | 监控观察（Prometheus + Grafana） | — |

### 4.3 Day 6 (7/31) — 缓冲

| 时段 | 任务 |
|:---|:---|
| 09:00-12:00 | 商户号补齐（本地测试）|
| 13:00-15:00 | 依赖 3 个 critical 漏洞修复（本地）|
| 15:00-17:00 | 重跑 200 VU 压测 (本地) |
| 17:00+ | L1 26 条核心业务 E2E 复跑 |

---

## 五、本地化工作流总图

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  本地开发机 (Mac / Linux)                                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │  TSC/Lint   │→ │  Unit Test  │→ │  L0 E2E     │ ← 提交前门禁   │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
│           ↓                                                        │
│  ┌─────────────────────────────────────────────────────┐          │
│  │  Git Push → PR → CI (typecheck + test + L0 + rls)  │          │
│  └─────────────────────────────────────────────────────┘          │
│           ↓ merge                                                   │
│  ┌─────────────────────────────────────────────────────┐          │
│  │  CD: docker build (本地) → 渲染 manifest (本地)      │          │
│  │     → preflight-k8s-release (本地)                  │          │
│  │     → preflight-prod-public-cutover --offline (本地) │          │
│  │     → apply-prod-public-cutover --dry-run (本地)     │          │
│  │     → run-cutover-drill (本地 5 步)                  │          │
│  └─────────────────────────────────────────────────────┘          │
│           ↓ 全部通过                                                │
│  ┌─────────────────────────────────────────────────────┐          │
│  │  本地压测 (k6 → api.sportsant.net)                  │          │
│  │  本地 VRT (visual regression → storefront)          │          │
│  └─────────────────────────────────────────────────────┘          │
│           ↓ 全部通过                                                │
│  ✅ release-bundle 合格                                              │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
                                  ↓
┌────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  生产环境 (阿里云 ACR + 阿里云 K8s)                                  │
│  ⚠️ 仅以下 3 件事                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │ 1. docker push   │→ │ 2. kubectl apply │→ │ 3. 健康检查    │  │
│  │   (10 min)       │  │   (3 min)        │  │   (10 min)     │  │
│  └──────────────────┘  └──────────────────┘  └────────────────┘  │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

---

## 六、本地化铁律（不可违反）

### 6.1 禁止 SSH 改生产源码
> 已在 `handoff.md` 拍板。所有改动走 Git → 镜像 → K8s。

### 6.2 禁止跳过 L0 E2E
> L0 5 条生命线（收银/支付/退款/对账/租户）每次 PR 前必跑，失败阻断。

### 6.3 禁止未演练就推生产
> 任何生产操作（DB / K8s / 公网切换）必须先有 `*drill.sh` 演练脚本。

### 6.4 禁止用 MOCK 上线
> MOCK 模式仅限本地 + Staging。生产必须用真实 API 路径（`deliveryMode: 'api'`）。

### 6.5 禁止在 production 改 K8s manifest
> manifest 改动 = 代码改动 = 走 PR + 本地 dry-run + 合并后渲染。

### 6.6 禁止在生产跑数据迁移
> 迁移脚本必须先在本地 dry-run → Staging 验证 → 生产 一次性 apply。

### 6.7 禁止手工执行 kubectl set image
> 必须用 `apply-prod-public-cutover.sh`（含 dry-run + 切换 + 回滚三件套）。

### 6.8 禁止未留证就关窗口
> 每次上线必须有 `docs/release/vX.Y.Z.md` 留证（时间 / commit / 镜像 / 验收人）。

---

## 七、本地化度量（健康度）

### 7.1 每日自动产出（V21 自进化）

```bash
bash scripts/evolution-health-check.sh
# 评分维度: 测试通过 / TSC 稳定 / 树哥合规 / 闭环率
# 输出: docs/knowledge/evolution/score-YYYY-MM-DD.md
```

### 7.2 周度自检

```bash
# 1. L0+L1 全跑（约 200 it）
bash scripts/e2e-tier-check.sh --tier L0
bash scripts/e2e-tier-check.sh --tier L1

# 2. VRT 全跑（视觉回归）
bash scripts/vrt/run-vrt.sh

# 3. 200 VU 极限压测
k6 run -e VUS=200 -e DURATION=60s scripts/load-test.js

# 4. Debt 重算
bash scripts/audit-freshness-check.sh
```

### 7.3 月度合规（未成年 + 审计 + RLS）

```bash
bash scripts/compliance-quarterly-simulate.sh
bash scripts/security-baseline-scan.sh
bash scripts/check-prisma-rls.sh
```

---

## 八、本地化推进时间表（7/29 → 8/05）

| 日期 | 重点 | 关键产出 |
|:---|:---|:---|
| 7/29 (Day 4) | 修完 103 fail + 本地演练 + 压测 | 预发布合格 |
| 7/30 (Day 5) | **10-15 min 一次性上线放量** | `docs/release/v1.0.0.md` |
| 7/31 (Day 6) | 商户号补齐 + 漏洞修复 | `debt.md` 闭环率提升 |
| 8/01 (W+1) | M2 后端元数据深化启动 | 元数据 schema 落地 |
| 8/02 (W+1) | VRT 视觉回归全量入库 | `scripts/vrt/baseline/` |
| 8/03 (W+1) | 第二次 release-bundle 演练 | release-bundle v2 |
| 8/04 (W+1) | 9 门闸门全面审计 | `audit-toc-phase2.md` |
| 8/05 (W+1) | 第二周复盘 + 下一 Sprint 计划 | `memory/2026-08-05.md` |

---

## 九、本地化 ROI 测算

| 指标 | 之前（生产直做） | 之后（本地优先） | 提升 |
|:---|:---:|:---:|:---:|
| 生产事故率 | 估 5-10% | 目标 < 1% | **10x** |
| 上线耗时 | 估 1-2h | 10-15 min | **8x** |
| 回滚耗时 | 估 30 min | 5-15 min | **2-3x** |
| Bug 发现 | 生产发现 | 本地全部门禁 | **10x** |
| 团队信心 | 估 60% | 目标 95% | **+35%** |

---

## 十、立即可做（无需新工具）

| # | 任务 | 命令 | 时间 |
|:--|:---|:---|:---:|
| 1 | 跑 L0 E2E 看当前 | `bash scripts/e2e-tier-check.sh --tier L0` | 5 min |
| 2 | 跑 K8s manifest dry-run | `bash scripts/preflight-k8s-release.sh` | 2 min |
| 3 | 跑公网切换 dry-run (offline) | `bash scripts/preflight-prod-public-cutover.sh --offline` | 2 min |
| 4 | 跑切换演练 5 步 | `bash scripts/run-cutover-drill.sh` | 10 min |
| 5 | 跑 DB bootstrap dry-run | `bash scripts/run-prod-db-bootstrap.sh` | 2 min |
| 6 | 跑 VRT 视觉回归 | `bash scripts/vrt/run-vrt.sh` | 5 min |
| 7 | 跑 50 VU 压测 (本地) | `k6 run -e VUS=50 scripts/load-test.js` | 1 min |
| 8 | 跑 L1 E2E | `bash scripts/e2e-tier-check.sh --tier L1` | 15 min |

**总耗时 45 min，即可完成 Day 4 全部本地化验收**。

---

## 十一、归档与留证（每次 Sprint 结束）

```bash
# 1. 写当日 memory
$EDITOR memory/$(date +%Y-%m-%d).md

# 2. 更新 debt
$EDITOR debt.md

# 3. 更新 launch-checklist
$EDITOR docs/launch-checklist.md

# 4. 写 release-bundle 留证（如有 release）
mkdir -p docs/release/v$(date +%Y.%m.%d)
$EDITOR docs/release/vX.Y.Z/{release-notes.md,evidence.md,rollback.md}

# 5. commit
git add .
git commit -m "release-bundle vX.Y.Z — 本地化收口"
git push
```

---

## 十二、给大飞哥的承诺

```
┌──────────────────────────────────────────────────────────────┐
│  1. 任何上线动作前 100% 有本地演练产物（report.md / log）    │
│  2. 任何数据迁移前 100% 有 dry-run 报告                     │
│  3. 任何回滚方案前 100% 有本地 K8s 演练                     │
│  4. 任何性能变更前 100% 有 k6 baseline 对比                 │
│  5. 任何依赖升级前 100% 有 security-scan + TSC 报告          │
│  6. 任何 schema 变更前 100% 有 prisma validate + 迁移演练    │
│  7. 任何线上验收前 100% 有 9 门闸门审计                     │
│  8. 每日 23:00 自动写 memory + 评分                         │
└──────────────────────────────────────────────────────────────┘
```

**Day 4 (今日 7/29) 立即开干**：
1. 修完 4 batch 剩余 103 fail
2. 跑通 Day 4 全部门禁（上面表格 8 项）
3. 写 `docs/release/v1.0.0-rc1.md` 留证
4. 补 7/28-29 memory

**Day 5 (明日 7/30) 一次性放量**：
1. 复跑 Day 4 全部 8 项
2. 10-15 min 一次性 apply
3. 业务烟囱测试
4. 留证 + 公告

请大飞哥审阅。
