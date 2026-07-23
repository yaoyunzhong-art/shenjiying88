# Docs — 项目文档

> **模块**: 项目文档体系 | **位置**: `docs/`
>
> M5 数字运动潮玩平台的完整文档仓库，涵盖架构设计、API 规范、部署运维、合规审计、知识库等全部文档。共 40+ 子目录，是项目的"知识中枢"。

## 目录结构

```
docs/
├── acceptance/          # 验收标准 & 测试用例
├── api/                 # API 文档 & 接口规范
├── audit/               # 审计日志 & 合规审计记录
├── compliance/          # 合规文档 & 安全合规方案
├── daily/               # 日报 & 日常记录
├── development/         # 开发指南 & 环境搭建
├── diagrams/            # 架构图 & 流程图
├── dispatch/            # Dispatch 工单 & 任务调度
├── dispatches/          # 历史分发记录
├── evolution/           # 平台演化日志
├── expertise/           # 领域专家知识
├── experts/             # 专家目录
├── knowledge/           # 知识库（300+ 篇文档）
├── learning/            # 学习资料 & 培训
├── meetings/            # 会议纪要
├── modules/             # 模块级文档
├── monitoring/          # 监控配置 & 告警规则
├── openapi/             # OpenAPI 定义（Swagger）
├── operations/          # 运维操作手册
├── phases/              # 阶段文档
├── prd/                 # 产品需求文档（PRD）
├── process/             # 流程规范
├── quality/             # 质量报告
├── releases/            # 发布说明
├── reports/             # 项目报告
├── research/            # 调研报告
├── standup/             # 站会记录
├── troubleshooting/     # 故障排查指南
│
├── deployment-guide.md              # 部署指南
├── production-deployment-guide.md   # 生产部署指南
├── production-deployment-readiness-report.md  # 生产部署就绪报告
├── full-platform-requirements.md    # 全平台需求文档
├── evolution-log.md                 # 演化日志
├── heartbeat.md                     # 心跳文档
└── work-summary-*.md                # 工作周报
```

## 核心文档速览

### 🏗️ 架构 & 规范
| 文档 | 说明 |
|------|------|
| [full-platform-requirements.md](full-platform-requirements.md) | 全平台需求规格 |
| [openapi/](openapi/) | RESTful API 定义与 Swagger 文档 |
| [evolution-log.md](evolution-log.md) | 平台架构演进记录 |
| [modules/](modules/) | 各业务模块架构文档 |

### 🚀 部署运维
| 文档 | 说明 |
|------|------|
| [deployment-guide.md](deployment-guide.md) | 完整部署指南 |
| [production-deployment-guide.md](production-deployment-guide.md) | 生产环境部署流程 |
| [operations/](operations/) | 日常运维操作手册 |
| [monitoring/](monitoring/) | 监控告警配置 |
| [troubleshooting/](troubleshooting/) | 常见故障排查 |

### 🔐 安全合规
| 文档 | 说明 |
|------|------|
| [6-8-compliance-rectification-list.md](6-8-compliance-rectification-list.md) | 合规整改清单 |
| [6-8-foundation-compliance-charter.md](6-8-foundation-compliance-charter.md) | 合规宪章 |
| [compliance/](compliance/) | 合规相关文档 |
| [audit/](audit/) | 审计记录 |

### 📚 知识库
| 目录 | 说明 |
|------|------|
| [knowledge/](knowledge/) | 300+ 篇领域知识文档 |
| [expertise/](expertise/) | 领域专家知识体系 |
| [learning/](learning/) | 学习培训资料 |

## 文档规范

- **中文为主**: 除代码和术语外，文档以中文编写
- **Markdown**: 全部使用 `.md` 格式，Github Flavored Markdown
- **目录索引**: 每个子目录应有自己的 README 或索引文件
- **版本关联**: 文档标注关联的项目版本号

## 相关链接

- [README.md](../README.md) — 项目主文档
- [scripts/](../scripts/) — 自动化脚本集
- [infra/](../infra/) — 基础设施代码
- [DECISION-RECORDS](../decision-records/) — 架构决策记录
