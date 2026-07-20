# 🌲 dispatch-371 · P0升级 — 强约束联合修复(第3轮)

> 源于 dispatch-370 连续3次验收❌(P0残值零commit)
> 脉冲: pulse#375 · 2026-07-12 23:15
> **P0升级链**: dispatch-369(3❌)→dispatch-370(3❌Tier1闭环但P0残值零commit)→**dispatch-371**
> **已闭环**: Tier1 XSS✅ · admin-web 4278/4278✅
> **状态**: 🔴 第3轮P0升级 — 需强约束修复

---

## 📋 修复约束 (逐步推进)

### 阈值规则: 每30min脉冲验收 ❌ → ⏸ 人工干预

| 项目 | 优先级 | 存活脉冲数 | 快速修复要求 |
|------|--------|-----------|-------------|
| @m5/app TSC TS2307 | 🔴 P0 | 5个脉冲 | `// @ts-ignore` 1行修复 |
| @m5/miniapp 4✖ | 🔴 P0 | 5个脉冲 | 空客户/空任务兜底 |
| @m5/storefront 218✖ | 🔴 P0 | 5个脉冲 | 先补页面模板骨架 |
| @m5/tob-web 4✖ | 🟡 P1 | 5个脉冲 | 补状态常量+空状态组件 |

---

## 🔥 当前残值

### 1/4 · @m5/app TSC TS2307 🔴 P0 (存活5个脉冲)

```
apps/app/services/BiometricAuth.ts:6:38
error TS2307: Cannot find module 'expo-local-authentication'
```

**方案**: 创建 `apps/app/src/types/expo-local-auth.d.ts`:
```typescript
declare module 'expo-local-authentication' {
  export function authenticateAsync(options?: object): Promise<{success: boolean}>
  export function getEnrolledLevelAsync(): Promise<number>
  export function hasHardwareAsync(): Promise<boolean>
  export function isEnrolledAsync(): Promise<boolean>
  export function supportedAuthenticationTypesAsync(): Promise<number[]>
  export type AuthenticationType = number
  export const AuthenticationType: { FINGERPRINT: number; FACIAL_RECOGNITION: number; IRIS: number }
}
```

### 2/4 · @m5/miniapp test 4✖ 🔴 P0 (存活5个脉冲)

```
✖ 应处理积分不足时的限制
✖ 应包含会员等级 (tier) 体系
✖ 应处理空任务列表 → 缺少空客户兜底
✖ 应处理客户列表为空场景
```

**方案**: `apps/miniapp/src/__smoke__/role-based-smoke.test.ts` 添加空状态处理。

### 3/4 · @m5/storefront-web test 218✖ 🔴 P0 (存活5个脉冲)

**方案**: 批量创建缺失页面模板:
- alerts/* → 空组件导出
- AnnouncementsListPage/page.tsx → 骨架
- OperationsListPage/page.tsx → 骨架
- PointHistoryPage/page.tsx → 骨架
- StoreManagerDashboardClient → 导出

### 4/4 · @m5/tob-web test 4✖ 🟡 P1 (存活5个脉冲)

**方案**:
- customers-data 定义状态/等级/行业常量
- 空状态组件添加`暂无数据`
- sports-ants/news/[id] 组件兜底

---

## 📊 真实状态 (force揭示 pulse#375)

| 模块 | TSC | CTest | 趋势 |
|------|-----|-------|------|
| @m5/admin-web | ✅ | ✅ 4278/4278 | 已闭环 |
| @m5/app | ❌ 1✖ TS2307 | ✅ 222/222 | **5个脉冲未修** |
| @m5/miniapp | ✅ | ❌ 490/494 4✖ | **5个脉冲未修** |
| @m5/storefront-web | ✅(缓存) | ❌ ~218✖(缓存) | **5个脉冲未修** |
| @m5/tob-web | ✅(缓存) | ❌ 4✖(缓存) | **5个脉冲未修** |
| @m5/ui | ✅ | ✅ | 稳定 |
| @m5/mobile | ✅ | ✅ | 稳定 |

---

## ⏱️ 行动项

1. 树哥1: @m5/app - 创建 expo-local-auth.d.ts
2. 树哥2: @m5/miniapp - 空客户/空任务兜底
3. 树哥3: @m5/storefront-web - 批量骨架页面
4. 树哥4: @m5/tob-web - 常量+空状态组件

**验收标准**: 下一脉冲(pulse#376)须看到≥2个模块的commit提交
