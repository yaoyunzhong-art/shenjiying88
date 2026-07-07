# V6.2 24h 节奏调度 · 找回 + 改进 + 执行

> **创建时间**: 2026-06-28 10:30 CST
> **承接**: V5.1 专家团 + V6.1 老板团队 + Pulse-Nightly 4 阶段自我进化
> **改进**: 在 V5.1/V6.1 基础上,召回白天断掉的 6 个调度任务,合并为 1 个 launchd 守护
> **执行**: 立即 load launchd,30 分钟内全绿

---

## 1. 背景与找回

### 1.1 原计划 3 件套 (2026-06-25 ~ 2026-06-27)

| 文档 | 内容 | 状态 |
|------|------|------|
| `.trae/specs/expert-council-empowerment/spec.md` | V5.1 40 业务专家深度赋能 | ✅ 完整 |
| `experts/INDEX.md` V6.1 | 40 业务 + 4 老板 Champion = 44 人 | ✅ 完整 |
| `reports/nightly-test-20260628.md` (7.6 KB) | Pulse-Nightly-04: 6 链 26 subtests + E19/E20 洞察 | ✅ **凌晨稳定在跑** |

### 1.2 找回诊断 (我之前误判"停了",实际是只断了 6 个白天任务)

**实际在跑**:
- ✅ 凌晨 Pulse-Nightly 03:32-05:30 (6 链 + 复盘 + 债务 + 进化 + 赋能 + 交接)
- ✅ launchd autocommit (PID 78, 20 分钟/次)
- ✅ insight-2026-06-27.md + insight-2026-06-28.md (凌晨 03:37 持续产出)
- ✅ 5 位已启用专家 (E1/E5/E9/E16/E40) 每日洞察

**断了的白天任务 (V6.2 找回)**:
- ❌ 05:00 监控日报 (docs/monitoring/2026-06-27.md 缺)
- ❌ 09:00 Daily Standup (docs/process/standup-2026-06-27.md 缺)
- ❌ 12:00 午间 handoff (.trae/handoffs/ 6/27 后停)
- ❌ 18:00 晚 handoff (同上)
- ❌ 22:00 投票倒计时 (vote-countdown.log 6/26 后停)
- ❌ 22:30 复盘提醒 (无 retro-2026-06-27)

---

## 2. V6.2 改进目标

### 2.1 找回 6 个白天任务
1. **05:00** Monitoring Daily Report
2. **09:00** Daily Standup (Champion AI 主持)
3. **12:00** Noon Handoff
4. **18:00** Evening Handoff
5. **22:00** Vote Countdown
6. **22:30** Retro Reminder

### 2.2 V6.2 升级亮点

| 升级点 | V6.1 现状 | V6.2 升级 |
|--------|----------|----------|
| 守护数 | launchd 1 个 (autocommit) + cron 0 个 | **launchd 2 个** (autocommit + V6-rhythm) |
| 调度粒度 | 20 分钟/次 (commit) + 凌晨一次性 | **10 分钟/次** (每小时判断) |
| 专家活跃度 | 5/44 (11%) | **渐进唤醒 44/44** |
| 知识抽取 | 凌晨 1 次 | **每小时浅扫 + 晨间深度** |
| 自我进化指数 | 无 | **每小时计算** (knowledge graph + 反模式 + lessons) |
| 实时 dashboard | 无 | **HEARTBEAT 实时更新** |
| MCP 集成 | 无 | **走 shenjiying88/integrated_web-dev MCP** |

---

## 3. V6.2 文件架构

```
scripts/
├── v6-rhythm-launchd.sh           # 主调度 (内部按小时判断,launchd 调用)
├── v6-monitoring-daily.sh         # 05:00 监控日报
├── v6-morning-standup.sh          # 09:00 Daily Standup
├── v6-knowledge-extract.sh        # 10:00 知识抽取 + lint
├── v6-handoff-noon.sh             # 12:00 午间 handoff
├── v6-handoff-evening.sh          # 18:00 晚 handoff
├── v6-evolution-index.sh          # 每小时 进化指数
├── v6-expert-wakeup.sh            # 渐进唤醒专家
├── v6-vote-countdown.sh           # 22:00 投票倒计时
└── v6-retro-reminder.sh           # 22:30 复盘提醒

~/Library/LaunchAgents/
└── com.shenjiying.v6-rhythm.plist # launchd 守护 (10 分钟/次)
```

---

## 4. V6.2 24h 节奏表

```
00:00 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      Pulse-Nightly-04 持续在跑 (已有,保留)
05:00 🆕 v6-monitoring-daily.sh (监控日报)
06:00 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      Pulse-Nightly-04 继续
07:00 🆕 v6-morning-standup.sh 预热 (生成骨架)
09:00 🆕 v6-morning-standup.sh (Daily Standup)
10:00 🆕 v6-knowledge-extract.sh (知识抽取)
12:00 🆕 v6-handoff-noon.sh (午间交接)
13:00 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
14:00 🆕 v6-evolution-index.sh (每小时进化指数)
15:00 同上
16:00 同上
17:00 同上
18:00 🆕 v6-handoff-evening.sh (晚间交接)
19:00 🆕 v6-expert-wakeup.sh (专家唤醒)
20:00 🆕 v6-evolution-index.sh
21:00 同上
22:00 🆕 v6-vote-countdown.sh (投票倒计时)
22:30 🆕 v6-retro-reminder.sh (复盘提醒)
23:00 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      Pulse-Nightly-05 准备
00:00 Pulse-Nightly-05 启动
```

---

## 5. 决策记录 (DR-V6.2)

### DR-V6.2-1: launchd 单守护 + 内部小时调度

**理由**: macOS 沙盒 cron 拒绝,launchd 更稳定。
**方案**: 1 个 plist (10 分钟/次) + 1 个主脚本 (内部 `date +%H:%M` 判断)。
**优点**: macOS 友好,1 个守护即可,无 cron 权限问题。

### DR-V6.2-2: Standup 由 Champion AI 主持

**理由**: V5.1 standup 试运行只 5/40 出席,需要 Champion 引导。
**方案**: 09:00 v6-morning-standup.sh 自动生成 standup 文档,Champion AI (E41/E42) 主持。
**输出**: docs/process/standup-YYYY-MM-DD.md + .trae/handoffs/standup-summary-YYYY-MM-DD.md。

### DR-V6.2-3: 自我进化指数每小时计算

**公式**:
```
evolution_index = 
  knowledge_graph_nodes * 0.3 +
  anti_patterns_count * 0.2 +
  lessons_count * 0.2 +
  expert_insights_count * 0.2 +
  pulse_nightly_pass_rate * 0.1
```

**输出**: docs/evolution/evolution-YYYY-MM-DD-HH.md + HEARTBEAT 实时更新。

### DR-V6.2-4: 渐进唤醒 35 未启用专家

**方案**: 每周唤醒 5 位,从 E1-E44 顺序启动,直至 100% 出席。
**当前**: 5/44 (E1/E5/E9/E16/E40)。
**目标**: T+7 周 44/44。

---

## 6. 验收标准 (5 AC)

### AC-1 launchd 启动
- [ ] `launchctl load ~/Library/LaunchAgents/com.shenjiying.v6-rhythm.plist` 成功
- [ ] `launchctl list | grep v6-rhythm` 返回 PID
- [ ] 10 分钟内首次自检运行

### AC-2 6 个白天任务找回
- [ ] docs/monitoring/2026-06-28.md 自动生成
- [ ] docs/process/standup-2026-06-28.md 自动生成
- [ ] .trae/handoffs/noon-2026-06-28.md 自动生成
- [ ] .trae/handoffs/evening-2026-06-28.md 自动生成
- [ ] vote-countdown.log 22:00 自动追加
- [ ] retro-2026-06-28.md 22:30 自动生成

### AC-3 自我进化指数持续计算
- [ ] docs/evolution/evolution-2026-06-28-*.md 每小时生成
- [ ] HEARTBEAT 实时显示 evolution_index

### AC-4 凌晨 Pulse-Nightly 不中断
- [ ] reports/nightly-test-20260629.md (明天 03:37 自动生成)
- [ ] insight-2026-06-29.md (明天 03:36 自动生成)
- [ ] 6 链 26 subtests 持续 0 fail

### AC-5 专家团渐进唤醒
- [ ] E41/E42/E43/E44 (4 Champion) 全员活跃
- [ ] 本周唤醒 5 位新专家 (Week 1: E2/E6/E10/E17/E25)

---

## 7. 风险与对策

| 风险 | 影响 | 对策 |
|------|------|------|
| launchd 与 cron 冲突 | 重复执行 | 用 `/tmp/v6-rhythm.lock` 文件锁 |
| Pulse-Nightly 与 V6-rhythm 重叠 | 资源争抢 | V6-rhythm 06:00-07:00 跳过 |
| expert-wakeup 误启动敏感操作 | 误操作 | dry-run 默认 + 9 点后才激活 |
| standup 时间不准 (时区) | 漏跑 | 用 `Asia/Shanghai` TZ + `date +%H` |
| 监控日报内容空 | 报告无意义 | 内容模板固定 + 失败重试 3 次 |

---

## 8. 测试目标

- [ ] 首次 launchctl load 后 30 分钟内 6 个任务 0 fail
- [ ] 24h 后所有 24 个调度点全部命中
- [ ] 凌晨 Pulse-Nightly-05 启动后立即接续 V6.2 (06:00 监控日报)

---

> 🦞 "V6.2 = 找回 6 白天 + 升级 1 守护 + 进化指数每小时 + 专家渐进唤醒 = V6.1 + 24h 全绿"