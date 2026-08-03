# 竞品跟踪 — Competitor Track

## 用途概述

竞品跟踪看板是 Admin Web 后台的市场分析模块，面向 **运营团队** 和 **市场决策者**，提供品牌竞品的监控看板，覆盖评分、价格区间、抖音热度等多维度分析，辅助市场竞争策略制定。

**角色视角:** 📊 运营主管 / 📈 市场分析师  
**权限控制:** `competitor-track:read`

## 文件结构

```
competitor-track/
├── page.tsx              # 竞品跟踪看板（列表/筛选/详情弹窗/统计卡片/分页）
├── page.test.tsx         # L1 源码分析测试（结构/数据完整性/辅助函数）
├── error.tsx             # 错误边界组件
├── loading.tsx           # 加载态骨架屏
└── not-found.tsx         # 404 页面
```

## 核心数据模型

### CompetitorRecord

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 竞品 ID |
| `name` | `string` | 品牌名称 |
| `city` | `string` | 所属城市 |
| `score` | `number` | 综合评分（0.0–5.0） |
| `priceMin` / `priceMax` | `number` | 价格区间（元） |
| `douyinHeat` | `number` | 抖音热度指数（0–100） |
| `category` | `string` | 品类（如咖啡茶饮） |
| `description` | `string` | 简短描述 |
| `brandIntro` | `string` | 品牌详细介绍 |
| `storeCount` | `number` | 门店总数 |
| `mainDistricts` | `string[]` | 主要分布区域 |
| `heatTrend` | `'up' \| 'stable' \| 'down'` | 热度趋势 |
| `createdAt` | `string` | 创建时间 |

### 评分等级

| 等级 | 范围 | 颜色 |
|------|------|------|
| `high` | ≥ 4.0 | 🟢 绿色 |
| `medium` | 3.0–3.9 | 🟡 橙色 |
| `low` | < 3.0 | 🔴 红色 |

### 热度判定

| 范围 | 标签 |
|------|------|
| ≥ 80 | 🔥 高热 |
| 50–79 | 🔥 中热 |
| < 50 | ❄️ 低热 |

## 核心功能

### 统计卡片

- **跟踪竞品：** 品牌总数
- **覆盖城市：** 城市去重计数
- **高评分：** 评分 ≥ 4.0 的品牌数
- **抖音高热：** 热度 ≥ 80 的品牌数

### 筛选与搜索

- 关键词搜索（品牌名称/城市/品类/描述）
- 城市下拉筛选（北京/上海/广州/深圳 等 10 城）
- 评分等级筛选（高/中/低）
- 搜索结果为空时展示空态提示 + 一键清除筛选

### 竞品列表

| 列 | 展示 |
|----|------|
| 品牌名称 | 加粗文字 |
| 城市 | 标签样式 |
| 综合评分 | 颜色分级（绿/橙/红） |
| 价格区间 | ¥min ~ ¥max |
| 抖音热度 | 进度条 + 数值（渐变色） |
| 趋势 | 📈📉➡️ 带颜色 |
| 操作 | 「查看详情」按钮 |

### 详情弹窗 `CompetitorDetailModal`

- 品牌名称 + 描述
- 基本信息网格（城市、品类、评分、价格、热度、趋势、门店数、主要区域）
- 品牌介绍区域

### 三态处理

- **加载态：** 旋转图标 + "正在加载竞品数据..."
- **错误态：** ⚠️ 错误信息 + 重试按钮
- **空态：** 🔍 "暂无匹配的竞品数据" + 清除筛选

### 分页

每页 5 条，支持上下翻页 + 页码直接跳转 + 超过 5 页折叠。

## 使用示例

### 示例 1：排序获取高评分竞品

```typescript
import { filterCompetitors, DEFAULT_COMPETITORS, formatPrice, TREND_LABEL } from './page'

// 筛选北京地区高评分竞品
const beijingHigh = filterCompetitors(DEFAULT_COMPETITORS, '', '北京', 'high')
// → [瑞幸咖啡(4.3), 星巴克(4.1)]

// 获取格式化价格
beijingHigh.forEach(c => {
  console.log(`${c.name} | ${formatPrice(c.priceMin, c.priceMax)} | ${TREND_LABEL[c.heatTrend]}`)
  // → "瑞幸咖啡 | ¥9 ~ ¥35 | 📈 上升"
  // → "星巴克 | ¥30 ~ ¥60 | ➡️ 平稳"
})
```

### 示例 2：集成到 Admin Web 路由

```tsx
// 在 app/competitor-track/page.tsx 中已作为默认导出
// 只需在路由文件中引入：

// app/competitor-track/page.tsx
import CompetitorTrackPage from './page'

export default function Page() {
  return <CompetitorTrackPage />
}

// 页面通过 AdminPermissionGate 自动拦截无权限访问
// requiredPermission: 'competitor-track:read'
```

## 依赖关系

```
competitor-track/
├── AdminPermissionGate  — 管理员权限栅栏（requiredPermission: competitor-track:read）
└── (纯前端组件，无后端 API 依赖，使用客户端 Mock 数据)
```

## 测试命令

```bash
# 在 apps/admin-web 目录下执行

# 运行竞品跟踪模块测试
node --import tsx --import ./.test-setup.mjs --test app/competitor-track/page.test.tsx

# 运行全部 admin-web 测试
pnpm test

# 使用 Vitest（如已配置）
npx vitest run app/competitor-track/
```

## 种子数据

当前内置 10 条竞品 Mock 数据，涵盖主流茶饮/咖啡品牌：

| 品牌 | 城市 | 评分 | 热度 | 趋势 |
|------|------|------|------|------|
| 瑞幸咖啡 | 北京 | 4.3 | 92 | 📈 |
| 星巴克 | 北京 | 4.1 | 85 | ➡️ |
| Manner Coffee | 上海 | 4.5 | 78 | 📈 |
| 霸王茶姬 | 广州 | 4.2 | 90 | 📈 |
| 蜜雪冰城 | 郑州 | 3.8 | 95 | 📈 |
| 喜茶 | 深圳 | 4.4 | 82 | ➡️ |
| 奈雪的茶 | 深圳 | 4.0 | 70 | 📉 |
| 幸运咖 | 成都 | 3.9 | 65 | 📈 |
| 一点点 | 杭州 | 3.5 | 55 | 📉 |
| 库迪咖啡 | 武汉 | 3.7 | 88 | 📈 |

## 维护者

- **维护者:** Admin Web 前端团队
- **最后修改:** 2026-07-26

## 交叉引用

- [Admin Web 入口](../../README.md) — Admin Web 应用文档
- [AdminPermissionGate](../components/admin-permission-gate.tsx) — 权限栅栏组件
- [Announcements 模块](../announcements/README.md) — 公告管理（同角色体系）
