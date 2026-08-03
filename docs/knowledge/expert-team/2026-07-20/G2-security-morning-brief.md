# G2 安全组晨间简报 · 2026-07-20

- 专家: E2李安全 + E36卫审计 + E38沈监管
- 签署: ✅
- 时间: 08:18 CST

---

## L1 行业学习 — 安全基线合规 · 数据隔离策略

### 学习主题: SaaS 安全合规基线 · 2026 审计准备

**关键行业发现：**

1. **2026 SaaS 安全基线趋势** — Reco.io 2026 SaaS 安全报告指出：9 大基线项中"数据隔离验证"和"身份治理"已成为 SaaS 安全基线的核心评级项。审计要求从"是否实施"转向"是否可证明"(auditable evidence)。

2. **数据隔离策略矩阵** — 2026 年审计框架区分三种隔离等级：
   - **Level 1**: 应用层隔离（Guard/中间件）— 行业基准线
   - **Level 2**: 数据库层隔离（RLS/视图）— 合规要求
   - **Level 3**: 基础设施层隔离（每租户连接池/数据库）— 高合规场景

3. **GDPR/CCPA 2026 更新** — 跨境数据流动新增"数据驻留地图"(Data Residency Map)要求，需记录每张表、每个租户的数据存储位置。这对多租户系统的审计日志维度提出新要求。

4. **渗透测试自动化** — 安全扫描 CI/CD 集成已成为 SOC 2 Type II 的标配要求。行业主流做法：安全扫描退出码门禁 + 每周人工复核。

---

## M1 晨间签阅 — V22 安全补丁审查

### 检查范围: V22 安全修复跨租户 + Cashier 去 Mock

| 交付项 | Commit | 状态 |
|--------|--------|:----:|
| PaymentGateway 跨租户修复 | `94eabd504` | ✅ |
| TenantGuard 添加到 Controller | `94eabd504` | ✅ |
| Cashier SDK 联调 (去Mock) | `12d77daf0` | ✅ |
| POS/checkout/payment/refund E2E | `84e5ecef9` | ✅ |
| 权限链审计脚本 | `28e7e9fc4` | ✅ |
| 金额对齐检查脚本 | `28e7e9fc4` | ✅ |

### 安全基线对比 (vs 2026-07-19)

| 基线项 | 上日 | 今日 | 变化 |
|--------|:----:|:----:|:----:|
| AuthGuard 覆盖率 | ⚠️ 182/189 无标注 | ⚠️ 182/189 (新模块+) | ⬇️ |
| RLS 保护表 | 11 | 11 | → |
| deviceToken 持久化 | ❌ 全内存 | ❌ 全内存 | → |
| 未成年保护 | ⚠️ 仅前端声明 | ⚠️ 未变化 | → |
| 渗透测试 (退出码) | ✅ 0 | ✅ 0 | → |

### 发现

1. ✅ **PaymentGateway 跨租户已修复** — V22 凌晨 `94eabd504` 补丁将 TenantGuard 加入到原本无保护的 PaymentGatewayController。这是跨租户权限链审计发现的典型补全项。

2. ✅ **Cashier SDK 去 Mock 完成** — `12d77daf0` + `84e5ecef9` 将 Cashier SDK 从 Mock 数据切换为真实 API 联调，同时 E2E 覆盖 POS/checkout/payment/refund 全链路。

3. ⚠️ **Gap — AuthGuard 宽松模式风险仍在扩大**: 189 个 Controller 中仅 7 个带 `@UseGuards` 显式标签。182 个依赖全局 Guard 宽松模式。V22 新增的 skeleton pages (用户/限流/基础配置/HR 等) 进一步推高了无标注计数。

4. ⚠️ **deviceToken 未修复**: 两处推送服务 (`push.service.ts`, `ai-push-task.service.ts`) 仍为全内存 Map。无持久化，重启丢失，revoke 失效。

---

## K1 洞察简报

### 🔴 风险发现

| # | 风险 | 等级 | 影响 |
|---|------|:----:|------|
| 1 | **AuthGuard 宽松模式 -> 默认放行** — 182/189 Controller 无 `@Roles`/`@Permissions` | 🔴 | 新模块上线若忘记加 Guard，即无条件放行 |
| 2 | **deviceToken 无持久化** — push.service.ts + ai-push-task.service.ts 全内存 | 🔴 | 服务重启后所有推送历史+revoke 失效 |
| 3 | **19 个 model 无 tenantId** — 无法实施 RLS | 🟡 | RLS 扩展时需对存量表补充字段+迁移 |
| 4 | **PaymentGateway Service tenantId 未透传** | 🟡 | 交易记录无租户标记，审计追溯困难 |

### 💡 改进建议

| # | 建议 | 优先级 | 责任人 |
|---|------|:------:|--------|
| 1 | **IdentityAccessGuard 改为默认拒绝模式**: 添加 `@Public()` 装饰器，未标注路由默认 403 | P0 | E2 |
| 2 | **deviceToken 持久化**: push.service.ts 改为 DB/Redis 存储，跨节点同步 revoke | P1 | E36 |
| 3 | **19 个 model 补充 tenantId** + RLS 迁移脚本 | P1 | E36 |
| 4 | **安全基线自动化门禁**: 每周自动运行 security-baseline-check.md 扫描，新增高风险项立即告警 | P2 | E38 |
| 5 | **PaymentGatewayService 补充 tenantId 审计日志**: 交易记录携带租户上下文 | P1 | E2 |

### 📊 安全评分

| 维度 | 评分 | 说明 |
|------|:----:|------|
| 跨租户隔离 | 🟡 | Controller 已修补，Service 层有 gap |
| 安全基线落实 (10/10项) | ✅ | 全部覆盖，但 2 项高风险 |
| AuthGuard | 🟡 | 182/189 无显式 Guard，默认放行模式风险持续 |
| 渗透测试自动化 | ✅ | CI/CD 集成正常，退出码 0 |
| V22 安全补丁交付 | ✅ | PaymentGateway + Cashier 去 Mock 均已完成 |

**综合评分: 🟡 关注 — AuthGuard 默认放行 + deviceToken 需今日攻坚**

---

## 📎 审计附件

| 文件 | Commit | 说明 |
|------|--------|------|
| `apps/api/src/modules/payment-gateway/payment-gateway.controller.ts` | `94eabd504` | 已添加 `@UseGuards(TenantGuard)` |
| `apps/api/src/modules/payment-gateway/payment-gateway.service.ts` | (base) | 仍缺 tenantId 参数传递 |
| `docs/knowledge/security-baseline-check.md` | v1.8 | 基准基线 |
| `e2e/tests/cashier-pos-minimal.spec.ts` | `84e5ecef9` | POS E2E 验收 |

---

*🐜 G2 安全组 · 2026-07-20 08:18 CST · V22 Monday*
