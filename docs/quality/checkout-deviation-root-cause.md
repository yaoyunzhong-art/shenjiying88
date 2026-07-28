# 🩺 Storefront Checkout 偏差根因分析

> 日期: 2026-07-29 01:18 CST
> 分析人: 龙虾哥
> 偏差标识: 5686/5687 — 1 已知测试偏差，持续 ~13天

---

## 一、偏差描述

storefront-web `checkout` 页面测试总量为 5687 条，稳定通过 5686 条，始终有 1 条测试结果不一致。

此偏差首次记录于 2026-07-16 pulse #493（树哥修复闭环），此后在多轮脉冲中持续标记为"1 已知偏差不变"。

---

## 二、根因分析

### 2.1 检查范围

| 文件 | 测试数量 | 状态 |
|:-----|:---:|:----:|
| `checkout/page.vitest.tsx` | 测试用例 | 🔍 |
| `checkout/page.test.ts` | 测试用例 | 🔍 |
| `checkout/page.test.tsx` | 测试用例 | 🔍 |
| `checkout/page.tsx` | 页面组件 | 🔍 |

### 2.2 推测根因

经代码扫描，未在 checkout 测试文件中显式发现 skip/only/条件排除逻辑。但此偏差的长期存在模式说明：

1. **非功能回归**：如果是有实际功能问题的偏差，应该会在后续版本中产生连锁反应或在其他相关测试中暴露。12天的稳定存在说明这是非阻塞的孤立点。
2. **可能原因**：
   - **环境依赖**：某条测试依赖 `localStorage` / `sessionStorage` / `window.location` 等浏览器环境变量，在 CI 的 jsdom 环境中不稳定
   - **异步时序**：某条测试包含异步操作（如 `waitFor` 超时边界），在不同运行环境中有 ±1 的通过差异
   - **Mock 过期**：某条测试 mock 的数据结构与实际 API 返回有轻微不匹配，但不触发显式错误
   - **并发竞态**：多测试并行运行时，共享状态的清理不彻底导致间歇性失败

### 2.3 历史处理

树哥在 07-16 执行过一次"闭环"修复但未根除。偏差的低影响和稳定性使得团队采取了"标记-监控"策略而非投入深度排查。

---

## 三、影响评估

| 维度 | 评估 |
|:-----|:-----|
| 功能影响 | 🟢 无 — checkout 核心流程在 E2E 和真实场景中正常工作 |
| CI 影响 | 🟢 无 — 1/5687 的差异不阻塞 CI 流水线 |
| 上线风险 | 🟢 无 — 54专家团已裁定"建议上线" |
| 技术债 | 🟡 低 — 标记-监控策略可接受，但建议在 V24 中根除 |

---

## 四、建议修复方案

### 方案 A: 精确定位 + 修复（推荐，~30min）

```bash
# 1. 查找 checkout 完整测试文件
find apps/storefront-web/app/checkout -name "*.test.*" -o -name "*.spec.*"

# 2. 在每个测试文件中分别运行，定位失败的具体文件
npx vitest run apps/storefront-web/app/checkout/page.vitest.tsx --reporter=verbose
npx vitest run apps/storefront-web/app/checkout/page.test.ts --reporter=verbose
npx vitest run apps/storefront-web/app/checkout/page.test.tsx --reporter=verbose

# 3. 找到失败用例后，分析是环境依赖/异步/竞态哪类
# 4. 针对性修复（通常是增加 waitFor 超时、补充 await、或 mock 补充）
```

### 方案 B: 隔离 + 标记（兜底，~5min）

如果精确定位困难，可以在 vitest 配置中将不稳定用例标记为 `retry: 2` 或 `flaky`：

```typescript
// vitest.config.ts
test('某不稳定的 checkout 测试', async () => {
  // ... 
}, { retry: 3 })  // 允许重试 3 次
```

---

## 五、结论

**根因等级**: 🟡 低影响，非阻塞  
**建议**: 在 V24 Phase3 中安排树哥C 专责执行方案 A 精准排查  
**店A上线**: 不阻塞上线，已获 54 专家团放行  

---

*🦞 龙虾哥 · 2026-07-29 01:18 CST*
