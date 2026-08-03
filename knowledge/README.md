# 🧠 knowledge — 知识库

## 模块概述

`knowledge/` 是神机营 SaaS 平台的**结构化知识沉淀中心**，由 Pulse 系列自动化管线驱动，持续汇聚所有 Phase 的实施经验、专家洞察、架构决策、设计模式、反模式、编码最佳实践和自动化工具。目标是构建一个可查询、可复用、可演进的工程知识体系，赋能后续开发决策，避免团队重复踩坑。

本库由 Pulse-65（2026-06-25）初始化，经 40+ 轮脉冲持续积累，当前维护 **140+ 条知识条目**，涵盖 7 个子库，并配套 Python 自动化脚本支撑知识的提取、统计和图谱生成。

## 核心文件结构

```
knowledge/
├── README.md                            # 本文档
├── INDEX.md                             # 📋 知识库索引（子库速览+统计看板）
├── _graph.md                            # 🕸 知识图谱（条目间关联可视化）
├── _graph_stats.json                    # 📈 图谱统计（节点/边数、密度）
├── intelligence-engine.md               # 🤖 智能引擎说明
├── bigants-brand-knowledge-base.md      # 🏢 大顽家品牌知识库
├── copyright-verification-report.md     # ⚖️ 版权验证报告
├── dual-review-report.md                # 🔍 双重评审报告
├── stability-pulse-182.md               # 📡 稳定性脉冲报告
│
├── lessons-learned/                     # 📝 经验教训（Phase retrospective 产出）
├── patterns/                            # 🔷 设计模式（已验证的可复用方案）
├── anti-patterns/                       # 🚫 反模式（踩坑记录+根因分析）
│   └── v4/                             #   第四代反模式体系（39条）
├── expert-insights/                     # 👥 专家洞察（40人专家团反馈）
├── decision-records/                    # 📜 架构决策记录（ADR）
├── best-practices/                      # ✅ 编码与测试最佳实践
├── templates/                           # 📄 知识条目模板
├── testing-planning/                    # 🎯 测试规划文档
└── automations/                         # 🤖 知识管理自动化脚本
    ├── README.md
    ├── extract-knowledge.py             # 知识提取器
    ├── knowledge-stats.py               # 知识统计器
    ├── knowledge_graph_generator.py     # 知识图谱生成器
    └── lessons_extractor.py             # 经验教训提取器
```

## 子库概览

| 子库 | 条目数 | 说明 |
|------|:------:|------|
| **lessons-learned/** | 18 | 各 Phase retro 产出的关键教训 |
| **patterns/** | 24 | 验证通过的设计模式（含 E2E/情感累积/OTA/许可证矩阵） |
| **anti-patterns/** | 49 | 踩坑实录 + v4 体系（39 条子条） |
| **expert-insights/** | 13 | E1~E45 专家洞察聚合 |
| **decision-records/** | 8 | DR-001~DR-008 重大架构决策 |
| **best-practices/** | 20+ | 编码规范、测试规范、提交规范 |
| **automations/** | README + 4 脚本 | 知识管理自动化工具 |

## 使用方式

### 查阅知识

```bash
# 浏览索引
cat knowledge/INDEX.md

# 查看最新经验教训
ls -t knowledge/lessons-learned/ | head -5

# 搜索知识条目
grep -rl "关键词" knowledge/ --include="*.md"
```

### 添加知识

- **新发现的反模式** → 放入 `anti-patterns/`，参考模板 `templates/`
- **验证通过的设计方案** → 放入 `patterns/`，附带适用场景说明
- **重大架构决策** → 启动 ADR 流程，格式参考 `decision-records/`
- **专家反馈** → 存入 `expert-insights/`，关联到对应 Pulse

### 自动化维护

```bash
# 生成知识图谱
python knowledge/automations/knowledge_graph_generator.py

# 统计知识库健康度
python knowledge/automations/knowledge-stats.py

# 从 Pulse 日志提取 lessons learned
python knowledge/automations/lessons_extractor.py
```

## 注意事项

- **知识库即代码**：所有条目均为 Markdown 文件，纳入 Git 版本管理，变更伴随 Code Review
- **持续沉淀**：每个 Pulse 结束后自动触发知识提取，确保经验不过期
- **关联追踪**：每条知识条目应标注来源（Phase 编号 / Expert ID / DR 编号），形成可追溯的知识网络
- **反模式优先**：新发现的问题先入 `anti-patterns/`，修复后再视情况提炼为 `patterns/` 模式
- 自动化脚本依赖 `knowledge/automations/README.md` 中的环境配置

> 🧠 **知识库守则**：不记录的知识等于没发生过，不归档的经验等于白踩的坑。
