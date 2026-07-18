# 🧪 前端体验检查 · 2026-07-18 10:30

**检查范围**: 今日修改的前端组件 (purchase-orders admin-web DataTable列表+搜索 + MOCK数据补充)
**检查人**: 🧪 cron前端检查
**预算**: 15min | ✅ 按时完成

---

## 1️⃣ 加载态 / 空态 / 错误态 覆盖

### 🔍 扫描文件: `apps/admin-web/app/purchase-orders/page.tsx` (今日功能提交)

| 维度 | 状态 | 说明 |
|------|:----:|------|
| **加载态(loading)** | ⚠️ 缺失 | 页面使用 `useMemo(() => MOCK_PURCHASE_ORDERS, [])` 静态数据，无异步请求，无 `<Skeleton>` / `loading` 状态 |
| **空态(empty)** | ✅ 有 | DataTable 的 `emptyText` 属性提供: `searchTerm ? '未找到匹配的采购单' : '暂无采购单数据'`，区分了搜索无结果 vs 整体无数据 |
| **错误态(error)** | ⚠️ 缺失 | 无 error boundary / try-catch / toast 错误反馈 |

**对比上一次(7/15)**: 上次采购管理页被评为 ❌ 缺 loading + error 态 (仅空态有)；本次依然保持空态覆盖，loading/error 仍为静态Mock而未补。

### 📊 评分矩阵

| 页面 | 加载态 | 空态 | 错误态 | 是否全面 |
|------|:---:|:---:|:---:|:---:|
| 🛒 采购单管理 (purchase-orders) | ⚠️ 缺失 | ✅ `emptyText` 双态 | ⚠️ 缺失 | ❌ 缺2项 |

---

## 2️⃣ 核心流程 ≤ 3 步

### 采购单管理 — 浏览 / 新建 / 查看详情

**今日变更前后对比**:

| 步骤 | 变更前 | 变更后 |
|------|--------|--------|
| 1. 查看列表 | ✅ 统计卡片 + DataTable | ✅ 统计卡片 + DataTable (新增 `flexWrap` + `minWidth` 移动端适配) |
| 2. 搜索/筛选 | ✅ 搜索 + 8个状态Tab | ✅ 搜索 + 8个状态Tab (包含 `partial_received` 等7状态 + 全部) |
| 3. 新建采购单 | ❌ 无新建入口 | ✅ **新增** `SubmitButton` → `/purchase-orders/form` |
| 4. 查看详情 | ⚠️ 占位 (setSelectedIds) | ✅ **新增** `router.push('/purchase-orders/${id}')` 跳转详情页 |
| 5. 分页 | ⚠️ 无 | ✅ **新增** 10/20/50 条分页 |

**核心流程**: 列表浏览(1步) → 搜索/筛选Tab切换(1步) → 新建/查看详情路由(1步) = **3步内完成业务目标** ✅

---

## 3️⃣ 移动端适配

| 维度 | 状态 | 细节 |
|------|:----:|------|
| **表格横向滚动** | ✅ 已内置 | DataTable 基础组件自带 `overflowX: 'auto'`，移动端表格可滑动 |
| **flexWrap 布局** | ✅ 今日新增 | 搜索栏 + ActionBar 区域新增 `flexWrap: 'wrap'`，`minWidth: 200` 防止搜索框过窄 |
| **统计卡片响应式** | ⚠️ 硬编码 | 6张统计卡片固定 `flex: 1 0 140px` + `minWidth: 100`，在 <480px 宽屏上会换行但不美观 |
| **Tab 过多溢出** | ⚠️ 8个Tab | 状态 Tab 有8个 + "全部"，移动端会严重水平溢出；未发现 Tab 水平滚动手势处理 |
| **触摸友好** | ⚠️ 未特殊优化 | 表格行点击无 padding 触控区放大，建议 `DataTable` 行内添加 min touch target |

**结论**: 基础响应式框架已有（DataTable 水平滚动 + 今日新增 `flexWrap`），但Tab溢出、触控区、统计卡片在窄屏上的排版仍需优化。

---

## 4️⃣ 其它扫描发现

### storefront-web 采购单页 (未变更)

对比 admin-web 与 storefront-web 的采购单页:

| 维度 | admin-web (今日变更) | storefront-web (上一次实现) |
|------|:-------------------:|:------------------------:|
| EmptyState 组件 | ❌ DataTable.emptyText | ✅ 使用 `<EmptyState>` 无数据展示 |
| 移动端 grid | ⚠️ flex wrap | ✅ `grid-template-columns: repeat(auto-fill, minmax(150px, 1fr))` |
| 新建按钮 | ✅ SubmitButton | ✅ `Link` + 内置按钮 |
| 分页 | ✅ 10/20/50 | ✅ 基础分页 |

### 数据层 `purchase-orders-data.ts`

- 完整 7 种状态枚举 (`draft` → `cancelled`) ✅
- 3 种紧急度 (`normal` / `urgent` / `emergency`) ✅
- 统计函数覆盖 12 个维度 ✅
- formatCurrency 支持万级格式化 ✅
- 15 条 Mock 数据覆盖各状态 + 中英文供应商名 ✅
- ⚠️ 一条 Mock 数据日期有误: `orderDate: '2025-06-25'` (PO-2026-0015) — 疑似粘贴错误

---

## ⚠️ 改进建议

1. **[P2] 接入 API 后补 loading/error 态**: 目前仍是静态 Mock，建议预留 `<Skeleton>` 占位
2. **[P3] 移动端 Tab 溢出**: 8个状态 Tab 在移动端超宽，建议 Tab 组件支持 `overflowX: auto` 滑动
3. **[P2] 统计卡片窄屏优化**: 建议使用 `grid auto-fill` 替代固定 flex-basis
4. **[P3] 数据修复**: `purchase-orders-data.ts` 中 PO-2026-0015 的 `orderDate` 疑似应为 `2026-06-25` 而非 `2025-06-25`

---

## 总结

- ✅ **核心功能**: 采购单列表/搜索/Tab筛选/统计看板/分页/新建/详情跳转 — 功能完整
- ✅ **核心流程**: 3 步内完成浏览→筛选→新建/查看
- ⚠️ **三态覆盖**: 空态合格，loading/error 待接入 API 后退补
- ⚠️ **移动端**: 基础响应式有但部分组件需窄屏优化
- ⚠️ **数据层**: 一条日期疑似笔误

**综合评分**: 7/10 (功能充实，体验细节待打磨)
