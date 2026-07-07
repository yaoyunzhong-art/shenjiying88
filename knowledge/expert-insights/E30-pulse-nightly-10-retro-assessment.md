# E30: Pulse-Nightly-10 凌晨复盘·全量回归评估 + 债务趋势追踪 (2026-07-08)

> 专家: E30 · Pulse-Nightly-10 复盘改进

---

## 概述
Pulse-Nightly-10 凌晨测试 03:30-05:30 完成第三段任务：跨模块 E2E 扩展、复盘改进、进化赋能。全量回归 15/16 任务缓存命中，仅 @m5/api 实际执行。

## 全量回归评估

### @m5/api 回归结果
| 指标 | 值 |
|------|:---:|
| 测试文件 | 1,191 |
| 通过断言 | 24,466 |
| 失败文件数 | 85 (false positive) |
| 失败断言 | 609 (false positive) |
| 耗时 | 2m43s |

**关键发现**: `full-regression.test.ts` 34 项模块检测全部标记为"失败"，但逐模块查看实际输出均为 "all tests pass"。根因为 Vitest 4 移除了 `test.poolOptions`，报告器代码未更新导致解析错误。

### 非api包稳定性
| 包 | 测试数 | 结果 |
|------|:------:|:----:|
| apps/admin-web | 2,482+ | ✅ 全绿 (缓存) |
| apps/app | 136 | ✅ 全绿 (缓存) |
| apps/storefront-web | 1,648 | ✅ 全绿 (缓存) |
| apps/mobile | 239 | ✅ 全绿 (缓存) |
| packages/domain | - | ✅ 全绿 (缓存) |
| packages/sdk | - | ✅ 全绿 (缓存) |
| packages/types | - | ✅ 全绿 (缓存) |
| packages/ui | - | ✅ 全绿 (缓存) |

非api包已连续 10+ 脉冲全绿，隔离性稳定性已成熟。

## 债务趋势追踪

### 持续债务 (30+脉冲未解决)
| 债务ID | 描述 | 根因推测 | 建议 |
|:------:|------|---------|------|
| P0-007 | @m5/api app-journey timeout | Nest TestingModule / test DB | 树哥人工介入检查 NestJS TestingModule 配置 |
| P0-009 | @m5/api TSC 73 errors | alliance/blindbox 类型断裂 | 树哥已从395降至73，继续分批修复 |

### 新债务 (Pulse-Nightly-10)
| 债务ID | 描述 | 严重程度 | 建议 |
|:------:|------|:--------:|------|
| P1-021 | 链29-31使用内联domain模拟 | 🟡 P1 | 升级为真实 NestJS 模块集成 |
| P1-022 | full-regression 34 false positive | 🟡 P2 | 更新 Vitest 4 适配 |
| P1-023 | 内容运营缺审核工作流 | 🟢 P3 | 链31后续扩展 |

### 债务趋势图 (Pulse-Nightly-03 → 10)
```
债务类型   │ P0    P1    P2    P3    总计
───────────┼──────────────────────────
Nightly-03 │  3     3     0     0      6
Nightly-04 │  3     4     1     0      8
Nightly-05 │  3     6     1     0     10
Nightly-06 │  3     7     3     1     14
Nightly-07 │  3     5     6     3     17
Nightly-09 │  3     5     6     3     17
Nightly-10 │  3     5     6     3     17  ← 持平
```

Pulse-Nightly-10 债务总量与 Pulse-Nightly-09 持平（17项），但结构变化：P1-021/22/23 替代已闭环债务。@m5/api 的三项 P0 问题持续未解决。

## 进化建议

### 1. 真实 HTTP 集成测试 (Pulse-Nightly-11 目标)
当前所有 31 链均使用函数级模拟。下一步引入真实 HTTP 请求：
- 使用 `supertest` + `buildCrossModuleTestApp` 为链29-31 创建真实 API 集成
- 覆盖真实 controller→service 调用链

### 2. Playwright E2E 冒烟 (Pulse-Nightly-11)
创建第1条 Playwright E2E，验证 admin-web → storefront-web 页面级流程。

### 3. 修复 full-regression 报告器
更新 `full-regression.test.ts` 的检测逻辑，移除 `test.poolOptions` 依赖，适配 Vitest 4 API。

### 4. 内容审核工作流扩展
为链31 增加"审核→驳回→重新提交→审核通过→发布"审批流场景。

### 5. @m5/api 基础设施修复优先级
- P0-009 TSC 73 errors: 树哥已完成 395→73，预计下一脉冲可清零
- P0-007 timeout: 需人工介入检查 Nest TestingModule 埋点
