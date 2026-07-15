# CI/CD流水线设计

> 分类: DevOps | 标签: CI/CD, GitHub Actions, 自动化, 持续交付 | 适用: DevOps, 开发

## 概述

CI/CD(持续集成/持续部署）是现代软件开发的基础设施，它将代码从提交到部署的流程自动化，减少人工操作带来的错误和延迟。一个精心设计的CI/CD流水线应该做到：代码提交后自动构建和测试，合并到主分支后自动部署到staging环境，通过验收后一键部署到生产环境。Shenjiying88系统建立在GitHub Actions之上，结合Docker镜像构建和多环境部署策略。

根据DORA 2025年DevOps状态报告，一流DevOps团队(deploy frequency>daily）的部署变更失败率(Change Failure Rate）低于5%，而低效团队(deploy frequency<monthly）的失败率超过45%。CI/CD是缩短Lead Time for Changes和降低部署失败率的核心手段。Shenjiying88的目标是将代码提交到生产部署的Lead Time控制在2小时以内。

## 核心原则

- **原则1: 流水线即代码(Pipeline as Code）**: 所有CI/CD配置存储在版本控制系统中，与代码一同Review和审计。Shenjiying88的 `.github/workflows/` 目录包含多个流水线定义：`pr-check.yml`(PR校验流水线）、`main-build.yml`(主分支构建）、`deploy-staging.yml`(预发布部署）、`deploy-prod.yml`(生产部署）。
- **原则2: 早期反馈，快速失败**: 流水线的每个阶段按检测速度排序——最快速的检查放在最前面。Lint和类型检查(30秒）→ 单元测试(3分钟）→ 构建(2分钟）→ 集成测试(12分钟）→ 安全扫描(5分钟）→ E2E测试(20分钟）。如果PR阶段失败，开发者在5分钟内就能得到反馈。
- **原则3: 不可变构建产物(Immutable Artifact）**: 每次CI构建生成一个唯一标签的Docker镜像(`sha:${GIT_SHA}`或语义版本号+构建号）。这个镜像在staging验证后原封不动地部署到生产环境。不可以在不同环境使用不同版本的代码。这一策略消除了"在我的机器上能运行"的差异问题。
- **原则4: 渐进式部署**: 流量从staging → canary(5%流量）→ 逐步扩容到100%。每个阶段自动执行健康检查和集成测试，任何阶段失败则自动回滚。Shenjiying88的canary部署先向一个Nginx实例引导5%的流量，监控5分钟的P99错误率和延迟。
- **原则5: 可审计的部署日志**: 每次部署记录：构建ID、部署人(而非系统自动）、部署时间、部署前版本、部署后版本、数据库迁移状态。所有部署操作通过GitHub Actions日志可追溯。Shenjiying88的部署日志会同步到审计系统。

## 实践案例（基于shenjiying88项目）

- **案例1: PR校验流水线**: 当开发者创建或更新PR时触发 `pr-check.yml`。步骤包括：(1) `Install dependencies` — `pnpm install`； (2) `Lint & Type Check` — `pnpm lint && pnpm typecheck`； (3) `Unit Tests` — `pnpm test:unit -- --coverage`； (4) `Build` — `pnpm build`； (5) `Security Scan` — `npm audit` + SonarQube SAST。通过所有步骤后才能合并。

- **案例2: 生产环境的蓝绿部署**: `deploy-prod.yml` 启动一个新版本的Docker容器(蓝色），切换Nginx upstream到新容器，运行健康检查(3次/秒的HTTP 200检测持续30秒），如果全部通过则关闭旧容器(绿色）；如果健康检查失败则自动切回旧容器并通知团队。切换过程对用户无感。

## 反模式警示

- **反模式1: 流水线超长(>60分钟）**: CI流水线超过30分钟会显著降低开发效率——开发者提交代码后长时间等待反馈。解决方案是分层执行：PR阶段只运行快速检查(10分钟内），合并到main后运行全量测试。并行化测试步骤也是缩短流水线时间的关键手段。

- **反模式2: 直接部署到生产环境跳过staging**: "时间太急，直接部署到生产快一些"是最危险的运维决策之一。staging环境的验证可以捕获大量生产环境才会暴露的问题(配置差异、环境变量缺失、数据库迁移兼容性）。省掉staging等同于不做降落检查就起飞。

## 参考文献

- DORA (2025) "2025 State of DevOps Report"
- GitHub Actions Documentation (2025) "CI/CD Best Practices"
- Jez Humble, David Farley (2010) "Continuous Delivery"
