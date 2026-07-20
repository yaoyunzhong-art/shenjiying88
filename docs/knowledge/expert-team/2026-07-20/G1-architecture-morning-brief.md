# G1 架构组晨间简报 · 2026-07-20

- 专家: E1陈架构 + E44周技术
- 签署: ✅
- 时间: 08:12 CST

---

## L1 行业学习 — 多租户安全架构

### 学习主题: PostgreSQL RLS + 零信任网关 · 2026 行业最佳实践

**关键行业发现：**

1. **数据库层隔离 > 应用层隔离** — PostgreSQL RLS 是目前多租户 SaaS 首选的隔离层方案。其核心优势在于：即使应用代码存在 bug、中间件 misroute，RLS 仍能在数据库层拦住跨租户数据泄露（defense-in-depth）。2026 年《Row-Level Security for Multi-Tenant SaaS》报告指出，使用 RLS 可减少跨租户漏洞 90%+。

2. **NIST SP 800-207 零信任架构** — 2026 年零信任已从概念进入成熟实施阶段。核心原则：永不信任、始终验证、最小权限。适用于支付网关的零信任网关模式包括：
   - 每请求身份验证（不只是会话认证）
   - 基于策略的访问控制（不依赖网络边界）
   - 持续监控和自适应策略

3. **每租户连接池** — 行业趋势正在从"共享数据库 + RLS"向"每租户连接池"演进，以应对高安全合规场景（如 PCI-DSS）。RLS 管理 API + 连接池隔离形成双层防线。

---

## M1 晨间签阅 — V22 凌晨交付审查

### 检查范围: PaymentGatewayTenantGuard 部署模式

| 交付项 | 文件 | 状态 |
|--------|------|:----:|
| TenantGuard 修复 | `PaymentGatewayController` 添加 `@UseGuards(TenantGuard)` | ✅ |
| 4 端点签名 | 所有端点添加 `@Headers('x-tenant-id') tenantId` 参数 | ✅ |
| 测试适配 | `.spec.ts` / `.test.ts` / `.e2e.test.ts` 适配新签名 | ✅ |
| TSC 验证 | 零错误 | ✅ |
| commit sha | `94eabd504` + `8d8fe258d` | ✅ |

### 发现

1. ✅ **正面**: PaymentGatewayController 已完成跨租户防护修复，从无 Guard 状态升级为类级 `@UseGuards(TenantGuard)`。这是 V22 安全补丁的核心修复之一。

2. ⚠️ **Gap #1 — Service 层未传递 tenantId**: `PaymentGatewayService` 的 pay/query/refund 方法签名未接受 `tenantId` 参数。Controller 层验证了租户身份但未传递给业务层。Service 使用内存 Map 存储交易记录，但 `tenantId` 未参与 billing 或 audit log 写入。

3. ⚠️ **Gap #2 — RLS 未覆盖 payment-gateway 表**: 支付网关相关数据库表未在 11 张 RLS 受保护表清单中。PaymentData 流转（交易记录、退款记录）缺少 RLS 兜底。

4. ✅ **Cashier 层已有成熟隔离**: `cashier-tenant.ts` 提供 `tenantSafeGet` / `tenantFilter` / `assertSameTenant` 三个 helper，覆盖 order/payment/refund 三 service 共 11 处跨租户检查，模式成熟可复用。

---

## K1 洞察简报

### 🔴 风险发现

| # | 风险 | 等级 | 影响 |
|---|------|:----:|------|
| 1 | PaymentGatewayService 缺少 tenantId 透传 | 🔴 | 虽然 Controller 检查了 tenantId，但 Service 层写出交易记录时不带 tenantId，无法按租户隔离查询 |
| 2 | 支付网关表未接入 RLS | 🔴 | 若直接查数据库，可跨租户访问支付记录 |
| 3 | TenantGuard 仅依赖 header，无 fallback token 验证 | 🟡 | 如果 header 伪造（如上游 proxy 未清洗），Guard 信任恶意值 |
| 4 | query.tenantId 兜底选项可能被滥用 | 🟡 | URL 参数传递 tenantId 不安全（记录在 access log 中） |

### 💡 改进建议

| # | 建议 | 优先级 | 责任人 |
|---|------|:------:|--------|
| 1 | `PaymentGatewayService.pay()` 等所有方法增加 `tenantId` 参数，交易记录写入 tenantId | P0 | E1 |
| 2 | 将 payment_gateway 相关表纳入 RLS 保护范围（使用 rls.controller 的 setup 端点） | P0 | E44 |
| 3 | TenantGuard 移除 `query.tenantId` 选项，仅接受 header 方式 | P1 | E44 |
| 4 | Cashier 的 `cashier-tenant.ts` 隔离模式推广至 payment-gateway 模块 | P1 | E1 |
| 5 | 添加 RLS verify 端点定期扫描（每周 cron）验证跨租户隔离有效性 | P2 | E44 |

### 📊 架构评分

| 维度 | 评分 | 说明 |
|------|:----:|------|
| 多租户隔离架构完整性 | 🟡 | Controller 层已修补，Service 层有 gap |
| RLS 覆盖度 (11/53 model) | 🟡 | 19 个 model 无 tenantId，新增 payment 表未覆盖 |
| 零信任成熟度 | 🟡 | TenantGuard 单层验证，缺少 JWT 签入、payload 签出校验 |
| 当前 V22 交付质量 | ✅ | 4 端点修复+测试适配全部通过，TSC 零错误 |

**综合评分: 🟡 关注 — 高风险项需今日关闭**

---

*🐜 G1 架构组 · 2026-07-20 08:12 CST · V22 Monday*
