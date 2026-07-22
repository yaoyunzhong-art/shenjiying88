# 🧠 记忆系统（Memory）

神机营 SaaS 各轮次开发的**运行日志、环境状态、回滚决策与进化证据**归档系统。

## 简介

memory/ 目录承载了神机营从 V1 到 V22 所有轮次开发的实时记录。每个 `.md` 文件对应一个开发日或一个里程碑事件，包含：当日开发进度、测试通过/失败明细、生产环境切换记录、回滚状态与关键决策。是项目历史回溯、问题排查、发布审计和知识延续的中枢。

## 目录结构

```
memory/
├── YYYY-MM-DD.md         # 每日开发日志（核心）
├── handoff.md             # 最新交接稿（生产状态/验收结果/标准流程）
├── regression-status.md   # 回归测试状态记录
├── base-gap-plan.md       # 八底座补齐路线图
├── fail-list.md           # 失败文件清单
├── archives/              # 历史归档压缩包
│   ├── heartbeat-2026-03.tar.gz
│   ├── email-compact-2026-03-04.tar.gz
│   ├── reports-2026-03-29-subdir.tar.gz
│   ├── reports-compact-2026-03-04.tar.gz
│   ├── email-2026-03-04.tar.gz
│   ├── 2026-05-early/
│   ├── daily-reports-2026-03-04.tar.gz
│   ├── reports-2026-03-04.tar.gz
│   ├── hourly-reports-2026-04.tar.gz
│   └── cycle-6-archive-2026-05-15.tar.gz
└── evolution/             # 进化快照系统
    └── snapshots/         # V周期快照文件
        ├── 2026-07-19-0957.md
        ├── 2026-07-19-1002.md
        ├── 2026-07-19-1105.md
        ├── 2026-07-19-1131.md
        ├── 2026-07-19-1400.md
        ├── 2026-07-19-1729.md
        └── 2026-07-19-1915.md
```

## 核心文件说明

### 每日日志（YYYY-MM-DD.md）

以日期命名的文件，记录每日开发完整过程，包含：
- 当日 commits 统计与目标对比
- 各 Agent（🐜树哥）完成模块清单
- TSC 状态（全系统 TypeScript 编译错误数）
- 测试通过/失败明细（test count / fail count）
- 关键决定（Key Decisions）
- 次日计划（Next Steps）
- 科学审计评分
- 知识卡片数

### handoff.md

**最新交接稿**（2026-07-19 更新），面向龙虾哥的同步文档，包含：
- 当前生产状态（域名、TLS、Config、K8s Deployment）
- 线上验收结果（health/ping 及各前端页面 200 验证）
- 线上问题经验库（阿里云欠费、ACR 令牌过期、域名切换注意事项）
- 标准开发流程（Release Bundle 驱动）
- 未来 14 天推进方向
- 本周任务板
- 权威文件索引
- ***仅追加、不回滚***

### regression-status.md

回归测试状态文档（2026-05-18 更新），记录 Round 79 开始时的失败文件与失败测试统计。

### base-gap-plan.md

八底座补齐路线图（2026-05-18），目标：8 底座全部 ≥75%，AI 底座达 L2。包含 Phase 1-3 任务矩阵。

### fail-list.md

失败文件清单，持续记录所有尚未通过的测试文件路径，供回归攻关使用。

### archives/

历史归档目录，包含各轮次的心跳日志、邮件报告、每日/小时报告、cycle-6 等压缩包。按时间范围与类型组织，用于冷存储和审计追溯。

### evolution/snapshots/

**进化快照系统**。在同一研发周期内按小时粒度记录系统快照，包含：
- V21 Day1 多时间点快照（7 个快照文件）
- 每个快照包含：commits 统计、TSC 7App 状态、已完成模块清单、测试统计
- 用于趋势分析、问题回溯、发布候选验证

## 核心概念

### 1. V 周期（V Cycle）
每个大版本为一个 V 周期（如 V21、V22），持续数天至两周。每个 V 周期结束时产出可发布的 Release Bundle。

### 2. 快照（Snapshot）
在开发日的关键时间点（如每 2-3 小时或里程碑达成时）记录的系统状态定格。支持趋势分析和回滚点选择。

### 3. 每日收状（Daily Close）
每个开发日结束时汇总当日产出，写入 YYYY-MM-DD.md，作为持续交付的证据链。

### 4. TSC 0 铁律
全系统 TypeScript 编译错误数必须为 0。每轮提交前必须验证 TSC 0，否则视为未完成。

### 5. 回归状态（Regression Status）
持续追踪失败测试文件清单，确保总失败数不再增长，逐步归零。

## 使用指南

### 查看当日状态
```bash
cat memory/$(date +%Y-%m-%d).md
```

### 查看最新交接信息
```bash
cat memory/handoff.md
```

### 查看当前回归状态
```bash
cat memory/regression-status.md
```

### 创建新日记条目
1. 按模板 `YYYY-MM-DD.md` 格式创建文件
2. 记录：commits 统计、关键模块、决定、风险
3. 如需要，同步在 evolution/snapshots/ 下创建快照

### 归档历史日志
当日志超过 30 天后，可压缩归档到 archives/ 目录：
```bash
tar czf memory/archives/YYYY-MM-early.tar.gz memory/YYYY-MM-*.md
```

## 维护规则

- **仅追加（Append Only）**：所有日志文件禁止删除或覆盖重写——新信息只追加在末尾
- **快照不删除**：evolution/snapshots/ 下的快照仅追加，用于全量回溯
- **每日必写**：每开发日结束时至少更新一条日记
- **交接文档保持最新**：handoff.md 在每次生产发布或重大架构变化后立即更新
