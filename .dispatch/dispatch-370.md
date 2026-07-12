# 🪴 dispatch-370 🚨P0 🚨 紧急：联合修复 storefront+miniapp+tob+appTSC

> 创建: 2026-07-12 21:15 · 派单人: 🦞脉冲验收员
> 来源: dispatch-369 连续2次验收失败 → P0升级

## 状态: ⏳ 已派单等待执行

## 问题概要

dispatch-369 自 20:12 派单至今 63min **零commit**，连续2次验收失败 → 自动P0升级。

## 待修复清单

### 1. [P0] @m5/app TS2307 expo-local-authentication
- 文件: `apps/app/services/BiometricAuth.ts:6`
- 报错: `Cannot find module 'expo-local-authentication' or its corresponding type declarations.`
- 修复: `pnpm add -D @types/expo-local-authentication` 或安装缺失的类型包
- 验证: `pnpm turbo typecheck --filter='@m5/app'`

### 2. [P0] @m5/storefront-web 测试大量失败 (~273+)
- 主因: **Promise resolution 超时 + 组件/页面未定义断言**
- 涉及文件: page.test.tsx (announcements, alerts, operations, orders, refunds, etc.)
- 修复建议: 
  - 检查mock是否正确加载UI组件
  - 为assert放宽边界（storefront API mock问题）
- 当前: 部分测试缓存→需force跑确认真实fail数
- 验证: `pnpm turbo test --filter='@m5/storefront-web'`

### 3. [P1] @m5/tob-web 测试4✖ (1581/1585 pass)
- 失败项:
  - 应展示"暂无数据"空状态（过滤无结果时）
  - 应包含页面错误/加载异常时的兜底处理
  - customers-data 应定义 CUSTOMER_STATUSES / CUSTOMER_TIERS / CUSTOMER_INDUSTRIES
  - sports-ants/news/[id]/page.test.ts
- 验证: `pnpm turbo test --filter='@m5/tob-web'`

### 4. [P1] @m5/miniapp 测试4✖ (490/494 pass)
- 失败项:
  - 应处理积分不足时的限制
  - 应包含会员等级(tier)体系，至少3个等级
  - 应处理空任务列表
  - 应处理客户列表为空场景
- 验证: `pnpm turbo test --filter='@m5/miniapp'`

## 验收标准

1. ✅ @m5/app TSC: `tsc -p tsconfig.json --noEmit` 0 errors
2. ✅ @m5/storefront-web test: 所有测试通过
3. ✅ @m5/tob-web test: 1585/1585 pass
4. ✅ @m5/miniapp test: 494/494 pass
5. ✅ `pnpm turbo typecheck --filter='!@m5/api'` 全绿

## 截止时间

⚠️ **连续2次不符合→升级至人工介入**
