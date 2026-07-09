# 🧠 shenjiying88 长期知识 (MEMORY.md)

> 最后更新: 2026-07-10 05:30 CST (晨间收尾 · Pulse-Nightly-12 · 37链 · 86+ subtests 🟢 · +35 subtests)
> 维护者: 龙虾哥 测试指挥官

---

## 🏗️ 项目架构

### 应用模块 (apps/)
| 模块 | 说明 | 测试现状 | 跨模块 E2E 链 |
|------|------|---------|:------------:|
| admin-web | 管理后台 (Next.js) | ✅ 2482+ 单元/集成 | ✅ 37 链 (链01~37) |
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
       /  \       跨模块 E2E (37 chains, 86+ tests) ← 🆕 34→37 链
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

## 🔴 持续债务 (Pulse-Nightly-12)

| 债务 | 级别 | 持续脉冲 | 根因 | 状态 |
|------|------|---------|------|:----:|
| @m5/api timeout | 🔴 P0 | **30+** | Nest TestingModule / test DB | 🔴 持续 |
| @m5/api TSC errors | 🔴 P0 | 3+ | ~59 errors (持续修复中) | 🔴 持续 |
| @m5/api full-regression false positive | 🟡 P2 | 3+ | Vitest 4 API 不兼容 | 🔴 持续 |
| @m5/api DEPRECATED 警告 | 🟡 P2 | 2+ | Vitest 4 poolOptions 迁移 | 🔴 持续 |
| 共享状态隔离 链01-28 | 🟡 P2 | 6+ | 全局变量模式,需要迁移到工厂模式 | 🟡 待迁移 |
| Mobile/Tob-Web 零单元测试 | 🟡 P1 | 5+ | 两模块无 .test.ts 文件 | 🟡 持续 |
| 执行时间未追踪 | 🟢 P3 | 3+ | 无性能退化基线 | 🟡 持续 |
| 幂等性缺外部存储 | 🟡 P2 | 4+ | 仅 in-memory Map | 🟡 持续 |
| 非真实性能采集 | 🟡 P3 | 4+ | 链15 使用模拟估算 | 🟡 持续 |

### 已闭环债务 (Pulse-Nightly-12)
| 债务 | 日期 | 说明 |
|------|------|------|
| P1-021 链30/31 内联domain升级 | 2026-07-10 ✅ | 链35 以 DI 风格升级 |
| EF-003 跨模块E2E 34→37 链 | 2026-07-10 ✅ | 新增 3 链 35 subtests |

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

### Pulse-Nightly 测试节奏 (Pulse-Nightly-12 更新)
- **第3段 (03:30-05:30)**: **L3 跨模块 E2E 扩展 + 复盘 + 进化** ★ 本段
- **晨间收尾 (05:30)**:
  - 3 条新跨模块 E2E 链运行确认 (35/36/37, 35 subtests, 0 fail)
  - 复盘分析 + debt.md 和知识库更新
  - 专家团洞察更新 (E33)
  - 测试报告 nightly-test-$(date +%Y%m%d).md 生成
  - HEARTBEAT.md 测试矩阵更新
  - MEMORY.md 长期知识沉淀

---

## 📅 行动计划 (Pulse-Nightly-13 目标)

### E2E 链扩展 37→40 (下轮)
| 链 | 模式 | 描述 |
|:--:|------|------|
| #38 | Playwright E2E 冒烟 | 页面级流程 (Admin→Storefront) |
| #39 | 混沌工程 | 真实 DB down + 网络中断注入 |
| #40 | 旧链01-28 工厂模式迁移 | 替换全局变量为 createTestStores() |

### 基础设施修复
1. **full-regression 报告器修复**: 适配 Vitest 4 API
2. **@m5/api TSC errors 清零**: 从 ~59 向 0
3. **@m5/api timeout 解决**: Nest TestingModule 人工介入

### 知识迭代
- expert-insights E34

---

## 🦞 知识沉淀 (晨间收尾 · 2026-07-10 05:30)

### 凌晨03:30后新增模块知识
- **Nest DI 风格升级 (链35)**: MultiRegion→Health→AutoRollback 故障转移 + Content→Brand→I18n→Multimedia 品牌多语言, 从链30/31 内联 domain 升级为 DI 风格。13 subtests (4 正例 + 4 反例 + 5 边界)，~90ms
- **跨租户数据隔离 (链36)**: 三层隔离体系: IdentityAccessService (准入) → DataShieldService (脱敏) → GovernanceAuditService (审计)。覆盖超级管理员跨租户、租户间隔离、敏感字段脱敏。10 subtests (3 正例 + 3 反例 + 4 边界)，~85ms
- **CDN 缓存失效工作流 (链37)**: 内容发布→缓存预热→缓存命中/未命中→失效(exact/prefix/wildcard)→缓存分析。覆盖 TTL 过期、空气缓存、大量并发失效。12 subtests (4 正例 + 3 反例 + 5 边界)，~95ms

### 经验教训
- **Date.now() ID 冲突**: 测试中多个实例(如两个 draft)在同一毫秒内创建时, `Date.now()` 返回相同值。修复: Store 内置递增 `seq` 计数器, 组合 `seq-Date.now()` 确保唯一。
- **Vitest 变量提升陷阱**: `describe` 块内的 `let svc` 被多个 test 按顺序访问, `afterEach` 未正确重置时前序 test 的副作用会泄漏。**最佳实践**: 每个 test 使用 `const { ... } = createTestStores()` 创建独立实例。
- **内联 domain → DI 升级**: 链35 证明了链30/31 的升级路径。关键点: Store 与 Service 分离、每次创建新实例、文档化每个 subtests 的三类验证。

### 长期架构知识
- 跨模块 E2E 链从 34→37 扩展后, 覆盖了**缓存治理**和**数据治理**两个新维度
- 链35 的 DI 风格设计可作为旧链01-28 升级模板
- 跨租户隔离模式可复用至多租户 SaaS 场景的合规测试

---

## 📊 凌晨测试综合报告 (2026-07-10 05:30)

### 总体态势
| 指标 | 数值 |
|------|------|
| 跨模块 E2E 链 | 34 → **37 链** (+3) |
| 新增 subtests | **35** (链35:13 + 链36:10 + 链37:12) |
| 测试模式 | 14 → **17 种** (+3) |
| 新增角色视角 | CDN Operator, Compliance Officer |

### 第3段 E2E测试结果 (03:30-05:30)
| 链 | 模式 | subtests | 正例 | 反例 | 边界 | 耗时 | 状态 |
|:--:|------|:--------:|:----:|:----:|:----:|:----:|:----:|
| #35 | Nest DI 风格升级 | 13 | 4 | 4 | 5 | ~90ms | ✅ |
| #36 | 跨租户数据隔离+治理审计 | 10 | 3 | 3 | 4 | ~85ms | ✅ |
| #37 | 边缘缓存 + CDN 失效工作流 | 12 | 4 | 3 | 5 | ~95ms | ✅ |
| **合计** | **3 新模式** | **35** | **11** | **10** | **14** | **~270ms** | **✅ 0 fail** |
