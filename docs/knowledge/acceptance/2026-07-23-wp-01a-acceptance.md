# WP-01A · LYT 适配层框架 · 验收卡

> **日期**: 2026-07-23  
> **工作包**: WP-01A  
> **BS**: BS-0021~BS-0029  
> **阶段**: A（M5 内部能力）  
> **blocker_id**: BLK-LYT-001

---

## 一、验收清单

### 1.1 适配器接口（ILytAdapter）

| # | 验收项 | 预期结果 | 结果 |
|:--:|:--|:--|:--:|
| 1 | 接口包含 adapterName / adapterMode | 只读属性 | ✅ |
| 2 | connect 方法 | 返回 sessionId, CONNECTED 状态 | ✅ |
| 3 | disconnect 方法 | 返回 success: true | ✅ |
| 4 | getConnectionStatus | 未传 sessionId 返回 DISCONNECTED | ✅ |
| 5 | getMember | 返回 memberId 匹配输入 | ✅ |
| 6 | createOrder | totalAmount 正确聚合 items | ✅ |
| 7 | applyDiscount | 返回原 orderId 和 couponCode | ✅ |
| 8 | syncGateEvent | accepted: true | ✅ |
| 9 | getDeviceStatus | 返回已知设备的真实状态 | ✅ |
| 10 | query 通用查询 | 支持过滤/排序/分页/字段选择 | ✅ |
| 11 | operate 通用操作 | 返回 success | ✅ |
| 12 | validate 校验 | 检查非空数据 | ✅ |
| 13 | getVenues | 支持 storeId 过滤 | ✅ |
| 14 | getDevices | 支持 venueId 过滤 | ✅ |
| 15 | getMemberInfo | 返回 points/status 等扩展信息 | ✅ |
| 16 | getOrderInfo | 返回 status/totalAmount | ✅ |
| 17 | sign | 返回 signature (64 hex chars) | ✅ |
| 18 | verifySignature | 返回 boolean | ✅ |
| 19 | decrypt | 返回 decoded plaintext | ✅ |
| 20 | startPoll / getPollStatus / cancelPoll | 轮询任务生命周期 | ✅ |
| 21 | handleCallback | accepted: true | ✅ |
| 22 | wrapError | network/protocol/business/unknown 分类 | ✅ |
| 23 | isRetryable | 返回正确布尔值 | ✅ |
| 24 | getTimeoutDowngradeConfig | 返回降级策略 | ✅ |

### 1.2 Mock 适配器

| # | 验收项 | 预期结果 | 结果 |
|:--:|:--|:--|:--:|
| 1 | getMember 使用 mock 数据池 | 返回 "小明"/"张三" 等预置数据 | ✅ |
| 2 | getVenues 返回 3 个场地 | 扭蛋区/运动区/综合区 | ✅ |
| 3 | getDevices 返回丰富设备类型 | gacha/gate/screen/camera/coin | ✅ |
| 4 | getMemberInfo 含积分/等级 | points / levelCode / totalSpentCents | ✅ |
| 5 | getOrderInfo 含支付状态 | PAID/REFUNDED 等 | ✅ |
| 6 | query 跨实体查询 | member/order/device/venue/inventory | ✅ |
| 7 | sign 含 mock secret 一致性 | 相同输入 → 相同签名 | ✅ |

### 1.3 Real 适配器骨架

| # | 验收项 | 预期结果 | 结果 |
|:--:|:--|:--|:--:|
| 1 | 基础方法正常 (getMember/createOrder 等) | ✓ | ✅ |
| 2 | 新方法抛出 LytNotImplementedError | blocker_id: BLK-LYT-001 | ✅ |
| 3 | 消息含 "blocked by missing LYT api spec" | ✓ | ✅ |
| 4 | wrapError 正确分类 HttpError | 422→business, 503→protocol | ✅ |
| 5 | getTimeoutDowngradeConfig 返回 prod 默认值 | 5000ms / 10000ms | ✅ |

### 1.4 配置模型

| # | 验收项 | 预期结果 | 结果 |
|:--:|:--|:--|:--:|
| 1 | resolveLytHttpAdapterConfig 返回 baseUrl/signingSecret/timeout/retries | ✓ | ✅ |
| 2 | resolveLytFullConfig 含 endpoints/timeouts/retry/cert/signing/cache 六段 | ✓ | ✅ |
| 3 | 无 ConfigService 时返回合理默认值 | ✓ | ✅ |
| 4 | 空/无效覆盖值 fallback 到默认 | ✓ | ✅ |
| 5 | boolean 字段正确解析 | skipTlsVerify / enabled | ✅ |

### 1.5 错误包装

| # | 验收项 | 预期结果 | 结果 |
|:--:|:--|:--|:--:|
| 1 | TimeoutError → network | retryable: true | ✅ |
| 2 | AbortError → network | retryable: true | ✅ |
| 3 | ECONNREFUSED → network | retryable: true | ✅ |
| 4 | invalid/rejected/denied → business | retryable: false | ✅ |
| 5 | parse error → protocol | retryable: false | ✅ |
| 6 | 无匹配 → unknown | retryable: false | ✅ |

### 1.6 超时降级

| # | 验收项 | 预期结果 | 结果 |
|:--:|:--|:--|:--:|
| 1 | Mock 连接超时 3000ms | ✓ | ✅ |
| 2 | Mock 读取超时 5000ms | ✓ | ✅ |
| 3 | useCacheOnTimeout = true | ✓ | ✅ |
| 4 | useFallbackOnTimeout = true | ✓ | ✅ |
| 5 | Real 连接超时 5000ms | ✓ | ✅ |
| 6 | 降级日志级别为 warn | ✓ | ✅ |

---

## 二、测试结果

### TSC 检查

```bash
pnpm turbo typecheck --filter=@m5/api
```

### 测试命令

```bash
pnpm --dir apps/api exec vitest run \
  src/modules/lyt/adapters/mock-lyt.adapter.test.ts \
  src/modules/lyt/adapters/real-lyt.adapter.test.ts \
  src/modules/lyt/interfaces/lyt-adapter.interface.test.ts \
  src/modules/lyt/lyt-adapter.config.test.ts \
  src/modules/lyt/lyt-adapter.registry.test.ts \
  src/modules/lyt/lyt-ringbeam.test.ts
```

---

## 三、回滚计划

```yaml
rollback_id: RB-WP-01A-001
rollback_action: git revert <commit-hash>
affected_files:
  - apps/api/src/modules/lyt/interfaces/lyt-adapter.interface.ts
  - apps/api/src/modules/lyt/adapters/mock-lyt.adapter.ts
  - apps/api/src/modules/lyt/adapters/real-lyt.adapter.ts
  - apps/api/src/modules/lyt/adapters/sandbox-lyt.adapter.ts
  - apps/api/src/modules/lyt/lyt-adapter.config.ts
  - apps/api/src/modules/lyt/interfaces/lyt-adapter.interface.test.ts
  - apps/api/src/modules/lyt/adapters/mock-lyt.adapter.test.ts
  - apps/api/src/modules/lyt/adapters/real-lyt.adapter.test.ts
  - apps/api/src/modules/lyt/lyt-adapter.config.test.ts
  - apps/api/src/modules/lyt/lyt-ringbeam.test.ts
revert_checklist:
  - "[ ] git revert 后不会影响 WP-00/02A/02B 现有代码"
  - "[ ] 回滚后 lyt.module.ts / lyt.service.ts / lyt.controller.ts 不报编译错误"
  - "[ ] 回滚后 LytAdapterRegistry 适配 lyt.service 调用"
```

## 四、Signoff

| 角色 | 姓名 | 日期 | 签名 |
|:--|:--|:--:|:--:|
| 开发 | 树哥 | 2026-07-23 | ✅ |
| Code Review | [待填写] | | |
| QA | [待填写] | | |

---

## 五、PR 合规字段

```yaml
6-8_refs: [BS-0021, BS-0022, BS-0023, BS-0024, BS-0025, BS-0026, BS-0027, BS-0028, BS-0029]
blocker_id: BLK-LYT-001
rollback_id: RB-WP-01A-001
```
