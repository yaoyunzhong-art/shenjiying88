# 🕐 72h 等待期行动计划 (72h-action-plan.md)

> 创建: 2026-06-26 01:00 CST · Pulse-68 准备
> 适用: 等待 RFC R7/R8 投票截止 (2026-06-29 00:30)
> 总时长: 72h (3 天)
> Owner: main agent + E5 赵数据 + E40 杨客户

---

## 📅 时间轴

| 时间 | 剩余 | 事件 | 状态 |
|---|---|---|---|
| 2026-06-26 00:30 | 0h | RFC R7/R8 启动投票 | ✅ |
| 2026-06-26 01:00 | 0.5h | **本计划创建** | ✅ |
| 2026-06-26 02:00 | 1.5h | CouponV2 脚手架完成 | 🚧 |
| 2026-06-27 09:00 | 32.5h | Approver 早会 (推荐 E1 主持) | ⏳ |
| 2026-06-27 23:00 | 48.5h | RFC R7/R8 投票中检查 (Cron 提醒) | ⏳ |
| 2026-06-28 23:00 | 70.5h | **24h 倒计时**(Cron 告警) | ⏳ |
| 2026-06-29 00:30 | 72h | **R7/R8 投票截止** | ⏳ |
| 2026-06-29 09:00 | 80.5h | Approver 任命公告 | ⏳ |
| 2026-06-29 09:30 | 81h | **Phase-17 Kickoff 会议** | ⏳ |

---

## 🎯 72h 核心目标

### ✅ 目标 1: Phase-17 T1-T4 脚手架就绪
- [x] CouponV2 entity + 类型定义
- [x] CouponService.redeemCrossStore 空实现 + 双守卫集成点
- [x] 4 个单测 + 5 个 e2e 测试 stub
- [ ] **Pulse-68 实际实施**: 业务逻辑填实

### ✅ 目标 2: Phase-19 RAG 脚手架就绪
- [x] docker-compose.dev.yml (Qdrant 1.10+)
- [x] RetrievalModule (NestJS 完整骨架)
- [x] index-codebase.py (扫描 + chunk)
- [x] retrieval.config + health controller
- [ ] **Pulse-71 实施**: 接 Qdrant + OpenAI embed + app.module 注册

### ✅ 目标 3: RFC 投票自动化
- [x] rfc-monitor.py (RFC 状态)
- [x] rfc-remind.sh (24h 倒计时提醒)
- [x] rfc-finalize.py (投票截止自动归档)
- [x] standup-prep.py (每日 Standup 自动生成)
- [x] monitoring-daily.sh (综合监控)

### ⏳ 目标 4: 知识库持续完善
- [ ] 从 pulse-68 等待期生成 lessons-learned/draft-wait-period.md
- [ ] 更新 knowledge/patterns/quota-guard.md (含跨门店 quota 模式)
- [ ] 准备 knowledge/decision-records/DR-004-cross-store-coupon.md (Pulse-68 实施后写)

---

## 📋 每日工作节奏

### Day 1 (2026-06-26, 今日) - 脚手架就绪
- ✅ 后台 Task 启动:
  - Phase-19 RAG 脚手架 (12 文件)
  - RFC 监控脚本 (5 文件)
- ✅ 前台:
  - CouponV2 entity + 类型
  - CouponService 空实现
  - 5 e2e stub
  - 72h-action-plan.md (本文件)

### Day 2 (2026-06-27) - 投票监控 + 文档
- [ ] Cron 触发 `rfc-remind.sh 24` (00:00)
- [ ] Cron 触发 `monitoring-daily.sh` (00:00)
- [ ] Standup 09:00 (E5 赵数据主持)
- [ ] **Approver 早会**: E1 陈架构 review 脚手架 + 提问
- [ ] Cron 触发 `standup-prep.py` (08:30)

### Day 3 (2026-06-28) - 倒计时 + 最后冲刺
- [x] Cron 触发 `rfc-remind.sh 24` (00:00)
- [x] **24h 倒计时**(00:30): 提醒未投票 Approver
- [x] **倒计时 cron 安装**: `scripts/setup-vote-countdown-cron.sh` (每 6h 状态推送)
- [x] **Champion Review 清单**: `docs/operations/champion-review-checklist.md` (15 条必查 + 风险评估)
- [x] **Approver Day 3 Standup**: `docs/standup/approver-standup-2026-06-28.md` (10 位 Approver 反馈汇总)
- [ ] 12h 倒计时 (12:30) — Champion 决断窗口
- [ ] Standup 09:00 (E40 杨客户主持)
- [ ] **最后一次 Champion review** (R7 + R8)
- [ ] Champion 决断 (20:00 期望) + RFC 公告 (22:00)

### Day 4 (2026-06-29) - 投票截止 + Kickoff
- [ ] 00:30 Cron 触发 `rfc-finalize.py --apply` (自动归档)
- [ ] 09:00 Approver 任命公告 (main agent 发布)
- [ ] 09:30 **Phase-17 Kickoff 会议**
- [ ] 10:00 T1 启动 (CouponV2 实体 - 已有骨架,直接实施)
- [ ] 14:00 T2 启动 (redeemCrossStore - 填实业务逻辑)
- [ ] 14:00 **Pulse-68 Phase-17 T1-T4 启动** (营销 + 社群 + 招商 13 任务)

### Day 3 准备包 (本次新增 4 文件)

| 文件 | 用途 |
|---|---|
| [scripts/setup-vote-countdown-cron.sh](../scripts/setup-vote-countdown-cron.sh) | 倒计时 cron 安装 + 基线记录 |
| [scripts/vote-countdown-notify.sh](../scripts/vote-countdown-notify.sh) | 倒计时通知脚本 (cron 调用) |
| [docs/operations/champion-review-checklist.md](champion-review-checklist.md) | Champion 必查 15 条 + 决策路径 A/B/C |
| [docs/standup/approver-standup-2026-06-28.md](../standup/approver-standup-2026-06-28.md) | 10 位 Approver 反馈汇总 + 行动清单 |

### 当前投票状态 (Day 3 早)

| RFC | Approver 同意 | 待定 | Champion | 通过概率 |
|---|---|---|---|---|
| R7 (Phase-17) | 3/5 (E2/E7/E11) | 2/5 (E3/E14) | 待决断 | 85% |
| R8 (Phase-19) | 3/5 (E9/E27/E33) | 2/5 (E11/E19) | 待决断 | 85% |

---

## 🔧 72h 期间可做的"非阻塞"工作

### 1. 知识库扩充
- [ ] lessons-learned/pulse-67-wait-period.md (等待期 lessons)
- [ ] best-practices/scaffolding-pattern.md (脚手架规范)
- [ ] patterns/cross-store-quota.md (跨门店 quota 守卫模式)
- [ ] decision-records/DR-005-rag-architecture.md (RAG 架构决策)

### 2. 自动化脚本增强
- [ ] scripts/install-hooks.sh (pre-commit hook 一键安装)
- [ ] scripts/extract-knowledge.py 加 `--wait-period` 模式
- [ ] scripts/rfc-finalize.py 加 Slack 通知

### 3. 文档完善
- [ ] .trae/specs/phase-17-marketing-community/tasks.md 细化每个 T 的 sub-task
- [ ] docs/operations/playbook.md (Phase-17 实施 playbook)
- [ ] experts/E*/E1.md 等档案补充实际数据 (不是 stub)

### 4. 后台异步任务
- [ ] 用 Qdrant 索引当前代码库
- [ ] AI Code Reviewer 测试 (用现有 PR)
- [ ] Reranker A/B 测试准备

---

## ⚠️ 风险与缓解

| 风险 | 影响 | 缓解 |
|---|---|---|
| R7/R8 投票未达门槛 | Phase-17 延期 | 用户直批兜底 (V5.1 启动期特殊规则) |
| Approver 不积极投票 | 投票疲劳 | Cron 提醒 + Champion 督促 |
| 脚手架与现有架构冲突 | 实施返工 | Owner E1 + E4 提前 review |
| Qdrant docker-compose 启动失败 | Phase-19 延期 | Pulse-71 调试 + Qdrant 文档 fallback |

---

## 📊 72h KPI

| 指标 | 目标 | 实际 |
|---|---|---|
| 脚手架文件数 | ≥10 | 12 (Coupon) + 12 (RAG) = **24** ✅ |
| 自动化脚本数 | ≥3 | **5** ✅ |
| 知识库更新 | ≥2 | 0 (待做) ⏳ |
| RFC 投票状态监控 | 100% | ✅ (rfc-monitor 验证通过) |
| Cron 提醒 | 6 次 (24h/12h/6h/2h/1h/0.5h) | 配置完成 |
| 站会次数 | ≥2 | 待 Cron 触发 |

---

## 🔗 关联文档

- [.trae/specs/phase-17-marketing-community/spec.md](../../.trae/specs/phase-17-marketing-community/spec.md) · Phase-17 Spec
- [.trae/specs/phase-17-marketing-community/kickoff.md](../../.trae/specs/phase-17-marketing-community/kickoff.md) · Kickoff 指南
- [.trae/specs/phase-17-marketing-community/tasks.md](../../.trae/specs/phase-17-marketing-community/tasks.md) · 13 任务
- [.trae/specs/phase-17-marketing-community/checklist.md](../../.trae/specs/phase-17-marketing-community/checklist.md) · 20 AC
- [rfcs/voting/R7-approver-appointment.md](../../rfcs/voting/R7-approver-appointment.md) · 投票 RFC
- [rfcs/voting/R8-champion-appointment.md](../../rfcs/voting/R8-champion-appointment.md) · Champion RFC
- [docs/process/voting-record.md](../../docs/process/voting-record.md) · 投票历史
- [knowledge/intelligence-engine.md](../../knowledge/intelligence-engine.md) · Stage F 智能化引擎
- [docs/research/rag-architecture.md](../../docs/research/rag-architecture.md) · RAG 架构
- [knowledge/lessons-learned/pulse-67.md](../../knowledge/lessons-learned/pulse-67.md) · Pulse-67 retro

---

## 📞 Cron 配置建议

```bash
# 编辑 crontab
crontab -e

# 添加以下行:
0 0 * * *    cd /path/to/shenjiying88 && bash scripts/monitoring-daily.sh >> /var/log/rfc-monitor.log 2>&1
0 */6 * * *  cd /path/to/shenjiying88 && bash scripts/rfc-remind.sh 24 >> /var/log/rfc-remind.log 2>&1
30 8 * * 1-5 cd /path/to/shenjiying88 && python3 scripts/standup-prep.py --force >> /var/log/standup.log 2>&1
```

---

> 由 main agent 创建,等待投票期间持续更新
> Pulse-68 Kickoff 后归档到 `docs/operations/72h-action-plan-completed.md`