# 24h 开发节奏架构 (Day/Night Pattern)

> 创建: Pulse-68 (2026-06-26)
> 依据: 用户最新指示"0:00-7:00 后台全自动 + 7:00 后按原计划"
> 目标: 充分利用 AI 自动化能力,实现"夜间自进化 + 日间协作"的现代 SaaS 节奏

---

## 🎯 核心原则

### 用户原话
> "每天的 0:00-7:00 为会议、学习、测试、优化、充实知识库时间,你要全自动在后台进行。
> 7 点以后是按照你之前的开发计划进行。
> 当然我的建议,要建立在你的科学规划之上。"

### 科学依据
1. **夜间 7 小时**(0:00-7:00) = 高峰自动化窗口
   - 用户不在场,后台可执行大量独立任务
   - 不阻塞用户白天的开发节奏
   - 7 小时足够完成 5 类任务的并行编排
2. **日间 16 小时**(7:00-23:00) = 用户协作窗口
   - 用户参与度高,适合决策 / 实施 / Review
   - 需要用户直批的 RFC / 关键决策集中在此时段
3. **晚间 1 小时**(23:00-24:00) = 复盘 + 规划
   - 用户 review 白天成果
   - 调整明日计划

### 哲学
- **AI 不是替代人,而是放大人的决策带宽**
- 夜间 AI 把"知识沉淀 / 自动化 / 测试"完成 80%
- 日间人只需要做"决策 / 实施 / Review"20% 的关键路径

---

## 🌙 夜间 (0:00-7:00) 自动任务编排

### Phase 1 (0:00-1:00) · 智库自进化 (60 min)

| 任务 | 工具 | 输出 |
|---|---|---|
| 1.1 知识图谱生成 | `knowledge_graph_generator.py` | `_graph.md` + `_graph_stats.json` |
| 1.2 Lessons 抽取 | `lessons_extractor.py` | `_suggested.md` + `_extraction_stats.json` |
| 1.3 知识库统计 | `knowledge-stats.py` | 实时统计报告 |
| 1.4 自动 commit | git | "Pulse-XX 夜间智库自进化" |

**价值**: 把当天新增 commits 自动提炼为 lessons + patterns,沉淀到知识库

### Phase 2 (1:00-2:00) · 测试与 TSC (60 min)

| 任务 | 工具 | 输出 |
|---|---|---|
| 2.1 单测覆盖率 | `vitest --coverage` | `coverage.json` |
| 2.2 TSC api | `pnpm typecheck` (apps/api) | tsc-api.log |
| 2.3 TSC admin-web | `pnpm typecheck` (apps/admin-web) | tsc-admin.log |
| 2.4 Lint | `pnpm lint` | lint-api.log |

**价值**: 夜间自动跑全量测试 + 类型检查,白天只需 review 报告

### Phase 3 (2:00-4:00) · 优化与重构 (120 min)

| 任务 | 工具 | 输出 |
|---|---|---|
| 3.1 性能基准 | `pnpm bench` | bench.log |
| 3.2 LLM 成本分析 | `cost-report.py` | llm-cost.log |
| 3.3 死代码扫描 | `ts-unused-exports` | unused-exports.log |
| 3.4 Bundle 分析 | `pnpm build --stats` | bundle.log |

**价值**: 不自动重构,只生成报告,白天人工决策

### Phase 4 (4:00-6:00) · 会议与同步 (120 min)

| 任务 | 工具 | 输出 |
|---|---|---|
| 4.1 Approver standup 自动生成 | `auto-standup.py` | standup-{date}.md |
| 4.2 RFC 状态扫描 | `rfc-monitor.py` | rfc-monitor.log |
| 4.3 Phase 进度报告 | `phase-progress-report.py` | progress.log |
| 4.4 Champion 决策模拟 | `champion-decision-helper.py` | champion-sim.log |
| 4.5 LLM 自动应用 lessons | `ai-lesson-applicator.py` | ai-lessons.log |

**价值**: 模拟 40 专家团 standup,白天只需 review 决议

### Phase 5 (6:00-7:00) · 总结与交接 (60 min)

| 任务 | 工具 | 输出 |
|---|---|---|
| 5.1 夜间报告 | `nightly-summary.py` | `handoff-{date}.md` |
| 5.2 白天任务清单 | `daytime-task-planner.py` | `daytime-tasks.md` |
| 5.3 用户通知 | Slack / Email | 起床通知 |

**价值**: 7:00 用户起床第一眼看到 3 分钟 handoff 报告

---

## ☀️ 日间 (7:00-23:00) 协作节奏

### 早晨 (7:00-9:00)
- **07:00 起床 review handoff 报告** (3 min)
- **07:30 决策关键路径** (Approver review / Champion 签字)
- **08:30 standup** (10 min,基于夜间自动 standup)
- **09:00 开始今日开发**

### 上午 (9:00-12:00) · 主任务
- **09:00-12:00** Phase-17 T1-T4 实施 (Coupon 跨门店)
- 实时 Approver review (E1/E6/E9/E10/E16)

### 午间 (12:00-13:00)
- **休息 + 复盘**
- 检查上午 review 反馈

### 下午 (13:00-18:00) · 次任务
- **13:00-15:00** Phase-17 T5-T7 (营销触发器)
- **15:00-18:00** Phase-19 RAG 索引器预研

### 晚间 (18:00-22:00) · 收尾
- **18:00-19:00** 晚餐
- **19:00-21:00** Phase-17 T8-T13 (社群+招商+仪表板)
- **21:00-22:00** Champion 签字 + 提交 RFC

### 深夜 (22:00-24:00) · 复盘
- **22:00-23:00** 当日复盘
- **23:00-23:30** 明日计划
- **23:30-24:00** 提交夜间任务触发器

---

## 🔧 实施脚本清单

| 脚本 | 用途 | 调用时机 |
|---|---|---|
| [scripts/nightly-jobs.sh](../scripts/nightly-jobs.sh) | 夜间 7h 自动编排 | cron 0:00 |
| [scripts/daytime-handoff.sh](../scripts/daytime-handoff.sh) | 日间 handoff 报告 | cron 7:00 |
| [scripts/setup-rhythm-cron.sh](../scripts/setup-rhythm-cron.sh) | 配置 24h cron | 一次性 |
| [scripts/auto-standup.py](../scripts/auto-standup.py) | 自动 standup 生成 | nightly Phase 4 |
| [scripts/phase-progress-report.py](../scripts/phase-progress-report.py) | Phase 进度报告 | nightly Phase 4 |
| [scripts/nightly-summary.py](../scripts/nightly-summary.py) | 夜间总结 | nightly Phase 5 |
| [scripts/daytime-task-planner.py](../scripts/daytime-task-planner.py) | 白天任务规划 | nightly Phase 5 |

---

## 📊 自动化覆盖度

| 任务类别 | 夜间自动化 | 日间人工 | 自动化率 |
|---|---|---|---|
| 知识库扩充 | 80% (自动 commit) | 20% (人工 review) | **80%** |
| 测试 & TSC | 100% (自动跑) | 10% (人工修) | **90%** |
| 优化建议 | 100% (报告生成) | 30% (人工决策) | **70%** |
| Standup 模拟 | 100% (AI 生成) | 10% (人工 review) | **90%** |
| Phase 实施 | 0% (人工) | 100% | **0%** |
| RFC 决策 | 0% (人工) | 100% | **0%** |
| **平均** | - | - | **66%** |

---

## 🎯 KPI

| 指标 | 当前 | 目标 (Pulse-72) |
|---|---|---|
| 夜间任务成功率 | 0% | ≥90% |
| 知识库日增长 | +1 文件 (人工) | +5 文件 (混合) |
| 测试覆盖率 | TBD | ≥80% |
| TSC 错误 | TBD | 0 |
| 日间用户决策数 | 未知 | ≤5 个/日 |
| Phase 17 进度 | 0% | 100% (Pulse-71) |

---

## 🔗 关联文档

- [.trae/specs/phase-17-marketing-community/](../.trae/specs/phase-17-marketing-community/) · Phase-17 三件套
- [docs/operations/72h-action-plan.md](72h-action-plan.md) · 72h 等待期计划
- [docs/operations/phase-17-kickoff-checklist.md](phase-17-kickoff-checklist.md) · Phase-17 Kickoff
- [knowledge/intelligence-engine.md](../knowledge/intelligence-engine.md) · 智能化引擎
- [dev-roadmap.md](../../dev-roadmap.md) · 总路线图

---

## 🚀 启动方式

```bash
# 1. 安装 cron 配置
bash scripts/setup-rhythm-cron.sh

# 2. 验证 cron 配置
crontab -l | grep "nightly\|daytime"

# 3. 手动测试夜间任务(可选)
bash scripts/nightly-jobs.sh

# 4. 手动测试日间 handoff(可选)
bash scripts/daytime-handoff.sh
```

---

**节奏宣言**: 
> 🌙 夜间让 AI 沉淀知识 / 跑测试 / 模拟会议
> ☀️ 日间让用户聚焦决策 / 实施 / Review
> 🔄 24h 形成"自进化飞轮"