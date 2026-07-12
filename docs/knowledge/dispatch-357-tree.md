# 🌲 🔥🔥 P0 树哥派遣 — 脉冲#357 连续2脉冲未闭合升级

> 2026-07-12 12:38 验收脉冲#357
> **紧急度**: P0 🔥🔥 (dispatch-356 30min+未产生commit)
> **连续次数**: 2次 (pulse#356→pulse#357)
> **大飞哥**, 请立即转给树哥。**30min内需commit，否则升级通知链**。

## 背景

dispatch-356 (12:08派出) 未产生修复commit。当前14处TSC错误 **完全未修**。

## 任务: 修复以下 14 处 TSC 错误（与dispatch-356相同，重新列出）

**⚠️ 重要**: 修复后必须在 `apps/storefront-web` 目录下执行 `pnpm typecheck` 确认零错误！

### 文件1: `apps/storefront-web/app/insights/page.tsx` (8 errors)

#### A. MOCK_ALERTS 类型不匹配 — 5 errors (lines 87-91)
```ts
const MOCK_ALERTS: AnomalyAlert[] = [
  { id: 'alt-01', deviceId: 'cam-02', type: 'camera_down', severity: 'high', ... },
  // ...
];
```

**报错**: `'deviceId' does not exist in type 'AnomalyAlert'` (TS2353 × 5)

**修法**: 查看 `@m5/ui` 导出的 `AnomalyAlert` 实际类型（位于 `anomaly-alert-panel/types.ts` 或 `AnomalyAlertPanel.tsx`），mock数据字段必须匹配。推荐的两种方案：
1. 删除 `: AnomalyAlert[]` 类型注解，让TS推断
2. 查看 `AnomalyAlert` 的定义并调整字段名

#### B. MemberLevelDistribution 不接收 total prop — 1 error (line 194)
```ts
<MemberLevelDistribution data={MOCK_MEMBER_LEVELS} total={total} />
```

**报错**: `Property 'total' does not exist on type 'MemberLevelDistributionProps'` (TS2322)

**修法**: 删除 `total={total}` prop。组件自己在内部计算total。

#### C. filter state 类型不匹配 — 1 error (line 208)
```ts
(['all', 'online', 'warning', 'error', 'maintenance'] as const).map(...)
```

**报错**: `'"online"' not assignable to SetStateAction<"all" | "warning" | "error" | "maintenance">` (TS2345)

**修法**: 在 `useState` 泛型中添加 `'online'`：
```ts
const [filter, setFilter] = useState<'all' | 'warning' | 'error' | 'maintenance' | 'online'>('all');
```

### 文件2: `apps/storefront-web/app/member-center/page.tsx` (6 errors)

#### D. 找不到模块 'antd' — 1 error (line 6)
```ts
import { Empty } from 'antd';
```

**报错**: `Cannot find module 'antd' or its corresponding type declarations` (TS2307)

**修法**: 查看 `Empty` 是否被使用。如未使用 → **删除import行**。如使用了 → 搜索是否有替代用的本地空态组件。

#### E. member 可能是 null — 5 errors (lines 75,107,111,147,164)
```ts
const tier = member.tier ?? 'basic';
const tierColor = TIER_COLORS[tier];
```

**报错**: `'member' is possibly 'null'` (TS18047 × 5)

**修法**: 当前 guard 无法让TS识别member非null。推荐：
```ts
// 修改为:
if (!member) return null;
```
或统一使用 `member?.tier ?? 'basic'` 等链式访问。

## 验收标准
1. `pnpm turbo typecheck --filter=@m5/storefront-web` 通过 ✅
2. 不修改逻辑，仅修类型
3. 已知的miniapp/tob-web/admin-web测试fail不动
4. 完成后commit格式: `🩹 fix: pulse#357 14处TSC修复 [insights+member-center]`
