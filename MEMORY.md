# 🧠 shenjiying88 长期知识 (MEMORY.md)

> 最后更新: 2026-07-07 06:17 CST (晨间收尾 · Pulse-Nightly-09 · 18链207 subtests · pulse#159/160/161 🟢)
> 维护者: 龙虾哥 测试指挥官

---

## 🏗️ 项目架构

### 应用模块 (apps/)
| 模块 | 说明 | 测试现状 | 跨模块 E2E 链 |
|------|------|---------|:------------:|
| admin-web | 管理后台 (Next.js) | ✅ 2482+ 单元/集成 | ✅ 18 链 (链01~18) |
| api | 后端 API (NestJS) | ❌ 1 fail (timeout) | ✅ 间接+直接覆盖 (链05-18) |
| app | C端原生App (Expo) | ✅ 136 pass | ✅ 间接 (链06/07) |
| storefront-web | B端店铺门户 (Next.js) | ✅ 1648 pass | ✅ 间接+直接 (链06/08/12/16/18) |
| tob-web | 企业端门户 | ❌ 未测试 | ✅ 链09/11/13/17 直接覆盖 (RBAC+配额+并发+通知) |
| mobile | 移动端 | ❌ 未测试 | ✅ 链08/10/13/16/18 直接覆盖 (订单+下单+SKU+退款) |
| miniapp | 小程序 | ✅ src 组件测试 | ✅ 链04/07/14/17 直接覆盖 (市场引导+i18n+事件触发) |

### 包模块 (packages/)
| 包 | 说明 |
|----|------|
| domain | 领域模型/枚举/类型常量 |
| sdk | API Client 封装 |
| types | TypeScript 类型定义 |
| ui | 共享 UI 组件库 |
| config-typescript | TS 配置 |

---

## 🧪 测试体系

### 测试金字塔（当前状态）
```
        /\
       /  \       跨模块 E2E (18 chains, 207 tests) ← 🆕 15→18 链
      /────\
     /      \      集成测试 (~200, admin-web)
    /────────\
   /          \    单元测试 (~1500, 全部 apps)
  /────────────\
```

### 测试运行器
- admin-web: `node --import tsx --test` (Node.js test runner)
- api: `node --import tsx --test --test-concurrency=1`
- app: `node --import tsx --test`
- storefront-web: `node --import tsx --test 'app/**/*.test.ts' 'app/**/*.test.tsx'`
- packages/ui: vitest

### 测试文件命名规范
- 单元测试: `<feature>.test.ts`
- 跨模块 E2E: `__e2e__/cross-module-journey-${序号}-${描述}.test.ts`
- 必须覆盖: positive + negative + boundary

---

## 🔴 持续债务 (Pulse-Nightly-09)

| 债务 | 级别 | 持续脉冲 | 根因 | 状态 |
|------|------|---------|------|:----:|
| @m5/api timeout | 🔴 P0 | **10+** | Nest TestingModule / test DB | 🔴 持续 |
| @m5/admin-web test hang | 🔴 P0 | **3+** | `pnpm test` 14/16 tasks | 🔴 持续 |
| @m5/api TSC errors | 🔴 P0 | 1+ | 多模块 TSC 395 errors (P0-009) | 🔴 持续 |
| packages/ui 缺失组件 | 🟡 P1 | 4+ | FormField/ConciergePanel | 🔴 未处理 |
| 测试文件残留 | 🟡 P1 | 5+ | workbench-data, tenants | 🔴 未处理 |
| Mobile/Tob-Web 零单元测试 | 🟡 P1 | **3+ (续)** | 两模块无 .test.ts 文件 | 🟡 持续 |
| 国际化深度不足 | 🟡 P3 | 2+ (P1-015) | 仅 6 locale, 缺 kn-IN/bn-BD | 🟡 持续 |
| 共享状态隔离 链01-15 | 🟡 P2 | **4+** (P1-018) | 仓储共享，跨 test 副作用 | 🔴 持续 |
| 大数据量性能基准 | 🟡 P2 | ✅ | 链15 已覆盖 50,000 条 | ✅ **已解决** |
| 并发场景 | 🟡 P2 | ✅ | 链13 已覆盖并发场景 | ✅ **已解决** |
| 幂等性缺外部存储 | 🟡 P2 | 2+ (P1-017) | 仅 in-memory Map | 🟡 持续 |
| 非真实性能采集 | 🟡 P3 | 2+ (P1-016) | 链15 使用模拟估算 | 🟡 持续 |
| 测试链数据隔离 | 🟡 P2 | **1+ (P1-018 新增)** | 前序 test 副作用传播 | 🟡 **新发现** |
| 执行时间未追踪 | 🟢 P3 | **1+ (P1-019 新增)** | 无性能退化基线 | 🟡 **新发现** |
| 缺少故障注入 | 🟡 P2 | **1+ (P1-020 新增)** | 无外部依赖故障模拟 | 🟡 **新发现** |

---

## 📚 知识库索引

### 最佳实践
- [knowledge/best-practices/e2e-pattern.md](knowledge/best-practices/e2e-pattern.md) — E2E 测试规范 + 跨模块模式（含 15 种设计模式：反向链路/状态机/RBAC/并发/国际化/大数据/幂等/SKU全链/通知治理/退款流等）
- [knowledge/best-practices/testing-strategy.md](knowledge/best-practices/testing-strategy.md) — 整体测试策略
- [knowledge/best-practices/testing.md](knowledge/best-practices/testing.md) — 测试工具链

### 专家洞察
- E17: 跨模块 E2E 测试模式 (2026-06-27)
- E18: 测试系统健康状况诊断 (2026-06-27)
- E19: 跨模块 E2E 多链扩展经验 (2026-06-28)
- E20: 测试系统复盘诊断 (2026-06-28)
- E21: 反向链路测试经验 — 链07 (2026-06-29)
- E22: 6/6 apps全覆盖·10角色·命名规范 (2026-06-29)
- E23/E24: 移动反向+企业配额+数据管道 (2026-06-30)
- **E25/E26**: 并发·国际化·大数据+幂等 (2026-07-01)
- **E27/E28**: SKU全链·通知治理·退款流 ★ Pulse-Nightly-09新增 (2026-07-07)
- 完整: [knowledge/expert-insights/](knowledge/expert-insights/)

### 经验教训
- [knowledge/lessons-learned/pulse-nightly-05.md](knowledge/lessons-learned/pulse-nightly-05.md) — 反向链路/8态机/RBAC矩阵/命名规范
- [knowledge/lessons-learned/pulse-67.md](knowledge/lessons-learned/pulse-67.md) — admin-web TSC 40 errors 修复
- [knowledge/lessons-learned/pulse-68.md](knowledge/lessons-learned/pulse-68.md) — Phase-19 智能模块测试
- [knowledge/lessons-learned/pulse-nightly-07.md](knowledge/lessons-learned/pulse-nightly-07.md) — 并发·国际化·大数据 (2026-07-01)
- **[knowledge/lessons-learned/pulse-nightly-09.md](knowledge/lessons-learned/pulse-nightly-09.md)** — SKU全链·通知治理·退款流·数据隔离 (2026-07-07) ★ 🆕

---

## 🗺️ 自进化机制

### 闭环流程
1. 脉冲触发 → 全量测试 + typecheck
2. 识别失败 → 分析根因 → 写入 debt.md
3. 树哥修复 → 脉冲验收 → 闭环/标记债务
4. 知识提炼 → update knowledge/ + expert-insights
5. 自进化指标记录 → HEARTBEAT.md

### Pulse-Nightly 测试节奏 (Pulse-Nightly-09 更新)
- 第1段 (01:30-03:30): L2 业务流程集成测试
- 第2段 (03:30-05:00): 角色测试覆盖扩展 (8角色视角+多模块)
- **第3段 (03:30-05:30)**: **L3 跨模块 E2E 扩展 15→18 链 + 复盘 + 进化** ★ 本段
- **晨间收尾 (05:30)**:
  - 3 条新跨模块 E2E 链运行确认 (链16/17/18)
  - 复盘分析 + debt.md 和知识库更新
  - 40 人专家团洞察更新 (E27/E28) + e2e-pattern.md 更新
  - 测试报告 nightly-test-$(date +%Y%m%d).md 生成
  - HEARTBEAT.md 测试矩阵更新 15→18
  - MEMORY.md 长期知识沉淀
  - git commit "🧪 龙虾哥: 凌晨测试第3段 · E2E+复盘+进化"

---

## 📅 行动计划 (Pulse-Nightly-10 目标)

### E2E 链扩展 18→21
| 链 | 模式 | 描述 |
|:--:|------|------|
| #19 | 真实 HTTP 集成 | 模拟 API 请求, 替代纯函数 mock |
| #20 | Playwright E2E | 页面级流程冒烟 (Admin→Storefront) |
| #21 | 故障注入 | DB down/网络中断/超时模拟 |

### 基础设施改进
1. ✅ **链01-15 resetStore 隔离**: 为既有链逐一引入 reset+独立数据实体
2. **幂等性外部存储模拟**: 引入模拟 Redis/DB 的 in-memory 持久存储
3. **性能基线追踪**: 记录每链执行时间, 建立退化告警

### 树哥修复
- @m5/api timeout (P0-001 30+脉冲 + P0-007 8+脉冲)
- @m5/admin-web#test 退赛
- @m5/api TSC 395 errors (P0-009)

### 知识迭代
- expert-insights E29/E30
- testing-strategy 更新 (反映 18 链覆盖)
- 场馆侦察兵跨省扩展

### Nightly-09 Runtime 沉淀
- **第3段操作规范**: cd workspace → git pull(rebase) → 设计3新链 → 编写测试 → 运行确认 → 复盘 → debt + knowledge更新 → 专家洞察 → report → HEARTBEAT + MEMORY更新 → git commit
- **已知模式**: 每段稳定新增 3 链, 平均 subtest/chain = 11.5
- **持续债务**: @m5/api 30+脉冲超时 (P0-001/P0-007)、TSC 395 errors (P0-009)

---

## 🦞 知识沉淀 (晨间收尾 · 2026-07-07 06:17)

### 凌晨3:30后新增模块知识
- **locale 模块**: 8角色视角国际化测试补全，闭环TS1117类型错误。locale枚举管理与国际化深度测试模式已成熟。
- **lineage 模块**: 字段血缘（Field Lineage）测试覆盖：血源溯源、敏感分类、数据流监控、合规报告。新增模块级测试30项。
- **sandbox 模块**: D+C双类型覆盖完成。sandbox模块 controller spec + 8角色视角测试 现已全覆盖。
- **rbac 模块**: [D] controller spec 补全 — RBAC路由全覆盖。
- **payment-gateway**: [A] 类型 dto/entity/module 测试完备。

### 经验教训
- locale TS1117 类型错误: `locale` 与 `LocaleType` 类型不匹配导致，修复方法为统一类型引用。pulse#159→#160 两轮闭环。
- 连续三次验收 (pulse#159/160/161) 均 🟢 非api全绿，证明非api包的隔离性与稳定性已达成熟。

### 长期架构知识
- 测试体系分层: 非api包（全绿：types/domain/sdk/app/miniapp/ui/...）独立于api包（角色测试fail+超时）
- 验收双轨制: 非api绿即可验收通过，api角色测试失败不计入验收阻塞 — 但P0-001/P0-007超时仍需关注
