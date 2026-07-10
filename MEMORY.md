# 🧠 shenjiying88 长期知识 (MEMORY.md)

> 最后更新: 2026-07-11 05:30 CST (晨间收尾 · Pulse-Nightly-13 · 40链 · 121+ subtests 🟢 · +35 subtests · 3新模式)
> 维护者: 龙虾哥 测试指挥官

---

## 🏗️ 项目架构

### 应用模块 (apps/)
| 模块 | 说明 | 测试现状 | 跨模块 E2E 链 |
|------|------|---------|:------------:|
| admin-web | 管理后台 (Next.js) | ✅ 2482+ 单元/集成 | ✅ 40 链 (链01~40) |
| api | 后端 API (NestJS) | ❌ full-regression false positive (662 fail) | ✅ 间接+直接覆盖 (链38~40 新增) |
| app | C端原生App (Expo) | ✅ 136 pass | ✅ 间接 (链06/07) |
| storefront-web | B端店铺门户 (Next.js) | ✅ 1648 pass | ✅ 间接+直接 |
| tob-web | 企业端门户 | ❌ 未测试 | ✅ 直接覆盖 |
| mobile | 移动端 | ❌ 未测试 | ✅ 直接覆盖 |
| miniapp | 小程序 | ✅ src 组件测试 | ✅ 直接覆盖 |

---

## 🧪 测试体系

### 测试金字塔（当前状态）
```
        /\
       /  \       跨模块 E2E (40 chains, 121+ subtests) ← 🆕 37→40 链 (+35)
      /────\
     /      \      集成测试 (~200, admin-web)
    /────────\
   /          \    单元测试 (~1500, 全部 apps)
  /────────────\
```

### 测试运行器
- 跨模块 E2E (api): vitest

### 测试文件命名规范
- 跨模块 E2E (api): `cross-module-e2e-${序号}-${描述}.test.ts`
- 必须覆盖: positive + negative + boundary

---

## 🔴 持续债务 (Pulse-Nightly-13)

| 债务 | 级别 | 持续脉冲 | 根因 | 状态 | 趋势 |
|------|------|:--------:|------|:----:|:----:|
| @m5/api 662 tests fail | 🔴 P0 | **31+** | Nest TestingModule / Vitest 4 不兼容 | 🔴 | 📈 恶化 (520→662) |
| @m5/api TSC errors | 🔴 P0 | 4+ | ~59 errors (持续修复中) | 🔴 | 📈 持续 |
| @m5/api full-regression false positive | 🟡 P2 | 4+ | Vitest 4 API 不兼容 | 🔴 | 📈 持续 |
| @m5/api DEPRECATED 警告 | 🟡 P2 | 3+ | Vitest 4 poolOptions 迁移 | 🔴 | 持续 |
| 共享状态隔离 链01-28 | 🟡 P2 | 7+ | 全局变量模式,需要迁移到工厂模式 | 🟡 | 📉 待迁移 |
| Mobile/Tob-Web 零单元测试 | 🟡 P1 | 6+ | 两模块无 .test.ts 文件 | 🟡 | 📈 持续 |
| 执行时间未追踪 | 🟢 P3 | 4+ | 无性能退化基线 | 🟡 | 持续 |
| 幂等性缺外部存储 | 🟡 P2 | 5+ | 仅 in-memory Map | 🟡 | 持续 |
| 40人专家团反馈未产出 | 🟡 P1 | 6+ | 从 Pulse-64 起未启动 | 🟡 | 持续 |

### 已闭环债务 (Pulse-Nightly-13)
| 债务 | 日期 | 说明 |
|------|:----:|------|
| 链38 N4 情感累积Bug | 2026-07-11 ✅ | sentimentPriority 累积逻辑修复 |
| 链38-40 编写验证 | 2026-07-11 ✅ | 3链 35 subtests, 0 fail |
| 覆盖15个新模块 | 2026-07-11 ✅ | ai-cs, agent, session, federated-learning, edge 等 |
| 跨模块E2E 37→40 链 | 2026-07-11 ✅ | 新增 3 链 35 subtests, 3 新模式 |

---

## 📚 知识库索引

### 最佳实践
- [knowledge/best-practices/e2e-pattern.md](knowledge/best-practices/e2e-pattern.md) — E2E 测试规范 + 14 种跨模块设计模式
- [knowledge/best-practices/testing-strategy.md](knowledge/best-practices/testing-strategy.md) — 整体测试策略
- [knowledge/best-practices/testing.md](knowledge/best-practices/testing.md) — 测试工具链

### 专家洞察 (已扩展至 E33)
- E01-E32: Pulse-Nightly-01~11 积累
- **E33**: Pulse-Nightly-12 跨模块 E2E 扩展洞察 (链35-37, +35 subtests) 🆕 (2026-07-10)
- 完整: [knowledge/expert-insights/](knowledge/expert-insights/)

### 经验教训
- [docs/knowledge/lessons-learned/pulse-nightly-11.md](docs/knowledge/lessons-learned/pulse-nightly-11.md) — Nest集成·审核工作流·故障注入 (2026-07-09)
- **[docs/knowledge/lessons-learned/pulse-nightly-12.md](docs/knowledge/lessons-learned/pulse-nightly-12.md)** — Nest升级·跨租户隔离·CDN缓存 (2026-07-10) 🆕

---

## 🗺️ 自进化机制

### 闭环流程
1. 脉冲触发 → 全量测试 + typecheck
2. 识别失败 → 分析根因 → 写入 debt.md
3. 知识提炼 → update knowledge/ + expert-insights
4. 自进化指标记录 → HEARTBEAT.md

### Pulse-Nightly 测试节奏 (Pulse-Nightly-13 更新)
- **第3段 (03:30-05:30)**: **L3 跨模块 E2E 扩展 + 复盘 + 进化** ★ 本段
- **晨间收尾 (05:30)**:
  - 3 条新跨模块 E2E 链运行确认 (38/39/40, 35 subtests, 0 fail)
  - 复盘分析 + debt.md 和知识库更新
  - 专家团洞察更新 (E35)
  - 测试报告 nightly-test-$(date +%Y%m%d).md 生成
  - HEARTBEAT.md 测试矩阵更新
  - MEMORY.md 长期知识沉淀

---

## 📅 行动计划 (Pulse-Nightly-14 目标)

### E2E 链扩展 40→43 (下轮)
| 链 | 模式 | 描述 |
|:--:|------|------|
| #41 | 多模块覆盖盲区 | currency + lowcode + voice-processing 链路 |
| #42 | 混沌工程 | 真实 DB down + 网络中断注入 |
| #43 | 旧链01-28 工厂模式迁移 | 替换全局变量为 createTestStores() |

### 基础设施修复
1. **@m5/api 失败数控制**: 从 662 向 500 缩减 | 优先修复 lyt + runtime-governance
2. **full-regression 标记为 known failure**: 不与其他测试混跑
3. **@m5/api TSC errors 清零**: 从 ~59 向 0

### 知识迭代
- expert-insights E36
- 40人专家团反馈收集启动

---

## 🦞 知识沉淀 (晨间收尾 · 2026-07-11 05:30)

### 凌晨03:30后新增模块知识
- **AI客服会话全生命周期 (链38)**: AI-CS→Agent→Session→Push→Member。12 subtests (4+4+4), 情感累积(sentimentPriority) + 会话状态机 + 推送全生命周期 + 反馈闭环。~9ms
- **联邦学习+边缘AI+图像识别 (链39)**: Federated-Learning→Edge→Image-Recognition→Device-Adapter。11 subtests (3+3+5), 模型全生命周期 + 联邦学习精度迭代 + OTA更新/回退 + 大量并发推理。~5ms
- **许可证管理+安全审计+工作台 (链40)**: License→Security→Audit→Workbench。12 subtests (3+4+5), 许可证等级权限矩阵(free/basic/pro/enterprise/svip) + 安全策略(IP白名单) + 审计追溯 + 吊销即时隐藏。~16ms

### 经验教训
- **情感累积不可降级**: sentimentPriority (negative>positive>neutral) 确保 high priority 不被后续 neutral 消息覆盖。可定夺业务是否需要降级(如道歉后 positive 覆盖)。
- **Oxc 严格检查**: Vitest 4 + Oxc 编译会拒绝同一作用域的 `const` 重复声明, 比 Babel 更严格。
- **状态机触发条件标明**: `shouldEscalate` 检查 messages.length ≥ 4, 但每条 handleCustomerMessage 产生 2 条消息, 所以第2轮对话即触发。需标注触发条件基于消息条数还是对话轮数。
- **`node -e` 快速验证**: 复杂逻辑先用 `node -e` 快速验证(不依赖 vitest), 避免 vitest 编译延迟。

### 长期架构知识
- 跨模块 E2E 链从 37→40 扩展后, 覆盖了**AI客服/推送闭环**、**边缘AI/联邦学习**、**许可证安全审计**三个新维度
- 情感累积模式(sentimentPriority)可复用至其他状态机(coupon status, order status, session status)
- 许可证驱动功能矩阵可复用至多租户 SaaS 的 feature-gating
- 新增 15 个模块首次覆盖: ai-cs, agent, session, federated-learning, edge, image-recognition, device-adapter, license-package, license-renewal, security, workbench, svip

---

## 📊 凌晨测试综合报告 (2026-07-11 05:30)

### 总体态势
| 指标 | 数值 |
|------|------|
| 跨模块 E2E 链 | 37 → **40 链** (+3) |
| 新增 subtests | **35** (链38:12 + 链39:11 + 链40:12) |
| 测试模式 | 17 → **20 种** (+3) |
| 新增角色视角 | AI客服, 边缘设备运维师, 安全合规官 |

### 第3段 E2E测试结果 (03:30-05:30)
| 链 | 模式 | subtests | 正例 | 反例 | 边界 | 耗时 | 状态 |
|:--:|------|:--------:|:----:|:----:|:----:|:----:|:----:|
| #38 | AI客服→会话→推送→反馈 | 12 | 4 | 4 | 4 | ~9ms | ✅ |
| #39 | 联邦学习→边缘AI→图像识别 | 11 | 3 | 3 | 5 | ~5ms | ✅ |
| #40 | 许可证→安全审计→工作台 | 12 | 3 | 4 | 5 | ~16ms | ✅ |
| **合计** | **3 新模式** | **35** | **10** | **11** | **14** | **~30ms** | **✅ 0 fail** |
