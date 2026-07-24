# 📋 rfcs — RFC（Request For Comments）文档目录

## 模块简介

`rfcs/` 是神机营 SaaS 平台**RFC（Request For Comments）文档存放目录**。RFC 是平台重大技术决策、架构变更、流程改进的正式讨论与评审文档，遵循提议→评审→共识→落地的流程闭环。

> RFC 的核心思想：任何重要的变更，先写文档再动手。

## 目录结构

```
rfcs/
├── README.md             # 本文档
└── voting/               # 🗳️ 已提交评审的 RFC 投票文档
    ├── template.md       #   RFC 文档模板
    ├── R6-phase-17.md    #   R6 Phase 17 相关 RFC
    ├── R7-approver-appointment.md    #   R7 审批人任命 RFC
    ├── R8-champion-appointment.md    #   R8 主理人任命 RFC
    └── R9-full-platform-requirements.md  # R9 全平台需求 RFC
```

## 文档规范

RFC 文档通常包含以下内容板块：

| 板块 | 说明 |
|------|------|
| **标题与元数据** | 提案编号、作者、创建日期、状态（草案/投票/通过/否决/废弃） |
| **动机** | 为什么要做这件事？解决什么痛点？ |
| **提案内容** | 具体的技术方案、架构设计、流程变更描述 |
| **替代方案** | 考虑的备选方案及弃选理由 |
| **影响与风险** | 对现有系统的潜在影响、回滚方案 |
| **投票与决议** | 评审小组成员的投票结果和最终决定 |

## 使用方式

```bash
# 查看所有 RFC 提案
ls -la rfcs/voting/

# 查看 RFC 模板（新建提案参考）
cat rfcs/voting/template.md

# 查看某个已通过的 RFC 详情
cat rfcs/voting/R9-full-platform-requirements.md
```

## 流程说明

1. **起草**：使用 `voting/template.md` 模板撰写 RFC
2. **提交**：`rfcs/voting/{提案编号}-{标题}.md` 格式命名
3. **评审**：评审小组投票表决（赞成 / 反对 / 弃权）
4. **决议**：通过 → 进入实施；否决 → 记录存档；需修改 → 修订后重新评审
5. **归档**：已完结的 RFC 保留在本目录作为历史记录

## 注意事项

- 所有 RFC 使用 Markdown 格式撰写
- 文件名建议使用 `R{轮次}-{英文简短标题}.md` 格式，如 `R6-phase-17.md`
- 已通过的 RFC 不得再修改内容——如有变更，请重新发起新的 RFC
- 废弃或否决的 RFC 建议在文档头部标注状态后保留，不删除
