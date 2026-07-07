# V5.2 测试执行计划 · 基于开发进度

> 版本: V5.2 · 2026-07-02
> 依据: 当前开发进度 (Phase-35/36进行中, Phase-41-50规划中)

---

## 一、当前开发进度分析

### 1.1 P0 基础层 (已完成)
- Phase-15~34: 11个phase全部完成
- 核心能力: 多租户/SSE/EventStore/ViewModel/TenantGuard

### 1.2 P1 业务深耕 (Phase-35/36 进行中)
| Phase | 任务 | 状态 | 优先级 |
|-------|------|------|--------|
| **Phase-35** | 收银台 (订单/支付/退款/状态机) | 🟡 进行中 | P0 |
| **Phase-36** | 会员管理 (配置中心/休眠) | 🟡 进行中 | P0 |
| Phase-37 | 库存管理 | 📋 规划 | P1 |
| Phase-38 | 财务对账 | 📋 规划 | P1 |
| Phase-39 | 数据报表 | 📋 规划 | P1 |
| Phase-40 | 智能推荐 | 📋 规划 | P2 |

### 1.3 P2+P3 (Phase-41~50 规划中)
- Phase-41~44: P2智能化 (AI客服/营销/分析/API)
- Phase-45~50: P3商业化 (订阅/招商/品牌/财务SaaS/集团/上市)

---

## 二、测试关注重点 (基于当前进度)

### 2.1 Phase-35 收银台核心测试域

| 测试域 | 关键场景 | 测试脚本 | 优先级 |
|--------|----------|----------|--------|
| **订单状态机** | DRAFT→PENDING→PAID→REFUNDED 全链路 | phase35-e2e-cashier.ts | P0 |
| **幂等性** | clientOrderId/paymentId/refundId | phase35-e2e-cashier.ts | P0 |
| **跨租户隔离** | 租户A无法访问租户B订单 | phase35-e2e-cashier.ts | P0 |
| **SSE事件流** | 11类事件实时推送 | phase35-e2e-sse.ts | P0 |
| **退款防超付** | 部分退/全部退/超付拦截 | phase35-e2e-cashier.ts | P0 |

### 2.2 Phase-36 会员配置核心测试域

| 测试域 | 关键场景 | 测试脚本 | 优先级 |
|--------|----------|----------|--------|
| **配置8字段** | earnRate/redeemRate/等级阈值/休眠 | phase36-e2e-member-config.ts | P0 |
| **热更新** | 配置修改立即生效 | phase36-e2e-member-config.ts | P0 |
| **休眠状态机** | DORMANT状态转换 | phase36-e2e-dormancy.ts | P1 |
| **跨租户** | 租户隔离配置 | phase36-e2e-cross-tenant.ts | P1 |

---

## 三、测试执行计划

### 3.1 第一批: Phase-35 收银台核心测试 (今日)

```bash
# 执行收银台E2E测试 (60断言)
cd /Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api
pnpm test -- cashier/cashier.service.test.ts
pnpm test -- cashier/order-state-machine.test.ts
tsx scripts/phase35-e2e-cashier.ts
```

### 3.2 第二批: Phase-36 会员配置测试 (今日)

```bash
# 执行会员配置E2E测试 (8 AC)
tsx scripts/phase36-e2e-member-config.ts
tsx scripts/phase36-e2e-dormancy.ts
tsx scripts/phase36-e2e-cross-tenant.ts
```

### 3.3 第三批: 跨模块集成测试 (本周)

```bash
# 收银台×会员联动
pnpm test -- cross-module/

# SSE事件流测试
tsx scripts/phase35-e2e-sse.ts
```

### 3.4 第四批: 安全与租户隔离测试 (本周)

```bash
# 多租户隔离验证
pnpm test -- cashier/cashier.module.test.ts

# RLS策略验证
pnpm test -- tenant/
```

---

## 四、44人专家团测试匹配 (V5.2)

### 4.1 当前阶段对应测试专家

| 测试场景 | 主导专家 | 参与专家 | 测试域 |
|----------|----------|----------|--------|
| 收银台状态机 | E13李收银 | E11钱店长,E12孙导购 | 商户运营组 |
| 支付幂等性 | E2李安全 | E1陈架构,E44周技术 | 系统技术组 |
| 会员配置 | E40杨客户 | E7孙体验,E23朱客服 | 用户体验组 |
| 跨租户隔离 | E2李安全 | E26/E27/E28租户代表 | 系统技术组 |
| SSE事件流 | E1陈架构 | E9吴AI,E44周技术 | 系统技术组 |

### 4.2 测试小组排班 (当前班次)

**A班 (15:00-23:00)**: E1,E2,E5,E9,E11,E13,E26,E30,E40
**B班 (07:00-15:00)**: E3,E14,E15,E22,E28,E32,E33,E36,E43

---

## 五、测试质量指标

| 指标 | 当前目标 | 测量方式 |
|------|----------|----------|
| Phase-35覆盖率 | ≥60断言 | 自动化统计 |
| Phase-36覆盖率 | 8/8 AC通过 | 自动化统计 |
| 跨租户隔离 | 100%覆盖 | 边界测试 |
| 幂等性验证 | 3种key全测 | 重复提交测试 |
| SSE事件推送 | 11类事件 | 集成测试 |

---

## 六、测试问题追踪

| 问题ID | 发现时间 | 场景 | 描述 | 状态 |
|--------|----------|------|------|------|
| (待记录) | - | - | - | - |

---

## 七、立即执行清单

- [ ] 1. 运行 phase35-e2e-cashier.ts (60断言)
- [ ] 2. 运行 phase36-e2e-member-config.ts (8 AC)
- [ ] 3. 运行 phase35-e2e-sse.ts (SSE事件)
- [ ] 4. 运行 phase36-e2e-dormancy.ts (休眠)
- [ ] 5. 运行 phase36-e2e-cross-tenant.ts (隔离)
- [ ] 6. 生成测试报告
- [ ] 7. 问题录入台账

---

> 本计划基于 2026-07-02 开发进度制定
> 测试执行: `cd apps/api && pnpm test`
