# 📋 V15 开发计划（2026-07-12 12:21 基于中段实战冲击版）

> **周日修复模式 · 店A倒计时20天(8/1)**
> 更新: 2026-07-12 12:21 · 65 commits / 995 total · 余额 ¥604.95
> V14关键成果: ✅@m5/api hang诊断锁定, ✅路由迁移, ✅storefront 6fail修复

---

## 🎯 今日核心目标（V14→V15演进）

| V14承诺 | V14实际 | 状态 | V15调整 |
|:--------|:-------:|:----:|:--------|
| 恢复验收连胜 | ✅ pulse#339~356 连续~18次 | ✅ | 维持 |
| 全流程walkthrough | 🟡 部分完成 | 🟡 | 下午继续 |
| 知识库AM-017/018修复 | ✅ 已完成 | ✅ | 保持 |
| P0-001突破 | 🔴 **22天根因锁定** ⭐ | ✅ | 验证forceExit修复 |
| @m5/api hang CLI迁移 | 🔴 **诊断完成: open handle僵尸** | ✅ | 下午批量验收 |

---

## ⏰ 剩余执行计划（12:00→23:00）

### 下午段（12:00→18:00）🔥 重点突破

| 时间 | 任务 | 类型 | 消耗 | 优先级 | 负责人 |
|:----|:-----|:----:|:----:|:------:|:-----:|
| 12:30 | 🐜 P0-001验收: 全量逐包跑@m5/api测试验证forceExit | 🦞 | 低 | 🔴P0 | 龙虾哥 |
| 13:00 | 🐜 P0-001续: 全量vitest run 通过验证 | 🦞 | 低 | 🔴P0 | 龙虾哥 |
| 14:00 | 🧠 午学: 14TSC回归根因+23Controller fail趋势 | 🦞自动 | 低 | 🟡P2 | cron |
| 14:30 | 🐜 14TSC回归修复 (dispatch-356) | 🐜树哥 | ₹5-10 | 🟡P2 | cron |
| 15:00 | 👥 午签: P0-001验收结果+修复进度 | 🦞自动 | 低 | 🟡P2 | cron |
| 15:30 | 🟢 ai-rag unknown类型修复(可选) | 🐜树哥 | ₹20-30 | 🟢P3 | cron |
| 16:00 | 🔄 验收脉冲 -> 23 Controller fail趋势判断 | 🦞 | 低 | 🟡P2 | cron |
| 16:30 | 🟢 xu-audit-chain审计规则文件初稿 | 🦞 | 低 | 🟢P3 | cron |
| 17:00 | 🐜 开发推进检查 | 🦞 | 低 | 🟡P2 | cron |

### 晚间段（20:00→23:00）

| 时间 | 任务 | 类型 | 消耗 | 优先级 | 负责人 |
|:----|:-----|:----:|:----:|:------:|:-----:|
| 20:00 | 🏛️ 晚会签署 (G1-G6) | 🦞自动 | 低 | 🟡P2 | cron |
| 20:45 | 🦞 晚学评审 | 🦞自动 | 低 | 🟡P2 | cron |
| 21:00 | 🟢 user-acceptance E40验收 + expert-insights | 🦞自动 | 低 | 🟢P3 | cron |
| 23:00 | 📡 日终汇总+自进化→V16草案 | 本cron | 低 | ✅自动 | cron |

---

## 📊 当前余额预算

| 活动 | 预估消耗 | 备注 |
|:----|:--------:|:-----|
| P0-001 vitest forceExit验收 | ₹0 | 配置修改已完成，只需验证 |
| dispatch-356 14TSC修复 | ₹5-10 | 脉冲发现的新回归 |
| 23 Controller fail持续诊断 | ₹0 | 已确认前端断言问题，不再派树哥 |
| ai-rag unknown修复(可选) | ₹20-30 | 看余额剩余 |
| **预计剩余** | **¥564.95+** | 充裕 |

---

## 🔥 V15 三大突破性成果（截至12:21）

### 突破1: @m5/api hang 根因锁定（P0-001，22天）

根因: NestJS测试后open handle阻止vitest fork进程退出 → 产生僵尸进程从凌晨3:15运行9h+，每个吃99% CPU → vitest全量run卡住非"挂起"，是fork永不退出

修复: vitest.config.ts 添加 forceExit: true + teardownTimeout: 5000 + 清理poolOptions弃用参数

状态: 🟡 配置已改，待全量 vitest run 验证

### 突破2: RQ-001~005 自愈死循环切断

根因: 23个Controller fail实际来源是storefront-web前端角色冒烟测试的源码断言(empty/ProductsPage/hours)，非API后端bug

修复: 直接修改6个page.tsx源文件匹配测试预期 + stores/layout.tsx门店导航

状态: ✅ role-based-smoke.test.ts 零fail ✅ insights/page.test.ts 零fail ✅ Cashier controller 56/56 + role 20/20

### 突破3: 路由迁移完成（大飞哥指令）

cashier→stores/[id]/cashier/ ✅ promotions→stores/[id]/promotions/ ✅ operations→stores/[id]/operations/ ✅ stores/layout.tsx(26模块导航) ✅ 旧目录全部删除 ✅

---

## 🚨 持续关注

1. 23 Controller fail (store7/tob4/miniapp12) — 已确认为前端断言，建议修改验收脉冲逻辑区分来源
2. 14 TSC错误 (pulse#356) — 新回归，树哥dispatch-356已派
3. insights page.test.ts 导入运行时 — @m5/ui依赖问题，角色冒烟已全绿
4. 店A倒计时20天 — 前端P-35/P-36前端仍是⬜，需龙虾哥晚间亲写

---

## 📌 接下来的动作（按优先）

| # | 优先级 | 动作 | 耗时 |
|:-:|:-------:|:-----|:----:|
| 1 | 🔴NOW | 验证 forceExit vitest全量跑通过 | 3-5min |
| 2 | 🔴NOW | 确认 pulse#355/356 验收结果 | 检查cron |
| 3 | 🟡PM | 14TSC回归修复验收 | 自动 |
| 4 | 🟡PM | 修改自愈机制: 区分API fail vs 前端断言fail | 15min |
| 5 | 🟢今晚 | P-35/P-36前端页面(龙虾哥专属时段21:00) | 1h |
