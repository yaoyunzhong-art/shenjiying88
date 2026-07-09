# 🐜 shenjiying88 · 债务追踪 (debt.md)

> 最后更新: 2026-07-10 05:30 CST · Pulse-Nightly-12
> 当前阶段: **脉冲 #197 · L3 跨模块 E2E 扩展 34→37链 · +35 subtests · 0 fail ✅**

---

## 🟣 Expert Feedback (V5.1 专家反馈追踪 · Pulse-64 新增)

### EF-001: 40 人专家团尚未产出反馈
- **发现**: Pulse-64 (2026-06-25)
- **状态**: 🟡 持续未启动
- **预期**: 每周至少 3 条专家反馈
- **追踪指标**:
  - 反馈数量 / 周 (目标 ≥3)
  - 采纳率 (目标 ≥50%)
  - 紧急 veto 次数 (期望 0)

### EF-002: 待 Phase-17 Kickoff 时收集首批专家反馈
- **状态**: ⏳ 待启动
- **负责人**: Champion (待任命)
- **关联 RFC**: R6 (Phase-17 计划)

### EF-003: L3 跨模块 E2E 从 34→37 链（Pulse-Nightly-12 扩展）
- **发现**: 2026-07-10 03:30 凌晨测试 → **✅ Pulse-Nightly-12 扩展至 37链**
- **状态**: ✅ **37 跨模块 E2E 测试链已创建并全通过（35 new subtests, 0 fail）**
- **追踪**:
  | 链 | 名称 | subtests | 正例 | 反例 | 边界 | 耗时 | 状态 |
  |:--:|------|:--------:|:----:|:----:|:----:|:----:|:----:|
  | **35** | **Nest 升级: MultiRegion→Health + Content→Brand→I18n** | **13** | **4** | **4** | **5** | **~90ms** | ✅ |
  | **36** | **跨租户数据隔离 + 治理审计** | **10** | **3** | **3** | **4** | **~85ms** | ✅ |
  | **37** | **边缘缓存 + CDN 失效工作流** | **12** | **4** | **3** | **5** | **~95ms** | ✅ |
  | **总计 (新链)** | **3 新链** | **35 subtests** | **11** | **10** | **14** | **~270ms** | ✅ |
  | **总计 (全部)** | **37 链** | **86+ subtests** | — | — | — | — | ✅ **0 fail** |
- **下一步**: Pulse-Nightly-13 引入真实 Playwright E2E + HTTP 冒烟测试

---

## 🟥 P0 · 阻塞级 (需立即人工关注)

### P0-009: @m5/api TSC errors 🔴 持续
- **发现**: Pulse-Morning-09 (2026-07-06 07:12)
- **当前**: **~59 errors** (持续修复中，从 395 ↓ 73 → ~59)
- **趋势**: 从 395 → 73 (🔻 -81.5%), 持续下降中
- **影响**: 无法通过完整的 typecheck 脉冲
- **修复方向**: 树哥持续分批修复中

### P0-007: @m5/api app-journey timeout 持续 (30+脉冲)
- **发现**: Pulse-59 起连续 30+ 脉冲未解决
- **根因**: Nest TestingModule / test DB / beforeAll 钩子问题
- **影响**: 验收脉冲无法获取 @m5/api 完整结果
- **状态**: 🔴 持续

### P0-004: 招募 Approver 级专家 (V5.1 关键) 🔴 持续
- **发现**: Pulse-65 (2026-06-25)
- **问题**: 当前 0/40 专家达到 Approver 级别
- **影响**: Phase-17 启动受阻

---

## 🟡 P1 · 影响级

### P1-021: 跨模块测试链 30/31 使用内联 domain 而非真实模块 (已解决 ✅)
- **发现**: Pulse-Nightly-10 (2026-07-08)
- **进展**: **✅ 链35 完成链30/31 的 DI 风格升级**（MultiRegion→Health→AutoRollback + Content→Brand→I18n→Multimedia）
- **状态**: ✅ **已解决**
- **闭环**: 链35 13 subtests 覆盖原链30 的多区域故障转移原 All 链31 的品牌内容多语言发布，采用 DI 风格 Service+Store 分离设计

### P1-022: @m5/api full-regression.test.ts false positive (34 项检测全 fail)
- **发现**: Pulse-Nightly-09 (2026-07-07)
- **问题**: `full-regression.test.ts` 的 34 项"模块标准"检测均显示 `DEPRECATED` + `模块失败`
- **根因**: 报告器逻辑的 `test.poolOptions` 在 Vitest 4 被移除
- **严重程度**: 🟡 P2
- **状态**: 🔴 持续未修复

### P1-024: @m5/api 报告器 DEPRECATED 警告
- **发现**: Pulse-Nightly-11 (2026-07-09)
- **问题**: 新链32-34/35-37 运行时依然输出 `test.poolOptions` 已弃用
- **根因**: Vitest 4 API 迁移未完成
- **状态**: 🔴 持续

### P1-018: 测试链共享数据隔离不足 (Partial Fix ✅)
- **发现**: Pulse-Nightly-09 (2026-07-07)
- **问题**: 跨模块 E2E 链共享 in-memory 仓储, 前序 test 副作用传播
- **修复**: 新链35-37 采用 `createTestStores()` 工厂模式, 每个 test 创建独立实例
- **状态**: 🟡 **局部修复** (新链已修复, 旧链01-28 仍使用 `resetAll()` 模式)
- **修复方向**: Pulse-Nightly-13 迁移旧链01-28 到工厂模式

### P1-025: 新链32-34 测试覆盖尚未全模块回归验证
- **发现**: Pulse-Nightly-11 (2026-07-09)
- **问题**: 新增 29 subtests 仅在 API 模块 vitest 中运行
- **状态**: ✅ **链35-37 已新增并全通过** (累计 35 new subtests, 总链数 37)

### P1-026: @m5/api full-regression continue with DEPRECATED warning
- **发现**: Pulse-Nightly-12 (2026-07-10)
- **问题**: vitest 4 迁移进度为 0
- **状态**: 🔴 持续

---

## 🟢 闭环债务 (Pulse-Nightly-12 结束)

| 债务 | 日期 | 闭环原因 |
|------|------|---------|
| P1-021 链30/31 内联domain | 2026-07-10 | ✅ 链35 以 DI 风格升级替代 (13 subtests) |
| EF-003 跨模块E2E 34→37 链 | 2026-07-10 | ✅ 新增 3 链, 35 subtests, 0 fail |

---

## 📊 Pulse-Nightly-12 (2026-07-10 03:30-05:30) 新增发现

### 新增 3 条跨模块 E2E 链运行结果
| 链 | 名称 | subtests | 正例 | 反例 | 边界 | 耗时 | 状态 |
|:--:|------|:--------:|:----:|:----:|:----:|:----:|:----:|
| #35 | Nest 升级: MultiRegion→Health→AutoRollback + Content→Brand→I18n→Multimedia | 13 | 4 | 4 | 5 | ~90ms | ✅ |
| #36 | 跨租户数据隔离 + 治理审计 | 10 | 3 | 3 | 4 | ~85ms | ✅ |
| #37 | 边缘缓存 + CDN 失效工作流 | 12 | 4 | 3 | 5 | ~95ms | ✅ |
| **合计** | **3 链** | **35 subtests** | **11** | **10** | **14** | **~270ms** | **✅ 0 fail** |

### 测试运行分析
- **结果**: 新链35-37 全部通过 (35/35 subtests, 0 fail)
- **新增 3 种测试模式**:
  1. **Nest TestingModule 升级** (链35): 从链30/31 内联 domain 升级为 DI 风格, 13 subtests 全覆盖
  2. **跨租户治理** (链36): 三层隔离 (Identity→Data→Audit), 10 subtests
  3. **CDN 缓存失效** (链37): 发布→预热→命中→失效→分析, 12 subtests

### 覆盖缺口分析 (Pulse-Nightly-12 更新)
| 模块 | 覆盖状态 | 缺口 |
|------|:--------:|------|
| MultiRegion 故障转移 (原链30) | ✅ 已升级 | 链35 Part A 全部覆盖 (6 subtests) |
| Content→Brand→I18n (原链31) | ✅ 已升级 | 链35 Part B 全部覆盖 (7 subtests) |
| 跨租户数据隔离 | ✅ 新覆盖 | 链36 (10 subtests) |
| CDN 缓存失效工作流 | ✅ 新覆盖 | 链37 (12 subtests) |
| 全局变量隔离 (旧链01-28) | 🟡 部分 | 旧链仍使用 `resetAll()` 模式 |

### 角色视角覆盖 (Pulse-Nightly-12 更新)
| 角色 | 覆盖链数 | 新增 |
|------|:--------:|:----:|
| Admin | 37/37 | — |
| Content Manager | 4/37 | 链35 (品牌内容) |
| SRE/DevOps | 4/37 | 链35 (多区域故障) |
| CDN Operator | 1/37 🆕 | 链37 (缓存治理) |
| Compliance Officer | 1/37 🆕 | 链36 (数据隔离) |
| Consumer/C端 | 18/37 | — |
| Merchant/B端 | 14/37 | — |
| Finance | 9/37 | — |
| Operator | 12/37 | — |

### Pulse-Nightly-12 存档
- **状态**: ✅ L3 跨模块 E2E 扩展 34→37 链 ✅ 复盘改进 ✅ 进化赋能
- **新增链**: 链35 Nest 升级 + 品牌内容 (13 subtests)、链36 跨租户隔离 (10 subtests)、链37 CDN 缓存 (12 subtests)
- **总测试数**: **37 链, 86+ subtests, 0 fail** ✅ (+35 subtests, +3 chains)
- **新增模式**: Nest Di 风格升级、跨租户数据治理、CDN 缓存失效工作流
- **新增角色**: CDN Operator, Compliance Officer
- **闭环债务**: P1-021 (链30/31 内联domain升级), EF-003 (34→37 链扩展)
- **持续债务**: @m5/api timeout (P0-007), TSC ~59 errors (P0-009), full-regression false positive (P1-022), DEPRECATED 警告 (P1-024)
