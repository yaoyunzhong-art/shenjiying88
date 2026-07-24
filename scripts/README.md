# scripts — 自动化脚本集

## 模块简介

`scripts/` 是神机营 SaaS 的集中化运维与工具脚本目录，包含 200+ 个脚本文件，覆盖 DevOps 流水线、E2E 阶段测试、数据导入、安全巡检、监控告警、部署开切等全场景。脚本类型涵盖 Shell、Python、TypeScript/Node.js。

## 目录结构

```
scripts/
├── *.sh                        # Shell 运维脚本（部署/监控/CI/安全）
├── *.py                        # Python 工具（审核/分析/报告生成）
├── *.ts / .mjs                 # TypeScript/Node 运行时脚本
├── *.sql                       # 数据种子 SQL 文件
├── pulse-nightly-05/           # 夜间脉动脚本子目录
├── vrt/                        # 视觉回归测试（截图对比）
└── __pycache__/                # Python 缓存（gitignore）
```

## 脚本分类

| 分类 | 代表脚本 | 说明 |
|------|----------|------|
| **阶段 E2E 测试** | `phase25-*` 至 `phase49-*` (25 个) | 渐进式端到端阶段测试 |
| **数据导入/种子** | `seed-*.sql`、`seed-*.ts`、`batch-import-*.ts` | 数据库种子数据与知识库导入 |
| **部署开切** | `preflight-*`、`run-*`、`rollback-*`、`verify-*` | 预检/开切/回滚/验证 |
| **监控巡检** | `monitoring-*`、`pulse-*`、`health-*` | 运行监控与健康检查 |
| **安全扫描** | `security-*`、`rls-scan.sh` | 安全基线扫描与渗透测试 |
| **CI/开发辅助** | `morning-dev-*`、`afternoon-dev-*`、`nightly-*` | 日常开发任务编排 |

## 本地主线验证

- `verify-local-api-startup-baseline.sh`
  - 用于固化当前 `apps/api` 的本地启动日志基线
  - 自动拉起 API、校验关键保留/禁止日志，并抽样验证 `health/ping`、`docs`、`foundation/bootstrap`

## 使用方式

```bash
# 运行阶段 E2E 测试
bash scripts/phase35-e2e-cashier.sh

# 执行数据种子导入
npx ts-node scripts/seed-geo-locations.ts

# 运行安全扫描
bash scripts/security-baseline-scan.sh
```

## 注意事项

- 部分脚本依赖环境变量（`.env`），运行前确认 `source`
- 阶段 E2E 脚本（phase*）需按编号顺序执行
- TypeScript 脚本需通过 `npx ts-node` 或 `pnpm` 运行
- 部署开切脚本建议在 dry-run 模式下预演后再正式执行
