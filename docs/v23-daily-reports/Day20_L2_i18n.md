# Day20 L2: i18n / 国际化覆盖率审计

> 审计日期: 2026-07-26  
> 审计范围: `apps/admin-web/` `apps/tob-web/` `apps/storefront-web/`  
> 审计维度: 翻译文件、硬编码中文、i18n 框架、后端 API 覆盖

---

## 1. 整体结论

| 维度 | 状态 | 评语 |
|------|------|------|
| 翻译文件 (locales/*.json / i18n/*.json) | ❌ 无 | 3 个前端 app 均无 `.json` 翻译资源文件 |
| `next-intl` / `react-intl` / `i18next` 等库 | ❌ 未安装 | 任一前端 `package.json` 中无 i18n 库依赖 |
| 后端 i18n 模块 | ✅ 有 | `apps/api/src/modules/i18n/` — 8 个 API 端点 + Service + Entity |
| 前端 `t()` 翻译调用 | ⚠️ 仅 demo | 仅 `tob-web/app/i18n-demo/` 使用 `LocaleProvider`；admin / storefront 无 |
| 硬编码中文 (UI 文本) | 🔴 严重 | admin-web: ~29k 行、tob-web: ~15k 行、storefront-web: ~19k 行 |
| 硬编码中文覆盖率 | 🔴 81%–98% | 81.4%（admin）→ 98.2%（tob）→ 71.6%（storefront）生产 tsx 含中文 |

**总评: 🔴 国际化严重缺失。前端无 i18n 库、无翻译文件、几乎所有 UI 中文直接写死在组件中。仅 tob-web 有一个 demo 级 `LocaleProvider`。后端有完整的 i18n API 但前端未消费。**

---

## 2. 详细数据

### 2.1 翻译资源文件

```
find apps -name "*.json" -path "*/locales/*" -o -name "*.json" -path "*/i18n/*"
→ 0 个文件
```

无 `locales/zh-CN.json`、`locales/en-US.json` 等传统翻译资源文件。

### 2.2 i18n 库依赖

```
grep -rn "next-intl|react-intl|i18next|@formatjs|react-i18next|next-i18"
  apps/admin-web/package.json
  apps/tob-web/package.json
  apps/storefront-web/package.json
→ 无任何 i18n 依赖包
```

### 2.3 硬编码中文统计

| App | 生产 tsx 文件数 | 含中文的文件数 | 覆盖率 | 中文行（UI 文本） | 中文字符行总数 |
|-----|----------------|---------------|--------|-------------------|---------------|
| **admin-web** | 803 | 654 | **81.4%** | ~7,641 | ~95,124 |
| **tob-web** | 171 | 168 | **98.2%** | ~3,358 | ~45,743 |
| **storefront-web** | 384 | 275 | **71.6%** | ~5,910 | ~76,196 |
| **合计** | 1,358 | 1,097 | **80.8%** | ~16,909 | ~217,063 |

> 说明:  
> - "生产 tsx" = 排除 `*.test.tsx` / `*.spec.tsx` / `*.vitest.tsx` / e2e 文件  
> - "中文行（UI 文本）" = 非注释行中的中文字符串字面量（label/placeholder/error message 等）  
> - "中文字符行总数" = 所有含中文字符的行（含注释）

### 2.4 前端 `t()` 翻译函数使用

| App | `t()` 调用数 | 来源 |
|-----|-------------|------|
| admin-web | 0 | 无任何 i18n 集成 |
| tob-web | 2（仅 `useTranslation`） | 仅 `i18n-demo/page.tsx` |
| storefront-web | 0 | 无任何 i18n 集成 |

唯一的前端翻译基础设施是 `tob-web/components/locale-provider.tsx`，包含:
- 9 种 locale: `zh-CN`, `zh-TW`, `en-US`, `ja-JP`, `ko-KR`, `th-TH`, `vi-VN`, `id-ID`, `ms-MY`
- 内嵌翻译字典（~60 个 key，覆盖 common / member / order / points / coupon / payment / inventory / tournament）
- 仅被 `tob-web/app/i18n-demo/page.tsx` 使用

### 2.5 后端 i18n 模块

`apps/api/src/modules/i18n/` 包含:

```
i18n.controller.ts      — 8 个 API 端点
i18n.service.ts         — 翻译注册 / 插值 / Plural / Fallback
i18n.entity.ts          — TranslationEntry / LocaleConfig / TranslationNamespace
i18n.dto.ts             — CRUD DTO 定义
i18n.module.ts          — NestJS 模块注册
i18n-extract.ts         — 从源码提取 key 的功能
README.md               — 文档
```

API 端点:
| 方法 | 路径 | 功能 |
|------|------|------|
| POST | /i18n/translations | 创建翻译条目 |
| GET | /i18n/translations | 查询翻译列表 |
| PUT | /i18n/translations/:id | 更新翻译 |
| POST | /i18n/translations/bulk | 批量注册 |
| GET | /i18n/translations/extract | 从源码提取 key |
| GET | /i18n/locales | 列出区域配置 |
| GET | /i18n/validate | 校验翻译完整性 |
| POST | /i18n/validate | 校验并返回报告 |

后端支持 3 种 locale: `zh-CN` / `en-US` / `ja-JP`

> ⚠️ **前端 vs 后端不对称**: 后端支持 3 种语言，但 tob-web 的 LocaleProvider 支持 9 种。前端 demo 和后端正式模块之间的语言集合不一致。

### 2.6 硬编码中文 Top 文件

#### admin-web（Top 10）
| 行数 | 文件 |
|------|------|
| 965 | `members/[id]/sources/[kind]/[sourceId]/page.tsx` |
| 812 | `stores/[id]/inventory/page.tsx` |
| 778 | `members/page.tsx` |
| 770 | `admin/settings/page.tsx` |
| 767 | `agents/sessions/[id]/session-detail-client.tsx` |
| 747 | `finance/[id]/page.tsx` |
| 707 | `agents/studio/studio-client.tsx` |
| 632 | `members/levels/[id]/page.tsx` |
| 625 | `members/levels/page.tsx` |
| 624 | `members/import/page.tsx` |

#### tob-web（Top 10）
| 行数 | 文件 |
|------|------|
| 1,115 | `sports-ants/cases/page.tsx` |
| 1,072 | `sports-ants/page.tsx` |
| 1,034 | `sports-ants/products/page.tsx` |
| 979 | `sports-ants/franchise/page.tsx` |
| 873 | `sports-ants/epc/page.tsx` |
| 733 | `campaigns/[id]/page.tsx` |
| 667 | `sports-ants/console/page.tsx` |
| 639 | `sports-ants/resources/page.tsx` |
| 604 | `openapi-portal/page.tsx` |
| 585 | `sports-ants/help/page.tsx` |

#### storefront-web（Top 10）
| 行数 | 文件 |
|------|------|
| 890 | `members/loyalty/page.tsx` |
| 853 | `point-history/page.tsx` |
| 844 | `feedback/page.tsx` |
| 827 | `insights/page.tsx` |
| 818 | `maintenance/page.tsx` |
| 809 | `promotions/page.tsx` |
| 808 | `cashier/page.tsx` |
| 784 | `checkout/page.tsx` |
| 726 | `help/contact/page.tsx` |
| 708 | `members/payment/page.tsx` |

---

## 3. 硬编码中文示例

典型模式 — 中文直接写在 JSX label / placeholder / message 中:

```tsx
// apps/admin-web/app/customers/new/page.tsx
{ value: 'male', label: '男' },
{ value: 'female', label: '女' },
{ value: 'unknown', label: '未知' },

{ key: 'name', label: '客户姓名', type: 'text',
  validate: (v) => typeof v === 'string' && v.length < 2 ? '姓名至少2个字符' : null,
}

{ key: 'phone', label: '手机号', type: 'text',
  placeholder: '请输入11位手机号',
}

// apps/admin-web/app/members/page.tsx
{ key: 'code', title: '会员编号' },
{ key: 'name', title: '姓名' },
{ key: 'tier', title: '等级' },
{ key: 'status', title: '状态' },
{ key: 'points', title: '积分' },
{ key: 'totalSpent', title: '累计消费' },
{ key: 'storeName', title: '所属门店' },
{ key: 'visitCount', title: '到店次数' },
{ key: 'avgOrderValue', title: '客单价' },
{ key: 'lastVisitAt', title: '最近到店' },
```

---

## 4. 问题分类与改进建议

### 问题 A: 无 i18n 框架（严重度 🔴）
- **现状**: 所有前端 app 均未安装 i18n 库
- **建议**: 
  1. 选择 `next-intl`（Next.js 原生支持）或 `react-i18next` 作为统一方案
  2. 在每个 app 的 `package.json` 中添加依赖
  3. 创建 `locales/zh-CN.json` / `locales/en-US.json` / `locales/ja-JP.json`

### 问题 B: 80%+ 页面硬编码中文（严重度 🔴）
- **现状**: 1,097 / 1,358 个生产 tsx 文件直接使用中文字符串，~16,909 行 UI 中文
- **建议**: 
  1. 建立 `t()` 包装函数（参考已有的 `LocaleProvider`）
  2. 按模块分批迁移: common → member → order → product → payment
  3. 利用后端 `GET /i18n/translations/extract` 自动化提取 key

### 问题 C: 后端-前端语言集不一致（严重度 ⚠️）
- **现状**: 后端仅支持 3 种语言（zh-CN/en-US/ja-JP），tob-web demo 支持 9 种
- **建议**: 统一为后端 3 种核心语言 + 前端按需扩展（东南亚市场：th/vi/id/ms）

### 问题 D: 翻译资源散落（严重度 ⚠️）
- **现状**: 唯一翻译字典内嵌在 `locale-provider.tsx` 代码中（~60 个 key），无法热更新
- **建议**: 
  1. 将翻译资源迁移至 `locales/*.json` 文件
  2. 通过后端 API 动态加载翻译
  3. 支持 CDN 缓存 + 按需加载

### 问题 E: 管理员 / 运营工具无国际化（严重度 ⚠️）
- **现状**: admin-web 81.4% 的页面硬编码中文。管理后台通常对国际化要求不高
- **建议**: admin-web 可降级为仅 zh-CN。tob-web / storefront-web 必须支持多语言

---

## 5. 量化门禁

| 指标 | 当前值 | Day30 目标 | Day60 目标 |
|------|--------|-----------|-----------|
| i18n 库安装率 | 0/3 apps | 3/3 | 3/3 |
| 翻译资源文件数 | 0 | ≥ 3（每 app 1份） | ≥ 9（3 语言 × 3 app） |
| `t()` 包装调用数 | ~60 key（仅 demo） | ≥ 300 key | ≥ 1,000 key |
| 硬编码中文覆盖率 | 80.8% | ≤ 50% | ≤ 20% |
| storefront-web 硬编码覆盖率 | 71.6% | ≤ 40% | ≤ 15% |
| tob-web 硬编码覆盖率 | 98.2% | ≤ 60% | ≤ 25% |

---

## 6. 审计命令

```bash
# i18n 文件扫描
find apps -name "*.json" -path "*/locales/*" -o -name "*.json" -path "*/i18n/*"

# 硬编码中文统计（非测试文件）
for app in admin-web tob-web storefront-web; do
  echo "=== $app ==="
  echo "生产 tsx 文件: $(find apps/$app/app -name '*.tsx' | grep -v '\.test\.\|\.spec\|\.vitest\|e2e' | wc -l)"
  echo "含中文文件: $(grep -rl '[一-龥]' apps/$app/app --include='*.tsx' | grep -v '\.test\.\|\.spec\|\.vitest\|e2e' | wc -l)"
  echo "中文 UI 文本行: $(grep -rn '[一-龥]' apps/$app/app --include='*.tsx' | grep -v '\.test\|\.spec\|\.vitest\|e2e' | grep -v '^*.*[一-龥]' | grep -v '^.*//.*[一-龥]' | grep "'[^']*[一-龥][^']*'" | wc -l)"
done

# i18n 库检查
grep -rn "next-intl\|react-intl\|i18next" apps/*/package.json

# 翻译函数使用
grep -rn "useTranslation\|useI18n\|useLocale\|next-intl\|react-intl" apps/admin-web/app apps/tob-web/app apps/storefront-web/app --include="*.tsx" --include="*.ts" | grep -v test | grep -v spec | grep -v node_modules
```

---

*Day20 L2 审计完成 · 2026-07-26*
