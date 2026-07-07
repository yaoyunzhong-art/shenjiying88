# Pulse-68 等待期 · Lessons Learned (Day 1)

> 创建: 2026-06-26 01:30 CST · Pulse-68 等待期 Day 1
> 等待期: 2026-06-26 00:30 → 2026-06-29 00:30 (72h)
> 主题: RFC R7/R8 投票中,不能阻塞 → 利用 72h 准备

---

## 🎯 等待期策略

### 为什么需要"主动等待期"?

- V5.1 投票机制 72h 窗口是必要的冷却期
- 但**纯等待是浪费** → 应该并行做"非阻塞"工作
- 优先级:
  - **P0**: 投票监控 + 紧急时干预
  - **P1**: 下一个 phase 脚手架准备
  - **P2**: 知识库扩充 + 自动化增强

---

## 🌟 三大 Lessons Learned

### Lesson 1: **脚手架优于空等** — 让 Pulse-68 启动即可填实

**场景**:
- R7/R8 投票 72h 窗口期
- 之前: 等截止 → 才动手 → 浪费 72h

**修复**:
- Pulse-68 提前准备 CouponV2 + CouponService + 5 e2e stub
- Pulse-71 提前准备 Qdrant + RetrievalModule + index-codebase.py
- Pulse-68 启动后**直接填实业务逻辑**,不需要从 0 写

**预防**:
- 每个 phase Kickoff 前**强制要求**脚手架就绪
- 脚手架 = entity + types + service interface + test stubs + module wiring
- 业务逻辑是 phase 实施的"填字游戏"

**关联**:
- [coupon/ 7 文件](../../../apps/api/src/modules/coupon/) · Coupon 脚手架
- [retrieval/ 9 文件](../../../apps/api/src/modules/retrieval/) · RAG 脚手架
- [patterns/scaffolding-pattern.md](../best-practices/scaffolding-pattern.md) · 脚手架规范

---

### Lesson 2: **后台并行 subagent = 节省 main agent 上下文 ≥50%**

**场景**:
- main agent 上下文窗口有限
- 长任务(调研 + 创建多文件)消耗大量 token
- 阻塞前台 user 交互

**修复**:
- 4 个并行 subagent(调研 / 实施 / 监控 / 文档)
- 每个 subagent 独立完成,主线程只读取 summary
- main agent 上下文保持精简

**预防**:
- 区分"必须 main agent" vs "可以 subagent"
- 必须 main: 用户对话 / RFC 审批 / commit message
- 可以 subagent: 调研 / 文档 / 脚手架 / 监控脚本

**关联**:
- [knowledge/intelligence-engine.md](../../intelligence-engine.md) §3 反馈循环
- [rfcs/voting/R7-approver-appointment.md](../../../../rfcs/voting/R7-approver-appointment.md) §1.2 影响

---

### Lesson 3: **RFC 自动化 = 减少 80% 人工监控**

**场景**:
- V5.1 投票需 72h 监控
- 人工检查: 容易遗漏截止 / 误判状态

**修复**:
- rfc-monitor.py 实时输出 R 状态
- rfc-remind.sh 24h 倒计时 cron
- rfc-finalize.py 自动归档
- standup-prep.py 每日 Standup 自动生成

**预防**:
- 所有 RFC 都必须通过 scripts 跟踪,不能靠人工记忆
- 监控脚本失败 → 立即 fallback 手动 + 报警

**关联**:
- [scripts/rfc-monitor.py](../../../scripts/rfc-monitor.py)
- [scripts/rfc-remind.sh](../../../scripts/rfc-remind.sh)
- [scripts/rfc-finalize.py](../../../scripts/rfc-finalize.py)
- [scripts/standup-prep.py](../../../scripts/standup-prep.py)

---

## 💡 副 Lessons

### Lesson 4: **commit message 必须先 Write 到仓库内路径**
- **现象**: `/tmp/commit-msg.txt` 在 git commit 时报"file not found"
- **修复**: 用 `tmp-commit.txt`(仓库内路径)+ `git commit -F`
- **预防**: 团队成员注意,优先使用仓库内路径,避免 sandbox 隔离

### Lesson 5: **dist/ 必须 .gitignore,否则 45794 行噪声**
- **现象**: apps/api/dist/ 全部被 git tracked,导致 commit 噪声
- **修复**: 添加 `apps/*/dist/` 到 .gitignore + `git rm -r --cached`
- **预防**: 项目初始 setup-gitignore.sh

### Lesson 6: **Qdrant docker-compose 必须 namespace 隔离**
- 不与主 infra 混用 network / volume
- 命名: `shenjiying-qdrant` / `shenjiying_qdrant_storage` / `shenjiying-rag-net`

---

## 📊 等待期 KPI

| 指标 | 目标 | Day 1 实际 |
|---|---|---|
| 脚手架文件数 (Coupon) | 7 | **7** ✅ |
| 脚手架文件数 (RAG) | 12 | **12** ✅ |
| RFC 自动化脚本 | 5 | **5** ✅ |
| 知识库新文档 | 4 | **3** (本 pulse) + 后续 |
| Git commit | 1 | **1** (`1bc8dade3`) ✅ |

---

## 🚀 后续等待期任务 (Day 2 / Day 3)

### Day 2 (2026-06-27)
- [ ] Cron 触发 monitoring-daily.sh (00:00)
- [ ] Standup (09:00, E5 主持)
- [ ] Approver 早会 (E1 主持)
- [ ] 完善 RAG: BM25 sparse vector
- [ ] 完善 Reranker A/B 评估

### Day 3 (2026-06-28)
- [ ] 24h 倒计时 (cron)
- [ ] 12h 倒计时 (cron)
- [ ] 最后一次 Champion review
- [ ] 准备 Pulse-68 Kickoff 议程

### Day 4 (2026-06-29)
- [ ] 00:30 rfc-finalize 自动归档
- [ ] 09:00 Approver 公告
- [ ] 09:30 Phase-17 Kickoff 会议
- [ ] 10:00 T1 启动

---

## 🔗 关联文档

- [dev-roadmap.md](../../../../dev-roadmap.md) · 总路线图
- [dev-evaluation.md](../../../../dev-evaluation.md) · 综合评估
- [debt.md](../../../../debt.md) · 债务追踪
- [knowledge/INDEX.md](../../INDEX.md) · 知识库索引
- [lessons-learned/pulse-67.md](../pulse-67.md) · Pulse-67 retro
- [.trae/specs/phase-17-marketing-community/kickoff.md](../../../../.trae/specs/phase-17-marketing-community/kickoff.md) · Phase-17 Kickoff

---

> 由 Pulse-68 等待期 Day 1 retro 生成
> 下次更新: Day 2 / Day 3 持续记录