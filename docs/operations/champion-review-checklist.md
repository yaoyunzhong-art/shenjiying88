# Champion Review 清单 · R7/R8 投票冲刺 (Day 3)

> 创建: Pulse-68 Day 3 (2026-06-28)
> 截止: 2026-06-29 00:30 (UTC+8)
> 目的: Champion 在最后 24h 集中决断,确保 ≥3 Approver 同意 + 0 Champion 否决

---

## 🎯 决策矩阵

| 维度 | R7 (Phase-17 营销+社群) | R8 (Phase-19 AI Code Reviewer) |
|---|---|---|
| Approver 同意 | 3/5 ✅ | 3/5 ✅ |
| Champion 同意 | 待决 | 待决 |
| Champion 否决 | 0 | 0 |
| 状态 | 🟡 等待 Champion | 🟡 等待 Champion |

---

## 👥 Champion 评审分工

> V5.1 启动期 0 Champion 配置,采用"用户直批 + 1 个月试用"特殊路径。
> 当前由用户担任 Champion 角色,根据 Approver 反馈 + 自身判断做出最终决定。

### Champion Review 必查项 (15 条)

#### Phase-17 (R7) 必查

- [ ] **R7.1** T1-T4 (Phase-17 Kickoff) 任务定义清晰? KPI 量化?
- [ ] **R7.2** 13 个任务是否有完整 AC (验收标准)?
- [ ] **R7.3** Pulse-68~71 时间表合理? 是否有人力瓶颈?
- [ ] **R7.4** 营销 + 社群 + 招商三大模块的依赖关系梳理?
- [ ] **R7.5** 与现有 Customer/Member/Order 模块的集成点 OK?

#### Phase-19 (R8) 必查

- [ ] **R8.1** ILLMProvider 抽象层是否合理 (Claude + OpenAI + Local-BGE)?
- [ ] **R8.2** CostTracker 月度预算闸门机制 OK? (硬 100/软 80/预警 80%)
- [ ] **R8.3** Fallback 链 (Claude→OpenAI→Local) 优先级设置合理?
- [ ] **R8.4** BM25 Hybrid 权重 α=0.7/β=0.3/γ=0.1 起点是否合适?
- [ ] **R8.5** Prompt 缓存策略 (TTL=60s) 是否考虑代码评审场景特点?

#### 跨项目必查

- [ ] **X.1** Phase-17 + Phase-19 双线并行的资源分配 OK?
- [ ] **X.2** RAG 架构 (DR-005) 是否在两 phase 中复用?
- [ ] **X.3** 知识库 (78 文件) 已被 Phase-19 RAG 覆盖?
- [ ] **X.4** 与 L2/L3 智能化路线 (DR-003) 是否一致?
- [ ] **X.5** Champion 是否需要触发 Emergency Veto?

---

## 📊 风险评估

### R7 风险点

| 风险 | 等级 | 缓解措施 |
|---|---|---|
| 营销模块与现有 Customer 模块命名冲突 | 🟡 中 | T1 重构时统一 schema |
| 社群裂变 K-factor < 1.0 难以达成 | 🟠 中高 | 设置 K-factor 1.0 为红线,触发回退 |
| 招商模块目标客户画像不清 | 🟡 中 | T1 先做画像,再实施功能 |

### R8 风险点

| 风险 | 等级 | 缓解措施 |
|---|---|---|
| LLM 月度成本超支 | 🟡 中 | 硬上限 $100/月 + Fallback 降级 |
| RAG 检索质量不达预期 | 🟠 中高 | Phase-19 T1 先做 A/B 评估 |
| AI 评审结果不可信 | 🟠 中高 | Phase-19 T3 必须经人工抽检 |

---

## 🚦 Champion 决策路径

### 路径 A: 全票通过 (推荐)
```
R7 + R8 同时批准 → 立即进入实施期 (Pulse-68~71)
```

### 路径 B: 部分批准
```
R7 通过 / R8 待定 → Phase-17 先 kickoff,Phase-19 推迟
R7 待定 / R8 通过 → 罕见 (Phase-19 不依赖 Phase-17)
R7 + R8 都待定 → 紧急会议,1-on-1 沟通阻塞点
```

### 路径 C: 否决
```
R7 否决 → 紧急 retro,72h 内重提 RFC
R8 否决 → 同上
R7+R8 都否决 → 战略层面调整,触发 V5.2 升级
```

---

## 📋 Champion 操作步骤 (24h 内)

### Step 1: 阅卷 (4h)
1. 阅读 R7 RFC 全文 (`.trae/rfcs/R7-phase-17-marketing-community.md`)
2. 阅读 R8 RFC 全文 (`.trae/rfcs/R8-phase-19-ai-reviewer.md`)
3. 阅读 5 位 Approver 的投票意见 (`.trae/rfcs/votes/r7/*.md`)
4. 阅读 Approver 议程 (`docs/standup/approver-standup-2026-06-27.md`)

### Step 2: 提问 (2h)
1. 与 5 位 Approver 1-on-1 沟通(线上 / 异步)
2. 重点关注: 反对意见的技术细节 + 担忧缓解方案
3. 记录 Q&A 到 `.trae/rfcs/votes/champion-qa.md`

### Step 3: 决断 (1h)
1. 根据 15 条必查项打分 (1-5)
2. 风险评估是否可接受
3. 选择决策路径 (A/B/C)
4. 填写 Champion 决定 (`.trae/rfcs/votes/champion-decision.md`)

### Step 4: 公告 (1h)
1. 全员邮件 / Slack 公告结果
2. 更新 `dev-roadmap.md` 标记状态
3. 触发 Day 4 kickoff cron (rfc-finalize.sh)

---

## 🛠 工具脚本

- `scripts/setup-vote-countdown-cron.sh` · 倒计时 cron 安装
- `scripts/rfc-finalize.sh` · 投票截止自动归档 (Day 4)
- `scripts/champion-review-helper.py` · Champion 评分辅助

---

## 🔗 关联文档

- [.trae/rfcs/R7-phase-17-marketing-community.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/.trae/rfcs/R7-phase-17-marketing-community.md)
- [.trae/rfcs/R8-phase-19-ai-reviewer.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/.trae/rfcs/R8-phase-19-ai-reviewer.md)
- [docs/operations/72h-action-plan.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/operations/72h-action-plan.md)
- [knowledge/decision-records/DR-005-rag-architecture.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/decision-records/DR-005-rag-architecture.md)

---

**Championship = 用户(启动期) · 截止 2026-06-29 00:30 (UTC+8)**