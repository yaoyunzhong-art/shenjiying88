# 📋 V12 开发计划（正式版）

> **TOGAS 五环自进化体系 · 店A倒计时20天(8/1)**
> 版本: V12 · 基于2026-07-11全天130 commits + 36连胜 + cron架构升级
> V11评估: 程序4.8/5 · 内容2.5/5（↑从1.2）· 综合3.0/5（↑从2.2）

---

## 一、V11核心问题 → V12根治方案

| # | 11项V11承诺 | 07-11实际 | 状态 | V12根治 |
|:-:|-------------|:---------:|:----:|---------|
| 1 | maxConcurrentRuns=8 | ✅ 已上线 | ✅ | 维持 |
| 2 | 8安全基线 | ❌ 0/8 | 🔴 | **本周必须启动基线#1(AuthGuard)** |
| 3 | 50%业务功能开发 | 树哥产出89/130为后端测试，仅4个前端页面 | ⚠️ 测试过剩 | **P-35/P-36前端派单作为P0** |
| 4 | 30%Phase预算拆解 | P-35/P-36后端✅前端⬜，其余0% | ⚠️ 进度滞后 | **周任务明确到Phase级** |
| 5 | E49 22天部署路线图 | 0天进展 | 🔴 | **D1-D3 Docker化立即启动** |
| 6 | AI决策日志 | ai-rule-engine持续开发中 | 🟡 有进展 | AI模块继续推进 |
| 7 | 用户验收(第21遍) | 旧mode=main空跑 → 已改isolated | ✅ 修复 | 今晚首次执行 |
| 8 | 新专家E45-E54赋能 | 专家档54个已就位，但3批自学产出的66%靠补录 | ⚠️ | **自学cron已验证isolated有效** |
| 9 | 会议产出不丢失 | 07:50/08:30/09:30等7个cron原是main空跑(2ms) | 🔴 | **→isolated+绝对路径已修复** |
| 10 | 知识库日采 | 11:00跑了2次(force+auto)，6库更新 | ✅ | 维持 |
| 11 | 店A仪表盘更新 | 仅07-11创建时的空行 | ⚠️ | **18:00 cron已改isolated会自更新** |

---

## 二、⚡ 关键架构变更（V12核心）

### 2.1 Cron架构：三大模式硬化

```
模式A: isolated agentTurn (产文件) — 占90%
  ├─ 07:30 🤖 安全基线 → security-baseline-check.md
  ├─ 07:50 🤖 AI简报 → ai-brief.md
  ├─ 08:00 🧠 晨学 → morning-expert-brief.md + morning-review.md
  ├─ 08:30 🐜 派单树哥 → phase-progress.md追加
  ├─ 09:00 👥 晨会 → morning-review.md
  ├─ 09:30 📋 对齐检查 → alignment-check.md
  ├─ 10:30 🧪 前端体验 → frontend-review.md
  ├─ 10:30 🔄 对齐进化 → alignment-evolution.md
  ├─ 11:00 📚 日采 → 6知识库更新
  ├─ 12:00 🐜 午检 → midday-check.md
  ├─ 14:00 🧠 午学 → afternoon-expert-brief.md
  ├─ 15:00 👥 午会 → afternoon-review.md
  ├─ 15:30 🔄 复盘 → post-dev-review.md
  ├─ 17:00 🔄 晚间检查 → evening-prep.md
  ├─ 18:00 🔐 部署检查 → store-a-readiness.md更新
  ├─ 20:00 👥 晚会 → evening-signoff.md + evening-expert-brief.md
  ├─ 20:45 🦞 晚学评审 → evolution-log.md + daily-brief.md
  ├─ 21:00 🦞 用户验收 → user-acceptance.md
  ├─ 23:00 📡 日终汇总 → daily-brief.md + V(N+1)草案
  ├─ 🐜 10min脉冲 → 随机模块开发
  ├─ 🦞 30min验收 → phase-progress.md追加
  └─ 🕵️ 侦察兵/竞品 → 知识库追加

模式B: main systemEvent (无需文件) — 占10%
  ├─ ✅ shenjiying-hourly-keepalive (心跳)
  ├─ ✅ 🖥️ 资源监控 (CPU/MEM告警)
  └─ ✅ 🔄 队列深度告警

🚫 零个cron属于"main但需产文件" — 全部修复
```

### 2.2 绝对路径铁律

```
所有 isolated cron prompt 必须以如下开头：

【重要】PROJECT=/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88
所有文件读写必须使用绝对路径 $PROJECT/...
完成后需 cd $PROJECT && git add + commit

✅ 已覆盖所有 isolated cron (25个)
```

### 2.3 会议/自学产出流（已验证）

```
08:00 🧠 晨学 ──→ morning-expert-brief.md ──→ 09:00 👥 晨会读取
09:00 👥 晨会 ──→ morning-review.md ──→ 08:30 🐜 派单读取
14:00 🧠 午学 ──→ afternoon-expert-brief.md ──→ 15:00 👥 午会读取
15:00 👥 午会 ──→ afternoon-review.md ──→ 15:30/17:00复盘读取
20:00 👥 晚会 ──→ evening-signoff.md ──→ 23:00日终读取
20:45 🦞 晚学 ──→ evolution-log更新 ──→ 23:00日终汇总
```

---

## 三、Phase 进度 + 周度目标（截至07-11收盘）

### 3.1 当前状态

| Phase | 名称 | 完成度 | Owner | 截止日 | 状态 | V12周目标(7/12-7/18) |
|:-----:|:-----|:-----:|:-----:|:------:|:----:|:--------------------:|
| P-53 | **部署DevOps** | **0%** | E49贺 | **7/18❌** | 🔴 | **D1-D3 Docker化完成** |
| P-31 | **多租户隔离** | **0%** | E1+E44 | **7/20** | 🔴 | **启动: TenantQuotaService exports修复** |
| P-35 | **收银店A** | **60%** | E13李 | 7/15❌已过 | 🟡 | **完成前端验收+walkthrough** |
| P-36 | **会员店A** | **55%** | E40杨 | 7/15❌已过 | 🟡 | **完成前端验收+walkthrough** |
| P-38 | **财务对账** | **0%** | E10郑 | **7/22** | 🔴 | 启动entity+service |
| P-37 | **库存采购** | **0%** | E35褚 | **7/20** | 🔴 | 启动entity |
| P-47 | 品牌运营 | 0% | E30周 | 7/25 | 🔴 | — |
| P-48 | 联名券 | 0% | E33王 | 7/30 | 🔴 | — |
| P-30 | SSE后勤 | 0% | E25牛 | 7/25 | 🔴 | — |
| P-49 | 开放平台 | 0% | E44 | 7/30 | 🔴 | — |
| **S基线** | **8项安全** | **0%** | E2+E38 | **7/20** | 🔴 | **启动基线#1 AuthGuard** |

### 3.2 紧急优先级

| P0（本周必做） | 原因 |
|:--------------|:------|
| P-53 部署Docker化 | 7/18截止，只剩7天，0%完成 |
| P-31 多租户 TenantQuotaService exports修复 | 阻塞所有跨租户e2e，午会已标记🔴 |
| P-35/P-36 前端页面验收 | 后端已完，前端0产出，店A倒计时20天 |
| 安全基线#1 AuthGuard | 7/13截止（已过2天），渗透测试未启动 |

---

## 四、📊 07-11 收盘数据

| 指标 | 值 | 趋势 |
|:-----|:---:|:----:|
| **今日总commits** | **134** | 📈 稳定 |
| 🐜 树哥提交 | 89 | 📈 |
| 🦞 验收脉冲 | 36次(pulse#293→#328) | 🔥 |
| **连续全绿** | **36连胜🏆🏆🏆🏆** | 🔥🔥🔥 |
| TSC全绿 | 14/14 | ✅ |
| 测试量 | ~17K+ pass, 0 fail | ✅ |
| 工作区 | 干净 | ✅ |
| Cron enabled | 33 | ✅全活 |
| Cron模式 | 30 isolated + 3 main | ✅架构硬化 |

### 专家产出(07-11)
| 文件 | 大小 | 内容 |
|:-----|:----:|:------|
| morning-expert-brief.md | 5.4KB | G1~G4晨学：架构/安全/收银/营销 |
| morning-review.md | 2.5KB | Phase签阅+余额管理+店A倒计时 |
| afternoon-expert-brief.md | 8.6KB | G5~G8午学：数据/AI/财务/体验/多租户 |
| afternoon-review.md | 5.0KB | Gate2/3/4/5签署+TODOs |
| evening-signoff.md | 6.3KB | 6道门全签 |
| evening-expert-brief.md | 5.2KB | 全天评审 |

---

## 五、时间线（V12锚点硬化版）

> 所有cron已改为 isolated agentTurn + 绝对路径
> 每条cron必须产出文件并commit，不能空跑

| 时间 | 锚点 | 模式 | 产出文件 | 预算 |
|:----:|:----|:----:|:---------|:----:|
| 07:30 | 🤖 安全基线 | isolated | security-baseline-check.md | 10min |
| 07:50 | 🤖 AI简报 | isolated | ai-brief.md | 10min |
| 08:00 | 🧠 晨学(G1~G4) | isolated | morning-expert-brief.md | 30min |
| 08:30 | 🐜 派单树哥 | isolated | phase-progress.md更新 | 15min |
| 09:00 | 👥 专家晨会 | isolated | morning-review.md | 30min |
| 09:30 | 📋 对齐检查 | isolated | alignment-check.md | 15min |
| 10:30 | 🧪 前端体验 | isolated | frontend-review.md | 15min |
| 10:30 | 🔄 对齐进化 | isolated | alignment-evolution.md | 15min |
| 11:00 | 📚 知识库日采 | isolated | 6库更新 | 60min |
| 12:00 | 🐜 午检 | isolated | midday-check.md | 15min |
| 14:00 | 🧠 午学(G5~G8) | isolated | afternoon-expert-brief.md | 30min |
| 15:00 | 👥 专家午会 | isolated | afternoon-review.md | 30min |
| 15:30 | 🔄 复盘 | isolated | post-dev-review.md | 15min |
| 17:00 | 🔄 晚间检查 | isolated | evening-prep.md | 15min |
| 18:00 | 🔐 部署检查 | isolated | store-a-readiness.md更新 | 15min |
| 20:00 | 👥 专家晚会 | isolated | evening-signoff.md | 30min |
| 20:45 | 🦞 晚学评审 | isolated | evolution-log+daily-brief更新 | 15min |
| 21:00 | 🦞 用户验收 | isolated | user-acceptance.md | 15min |
| 23:00 | 📡 日终汇总 | isolated | daily-brief+V(N+1)草案 | 60min |

**持续运行**:
| 频率 | 锚点 | 模式 | 产出 |
|:----:|:-----|:----:|:-----|
| 10min | 🐜 开发脉冲 | isolated | 随机模块 |
| 15min | 🔄 队列告警 | main | 无(纯监控) |
| 30min | 🦞 验收脉冲 | isolated | phase-progress.md追加 |
| 60min | 💓 保活心跳 | main | 无(纯心跳) |
| 5min | 🖥️ 资源监控 | main | 无(纯监控) |
| 每日 | 🕵️ 侦察兵(凌晨) | isolated | 竞品数据追加 |
| 周日 | 🕵️ 竞品周更新 | isolated | 30城轮换 |

---

## 六、E49 22天部署路线图（V12更新）

> 截止07-11: Day0，剩余20天(7/12→8/1)

| 天 | 日期 | 里程碑 | 需完成 | 实际状态 |
|:--:|:----:|:------:|:-------|:--------:|
| 0 | 07-11 | V11计划日 | — | ⬜ 0% |
| **1-3** | **07-12~07-14** | **Docker化** | Dockerfile+compose.yaml+image构建 | 🔴 未启动 |
| 4-7 | 07-15~07-18 | CI/CD管道 | GitHub Actions+自动测试+staging | 🔴 未启动 |
| 8-10 | 07-19~07-21 | staging环境 | 部署验证+rollback测试 | 🔴 未启动 |
| 11-15 | 07-22~07-26 | 灰度发布 | 5%→20%→50%→100% | 🔴 未启动 |
| 16-18 | 07-27~07-29 | 生产全量 | 全流量切到生产 | 🔴 未启动 |
| 19-21 | 07-30~08-01 | 压力测试+上线 | 峰值负载验证 | 🔴 未启动 |

**🚨 P-53仅有7天到07-18，Docker化从未启动——今天必须派树哥**

---

## 七、反模式库（V12新增）

| ID | 反模式 | 发现 | 修复 |
|:--:|:-------|:----:|:-----|
| AM-014 | systemEvent模式会议产出丢失 | 07-11 | →isolated |
| AM-015 | force-run后不检查产出 | 07-11 | 加runs查询验证 |
| AM-016 | isolated cron写workspace而非项目目录 | 07-11 | 绝对路径$PROJECT |

**正向模式库**
| ID | 模式 | 效果 |
|:--:|:------|:------|
| PP-008 | 会议cron独立session化 | 产出不丢失 |
| PP-009 | cron跑完后查runs验证 | 发现路径问题 |
| PP-010 | 绝对路径硬编码至prompt | 确保写入项目目录 |

---

## 八、更新记录

| 日期 | 版本 | 核心变更 |
|:----:|:----:|:----------|
| 2026-07-11 00:05 | V11草案 | TOGAS五环·50%业务·8基线·22天部署 |
| 2026-07-11 20:20 | **V12正式版** | **13个main→isolated迁移**·绝对路径铁律·36连胜确认·P-53紧急启动·Phase周目标·3大cron模式硬化 |

```
🦞 龙虾哥 | 2026-07-11 20:20
V12正式版基于07-11全天实战数据产出 ✅
13 cron: main→isolated · 30isolated+3main架构硬化 · 绝对路径铁律
P-53仅剩7天 · P-35/P-36需前端验收 · 36连胜不阻断
```
