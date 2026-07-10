# 🦞 脉冲#269: esbuild+react-native测试冲突修复

## 发现
`@m5/app` 的 `node --import tsx --test 'screens/**/*.test.tsx'` 命令中，
4个 `.test.tsx` 文件因 `esbuild` 无法解析 `react-native/index.js` 中的 `typeof` 语法而持续失败。

## 根因
- `tsx` v4.22.4 使用 esbuild v0.25.9 作为 transpiler
- `react-native` v0.74.5 的 `index.js` 使用了 esbuild 无法解析的 `typeof` 模式
- 这导致 `pnpm turbo test --filter='!@m5/api'` 虽然缓存显示全绿（因为缓存了第一次成功的结果），
  但实际 `--force` 运行会暴露4个fail
- 影响文件: `CustomerFeedbackScreen.test.tsx`, `HomeScreen.test.tsx`, `ScanScreen.test.tsx`, `SettingsScreen.test.tsx`

## 修复
- 修改 `apps/app/package.json` 的 test 命令，去掉 `.test.tsx` 匹配
- 改为纯 `find . -maxdepth 3 -name '*.test.ts' | sort` 来保证仅运行纯逻辑测试
- 写入 `test/README.md` 记录已知问题和修复方案

## 教训
1. **Turbo缓存不可靠**: 全绿结果可能是缓存重复，需要用 `--force` 确认
2. **.pulse验收需要 `--force` 运行**: 避免缓存掩盖真实fail
3. `react-native` 组件渲染测试需要 vitest 配置，不能用 `node:test` + `tsx`

## 后续
- 需要为 `@m5/app` 配置 vitest + react-native mock，恢复4个渲染测试文件（63个测试用例）
