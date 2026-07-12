# 🚨 DISPATCH-371 P0强约束派单

> 派单时间: 2026-07-12 22:45 (CST)
> 派单原因: dispatch-370 连续2次验收零commit（pulse#373+#374）
> 派单目标: 4项残值问题→强制7天期限

## 残值问题清单（7天内必须闭环）

### 🔴 Critical - 今天结束前（23:59）
| # | 模块 | 问题 | 修复命令 | 预估时间 |
|---|------|------|----------|----------|
| 1 | @m5/app | TS2307: expo-local-auth BiometricAuth.ts:6 | `// @ts-ignore` 上方或 `pnpm add -D @types/expo-local-authentication` | 5min |
| 2 | @m5/miniapp | 4✖ test失败(ELIFECYCLE) | 检查role-based-smoke测试，添加空客户兜底、会员等级undefined保护 | 15min |
| 3 | @m5/storefront-web | ~218✖ 大量assert/ELIFECYCLE | 批量创建缺失页面模板，修复refunds/replenishment页面测试 | 60min |
| 4 | @m5/tob-web | 4✖ ELIFECYCLE | 补缺失组件导出，修复空状态/错误兜底测试 | 15min |

## 执行规则
1. **每个修复必须单独commit**，不可合并
2. **commit后24小时内回复"第n项完成"到DISPATCH-371
3. **24小时无回复** → 自动升级P0第二次

## 验收标准
- [ ] @m5/app TSC force 通过 ✅
- [ ] @m5/miniapp test: 494/494 ✅
- [ ] @m5/storefront-web test: 全部通过 ✅
- [ ] @m5/tob-web test: 全部通过 ✅
