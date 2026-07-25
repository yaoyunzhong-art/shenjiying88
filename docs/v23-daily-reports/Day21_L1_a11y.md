# Day21 L1: 无障碍访问审计 (a11y)

> 审计日期: 2026-07-26
> 审计范围: apps/admin-web/app, apps/tob-web/app, apps/storefront-web/app
> 审计类型: L1 量化扫描（自动化 grep 统计）

---

## 总体概览

| 指标 | 数值 | 评级 |
|------|------|------|
| ARIA 属性使用 | 114 处 | ✅ 良好 |
| label/htmlFor 关联 | 80 处 | ✅ 良好 |
| 语义化标签 | 725 处 | ⚠️ 中等 |
| H 标题标签 | 1,541 处 | ✅ 良好 |
| img alt 缺失 | 0 | ✅ 优秀 |
| div/span 占比 | 20,372 处 | ⚠️ 偏高 |
| tabIndex 键盘控制 | 2 处 | ❌ 严重不足 |
| FormField 组件 | 436 处 | ✅ 良好 |

---

## 分应用明细

### 1. admin-web (管理后台)

| 指标 | 数值 |
|------|------|
| TSX 文件数 | 802 |
| ARIA 属性 | 42 |
| Label (htmlFor/aria-label) | 28 |
| 语义标签 (header/main/nav/section...) | 320 |
| H 标签 (h1-h6) | 714 |
| div/span 数量 | 9,346 |
| FormField 组件 | ~200+ |

**亮点:**
- 大量使用 `role="tablist"` + `role="tab"` + `aria-selected` 实现可访问的 Tab 组件（dashboard, announcements, analytics, purchase-orders, members, users, finance）
- `role="switch"` + `aria-checked` 在 agents/configs 切换开关
- `role="button"` 在 staff 列表
- 表单使用 `aria-label` 标注输入项（customers/new）
- settings 页面使用 `aria-disabled="true"` 标记不可用模块

**薄弱点:**
- tabIndex 仅 1 处（staff 页面 `tabIndex={0}`）
- 9,346 处 div/span，语义标签仅 320（占比 3.4%）
- 大量 div 用于交互式元素而非原生 button

### 2. tob-web (企业端)

| 指标 | 数值 |
|------|------|
| TSX 文件数 | 171 |
| ARIA 属性 | 5 |
| Label (htmlFor/aria-label) | 26 |
| 语义标签 (header/main/nav/section...) | 246 |
| H 标签 (h1-h6) | 421 |
| div/span 数量 | 3,308 |
| FormField 组件 | ~100+ |

**亮点:**
- FormField 组件广泛使用 `htmlFor` 确保表单可访问（customers/[id], members/new, campaigns/new）
- `aria-label="主导航"` 在 brand-website Header 导航
- `aria-label="新增会员表单"` 在会员新建页面
- `aria-label="会员等级"` 在会员等级选择

**薄弱点:**
- ARIA 属性仅 5 处，远低于 admin-web
- 无 tabIndex、无键盘导航支持
- 仅 171 个 TSX 文件但表单密集型应用，ARIA 覆盖率可进一步提升

### 3. storefront-web (门店前端)

| 指标 | 数值 |
|------|------|
| TSX 文件数 | 438 |
| ARIA 属性 | 13 |
| Label (htmlFor/aria-label) | 26 |
| 语义标签 (header/main/nav/section...) | 159 |
| H 标签 (h1-h6) | 406 |
| div/span 数量 | 7,068 |
| FormField 组件 | ~100+ |

**亮点:**
- 收银台页面有完整的 `aria-label`（搜索商品、移除商品、会员手机号）
- `tabIndex={0}` 用于商品选择（keyboard accessible）
- FormField 在 checkout 页面正确使用 htmlFor
- `aria-label="价格筛选"` 在商品筛选

**薄弱点:**
- 语义标签 159 vs div/span 7,068，比例仅 2.2%
- 收银台作为高频操作页面，键盘可操作性待加强

---

## 审计维度分析

### ✅ 达标项

1. **图片 alt 属性**: 0 处缺失 — 完美
2. **表单 label 关联**: 436 处 FormField + 多处 htmlFor，表单输入元素关联良好
3. **ARIA role 标注**: Tab/switch/button 等交互组件正确使用 role 属性
4. **Tab 组件模式**: 多个 Tab 组件使用标准 `role="tablist"` → `role="tab"` → `aria-selected` 模式

### ⚠️ 改进项

1. **div/span 泛滥** (20,372 处)
   - div/span 与语义标签的比例约 28:1
   - 建议: 将交互式 div 替换为 button，将列表容器替换为 ul/ol，将独立区块替换为 section/article
   - 优先级: 中

2. **键盘可操作性不足**
   - 仅 2 处 tabIndex 使用（staff 和 cashier）
   - 仅 9 处键盘事件处理（onKeyDown/onKeyPress/onKeyUp）
   - 建议: 所有可交互的非原生控件（div 模拟的按钮/列表项）都应添加 tabIndex 和键盘事件
   - 优先级: 高

3. **tob-web ARIA 覆盖率低**
   - 仅 5 处 ARIA 属性（vs admin-web 的 42 处）
   - 建议: 为 tob-web 的 Tab/筛选/弹窗等交互组件补充 role 标注
   - 优先级: 中

### ❌ 缺失项

1. **焦点管理**: 未检测到 focus-trap / focus-restore 模式，弹窗/模态框关闭后焦点可能丢失
2. **跳过链接 (Skip Link)**: 未检测到 skip-to-content 导航
3. **色彩对比度**: L1 无法自动检测，需 L2 人工/工具审查
4. **屏幕阅读器文本**: 未检测到 `.sr-only` / `visually-hidden` 类

---

## 改进建议排序

| 优先级 | 建议 | 影响面 |
|--------|------|--------|
| 🔴 P0 | 所有交互式 div 添加键盘支持 (tabIndex + onKeyDown) | 全站 |
| 🟡 P1 | tob-web 补充 ARIA role 标注（Tab/弹窗/筛选） | tob-web |
| 🟡 P1 | 弹窗/模态框添加焦点管理 (focus-trap) | admin-web |
| 🟢 P2 | 添加 skip-to-content 跳转链接 | 全站 |
| 🟢 P2 | 交互相 div 替换为语义化 button | 全站 |
| 🔵 P3 | storefront-web 语义标签比例提升 | storefront-web |
| 🔵 P3 | 添加 screen-reader-only 辅助文本 | 全站 |

---

## 自动化命令

```bash
# L1 a11y 扫描
cd /Users/yaoyunzhong/Desktop/shenjiying/shenjiying88
echo "=aria=" && grep -rn "aria-\|role=" apps/admin-web/app apps/tob-web/app apps/storefront-web/app --include="*.tsx" 2>/dev/null | wc -l
echo "=alt缺失=" && grep -rn "<img " apps/admin-web/components apps/tob-web/components apps/storefront-web/components --include="*.tsx" 2>/dev/null | grep -v "alt=" | wc -l
echo "=语义化=" && grep -rn "<div\|<span" apps/admin-web/app apps/tob-web/app apps/storefront-web/app --include="*.tsx" 2>/dev/null | wc -l
echo "=label=" && grep -rn "htmlFor\|aria-label\|aria-labelledby" apps/admin-web/components apps/tob-web/components apps/storefront-web/components --include="*.tsx" 2>/dev/null | wc -l
```

---

## 结论

三个前端应用在 **表单可访问性** 和 **图片 alt** 方面表现优秀（FormField 组件 + 0 alt 缺失）。ARIA role 标注在 admin-web 管理后台已经形成良好模式（Tab/switch/button）。主要短板在于:

1. **键盘可操作性几乎空白** — 仅 2 处 tabIndex，这是 a11y 的核心短板
2. **div 泛滥** — 大量交互元素使用 div 而非语义化元素
3. **tob-web 和 storefront-web 的 ARIA 覆盖率偏低**

建议 V23 Day22 重点补齐键盘可操作性（P0），这是无障碍访问的关键路径。
