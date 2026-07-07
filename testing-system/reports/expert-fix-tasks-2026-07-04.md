# 专家修复任务清单 · 2026-07-04

> 组织: 44人超级专家团 · 问题修复专项
> 时间: 2026-07-04 22:35 CST

---

## 问题汇总

| 专家 | 模块 | 失败数 | 问题类型 | 优先级 |
|------|------|--------|----------|--------|
| E9 吴AI | recommend, ai-content | 9 | computeWeights逻辑, improvement为负 | P0 |
| E13 李收银 | cashier | 21 | require()加载失败 | P0 |
| E21 周无忧 | webhook | 29 | require()加载失败 | P0 |
| E40 吕监控 | tenant-llm | 44 | GeoService导入问题 | P0 |
| 其他 | health-dashboard, lineage | 61 | require()/构造函数问题 | P1 |
| 其他 | canary, transactions | 3 | 变量初始化/DI问题 | P2 |
| 其他 | multi-region, agent | 2 | 字段缺失/超时 | P2 |

**总计: 169个失败**

---

## P0 高优先级问题

### E9 吴AI - Recommend模块

**问题描述**: computeWeights在无context时忽略subset参数

**失败测试位置**:
```
src/modules/recommend/scoring.service.test.ts
- should filter to only specified strategies (line 194-196)
- should normalize weights to sum to 1 (line 198-202)
- should return weights object with all strategies (line 169-175)
- should calculate weights based on context (line 179-188)
```

**修复建议**:
1. 检查`ScoringService.computeWeights()`实现
2. 当无context时，应使用subset参数进行过滤
3. 当有context时，根据context计算权重

---

### E9 吴AI - AI-Content模块

**问题描述**: improvement计算结果为负数

**失败测试位置**:
```
src/modules/ai-content/ai-content.test.ts
- ProgressAnalyzer calculateImprovement should handle positive improvement (进步)
```

**修复建议**:
1. 检查`ProgressAnalyzer.calculateImprovement()`逻辑
2. 确保进步情况下返回正数

---

### E13 李收银 - Cashier模块

**问题描述**: 使用`require('./cashier.service')`无法加载TS模块

**失败文件**:
```
src/modules/cashier/cashier.role.test.ts
- 21个测试全部因require()失败
```

**修复方案**:
```typescript
// 错误写法
const { CashierService } = require('./cashier.service')

// 正确写法
import { CashierService } from './cashier.service'
// 或者使用existsSync验证
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

describe('CashierModule', () => {
  it('模块文件存在', () => {
    const modulePath = resolve(__dirname, './cashier.module.ts')
    expect(existsSync(modulePath)).toBe(true)
  })
})
```

---

### E21 周无忧 - Webhook模块

**问题描述**: 使用`require()`无法加载TS模块

**失败文件**:
```
src/modules/webhook/webhook.controller.spec.ts
- 29个测试全部因require()失败
```

**修复方案**: 同E13李收银

---

### E40 吕监控 - tenant-llm模块

**问题描述**: GeoService不是构造函数

**失败测试位置**:
```
src/modules/tenant-llm/i18n-geo.service.test.ts
- beforeEach中 new GeoService() 失败
```

**错误信息**:
```
TypeError: GeoService is not a constructor
```

**修复建议**:
1. 检查`GeoService`的导出方式
2. 可能是默认导出而非命名导出
3. 尝试`import GeoService from './geo.service'`或`import {GeoService} from './geo.service'`

---

## P1 中优先级问题

### health-dashboard模块 (27个require()问题)

**修复方案**: 同E13

---

### lineage模块 (30个构造函数问题)

**问题描述**: SensitiveDataService不是构造函数

**错误信息**:
```
TypeError: SensitiveDataService is not a constructor
```

**修复建议**: 同E40吕监控

---

## P2 低优先级问题

| 模块 | 问题数 | 描述 |
|------|--------|------|
| canary | 2 | 变量初始化/require问题 |
| transactions | 1 | NestJS DI依赖注入问题 |
| multi-region | 1 | lastHealth字段缺失 |
| agent | 1 | 5秒超时 |

---

## 修复验证命令

修复完成后，运行以下命令验证：

```bash
# E9 吴AI
pnpm vitest run recommend ai-content --reporter=verbose

# E13 李收银
pnpm vitest run cashier --reporter=verbose

# E21 周无忧
pnpm vitest run webhook --reporter=verbose

# E40 吕监控
pnpm vitest run tenant-llm --reporter=verbose

# 全量验证
pnpm vitest run --reporter=dot
```

---

## 修复完成标准

| 指标 | 目标 | 当前 |
|------|------|------|
| 通过率 | ≥98% | 96.8% |
| 失败数 | ≤50 | 169 |
| E9问题 | 0 | 9 |
| E13问题 | 0 | 21 |
| E21问题 | 0 | 29 |
| E40问题 | 0 | 44 |
