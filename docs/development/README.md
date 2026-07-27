# Development — 开发指南

> **模块**: 开发指南 | **位置**: `docs/development/`
>
> M5 数字运动潮玩平台的开发环境搭建指南与开发者上手文档。帮助新开发者快速完成环境配置、启动项目并进入开发工作流。

## 核心文件

| 文件 | 说明 |
|------|------|
| [setup-guide.md](setup-guide.md) | 完整开发环境搭建指南 |

### setup-guide.md 包含

- **系统要求** — 硬件规格、操作系统支持（macOS / Linux / Windows+WSL2）
- **基础工具安装** — Homebrew / Node.js 22 / pnpm / Docker / VS Code
- **项目初始化** — 克隆仓库、安装依赖、生成 Prisma Client
- **环境配置** — `.env` 变量配置、Docker 基础设施（PostgreSQL / Redis / RabbitMQ）
- **开发工作流** — 启动服务、代码规范（lint/format/typecheck）、测试、Git 工作流
- **调试技巧** — VS Code 调试配置、Postman API 测试、日志查看
- **常见问题** — 依赖安装、Prisma 生成、端口冲突、Docker 故障

## 核心职责

1. 提供 **零障碍的开发环境搭建** 流程，涵盖 macOS / Linux / Windows 三大平台
2. 规范 **开发工作流**，包括启动、测试、代码审查、Git 提交标准
3. 提供 **调试工具配置** 和 **常见问题速查**，减少开发者卡顿时间

## 相关文档

- [docs/README.md](../README.md) — 文档体系总览
- [docs/api/](../api/) — API 接口规范
- [infra/terraform/](../../infra/terraform/) — Terraform 基础设施
- [DEPLOY-README.md](../../DEPLOY-README.md) — 部署总览
- [DEVELOP-PLAN-v7.md](../../DEVELOP-PLAN-v7.md) — 开发计划 v7
- [DEVELOPMENT_CONSTITUTION.md](../../DEVELOPMENT_CONSTITUTION.md) — 开发宪章

## Quick Start (EN)

This directory contains the **Development Guide** for the M5 Digital Sports Trendy Play Platform.

- **[setup-guide.md](setup-guide.md)** — Complete environment setup guide covering macOS, Linux (Ubuntu) and Windows+WSL2
- Includes: system requirements, tool installation, project initialization, dev workflow, debugging tips, and FAQ

---

**文档版本**: v1.0.0 | **最后更新**: 2026-07-16 | **维护团队**: M5 Platform Team
