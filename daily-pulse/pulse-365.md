# 🦞 验收脉冲 #365 — 2026-07-12 17:06

## 一、状态采集

### ✅ TSC 14/14 (全缓存)
- 14 successful, 14 total (Cached: 14)

### ⚠️ 测试状态

| 模块 | 状态 | 详情 |
|------|------|------|
| @m5/storefront-web | ✅ 全绿 | 缓存命中 |
| @m5/admin-web | ✅ 全绿 | 缓存命中 |
| shenjiying-mobile | ✅ 全绿 | 28 files / 314 tests 全绿 |
| @m5/types | ✅ 全绿 | 41 tests 全绿 |
| @m5/sdk | ✅ 全绿 | 缓存命中 |
| @m5/ui | ✅ 全绿 | 含AI Model Switcher延迟测试 |
| @m5/domain | ✅ 全绿 | 缓存命中 |
| **@m5/app** | **⚠️ 21✖ 慢性残值** | HomeScreen(11✖) + SettingsScreen(10✖) — Node test执行.tsx React组件崩溃 |
| **@m5/tob-web** | **⚠️ 3✖ 慢性残值** | Promise resolution is still pending |
| **@m5/miniapp** | **⚠️ ~5✖ 慢性残值** | 会员等级/积分不足/空列表 + ELIFECYCLE |

### ✅ dispatch-358 闭环保持第8次
- 上次修复(storefront-web 5✖→✅, admin-web 3✖→✅) 持续有效

### ⚠️ 新发现慢性残值: @m5/app 21✖
- 根因: `screens/**/*.test.tsx` glob匹配了含React组件的文件 + `node --test`无jsdom → error boundary崩溃
- 症状: HomeScreen.tsx:70 useNavigation() 无 NavigationContainer 上下文

## 二、闭环检查

dispatch-357→358 闭环成功，保持第8次 ✅

## 三、修复派单

### 🌲 派单: dispatch-365 — @m5/app .tsx测试排除修复

**问题**: `apps/app/package.json` 中 test 脚本包含 `screens/**/*.test.tsx` glob，
node --test 无法运行含React的.tsx文件，导致21个测试崩溃。

**修复方案**: 修改 package.json test 脚本，将 test.tsx 测试迁移到 vitest 或从 node --test 中排除

## 四、知识库检查
- phase-progress.md 最后更新: Jul 12 16:58 ✅ (1h内)
- 连续全绿: 0🏆 (重置)

## 五、下一步
- 等待树哥 dispatch-365 修复
- 下个脉冲验收 dispatch-365 闭环
