# P0 债务修复任务卡 · 2026-06-27

## 元信息
- **优先级**: 🟡 P0 (不阻塞 P1,但需关注)
- **来源**: 今日后台测试 1384/1387 PASS (3 fail)
- **创建人**: 🦞 龙虾哥
- **状态**: 🟡 待派发

---

## 1. 当前 3 个失败 (Phase-25~34 P0 阶段遗留)

```
not ok 58 - e2e: tenant suspend 后 createInvoice 抛 TenantLifecycleBlockedException
not ok 62 - e2e: tenant reactivate 后 createInvoice 恢复
not ok 63 - e2e: 多 tenant 隔离 - tenant-A suspend 不影响 tenant-B
```

**影响**: finance 模块 e2e 测试失败,但单元 + 集成测试 100% PASS。

**根因**: `TenantLifecycleBlockedException` 在 tenant suspend 后未正确抛出,需要 review TenantGuard + Finance 集成。

**附加已知问题**:
- @m5/api app-journey timeout 持续 6+ 脉冲 (历史问题)
- finance/subscription 模块与 tenant lifecycle 未完全集成

---

## 2. 修复任务 (建议 T-NN · 估时 0.5d)

### Step 1: 诊断 TenantLifecycleBlockedException 抛出链 (1h)

```bash
# 找 TenantLifecycleBlockedException 定义
grep -rn "TenantLifecycleBlockedException" apps/api/src/ | head -10

# 找 createInvoice 集成点
grep -rn "createInvoice" apps/api/src/modules/finance/ | head -10

# 跑 e2e 看具体错误
cd apps/api && node --import tsx --test src/modules/finance/finance.e2e.test.ts
```

### Step 2: 修复 guard 集成 (2h)

```typescript
// FinanceService.createInvoice 必加 tenant lifecycle 检查
async createInvoice(input: CreateInvoiceInput, opts: TenantOptions): Promise<Invoice> {
  const tenant = await this.tenantService.getById(opts.tenantId)
  if (tenant.lifecycle === 'SUSPENDED') {
    throw new TenantLifecycleBlockedException({
      tenantId: opts.tenantId,
      action: 'create_invoice',
      status: tenant.lifecycle
    })
  }
  // ... 现有代码
}
```

### Step 3: 跨租户隔离测试 (1h)

```typescript
test('tenant-A suspend 不影响 tenant-B', async () => {
  await tenantService.suspend('tenant-A')
  
  // tenant-A 应该失败
  await assert.rejects(
    () => financeService.createInvoice(input, { tenantId: 'tenant-A' }),
    TenantLifecycleBlockedException
  )
  
  // tenant-B 应该成功
  const invoice = await financeService.createInvoice(input, { tenantId: 'tenant-B' })
  assert.ok(invoice.id)
})
```

---

## 3. 附加任务 · @m5/api app-journey timeout

### 现状
- app-journey e2e 测试持续 timeout
- 6+ 脉冲 unresolved

### 建议排查

```bash
# 1. 看 app-journey 测试
find . -name "app-journey*.test.ts" -o -name "app-journey*.spec.ts" | head -5

# 2. 看 timeout 配置
grep -rn "timeout" apps/api/scripts/ 2>/dev/null | head -10

# 3. 单独跑看具体卡哪
cd apps/api && node --import tsx --test scripts/app-journey.test.ts
```

---

## 4. 风险与对策

| 风险 | 概率 | 影响 | 对策 |
|------|------|------|------|
| finance 模块依赖深 | 中 | 中 | 渐进式修复,先单元测试 |
| 修复破坏现有功能 | 低 | 高 | 全模块测试 + 回归 |
| app-journey 根因复杂 | 高 | 低 | 单独 issue 跟踪 |

---

## 5. 提交格式

```
🛡️ R-06 race-safe auto-commit

P0 债务修复: finance tenant lifecycle 集成
- apps/api/src/modules/finance/finance.service.ts (添加 TenantLifecycleBlockedException 检查)
- apps/api/src/modules/finance/finance.e2e.test.ts (3 断言修复)
- 静态扫描: 3/3 命中
- 反模式库 v4: residual-pending-state + security-defense
- R-06 防御: race-safe + HEARTBEAT.record
```

---

> 🦞 **"P0 债务不阻塞 P1,但要逐步消化"**

待 🌲 树哥trae 有空时处理,或 🦞 龙虾哥后台 22h 进化时修复。