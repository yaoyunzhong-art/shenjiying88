# 📋 Decision Records — 架构决策记录

## 📌 目录说明

`decision-records/` 目录存放项目的 **ADR（Architecture Decision Records，架构决策记录）**。每条记录以 `DR-{编号}` 格式命名，存档了对系统架构、技术选型、数据模型等关键决策的上下文、方案对比、选择理由及影响评估。

## 📂 已有内容索引

| 文件名 | 标题 | 决策概述 |
|--------|------|----------|
| `DR-019-multimodal-embedding-dim.md` | 多模态 Embedding 分维策略 | Phase-23 T81 多模态 embedding 升级，定义向量维度分治策略 |
| `DR-020-hybrid-search-rrf.md` | 混合搜索 RRF 融合策略 | 向量搜索与关键词搜索的倒数排名融合（RRF）方案设计 |
| `DR-021-agent-react-loop.md` | Agent ReAct 循环设计 | 代理交互的 ReAct（推理+行动）循环架构与上下文窗口管理 |
| `DR-022-graphrag-pipeline.md` | GraphRAG 流水线 | 图增强检索生成流水线设计，含知识图谱构建与查询策略 |
| `DR-023-ab-test-significance.md` | A/B Test 显著性检验 | A/B 测试统计学显著性检验方案，含样本量计算与决策阈值 |

### 编号说明

- `DR-001` ~ `DR-018` 为早期决策记录（可能存在历史仓库或其他位置）
- `DR-019` 起为 Phase-23 阶段及之后的决策记录
- 每个编号全局唯一，不做复用或归档

## 🚀 使用指引

1. **查找决策**：按编号或关键词在 `DR-*.md` 文件中搜索，文件名中的 `-{关键词}` 部分即为主题描述
2. **理解架构演变**：按编号顺序阅读即可了解项目技术演进脉络
3. **参与新决策**：新增决策时，请先确认无冲突编号，按 `DR-{NNN}-{kebab-case-title}.md` 格式创建
4. **决策模板**：建议包含以下章节：
   - **Status**（状态: Accepted / Deprecated / Superseded）
   - **Date**（决策日期）
   - **Context**（决策背景与问题描述）
   - **Decision**（最终选择及理由）
   - **Consequences**（影响与权衡）

## 📝 维护说明

- 决策一旦 **Accepted**，请勿直接修改条目；如需变更，请创建新的 DR 并在上下文中引用旧编号
- 过时或已被替代的决策应在文件头标注 **Superseded by DR-NNN**
- 保持文件名与标题的一致性，便于索引和搜索
- 建议定期审查 DR 清单，标记已过时或需更新的条目

---

*最后更新: 2026-07-23*
