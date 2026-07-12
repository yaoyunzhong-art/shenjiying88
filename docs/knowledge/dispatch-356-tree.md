# 🌲 树哥派遣 — 脉冲#356 storefront-web 14处TSC新回归修复

> 2026-07-12 12:08 验收脉冲#356
> 大飞哥, 请转给树哥。谢谢！

树哥,

我是龙虾哥验收员。刚完成脉冲#356 验收。

**警告**: 上轮修复提交 `dc33706c2` (🩹 fix: insights页面结构) 引入 **14个新TSC错误**，均为 storefront-web 类型错误。之前 pulse#355 时 TSC是 14/14 ✅ 全过的。

## 任务: 修复以下 14 处 TSC 错误

### 文件1: `apps/storefront-web/app/insights/page.tsx` (8 errors)

#### A. MOCK_ALERTS 类型不匹配 — 5 errors (lines 87-91)
```ts
// 当前代码: MOCK_ALERTS 使用了 deviceId, type, message 等字段
const MOCK_ALERTS: AnomalyAlert[] = [
  { id: 'alt-01', deviceId: 'cam-02', type: 'camera_down', severity: 'high', message: '...', timestamp: '...', status: 'acknowledged' },
  // ...
];
// 报错: 'deviceId' does not exist in type 'AnomalyAlert'
```

**现象**: `@m5/ui` 导出的 `AnomalyAlert` 类型有两个版本:
- `components/AnomalyAlertPanel.tsx` 的: `{id, title, description, severity, source, timestamp, acknowledged, ...}`
- `anomaly-alert-panel/types.ts` 的: `{id, anomalyType, severity, status, metric, message, detectedAt, ...}`

Mock数据用了 `deviceId`, `type`, `message`, `timestamp`, `status` — **均不符合上述两种任意一种**。

**修法**: 查看 `AnomalyAlertPanel` 实际接受的 `AnomalyAlert` 类型，修改mock数据字段以匹配导入的类型。推荐：直接删除 `: AnomalyAlert[]` 类型注解让TS推断，或拆分为 `const` + `as const` 让类型自动推导。

#### B. MemberLevelDistribution 不接收 total prop — 1 error (line 194)
```ts
// 当前
<MemberLevelDistribution data={MOCK_MEMBER_LEVELS} total={total} />
// 报错: Property 'total' does not exist on type 'MemberLevelDistributionProps'
```

**修法**: 组件 `MemberLevelDistributionProps` 没有 `total` prop。删除 `total={total}` 即可。total 在组件内部自己计算。

#### C. filter state 类型不匹配 — 1 error (line 208)
```ts
(['all', 'online', 'warning', 'error', 'maintenance'] as const).map(s => ...
// 报错: '"online"' not assignable to SetStateAction<"all" | "warning" | "error" | "maintenance">
```

**修法**: `useState` 的泛型参数缺少 `'online'`。修法：在 `useState` 的泛型中添加 `'online'`，即改为 `useState<'all' | 'warning' | 'error' | 'maintenance' | 'online'>('all')`。

### 文件2: `apps/storefront-web/app/member-center/page.tsx` (6 errors)

#### D. 找不到模块 'antd' — 1 error (line 6)
```ts
import { Empty } from 'antd';
```

**修法**: 查看 `Empty` 在代码中是否被使用。如果未使用(当前组件中全靠手写样式)，**直接删除此行**。如果要用，需先在 storefront-web 安装 `antd`。

#### E. member 可能是 null — 5 errors (lines 75,107,111,147,164)
```ts
const tier = member.tier ?? 'basic';
const tierColor = TIER_COLORS[tier];
// ... 
{member.nickname?.charAt(0) ?? '会'}
// 报错: 'member' is possibly 'null'
```

**修法**: 当前逻辑:
```ts
if (loading) { return ...; }  // loading返回
if (!member && !loading) { return null; }  // 空态返回
// 此处TS无法识别member一定非null
```

修改 guard 为 `if (!member) return null;` (因为 loading 已在上一步处理)，或在每个 `member.xxx` 处加 `?.` 链式访问。推荐 **修改 guard**。

## 注意事项
- 修完后在 storefront-web 目录运行 `pnpm typecheck` 确认
- 仅修TS类型错误，不动逻辑
- 之前已知的测试fail (admin-web 3✖, miniapp 12✖, storefront-web test fail, tob-web ELIFECYCLE) 不动
