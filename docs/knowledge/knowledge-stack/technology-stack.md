# 🏗️ shenjiying88 技术栈全景

> 最后更新: 2026-07-14 11:12
> 维护: 🦞 龙虾哥

---

## 一、Monorepo 架构

```
shenjiying88/                          pnpm workspace root
├── apps/
│   ├── api/            @m5/api        NestJS 后端 (Core)
│   ├── admin-web/      @m5/admin      Next.js 管理后台
│   ├── storefront-web/ @m5/store      Next.js 门店前台
│   ├── tob-web/        @m5/tob        Next.js TOB门户
│   ├── miniapp/        @m5/miniapp    微信/抖音小程序
│   ├── app/            @m5/app        Expo React Native (通用)
│   └── mobile/         @m5/mobile     Expo React Native (移动端)
├── packages/           共享库
│   ├── ui/             @m5/ui         统一UI组件
│   ├── types/          @m5/types      共享类型定义
│   ├── sdk/            @m5/sdk        API SDK
│   └── domain/         @m5/domain     领域模型
└── docs/               知识库
```

**构建工具**: pnpm workspaces + Turborepo (并行流水线)
**缓存策略**: Turbo Remote Cache (CI/本地共享)

## 二、技术栈明细

### 后端 (apps/api)

| 层 | 技术 | 用途 |
|---|------|------|
| 框架 | NestJS 11 | 模块化后端架构 |
| ORM | Prisma 6 | 数据库建模/迁移 |
| 数据库 | PostgreSQL 16 | 主业务数据库 |
| 缓存 | Redis 7 | 热数据缓存/会话 |
| 消息队列 | RabbitMQ | 异步任务/事件总线 |
| 时序库 | ClickHouse | 运营分析/报表 |
| 向量库 | Qdrant | AI语义搜索/RAG |
| API风格 | REST (OpenAPI 3.0自动生成) | 接口标准 |
| 认证 | JWT + OAuth2 + 微信OAuth | 多云认证策略 |
| 实时通信 | WebSocket (Socket.IO) | 门店实时推送 |

### 前端

| 应用 | 框架 | 状态管理 |
|:----|:----|:---------|
| admin-web | Next.js App Router | React Context + SWR |
| storefront-web | Next.js App Router | Zustand |
| tob-web | Next.js App Router | Zustand |
| @m5/app | Expo (React Native) | Zustand |
| @m5/mobile | Expo (React Native) | Zustand |
| @m5/miniapp | 微信原生 + Taro | 小程序stores |

### AI/ML 栈

| 组件 | 技术 | 用途 |
|:----|:-----|:-----|
| LLM | OpenAI / DeepSeek / Ollama | 智能客服/内容生成 |
| RAG | Qdrant + 混合检索 | 知识库检索增强 |
| 双引擎 | Rule Engine + Diagnosis Engine | 业务规则+诊断推理 |
| 推荐 | 协同过滤 + 内容推荐 | 商品/活动推荐 |

### 基础设施

| 组件 | 方案 |
|:----|:-----|
| 容器化 | Docker |
| CI/CD | GitHub Actions |
| 部署 | 多平台 (launchd/systemd) |
| 监控 | Prometheus + Grafana |
| 日志 | ELK (Elasticsearch + Logstash + Kibana) |

## 三、核心架构设计

### 1. 多租户隔离
- **方案**: Shared Table + tenant_id (已验证)
- **演进**: 混合模式 (关键表Schema隔离)
- **中间件**: 自动注入tenant context (X-Tenant-Id Header)

### 2. 模块化架构
- **核心**: 112个API模块 → 25个Phase组
- **分层**: Entity(DTO) → Service → Controller → Module
- **圈梁**: PRD→代码→测试→审计 四道箍

### 3. 开发模式
- **三级体系**: 👑大飞哥(需求) → 🦞龙虾哥(规划/验收) → 🐜树哥(代码)
- **验收脉冲**: 30min自动验证 TSC + 测试
- **专家审查**: 6道Gate签署 (架构/业务/数据/体验/合规/治理)

### 4. 测试体系
- **三层**: L1单元 → L2流程/角色 → L3跨模块E2E
- **8角色视角**: 店长/前台/HR/安监/导玩员/运行/团建/营销

---

*🦞 龙虾哥 · 技术栈文档 · 2026-07-14*
