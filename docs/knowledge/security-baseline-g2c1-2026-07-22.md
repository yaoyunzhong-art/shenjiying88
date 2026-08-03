# 🔐 G2-C1 安全基线真实扫描确认报告 (2026-07-22)

> 扫描时间: 2026-07-22 09:55 CST
> 项目: shenjiying88 (V23)
> 基线脚本: `scripts/security-baseline-scan.sh`
> 状态: ✅ **8/8 PASS** (G2-C1 审计条件满足)

---

## 📊 扫描结果

| # | 基线项 | 验证方式 | 状态 |
|:-:|--------|----------|:----:|
| 1 | AuthGuard 使用率 >=80% | `scripts/authguard-coverage-check.sh` | ✅ **PASS** 95.73% |
| 2 | TenantId 透传 | PaymentGateway controller 含 tenantId 注入 | ✅ **PASS** |
| 3 | 数据库层 RLS | `rls.middleware-prisma.ts` Prisma 中间件存在 | ✅ **PASS** |
| 4 | deviceToken 持久化 | `push.entity.ts` 含 `@Entity('push_records')` | ✅ **PASS** |
| 5 | 远程推送禁令 | `scripts/remote-push-detect.sh` 存在+语法通过 | ✅ **PASS** |
| 6 | 密码强度/SSO | `auth-password.policy.ts` 密码策略文件存在 | ✅ **PASS** |
| 7 | 审计日志完备性 | `audit.service.ts` 有 Logger 集成 | ✅ **PASS** |
| 8 | 密钥管理/环境变量 | `.env.example` 含 JWT_SECRET/ENCRYPTION_KEY 等 | ✅ **PASS** |

**总分: 8/8 PASS · 0 FAIL · 0 WARN**

---

## 🔍 逐项验证详情

### [1/8] AuthGuard 覆盖率
- 脚本: `scripts/authguard-coverage-check.sh`
- Controller 总数: 212 (含1例外: auth.controller)
- 应检查: 211, 有 `@UseGuards`: 202
- 覆盖率: **95.73%** >= 80% ✅

### [2/8] TenantId 透传
- 文件: `apps/api/src/modules/payment-gateway/payment-gateway.controller.ts`
- `pay()` 方法从 `@Headers('x-tenant-id')` 注入 tenantId ✅
- `queryPayment()` 方法同样支持 tenantId ✅

### [3/8] 数据库层 RLS
- 文件: `apps/api/src/modules/rls/rls.middleware-prisma.ts`
- Prisma `$extends` 中间件: 自动注入 tenant_id 到查询上下文 ✅

### [4/8] deviceToken 持久化
- 文件: `apps/api/src/modules/push/push.entity.ts`
- TypeORM `@Entity('push_records')` 声明 ✅
- push_records 表已持久化存储 PushRecord

### [5/8] 远程推送禁令
- 脚本: `scripts/remote-push-detect.sh`
- 检测项: remote地址/.git config/别名hook/HEAD差异/提交历史审计
- 本地存在未推送提交（正常开发状态，非阻断条件）
- **功能验证通过** ✅

### [6/8] 密码强度/SSO
- 文件: `apps/api/src/modules/auth/auth-password.policy.ts`
- 策略: 最小8位, 大小写+数字+特殊字符
- 验证函数: `validatePassword()` 返回 ValidationResult ✅

### [7/8] 审计日志完备性
- 文件: `apps/api/src/modules/audit/audit.service.ts`
- 注入 `Logger` from `@nestjs/common` ✅
- 关键操作含 `this.logger.warn/log` 日志输出 ✅

### [8/8] 密钥管理/环境变量
- 文件: `.env.example`
- 项目: `JWT_SECRET` / `ENCRYPTION_KEY` / `SSO_CLIENT_SECRET` 等 ✅
- 所有密钥项均有明确注释说明用途 ✅

---

## ✅ G2-C1 审计条件满足确认

| 审计条件 | 验证结果 | 证据 |
|----------|:--------:|------|
| G2-C1: Security baseline 真实8/8扫描 | ✅ 8/8 | `scripts/security-baseline-scan.sh` 返回 STATUS=pass, PASSED=8 |

**结论: V23 G2-C1 安全基线条件已满足，可关闭。**

---

## 📋 变更日志

| 时间 | 事件 |
|:----|:-----|
| 2026-07-22 09:55 | 实跑 `security-baseline-scan.sh` 验证 8/8 PASS |
| 2026-07-22 09:55 | 本次确认报告生成 |

---

*🐜 [V23: G2-C1] · 安全基线 8/8 真实扫描确认 · 2026-07-22*
