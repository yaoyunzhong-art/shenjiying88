# Anti-Pattern v4 · tsx-decorator-pitfall (tsx 装饰器未生效)

> 创建日期: 2026-06-27
> 来源: Phase-31 TenantGuard 测试 + Phase-34 view-model 装饰器
> 危害等级: 🟡 中 (不报错但静默失效)
> 关联: R-04 测试维度 + R-06 反模式库 v4

---

## 错误表现

在 tsx 文件中写装饰器 (如 `@TenantGuard()`),运行时不报错但装饰器未生效:

```typescript
// ❌ 错误: tsx 中装饰器语法被 tsx 编译器忽略
@Controller('agent')
@UseGuards(TenantGuard) // ❌ 装饰器被 tsx 当注释
export class AgentController {
  @Get('configs')
  getConfigs() { ... }
}
```

运行结果: `getConfigs()` 被调用,但 TenantGuard 未执行 → 跨租户泄漏

## 为什么错

1. **tsx 编译器默认不启用 `experimentalDecorators`**
2. **NestJS 装饰器依赖 TS 编译器元数据发射 (`emitDecoratorMetadata`)**
3. **tsx 直接执行 .ts,绕过了 TS 编译器链**
4. **静默失效**: tsx 不报错,装饰器变成 noop

## 正确做法

### 方案 A: 编译后再跑 (生产)
```bash
# 1. 先 tsc 编译
pnpm tsc --project apps/api/tsconfig.json

# 2. 再跑 dist
node apps/api/dist/main.js
```

### 方案 B: ts-node 替代 tsx (NestJS 推荐)
```bash
pnpm ts-node --transpile-only -r tsconfig-paths/register \
  apps/api/src/main.ts
```

### 方案 C: 测试场景 (本仓库)
- 单元测试中装饰器类用 `new TenantGuard()` 直接调 `canActivate()`
- E2E 中装饰器通过完整 nest 启动 (非 tsx)

## 验证步骤

1. **静态扫描**: 检查 tsconfig.json 是否含 `experimentalDecorators: true`
2. **运行时测试**: 跑 E2E, 验证 guard 实际生效 (如缺失 header → 401)
3. **fallback**: 在 controller 入口加手动 guard 校验 (双保险)

## 关联案例

- Phase-31 E2E: `scripts/phase31-e2e-tenant.ts` 用 `new TenantGuard()` 直接调 `canActivate()` 绕过装饰器
- 未来 phase: NestJS controller 必须先 `pnpm build` 后再跑 E2E

## 关联专家

- E1 陈架构 · E39 韩开发 (ISV)

## 关联文档

- [scripts/phase31-e2e-tenant.ts](../../scripts/phase31-e2e-tenant.ts) — 装饰器绕过示例
- [best-practices/api-design.md](../best-practices/api-design.md) — NestJS 装饰器最佳实践