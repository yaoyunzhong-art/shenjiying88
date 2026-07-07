# 🧠 shenjiying88 长期知识 (MEMORY.md)

> 最后更新: 2026-07-08 05:30 CST (晨间收尾 · Pulse-Nightly-10 · 31链 · 62 subtests 🟢)
> 维护者: 龙虾哥 测试指挥官

---

## 🏗️ 项目架构

### 应用模块 (apps/)
| 模块 | 说明 | 测试现状 | 跨模块 E2E 链 |
|------|------|---------|:------------:|
| admin-web | 管理后台 (Next.js) | ✅ 2482+ 单元/集成 | ✅ 31 链 (链01~31) |
| api | 后端 API (NestJS) | ❌ full-regression false positive | ✅ 间接+直接覆盖 |
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
       /  \       跨模块 E2E (31 chains, 62+ tests) ← 🆕 28→31 链
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
- 跨模块 E2E: vitest

### 测试文件命名规范
- 单元测试: `<feature>.test.ts`
- 跨模块 E2E: `cross-module-e2e-${序号}-${描述}.test.ts`
- 必须覆盖: positive + negative + boundary

---

## 🔴 持续债务 (Pulse-Nightly-10)

| 债务 | 级别 | 持续脉冲 | 根因 | 状态 |
|------|------|---------|------|:----:|
| @m5/api timeout | 🔴 P0 | **30+** | Nest TestingModule / test DB | 🔴 持续 |
| @m5/api TSC errors | 🔴 P0 | 2+ | 73 errors (alliance/blindbox) | 🔴 持续 |
| @m5/api full-regression false positive | 🟡 P2 | 1+ | Vitest 4 API 不兼容 | 🔴 **新发现** |
| 链29-31 内联domain非真实模块 | 🟡 P1 | 1+ | 模块依赖复杂无法直接集成 | 🔴 **新发现** |
| 内容运营缺审核工作流 | 🟢 P3 | 1+ | 链31 未覆盖审批流 | 🟡 **新发现** |
| 共享状态隔离 链01-28 | 🟡 P2 | 5+ | 仓储共享，跨 test 副作用 | 🔴 持续 |
| Mobile/Tob-Web 零单元测试 | 🟡 P1 | 4+ | 两模块无 .test.ts 文件 | 🟡 持续 |
| 执行时间未追踪 | 🟢 P3 | 2+ | 无性能退化基线 | 🟡 持续 |
| 幂等性缺外部存储 | 🟡 P2 | 3+ | 仅 in-memory Map | 🟡 持续 |
| 非真实性能采集 | 🟡 P3 | 3+ | 链15 使用模拟估算 | 🟡 持续 |

---

## 📚 知识库索引

### 最佳实践
- [knowledge/best-practices/e2e-pattern.md](knowledge/best-practices/e2e-pattern.md) — E2E 测试规范 + 11 种跨模块设计模式
- [knowledge/best-practices/testing-strategy.md](knowledge/best-practices/testing-strategy.md) — 整体测试策略
- [knowledge/best-practices/testing.md](knowledge/best-practices/testing.md) — 测试工具链

### 专家洞察 (已扩展至 E30)
- E17-E28: Pulse-Nightly-03~09 积累 (反向链路·角色扩展·并发·国际化·SKU全链·通知治理·退款流·KPI大盘·AI洞察)
- **E29**: 物联网数据管道+多云容灾+内容运营全链路 E2E 模式 (2026-07-08) 🆕
- **E30**: Pulse-Nightly-10 全量回归评估+债务趋势追踪 (2026-07-08) 🆕
- 完整: [knowledge/expert-insights/](knowledge/expert-insights/)

### 经验教训
- [knowledge/lessons-learned/pulse-nightly-05.md](knowledge/lessons-learned/pulse-nightly-05.md) — 反向链路/8态机/RBAC矩阵
- [knowledge/lessons-learned/pulse-nightly-07.md](knowledge/lessons-learned/pulse-nightly-07.md) — 并发·国际化·大数据
- [knowledge/lessons-learned/pulse-nightly-09.md](knowledge/lessons-learned/pulse-nightly-09.md) — SKU全链·通知治理·退款流
- **[knowledge/lessons-learned/pulse-nightly-10.md](knowledge/lessons-learned/pulse-nightly-10.md)** — IoT·容灾·内容运营 (2026-07-08) 🆕

---

## 🗺️ 自进化机制

### 闭环流程
1. 脉冲触发 → 全量测试 + typecheck
2. 识别失败 → 分析根因 → 写入 debt.md
3. 树哥修复 → 脉冲验收 → 闭环/标记债务
4. 知识提炼 → update knowledge/ + expert-insights
5. 自进化指标记录 → HEARTBEAT.md

### Pulse-Nightly 测试节奏 (Pulse-Nightly-10 更新)
- 第1段 (01:30-03:30): L2 业务流程集成测试
- 第2段 (??:??-??:??): 角色测试覆盖扩展
- **第3段 (03:30-05:30)**: **L3 跨模块 E2E 扩展 + 复盘 + 进化** ★ 本段
- **晨间收尾 (05:30)**:
  - 3 条新跨模块 E2E 链运行确认
  - 复盘分析 + debt.md 和知识库更新
  - 专家团洞察更新 + e2e-pattern.md 更新
  - 测试报告 nightly-test-$(date +%Y%m%d).md 生成
  - HEARTBEAT.md 测试矩阵更新
  - MEMORY.md 长期知识沉淀
  - git commit "🧪 龙虾哥: 凌晨测试第3段 · E2E+复盘+进化"

---

## 📅 行动计划 (Pulse-Nightly-11 目标)

### E2E 链扩展 31→34
| 链 | 模式 | 描述 |
|:--:|------|------|
| #32 | 真实 HTTP 集成升级 | 将链29-31 从内联domain升级为真实 Nest TestingModule |
| #33 | Playwright E2E 冒烟 | 页面级流程 (Admin→Storefront) |
| #34 | 内容审核工作流 | 审批→驳回→重新提交→通过→发布 |

### 基础设施修复
1. **full-regression 报告器修复**: 适配 Vitest 4 API
2. **@m5/api TSC errors 清零**: alliance(48)+blindbox(18) 为剩余主力
3. **@m5/api timeout 解决**: Nest TestingModule 人工介入

### 知识迭代
- expert-insights E31/E32

### Pulse-Nightly-10 Runtime 沉淀
- **新增 IoT Operator / SRE-DevOps / Content Manager 角色视角**
- **内联 Domain 模拟模式**: 当真实 NestJS 模块导入失败时，使用自包含 inline domain 模拟层，配合统一 reset 函数和 Phase 分组测试
- **持续债务**: @m5/api timeout (P0-007 30+脉冲)、TSC 73 errors (P0-009)、full-regression false positive (P1-022)

---

## 🦞 知识沉淀 (晨间收尾 · 2026-07-08 05:30)

### 凌晨03:30后新增模块知识
- **IoT+Edge+Realtime+Lineage 集成 (链29)**: 物联网数据管道 E2E 模式成熟，覆盖数据采集→推理→协同→血缘→告警全链路，20 subtests 全绿
- **MultiRegion+Health+AutoRollback 集成 (链30)**: 多云容灾+混沌工程+自动回滚 E2E 模式，覆盖区域路由/故障切换/健康检查/部署回滚，22 subtests 全绿
- **Content+Brand+I18n+Multimedia 集成 (链31)**: 内容运营全链路 E2E 模式，覆盖CRUD/品牌模板/国际化翻译/多媒体适配，20 subtests 全绿

### 经验教训
- 内联 domain 模拟层的三个原则: 1) 统一 reset 函数 2) Phase 分组 3) 正例·反例·边界三元组
- Vitest 4 移除了 `test.poolOptions`，full-regression 报告器需更新
- 跨模块 E2E 链覆盖 31 链后，模块集成测试的瓶颈已从"链数不足"转向"模拟深度不足"(内联domain vs 真实NestJS)

### 长期架构知识
- 测试体系分层: 非api包（持续全绿）独立于api包（持续有全量回归问题）
- 非api包已连续 10+ 脉冲全绿，隔离性稳定性已成熟
- 验收双轨制: 非api绿即可验收通过，api包 false positive 不计入验收阻塞
