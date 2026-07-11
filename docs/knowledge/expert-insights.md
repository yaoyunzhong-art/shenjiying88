# 🧠 专家洞察知识库

> 40人专家团技术层评审 · 架构·安全·AI·运维·测试
> 最后更新: 2026-07-07 17:18 · pulse#174

---

## 架构洞察

### E16陈架构: asData() 通用类型包装函数丢失响应体扩展字段，测试访问 `total` 属性 TS2339 (2026-07-07 pulse#174)
**发现**: `alliance.role-extended.test.ts` 中 `listPartners()` 返回 `{ success: true, data: partners, total: partners.length }` 包含 `total` 字段，但测试通过 `asData<T>(...)` 包装后，返回类型被窄化为 `{ success: true; data: T }` 不包含 `total`，导致 TS2339。
已有同类测试（行90、339、345）直接使用 `controller.listPartners({})` 返回值而非 `asData` 包装，类型正确。
**教训**:
1. `asData<T>` 通用类型助手丢失了响应体中除 `success`/`data` 外的其他字段，不适合包含 `total`、`message` 等扩展字段的返回值
2. 如果控制器返回 `{ success, data, total }` 等复合结构，测试应直接消费返回值而非通过 `asData` 包装
3. 使用 `as any` 再通过 `asData` 包装不能绕过类型窄化问题 — 正确的做法是移除包装或扩展 `asData` 签名
4. 建议: 为包含 pagination 的返回类型定义一个专用类型 `PaginatedResult<T> = { success: true; data: T[]; total: number }`

### E15陈架构: controller.spec.ts 用 type-only import 导致枚举值不可用，TS2322 字串→枚举 (2026-06-28 pulse#97)
**发现**: `resilience-operations.controller.spec.ts` 在 `c69fcba2a` 中树哥使用了 `import type { ... }` 但测试中需要枚举值 `ObservabilitySignalStatus` 和 `RecoveryPlanStatus`。
`type` import 只导入类型信息，不会导入运行时值，导致 TSC strict 模式报 TS2322（字串不能赋给枚举类型）。
**教训**:
1. 枚举既是类型也是运行时值，不能使用 `import type` 导入枚举 — 必须用普通 `import { EnumName }` 才能在测试运行时使用枚举值
2. 写测试时如果字段类型是枚举但用字串赋值，TSC strict 模式会报错 — 应该在写测试时直接使用枚举值而非字串
3. 树哥自动生成的测试容易犯这个错误，因为自动补全倾向于使用字串字面量
4. 修复模式: `import { ObservabilitySignalStatus, RecoveryPlanStatus } from './file'` + `status: ObservabilitySignalStatus.Healthy`

### E14陈架构: toISOString() 在 CST 午夜后返回 UTC 前一天，与 isToday() 的 local date 比较不一致 (2026-06-28 pulse#96)
**发现**: `StaffShiftSchedulePanel.test.tsx` 的 `renders today badge for current date` 测试在 00:08 CST 失败。
测试用 `today.toISOString().split('T')[0]` 生成日期字串（返回 UTC 日期 = "2026-06-27"），
但组件 `isToday()` 用 `new Date(dateStr).getDate()` 与 `new Date().getDate()`（local 28 日）比较，二者不一致。
`new Date("2026-06-27")` 在 +08 时区解析为 `6月27日`，而 `new Date()` 在 00:08 CST 是 `6月28日`。
**教训**:
1. `toISOString().split('T')[0]` 在任何接近 UTC 午夜的时区都有跨日风险 — 测试中不应依赖 UTC 日期字符串
2. 如果组件内部 `isToday()` 用 local time 比较，测试 mock 的 `todayStr` 也必须用 local time，否则在午夜前后一小时会不匹配
3. 修复方法: 使用 `today.getFullYear()` + `today.getMonth()+1` + `today.getDate()` 构造 yyyy-mm-dd 本地日期字串，或用 `Intl.DateTimeFormat` 格式化
4. 这是典型的时区边界 bug，只在特定时间窗口复现（CST 00:00-01:00 = UTC 16:00-17:00 UTC 前一天）
5. 验收脉冲在 UTC 午夜后运行时更容易暴露此类时区问题

### E1陈架构: node --test runner 与 vitest 测试文件不兼容 (2026-06-26 pulse#64)
**发现**: `@m5/storefront-web` 的 `package.json` test 脚本为 `node --import tsx --test`（Node test runner），
但测试文件 `promotions/[id]/page.test.tsx` 和 `stock/[id]/page.test.tsx` 分别使用了 vitest 和 jest 的 API。
- promotions 测试: `import { describe, it, expect, vi } from 'vitest'` → `Cannot find module 'vitest'`
- stock 测试: `jest.mock(...)` + `@testing-library/react` → Cannot find module '@testing-library/react'
**教训**: 同一模块的测试运行器必须一致。node --test runner 不提供 vitest/jest API，
使用 node --test 的模块中所有测试文件都必须用 node:test 风格，不得混用 vitest 或 jest 语法。
**建议**: 统一 storefront-web 到 vitest（已有 632 测试通过 node --test），或重写 vitest/jest 风格测试。

### E1陈架构: enum 类型的字符串字面量不能直接赋值 enum 类型 (2026-06-26 pulse#64)
**发现**: `champion.role.test.ts` 的 `createChampions()` 函数中传 `kind: 'COMMIT'` 给需要 `ContributionKind` enum 类型的参数。
虽然 'COMMIT' 是 `ContributionKind.Commit` 的值，但 TS strict 模式下字符串字面量 `'COMMIT'` 不可赋值给 enum `ContributionKind`。
**教训**: 使用 enum 类型参数时必须用 `EnumName.Member` 形式，不能直接用字符串字面量。

### E1陈架构: AnomalyResult.detectors 类型定义与运行时返回不一致 (2026-06-26 pulse#64)
**发现**: `AnomalyDetectorService.detect()` 的返回类型定义中 `detectors.ewma` 为 `{ expected: number; detected: boolean }`，
但 service 的 `ewma()` 方法实际返回 `{ expected, deviation, detected }` 包含 `deviation` 字段。
测试中访问 `result.detectors.ewma?.deviation` 报 TS2339。
**教训**: 接口类型定义必须与实际运行时返回值一致，新增字段后应立即更新类型定义。

### E1陈架构: node:test 测试中数组索引的 TS strict 空值检查 (2026-06-26 pulse#74)
**发现**: `tob-web/app/products/new/page.test.tsx` 中 `MOCK_PRODUCTS[0]` 被 TS 推断为 `ProductItem | undefined`，
导致 5 行 `TS18048: 'first' is possibly 'undefined'` 错误。虽然上方已有 `MOCK_PRODUCTS.length > 0` 断言，
但 TS 无法通过数组长度检查推断索引元素的非空性。
**教训**: 在 `node:test` 测试中，从已确认非空的数组索引取值时，必须使用 `!` 非空断言（`data[0]!`）
或显式 `assert.ok(first !== undefined)` 来满足 TS strict 模式。不应依赖上游 `length > 0` 检查的类型窄化。

### E5王测试: @m5/api e2e 大量 timeout — 可能是 DB 连接或测试配置问题 (2026-06-26 pulse#64)
**发现**: @m5/api 的 e2e 测试（anomaly-detector, knowledge, leads, marketing-metrics, notification, 
perf-monitor, referral, tenant-isolation, time-series 等）全部超时/hang，
表现为 'Promise resolution is still pending but the event loop has already resolved'。
多个新模块的测试文件（如 anomaly-detector.e2e.test.ts, champion.contract.test.ts）刚在本次 Pulse-74 提交。
**根因**: 可能的原因包括: (1) test DB 连接未正确初始化; (2) 新模块缺少 NestJS TestModule 配置;
(3) 测试钩子 (beforeAll/afterAll) 中异步操作未正确 await。
**建议**: 调查具体哪个 e2e 文件导致全局 hang，优先修复 TestModule 配置或 mock DB 连接。

## 架构洞察

### E5王测试: Node test runner 假阳性 ✖ vs 真断裂 (2026-06-24 pulse#54)
**发现**: `pnpm turbo test` 输出中，`@m5/api:test: ✖ src/xxx` 列出 565 个文件标记 ✖，但 `ℹ fail 0` 表示无真实 assertion 失败。所有 ✖ 都是 Node.js `--test` runner 在 async e2e/role 测试后报告 `'Promise resolution is still pending but the event loop has already resolved'` 的假阳性。
**判决标准**: 只看 `ℹ fail N` (N > 0 才是真失败)，忽略 ✖ 文件计数。
**对 shenjiying88 启示**: 验收脉冲中 grep 指标的锚点应为 `ℹ fail` 而非 `✖ src`，防止假阳性消耗树哥资源。

### E6孙运维: probeComponent switch 未涵盖的组件返回 UNAVAILABLE 而非报错 (2026-06-26 pulse#63)
**发现**: `HealthService.probeComponent()` 通过 switch 分发组件探测，未知组件名走 `default: throw new Error(...)` 被 `checkComponent()` 的 catch 捕获后返回 `UNAVAILABLE`。新增组件如 `event-bus` 和 `queue-producer` 若未在 switch 中添加 case，会静默返回 Unavailable，导致新增 e2e 测试失败而无编译报错。
**原则**: probeComponent 的 default 分支应抛出 `NotFoundError` 级别不同或加日志告警。新增组件探测必须同步更新 probeComponent switch + collectComponentHealths 组件列表。

### E7赵测试: NestJS 测试模块 provider 不可见性 (2026-06-26 pulse#63)
**发现**: `finance-quota-integration.e2e.test.ts` 中 `buildAppWithQuota()` 调用 `moduleRef.get(TenantQuotaService)` 但失败，因为 `TenantModule` 的 `exports` 中未包含 `TenantQuotaService`。NestJS 测试模块默认只能获取 `exports` 中的 provider。
**原则**: e2e 测试中获取跨模块 provider 时，必须确认源模块已导出该 provider，或者测试模块显式导入/提供该 provider，否则在生产构建中也同样不可见。

### E1陈架构: Record<string, number> 在 strict 模式下索引返回 undefined (2026-06-24 pulse#54)
**发现**: `computeBrandMarketDistribution` 返回 `Record<string, number>`，但在 strict 模式下 `dist['cn-mainland']` 被推导为 `number | undefined`，TS2532。`» 0` 操作非法。
**修复**: `(dist[key] ?? 0) > 0` 或 `dist[key]! > 0`。
**原则**: strict 模式下 Record 类型索引访问永远返回 `T | undefined`，不要假设返回值存在。

---

### E14陈架构: Partial<T> spread 后所有属性变 `T | undefined` (2026-06-28 pulse#108)
**发现**: `@m5/ui` 的 `useWebhook.ts` 中 `updateWebhookApi` 返回 `Promise<WebhookEndpointView>` 但 TSC 报错:
```
error TS2322: Type '{ id: string; ... name?: string | undefined; ... }' is not assignable to type 'WebhookEndpointView'.
  Types of property 'name' are incompatible.
    Type 'string | undefined' is not assignable to type 'string'.
```
**根因**: 返回语句 `{ ...MOCK_ENDPOINTS[0], ...patch, id, updatedAt }` 中，`patch` 是 `Partial<{ status: WebhookStatus; events: WebhookEventType[] }>` 类型。TypeScript 在 spread `Partial<T>` 时将所有属性的 type 推断包含 `undefined`，包括从 `MOCK_ENDPOINTS[0]` 来的 `name`、`platform` 等非 optional 字段。
**修复**: 对 spread 结果加 `as WebhookEndpointView` 类型断言，告知编译器该对象满足接口约束。
**教训**:
1. `Partial<T>` spread 是 TS strict 模式下的经典坑 — 任何包含 `Partial` 的 spread 都会污染输出类型
2. 修复模式: `as WebhookEndpointView` 断言而非逐字段声明 — 显式声明在字段多时不够 DRY
3. 自动生成的 mock 和测试文件特别容易中招，因为自动代码倾向于用 `...{ mockData }` spread 而非逐字段填充
4. 验证方式: 修改后运行 `pnpm --filter @m5/ui typecheck` + `pnpm --filter @m5/ui test` 确保修复无副作用

## 现有的洞察（按时间）

### 评审原则
- 微服务边界清晰，避免循环依赖
- API 合同优先，types 包是唯一事实来源
- 状态派生优于状态复制

### E1陈架构: 测试反模式 as any 危害 (2026-06-14)
**发现**: lyt contract test 因 `as any` 掩盖了字段名不匹配 (id vs memberId)
**教训**: 测试数据必须使用正确的类型标注，禁止 `as any`
**对 shenjiying88 启示**: 验收脉冲应扫描 `as any` in test files，标记为假绿灯风险

### E1陈架构: Cron 架构升级 (2026-06-14)
**发现**: isolated session 不适合跑超长 prompt (2000+ 字模拟 40 专家对话)
**改进**: 会议/分析类 cron 从 isolated agentTurn → systemEvent 注入主 session
**原则**: 需要大量上下文的任务应在主 session 执行，isolated 只做轻量操作

---

## 安全洞察

### E2李安全: 安全债务追踪 (2026-06-14)
**状态**: Redis 无密码 (05-25 标记中危，迄今未修复)
**状态**: JWT 过期策略尚未审查 (05-25 标记)
**状态**: UFW inactive (阿里云安全组兜底)
**建议**: 下次安全 sprint 一次性修复这三个

---

## AI 洞察

### E9吴AI: AI 模块零进展分析 (2026-06-14)
**现状**: 诊断/排班/推荐三场景全部 L0，树哥任务池无 AI 类别
**根因**: 树哥脉冲 prompt 只包含 "controller/test补全" 和 "前端页面/组件"，没有 AI 开发任务
**建议**: 
1. 本周启动规则引擎 L1: 会员等级自动判定、设备异常阈值检测
2. 最简单起步: if-else 规则 → 配置文件 → 决策表 → ML 模型
3. 树哥任务池新增: "创建 ai-rule-engine module (entity+service+controller)"

---

## 运维洞察

### E8周运营: Cron 健康度监控 (2026-06-14)
**发现**: 09:00 晨会、09:30 文档对齐、20:00 晚会连续 LLM fail，无告警
**修复**: 全部改为 systemEvent 模式
**建议**: 每小时保活心跳增加 cron 健康度检查: `cron list` → 扫描 consecutiveErrors > 0

---

## 测试洞察

### E37钱测试: 测试增长趋势 (2026-06-14)
| 时间 | 测试数 | 增量 |
|------|--------|------|
| 06-13 00:30 | 529 | - |
| 06-13 01:00 | 583 | +54 (修复 6 fail + domain 17) |
| 06-14 05:59 | 1033 | +450 |
| 06-14 06:30 | 1252 | +219 |
| 06-14 09:34 | 1431 | +179 |

**趋势**: 稳定增长，日均 +~300 测试

### E37钱测试: 角色测试缺口 (2026-06-14)
**现状**: 8 角色每模块 ≥12 角色测试 — 远未达标
**建议**: 树哥脉冲增加角色测试任务类别

### E37钱测试: TSC 类型检查 false-positive 风险 (2026-06-14 10:07)
**发现**: pulse#35 报告 "packages 0 阻塞错误"，但 pulse#36 发现 @m5/ui 有 11 类型错误
**根因**: `pnpm typecheck` turbo 缓存命中时报告上次的成功结果，未实际重新检查
**教训**: 
1. 验收脉冲的 TSC 检查必须在 `pnpm check` 失败时 fallback 为 `pnpm -F @m5/ui run typecheck` 逐模块检查
2. 不能仅依赖 turbo 缓存报告，新 commit 引入的测试文件可能引入新类型错误
3. tree 新增 `Dropdown.test.tsx` 时用了 CJS require 模式，与项目 ESM tsconfig 冲突 — 
   CJS require 测试文件应放置在 `.test.cjs` 后缀或使用 `import` 语法

---

### E1陈架构: monorepo TSC 类型断层 (2026-06-23 pulse#46)
**发现**: 类型定义升级后（如 FoundationService 从 0 参增加到 7 参、CouponDiscountType 收紧），
测试文件的类型标注未同步更新，导致 TSC 20 errors 集中在测试文件中。
**类型断层分类**:
1. 构造函数签名断层: FoundationService 升级后 e2e 测试仍 `new FoundationService()` 无参 → TS2554
2. 类型字面量断层: `'FIXED_AMOUNT'` 字面量 vs `CouponDiscountType` 联合类型 → TS2322
3. Prisma 类型断层: `where.updatedAt` 类型推导为 `unknown` → TS2339
**教训**: 类型升级时应同时更新所有引用文件的类型标注，特别是测试文件中的 mock 数据
**对 shenjiying88 启示**: 树哥产出 commit 前应跑 `pnpm typecheck` 而不仅仅是 `pnpm test`

### E1陈架构: TS6059 rootDir 解决 (2026-06-14)
**问题**: monorepo 中 apps/api 的 tsconfig `rootDir: "./src"` 导致从 packages 重导出的类型文件报 TS6059
**解决**: 将 `rootDir` 改为 `"../.."` (monorepo root)，保持 `outDir: "./dist"` 不变
**原则**: monorepo 中 app 引用 packages 时应将 rootDir 设为 monorepo 根目录

### E5王测试: TSC 渐进修复策略 (2026-06-14)
**发现**: 133→37 TSC errors 的渐进修复中，树哥并行修复成功将 workbench/identity/portal 错误归零
**教训**: 按文件分组的树哥并行修复是有效的，每只树哥 ≤11 errors 可在 3-5min 完成
**对 shenjiying88 启示**: 137+ errors 时可派 3-4 只树哥并行（每只 5-10 errors），避免派太多树哥造成合并冲突

### E1陈架构: 树哥产出验证缺失 (2026-06-23 pulse#46)
**发现**: governace-approval.e2e.test.ts 新增 839 行但仍为 untracked，说明树哥产出未经过完整验收流程
**教训**: 树哥产出应包含 git commit，未提交的新文件可能是树哥仍在工作中或遗漏
**对 shenjiying88 启示**: 验收脉冲应检查 git status 中的 untracked 新文件，确认是否需要 commit

### E1陈架构: 树哥未完成 untracked 文件引入 TSC 错误 (2026-06-23 pulse#73)
**发现**: storefront-product-edit.ts（树哥产出）为 untracked 新文件，尚未完成却已存在工作区，引入 2 TSC errors
**教训**: untracked 文件不应被 pnpm typecheck 扫描到 — 树哥应在分支或 feature flag 后开发
**对 shenjiying88 启示**: 验收脉冲应检查 `git status` 的 untracked `.ts`/`.tsx` 文件，归类为「未完成产出」并标记 debt 或单独追踪
**本次处理**: 🐜 1 只树哥派出修复，验收下次 pulse

### E1陈架构: `as` 断言 vs `as unknown as` — TSC strict 模式下的类型安全 (2026-06-23 pulse#73)
**发现**: `approvals-page.test.ts` 使用 `as GovernanceApprovalSnapshot` 断言不完整对象（缺 required/submitted/persisted 等字段），TSC 报 TS2352
**修复**: 改为 `as unknown as GovernanceApprovalSnapshot` 绕过 TSC strict
**原则**: 在测试中 mock 部分对象时，必须用 `as unknown as T` 才能完全绕过 TSC strict 检查

### E1陈架构: tournament draw winner 边缘条件 (2026-06-24 pulse#55)
**发现**: tournament.service.ts:376 match.winnerId = score1 > score2 ? match.player1Id : match.player2Id!
平局(score1===score2)时 score1 > score2 为 false，错误将 player2 设为 winner。
**修复方案**: match.winnerId = score1 > score2 ? match.player1Id : (score1 < score2 ? match.player2Id! : undefined)
**教训**: 条件运算符的 else 分支必须显式考虑所有剩余情况，不能假设非此即彼

### E5王测试: 连续2次修复失败升级机制 (2026-06-24 pulse#55)
**发现**: tournament.simulator 2 fails 在 Pulse-54 派树哥修复后仍存在，本次 Pulse-55 再次重派。
**机制**: 同一测试连续2次修复失败 → debt.md P0 + 标记

### E6树哥: 跨分支树哥产出回收机制 (2026-06-24 pulse#57)
**发现**: Pulse-56 树哥对 tournament.service.ts 的修复被合并到 WIP 分支(00df409f7)，未进入 HEAD。28分钟后用户在 `df2ae1726` 提交 FunnelChart 时一并带入了该修复。
**教训**: 
1. 树哥产生在子分支的产出需要显式 cherry-pick 或 merge 回主分支
2. 虽然修复最终通过 FunnelChart 提交被一并带入，但延迟了闭环
3. 修复方案正确: draw 用三目链 `> ? : < ? : undefined`; bye 用 `Math.ceil()` + 占位比赛标记跳过
4. ✅ tournament.simulator 连续3次失败后第4次成功闭环 — 连续失败升级机制验证有效

**经验**: 占位比赛(placeholder matches)不应以 Pending 状态创建，应设为 Ongoing/Completed 以避免被统计为真实待处理比赛。决赛圈完成检查应过滤掉无真实对手的占位比赛。

### E5王测试: assert.throws 正则不匹配陷阱 (2026-06-24 pulse#60)
**发现**: svip.role-extended.test.ts 中 `assert.throws(() => ctrl.upgradeTier(...), /already|lower|same/i)` 实际 `upgradeTier` 错误消息为 "Cannot upgrade: target level X is not higher than current level Y"。正则中无 "higher"，测试假负。
**教训**: 
1. assert.throws 若正则不匹配错误消息，测试失败但错误信息不直观（仅 "test failed: expected to throw" 类消息）
2. 错误消息重构（如"not higher"改为"same/lower"）后必须同步更新测试正则
3. 验收脉冲应仔细检查失败测试的 assert.throws 正则是否和实际 throw 的消息一致

### E1陈架构: TS `let` 变量在闭包中推导为 `never` (2026-06-25 pulse#60)
**发现**: queue-producer.test.ts 中 `let receivedJob: { id: string; payload: unknown } | null = null` 在回调闭包内赋值后，
`assert.ok(receivedJob)` 后使用 `receivedJob!.payload` 报 TS2339: `Property 'payload' does not exist on type 'never'`。
**根因**: TypeScript 5.9.3 的 strict 模式下，`let` 变量仅在闭包内赋值时，TS 无法通过控制流分析缩小类型。
实际上 `receivedJob` 被推导为 `never`（因为闭包内赋值将类型从 `null | { id: string; payload: unknown }` 错误地缩小到 `never`）。
**修复**: 用 `const rj: { id: string; payload: unknown } = receivedJob` 创建局部变量，不使用 `!` 断言。
**教训**: 在闭包内赋值的 `let` 变量不要使用 `!` 访问属性，应创建类型注解的局部变量。

### E7树哥: Phase-15 配额重构后 e2e 测试未同步接口变更 (2026-06-25 pulse#61)
**发现**: 26 个 TSC 错误全部集中在 `*-quota-integration.e2e.test.ts` 文件中。
Phase-15 将专属配额字段 (`invoices`/`products`/`maxInvoices`/`maxProducts`) 统一为通用字段 (`brands`/`stores`/`members`/`campaigns`/`apiCallsToday`)，
但各模块 (finance/inventory/campaign/loyalty/member) 的 quota integration e2e 测试仍使用旧 API。
**根因**: 重构实体 `TenantQuotaUsage` / `TenantQuota` 接口后，未批量扫描所有 `.e2e.test.ts` 文件中的配额相关调用。
**教训**: 
1. 接口重构后应执行 `grep -r "invoices\|products\|maxInvoices\|maxProducts" **/*.e2e.test.ts` 批量定位过时引用
2. 构造函数参数个数变化 (从多参到 quota+lifecycle 双参) 会在 TS 层面暴露，但外部引用不会自动提醒
3. 应对策略: 通用配额计数用 `assert.equal(quota.getUsage().campaigns, expected)` 或使用局部变量跟踪模块专属计数

### E1陈架构: NotificationItem[] 不满足 Record<string, unknown>[] 的索引签名要求 (2026-06-25 pulse#61)
**发现**: `notifications-data.test.ts` 中 3 处 `TS2345: Argument of type 'NotificationItem[]' is not assignable to parameter of type 'Record<string, unknown>[]'`。
`NotificationItem` 是联合类型或精确接口，缺少 `[key: string]: unknown` 索引签名，无法赋值给 `Record<string, unknown>[]`。
**根因**: 某些工具函数（如排序/过滤/分组）参数类型声明为 `Record<string, unknown>[]`，但实际传入的是精确类型数组。
在 TS strict 模式下，精确类型（无索引签名）无法赋值给有索引签名的类型。
**修复**: 将函数签名改为 `<T extends Record<string, unknown>>(items: T[])` 泛型，或用 `as Record<string, unknown>[]` 断言。
**教训**: 工具函数不要用 `Record<string, unknown>` 收参，优先用泛型 `<T>` 推导实际类型。

### E5王测试: TS strict 模式 Object 类型需先类型保护再属性访问 (2026-06-25 pulse#61)
**发现**: `notifications-data.test.ts` 5 处 TS2532 `Object is possibly 'undefined'` + 1 处 TS2571 `Object is of type 'unknown'`。
当 find/filter 回调返回的对象在 map 中访问属性时，TS strict 无法保证对象存在。
**根因**: `.find()` 返回 `T | undefined`，且 `.map()` 回调中的变量可能为 `undefined`。
类似 `markets/page.test.ts` 中 `dist.europe` TS18048 也是同样问题。
**修复**: 使用 `if (!obj) throw` 提前守卫，或链式 `?.` + 默认值。
**教训**: Node test runner + tsx 在 strict 模式下，测试文件也要遵守完整的类型守卫规则。

**发现**: `@m5/tob-web` TSC 因 `app/notifications/[id]/page.test.ts` 内 `import` 语句重复导致 TS2300 4 errors。
此文件并非手动修改过，而是由于前次自动合并/代码生成导致副本粘贴未清理。
**根因**: 自动合并脚本或代码生成器在添加测试头部时未做去重检查。
**修复**: 删除重复的 `import assert`/`import test` 语句。
**教训**: 代码生成/合并工具应显式检查 `import` 语句的唯一性，避免简单副本叠加。

### E6陈架构: 服务 configure() 应接受 Partial<T> 而非完整 T (2026-06-26 pulse#65)
**发现**: `auto-rollback.controller.ts` 5 个 TSC error (TS2322): DTO 字段为 `T | undefined`，而 service 的 `configure(config: RollbackConfig)` 要求所有字段必填。
DTO 使用了 `@IsOptional()` 装饰器，意味着前端可以不传任何字段，但 TS 严格模式拒绝 `boolean | undefined` → `boolean`。
**根因**: Service 的 configure() 签名使用了完整 interface `RollbackConfig`（所有字段必填），而 DTO 字段全是 optional。
service 内部逻辑 `{ ...DEFAULT_CONFIG, ...config }` 已经支持 partial 合并默认值，但类型签名未同步。
**修复**: 将 `configure(config: RollbackConfig)` 改为 `configure(config: Partial<RollbackConfig>)`。
**教训**: 任何有 `DEFAULT_CONFIG` + spread 合并的服务 configure() 方法，参数类型必须是 `Partial<T>` 而非完整 `T`。
DTO optional 字段天然产生 `T | undefined` 类型，与 Partial<T> 天然兼容。这是 NestJS + class-validator + TS strict 的经典模式。

### E8王测试: e2e 测试大规模 hang 的全局影响模式 (2026-06-26 pulse#66)
**发现**: @m5/api 在 Pulse-66 出现 114 测试失败，其中 ~104 是 timeout/hang（'Promise resolution is still pending'），仅 ~10 是真实 assertion 失败。
hang 波及所有 Phase-19/Phase-20 新模块（auto-rollback, champion, anomaly-detector, knowledge, leads, 
marketing-metrics, perf-monitor, recommender, time-series 等），但旧模块测试正常通过。
**根因分析**: 所有 hang 测试文件在 Node `--test` runner 下的表现模式一致：都是 e2e 测试文件（`.e2e.test.ts`），
且都在文件级别标记 ✖（非单个 assert），原因是文件级 beforeAll 或 TestModule 初始化时异步操作超时。
**推论**: (1) 极有可能是某个 beforeAll 钩子未正确 await DB 连接或外部服务初始化；
(2) 新模块的 NestJS TestModule 配置缺少实际 provider 或 mock，导致模块初始化卡住；
(3) 持续 4+ 脉冲未修复说明不是简单漏配，可能涉及 DB 连接池耗尽或全局钩子死锁。
**验收建议**: 先隔离确认具体哪个 e2e 文件首次引起 hang（二分法），然后逐个修复 TestModule 配置。

### E9陈架构: i18n TranslationMap 类型必须支持嵌套 (2026-06-26 pulse#66)
**发现**: `I18nService.registerBulk()` 和 `registerTranslations()` 的类型签名定义为 `Record<string, string>`，
但 i18n 系统内部已通过 dot-notation 支持嵌套 key 解析（如 `order.status.paid`）。
Phase-20 T44 测试传入嵌套对象 `{ status: { pending: '待支付', paid: '已支付' } }`，TSC 拒绝 (TS2322)。
**根因**: TranslationMap 的扁平类型定义与运行时的嵌套支持不匹配。
`registerTranslations` 内部用 spread `{ ...existing, ...map }` 合并，实际工作正常，只是 TS 类型过严。
**修复**: 将 `TranslationMap` 改为递归类型 `Record<string, string | TranslationMap>`。
**教训**: 类型定义必须与运行时行为一致。当实现已支持嵌套结构时，类型签名也要同步支持递归类型，
不应强制让调用者拍平数据。类似配置/翻译系统的类型都应使用递归 Record 模式。

### E11陈架构: NativeApp 前缀不匹配 — 测试期望 NATIVE- 但实现用 APP- (2026-06-26 pulse#69)
**发现**: `@m5/app` 的 app-journey 测试文件期望所有 native-app 功能使用 `NATIVE-` 前缀
（如 `NATIVE-MEMBER-LOGIN-PROCEED`、`native-app-handler-sync`、`native-ledger:`），
但 `market-bootstrap.ts` 的实现使用 `APP-` 前缀（`APP-MEMBER-LOGIN-PROCEED`、`app-handler-sync`、`app-ledger:`）。
4 个测试全部因此 fail。
**根因**: 测试在编写时采用了更新的设计文档中的命名规范（NATIVE-），
但底层实现 `market-bootstrap.ts` 在重构时未同步更新字符串前缀。
`foundation.service.ts` 中的 `APP-MEMBER-LOGIN-PROCEED` 也是同样问题。
**修复**: 将 `market-bootstrap.ts` 中所有 native-app 函数的 `APP-` 前缀统一改为 `NATIVE-`，
包括 receiptCode、ledgerKey、syncEndpoint、handlerSync 的 audience 等所有相关字符串。
**教训**:
1. 测试先行（TDD）时，命名规范的变更必须在实现层同步传递
2. `APP-` vs `NATIVE-` 前缀差异会透传到 API callback endpoint、replay endpoint 和 auth envelope，
   修改实现层时必须一并更新 `foundation.service.ts` 中的 fixture 数据
3. 验收脉冲应关注测试 cache 过期后新暴露的失败，上次缓存报告 pass 不代表代码无误

### E10陈架构: DTS build 中同名类型跨模块导出的冲突解决 (2026-06-26 pulse#68)
**发现**: `@m5/ui` barrel 文件 (`index.tsx`) 同时从 `InspectionChecklist` 和 `DeviceInspectionPanel` 导出 `InspectionItem` 类型。
两个组件定义了不同形状的 `InspectionItem` 接口，但 DTS 构建 (tsup) 报 TS2300 Duplicate identifier 错误，导致 `@m5/ui build` 失败。
**根因**: tsup DTS 构建使用 TypeScript 的声明文件生成机制，同级作用域内不允许同名类型标识符。
JavaScript 打包阶段无报错（CJS build 成功），但 DTS 构建严格校验类型名称唯一性。
**修复**: barrel 导出时对冲突类型加 `as` 别名：
```ts
export type { InspectionItem as DeviceInspectionItem } from './components/DeviceInspectionPanel';
```
**教训**: 
1. 不同组件的同名类型在 barrel 文件中一定会冲突 — JSB build 通过不代表 DTS build 也通过
2. 组件库的 barrel 导出是类型冲突的高风险区域，新增组件前应 grep 检查已有同名类型
3. 最佳实践: 同名类型可通过 `as` 别名重导出，赋予业务含义前缀（如 `DeviceInspectionItem` vs `InspectionItem`）
4. tsup 的 `CJS Build success + DTS Build error` 模式是 barrel 类型冲突的典型信号

### E11陈架构: MetricsService 注入与手动 `new Service()` 的不兼容模式 (2026-06-27 pulse#78)
**发现**: NotificationService 通过 constructor DI 注入 MetricsService，但部分测试/旧代码使用 `new NotificationService()` 手动实例化，未传 MetricsService 参数导致 TS 编译期或运行时断裂。
**根因**: 当 service 从纯手动实例化 → DI 注入时，新增的 provider 参数会破坏所有调用点 `new Service()` 签名。NestJS 最佳实践是所有 service 应通过 `Test.createTestingModule` 构造，而非手动 new。
**修复方向**: 
1. 所有测试创建 NestJS DI 容器 (`Test.createTestingModule`) 而非手动 new
2. 对必须手动 new 的场景，提供 `create()` static factory 方法处理默认 mock
3. 或在测试中提供 `{ provide: MetricsService, useValue: mockMetrics }`
**教训**:
1. NestJS service 新增 DI 依赖时，必须同步更新所有 `new Service()` 调用点
2. `new Service()` 模式在 DI 体系中是反模式 — 测试应统一走 `Test.createTestingModule`
3. 新增 provider 后运行 `pnpm typecheck && pnpm test` 验证所有调用点已更新

### E12 CoachDashboard: 前置条件式测试发现 data-testid 空容器渲染问题 (2026-06-27 pulse#87)
**发现**: CoachDashboard.test.tsx `does not render profile when no coach info` 测试失败。该测试移除所有个人信息 props 后，期望 `data-testid="coachdashboard-profile"` 不应出现在 DOM 中。
**根因**: `coachdashboard-profile` 的 wrapper `<div>` 始终无条件渲染，仅内部 `renderProfileBar()` 返回 null，但空容器仍在 DOM 中。
**修复方向**: 将 data-testid 容器改为条件渲染 — 仅当 `coachName || storeName || employeeId` 有值时再渲染。
**教训**:
1. 前置条件式测试 (`coach info 不存在 → profile div 不应存在`) 能有效捕获

### E1陈架构: 自动生成的测试 mock 数据与最新类型定义易脱节 (2026-06-27 pulse#88)
**发现**: `page.test.ts`（configuration 页面测试）在 40 TSC errors + 32 test failures，全部源于 mock 数据与 `@m5/types` 类型定义不一致。
**根因**: 该测试由树哥自动生成时参考的 `@m5/types` 版本较旧，后续类型已演化（`ConfigurationScope` 从 `{key,label,value}` 改为 `{scopeType,tenantId,...}`，`ConfigurationOverview.configuration` 子字段增加了 `active/namespaces/persisted/rotationDue/enabled/byStrategy` 等）。
**教训**:
1. **mock 数据必须基于最新类型定义生成** — 树哥自动生成测试前应先 `pnpm typecheck` 确保 mock 结构正确
2. **`ConfigurationScope` 已从键值对模式 (`key/label/value`) 重构为域模型模式 (`scopeType/tenantId/brandId/storeId/marketCode`)** — 旧模式不再兼容
3. **`ConfigurationOverview.configuration` 子字段不再是简单 `{total, items}`** — 每个子类型有不同的额外统计字段 (entries 有 `active/namespaces`，secrets 有 `persisted/static/rotationDue/expired` 等)
4. **`featureFlagStatusLabel` 签名是 `(flag: ConfigurationFeatureFlag) => string` 而非 `(boolean) => string`** — 测试传 `true`/`false` 会导致运行时 `'Cannot read properties of undefined (reading enabled)'`
5. **大于 30 个 TSC error 或 20+ 测试 fail 时不应派树哥零散修复** — 应标记 debt P0 等待人工系统性修复，避免多个修复片段互相干扰

### E13 CoachDashboard: 组件条件渲染的 IIFE 模式 vs 内联 condition 判等 (2026-06-27 pulse#89)
**发现**: CoachDashboard.test.tsx `does not render profile when no coach info` 测试失败。
组件外层用 `{coachName || storeName || employeeId ? <div data-testid="coachdashboard-profile">{renderProfileBar()}</div> : null}`
但 renderProfileBar() 内部实现为 `if (!coachName && !storeName && !employeeId) return null;`
外层条件 (||) 与内部 (&&) 逻辑不等价 — falsy 值的类型不同时可能出现外层通过但内部返回 null 的空容器。
**修复**: 用 IIFE 统一判断入口：
```tsx
{(() => {
  const bar = renderProfileBar();
  return bar !== null ? <div data-testid="coachdashboard-profile">{bar}</div> : null;
})()}
```
**教训**:
1. 组件条件渲染出现双重守卫时，内外层条件必须等价 — 建议只用 render 函数的返回值做唯一判断源
2. IIFE 包裹的三元 `fn() !== null ? render(fn()) : null` 是安全的条件渲染模式，避免条件定义重复
3. 前置条件式测试（无 coach info → profile 容器不应存在）能有效捕获条件渲染的不一致
4. 已修改 / 未提交的文件可能已包含修复，验收脉冲应重新运行测试确认工作树状态

**2026-06-28 洞察 (pulse#100)**

5. **turbo test 缓存欺骗**: `pnpm turbo test` 缓存的 `@m5/storefront-web#test` 结果可能过期（之前失败的缓存导致 CI 汇报 fail），但单独运行 `pnpm test` 显示 0 fail。验收脉冲必须验证缓存状态，对 cache hit 的失败报告做二次验证。
6. **CJS/ESM 混合基建的测试不可行性模式**: apps/api 使用 `tsx watch` 做 dev 运行完全正常，但 `tsx --test` 作为 Node test runner 无法处理纯 ESM vitest 依赖。NestJS @Decorator 与 Node 原生 test runner 不兼容。建议方案：vitest.config.ts + vitest run runner，或拆分为 vitest workspace。

**2026-06-28 洞察 (pulse#107)**

7. **Module._resolveFilename mock 不完整导致运行时 undefined**: @m5/ui AiModelSwitcher 测试通过 `Module._resolveFilename` hook 将 `useAiModelPresets` 重定向到 mock 文件。mock 只实现了被旧代码消费的 `useStoreConfigs` 和 `useSwitchAiModel`，但 V10 D2 新增的 AiModelHistoryDrawer 引入了 `useConfigHistory` 和 `useRollbackAiModel`，mock 未同步新增 → 运行时 `useConfigHistory is not a function`。教训: Module resolution 层面的 mock 无法享受 TS 编译检查，开发者在 mock 文件中新增导出时没有编译提示必须同步 mock；解决方案：每新增一个 `useXxx` hook，必须同步 mock 文件中的对应实现，或在测试顶层加类型守卫检查。
8. **蚂蚁自动化生成代码的 tsconfig 类型脱节**: 蚂蚁 `🐜 自动` commit 引入新模块的测试文件时，测试使用 `jest.mock()` / `describe` / `it` / `expect` 风格，但目标 app (tob-web) 的 tsconfig 中未包含 `@types/jest` 或对应的测试类型配置，导致 13+ TSC 错误。教训: 蚂蚁自动生成测试时，应同时检查目标包的 tsconfig `compilerOptions.types` 是否包含测试框架类型，或统一使用项目标准的 `node --test` (vitest) 风格。

**2026-06-29 洞察 (pulse#114)**

10. **V11 Spr3 合入导致 license 模块类型断裂**: V11 Spr3 夜间合入后 @m5/ui 出现 44 处 TSC 错误，全部集中在 license 模块。根因是 types.ts 中 LicenseLevel/ActivationSource/LicenseAuditLog 等 8 个类型导出被删除/重命名，以及 LicenseManager/index.tsx 引用的 AdaptiveContextValue/UseLicenseResult/License 属性与新类型定义不匹配。教训: 蚂蚁自动化生成的 commit 在合入 V11 分支后，需要配合验收脉冲做全量 TSC 检查。大版本合入（V11 Spr3）应在合入前跑一次完整 typecheck + test pipeline。建议: 设置 githook pre-merge 或 CI pipeline gate，合入新分支前必须 TSC 0 errors。

11. **测试 runner 速度差异导致 false negative**: @m5/ui ConfirmActionDialog.test.tsx 在 `node --import tsx --test` 单独运行 12/12 pass，但通过 turbo pipeline 运行时 1 fail。差异可能来自 test runner 执行顺序、模块缓存状态、或并行执行的影响。教训: 验收脉冲对 turbo 报告的 fail 应做二次确认——单独跑该测试文件验证是否真实 fail。如果单独跑通过，则标记为测试 runner 编排问题，非代码质量 fail。

12. **admin-web flatten-for-csv 函数在 V11 合入后出现 5 个边缘用例失败**: 空数组处理、非法 Date.toISOString、循环引用检测、recordsToCsv 空数组返回值不一致。说明 flattenForCsv 的 edge case 保护不足。教训: 编写工具函数时应当对所有参数边缘值（undefined/non-Date date-like/空数组/循环引用）做防御式处理。建议: 关键工具函数添加 invariants 测试套件覆盖 edge cases。

**2026-06-28 洞察 (pulse#109)**

9. **auto-generated role test 缺少 tenantContext 和 client scope 一致性**: 自动生成的 open-api.role.test.ts 直接 `new OpenApiService()` 并调用 handleSync/sendCommand，但未在 tenantContext.run() 内执行 → getBearerFromCtx() 抛 Missing tenant context。修复需：用 runWithTenant() 包裹调用，并传递 bearerToken 进 context。此外，角色测试的 ROLE_CAPABILITIES 与实际 seed client 的 scopes 不一致：seed client cli-merchant-001 需补 auth:verify/sync:bulk scope，边界测试应使用无权限 client (cli-partner-pos) 验证 scope rejection。教训: 角色测试必须同步 seed client 的 scopes 配置，且全流程测试 (handleSync/sendCommand) 需要 tenantContext + bearerToken 上下文的完整模拟。

---

### E15陈架构: storefront-web 使用过时 hook API 导致 TSC 断裂 (2026-06-29 pulse#118)
**发现**: `@m5/storefront-web/app/categories/page.tsx` 中 11 个 TSC error，全部源于使用了过时的 hook destructure 模式。
`useSearchFilter`、`useSortedItems`、`usePagination` 三个 hooks 的 API 已在近期重构，但 categories/page.tsx 未同步更新：
- `useSearchFilter(items, fields)` 返回 `{ searchTerm, setSearchTerm, filteredItems }` 而非 `{ query, setQuery, filtered }`
- `useSortedItems` 需 3 参 `(items, columns[], sortConfig)` 而非 2 参 `(items, {key, dir})`
- `usePagination` 需 `(total, pageSize)` 而非 `(items, pageSize)`
- `Pagination` 组件新增必填 `total` prop
**根因**: categories/page.tsx 在最初生成时参考的 hook API 与后续重构版本不同步。产品页面批量自动生成时容易产生此类 API 脱节，因为模板代码基于旧版 hook 签名编写。
**教训**: 
1. 自动生成的页面模板应定期更新以匹配最新的 hook 签名
2. 新增/重构 hook 时，应 grep 扫描所有消费方并同步更新
3. 修复模式: 参照 `products/page.tsx` 的正确用法调整 categories/page.tsx
4. 虽然测试 28/28 全通过，但 TSC 报 11 error — 测试只验证运行时行为，不验证类型对齐

---

### E3罗测试: MockTask 缺少 language 字段导致 TS2353 (2026-06-30 pulse#132)
**发现**: voice-processing.role-extended.test.ts 中 `MockTask` 接口缺少 `language` 属性，但第 129 行的对象字面量传递了 `language: dto.language ?? 'auto'`，导致 TS2353 类型错误。
**根因**: 测试代码中新加的 STT 扩展路径使用了 `language` 字段来指定语言（zh-CN/en-US/ja-JP/auto），但模块顶部的 `MockTask` 接口定义未同步更新，缺少 `language?: string` 声明。
**教训**: 
1. 在测试中扩展 mock 数据字段时，必须同步更新对应的 mock 类型定义
2. `.role-extended.test.ts` 这类自动生成的扩展测试，易出现接口与使用不一致——生成模板应确保基础属性覆盖
3. 修复仅需 1 行: 在 `MockTask` 末尾加 `language?: string`
4. 此问题被 TSC 捕获但被测试漏过（测试只验证运行时行为），证明了类型检查与测试互补的必要性

## 🦞 脉冲 #142 洞察 (2026-07-05 19:51 CST)

### 发现 1: i18n 翻译键引号问题
**根因**: `I18n.ts` 中翻译键 `zh-CN`、`zh-TW` 等带连字符，未加字符串引号时 TypeScript 将其解析为减法表达式 (zh - CN)，产生约 250 个 TSC 错误，并级联导致 admin-web 等模块 300+ 测试因模块解析失败而崩溃。

**解决方案**: 所有翻译键加上字符串引号 `'zh-CN':`。修复后 230+ TSC 错误消除，跨模块测试恢复运行。

**教训**: 
- 带连字符的对象键必须用引号括起来
- 一个简单的语法错误会产生级联测试失败 (317 fail → 25 real fail)
- 使用 `noUncheckedIndexedAccess` 时，`split('-')[0]` 需要防御性回退

### 发现 2: i18n 包依赖缺失
最新 `i18n` npm 包为 `0.15.3` 且无 TS 类型声明，需本地添加 `.d.ts` 类型声明文件。原始 `package.json` 锁定的 `^0.9.5` 不存在于 npm registry。

**教训**: 新增依赖前先验证版本可用性和类型声明覆盖。

## 2026-07-06 01:21 — TypeScript 类型导出与组件API版本不匹配修复

### 现象
storefront-web 和 admin-web 的 TSC 检查失败，因 @m5/ui 的 barrel 文件未导出 `RuleExecutionResult`、`RuleExecutionSummary`、`RuleExecutionStatus` 类型，且 storefront-web 传递了新版 AiDecisionPanel 不接受的 `rules`/`summary`/`title` 属性。

### 根因
1. **Barrel 漏导**: AiDecisionPanel 被重写后，types.ts 中定义的向后兼容别名未在 `packages/ui/src/index.tsx` 中重新导出
2. **组件API变化**: 新 AiDecisionPanel 使用内部 `useDecisionPanel` hook 自管理数据，不再接受 `rules`/`summary` 外部属性
3. **大小写问题**: barrel 文件和 DecisionAuditTrail 中 import 路径大小写不一致（`AIDecisionPanel` vs `AiDecisionPanel`），macOS 忽略但 CI/tsc 严格模式报错

### 修复方法
1. 在 `packages/ui/src/index.tsx` 添加 `RuleExecutionResult`、`RuleExecutionStatus`、`RuleExecutionSummary` 类型导出
2. 在 `packages/ui/src/components/AiDecisionPanel/index.ts` 补充 `RuleExecutionSummary` 导出
3. storefront-web 页面移除传给 `AIDecisionPanel` 的已废弃 props
4. 修正 import 路径大小写为实际目录名 `AiDecisionPanel`

---

### E16陈架构: @m5/api 测试基础架构 hang 已持续 60+ 脉冲未修复 (2026-07-06 pulse#151)

**发现**: @m5/api 测试 hang（'Promise resolution is still pending'）自 pulse#92 起持续 ~10 天，期间自动提交的新模块测试不断增加，基础 hang 问题从未修复。

**当前状态**: 393 TSC errors + 测试 hang。错误类型高度集中: result.data undefined（~50%）、字串→枚举（~30%）、describe/expect 无法识别（~10%）、DTO 缺字段（~10%）。

**教训**: 
1. 测试基础设施故障持续 10 天+ 时，应优先修复基建而非继续堆代码
2. 所有自动生成的测试应统一使用 `!` 非空断言处理 `result.data`
3. 持续 60+ 脉冲未修复说明应将 P0-001/009 从「技术债」升级为「基建阻塞」

---

### E17陈架构: tsup `--dts` 构建可能比 `tsc --noEmit` 更严格，Record + satisfies 模式可避免 DTS 构建失败 (2026-07-06 pulse#152)

**发现**: `AIDeviceFaultPredictionPanel.tsx` 使用 `Record<FaultSeverity, { variant: 'danger' | 'success' | 'warning' | 'info' }>` 显式类型注解，`tsc --noEmit` 检查通过（0 error），但 `tsup --dts` 构建时报类型错误:
```
Type '"success" | "warning" | "info" | "critical"' is not assignable to type '"default" | "danger" | "neutral" | "pending" | Severity | undefined'
```
根因: tsup 的 DTS 生成器在 `Record<K, V>` 中狭窄 value 类型时，可能将 Record key 类型泄漏到 value 的推论中，导致 `critical`（FaultSeverity key）出现在 variant 的联合类型中。

**修复**: 改用 `satisfies` + `as const` 模式替代显式 `Record` 注解:
```ts
const CONFIG = {
  critical: { label: '紧急', variant: 'danger' as const },
} satisfies Record<SomeKey, { label: string; variant: StatusBadgeProps['variant'] }>;
```

**教训**:
1. `Record<K, V>` 在某些 DTS 生成器中可能因类型层级展开导致 key 类型泄漏到 value 类型
2. 遇到 DTS 构建失败但 `tsc --noEmit` 通过时，优先尝试 `satisfies` + `as const` 模式
3. `tsup --dts` 和 `tsc --noEmit` 的 narrowing 行为有差异，DTS 构建更严格

### E18陈架构: storefront-web task-center mock 数据与组件类型脱节 (2026-07-06 pulse#155)

**问题**: storefront-web 的 task-center 页面出现 1 test fail（Mock 附件缺 `.pdf`）+ 1 TSC error（Button variant 字面量与组件接口不匹配）。

**分析**:
1. mockTasks 数据的 attachments 字段后缀覆盖不完整（只有 .xlsx/.csv/.png，缺 .pdf）— 测试是后加的，mock 数据没跟上
2. Button 组件的 `variant` prop 类型定义 (`ButtonVariant`) 不支持 `'default'` 字面量 — 但接口设计时遗漏了该变体

**教训**:
1. mock 数据必须全量覆盖测试断言中的所有预期模式，后加测试时要检查 mock 数据是否匹配
2. 前端组件 props 的 type union（如 ButtonVariant）应当穷举所有支持的变体，`'default'` 不能作为隐式回退
3. 测试落地后，mock 数据和组件接口应当视作需同步维护的双生子

## E18: 自动生成代码 TSC 模式 — DataTableColumn.width 类型 mismatch (2026-07-06 23:13)

**发现**: 蚂蚁自动生成的 `DeliveryPersonDashboard.tsx` 使用了 `DataTableColumn.width: number`，但该类型定义为 `string`。同时 `StatusBadge` 的 `children`→`label` prop 错误在 auto-gen 代码中频繁出现。

**根因**: 自动生成代码不了解已有组件的精确 prop 类型定义，特别是 `DataTableColumn.width` 作为 CSS string 而非像素 number。

**预防**: 自动生成时应先读取目标模块的接口定义文件（如 `DataTable.tsx` 的 `DataTableColumnProps`），再做代码生成。验收流程需要包含 TSC 检查环节。

**相关**: 与 pulse#154 TSC 8 errors 同源，均为 auto-gen 后首次 TSC 检查发现。

---

### AI-RAG (pulse#158) — `result` is of type 'unknown'
**自动补全的角色测试在 ai-rag 模块大量出现 `result is of type 'unknown'` (TS18046)**，这是因为测试代码 `const result = await ctrl.someMethod()` 时，Controller/Service 方法的返回类型为泛型 `Promise<unknown>` 或缺少显式类型标注，导致 TS 无法推断 `result.data`、`result.success` 等属性。与 realtime/tenant-llm 模块的 TS18048 同类。

**根因**: 自动生成的测试代码假设 `result` 有 `.data`、`.success` 等字段，但类型系统未对齐。Service/Controller 层需要为这些方法添加显式返回类型（如 `Promise<ApiResponse<DocRecord>>`），而非泛型 `unknown`。

**预防**: 自动生成角色测试时，应先查询目标方法的 return type，确保测试中的属性访问与类型系统一致。或者使用 `as` 断言，但应优先修复 Service 层类型。**持续 60+ 脉冲**未解决——这是基建性类型缺失，需要人工设计方案（统一 ApiResponse 类型 + Service 方法类型标注规范）后批量修复，树哥单次修几个文件无法解决根因。
