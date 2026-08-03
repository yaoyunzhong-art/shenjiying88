# 🔴 as any 清理策略

> E2E链分级脚本(e2e-tier-check.sh --quality)首次扫描发现
> **全系统4442处 as any，分布在765个测试文件(641个在API模块)**
> 创建: 2026-07-21 00:10 | 来源: 大飞哥指令"管"

## 现状

| 模块 | 含as any文件 | 总测试文件 | 占比 |
|:-----|:----------:|:---------:|:----:|
| `apps/api` | 641 | 2258 | 28% |
| `apps/admin-web` | 82 | 524 | 16% |
| `apps/storefront-web` | 8 | 286 | 3% |
| `apps/app` (RN) | 0 | 18 | 0% |
| **合计** | **765** | **3086** | **25%** |

## 清理原则

1. **不是所有as any都有问题** — `(data as any).nested.field` 在E2E测试中优雅绕过类型深度是合理的。只清理那些**掩盖真实类型错误**的as any
2. **分层清理** — L0 E2E链的测试优先，后面逐层清理
3. **用类型守卫替代as any** — 创建测试工具函数如 `unwrap(data: T): DeepWritable<T>`

## 清理优先级

| 优先级 | 范围 | 文件数 | 截止 |
|:------:|:-----|:------:|:----:|
| P0 | **L0 E2E测试** (cross-module-e2e-8/13/24/45/50) | 5 | 7/27 |
| P1 | **L1 E2E测试** + L2中调用链密集的文件 | 20 | 7/30 |
| P2 | API模块其余文件 | 616 | V23后续 |

## 清理方法

优先使用类型守卫替代 `as any`，禁止使用 `// @ts-ignore` 替代。

✅ 类型守卫：
```typescript
function hasData(obj: unknown): obj is { data: Record<string, unknown> } {
  return typeof obj === 'object' && obj !== null && 'data' in obj;
}
```

✅ 返回类型标注：
```typescript
// 代替 (service as any).method()
function callServiceMethod(p: string): Result {
  return (service as unknown as Record<string, (p: string) => Result>).method(p);
}
```

❌ 禁止：
```typescript
const x = y as any; // 纯掩盖
// @ts-ignore // 更坏
```

## 清理流程

1. 每次处理1个测试文件
2. 替换as any后用 `npx tsc --noEmit` 验证
3. 确保测试仍然通过
4. 同文件内优先改成类型守卫，其次是具体类型标注，最后才是保留必要as any（标注理由）
