# 最佳实践知识库

> 最佳实践知识库汇总了 shenjiying88 项目在开发、测试、部署、安全等各环节沉淀的标准化实践文档，是团队遵循的统一开发规范与质量基线。

---

## 📂 目录结构

```
knowledge/best-practices/
├── README.md                          # 本文件 — 模块概述
├── api-design.md                      # API 设计规范
├── code-review-checklist.md           # Code Review 检查清单
├── commit.md                          # Git 提交信息规范
├── cross-module-e2e-checklist.md      # 跨模块 E2E 检查清单
├── database-migration.md              # 数据库迁移规范
├── dependency-management.md           # 依赖管理规范
├── documentation-standards.md         # 文档规范标准
├── e2e-pattern.md                     # E2E 测试模式
├── error-handling.md                  # 错误处理规范
├── llm-integration.md                 # LLM 集成最佳实践
├── logging-standards.md               # 日志记录标准
├── multi-tenant-isolation.md          # 多租户隔离方案
├── performance-optimization.md        # 性能优化指南
├── scaffolding-pattern.md             # 脚手架设计模式
├── security-checklist.md              # 安全清单
├── testing-strategy.md                # 测试策略
└── testing.md                         # 测试基础规范
```

---

## 🚀 快速开始

```bash
# 浏览所有最佳实践
ls knowledge/best-practices/

# 查看 Code Review 检查清单
cat knowledge/best-practices/code-review-checklist.md

# 查看 API 设计规范
cat knowledge/best-practices/api-design.md
```

---

## 🧠 核心功能

本知识库覆盖以下开发实践领域：

| 领域 | 文档 | 适用阶段 |
|------|------|----------|
| **编码规范** | Scaffolding Pattern, API Design, Commit | 编码阶段 |
| **质量保障** | Code Review Checklist, Testing, E2E Pattern | 代码审查与测试 |
| **安全合规** | Security Checklist, Multi-Tenant Isolation | 安全审查 |
| **数据管理** | Database Migration, Dependency Management | 数据变更 |
| **文档标准** | Documentation Standards, Logging Standards | 文档输出 |
| **性能治理** | Performance Optimization, Error Handling | 性能调优 |
| **测试体系** | Testing Strategy, Cross-Module E2E Checklist | 全流程测试 |
| **AI 工程** | LLM Integration | AI 功能开发 |

---

## ⚠️ 注意事项

1. **优先遵守** — 在提交代码前，建议对照相关 checklist 逐项检查（尤其是 `code-review-checklist.md` 和 `security-checklist.md`）
2. **持续更新** — 最佳实践随项目演进不断迭代，新需求可能催生新的规范文档
3. **交叉引用** — 多个文档间有强关联（如 `testing.md` → `testing-strategy.md` → `e2e-pattern.md`），建议按链路阅读
4. **自动化集成** — 部分规范已嵌入 CI 流程（如 commit lint / ESLint / 测试覆盖率门禁），请勿绕过
5. **新人入门** — 新成员建议按以下顺序阅读: `scaffolding-pattern.md` → `api-design.md` → `error-handling.md` → `testing.md`
