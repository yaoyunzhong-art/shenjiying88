# P-53 部署 DevOps 专项审计

> 更新时间: 2026-07-14
> 范围: PRD-013 / CI/CD / Docker/Compose / 环境模板 / 回滚机制

## 1. 审计结论

`P-53` 不是从零开始：仓库已有 CI 与 Deploy workflow、Dockerfile、docker-compose、k8s/terraform 与运行脚本。本轮主要做的是把“已有实现”拉回 `PRD-013` 的验收口径，并补齐可执行的主圈梁证据与文档收口，结论为 `🟡 已补主圈梁`。

## 2. 证据清单

| 验收项 | 证据 | 结论 |
|:------|:-----|:-----|
| AC-53-01 CI门禁 | `.github/workflows/ci.yml` | lint/typecheck 不再允许 `continue-on-error` |
| AC-53-02/03 CD部署 | `.github/workflows/deploy.yml` | build&push + SSH 部署 + 健康检查 |
| AC-53-04 回滚机制 | `.github/workflows/deploy.yml` | 健康失败触发回滚，回滚后再健康检查 |
| AC-53-05 compose 启动 | `docker-compose.yml` | 顶层 `volumes:` 已收敛为单段，避免覆盖风险 |
| RQ-53-04 环境管理 | `.env.example` + `.env.staging.example` + `.env.production.example` | dev/staging/prod 模板已分层 |

## 3. 主圈梁

`apps/api/src/modules/devops/devops-ringbeam.test.ts` 提供最小可执行证据，覆盖：
- CI lint/typecheck 门禁
- deploy workflow 回滚逻辑存在性
- docker-compose 顶层 volumes 单段约束
- qdrant volumes 必须收敛在主 volumes 段
- entrypoint 脚本存在性

## 4. 仍需补齐的深水区

1. `staging -> production` 的强制双阶段 promotion：当前 Deploy workflow 支持 staging/production 选择，但“staging 通过才能进 production”的强制门禁建议通过 GitHub Environments 审批与 job 依赖进一步固化。
2. 回滚策略仍属于“版本文件 + 健康失败回退”级别：若需要更强一致性，建议引入镜像 digest 固定与服务级 healthcheck 聚合。

## 5. 验证记录

```bash
pnpm --dir apps/api exec vitest run src/modules/devops/devops-ringbeam.test.ts
```
