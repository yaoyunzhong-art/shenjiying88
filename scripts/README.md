# Scripts — 自动化脚本集

> **模块**: 自动化运维与工具脚本 | **位置**: `scripts/`
>
> M5 平台 200+ 个 shell/Python/TypeScript 脚本的集中目录，覆盖 CI/CD、数据导入、监控巡检、安全扫描、部署开切等全部运维场景。

## 目录结构

```
scripts/
├── *.sh                         # Shell 脚本（运维/CI/部署/监控/巡检）
├── *.py                         # Python 分析/生成/审核工具
├── *.ts / .mjs / .js            # TypeScript/Node 运行时脚本（数据种子/E2E/工具）
├── pulse-nightly-05/            # 夜间脉动脚本集
├── vrt/                         # 视觉回归测试（baseline/compare/screenshots）
└── __pycache__/                 # Python 缓存（忽略）
```

## 脚本分类概览

### 🏗️ 开发运维（DevOps Pipeline）
| 脚本 | 用途 |
|------|------|
| `morning-dev-jobs.sh` | 早间开发任务 |
| `afternoon-dev-jobs.sh` | 午后开发任务 |
| `nightly-jobs.sh` | 夜间批量任务 |
| `nightly-full-run.sh` | 夜间全量运行 |
| `daytime-handoff.sh` | 日间接手交接 |
| `v6-*.sh` | V6 版本节奏调度（handoff/standup/monitoring/retro） |
| `v17-pipeline.sh` | V17 发布管道 |

### 🔐 安全合规
| 脚本 | 用途 |
|------|------|
| `security-baseline-scan.sh` | 安全基线扫描 |
| `security-scan.sh` | 安全扫描 |
| `security-pentest.sh` | 渗透测试 |
| `security-data-classification.sh` | 数据分类分级 |
| `compliance-quarterly-simulate.sh` | 季度合规模拟 |
| `rls-scan.sh` | Row-Level Security 扫描 |
| `authguard-coverage-check.sh` | 认证守卫覆盖率检查 |

### ☸️ 部署开切（Deploy & Cutover）
| 脚本 | 用途 |
|------|------|
| `preflight-*.sh` | 部署前检查（compose/k8s/public cutover） |
| `apply-prod-public-cutover.sh` | 生产公网开切 |
| `rollback-prod-public-cutover.sh` | 生产公网回滚 |
| `prepare-prod-cutover-bundle.sh` | 开切包准备 |
| `precheck-cert-manager-base.sh` | cert-manager 前置检查 |
| `init-selfsigned-cert.sh` | 自签名证书初始化 |
| `build-m5-tls-secret.sh` | TLS 密钥构建 |
| `verify-m5-tls-secret.sh` | TLS 密钥验证 |
| `install-cert-manager.sh` | 安装 cert-manager |
| `install-alidns-webhook.sh` | 阿里云 DNS Webhook 安装 |

### 🗄️ 数据库（Database Ops）
| 脚本 | 用途 |
|------|------|
| `backup-db.sh` | 数据库备份 |
| `restore-db.sh` | 数据库恢复 |
| `check-prisma-rls.sh` | Prisma RLS 检查 |
| `run-prod-db-bootstrap.sh` | 生产数据库引导 |
| `rollback-prod-db-bootstrap-draft.sh` | 生产 DB 回滚草案 |
| `generate-foundation-sql.mjs` | SQL 基础表生成 |

### 📊 监控告警（Monitoring & Alerting）
| 脚本 | 用途 |
|------|------|
| `monitoring-daily.sh` | 日常监控 |
| `performance-baseline.sh` | 性能基线 |
| `performance-lcp-check.sh` | LCP 性能检查 |
| `check-aliyun-billing.sh` | 阿里云账单检查 |
| `check-amount-alignment.sh` | 金额对齐检查 |
| `check-permissions.sh` | 权限检查 |
| `check-coverage.sh` | 覆盖率检查 |

### 🧪 测试（E2E & Testing）
| 脚本 | 用途 |
|------|------|
| `phase25-e2e-*.ts` ~ `phase49-e2e-*.ts` | 阶段 E2E 测试用例 |
| `e2e-tier-check.sh` | E2E 分层检查 |
| `install-testing-silent.sh` | 静默安装测试环境 |
| `testing-silent-run.sh` | 静默测试运行 |
| `vrt/` | 视觉回归测试（Playwright VRT） |

### 💡 知识管理（Knowledge）
| 脚本 | 用途 |
|------|------|
| `knowledge-daily-crawl.sh` | 知识日常爬取 |
| `knowledge-decay.sh` | 知识衰减检查 |
| `knowledge-health-check.sh` | 知识健康检查 |
| `batch-import-all-knowledge.ts` | 批量导入知识 |
| `import-empower-cards.ts` | 导入赋能卡片 |
| `dispatch-knowledge.ts` | 分发知识 |
| `extract-knowledge.py` | 知识提取 |
| `lint-knowledge.py` | 知识 Lint 检查 |

### 🔄 CI/CD & GitOps
| 脚本 | 用途 |
|------|------|
| `commit-lint.sh` | 提交信息 Lint |
| `race-safe-commit.sh` | 竞态安全提交 |
| `install-hooks.sh` | Git hooks 安装 |
| `setup-defense-cron.sh` | 防御性 Cron 安装 |
| `setup-monitoring-cron.sh` | 监控 Cron 安装 |
| `setup-rhythm-cron.sh` | 节奏 Cron 安装 |
| `gate-sign.sh` | 门禁签名 |
| `pre-release-check.sh` | 预发布检查 |

### 🗺️ SEO/GEO
| 脚本 | 用途 |
|------|------|
| `archive-phase49-seo-geo.sh` | SEO/GEO 归档 |
| `run-phase49-seo-geo.sh` | SEO/GEO 运行 |
| `generate-sitemap.ts` | Sitemap 生成 |
| `seed-geo-locations.ts` | GEO 地理位置种子 |
| `verify-seo.mjs` | SEO 验证 |

### 🛡️ 故障恢复（Fail-Safe）
| 脚本 | 用途 |
|------|------|
| `fail-safe-meltdown.sh` | 熔断恢复 |
| `rollback-guide.sh` | 回滚指南 |
| `rollback-prod-public-cutover.sh` | 生产开切回滚 |
| `check-restored-files.sh` | 恢复文件检查 |

### 🧰 工具类（Utilities）
| 脚本 | 用途 |
|------|------|
| `wait-for-it.sh` | 等待服务就绪 |
| `resource-check.sh` / `resource-limit.sh` | 资源检查与限制 |
| `lib-m5-kubeconfig.sh` | Kubeconfig 库函数 |
| `openclaw-bridge.sh` | OpenClaw 桥接 |
| `lobster-handshake.mjs` | Lobster 握手协议 |

## 快速开始

```bash
# 查看所有脚本列表
ls scripts/*.sh

# 运行某个脚本（大部分需要项目环境）
./scripts/monitoring-daily.sh

# Python 脚本需激活项目虚拟环境
python3 scripts/lint-knowledge.py

# TypeScript 脚本通过 pnpm 运行
pnpm tsx scripts/generate-sitemap.ts
```

## 相关文档

- [README.md](../README.md) — 项目主文档
- [DEPLOY-QUICKSTART.md](../DEPLOY-QUICKSTART.md) — 部署快速开始
- [COMPOSE-DEPLOY-RUNBOOK.md](../COMPOSE-DEPLOY-RUNBOOK.md) — Docker Compose 部署手册
- [docs/operations/](../docs/operations/) — 运维文档目录
- [infra/](../infra/) — 基础设施代码（Terraform / K8s / Docker）
