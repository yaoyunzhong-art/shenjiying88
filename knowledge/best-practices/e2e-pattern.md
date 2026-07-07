# Best Practice · E2E Pattern (e2e 测试编写规范)

> 创建日期: 2026-06-25
> 最后更新: 2026-07-08 (Pulse-Nightly-10)
> 来源: Phase-15E/16D/16E/16F + Pulse-Nightly-03/04/05 e2e 编写经验

## 命名规范

### ✅ e2e 文件命名
- 主业务 e2e: `<feature>.e2e.test.ts`
  - e.g. `member-persistent-quota-integration.e2e.test.ts`
  - e.g. `campaign-quota-integration.e2e.test.ts`
- 单元测试: `<feature>.test.ts`
  - e.g. `finance.module.test.ts`

## 测试结构

### ✅ 标准 e2e 模板
```typescript
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

describe('<feature>: <scenario>', () => {
  // 1. setup (mock dependencies)
  function setupMocks() {
    const mockQuotaService = {
      reserve: async () => ({ allowed: true, current: 1, max: 100 }),
      decrement: async () => {},
    };
    const mockLifecycleService = {
      canWrite: () => true,
    };
    return { mockQuotaService, mockLifecycleService };
  }

  // 2. happy path
  test('happy path: 创建资源成功', async () => {
    const { mockQuotaService, mockLifecycleService } = setupMocks();
    const service = new FeatureService(mockQuotaService, mockLifecycleService);

    const result = await service.create(validInput);

    assert.ok(result.id);
  });

  // 3. quota exceeded
  test('quota exceeded: 抛 QuotaExceededException', async () => {
    const { mockLifecycleService } = setupMocks();
    const mockQuotaService = {
      reserve: async () => ({ allowed: false, reason: 'quota exceeded' }),
    };
    const service = new FeatureService(mockQuotaService, mockLifecycleService);

    await assert.rejects(
      () => service.create(validInput),
      QuotaExceededException
    );
  });

  // 4. lifecycle blocked
  test('lifecycle blocked: 抛 TenantLifecycleBlockedException', async () => {
    const { mockQuotaService } = setupMocks();
    const mockLifecycleService = {
      canWrite: () => false, // paused/suspended
    };
    const service = new FeatureService(mockQuotaService, mockLifecycleService);

    await assert.rejects(
      () => service.create(validInput),
      TenantLifecycleBlockedException
    );
  });

  // 5. business failure rollback
  test('business failure: decrement reserve', async () => {
    const decrementSpy = ...;
    const service = new FeatureService(..., decrementSpy);

    await assert.rejects(() => service.create(invalidInput));

    assert.equal(decrementSpy.calls.length, 1);
  });
});
```

## 必须覆盖的场景

| 场景 | 测试 |
|---|---|
| Happy path | 1 个 |
| Quota exceeded | 1 个 |
| Lifecycle blocked | 1 个 |
| 业务失败 → decrement | 1 个 |
| Reserve 失败 → 不 decrement | 1 个 (可选) |
| 幂等性 (重复调用) | 1 个 (可选) |
| 并发场景 | 1 个 (可选) |

## L3 跨模块 E2E 测试规范 (Pulse-Nightly-03 新增)

### 什么是跨模块 E2E

跨模块 E2E 测试验证**多个应用/包之间的数据流完整性**,而非单个模块的内部逻辑。

典型链路:
- SDK 调用 → Domain 校验 → Admin 展示
- Admin 创建 → Runtime 治理 → Storefront 公告 → Miniapp 降级
- C端(优惠券领取) → 管理端审批 → Domain 状态流转 → SDK 回传 → Admin 列表

### 跨模块 E2E 测试模板

```typescript
import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

// Phase 1: 定义跨模块数据契约（模拟 domain 类型）
interface InterModuleData {
  sourceModule: string;      // 数据来源模块
  targetModules: string[];   // 数据消费模块
  payload: Record<string, unknown>;
  expectedTransforms: string[];  // 预期的数据转换
}

// Phase 2: 逐模块校验
describe('[L3-E2E] ModuleA -> ModuleB -> ModuleC', () => {
  test('[positive] 完整链路', () => {
    // Module A 产生数据
    const sourceData = { ... };
    // Module B 校验数据
    assert.ok(validation(sourceData));
    // Module C 消费数据
    assert.equal(consume(sourceData).display, 'expected');
  });

  test('[negative] 错误链路', () => {
    // Module A 错误 → Module B 异常处理 → Module C 友好降级
  });

  test('[boundary] 边界链路', () => {
    // 空数据/过期数据/跨模块无影响
  });
});
```

### 链命名规范

```
__e2e__/cross-module-journey-${序号}-${路径描述}.test.ts
```

序号 01-03 为初始链，04-06 为 Pulse-Nightly-04 扩展链，07-09 为 Pulse-Nightly-05 扩展链，10-12 为 Pulse-Nightly-06 扩展链。

### 必须覆盖的场景 (Pulse-Nightly-07 更新)

| 维度 | 标准 |
|------|------|
| 链数量 | ≥15 条 |
| 每链子测试 | ≥3 (positive/negative/boundary) |
| 覆盖 apps | ≥6/6 个模块 (全覆盖) |
| 覆盖 packages | ≥2/5 个包 |
| 反向链路 | ≥5 条 (非 admin-web 起点) |
| 典型数据流 | Admin↔SDK↔Domain, C端↔Admin, Runtime↔Storefront↔Miniapp, Miniapp→SDK→API→Domain |
| 角色覆盖 | ≥10 种 |
| 状态机验证 | ≥2 种业务状态机 |
| 数据管道 | ≥1 条 (报表/聚合/ETL) |
| 企业配额 | ≥2 条 (租户配额/合约) |
| 并发场景 | ≥1 条 |
| 国际化深度 | ≥6 locale |
| 大数据量+幂等 | ≥1 条 |

## 跨模块 E2E 设计模式 (Pulse-Nightly-04/05 新增)

### 1. 市场引导模式

**适用场景**: 管理员配置市场参数 → API 生成完整市场 profile → 多端消费

**测试要点**:
- 市场 profile 完整性校验（必填字段检查）
- 多语言回退策略（默认语言兜底）
- 租户隔离（同频 tenantId 互不干扰）
- 反例: 不完整 profile 友好降级而非崩溃

```typescript
test('[正例] 管理员配置市场 → API返回完整profile → Miniapp根据语言渲染', () => {
  const resp = mockApiFetchBootstrap('t1', 'cn-sh');
  const state = miniappRenderBootstrap(resp, 'zh-CN');
  assert.ok(state.rendered);
  assert.equal(state.heroTitle, '欢迎来到旗舰店');
  assert.ok(state.features.get('payment'));
});

test('[反例] 不存在的租户 → Miniapp降级不崩溃', () => {
  const resp = mockApiFetchBootstrap('nonexistent', 'xx-xx');
  const state = miniappRenderBootstrap(resp, 'zh-CN');
  assert.equal(state.rendered, false);
  assert.ok(state.error);
});
```

### 2. Campaign 生命周期模式

**适用场景**: 管理端创建营销活动 → Domain 状态机管理 → Loyalty 积分发放 → Analytics 报表聚合

**测试要点**:
- 状态转换合法性（draft→active→paused→completed, 拒绝非法跳转）
- 上线校验（预算>0、日期合理、受众非空）
- 积分规则（乘数计算、上限拦截）
- 活动暂停时积分规则自动失效
- 最终报表聚合（参与者数/积分总量/参与率/ROI）

```typescript
test('[正例] 创建→上线→参与→积分→报表', () => {
  // admin-web 创建 campaign (draft)
  const camp: Campaign = { ... status: 'draft' };
  // Domain 校验通过 → 上线
  assert.ok(validateCampaignForActivation(camp).allowed);
  camp.status = 'active';
  // 用户参与 → 积分发放
  const result = processLoyaltyPoints(rule, orderAmount, 0);
  assert.equal(result.earned, orderAmount * multiplier);
  // 活动完成 → 报表
  const report = generateAnalyticsReport(camp, participations, 100);
  assert.equal(report.totalParticipants, 2);
  assert.ok(report.roi > 0);
});

// 反例: 预算为0 → 拒绝上线
test('[反例] 预算为0 → Domain拒绝上线', () => {
  const noBudgetCampaign: Campaign = { ... budget: 0, status: 'draft' };
  assert.equal(validateCampaignForActivation(noBudgetCampaign).allowed, false);
});
```

### 3. RBAC 权限矩阵模式

**适用场景**: 用户登录 → Token 签发 → API 调用 → Domain 权限校验 → 多端 UI 展示

**测试要点**:
- 各种角色的登录获取正确的 token
- Token 中携带正确的角色信息
- Domain 解析 token 并校验合法性/过期时间
- API 端点根据角色返回 200/403
- Storefront/Admin 面板根据角色展示不同权限
- 多角色用户的跨域权限

```typescript
test('[正例] Consumer登录 → consumer端点200, merchant端点403', () => {
  const auth = sdkLogin({ email: 'consumer@test.com', password: 'pass123', tenantId: 't1' });
  assert.equal(sdkApiCall(auth.token, '/api/consumer/profile').status, 200);
  assert.equal(sdkApiCall(auth.token, '/api/merchant/products').status, 403);
});

test('[正例] 多角色用户可访问多个域', () => {
  const auth = sdkLogin({ email: 'multi@test.com', password: 'pass123', tenantId: 't2' });
  assert.equal(sdkApiCall(auth.token, '/api/merchant/products').status, 200);
  assert.equal(sdkApiCall(auth.token, '/api/finance/reports').status, 200);
  assert.equal(sdkApiCall(auth.token, '/api/admin/tenants').status, 403);
});
```

### 4. 反向链路模式 (Pulse-Nightly-05 新增)

**适用场景**: 非 admin 端(小程序/App/第三方)发起请求 → SDK 封装 → API 路由 → Domain 业务校验 → 返回渲染

**测试要点**:
- 请求经过各层的数据完整性
- Domain 的业务校验规则(会员等级/库存/订单)
- 各层对错误输入的降级处理
- 租户隔离(不同租户看到不同数据)
- 认证缺失时的安全拒绝

```typescript
test('[正例] 会员查看商品详情+使用会员价下单', () => {
  // Miniapp 产生请求
  const req = createMiniappRequest('wx-001', 't1', 'u1', 'member', '/api/product/detail', { productId: 'prod-001' });
  // SDK 封装
  const envelope = sdkEnrichRequest(req);
  // API 路由 → Domain 校验
  const apiResp = apiRoute(envelope);
  // Miniapp 渲染
  const render = miniappRenderDetail(apiResp, 'member');
  assert.equal(render.displayPrice, 79); // 会员价
  assert.ok(render.success);
});

test('[反例] 访客无法购买会员价商品', () => {
  const req = createMiniappRequest('wx-001', 't1', 'guest-1', 'guest', '/api/order/validate', {
    productId: 'prod-001', quantity: 1, userId: 'guest-1',
  });
  const envelope = sdkEnrichRequest(req);
  const resp = apiRoute(envelope);
  assert.equal(resp.data?.canPlace, false);
  assert.ok(resp.data?.reason?.includes('登录'));
});
```

### 5. 订单状态机模式 (Pulse-Nightly-05 新增)

**适用场景**: 管理端订单处理 → Domain 8 状态流转 → Mobile 用户订单展示 → Storefront 履约看板

**测试要点**:
- 8 状态机完整路径 (pending_payment→paid→confirmed→shipped→delivered→completed)
- 异常路径 (cancelled/refunding/refunded)
- 非法跳转被 Domain 拒绝 (如 pending_payment→confirmed 跳过了 paid)
- Mobile 展示与状态同步 (进度条百分比/操作按钮/状态标签)
- Storefront 履约状态同步 (备餐中/配送中/待取餐)

```typescript
test('[正例] 创建→确认→发货→完成完整订单生命周期', () => {
  // Admin 创建
  const order: Order = { ... status: 'pending_payment' };
  adminCreateOrder(order); // status: pending_payment
  // 模拟支付
  ORDER_STORE.set('o-001', { ...order, status: 'paid' });
  // Admin 确认
  adminProcessOrder({ orderId: 'o-001', action: 'confirm' }); // → confirmed
  // Mobile 展示已确认
  const display1 = mobileRenderOrder(confirmedOrder);
  assert.equal(display1.progressPercent, 40);
  assert.equal(display1.statusLabel, '已确认');
  // Admin 发货
  adminProcessOrder({ orderId: 'o-001', action: 'ship' }); // → shipped
  // Storefront 履约
  const fulfillment = storefrontGetFulfillment('o-001');
  assert.ok(fulfillment.isKitchenPreparing);
  assert.ok(fulfillment.isOutForDelivery);
});

test('[反例] 已取消订单无法发货', () => {
  adminProcessOrder({ orderId: 'o-cancel', action: 'cancel' }); // → cancelled
  const result = adminProcessOrder({ orderId: 'o-cancel', action: 'ship' });
  assert.equal(result.success, false);
  assert.ok(result.error?.includes('transition'));
});
```

### 6. RBAC 企业权限矩阵模式 (Pulse-Nightly-05 新增)

**适用场景**: 管理员配置 RBAC 权限 → API 租户隔离存储 → Domain 角色计算 → Tob-Web 企业端按角色渲染

**测试要点**:
- 6+ 种企业角色的模块访问差异
- 未配置用户无任何访问权限
- 跨租户访问被完全隔离
- 多角色用户合并权限
- Domain 层拒绝不存在的模块请求

```typescript
test('[正例] 超级管理员全部模块可访问', () => {
  adminAssignPermissions({ userId: 'super-1', tenantId: 't1', roles: ['super_admin'] });
  const apiResp = apiGetUserPermissions('t1', 'super-1');
  const dash = tobWebRenderDashboard(apiResp);
  assert.equal(dash.modules.length, 9); // 全模块
  assert.ok(dash.isSuperAdmin);
  assert.ok(dash.canViewFinance);
});

test('[反例] 未配置用户无法访问', () => {
  const dash = tobWebRenderDashboard(apiGetUserPermissions('t1', 'unknown'));
  assert.equal(dash.hasAnyAccess, false);
});

test('[正例] 多角色合并权限: store_manager+finance_viewer', () => {
  adminAssignPermissions({ userId: 'multi', tenantId: 't2', roles: ['store_manager', 'finance_viewer'] });
  const dash = tobWebRenderDashboard(apiGetUserPermissions('t2', 'multi'));
  assert.ok(dash.canViewFinance);   // finance_viewer
  assert.ok(dash.canManageStores);  // store_manager
  assert.equal(dash.canManageUsers, false); // 都不包含
});
```

## 测试链 checklist (Pulse-Nightly-05 更新)

每条跨模块 E2E 链必须包含:
- [x] **正例**: 完整链路预期通过
- [x] **反例**: 错误输入/权限不足/数据缺失的降级行为
- [x] **边界**: 空数据/过期数据/极端值的边界行为
- [x] **多状态**: 如果涉及状态机，验证所有合法转换路径和至少一个非法路径
- [x] **多角色**: 如果涉及权限，验证至少 3 种角色的端点访问差异
- [x] **反向**: 至少验证一种非 admin-web 起点的数据流
- [x] **全覆盖**: E2E 链覆盖全部 6 apps

### 7. Mobile C端全流程反向链路模式 (Pulse-Nightly-06 新增)

**适用场景**: Mobile App 用户发起注册/登录/下单 → API 业务端点 → Domain 业务校验 → Admin 后台核验

**测试要点**:
- 手机号唯一性（重复注册被 Domain 拒绝）
- 库存校验（超量下单被拒绝）
- 地址格式校验（超长/空地址/无效手机号）
- 条款同意校验
- Admin 后台可查新注册用户和订单
- 门店订单列表分页

```typescript
test('[正例] Mobile注册 → API → Admin可查', () => {
  const regResp = apiRegister({
    source: 'mobile', phone: '13800138001',
    nickname: '咖啡爱好者小王', agreeTerms: true, ...
  });
  assert.ok(regResp.success);
  // Admin 核验
  const summary = adminGetUserSummary(regResp.userId!);
  assert.equal(summary.nickname, '咖啡爱好者小王');
  assert.equal(summary.status, 'active');
});

test('[反例] 重复手机号注册被拒绝', () => {
  apiRegister({ ... phone: '13800138003' }); // 成功
  const second = apiRegister({ ... phone: '13800138003' }); // 失败
  assert.equal(second.success, false);
  assert.ok(second.error?.includes('已被注册'));
});

test('[反例] 未同意条款被拒绝', () => {
  const resp = apiRegister({ ... agreeTerms: false });
  assert.equal(resp.success, false);
  assert.ok(resp.error?.includes('服务条款'));
});

test('[边界] 超长收货地址被拒绝', () => {
  const resp = apiCreateOrder({
    deliveryAddress: { ..., detail: 'A'.repeat(201) }
  });
  assert.equal(resp.success, false);
  assert.ok(resp.error?.includes('200'));
});
```

### 8. 企业配额与基础设施事件模式 (Pulse-Nightly-06 新增)

**适用场景**: Tob-Web 企业端创建门店/员工 → SDK 队列事件 → API 持久化 → Domain 配额校验 → Admin 云管控汇总

**测试要点**:
- 门店配额上限（Domain 拒绝超额）
- 合约状态冻结（suspended 租户无法操作）
- 门店编码唯一性（重复编码被拒绝）
- 门店名称长度（超过 50 字符被拒绝）
- 面积范围校验（<5或>10000㎡被拒绝）
- 员工邮箱格式和时薪范围校验
- SDK 队列事件完整性（每条事件有完整 messageId/timestamp）
- Admin 多租户汇总视图（合同状态、门店数、员工数）

```typescript
test('[正例] 创建门店 → SDK事件 → Admin汇总', () => {
  const resp = apiCreateStore({
    source: 'tob-web', storeName: '南山店',
    storeCode: 'S-001', tenantId: 't1', ...
  });
  assert.ok(resp.success);
  assert.ok(resp.sdkMessageId);
  // SDK 事件
  const events = sdkGetMessageLog('t1');
  assert.ok(events.some(e => e.eventType === 'store.created'));
});

test('[反例] 门店超过配额被拒绝', () => {
  // 填满配额 → 第4个被拒绝
  const overResp = apiCreateStore(overReq);
  assert.equal(overResp.success, false);
  assert.ok(overResp.error?.includes('上限'));
});

test('[反例] 冻结合约无法创建门店', () => {
  const resp = apiCreateStore({ ... tenantId: 't3' });
  assert.equal(resp.success, false);
  assert.ok(resp.error?.includes('冻结'));
});
```

### 9. 数据管道与多维聚合模式 (Pulse-Nightly-06 新增)

**适用场景**: Admin 触发报表 → Domain 多维度聚合 → Storefront 运营指标 → Analytics 综合看板

**测试要点**:
- 日/周/月/自定义时间维度聚合
- 品类、门店等多维度分解
- 品类占比总和≈100%
- 门店排行降序排列
- KPI 卡片完整性（总营收/订单/客单价/活跃门店）
- 销售趋势点按日期排序
- 门店维度过滤（仅显示目标门店）
- 空数据区间返回0
- 日期范围验证（不能颠倒、不能超过365天）

```typescript
test('[正例] Admin月报表 → Domain聚合', () => {
  const resp = adminTriggerReport({
    source: 'admin-web', reportType: 'sales',
    period: 'monthly', startDate, endDate, ...
  });
  assert.ok(resp.success);
  assert.ok(resp.data!.summary.totalRevenue > 0);
  // 品类占比 ≈ 100%
  const totalPct = resp.data!.details.reduce((s, r) => s + r.percentage, 0);
  assert.ok(Math.abs(totalPct - 100) < 1);
});

test('[反例] 日期颠倒被拒绝', () => {
  const resp = adminTriggerReport({
    startDate: '2026-07-01', endDate: '2026-06-01', ...
  });
  assert.equal(resp.success, false);
  assert.ok(resp.error?.includes('不能晚于'));
});

test('[反例] 超过365天被拒绝', () => {
  const resp = adminTriggerReport({
    startDate: '2024-01-01', endDate: '2026-06-30', ...
  });
  assert.equal(resp.success, false);
  assert.ok(resp.error?.includes('365'));
});

test('[边界] Analytics看板KPI和品类占比', () => {
  const dash = analyticsBuildDashboard('monthly');
  assert.equal(dash.kpi.length, 4);
  // 降序排列
  for (let i = 1; i < dash.storeRanking.length; i++) {
    assert.ok(dash.storeRanking[i-1].revenue >= dash.storeRanking[i].revenue);
  }
  // 占比总和
  const pctSum = dash.categoryBreakdown.reduce((s, c) => s + c.percentage, 0);
  assert.ok(Math.abs(pctSum - 100) < 1);
});
```

### 10. 多渠道并发一致性模式 (Pulse-Nightly-07 新增)

**适用场景**: Mobile + Storefront 等多端同时操作 → API 端点 → Domain 层库存/数据一致性保障

**测试要点**:
- 库存临界值并发（仅剩1件时仅一个成功）
- 幂等性（相同 requestId 重复提交不重复扣减）
- 手机号唯一性并发（相同手机号仅第一个注册成功）
- 大批量并发请求总正确（总数不超过初始库存）
- 幂等性请求不导致库存超额扣减
- 幂等性历史可追溯

```typescript
test('[正例] 两个并发下单，库存充足时均成功', () => {
  const { results, finalStock } = simulateConcurrentOrders('prod_a', 10, [
    { source: 'mobile', quantity: 3, id: 'req_01' },
    { source: 'storefront', quantity: 2, id: 'req_02' },
  ]);
  assert.ok(results[0].success);
  assert.ok(results[1].success);
  assert.equal(finalStock, 5); // 10-3-2=5
});

test('[反例] 库存临界值：仅剩1件，两个并发仅一个成功', () => {
  const { results, finalStock } = simulateConcurrentOrders('prod_c', 1, [
    { source: 'mobile', quantity: 1, id: 'req_crit_01' },
    { source: 'storefront', quantity: 1, id: 'req_crit_02' },
  ]);
  assert.equal(successes, 1);
  assert.equal(failures, 1);
  const failResult = results.find(r => !r.success)!;
  assert.equal(failResult.error, 'insufficient_stock');
});

test('[反例] 幂等性：相同 requestId 重复提交返回缓存结果', () => {
  const first = domainConcurrentDeduct(req);
  assert.ok(first.success);
  const second = domainConcurrentDeduct(req);
  assert.ok(second.success); // 幂等性应成功返回缓存
  // 库存只扣减一次
  const stock = domainQueryStock('prod_e');
  assert.equal(stock?.currentStock, 3);
});
```

### 11. 国际化深度模式 (Pulse-Nightly-07 新增)

**适用场景**: Miniapp 以多语言发起操作 → SDK 多语言参数 → API 端点 → Domain 多语言校验 → Admin 多语言展示

**测试要点**:
- 6+ locale 支持：zh-CN/en-US/ja-JP/ko-KR/th-TH/vi-VN
- 每种 locale 独立存储原始名称
- 语言分索引查询
- Emoji/CJK/特殊字符（如韩文❤️、泰文🙏）
- 不支持的 locale 被拒绝
- 空/仅空白/超长字段处理
- 跨语言相同 requestId 冲突

```typescript
test('[正例] 中文下创建订单，存储原始中文商品名', () => {
  const req = makeI18nOrderReq('zh-CN', 'i18n_zh_01');
  const order = domainStoreI18nOrder(req);
  assert.equal(order.originalProductName, '智能咖啡机 Pro Max');
});

test('[正例] 泰文下创建订单，验证存储', () => {
  const req = makeI18nOrderReq('th-TH', 'i18n_th_01');
  const order = domainStoreI18nOrder(req);
  assert.ok(order.originalProductName.includes('กาแฟ'));
});

test('[反例] 不支持的 locale 被 Domain 拒绝', () => {
  const req = makeI18nOrderReq('zh-CN', 'bad_locale', { locale: 'fr-FR' as LocaleCode });
  const validation = domainValidateI18nOrder(req);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some(e => e.includes('unsupported_locale')));
});

test('[边界] 包含 emoji 的商品名', () => {
  const req = makeI18nOrderReq('zh-CN', 'emoji_name', {
    productName: '☕ 智能咖啡机 🚀 Pro Max ✨',
  });
  const order = domainStoreI18nOrder(req);
  assert.equal(order.originalProductName, '☕ 智能咖啡机 🚀 Pro Max ✨');
});
```

### 12. 大数据量与幂等性深度模式 (Pulse-Nightly-07 新增)

**适用场景**: Admin 触发大数据量报表/批量操作 → API 分页处理 → Domain 性能拦截（截断/超时保护）

**测试要点**:
- 万级数据分页（50,000条）的正确性
- 365天日期范围截断保护
- pageSize/page clamp 至合理范围
- 幂等性缓存返回（相同报表 requestId 返回缓存）
- 批量操作的幂等性（相同 requestId 不再处理）
- 空数据/空条目处理
- 性能估算基准（处理时间/内存估算）

```typescript
test('[正例] 中型报表（30天）分页和 totalPages 正确', () => {
  const result = domainGenerateBigReport({ ... startDate: '2026-06-01', endDate: '2026-06-30', page: 2, pageSize: 100 });
  assert.ok(result.success);
  assert.ok(result.totalPages > 1);
  assert.equal(result.page, 2);
});

test('[反例] 超 365 天日期范围被截断拒绝', () => {
  const result = domainGenerateBigReport({ ... startDate: '2025-01-01', endDate: '2026-06-30' });
  assert.equal(result.success, false);
  assert.ok(result.error?.includes('date_range_exceeds_max'));
});

test('[反例] 幂等性：相同 requestId 重复提交返回 alreadyProcessed', () => {
  const first = domainProcessBatchOperation(req);
  assert.ok(first.success);
  assert.equal(first.alreadyProcessed, false);
  const second = domainProcessBatchOperation(req);
  assert.ok(second.alreadyProcessed);
});

test('[边界] 10万级数据估算的合理性', () => {
  const metrics = domainEstimateProcessing(100000);
  assert.equal(metrics.itemsProcessed, 100000);
  assert.equal(metrics.totalTimeMs, 200000);
  assert.equal(metrics.memoryEstimateBytes, 25600000); // ~25.6MB
});
```

### 13. 全链路 SKU 生命周期 + 缓存一致性模式 (Pulse-Nightly-09 新增)

**适用场景**: Admin 创建/编辑/上架 SKU → Storefront 在线展示 → Mobile 浏览/下单 → API 库存校验 → Domain 仓储(缓存一致性) → SDK 事件通知

**测试要点**:
- Admin 增/改/查 SKU (创建/上架/编辑/停售)
- 反例: 重复 SKU ID、负价格、停售状态下架
- Storefront 已上架列表(过滤草稿/停售)
- 缓存命中 + 版本一致性校验
- Mobile 下单库存扣减(充足/不足/草稿/超限/无效数量)
- Admin 编辑后缓存自动失效 → 下次查询重建
- SDK 事件追溯(按 SKU / 按 type)
- 连续多次下单库存精确递减
- 改价即时生效 → Mobile 使用新价格
- 批量操作事件精确记录
- 库存更新缓存失效 + 重建

```typescript
test('[正例] Admin创建全新SKU → 存储成功, 触发SDK事件', () => {
  const r = adminCreateSku({ name: '新品', category: '餐饮设备', price: 49999, stock: 30 });
  assert.ok(r.success);
  assert.equal(r.sku!.status, 'draft');
  assert.equal(r.sku!.version, 1);
  const events = sdkGetEvents(r.sku!.id);
  assert.equal(events.length, 1);
  assert.equal(events[0].eventType, 'sku.created');
});

test('[正例] Storefront查询已上架SKU详情 → 缓存命中, 与Store一致', () => {
  const r = storefrontGetSkuDetail('sku_pub_01');
  assert.ok(r.success);
  const cc = domainCheckCacheConsistency('sku_pub_01');
  assert.ok(cc.consistent);
});

test('[反例] Mobile下单库存不足 → 拒绝', () => {
  const r = mobilePlaceOrder({ skuId: lowStockSku, quantity: 10 });
  assert.equal(r.success, false);
  assert.equal(r.error, 'insufficient_stock');
});
```

### 14. 消息推送 + 通知治理模式 (Pulse-Nightly-09 新增)

**适用场景**: Miniapp 触发业务事件 → Domain 消息队列(分级/分类) → Admin 配置通知规则 → Tob-Web 接收通知 → 用户标记已读

**测试要点**:
- Miniapp 触发不同类型事件(order_alert/refund_alert/system_announcement/compliance_alert)
- 优先级链式过滤 (low<normal<high<urgent)
- 规则启用/禁用切换
- 幂等性 requestId 去重
- Admin 查询/更新规则
- Tob-Web 未读计数(按角色独立)
- 批量标记已读
- 归档通知不再计入未读
- 多角色全部阅读后通知变为 read
- 规则修改影响后续事件不回溯

```typescript
test('[正例] Miniapp触发订单预警事件 → 创建通知', () => {
  const r = miniappTriggerEvent({ type: 'order_alert', title: '预警', content: '突降80%', priority: 'high' });
  assert.ok(r.success);
  assert.equal(r.notification!.status, 'pending');
});

test('[反例] Miniapp触发已禁用规则 → 拒绝', () => {
  const r = miniappTriggerEvent({ type: 'order_alert', title: '已禁用', content: '', priority: 'high' });
  assert.equal(r.success, false);
  assert.ok(r.error?.includes('no_enabled_rule'));
});

test('[正例] Tob-Web管理员批量标记已读 → 未读计数减少', () => {
  const before = tobWebGetUnreadCount('admin');
  const ids = notifications.map(n => n.id);
  tobWebMarkAsRead('admin', ids);
  const after = tobWebGetUnreadCount('admin');
  assert.equal(after.total, before.total - ids.length);
});
```

### 15. 退款全流程状态机 + 极限场景模式 (Pulse-Nightly-09 新增)

**适用场景**: Mobile 发起退款(全额/部分) → API 受理(批准/拒绝) → Domain 退款履约(requested→approved→processing→completed) → Storefront 退款展示(降序/统计)

**测试要点**:
- 全额/部分退款创建
- 反例: 超额/0元/已取消订单/不存在的订单
- 幂等性 requestId 去重
- API 批准/拒绝退款
- 状态机严格转换约束 (非 requested 不能 approve/reject, 非 approved 不能 process)
- 全额退款 → 订单自动 cancelled
- Storefront 降序排列验证
- 聚合统计(byStatus/byReason)
- 时间段过滤
- 多笔退款同一订单 → 各自独立
- completed 为终态不接受再处理

```typescript
test('[正例] Mobile发起全额退款 → 创建refund status=requested', () => {
  const r = mobileRequestRefund({ orderId: 'order_01', amount: 7597, reason: '质量' });
  assert.ok(r.success);
  assert.equal((r.refund as RefundRecord).status, 'requested');
});

test('[正例] Domain处理已审核退款 → 完整4态时间线', () => {
  const r = domainProcessRefund(approvedRefundId);
  assert.ok(r.success);
  assert.equal(r.refund!.status, 'completed');
  const timeline = domainGetRefundTimeline(approvedRefundId);
  assert.ok(timeline.length >= 4);
});

test('[反例] API重复审核同一退款 → 拒绝', () => {
  const r = apiApproveRefund(alreadyApprovedId);
  assert.equal(r.success, false);
  assert.ok(r.error?.includes('invalid_status'));
});

test('[正例] Storefront退款列表降序排列 → 最新最前', () => {
  const r = storefrontGetRefundList('order_01', 'desc');
  for (let i = 1; i < r.items.length; i++) {
    assert.ok(new Date(r.items[i-1].requestedAt) >= new Date(r.items[i].requestedAt));
  }
});
```

## 共享状态注意事项 (Pulse-Nightly-06/07 新增)

Node.js `--import tsx --test` 同进程共享模块作用域。跨模块 E2E 链若共用 in-memory 仓储时:

1. **使用唯一编码前缀**: 用 `Date.now()` + `Math.random()` 确保测试间不冲突
2. **计算剩余配额而非硬编码数量**: 如 `needCount = maxCount - existingCount`
3. **断言失败信息携带错误详情**: 帮助调试 `assert.ok(resp.success, JSON.stringify(resp))`
4. **边界值精确计算**: 测试边界值时用 `assert.ok(name.length > 50, 'Name must be >50')` 先验证
5. **测试数据隔离(Pulse-Nightly-09)**: 在链16初期 4 fail 教训后, 关键原则是: **每个独立业务场景使用新建实体(新SKU/新订单/新通知), 而非复用种子数据**。同一场景的不同测试按业务顺序推演状态, 后置条件应计算实际剩余而非硬编码。
6. **幂等性requestId唯一性(Pulse-Nightly-09)**: 不要纯用 `Date.now()` 生成 requestId——同一毫秒内多次调用返回相同值导致幂等性误拦截。使用计数器+时间戳组合: `reqId = \`order_\${Date.now()}_\${counter++}\``
7. **校验优先级(Pulse-Nightly-09)**: 在多层校验逻辑中, 前置校验(如限购)后置校验(库存不足)的结果可能混肴。测试用例的输入值需明确指向特定校验层

## 跨模块设计模式 (Pulse-Nightly-10 已扩展至 31 链)

### 模式9: 物联网数据管道 (链29 · 20 subtests)
```
IoT Device(数据采集) → Edge AI(推理) → Realtime(协同) → Lineage(血缘) → Anomaly Alert(告警)
```

**设计要点**:
- IoT 设备数据覆盖 online/offline/error 三种状态
- Edge AI 推理验证 normal/anomaly/extreme 三种输入
- Realtime 创建协同文档记录推理结果
- Lineage 血缘追踪可溯源到原始 IoT 设备
- 边缘推理异常检测触发告警链路

**典型三元组**:
- 正例: 正常温度 → Edge推理normal → 协同文档 → 血缘可溯源
- 反例: 空deviceId → 拒绝; 缺失推理输入 → 拒绝
- 边界: 极值温度(-20/999) → Edge检测anomaly → 告警文档 → 血缘关联

### 模式10: 多云区域容灾+混沌工程+自动回滚 (链30 · 22 subtests)
```
MultiRegion Routing → Failover → HealthCheck → Deploy → AutoRollback
```

**设计要点**:
- 区域路由测试优先级降级链: 主→备→备→全部故障→503
- 健康检查覆盖 healthy/degraded/down/unknown 四种状态
- 自动回滚验证: 健康部署→成功; 失败部署→自动回滚; 部署幂等性
- 手动触发主从切换和自动切回恢复

**容灾关键场景**:
1. 主区域故障 → 备区域接管 ✅
2. 多区域同时故障 → 降级到剩余活跃区域 ✅
3. 全部区域故障 → 503 Service Unavailable ✅
4. 降级区域恢复 → 自动切回最高优先级 ✅
5. 部署失败 → 自动回滚触发 ✅

### 模式11: 内容运营全链路 (链31 · 20 subtests)
```
Content CRUD → Brand Template → I18n Translate → Multimedia Embed → Publish
```

**设计要点**:
- 内容创建/读取/更新/版本控制 (version 递增)
- 品牌模板创建/查询/缺失品牌名拒绝
- 国际化多语言翻译: 占位符保留、不支持locale警告、6+locale覆盖
- 多媒体上传/查询/适配/超大文件拒绝
- 全链路: 创建内容→应用模板→翻译多语言→嵌入媒体→发布

## 内联 Domain 模拟模式 (Pulse-Nightly-10 新增)

当真实 NestJS 模块导入失败或依赖复杂时, 可采用自包含 inline domain 模拟:

```typescript
// ====== Domain 层: IoT ======
interface IoTDeviceData { deviceId: string; metrics: Record<string, number>; status: DeviceStatus }
const iotStore: IoTDeviceData[] = []
function resetIoTStore(): void { iotStore.length = 0 }
function recordIoTData(d: IoTDeviceData): { success: boolean; warnings?: string[] } {
  if (!d.deviceId) return { success: false, warnings: ['deviceId is required'] }
  iotStore.push(d)
  return { success: true }
}

beforeEach(() => resetIoTStore())

describe('Phase 1: IoT 数据采集', () => {
  it('[正例] ...', () => { /* ... */ })
  it('[反例] ...', () => { /* ... */ })
  it('[边界] ...', () => { /* ... */ })
})

// ... 多个 Phase -> 全链路集成
```

**适用原则**:
1. 每个 domain 模拟层必须暴露统一的 reset 函数 (便于 beforeEach 清理)
2. 测试按 Phase 分组 (Phase 1 单个模块 → Phase N 全链路集成)
3. 每个子场景覆盖正例·反例·边界三元组
4. 全链路 Phase 需 sequentially 调用多个 domain 函数

## 关联文档
- [patterns/quota-guard.md](../patterns/quota-guard.md) · 业务实现
- [patterns/reserve-rollback.md](../patterns/reserve-rollback.md) · 回滚模式
- [anti-patterns/quota-increment-then-check.md](../anti-patterns/quota-increment-then-check.md)
- [testing-strategy.md](./testing-strategy.md) · 整体测试策略
