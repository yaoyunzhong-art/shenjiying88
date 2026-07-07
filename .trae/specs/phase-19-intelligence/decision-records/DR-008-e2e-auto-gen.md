# DR-008 · E2E 自动生成策略 (4 场景)

> 创建: 2026-06-26 (Phase-19 T28-T30)
> 状态: ✅ Accepted
> 关联: [phase-19/spec.md §Phase 2](../spec.md)

## Context

手工写 e2e 测试成本高 (一个 route 1-2 个 case),覆盖率低。
需要从 OpenAPI route 表自动生成,提效 5x。

## Decision

**4 场景自动生成 + CI 集成**:

### 场景矩阵
| 场景 | 触发条件 | 预期状态 |
|---|---|---|
| **NORMAL** | 必生成 | 200/201 |
| **BOUNDARY** | 字符串/数字参数 | 400/422/413 |
| **TYPE_ERROR** | number 参数 | 400/422 |
| **SECURITY** | POST/PUT | 400/422 |

### 生成流程
```
OpenAPI route table
   ↓ parseFromRoutes
   ↓
generate(route) - 4 场景 × N 参数
   ↓
test cases (5-10 per route)
   ↓
AutoRunner.run() → 报告
   ↓
CI verdict (passRate ≥ 95%)
```

## Alternatives Considered

### A. AI 自动生成 (LLM)
- ✅ 更智能,可生成业务场景
- ❌ 成本高 (每次 LLM call)
- ❌ 不稳定 (相同输入不同输出)

### B. Pactum / supertest 手工封装
- ✅ 标准
- ❌ 仍需手工写每个 case

### C. **规则生成 + CI verdict (选定)**
- ✅ 快速、可重复
- ✅ 安全 payload 自动覆盖 (半个 SAST)
- ✅ CI 即时反馈
- ⚠️ 业务场景覆盖有限

## Consequences

- ✅ E2E 自动生成覆盖率目标 ≥ 80%
- ⚠️ 需要 schema 治理保证 OpenAPI 质量
- 🔜 Phase-20:接 supertest 真实 HTTP

## 实施

- [openapi-parser.service.ts](../../../../apps/api/src/modules/e2e-auto-gen/openapi-parser.service.ts)
- [test-case-generator.service.ts](../../../../apps/api/src/modules/e2e-auto-gen/test-case-generator.service.ts)
- [auto-runner.service.ts](../../../../apps/api/src/modules/e2e-auto-gen/auto-runner.service.ts)
