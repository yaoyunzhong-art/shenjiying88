# 🧠 shenjiying88 长期知识 (MEMORY.md)

> 最后更新: 2026-07-09 05:30 CST (晨间收尾 · Pulse-Nightly-11 · 34链 · 51+ subtests 🟢 · 新增29 subtests)
> 维护者: 龙虾哥 测试指挥官

---

## 🏗️ 项目架构

### 应用模块 (apps/)
| 模块 | 说明 | 测试现状 | 跨模块 E2E 链 |
|------|------|---------|:------------:|
| admin-web | 管理后台 (Next.js) | ✅ 2482+ 单元/集成 | ✅ 34 链 (链01~34) |
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
       /  \       跨模块 E2E (34 chains, 51+ tests) ← 🆕 31→34 链
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
- 跨模块 E2E (api): vitest

### 测试文件命名规范
- 单元测试: `<feature>.test.ts`
- 跨模块 E2E (admin-web): `cross-module-journey-${序号}-${描述}.test.ts`
- 跨模块 E2E (api): `cross-module-e2e-${序号}-${描述}.test.ts`
- 必须覆盖: positive + negative + boundary

---

## 🔴 持续债务 (Pulse-Nightly-11)

| 债务 | 级别 | 持续脉冲 | 根因 | 状态 |
|------|------|---------|------|:----:|
| @m5/api timeout | 🔴 P0 | **30+** | Nest TestingModule / test DB | 🔴 持续 |
| @m5/api TSC errors | 🔴 P0 | 2+ | ~59 errors (持续修复中) | 🔴 持续 |
| @m5/api full-regression false positive | 🟡 P2 | 2+ | Vitest 4 API 不兼容 | 🔴 持续 |
| @m5/api DEPRECATED 警告 | 🟡 P2 | 1+ | Vitest 4 poolOptions 迁移 | 🆕 🔴 |
| 链30/31 内联domain非真实模块 | 🟡 P1 | 2+ | 模块依赖复杂 | 🔴 持续 (待升级) |
| 共享状态隔离 链01-28 | 🟡 P2 | 5+ | 仓储共享，跨 test 副作用 | 🔴 持续 |
| Mobile/Tob-Web 零单元测试 | 🟡 P1 | 4+ | 两模块无 .test.ts 文件 | 🟡 持续 |
| 执行时间未追踪 | 🟢 P3 | 2+ | 无性能退化基线 | 🟡 持续 |
| 幂等性缺外部存储 | 🟡 P2 | 3+ | 仅 in-memory Map | 🟡 持续 |
| 非真实性能采集 | 🟡 P3 | 3+ | 链15 使用模拟估算 | 🟡 持续 |
| 新链32-34 未全量回归验证 | 🟢 P3 | 1+ | 仅 vitest 单模块运行 | 🆕 🟡 |

### 已闭环债务
| 债务 | 日期 | 说明 |
|------|------|------|
| P1-023 内容审核工作流 | 2026-07-09 ✅ | 链33 11 subtests 覆盖 |
| P1-020 故障注入 (部分) | 2026-07-09 ✅ | 链34 9 subtests 覆盖 |
| 链29 内联 domain | 2026-07-09 ✅ | 链32 Nest 升级版 |

---

## 📚 知识库索引

### 最佳实践
- [knowledge/best-practices/e2e-pattern.md](knowledge/best-practices/e2e-pattern.md) — E2E 测试规范 + 14 种跨模块设计模式
- [knowledge/best-practices/testing-strategy.md](knowledge/best-practices/testing-strategy.md) — 整体测试策略
- [knowledge/best-practices/testing.md](knowledge/best-practices/testing.md) — 测试工具链

### 专家洞察 (已扩展至 E32)
- E17-E28: Pulse-Nightly-03~09 积累 (反向链路·角色扩展·并发·国际化·SKU全链·通知治理·退款流·KPI大盘·AI洞察)
- E29: 物联网数据管道+多云容灾+内容运营全链路 E2E 模式 (2026-07-08)
- E30: Pulse-Nightly-10 全量回归评估+债务趋势追踪 (2026-07-08)
- **E31**: Nest TestingModule 真实集成模式 · IoT→Edge→Realtime→Lineage (2026-07-09) 🆕
- **E32**: AI 内容审核工作流 + 故障注入降级恢复模式 (2026-07-09) 🆕
- 完整: [knowledge/expert-insights/](knowledge/expert-insights/)

### 经验教训
- [knowledge/lessons-learned/pulse-nightly-05.md](knowledge/lessons-learned/pulse-nightly-05.md) — 反向链路/8态机/RBAC矩阵
- [knowledge/lessons-learned/pulse-nightly-07.md](knowledge/lessons-learned/pulse-nightly-07.md) — 并发·国际化·大数据
- [knowledge/lessons-learned/pulse-nightly-09.md](knowledge/lessons-learned/pulse-nightly-09.md) — SKU全链·通知治理·退款流
- [knowledge/lessons-learned/pulse-nightly-10.md](knowledge/lessons-learned/pulse-nightly-10.md) — IoT·容灾·内容运营 (2026-07-08)
- **[knowledge/lessons-learned/pulse-nightly-11.md](knowledge/lessons-learned/pulse-nightly-11.md)** — Nest集成·审核工作流·故障注入 (2026-07-09) 🆕

---

## 🗺️ 自进化机制

### 闭环流程
1. 脉冲触发 → 全量测试 + typecheck
2. 识别失败 → 分析根因 → 写入 debt.md
3. 树哥修复 → 脉冲验收 → 闭环/标记债务
4. 知识提炼 → update knowledge/ + expert-insights
5. 自进化指标记录 → HEARTBEAT.md

### Pulse-Nightly 测试节奏 (Pulse-Nightly-11 更新)
- 第1段 (02:00-03:30): L2 业务流程集成测试
- 第2段 (??:??-??:??): 角色测试覆盖扩展
- **第3段 (03:30-05:30)**: **L3 跨模块 E2E 扩展 + 复盘 + 进化** ★ 本段
- **晨间收尾 (05:30)**:
  - 3 条新跨模块 E2E 链运行确认 (32/33/34, 29 subtests, 0 fail)
  - 复盘分析 + debt.md 和知识库更新
  - 专家团洞察更新 + e2e-pattern.md 更新
  - 测试报告 nightly-test-$(date +%Y%m%d).md 生成
  - HEARTBEAT.md 测试矩阵更新
  - MEMORY.md 长期知识沉淀
  - git commit "🧪 龙虾哥: 凌晨测试第3段 · E2E+复盘+进化"

---

## 📅 行动计划 (Pulse-Nightly-12 目标)

### E2E 链扩展 34→37 (下轮)
| 链 | 模式 | 描述 |
|:--:|------|------|
| #35 | 真实 HTTP 集成 | 将链30/31 从内联domain升级为 Nest TestingModule |
| #36 | Playwright E2E 冒烟 | 页面级流程 (Admin→Storefront) |
| #37 | E2E 混沌工程 | 真实 DB down + 网络中断注入 |

### 基础设施修复
1. **full-regression 报告器修复**: 适配 Vitest 4 API
2. **@m5/api TSC errors 清零**: 从 ~59 向 0
3. **@m5/api timeout 解决**: Nest TestingModule 人工介入

### 知识迭代
- expert-insights E33/E34

### Pulse-Nightly-11 Runtime 沉淀
- **新增 3 条 E2E 链**: 链32 (Nest 真实集成, 9 subtests), 链33 (AI 审核工作流, 11 subtests), 链34 (故障注入+降级, 9 subtests)
- **新增 3 种测试模式**: Nest TestingModule 集成、AI 内容审核工作流、故障注入+降级恢复
- **新增 3 个角色视角**: Content Manager (链33), SRE/DevOps (链34), AI Reviewer (链33)
- **闭环债务**: P1-023 (内容审核工作流), P1-020 部分 (故障注入)
- **持续债务**: @m5/api timeout (P0-007 30+脉冲)、TSC ~59 errors、full-regression false positive (P1-022)

---

## 🦞 知识沉淀 (晨间收尾 · 2026-07-09 05:30)

### 凌晨03:30后新增模块知识
- **Nest TestingModule 真实集成 (链32)**: IoT 设备注册→数据上报→Edge 推理→Realtime CRDT 发布→Lineage 血缘追踪的全链路，升级自链29 的 inline domain 模式，采用 DI 风格的 Service + Store 分离设计。9 subtests (2 正例 + 4 反例 + 3 边界)，188ms
- **AI 内容审核工作流 (链33)**: 内容创建→提交→AI 自动审核 (敏感词/质量/合规)→人工审批→驳回→重提→再审核→发布→审计。模拟 4 种角色 (author/system_ai/human_reviewer/editor_in_chief)。11 subtests (3 正例 + 5 反例 + 3 边界)，207ms
- **故障注入+降级恢复 (链34)**: 单区域故障→健康检查→自动故障转移→DB超时→缓存降级→恢复回滚→多区域崩溃→全局兜底→抖动场景→事后审计。9 subtests (3 正例 + 4 反例 + 2 边界)，196ms

### 经验教训
- **审核工作流测试注意**: 提交审核 (`submitForReview`) 内部包含两步 (状态变更 + AI 审核)，审计日志记录两次 (`submit_review` → `ai_review`)。驳回/通过的信息在 `ai_review` 记录中，无需单独"reject"记录。
- **故障注入测试技巧**: 使用 `setRegionStatus()` + `performHealthCheck()` 解耦合故障注入与检测；`autoRespondToFault()` 作为编排层, 根据故障类型和严重度自动选择降级策略。
- **Vitest 4 兼容性**: `test.poolOptions` 已弃用，所有新测试应使用顶层配置。

### 长期架构知识
- 跨模块 E2E 链从 31→34 链扩展后，覆盖率瓶颈从"链数不足"转向"模拟深度不足"
- 链32 (Nest 集成) 采用 DI 风格设计可作为后续链升级模板
- AI 审核工作流模式可复用至其他审批场景 (优惠券审批、退款审批等)
- 验收双轨制: 非api绿即可验收通过，api包 false positive 不计入验收阻塞

---

## 📊 凌晨测试综合报告 (2026-07-09 05:30)

### 总体态势
| 指标 | 数值 |
|------|------|
| 跨模块 E2E 链 | 31 → **34 链** (+3) |
| 新增 subtests | **29** (链32:9 + 链33:11 + 链34:9) |
| 测试模式 | 11 → **14 种** (+3) |
| 新增角色视角 | Admin/SRE/Content/AIReviewer/SRE |

### 第3段 E2E测试结果 (03:30-05:30)
| 链 | 模式 | subtests | 正例 | 反例 | 边界 | 耗时 | 状态 |
|:--:|------|:--------:|:----:|:----:|:----:|:----:|:----:|
| #32 | Nest 真实模块集成 | 9 | 2 | 4 | 3 | 188ms | ✅ |
| #33 | AI 内容审核工作流 | 11 | 3 | 5 | 3 | 207ms | ✅ |
| #34 | 故障注入+降级恢复 | 9 | 3 | 4 | 2 | 196ms | ✅ |
| **合计** | **3 新模式** | **29** | **8** | **13** | **8** | **~591ms** | **✅ 0 fail** |
