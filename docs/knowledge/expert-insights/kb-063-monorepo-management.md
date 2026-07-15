# Monorepo管理策略

> 分类: DevOps | 标签: Monorepo, pnpm, Turborepo, 架构管理 | 适用: 全栈开发, 架构师

## 概述

Monorepo(单一代码仓库）将一个项目的所有相关包和服务放在同一Git仓库中管理，与之相对的是多仓库(Multi-repo）方式。Monorepo的优势在于：统一的构建系统、原子性的跨包变更、共享的工具链配置和简化的依赖管理。Shenjiying88系统采用pnpm workspace + Turborepo的Monorepo架构，管理着包括前端(React/Next.js）、后端(NestJS）、共享库(libs）和工具脚本在内的15+个包。

根据Turborepo的白皮书，Monorepo架构可以将跨包变更的合并冲突减少80%，构建缓存命中率提升至90%以上。pnpm的workspace模式使用硬链接(node_modules按需链接而非复制），在Shenjiying88的开发环境中节省了约80%的磁盘空间(从2.3GB降至480MB）。但这种架构也带来了管理挑战——构建编排、包边界控制和权限管理。

## 核心原则

- **原则1: 清晰的包划分策略**: 遵循"分层依赖"原则——Shared Libs(无业务逻辑的通用工具类）→ Feature Libs(业务共享模块，如审计规则引擎）→ Apps(可部署的应用：前端、后端各微服务）。依赖方向严格向下，下层不能依赖上层。Shenjiying88使用Turborepo的 `pipeline` 管理构建顺序。
- **原则2: 严格的包边界控制**: 使用 `@scope/package-name` 命名规范。每个包的 `package.json` 明确声明其外部依赖。使用ESLint的 `import/no-restricted-paths` 规则防止跨包引用——`libs/utils` 不能直接引用 `apps/audit-service` 中的文件。Turborepo的 `dependsOn` 确保构建顺序正确。
- **原则3: lockfile一致性与冻结安装**: 所有依赖通过根目录 `pnpm-lock.yaml` 统一管理，确保所有包的依赖版本一致。CI中执行 `pnpm install --frozen-lockfile` 防止未预期的依赖版本变动。Shenjiying88的PR检查要求 `pnpm-lock.yaml` 与 `package.json` 变更匹配。
- **原则4: Turborepo缓存优化**: 配置Turborepo的构建缓存(`.turbo/cache`），包括远程缓存(共享到S3/OSS使CI也受益）。当源代码未变更时，缓存命中的包直接从缓存恢复构建结果，构建时间从15分钟降至5分钟。Shenjiying88的turbo.json配置了 `outputs: ['dist/**', '.next/**']`。
- **原则5: 版本管理与发布**: Monorepo可以选择统一版本(所有包同步发布）或独立版本(每个包独立版本控制）。Shenjiying88使用Changesets管理版本发布——开发者提交变更时通过 `pnpm changeset` 生成变更描述文件，CI自动根据Changeset文件生成Changelog和发布包。当前阶段由于所有服务协同部署，采用统一版本策略。

## 实践案例（基于shenjiying88项目）

- **案例1: pnpm workspace配置**: `pnpm-workspace.yaml` 定义workspace成员：`packages: ['apps/*', 'libs/*', 'tools/*']`。根目录 `package.json` 包含 `scripts: { "turbo": "turbo run build --filter=./apps/* --parallel" }`。开发者在任意子包目录执行命令时，pnpm自动解析workspace内的包引用(`@shenjiying/audit-core: workspace:*`）。

- **案例2: libs包共享策略**: `libs/` 目录包含：`libs/utils`(通用工具函数——日期格式化、ID生成、加密工具）、`libs/dtos`(共享DTO和API类型定义——前端和后端共享的请求/响应类型）、`libs/audit-core`(审计规则引擎——在多个微服务中使用的核心规则评估逻辑）。通过 `@shenjiying/` scope引用。

## 反模式警示

- **反模式1: Monorepo万能论**: 认为所有项目都应该使用Monorepo。Monorepo适合内部关联紧密的多个项目(微服务、共享库较多的系统）。对于完全独立的项目(之间无代码共享、无依赖关系），Multirepo更合适。Shenjiying88选择Monorepo是因为7个NestJS微服务和2个前端应用共享了3个libs包。

- **反模式2: PR过大**: Monorepo中一个PR可能包含跨多个包的变更。如果PR超过1000行Diff，Review效率会降低。Shenjiying88的PR规则是：Monorepo PR也应尽量控制在400行以内，变更跨5个以上包时需要架构师Review。

## 参考文献

- Turborepo Documentation (2025) "Monorepo Handbook"
- pnpm Documentation (2025) "Workspaces"
- Nx (2024) "Enterprise Monorepo Patterns"
