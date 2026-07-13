# PRD-013: 部署DevOps — Deployment & DevOps (P-53)

> 版本: v1.0 · 签发人: 🦞 龙虾哥 · 对接专家: E49 运维
> 发布日期: 2026-07-13 · 状态: 🟢 已签发
> 关联Phase: P-53

## 1. 业务背景

当前代码只在本地运行，无自动化部署管道。需要CI/CD让代码自动构建、测试、部署。

## 2. 功能需求

| RQ | 标题 | 优先级 | 验收标准 |
|:---|:-----|:------:|:---------|
| RQ-53-01 | CI管道 | P0 | commit触发→自动lint+tsc+test |
| RQ-53-02 | CD管道 | P0 | 部署到staging→验证→部署到production |
| RQ-53-03 | Docker基础设施 | P0 | Dockerfile + docker-compose |
| RQ-53-04 | 环境管理 | P1 | dev/staging/production三套环境配置 |
| RQ-53-05 | 回滚机制 | P1 | 部署失败→自动回滚到上一版 |

## 3. 验收卡

| AC | 场景 | 预期 |
|:---|:-----|:-----|
| AC-53-01 | git commit→自动触发CI | CI运行lint+tsc+test, 全部通过 |
| AC-53-02 | CI通过→自动部署到staging | staging可访问, 版本号正确 |
| AC-53-03 | staging验证通过→部署到prod | prod更新成功 |
| AC-53-04 | 部署失败→自动回滚 | 回滚成功, 服务可用 |
| AC-53-05 | docker-compose up → 全部服务启动 | 6个服务健康检查通过 |

## 4. 基础设施

```yaml
# docker-compose 架构
services:
  api:        # NestJS API
  admin-web:  # Next.js admin
  storefront: # Next.js storefront
  db:         # PostgreSQL
  redis:      # Redis cache
  nginx:      # 反向代理
```
