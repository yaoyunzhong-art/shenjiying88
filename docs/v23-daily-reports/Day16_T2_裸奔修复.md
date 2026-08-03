# Day16 T2: 裸奔 Controller 补充 @Public()

**日期**: 2026-07-26  
**状态**: ✅ 完成  
**提交**: `e40c5032f` (docs: Day16 MEMORY更新)

---

## 目标

为 10 个模块中缺少 `@Public()` 装饰器的 controller 补充认证豁免标记。

## 排查范围

```bash
BARE="cdn-cache chaos observability reports saas-advanced tenant-llm federated-learning docs recommend"
```

## 修复清单 (9/10 controllers)

| # | 模块 | 文件 | 说明 |
|---|------|------|------|
| 1 | cdn-cache | `cdn.controller.ts` | ✅ 已添加 `@Public()` |
| 2 | chaos | `chaos-engineering.controller.ts` | ✅ 已添加 `@Public()` |
| 3 | observability | `metrics.controller.ts` | ✅ 已添加 `@Public()` |
| 4 | reports | `report.controller.ts` | ⚠️ 已有 `@Public()`，无需修改 |
| 5 | saas-advanced | `custom-domain.controller.ts` | ✅ 已添加 `@Public()` |
| 6 | saas-advanced | `sso.controller.ts` | ✅ 已添加 `@Public()` |
| 7 | tenant-llm | `llm-config.controller.ts` | ✅ 已添加 `@Public()` |
| 8 | federated-learning | `federated.controller.ts` | ✅ 已添加 `@Public()` |
| 9 | docs | `doc.controller.ts` | ✅ 已添加 `@Public()` |
| 10 | recommend | `recommend.controller.ts` | ✅ 已添加 `@Public()` |

## 跳过文件

| 文件 | 原因 |
|------|------|
| `cdn-cache/cdn-cache.controller.ts` | 仅 re-export → `cdn.controller.ts` |
| `chaos/chaos.controller.ts` | 仅 re-export → `chaos-engineering.controller.ts` |
| `observability/observability.controller.ts` | 仅 re-export → `metrics.controller.ts` |
| `reports/reports.controller.ts` | 仅 re-export → `report.controller.ts` |
| `saas-advanced/saas-advanced.controller.ts` | 仅 re-export → custom-domain/sso |
| `tenant-llm/tenant-llm.controller.ts` | 仅 re-export → `llm-config.controller.ts` |
| `federated-learning/federated-learning.controller.ts` | 仅 re-export → `federated.controller.ts` |
| `docs/docs.controller.ts` | 仅 re-export → `doc.controller.ts` |
| `recommend/d4-promotion/ab-test.controller.ts` | 无 `@Controller()` 装饰器 (是 service 类) |

## 验证

- ✅ TypeScript 编译零错误 (`npx tsc --noEmit` exit code 0)
- ✅ 所有 9 个 controller 均已 `import { Public }` + `@Public()`
- ✅ 已通过 git 提交

## 修改模式

每个 controller 添加两行：
```typescript
import { Public } from '../foundation/identity-access/public.decorator'
// ... 在 class 上方添加:
@Public()
```
