# .trae — Trae AI 辅助开发系统

> **模块**: AI 辅助开发引擎 | **位置**: `.trae/`
>
> 神机营 SaaS 的 AI 增强引擎，承载 Trae IDE 下双线协同时代的所有配置、任务调度、规格文档、阶段回顾与交付物。总 40+ 文件/子目录，是项目"AI 副驾驶"的控制台。

## 目录结构

```
.trae/
├── specs/                  # 规格文档（Phase-17 至 Phase-34）
├── tasks/                  # 任务卡片（T164-T180+）
├── handoffs/               # 双线交接文档（heartbeat/standup/sprint handoff）
├── execution/              # 执行计划 & Sprint Board
├── briefs/                 # 研发简报 & Master Brief
├── reports/                # 各阶段报告 & 交付报告
├── learnings/              # 回顾文档 & Retro
├── audit/                  # 审计输出（40 角色分析 / v12 综合审计）
├── compliance/             # 合规预检（偏差注册表 + 覆盖率矩阵）
├── documents/              # PRD 文档（TOB 官网 / Sports Ants / 租户网关）
├── review-export/          # Review 导出
│
├── DEVELOPMENT-PLAN*.md    # 开发主计划书（v3/v4）
├── HANDSHAKE.md            # 双线握手协议
├── HEARTBEAT.md            # AI 代理心跳总览
├── DUAL_LINE_SYNC_REPORT*.md  # 双线同步报告
└── V16_WRAP_UP.md          # v16 总结
```

## 核心用途

| 目录 | 职责 |
|------|------|
| `specs/` | 全平台规格 + 阶段规格（Phase-17 至 Phase-34） |
| `tasks/` | Task 级拆分，含 P0 技术债 / 功能任务 / 迁移任务 |
| `handoffs/` | 双线协作交接：AI ↔ 人类的语境传递 |
| `execution/` | Sprint 执行计划与每日 Board |
| `briefs/` | 研发 Brief，用于 AI 代理上下文注入 |
| `compliance/` | 合规预检与偏差跟踪 |
| `audit/` | 架构审计 & 合规审计原始输出 |

## 使用指南

- **查阅阶段计划**: `specs/phase-*` — 每个 Phase 的详细规格与任务划分
- **查看当前任务**: `tasks/T*.md` — 编号从 T164 开始的增量任务
- **双线协作**: 阅读 `HANDSHAKE.md` 了解 AI ↔ 人类的协作协议
- **合规检查**: `compliance/deviation-registry.json` + `coverage-matrix.json`
- **新增规范**: 新阶段规划 → 在 `specs/` 新建 phase-N 目录 → 在 `tasks/` 创建 Task 卡片 → 更新本 README

## 相关链接

- [docs/](../docs/) — 项目文档体系根目录
- [docs/README.md](../docs/README.md) — 文档索引
