# M5 Platform - 数字运动潮玩平台

<p align="center">
  <img src="https://img.shields.io/badge/version-17.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/node-22-green.svg" alt="Node.js">
  <img src="https://img.shields.io/badge/pnpm-10.14.0-orange.svg" alt="pnpm">
  <img src="https://img.shields.io/badge/license-Proprietary-red.svg" alt="License">
</p>

<p align="center">
  <b>企业级数字运动潮玩 SaaS 平台</b>
</p>

<p align="center">
  <a href="#-快速开始">🚀 快速开始</a> •
  <a href="#-核心功能">✨ 核心功能</a> •
  <a href="#-技术架构">🏗️ 技术架构</a> •
  <a href="#-文档">📚 文档</a> •
  <a href="#-贡献指南">🤝 贡献</a>
</p>

---

## ✨ 核心功能

### V17 功能矩阵

| 模块 | 功能 | 状态 | 说明 |
|------|------|------|------|
| **P-30 物流** | 设备巡检、排班管理、库存管理 | ✅ 完成 | 圈梁测试 90.9% |
| **P-31 多租户** | 租户隔离、品牌/门店层级 | ✅ 完成 | 生产就绪 |
| **P-48 营销券** | 券创建、核销、跨门店支持 | ✅ 完成 | 完整营销券系统 |
| **P-49 SEO/GEO** | 多市场、智能自治系统 | ✅ 完成 | 含 AI 引用优化 |
| **P-53 基础设施** | 监控、CI/CD、Terraform | ✅ 完成 | Prometheus/Grafana/Loki |
| **P-54 测试流水线** | CI/CD、E2E、性能测试 | ✅ 完成 | Playwright 7端适配 |
| **P-55 性能优化** | 多级缓存、性能基准 | ✅ 完成 | L1/L2/L3 缓存架构 |

### 功能特性

- 🏢 **多租户架构**: 支持租户、品牌、门店三级隔离
- 🎫 **营销系统**: 完整的优惠券、积分、会员体系
- 📦 **物流管理**: 设备巡检、库存管理、排班调度
- 🌍 **多市场支持**: 支持中国大陆、美国、新加坡、日本、德国等多个市场
- 🤖 **AI 智能**: SEO/GEO 智能优化、AI 引用优化
- 📊 **监控告警**: Prometheus + Grafana + Loki 完整监控栈
- 🚀 **高性能**: 多级缓存、数据库优化、水平扩展

## 🚀 快速开始

### 环境要求

- **Node.js**: 22.x LTS
- **pnpm**: 10.14.0+
- **Docker**: 24.0+
- **Git**: 2.40+

### 1. 克隆项目

```bash
git clone https://github.com/shenjiying88/shenjiying-m5.git
cd shenjiying-m5
```

### 2. 安装依赖

```bash
# 安装项目依赖
pnpm install

# 生成 Prisma Client
pnpm --filter @m5/api prisma:generate
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp apps/api/.env.example apps/api/.env

# 编辑 .env 文件，配置数据库等连接信息
```

### 4. 启动基础设施

```bash
# 启动 PostgreSQL、Redis、RabbitMQ
pnpm docker:up

# 执行数据库迁移
pnpm --filter @m5/api prisma:migrate:dev
```

### 5. 启动开发服务器

```bash
# 启动所有服务
pnpm dev

# 或单独启动
# API 服务
cd apps/api && pnpm dev

# 管理后台
cd apps/admin-web && pnpm dev
```

### 6. 访问服务

| 服务 | 地址 | 说明 |
|------|------|------|
| API | http://localhost:3001 | RESTful API |
| Admin Web | http://localhost:3002 | 管理后台 |
| Storefront | http://localhost:3003 | C端前台 |
| Grafana | http://localhost:3005 | 监控面板 |

## 🏗️ 技术架构

### 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        接入层 (Access Layer)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Nginx     │  │  CDN/WAF    │  │  Rate Limiter│            │
│  │  (SLB)      │  │             │  │              │            │
│  └──────┬──────┘  └─────────────┘  └─────────────┘            │
└─────────┼────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        网关层 (Gateway Layer)                    │
│  ┌──────────────────────────────────────────────────────┐       │
│  │                   API Gateway                        │       │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │       │
│  │  │  Routing    │  │   Auth      │  │  Logging    │  │       │
│  │  │  Transform  │  │   Rate      │  │  Metrics    │  │       │
│  │  │  Circuit    │  │   Limit     │  │  Tracing    │  │       │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      服务层 (Service Layer)                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐              │
│  │    API       │ │  Admin Web   │ │  Storefront  │              │
│  │   Service    │ │    Service   │ │    Service   │              │
│  │  (Node.js)   │ │   (Next.js)  │ │   (Next.js)  │              │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘              │
│         │                │                │                      │
│  ┌──────▼───────┐ ┌──────▼───────┐ ┌──────▼───────┐              │
│  │   Tenant     │ │   Coupon     │ │  Logistics   │              │
│  │   Service    │ │   Service    │ │   Service    │              │
│  │   (Multi)    │ │  (Marketing) │ │   (P-30)     │              │
│  └──────────────┘ └──────────────┘ └──────────────┘              │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      数据层 (Data Layer)                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │  PostgreSQL  │ │    Redis     │ │  RabbitMQ    │            │
│  │  (Primary)   │ │   (Cache)    │ │    (MQ)      │            │
│  │  RDS/Cloud   │ │   Cluster    │ │   Cluster    │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │    MinIO     │ │   Qdrant     │ │  Elasticsearch│           │
│  │  (Object)    │ │ (Vector DB)  │ │  (Search)    │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

### 技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| **运行时** | Node.js | 22 LTS | JavaScript 运行时 |
| **包管理** | pnpm | 10.14.0 | 高效的包管理器 |
| **构建工具** | Turborepo | 2.x | Monorepo 构建系统 |
| **后端框架** | NestJS | 10.x | 企业级 Node.js 框架 |
| **前端框架** | Next.js | 15.x | React 全栈框架 |
| **数据库** | PostgreSQL | 16 | 关系型数据库 |
| **ORM** | Prisma | 5.x | 现代化数据库工具 |
| **缓存** | Redis | 7 | 内存数据存储 |
| **消息队列** | RabbitMQ | 3.13 | 消息中间件 |
| **监控** | Prometheus + Grafana | - | 监控告警系统 |
| **日志** | Loki | - | 日志聚合系统 |
| **容器化** | Docker + Docker Compose | 24+ | 容器编排 |
| **K8s** | Kubernetes | 1.30+ | 容器编排 |
| **IaC** | Terraform | 1.6+ | 基础设施即代码 |

## 📚 文档

- [部署运维手册](https://docs.m5.local/ops/deployment-guide)
- [开发环境搭建](https://docs.m5.local/dev/setup-guide)
- [API 文档](https://docs.m5.local/api)
- [架构设计](https://docs.m5.local/arch)
- [故障排查](https://docs.m5.local/troubleshooting)

## 🤝 贡献指南

### 开发流程

1. **Fork 项目** - 创建个人 Fork
2. **克隆代码** - `git clone https://github.com/your-username/shenjiying-m5.git`
3. **创建分支** - `git checkout -b feature/your-feature`
4. **提交更改** - `git commit -m "feat: add new feature"`
5. **推送分支** - `git push origin feature/your-feature`
6. **创建 PR** - 通过 GitHub 提交 Pull Request

### 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 类型**:
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具/依赖更新

**示例**:
```
feat(coupon): add batch create coupon API

- Support bulk import from CSV
- Add validation for duplicate codes
- Include transaction rollback on error

Closes #123
```

## 📄 许可证

本项目采用 [商业许可证](LICENSE) 授权。

Copyright © 2024 M5 Platform Team. All rights reserved.

---

<p align="center">
  Made with ❤️ by M5 Platform Team
</p>
