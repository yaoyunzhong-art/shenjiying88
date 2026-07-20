# 🌲 树哥派遣 — 脉冲#365 @m5/app .tsx测试排除修复

> 2026-07-12 17:06 验收脉冲#365
> **紧急度**: P2 (慢性残值新发现)
> **连续次数**: 1次 (首次发现)

## 问题

`apps/app` 模块21个测试崩溃：

### 受影响文件
- `apps/app/screens/home/HomeScreen.test.tsx` → 11 tests ✖
- `apps/app/screens/settings/SettingsScreen.test.tsx` → 10 tests ✖

### 根因
`apps/app/package.json` test 脚本包含：
```
node --import tsx --test 'screens/**/*.test.tsx' 'screens/**/*.test.ts'
```
`node --test` 无jsdom环境，无法执行含React组件的.tsx文件。`HomeScreen.tsx:70` useNavigation() 报 Error boundary 崩溃。

### 修复方案
**方案A（推荐）**: 将 test.tsx 从 node --test 中排除，改为 vitest 运行
1. 修改 test 脚本: 移除 `screens/**/*.test.tsx` glob
2. 添加独立的 `test:tsx: vitest run --reporter verbose` 用于 .tsx 测试
3. 或安装 jsdom + 将 .tsx 测试改为 .test.ts（纯逻辑层）

### 期望
- 21 tests 从 ✖ → ✅
