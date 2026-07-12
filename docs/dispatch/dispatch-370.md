# 🔴🌲 dispatch-370: P0 连续3次验收失败 — dispatch-369 93min零commit·系统响应崩塌

> 派单时间: 2026-07-12 21:45 · 验收: pulse#372
> 升级路径: dispatch-369(20:12)·pulse#370❌·pulse#371❌P0·pulse#372❌❌❌

## 📋 事态严重性

| 指标 | 值 |
|------|-----|
| dispatch-369 存活时间 | **93分钟** (20:12→21:45) |
| 累计commit | **0** |
| 连续验收失败 | **3次** (pulse#370·#371·#372) |
| P0级别 | ✅ (pulse#371已触发) |
| 当前P0响应 | ❌ **依然零修复** |

## 🔴 修复清单 (dispatch-369未完成项目 + 增量)

### P0 — @m5/miniapp (ELIFECYCLE test崩溃)
**问题**: `@m5/miniapp#test` 持续ELIFECYCLE exit(1) — 3个脉冲不变
**建议**: 检查 vitest/jest 配置是否有入口文件损坏、tsconfig 配置缺失导致加载失败

### P0 — @m5/app (TS2307 expo-local-auth + HomeScreen测试崩溃)
**TSC问题**: `services/BiometricAuth.ts:6` — `expo-local-authentication` 模块找不到
- 方案A: 安装 `@types/expo-local-authentication` 或 expo型声明
- 方案B: 在 BiometricAuth.ts 添加 `// @ts-ignore` 临时缓解
**测试问题**: HomeScreen 组件内部渲染崩溃 — 缺少 expo-local-auth 导致组件初始化失败

### P1 — @m5/storefront-web (Promise resolution hang)
**问题**: purchase-orders / recommendations / refunds 页面测试's Promise resolution is still pending'
**根因推测**: 这些页面依赖 storefront-web 内部 store 或 API mock，缺少全局 mock 初始化
**建议**: 在 `__tests__/setup.ts` 添加全局 Promise mock/fix

### P1 — @m5/tob-web (ELIFECYCLE)
**问题**: tob-web 测试也 ELIFECYCLE 退出
**建议**: 检查 tob-web vitest 配置与 storefront-web 是否共享相同基础配置问题

## 🚨 新发现 — pulse#372 CTest缓存揭示

force运行显示非缓存测试分布:
- 8 ✅ / 12 总 · 0 cached
- @m5/miniapp ❌ ELIFECYCLE (3次脉冲不变)
- @m5/app ❌ HomeScreen 崩溃 (ts2307连锁)
- storefront-web / tob-web / admin-web 测试缓存遮罩 — 未揭示真实值

## 🔧 立即行动 (排序)

1. **[5min]** `@m5/app` TSC: 添加 `// @ts-ignore` 临时修复 BiometricAuth.ts:6
2. **[10min]** `@m5/app` test: 修复 HomeScreen mock — 确保 expo-local-auth mock 在测试前注册
3. **[10min]** `@m5/miniapp` test: 检查 vitest.config.ts / 入口文件完整性
4. **[15min]** `@m5/storefront-web`: 全局 setup.ts 添加 Promise polyfill / mock
5. **[5min]** `@m5/tob-web`: 检查 vitest 配置一致性

## ⏱️ 验收标准 (下一个脉冲)
- `@m5/app` TSC: 全绿 (force 12/12)
- `@m5/app` test: HomeScreen 测试通过
- `@m5/miniapp` test: ELIFECYCLE 修复
- `@m5/storefront-web` test: Promise hang 修复
- `@m5/tob-web` test: ELIFECYCLE 修复
