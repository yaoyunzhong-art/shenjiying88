# Operations — 运维操作手册

> **模块**: 运维手册 | **位置**: `docs/operations/`
>
> M5 数字运动潮玩平台的生产运维操作手册集合。涵盖部署流程、环境管理、Git 工作流、架构约束、合规审查等全链路运维规范。

## 目录结构

```
docs/operations/
├── README.md                              # 本文档
├── 72h-action-plan.md                     # 72小时应急行动计划
├── approver-appointment-certificate.md     # 审批人任命证书
├── champion-appointment-certificate.md     # Champion 任命证书
├── champion-review-checklist.md            # Champion 审查清单
├── deployment-guide.md                    # 生产部署运维手册
├── development-rhythm.md                  # 开发节奏规范
├── environment-separation.md              # 环境分离 (dev/staging/prod)
├── foundation11-git-workflow.md           # Foundation-11 Git 工作流
├── phase-17-kickoff-checklist.md          # 阶段17启动清单
├── r7-r8-approval-checklist.md            # R7-R8 审批清单
├── r11-architecture-hard-constraints.md   # R11 架构硬约束
├── r12-middleware-engine-specs.md         # R12 中间件引擎规范
├── r13-business-app-requirements.md       # R13 业务应用需求
├── r14-cexperience-marketing-hard-constraints.md  # R14 体验营销硬约束
├── r15-social-growth-eco-governance.md    # R15 社交增长与生态治理
├── r16-optimization-matrix.md             # R16 优化矩阵
├── r17-pre-access-checklist.md            # R17 上线前检查清单
├── r18-requirement-dev-mapping.md         # R18 需求开发映射
├── r19-compliance-gate.md                 # R19 合规门禁
├── r19-compliance-report-mechanism.md     # R19 合规报告机制
├── r20-final-signoff.md                   # R20 最终签核
└── r21-expert-empowerment-flow.md         # R21 专家赋能流程
```

## 核心职责

### 🚀 部署运维
- **[deployment-guide.md](deployment-guide.md)** — 生产部署架构、环境准备、部署流程、回滚策略
- **[environment-separation.md](environment-separation.md)** — dev / staging / prod 三环境分离规范与配置对比

### 🔄 开发流程
- **[development-rhythm.md](development-rhythm.md)** — 开发节奏与迭代规范
- **[foundation11-git-workflow.md](foundation11-git-workflow.md)** — Foundation-11 Git 分支与合并策略

### ✅ 审批与审查
- **[r7-r8-approval-checklist.md](r7-r8-approval-checklist.md)** — R7-R8 上线审批
- **[champion-review-checklist.md](champion-review-checklist.md)** — Champion 代码审查清单
- **[phase-17-kickoff-checklist.md](phase-17-kickoff-checklist.md)** — 阶段启动检查

### 🏛️ 架构与规范
- **[r11-architecture-hard-constraints.md](r11-architecture-hard-constraints.md)** — 架构硬约束
- **[r12-middleware-engine-specs.md](r12-middleware-engine-specs.md)** — 中间件引擎规范
- **[r13-r18 系列文档](.)** — 业务需求、优化矩阵、上线前检查、合规门禁、签核、专家赋能

### 🚨 应急响应
- **[72h-action-plan.md](72h-action-plan.md)** — 72小时应急行动计划

### 🔐 合规
- **[r19-compliance-gate.md](r19-compliance-gate.md)** / **[r19-compliance-report-mechanism.md](r19-compliance-report-mechanism.md)** — 合规门禁与报告机制
- **[r20-final-signoff.md](r20-final-signoff.md)** — 最终签核

## 相关文档

- [docs/README.md](../README.md) — 文档体系总览
- [docs/deployment-guide.md](../deployment-guide.md) — 完整部署指南
- [docs/monitoring/](../monitoring/) — 监控告警配置
- [docs/troubleshooting/](../troubleshooting/) — 故障排查指南
- [infra/](../../infra/) — 基础设施代码（K8s / Terraform / Docker）
- [scripts/](../../scripts/) — 自动化运维脚本
- [DEPLOY-README.md](../../DEPLOY-README.md) — 部署总览
- [COMPOSE-DEPLOY-RUNBOOK.md](../../COMPOSE-DEPLOY-RUNBOOK.md) — Docker Compose 部署手册

## Overview (EN)

This directory contains **Operations Runbooks** for the M5 Digital Sports Trendy Play Platform, covering production deployment, environment separation, Git workflow, architecture constraints, compliance review, and emergency response procedures.

Key documents:
- **[deployment-guide.md](deployment-guide.md)** — Production deployment architecture & procedures
- **[environment-separation.md](environment-separation.md)** — Dev/Staging/Prod environment separation
- **[72h-action-plan.md](72h-action-plan.md)** — 72-hour emergency action plan
- **R7-R21 series** — End-to-end governance from approval to signoff

---

**文档版本**: v1.0.0 | **最后更新**: 2026-07-23 | **维护团队**: M5 Platform Team
