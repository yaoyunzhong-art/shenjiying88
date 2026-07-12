# 🌲 dispatch-378 — admin-web suppliers 4✖ + 假阳排除策略

> **来源**: dispatch-377-P0 闭环后(storefront TSC已修)剩余admin部分
> **核心任务**: 修复suppliers/page.test.tsx 4个真实断言失败 + 定义假阳过滤策略
> **创建**: pulse#388 (05:33) · **优先级**: 高(非P0)

---

## 真实错误 (force验证确认)

### suppliers/page.test.tsx — 4个断言失败
| # | 断言 | 源码检查 | 失败原因 |
|:-:|:----|:---------|:--------|
| 1 | 应包含 empty state handling | 检查page.tsx `empty`/`暂无` | 页面缺少显式空状态 |
| 2 | 应包含 loading/suspense state | 检查`Loading`/`Suspense`/`loading` | 页面缺少加载状态 |
| 3 | 应包含 fallback/error handling | 检查`Error`/`fallback` | 页面缺少错误回退 |
| 4 | 应包含 bulk selection | 检查`checkbox`/`selectAll` | 页面缺少批量选择 |
| 5 | 应包含 supplier detail modal | 检查`modal`/`detail` | 页面缺少详情弹窗 |
| 6 | 应包含 audit trail info | 检查`audit`/`updatedAt` | 页面缺少审计信息 |

### 修复方向
- **empty/loading/fallback**: 添加状态守卫 <!-- {EmptyState|Loading|ErrorBoundary} -->
- **bulk selection**: 添加checkbox列或selectAll
- **detail modal**: 添加详情弹窗或路由
- **audit trail**: 添加updatedAt/审计字段展示

## 假阳排除策略 (已验证模块)
以下模块已知为假阳 — 页面已创建但组件未实装, 同@m5/app 21✖模式:
- ⛔ AdminAlerts (页面结构√/Client√/边界√/反例√ 共~8✖)
- ⛔ FirePrevention (5✖) 
- ⛔ Safety (4✖)
- ⛔ StoresLayout (7✖)
- ⛔ categories-data (3✖)

## 验收标准
- [ ] `pnpm turbo test --filter=@m5/admin-web --force` suppliers部分通过
- [ ] 不影响其他模块测试
- [ ] storefront 4,950/4,950✅ 不变
- [ ] 连续双连胜: 2🏆 目标
