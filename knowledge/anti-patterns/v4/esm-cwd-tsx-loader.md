# ESM cwd + tsx loader 反模式 v4

## 元信息
- **编号**: AP-W9 (Anti-Pattern Watch #9)
- **分类**: Node.js 测试 / TypeScript 编译
- **发现**: 2026-06-27 Phase-35 收银台 ESM 模块解析
- **影响**: 1 个 false 失败 → 4 个 false 失败
- **修复耗时**: 2 次跑测试定位

---

## 现象描述

`node --import tsx --test apps/api/src/modules/cashier/cashier.entity.test.ts` 在根目录跑报:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'cashier.entity'
```

但 `cd apps/api && node --import tsx --test src/modules/cashier/cashier.entity.test.ts` 跑**3/3 PASS**。

---

## 根因分析

### 1. tsx 默认就近找 tsconfig

tsx 加载器会**就近**找最近的 `tsconfig.json`,从当前 cwd 向上递归:
- `/Users/.../shenjiying88/apps/api/` → 找到 `apps/api/tsconfig.json` (有 decorators + paths)
- `/Users/.../shenjiying88/` → 找到 `tsconfig.base.json` (无 decorators 配置)

### 2. paths 别名解析依赖 cwd

`apps/api/tsconfig.json` 中:
```json
"paths": {
  "@m5/types": ["packages/types/src/index.ts"],
  "@m5/domain": ["packages/domain/src"],
  "@m5/sdk": ["packages/sdk/src"]
}
```

`baseUrl: "../.."` 表示相对 apps/api 的上一级(根目录),所以 paths 解析依赖**正确的 cwd**。

### 3. experimentalDecorators 缺失

`tsconfig.base.json` 不含:
```json
"experimentalDecorators": true,
"emitDecoratorMetadata": true
```

所以从根目录跑,加载 `apps/api/src/modules/member/member.service.ts` 时,NestJS 装饰器报错。

---

## 数学证明 · cwd 必要性

设:
- `P(根目录跑)` = 误用根目录跑测试概率
- `P(找到 apps/api tsconfig)` = 在 apps/api 跑 → 1.0
- `P(根目录找到 tsconfig.base)` = 在根目录跑 → 1.0 (有 base.json)
- `P(decorators 配置覆盖)` = base.json 也覆盖 apps/api decorators = 0% (实际未配置)

则:
```
P(ESM 失败 | 根目录跑) = 1.0 (必然失败)
P(ESM 成功 | apps/api 跑) = 1.0 (必然成功)
```

---

## 修复方案

### 方案 1: cd 后再跑 (本次采用)

```bash
cd /Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api
node --import tsx --test $(find src/modules/cashier -name "*.test.ts" | sort)
```

✅ 优点: 简单
❌ 缺点: 需要切目录,容易忘

### 方案 2: 加 tsconfig 路径参数 (tsx 不支持)

```bash
# tsx 没有 --project 参数
# 但可以 NODE_OPTIONS 强制路径
NODE_OPTIONS='--import tsx' node --test --import 'data:text/javascript,import { register } from "node:module"; import { pathToFileURL } from "node:url"; register("tsx/esm", pathToFileURL("./"));' apps/api/src/modules/cashier/cashier.entity.test.ts
```

❌ 太复杂

### 方案 3: 在根目录加 tsconfig 桥接

创建 `tsconfig.json` 在根目录继承 base + 补 decorators:
```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

✅ 推荐: 长期方案

---

## 最佳实践

### 跑测试的统一规范

```bash
# ❌ 错误 (根目录跑 ESM 失败)
node --import tsx --test apps/api/src/modules/cashier/cashier.entity.test.ts

# ✅ 正确 (cd apps/api 后跑)
cd apps/api && node --import tsx --test src/modules/cashier/cashier.entity.test.ts

# ✅ 更好 (用项目自带脚本)
cd apps/api && pnpm test src/modules/cashier/cashier.entity.test.ts
```

### 测试脚本的位置

| 项目 | 测试命令 | cwd |
|------|---------|-----|
| @m5/api | `pnpm test` | `apps/api` |
| @m5/admin-web | `pnpm test` | `apps/admin-web` |
| @m5/storefront | `pnpm test` | `apps/storefront` |

每个子项目**独立 cwd**,不要从根目录跨项目跑。

---

## 反模式总结

| 反模式 | 现象 | 修复 |
|--------|------|------|
| 根目录跑 api 测试 | ERR_MODULE_NOT_FOUND | cd apps/api |
| 期望 `@m5/types` | 找不到路径别名 | cwd 对 + tsconfig paths 对 |
| NestJS 装饰器报"experimental" | esbuild 默认未开 | cwd 必须在 apps/api |

---

## 相关反模式

- [tsx-decorator-pitfall.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/tsx-decorator-pitfall.md): NestJS 装饰器编译
- [dead-test-code.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/dead-test-code.md): 旧测试死代码

---

> 🦞 **"cwd 是 tsx 的灵魂"**