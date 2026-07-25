# Day15 T2: @Public 注解进度统计 + 低优先级模块补充

> 执行时间: 2026-07-26 00:51 GMT+8  
> 执行人: 树哥 Trae (subagent)  
> 范围: apps/api/

---

## 📊 总览统计

| 指标 | 数量 | 占比 |
|------|------|------|
| **总 Controller 文件** | **223** | 100% |
| **已标注保护** | **55** | **24.7%** |
| **未标注** | **168** | **75.3%** |
| 未标注中有 TenantGuard | 158 | 70.9% |
| ⚠️ 完全无保护 (OPEN) | **10** | **4.5%** |

---

## ✅ 已标注模块 (55个 - 24.7%)

**标注定义**: 包含 `@Public()`、`@Roles(`、`@Permissions(`、`@TenantScope(`、`@RequireRoles(`、`@RequirePermissions(`、`@RequireTenantScope(` 任一修饰符。

### 基础模块
| 模块 | Controller | 标注类型 |
|------|-----------|----------|
| auth | auth.controller.ts | @Public |
| health | health.controller.ts | @Public |
| webhook | webhook.controller.ts | @Public |
| notification | notification.controller.ts | @Roles |
| rbac | rbac.controller.ts | @Roles/@Permissions |

### 营业/积分/会员
| 模块 | Controller | 标注类型 |
|------|-----------|----------|
| attendance | attendance.controller.ts | @Roles/@Permissions |
| member | member.controller.ts | @Public + @Roles |
| membership | membership.controller.ts | @Roles |
| points | points.controller.ts | @Roles |
| loyalty | loyalty.controller.ts | @Roles |
| coupon | coupon.controller.ts | @Roles |
| empower-card | empower-card.controller.ts | @Roles |

### 财务/结算
| 模块 | Controller | 标注类型 |
|------|-----------|----------|
| finance | finance.controller.ts | @Public |
| billing | billing.controller.ts | @Roles |
| expense | expense.controller.ts | @Roles |
| transactions | transactions.controller.ts | @Roles |
| cashier | 3 controllers | @Roles/@Permissions |

### 运营/营销
| 模块 | Controller | 标注类型 |
|------|-----------|----------|
| campaign | campaign.controller.ts | @Roles |
| campaign-performance | campaign-performance.controller.ts | @Roles |
| marketing | marketing.controller.ts | @Roles |
| marketing-metrics | marketing-metrics.controller.ts | @Roles |
| brand-operations | brand-operations.controller.ts | @Roles |
| push | push.controller.ts | @Roles |

### 分析/报告
| 模块 | Controller | 标注类型 |
|------|-----------|----------|
| analytics | analytics.controller.ts | @Roles |
| analytics-v2 | analytics-v2.controller.ts | @Roles |
| report | report.controller.ts | @Roles |
| reports | report.controller.ts | @Roles |
| store-revenue-report | store-revenue-report.controller.ts | @Roles |

### 库存/供应链
| 模块 | Controller | 标注类型 |
|------|-----------|----------|
| inventory | 4 controllers | @Roles/@Permissions |
| inventory-alert | inventory-alert.controller.ts | @Roles |
| logistics | logistics.controller.ts | @Roles |
| quality-inspection | quality-inspection.controller.ts | @Roles |
| procurement-order | procurement-order.controller.ts | @Roles |
| return-request | return-request.controller.ts | @Roles |

### HR/审计
| 模块 | Controller | 标注类型 |
|------|-----------|----------|
| hr | 3 controllers | @Roles/@Permissions |
| audit | audit.controller.ts | @Roles |
| contract-manager | contract-manager.controller.ts | @Roles |

### 基础架构 (已有Require系列装饰器)
| 模块 | Controller | 标注类型 |
|------|-----------|----------|
| foundation | foundation.controller.ts | @RequireTenantScope |
| foundation | configuration-governance | @RequireTenantScope + 方法级 @RequireRoles/@RequirePermissions |
| foundation | identity-access | 方法级 @RequireRoles/@RequirePermissions |
| foundation | resilience-operations | @RequireTenantScope + @RequireRoles |
| foundation | runtime-governance | @RequireTenantScope + @RequireRoles |
| foundation | trust-governance | @RequireTenantScope + @RequireRoles |

### 其他已标注
| 模块 | Controller |
|------|-----------|
| retrieval | retrieval.controller.ts |
| saas-advanced | custom-domain.controller.ts |
| tenant | 2 controllers |
| workbench | workbench.controller.ts |

---

## ⚠️ 未标注但受 TenantGuard 保护 (158个 - 70.9%)

这些 Controller 虽然没有 `@Public`/`@Roles`/`@Permissions` 等显式标注，但都注册了 `@UseGuards(TenantGuard)`，有租户级别的基础保护。

### 需优先补充的模块 ⭐ (高价值/高风险)

#### 🔴 P0 - 财务模块 (5个未标注)
```
finance/finance-health-dashboard.controller.ts
finance/finance-payment.controller.ts
finance/finance-reconciliation.controller.ts
finance/finance-report.controller.ts
finance/finance-settlement.controller.ts
```
> 已有 `finance.controller.ts` 标注 @Public，其余 5 个均需显式 @Roles

#### 🔴 P0 - 会员模块 (4个未标注)
```
member/member-config.controller.ts
member/member-dormancy.controller.ts
member/member-p36.controller.ts
member/member-store-a.controller.ts
member/member.cross-tenant.controller.ts
```
> 主 `member.controller.ts` 已标注，子控制器需补充

#### 🔴 P0 - Foundation 基础设施 (2个未标注)
```
foundation/governance-approval/governance-approval.controller.ts   ← 审批流程，高风险
foundation/integration-orchestration/integration-orchestration.controller.ts  ← 集成编排
```
> 其他 foundation 子模块已全面使用 @RequireRoles/@RequirePermissions，仅这两个遗漏

#### 🟡 P1 - AI 模块群 (17个未标注)
```
ai/ai.controller.ts
ai/d3/d3.controller.ts
ai/feedback/feedback.controller.ts
ai-content/ai-content.controller.ts
ai-cs/ai-cs.controller.ts
ai-diagnosis/ai-diagnosis.controller.ts
ai-forecast/ai-forecast.controller.ts
ai-insight/ai-insight.controller.ts
ai-marketing/ai-marketing.controller.ts
ai-model-config/ai-model-config.controller.ts
ai-profile/ai-profile.controller.ts
ai-push/ai-push.controller.ts
ai-rag/ai-rag.controller.ts
ai-recommend/ai-recommend.controller.ts
ai-review/ai-review.controller.ts
ai-reviewer/ai-reviewer.controller.ts
ai-rule-engine/ai-rule-engine.controller.ts
ai-sales/ai-sales.controller.ts
```

#### 🟡 P1 - 安全/合规/权限模块 (6个)
```
security/security.controller.ts          ← 安全模块自身未标注！
permission/permission.controller.ts       ← 权限管理模块未标注！
compliance/compliance.controller.ts       ← 合规模块
minor-protection/minor-protection.controller.ts
audit-related controllers
```

### 通用低优先级模块 (P2-P3)

#### 🟢 P2 - 运营管理类
```
alliance, automation, auto-rollback, birthday, blindbox, bootstrap
brand-custom, canary, categories, chain, champion, collab
competitor-track, content, crm, cross-module, currency
customer-satisfaction
```

#### 🟢 P2 - 技术设施类
```
db-knowledge, delivery-tracking, deploy, device-adapter
device-usage-report, devops, docs(2), e2e-auto-gen, edge
equipment-fault-report, gateway, health-dashboard, i18n
image-recognition, insight, intelligence, iot, knowledge
leads, leave-request, license(3), lineage, locale
logistics-management, lowcode(2), lyt, maintenance-plan
market, member-level, member-predict, member-spending-analysis
modules, monitoring, multi-region, multimedia
multimodal-fusion, notice, ocr, omnichannel, open-api
open-platform, openapi, ops-manual, oss, payment-gateway
perf-monitor, performance, performance-review, platform
portal, price-monitor, quality, queue, realtime
recommend(2), recommender, referral, repair
reports, reservation, rls, royalty, runbook
saas-advanced/sso, saas-billing, salary, sandbox
scout, session, shared, shift-scheduler, stock
store, store-rank, supplier-manager, svip
system-config, task-scheduler, tax, team-building
tenant-config, terminal, time-series, tournament
training, transfer, venue, voice-processing, warehouse-bin
```

#### 🟢 P2 - 跨模块/实验性
```
chaos/chaos-engineering.controller.ts
employee-marketing, employee-performance-review
federated-learning/federated, feed, feedback
gift-card, seo
```

---

## 🚨 完全无保护 OPEN (10个 - 4.5%)

以下 Controller **没有任何 Guard、没有任何注解**，完全暴露：

| # | Controller | 风险 |
|---|-----------|------|
| 1 | `cdn-cache/cdn-cache.controller.ts` | 🔴 CDN 缓存操作 |
| 2 | `chaos/chaos.controller.ts` | 🔴 混沌工程 |
| 3 | `docs/docs.controller.ts` | 🟡 文档服务 |
| 4 | `federated-learning/federated-learning.controller.ts` | 🟡 联邦学习 |
| 5 | `observability/observability.controller.ts` | 🔴 可观测性 |
| 6 | `recommend/d4-promotion/ab-test.controller.ts` | 🟡 AB测试 |
| 7 | `reports/reports.controller.ts` | 🔴 报表导出 |
| 8 | `saas-advanced/saas-advanced.controller.ts` | 🔴 SaaS 高级功能 |
| 9 | `tenant-llm/llm-config.controller.ts` | 🔴 LLM 配置 |
| 10 | `tenant-llm/tenant-llm.controller.ts` | 🔴 租户 LLM |

---

## 📈 进度对比

| 阶段 | 已标注 | 未标注 | 总体 |
|------|--------|--------|------|
| Day13 T5 后 | ~35 | ~188 | 223 |
| Day14 T2 后 | ~45 | ~178 | 223 |
| **Day15 T2 现在** | **55** | **168** | **223** |

> 两轮间增长: +10 个已标注 (foundation 子模块被重新归类后增加)

---

## 🎯 行动计划

### 立即 (本轮 T2)
```bash
# 统计已完成，报告已生成
```

### 后续建议
1. **急迫**: 10个 OPEN 无保护 controller → 立即加 @UseGuards(TenantGuard)
2. **高优先级**: 财务 5 子模块 + 安全/permission 模块 → 补 @Roles
3. **中优先级**: Foundation 2 遗漏模块 → 补 @RequireRoles
4. **低优先级**: 其余 140+ 模块 → 根据业务节奏逐步标注

---

## 📝 扫描命令 (可复现)

```bash
# 精确扫描（含 Require 系列装饰器）
cd /path/to/shenjiying88

echo "已标注: $(find apps/api/src/modules -name '*.controller.ts' ! -name '*.spec.ts' | while read f; do grep -q '@Public()\|@Roles(\|@Permissions(\|@TenantScope(\|@RequireRoles(\|@RequirePermissions(\|@RequireTenantScope(' "$f" 2>/dev/null && echo 1; done | wc -l)"

echo "未标注: $(find apps/api/src/modules -name '*.controller.ts' ! -name '*.spec.ts' | while read f; do ! grep -q '@Public()\|@Roles(\|@Permissions(\|@TenantScope(\|@RequireRoles(\|@RequirePermissions(\|@RequireTenantScope(' "$f" 2>/dev/null && echo 1; done | wc -l)"

echo "总: $(find apps/api/src/modules -name '*.controller.ts' ! -name '*.spec.ts' | wc -l)"

# OPEN 无保护列表
find apps/api/src/modules -name '*.controller.ts' ! -name '*.spec.ts' | while read f; do
  if ! grep -q 'TenantGuard\|JwtAuthGuard\|AuthGuard' "$f" 2>/dev/null; then
    echo "OPEN: $f"
  fi
done
```

---

✅ T2 统计任务完成
