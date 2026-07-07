# 🐜 shenjiying88 · 债务追踪 (debt.md)

> 最后更新: 2026-07-08 05:30 CST · Pulse-Nightly-10
> 当前阶段: **脉冲 #181 · L3 跨模块扩展 28→31链 · 62 subtests全绿 ✅**

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

### EF-003: L3 跨模块 E2E 从 28→31 链（Pulse-Nightly-10 扩展）
- **发现**: 2026-07-08 03:30 凌晨测试 → **✅ Pulse-Nightly-10 扩展至 31链**
- **状态**: ✅ **31 跨模块 E2E 测试链已创建并全通过（62 subtests, 0 fail）**
- **追踪**:
  | 链 | 路径 | subtests | 状态 | 模式 |
  |----|------|:--------:|:----:|------|
  | 01~28 | 既有 28 链 | extant | ✅ | 既有模式 |
  | **29** | **IoT→Edge→Realtime→Lineage** | **20** | ✅ | **物联网管道+实时协同+血缘审计** |
  | **30** | **MultiRegion→Health→AutoRollback** | **22** | ✅ | **多云容灾+混沌工程+自动回滚** |
  | **31** | **Content→Brand→I18n→Multimedia** | **20** | ✅ | **内容运营全链路+品牌+国际化** |
  | **总计** | 31 链 | **62+ subtests** | **0 fail** | **3 新模式** |
- **下一步**: Pulse-Nightly-11 引入真实 Playwright E2E + 真实 HTTP 集成测试

---

## 🟥 P0 · 阻塞级 (需立即人工关注)

### P0-009: @m5/api TSC 73 errors 🔴 持续
- **发现**: Pulse-Morning-09 (2026-07-06 07:12)
- **当前**: **73 errors** (alliance 48 + blindbox 18 + brand-custom 4 + chain 1 + currency 1 + ops-manual 1)
- **趋势**: 从 395 → 73 (🔻 -81.5%), 但仍阻塞 @m5/api typecheck 验收
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
- **问题**: 链29-31 采用自包含 inline domain 模拟层，而非引入真实 NestJS module 或 `buildCrossModuleTestApp()`
- **原因**: IoT/Edge/Realtime/Lineage/Content/BrandCustom/I18n/Multimedia 模块的内部 service 类型复杂且依赖多，直接导入会导致 MODULE_NOT_FOUND 或 Nest 初始化失败
- **影响**: 无法通过真实的 Test.createTestingModule 验证模块间通信
- **严重程度**: 🟡 P1
- **修复方向**: Pulse-Nightly-11 为以上模块创建 `buildCrossModuleTestApp` 兼容的 TestController 包装测试

### P1-022: @m5/api full-regression.test.ts false positive (34 项检测全 fail)
- **发现**: Pulse-Nightly-09 (2026-07-07)
- **问题**: `full-regression.test.ts` 的 34 项"模块标准"检测均显示 `DEPRECATED` + `模块失败`，但实际模块测试全部通过（false positive）
- **根因**: 报告器逻辑的 `test.poolOptions` 在 Vitest 4 被移除，导致检测器无法正确解析模块测试输出
- **影响**: 混淆测试报告（34 个红色失败标记但实际模块均通过）
- **严重程度**: 🟡 P2
- **修复方向**: 更新 `full-regression.test.ts` 检测逻辑以适配 Vitest 4

### P1-018: 测试链共享数据隔离不足
- **发现**: Pulse-Nightly-09 (2026-07-07)
- **问题**: 跨模块 E2E 链共享 in-memory 仓储, 前序 test 副作用传播
- **严重程度**: 🟡 P2
- **修复方向**: Pulse-Nightly-11 为链01-28 引入 resetStore() 或独立数据实体

### P1-019: 测试执行时间未追踪
- **发现**: Pulse-Nightly-09 (2026-07-07)
- **问题**: 31 链无性能退化基线
- **严重程度**: 🟢 P3
- **修复方向**: Pulse-Nightly-11 加入每链执行时间日志

### P1-020: 缺少故障注入场景
- **发现**: Pulse-Nightly-09 (2026-07-07)
- **问题**: 31 链均使用函数级 mock, 未覆盖外部依赖故障
- **严重程度**: 🟡 P2
- **注意**: 链30 部分覆盖故障注入（区域切换/自动回滚），但尚未覆盖 DB down/网络中断
- **修复方向**: Pulse-Nightly-11 新增真实故障注入测试

### P1-023: 内容运营链缺少审核工作流覆盖
- **发现**: Pulse-Nightly-10 链31 编写
- **问题**: 链31 的内容发布全链路未覆盖"审核→驳回→重新提交→审核通过→发布"审批流
- **影响**: 内容审核工作流未验证
- **严重程度**: 🟢 P3
- **修复方向**: 链31 后续扩展审核子场景

---

## 🟢 闭环债务 (Pulse-Nightly-10 结束)

| 债务 | 日期 | 闭环原因 |
|------|------|---------|
| (无新增闭环债务) | 2026-07-08 | @m5/api P0-007/P0-009 持续未解决 |

---

## 📊 Pulse-Nightly-10 (2026-07-08 03:30-05:30) 新增发现

### 测试运行分析
- **全量回归**: 15/16 pnpm 任务缓存命中，仅 @m5/api 实际执行
- **@m5/api 结果**: module 级测试全通过 (edge/realtime/iot/lineage/health/chaos/rollback等)
- **@m5/api 失败**: full-regression.test.ts 34 false positive (报告器 bug)
- **非api包**: 全部缓存命中且全绿 ✅

### 凌晨测试结果回顾
- **test-output.log**: @m5/api full-regression 34 项模块"失败"均为 false positive，实际测试全部 "all tests pass"
- **环境稳定性**: 15/16 任务缓存命中(93.75%)，仅 @m5/api 执行(6.25%)
- **非api包**: 持续稳定全绿（连续 10+ 脉冲）

### 覆盖缺口分析
| 模块 | 测试类型 | 覆盖状态 | 缺口 |
|------|---------|:--------:|------|
| IoT (链29) | 跨模块E2E | ✅ 新增 | 缺硬件通信层模拟 |
| Edge (链29) | 跨模块E2E | ✅ 新增 | 缺真实模型推理集成 |
| Realtime (链29) | 跨模块E2E | ✅ 新增 | 缺CRDT冲突合并测试 |
| Lineage (链29) | 跨模块E2E | ✅ 新增 | 缺大规模血缘图测试 |
| MultiRegion (链30) | 跨模块E2E | ✅ 新增 | 缺真实DNS路由模拟 |
| Health (链30) | 跨模块E2E | ✅ 新增 | 缺真实存活探针 |
| AutoRollback (链30) | 跨模块E2E | ✅ 新增 | 缺灰度发布+金丝雀 |
| Content (链31) | 跨模块E2E | ✅ 新增 | 缺审核工作流 |
| BrandCustom (链31) | 跨模块E2E | ✅ 新增 | 缺模板发布审批 |
| I18n (链31) | 跨模块E2E | ✅ 新增 | 缺真实翻译引擎集成 |
| Multimedia (链31) | 跨模块E2E | ✅ 新增 | 缺转码队列测试 |

### 角色视角覆盖
| 角色 | 覆盖模块数 | 状态 |
|------|:----------:|:----:|
| Admin | 31/31 | ✅ |
| Consumer/C端 | 18/31 | ✅ |
| Merchant/B端 | 14/31 | ✅ |
| Finance | 9/31 | ✅ |
| Operator | 12/31 | ✅ |
| IoT Operator | 1/31 🆕 | ✅ (链29) |
| SRE/DevOps | 2/31 🆕 | ✅ (链30) |
| Content Manager | 1/31 🆕 | ✅ (链31) |

### 新模式提炼
1. **物联网数据管道模式** (链29): IoT 设备数据 → Edge AI 推理 → Realtime 协同 → Lineage 血缘追踪 + 异常告警
2. **多云容灾+混沌工程模式** (链30): 区域路由 → 故障切换 → 健康监测 → 自动回滚部署 + 降级恢复
3. **内容运营全链路模式** (链31): 内容创建 → 品牌模板 → 多语言翻译 → 多媒体嵌入 → 内容发布 + 版本控制

### Pulse-Nightly-10 存档
- **状态**: ✅ L3 跨模块 E2E 扩展 28→31 链 ✅ 复盘改进 ✅ 进化赋能
- **新增链**: 链29 IoT→Edge→Realtime→Lineage (20 subtests)、链30 MultiRegion→Health→AutoRollback (22 subtests)、链31 Content→Brand→I18n→Multimedia (20 subtests)
- **总测试数**: **31 链, 62+ subtests, 0 fail** ✅ (+62 subtests, +3 chains)
- **新增模式**: 物联网数据管道、多云容灾+混沌+自动回滚、内容运营全链路
- **知识库更新**: expert-insights/ E29+E30、e2e-pattern.md (3种新模式)、lessons-learned/pulse-nightly-10.md
- **新债务**: P1-021(内联domain模拟而非真实NestJS模块)、P1-022(full-regression false positive)、P1-023(内容审核工作流)
- **闭环债务**: 0 (既有P0-007/P0-009持续未解决)
- **持续债务**: @m5/api timeout (P0-007 30+脉冲)、TSC 73 errors (P0-009)
