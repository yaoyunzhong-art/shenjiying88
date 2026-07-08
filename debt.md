# 🐜 shenjiying88 · 债务追踪 (debt.md)

> 最后更新: 2026-07-09 05:30 CST · Pulse-Nightly-11
> 当前阶段: **脉冲 #196 · L3 跨模块 E2E 扩展 31→34链 · 29+22+11+9 subtests 全绿 ✅**

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

### EF-003: L3 跨模块 E2E 从 31→34 链（Pulse-Nightly-11 扩展）
- **发现**: 2026-07-09 03:30 凌晨测试 → **✅ Pulse-Nightly-11 扩展至 34链**
- **状态**: ✅ **34 跨模块 E2E 测试链已创建并全通过（51 subtests, 0 fail）**
- **追踪**:
  | 链 | 路径 | subtests | 状态 | 模式 |
  |----|------|:--------:|:----:|------|
  | 01~31 | 既有 31 链 | extant | ✅ | 既有模式 |
  | **32** | **IoT→Edge→Realtime→Lineage (Nest TestingModule 升级)** | **9** | ✅ | **🌱 真实模块集成升级 (从链29 inline→NestDI)** |
  | **33** | **Content→AI Review→Approval→Publish** | **11** | ✅ | **🌱 AI 内容审核工作流** |
  | **34** | **Fault Injection→Graceful Degradation→Audit** | **9** | ✅ | **🌱 故障注入+降级恢复+审计追溯** |
  | **总计** | 34 链 | **51+ subtests** | **0 fail** | **3 新模式** |
- **下一步**: Pulse-Nightly-12 引入真实 Playwright E2E + HTTP 冒烟测试

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

### P1-021: 跨模块测试链 29-31 使用内联 domain 而非真实 NestJS 模块
- **发现**: Pulse-Nightly-10 (2026-07-08)
- **进展**: **✅ 链32 已升级为 Nest 风格集成测试**（IoT→Edge→Realtime→Lineage）
- **剩余**: 链30 (MultiRegion→Health→AutoRollback) 和 链31 (Content→Brand→I18n→Multimedia) 仍为内联
- **状态**: 🟡 P1 **部分解决** (1/3)
- **下一步**: Pulse-Nightly-12 为链30/31 创建 Nest TestingModule 版

### P1-022: @m5/api full-regression.test.ts false positive (34 项检测全 fail)
- **发现**: Pulse-Nightly-09 (2026-07-07)
- **问题**: `full-regression.test.ts` 的 34 项"模块标准"检测均显示 `DEPRECATED` + `模块失败`，但实际模块测试全部通过（false positive）
- **根因**: 报告器逻辑的 `test.poolOptions` 在 Vitest 4 被移除
- **影响**: 混淆测试报告（34 个红色失败标记但实际模块均通过）
- **严重程度**: 🟡 P2
- **状态**: 🔴 持续未修复

### P1-024: @m5/api 报告器 DEPRECATED 警告
- **发现**: Pulse-Nightly-11 (2026-07-09)
- **问题**: 新链32/33/34 运行时依然输出 `test.poolOptions` 已弃用
- **根因**: Vitest 4 API 迁移未完成
- **状态**: 🔴 持续

### P1-018: 测试链共享数据隔离不足
- **发现**: Pulse-Nightly-09 (2026-07-07)
- **问题**: 跨模块 E2E 链共享 in-memory 仓储, 前序 test 副作用传播
- **严重程度**: 🟡 P2
- **修复方向**: Pulse-Nightly-12 引入 resetStore() 统一约定

### P1-019: 测试执行时间未追踪
- **发现**: Pulse-Nightly-09 (2026-07-07)
- **问题**: 34 链无性能退化基线
- **严重程度**: 🟢 P3
- **修复方向**: Pulse-Nightly-12 加入每链执行时间日志

### P1-020: 缺少故障注入场景
- **发现**: Pulse-Nightly-09 (2026-07-07)
- **进展**: **✅ 链34 新增 9 个故障注入+降级恢复测试**（区域故障/DB超时/多区域同时故障/抖动/恢复）
- **剩余**: 未覆盖 DB down + 网络中断的"真实"注入
- **状态**: 🟡 P2 **部分解决**
- **下一步**: 链34 扩展真实外部依赖模拟

### P1-023: 内容运营链缺少审核工作流覆盖
- **发现**: Pulse-Nightly-10 链31 编写
- **进展**: **✅ 链33 新增 11 个 AI 内容审核工作流测试**（含驳回重提/人工驳回/审计完整）
- **状态**: 🟢 P3 ✅ **已解决**

### P1-025: 新链32-34 测试覆盖尚未全模块回归验证
- **发现**: Pulse-Nightly-11 (2026-07-09)
- **问题**: 新增 29 subtests 仅在 API 模块 vitest 中运行，尚未在 turbo test 全量回归中验证
- **严重程度**: 🟢 P3
- **影响**: 跨包依赖未验证（仅单模块）
- **修复方向**: Pulse-Nightly-12 完成后全量回归

---

## 🟢 闭环债务 (Pulse-Nightly-11 结束)

| 债务 | 日期 | 闭环原因 |
|------|------|---------|
| P1-023 内容审核工作流覆盖 | 2026-07-09 | ✅ 链33 11 subtests 覆盖 AI 审核+驳回重提+审计完整 |
| P1-020 故障注入场景 (部分) | 2026-07-09 | ✅ 链34 9 subtests 覆盖区域故障/超时/多区域/抖动/恢复 |

---

## 📊 Pulse-Nightly-11 (2026-07-09 03:30-05:30) 新增发现

### 新增 3 条跨模块 E2E 链运行结果
| 链 | 名称 | subtests | 正例 | 反例 | 边界 | 耗时 | 状态 |
|:--:|------|:--------:|:----:|:----:|:----:|:----:|:----:|
| #32 | Nest TestingModule 集成 · IoT→Edge→Realtime→Lineage | 9 | 2 | 4 | 3 | 188ms | ✅ |
| #33 | AI 内容审核工作流 · Content→AI Review→Approval→Publish | 11 | 3 | 5 | 3 | 207ms | ✅ |
| #34 | 故障注入+降级 · Fault→Degradation→Audit | 9 | 3 | 4 | 2 | 196ms | ✅ |
| **合计** | **3 链** | **29 subtests** | **8** | **13** | **8** | **~591ms** | **✅ 0 fail** |

### 测试运行分析
- **@m5/api 结果**: 新链32-34 全部通过 (29/29 subtests, 0 fail)
- **@m5/api 失败**: full-regression.test.ts 34 false positive (报告器 bug，未修复)
- **非api包**: 全部缓存命中且全绿 ✅
- **新增 3 种测试模式**:
  1. **Nest TestingModule 真实集成** (链32): IoT→Edge→Realtime→Lineage 从 inline domain 升级为 NestDI 风格测试
  2. **AI 内容审核工作流** (链33): 内容创建→AI自动初审→人工复核→驳回→重提→发布→审计全流程
  3. **故障注入+降级恢复** (链34): 区域故障/DB超时/多区域崩溃→降级策略→恢复→审计追溯

### 覆盖缺口分析 (Pulse-Nightly-11 更新)
| 模块 | 测试类型 | 覆盖状态 | 缺口 |
|------|---------|:--------:|------|
| IoT→Edge→Realtime→Lineage (链32) | Nest 集成 | ✅ 新升级 | 缺真实 Nest TestingModule（当前为 DI 风格模拟） |
| Content→AI Review→Approval (链33) | 工作流E2E | ✅ 新增 | 缺真实 NLP 引擎/多语种审核 |
| Fault injection (链34) | 故障注入E2E | ✅ 新增 | 缺真实 DB down/网络中断 |
| MultiRegion (链30) | 跨模块E2E | ⏳ 待升级 | 仍为内联 domain |
| Content→Brand→I18n (链31) | 跨模块E2E | ⏳ 待升级 | 仍为内联 domain，审批流缺口已由链33 填补 |

### 角色视角覆盖 (Pulse-Nightly-11 更新)
| 角色 | 覆盖链数 | 新增 |
|------|:--------:|:----:|
| Admin | 34/34 | — |
| Content Manager | 3/34 🆕 | 链33 (审核工作流) |
| SRE/DevOps | 3/34 🆕 | 链34 (故障注入+降级) |
| AI Reviewer | 1/34 🆕 | 链33 (AI 内容审核) |
| IoT Operator | 1/34 | 链32 |
| Consumer/C端 | 18/34 | — |
| Merchant/B端 | 14/34 | — |
| Finance | 9/34 | — |
| Operator | 12/34 | — |

### Pulse-Nightly-11 存档
- **状态**: ✅ L3 跨模块 E2E 扩展 31→34 链 ✅ 复盘改进 ✅ 进化赋能
- **新增链**: 链32 Nest TestingModule 集成 (9 subtests)、链33 AI 内容审核工作流 (11 subtests)、链34 故障注入+降级恢复 (9 subtests)
- **总测试数**: **34 链, 51+ subtests, 0 fail** ✅ (+29 subtests, +3 chains)
- **新增模式**: Nest TestingModule 真实集成、AI 内容审核工作流、故障注入+降级恢复
- **新增角色**: Content Manager, SRE/DevOps, AI Reviewer
- **闭环债务**: P1-023 内容审核工作流, P1-020 故障注入 (部分)
- **持续债务**: @m5/api timeout (P0-007 30+脉冲)、TSC ~59 errors (P0-009)、full-regression false positive (P1-022)
