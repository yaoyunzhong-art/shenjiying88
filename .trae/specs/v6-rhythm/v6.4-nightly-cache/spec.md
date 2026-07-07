# V6.4 · Pulse-Nightly 接入缓存层 (凌晨 CPU 克制)

> 立项: 2026-06-28 11:13 CST · 立主人: 龙虾哥
> 上游: V6.2 launchd 单守护 + V6.3 资源克制 (nice + 错峰 + 缓存)
> 目标: 凌晨 Pulse-Nightly 任务 CPU 也降 50-70%,和大飞哥 M4 Pro 完全契合

---

## 🎯 背景

V6.3 已对白天 v6-rhythm 调度 (15min/次) 实现资源克制:
- 缓存层 (kg/ap/lessons/insights/pass_rate 1h TTL)
- nice -n 19 最低优先级
- 0-30s 错峰 sleep
- skip-already 幂等

但**凌晨 Pulse-Nightly 任务 (0:00-7:00)** 还在裸跑,没接入缓存层:
- `scripts/nightly-jobs.sh` 7 阶段 (智库/测试/优化/会议/总结)
- 每次 find/grep/wc 全知识库
- 多个 tsc/测试并行,CPU 持续高峰

V6.4 = 凌晨任务也接入 V6.3 缓存层 + 错峰 + nice + 复用 evolution 指数

---

## 📐 V6.4 改进点 (5 大)

### N-1: 接入 v6-cache.sh 缓存层

- 凌晨任务 (智库抽取/反模式扫描/洞察收集) 优先读 `.cache/v6/`
- 1h TTL 内不重算
- 跨 7 阶段共享缓存,减少 ~80% find/grep 调用

### N-2: 阶段间错峰 sleep

- 7 阶段之间插入 60-120s 错峰
- 避免瞬时 CPU 尖峰
- 让 M4 Pro 风扇安静

### N-3: 7 阶段全 nice -n 19

- 最低调度优先级
- 让白天 Mac 唤醒时前台 IDE/node 优先

### N-4: 复用 evolution index

- 凌晨 02:00 计算的指数,白天直接读
- 减少重复计算 (从 3 次/天 降到 1 次/天)
- 自我进化指数更新频率: 14:00 改 02:00 (凌晨)

### N-5: skip-already 守卫

- 智库抽取 / 反模式扫描 已生成报告则跳过
- 重复跑幂等 (凌晨失败重跑安全)

---

## 🔧 实施清单 (4h 冲刺)

### 步骤 1: V6.4 spec (本份)

- [x] 立项 V6.4 spec 文档
- [x] 5 改进点定义
- [x] 接入方案
- [x] 测试标准

### 步骤 2: 改 nightly-jobs.sh

- [ ] 头部加 `nice -n 19` 包裹
- [ ] 7 阶段间插入 60-120s sleep
- [ ] find/grep 改用 v6-cache.sh
- [ ] evolution 计算改为单次 (02:00)

### 步骤 3: 7 阶段 v6-nightly-*.sh 子脚本拆分

- [ ] v6-nightly-knowledge.sh (智库自进化)
- [ ] v6-nightly-test.sh (测试 + TSC)
- [ ] v6-nightly-optimize.sh (优化与重构)
- [ ] v6-nightly-standup.sh (会议与同步)
- [ ] v6-nightly-summary.sh (总结与交接)
- [ ] 主调度 v6-nightly-launchd.sh (凌晨调度)

### 步骤 4: launchd 凌晨守护

- [ ] ~/Library/LaunchAgents/com.shenjiying.v6-nightly.plist
- [ ] StartCalendarInterval 00:00 / 01:00 / 02:00 / 03:00 / 04:00 / 05:00 / 06:00
- [ ] 或 StartInterval 3600 (1h/次,内部判断阶段)

### 步骤 5: 测试 + 验证

- [ ] 手动跑 v6-nightly-knowledge.sh
- [ ] 验证缓存层 (1h 内不重算)
- [ ] nice -n 19 生效 (top 看 PR=-19)
- [ ] 错峰 sleep 0-30s 触发
- [ ] skip-already 守卫 (再次跑 = 0.07s 退出)

---

## 📊 验证标准

### V6.4 必须满足 (今晚 0:00 自动跑)

- [ ] 7 阶段全部接入 V6.3 缓存层
- [ ] nice -n 19 全程包裹
- [ ] 错峰 60-120s 触发
- [ ] evolution 指数复用 (凌晨 02:00 算 1 次,白天 14/18/22 复用)
- [ ] skip-already 幂等 (重复跑 < 1s 退出)
- [ ] CPU 占用 < 5% (vs V6.3 之前的 30-50%)
- [ ] 风扇不狂转 (vs V6.3 之前的狂转)

### 量化指标

| 指标 | V6.3 之前 | V6.4 之后 | 改善 |
|------|:---------:|:---------:|:----:|
| 凌晨 CPU 平均 | 30-50% | **< 5%** | -85% |
| 凌晨 find/grep 次数 | 100+/小时 | **5/小时** | -95% |
| evolution 指数计算 | 3 次/天 | **1 次/天** (凌晨) | -67% |
| 重复跑耗时 | 重跑全量 | **0.07s 退出** | -99% |

---

## 🦞 4h 冲刺节点 (11:13-15:00)

| 时间 | 任务 |
|------|------|
| 11:13-11:30 | ✅ V6.4 spec 立项 (本份) |
| 11:30-12:00 | v6-nightly-*.sh 5 子脚本 |
| 12:00-12:30 | ☕ 午间 handoff (V6.3 自动跑) |
| 12:30-13:00 | nightly-jobs.sh 改造 (接入缓存 + nice) |
| 13:00-13:30 | launchd 凌晨 plist |
| 13:30-14:00 | Phase-51 spec 起草 (V7 起步) |
| 14:00-14:30 | 测试 + 验证 V6.4 |
| 14:30-15:00 | HEARTBEAT Part 31 验收 |

---

## 📌 风险与对策

| 风险 | 影响 | 对策 |
|------|------|------|
| 凌晨缓存失效 | 重新计算 CPU 尖峰 | TTL 1h 改 4h (凌晨场景) |
| 阶段失败级联 | 后续阶段不跑 | set +e 包裹每个阶段,独立 log |
| 跨天未完成 | 第二天继承半成品 | skip-already 守卫,幂等 |
| 用户唤醒撞上 | 风扇狂转 | nice -n 19 + 错峰 60-120s |

---

> **V6.4 = 凌晨任务 = V6.3 资源克制 5 招全复用**
> **目标:CPU -85% + 风扇不转 + 24h 完全静默**

> 🦞 **"V6.4 凌晨静默 = 大飞哥 M4 Pro 24h 不狂转"**
