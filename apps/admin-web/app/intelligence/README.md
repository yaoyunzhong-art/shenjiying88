# 情报/智能分析 — Intelligence

基于侦察兵全国竞品数据库的 AI 运营决策系统，包含竞品情报监控、市场趋势分析、开业可行性评估及智能运营策略建议等模块，辅助门店科学经营决策。

## 目录结构

```
intelligence/
├── page.tsx                   # 运营参谋主页 — KPI 总览与模块导航
├── loading.tsx                # 主页加载骨架屏
├── page.test.tsx              # 主页单元测试
│
├── monitor/
│   ├── page.tsx               # 竞品动态监控页 — 实时竞品告警与趋势
│   ├── loading.tsx            # 监控页加载骨架屏
│   └── page.test.tsx          # 监控页测试
│
├── feasibility/
│   ├── page.tsx               # 开业可行性报告 — 选址评估与财务全景分析
│   ├── loading.tsx            # 可行性页加载骨架屏
│   └── page.test.tsx          # 可行性页测试
│
└── operations/
    ├── page.tsx               # 运营策略建议 — AI 运营决策咨询
    ├── loading.tsx            # 策略页加载骨架屏
    └── page.test.tsx          # 策略页测试
```

## 核心功能

### 运营参谋主页 — `intelligence/`

| 功能 | 说明 |
|------|------|
| **KPI 总览** | 展示监控城市数、告警数（含高级别）、运营建议数、知识卡片数、最后扫描时间 |
| **快捷导航** | 跳转到监控中心、可行性分析、运营策略三个子模块 |
| **数据刷新** | 手动刷新 `/api/intelligence/monitor/summary` 数据 |
| **降级展示** | API 不可用时展示默认 KPI 数据并提示用户 |

### 竞品动态监控 — `intelligence/monitor/`

| 功能 | 说明 |
|------|------|
| **实时告警列表** | 采集竞品价格调整、新活动、评分变化、设备异动、政策变更等 6 类告警 |
| **告警过滤** | 按类型（price_change / new_activity / new_promotion 等）和严重级别（high / medium / low）筛选 |
| **告警详情展开** | 点击单条告警展开查看描述、检测时间与推荐操作 |
| **趋势图** | 各类型告警数量按时间分布趋势（TrendPoint[]） |
| **自动刷新** | 每 30 秒自动轮询 `GET /api/v1/intelligence/monitor/summary` |
| **去重管理** | 已去重告警自动排到列表末尾 |
| **降级模式** | API 不可用时生成 Mock 数据展示 |

### 开业可行性报告 — `intelligence/feasibility/`

| 功能 | 说明 |
|------|------|
| **选址评估** | 选择城市 + 区域 + 预算，生成 AI 可行性评分与报告 |
| **评分体系** | 基于竞品密度、平均价格、市场趋势综合评分（高/中/低三档） |
| **设备推荐** | 推荐设备列表（含成本、数量、推荐理由） |
| **定价建议** | 建议价格区间（min / max / avg） |
| **风险分析** | 风险因子列表（含风险等级与应对建议） |
| **财务全景** | 初始投资、月固定成本、月变动成本、收入预估、回本周期、折旧摊销 |
| **城市对标** | 与同城均值对比（初始投资/月固定成本/月收入/回本周期） |
| **降级模式** | API 不可用时基于输入参数模拟报告数据 |

### 运营策略建议 — `intelligence/operations/`

| 功能 | 说明 |
|------|------|
| **AI 运营咨询** | 7 大分类运营问题查询：定价策略、活动方案、设备更新、促销应对、联名/IP 跨界、假期限定、盲盒合规 |
| **多方案对比** | 每个问题提供 3 个可选方案，展示优/缺点与预估效果 |
| **数据证据** | 每个方案附带同城竞品决策数据（dataEvidence） |
| **历史案例** | 按年份查看过往相似运营活动效果数据 |
| **城市选择** | 支持主流城市（上海/北京/广州/深圳/成都/杭州/南京）及区域细化 |

## 使用指引

1. **运营参谋主页** — 访问 `/intelligence`，快速了解整体运营态势
2. **竞品监控** — 访问 `/intelligence/monitor`，实时跟踪竞品异动，可按类型/级别过滤
3. **开业评估** — 访问 `/intelligence/feasibility`，输入城市+区域+预算+面积，生成选址可行性报告与财务全景
4. **策略咨询** — 访问 `/intelligence/operations`，选择城市后按分类获取 AI 运营建议与方案对比

## 相关依赖

| 包 | 来源 | 用途 |
|----|------|------|
| `next/link` | 外部 | 子页面间路由导航 |
| `react` / `next` | 外部 | 框架（`useState` / `useCallback` / `useMemo` / `useEffect`） |
| `/api/intelligence/monitor/summary` | 后端 API | 竞品监控汇总数据 |
| `/api/intelligence/feasibility` | 后端 API | 可行性报告数据 |
| `/api/intelligence/finance-panorama` | 后端 API | 财务全景数据 |
| `NEXT_PUBLIC_API_BASE` | 环境变量 | 监控 API 基础地址（默认 `http://localhost:3001/api/v1`） |

### 数据结构

| 类型 | 所在模块 | 说明 |
|------|----------|------|
| `KpiData` | `page.tsx` | KPI 总览（监控城市/告警数/建议数/知识卡片） |
| `Alert` | `monitor/page.tsx` | 竞品告警记录 |
| `TrendPoint` | `monitor/page.tsx` | 告警趋势数据点 |
| `FeasibilityReport` | `feasibility/page.tsx` | 可行性报告 |
| `FinancePanorama` | `feasibility/page.tsx` | 财务全景数据 |
| `AdviceQuestion` / `ChoiceOption` | `operations/page.tsx` | 运营咨询问题与选项 |
| `HistoricalCase` | `operations/page.tsx` | 历史运营案例 |
