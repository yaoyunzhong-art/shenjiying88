# 🧪 前端体验检查 · 2026-07-12 (周日)

> 生成: 10:30 · 独立运行 · 预算15min
> 扫描: 今日前端改动共 24 个组件文件

---

## 一、今日改动组件清单

### admin-web (11 个组件)
| 组件 | 行数 | 功能 |
|:-----|:----:|:-----|
| `admin/dashboard/page.tsx` | 616 | 全局分析仪表盘 |
| `admin/layout.tsx` | 197 | 后台侧边栏布局 |
| `admin/settings/page.tsx` | 878 | 系统全局设置 |
| `admin/tenants/page.tsx` | 501 | 租户配额管理 |
| `notifications/page.tsx` | 111 | 门店通知管理 |
| `promotions/new/page.tsx` | 240 | 新建促销活动 |
| `stock-operations/page.tsx` | 97 | 库存操作中心 |
| `stores/[id]/audit/page.tsx` | 98 | 门店审计日志 |
| `stores/[id]/purchasing/page.tsx` | 123 | 采购管理 |
| `stores/[id]/reconciliation/page.tsx` | 123 | 收银对账 |
| `stores/[id]/scheduling/page.tsx` | 183 | 排班管理 |

### storefront-web (9 个组件)
| 组件 | 行数 | 功能 |
|:-----|:----:|:-----|
| `appointments/page.tsx` | 718 | 场地预约 |
| `events/page.tsx` | 126 | 活动列表 |
| `events/[id]/page.tsx` | 170 | 活动详情 |
| `help/contact/page.tsx` | 870 | 客服联系/反馈 |
| `help/faq/page.tsx` | 530 | 常见问题 |
| `members/growth/page.tsx` | 155 | 成长值 |
| `members/loyalty/page.tsx` | 162 | 会员等级积分 |
| `members/payment/page.tsx` | 788 | 支付设置 |
| `products/setmeal/page.tsx` | 151 | 套餐中心 |

---

## 二、加载态 / 空态 / 错误态 覆盖

### ✅ 组件级覆盖较好

| 组件 | 加载态 | 空态 | 错误态 | 备注 |
|:-----|:------:|:----:|:------:|:-----|
| `admin/dashboard` | ❌ 无 | ⚠️ 无 | ❌ 无 | 纯 mock 数据，无 loading |
| `admin/layout` | ❌ 无 | — | ❌ 无 | 纯静态导航布局 |
| `admin/settings` | ❌ 无 | ⚠️ 无 | ❌ 无 | 全部 mock 数据 |
| `admin/tenants` | ❌ 无 | ⚠️ 无 | ❌ 无 | DataTable 自动处理空行 |
| `notifications` | ❌ 无 | ⚠️ 无 | ❌ 无 | DataTable 自动处理 |
| `promotions/new` | ❌ 无 | — | ⚠️ 好 | 提交错误有 toast |
| `stock-operations` | ❌ 无 | ⚠️ 无 | ❌ 无 | DataTable 空列表 |
| `stores/[id]/audit` | ❌ 无 | ⚠️ 无 | ⚠️ 无 | 有 StatCard 兜底 |
| `stores/[id]/purchasing` | ❌ 无 | ⚠️ 无 | ⚠️ 无 | 纯渲染列表 |
| `stores/[id]/reconciliation` | ❌ 无 | ⚠️ 无 | ⚠️ 无 | 纯渲染列表 |
| `stores/[id]/scheduling` | ❌ 无 | ⚠️ 无 | ⚠️ 无 | 纯渲染列表 |
| `appointments` | ❌ 无 | ⚠️ 无 | ❌ 无 | 全部 mock |
| `events` | ❌ 无 | ⚠️ 无 | ❌ 无 | 过滤结果为空时无提示 |
| `events/[id]` | ⚠️ 有 | ⚠️ 有 | ✅ 有 | 404 时显示 fallback |
| `help/contact` | ❌ 无 | ⚠️ 无 | ✅ 有 | 表单验证+提交错误 toast |
| `help/faq` | ❌ 无 | ✅ 有 | ❌ 无 | 空搜索有 emptyState |
| `members/growth` | ❌ 无 | — | ❌ 无 | 纯展示 |
| `members/loyalty` | ❌ 无 | ⚠️ 无 | ❌ 无 | DataTable 列表 |
| `members/payment` | ❌ 无 | ⚠️ 有 | ❌ 无 | 空交易记录有提示 |
| `products/setmeal` | ❌ 无 | ⚠️ 无 | ❌ 无 | 纯 mock |

### ⚠️ 问题发现

1. **加载态缺失 (全局)** — 所有组件全部使用同步 mock 数据，无一使用 `isLoading` 或 `LoadingSkeleton`。`packages/ui` 已导出 `LoadingSkeleton` / `Skeleton` / `EmptyState` / `ErrorBoundary` 等组件，但今日改动均未引用。
2. **空态覆盖不足** — 多数组件列表为空时仅 DataTable 显示空表(无定制说明)，`events` 页筛选结果为空无提示，`notifications` 页同。
3. **错误态基本缺失** — 仅 `events/[id]` 有 404 兜底 + `help/contact` 有表单验证 toast，其余无 API 错误处理。
4. **Mock 数据锁定** — 全部组件依赖同步 mock，无真实 API 调用链路 → 加载/空/错三态无机会暴露。

### 💡 建议
- 引入 `ErrorBoundary` 包裹所有页面组件
- 使用 `LoadingSkeleton` 或 `Skeleton` 提供骨架屏
- 对列表页加空态提示（`EmptyState` 组件已存在）
- 典型流程（预约/购买）需 mock loading 延迟以验证加载态

---

## 三、核心流程 ≤ 3 步 检查

| 流程 | 步数 | 详情 | 评估 |
|:-----|:----:|:-----|:----:|
| 🎯 **场地预约** (appointments) | 4 | 选日期→选场地→选时段→确认 | ⚠️ 可优化 |
| 🎯 **购买套餐** (setmeal) | 3 | 选套餐→点购买→弹窗提示 | ✅ 达标 |
| 🎯 **反馈提交** (contact) | 3 | 填表单→校验→提交成功 | ✅ 达标 |
| 🎯 **活动详情** (events/[id]) | 2 | 选活动→看详情 | ✅ 达标 |
| 🎯 **新建促销** (promotions/new) | 4 | 填活动名称→配类型→设范围→提交 | ⚠️ 可优化 |
| 🎯 **排班管理** (scheduling) | 2 | 选周→看排班 | ✅ 达标 |

### ⚠️ 优化建议
- **场地预约**: 可由 4 步(日期→场地→时段→确认)压缩为 3 步，合并日期选择和时段选择（日历内嵌时段）
- **新建促销**: 表单字段较多(8个)，建议分组分步或用侧边抽屉

---

## 四、移动端适配

### 现状

| 组件 | 适配方式 | 评估 |
|:-----|:---------|:----:|
| `admin/dashboard` | 纯 `grid` 布局，无响应式断点 | ❌ 未适配 |
| `admin/layout` | 纯 `flex`，固定侧边栏 220px，无伸缩 | ❌ 未适配 |
| `admin/notifications` | 纯 `grid` 无断点 | ❌ 未适配 |
| `admin/tenants` | 纯 `grid` 无断点 | ❌ 未适配 |
| `admin/promotions/new` | `grid-cols-1 lg:grid-cols-3` Tailwind | ✅ 有响应式 |
| `admin/stock-operations` | 纯 `grid` 无断点 | ❌ 未适配 |
| `admin/stores/[id]/audit` | `repeat(4,1fr)` 固定 4 列 | ❌ 未适配 |
| `admin/stores/[id]/purchasing` | `repeat(3,1fr)` 固定 3 列 | ❌ 未适配 |
| `admin/stores/[id]/reconciliation` | `repeat(4,1fr)` 固定 4 列 | ❌ 未适配 |
| `admin/stores/[id]/scheduling` | `repeat(4,1fr)` 固定 4 列 | ❌ 未适配 |
| `appointments` | 纯 inline styles，maxWidth 1100，无断点 | ❌ 未适配 |
| `events` | Tailwind `grid-cols-4`, 筛选按钮 `flex-wrap` | ⚠️ 部分适配 |
| `events/[id]` | Tailwind 基础 | ⚠️ 部分适配 |
| `faq` | 纯 inline styles | ❌ 未适配 |
| `contact` | 纯 inline styles | ❌ 未适配 |
| `growth` | `grid-cols-1 md:grid-cols-2` | ✅ 有响应式 |
| `loyalty` | `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` | ✅ 有响应式 |
| `payment` | 纯 inline styles | ❌ 未适配 |
| `setmeal` | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` | ✅ 有响应式 |

### ⚠️ 总结
- **admin-web 全局未适配**: layout 固定侧边栏 220px 在移动端不可用
- **storefront-web 仅 4/9 有响应式**: growth/loyalty/setmeal/events 有 Tailwind 响应式断点
- **常见模式**: 使用 inline `styles` 对象比 Tailwind 类更难做响应式适配

### 💡 建议
1. 管理后台: → header 侧边栏折叠到汉堡菜单（响应式 sidebar）
2. 统计卡片网格: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
3. 各 store 子页: 用 Tailwind 类替代硬编码 `repeat(N,1fr)`
4. 大页面(appointments/contact/faq): 关键路径先适配

---

## 五、状态总览

| 检查项 | 结果 | 状态 |
|:-------|:----:|:----:|
| 🔄 加载态覆盖 | 0/20 组件有加载态 | 🔴 缺失 |
| 📭 空态覆盖 | 3/20 组件有定制空态 | 🟡 不足 |
| ⚠️ 错误态覆盖 | 2/20 组件有错误处理 | 🔴 不足 |
| 👣 核心流程 ≤ 3 步 | 3/6 流程达标 | 🟡 部分达标 |
| 📱 移动端适配 | 5/20 组件有响应式 | 🟡 不足 |

### 🔴 高优先级
- 全局 `ErrorBoundary` 包裹（已有导出，未使用）
- admin layout 侧边栏响应式折叠
- 预约流程步数优化 (4→3)

### 🟡 中优先级
- 列表页空状态统一
- 套餐/统计卡片网格响应式
- 加入 LoadingSkeleton

---

## 六、Git 提交记录

本次检查为只读扫描，未修改代码。
