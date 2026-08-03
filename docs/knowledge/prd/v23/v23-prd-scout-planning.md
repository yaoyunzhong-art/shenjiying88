# 🗺️ PRD: 侦察兵选址评估+新店规划 — WP-09 SceneA+SceneB
> 日期: 2026-07-23 | 圈梁: 代码✅ 测试✅ PRD新建
> 分支: `tree/codeup-acr-ci-20260717`
> 优先级: P1
> 覆盖: intelligence 模块 — 选址评估增强(siting-assessment) + 新店规划(store-planning)
> 前依赖: intelligence 模块已有 (16 文件) — IntelligenceController, IntelligenceService, IntelligenceAiService, VenueDataService

---

## 1. 背景与目标

### 1.1 业务背景

shenjiying88 平台已在 intelligence 模块实现基础的可行性报告(`POST /intelligence/feasibility`)、财务全景(`POST /intelligence/finance-panorama`)等能力。为满足 V23 全场景智能赋能需求，需要：

1. **场景A**: 增强已有选址评估端点 (`GET /intelligence/siting-assessment`)，增加置信区间、风险因素、数据来源声明
2. **场景B**: 新建新店整体规划端点 (`POST /intelligence/store-planning`)，整合选址+财务+设备+装修+AI建议为完整报告

### 1.2 目标

| # | 场景 | 端点 | 核心产出 |
|:-:|:----|:----|:---------|
| RQ-49 | 科学选址评估 | `GET /intelligence/siting-assessment?city=&district=` | 可行性评分+置信区间+等级+竞争分析+风险因素+数据来源声明 |
| RQ-50 | 新店开张整体规划 | `POST /intelligence/store-planning` | 评分+竞争分析+财务+设备+装修+风险+AI建议 — 整合报告 |

### 1.3 范围

| BS | 名称 | 模块 | 状态 |
|:--:|:-----|:----|:----:|
| BS-0130a | 选址评估增强 — 置信区间+风险+数据来源 | intelligence.service | ✅ IMPLEMENTED |
| BS-0130b | 新店规划 — 整合选址+财务+设备+装修+AI建议 | intelligence.service | ✅ IMPLEMENTED |

---

## 2. 接口设计

### 2.1 场景A: 选址评估增强

```typescript
// GET /intelligence/siting-assessment?city=上海&district=徐汇

interface SitingAssessmentOutput {
  city: string                    // 城市
  district: string                // 区域
  overallScore: number            // 可行性评分 0-100
  confidenceInterval: {           // 置信区间 (基于样本量)
    low: number
    high: number
  }
  grade: '非常适合' | '可考虑' | '不建议'  // 等级
  competition: {                  // 竞争分析
    totalCompetitors: number
    districtDistribution: Record<string, number>
    avgTicketPrice: number
    densityLevel: '高' | '中' | '低'
  }
  riskFactors: SitingRiskFactor[] // 风险因素 (≥3项)
  financialEstimate: {            // 财务预估
    avgRent: number
    monthlyRevenue: number
    monthlyCost: number
    paybackMonths: number
  }
  suggestions: string[]           // 建议列表 (≥3条)
  dataSource: {                   // 数据来源声明
    disclaimer: string            // 免责声明
    freshness: string             // 数据新鲜度
    sourceType: string            // 来源类型
  }
}
```

### 2.2 场景B: 新店开张整体规划

```typescript
// POST /intelligence/store-planning
// Body: { city: string, district: string, budget: number, area: number, tier: 'economy'|'standard'|'deluxe'|'luxury' }

interface StorePlanningOutput {
  city: string
  district: string
  score: number                    // 选址可行性评分
  confidenceInterval: { low: number; high: number }
  grade: '非常适合' | '可考虑' | '不建议'
  competition: CompetitionAnalysis // 竞争分析 (同城竞品数/区域分布/客单价/密度等级/TOP5)
  financialOverview: FinancialOverview // 财务全景 (首期投入/月固定成本/月变动成本/月营收/月利润/回收期)
  equipmentSuggestions: EquipmentSuggestion[] // 设备建议 (6项 × 品牌/保修/维护费)
  renovationEstimate: {           // 装修预估
    baseRenovation: number
    themedDesign: number
    furnitureDecor: number
    fireSafetyApproval: number
    total: number
  }
  riskFactors: RiskFactorItem[]    // 风险因素 (选址+预算+回收期)
  aiSummary: string               // AI生成摘要
}
```

---

## 3. 模块架构

### 3.1 新增/修改文件清单

```
apps/api/src/modules/intelligence/
├── intelligence.entity.ts               (更新: SitingAssessmentOutput 增强)
├── intelligence.service.ts              (更新: 新增 sitingAssessment + storePlanning)
├── intelligence.controller.ts           (更新: 增强 GET /siting-assessment + 新增 POST /store-planning)
├── intelligence.controller.spec.ts      (更新: 新增 6+6 个 controller 测试)
├── intelligence.service.test.ts         (更新: 新增 6+6 个 service 测试)
```

### 3.2 数据流

```
用户请求
  │
  ├── GET /intelligence/siting-assessment
  │   └── IntelligenceController.sitingAssessment()
  │       └── IntelligenceService.sitingAssessment(city, district)
  │           ├── COMPETITOR_DENSITY 查找 → 竞品数/均价
  │           ├── 计算评分+置信区间 (样本量→margin)
  │           ├── 生成竞争分析+风险因素+建议
  │           └── 组装数据来源声明
  │
  └── POST /intelligence/store-planning
      └── IntelligenceController.storePlanning(body)
          └── IntelligenceService.storePlanning(input)
              ├── 复用 sitingAssessment() 获取选址评估
              ├── 复用 calculateFinancePanorama() 获取财务全景
              ├── 按 tier 因子生成设备建议
              ├── 按 tier 面积计算装修预估
              ├── 聚合风险因素 (选址+预算+回收期)
              └── 组装 AI 摘要
```

### 3.3 评分模型

| 维度 | 权重 | 计算方式 |
|:----|:----:|:---------|
| 竞品密度 | 60% | `(1 - min(count/10,1)*0.4)*60` |
| 基础分 | 40% | 25分保底 |
| 置信区间 | - | count ≤2: ±15, ≤5: ±10, >5: ±6 |

### 3.4 等级判定

| 评分区间 | 等级 |
|:--------:|:----:|
| ≥70 | 非常适合 |
| 45-69 | 可考虑 |
| <45 | 不建议 |

---

## 4. 测试设计

### 4.1 选址评估测试 (6 tests)

| # | 场景 | 断言 |
|:-:|:----|:-----|
| 1 | 已知城市完整输出 | score∈[0,100], confidenceInterval包score, competition>0, riskFactors≥3, suggestions≥3, dataSource完整 |
| 2 | grade与score一致 | 不同竞争密度城市各自有效 |
| 3 | 竞争密度高时densityLevel为高 | totalCompetitors≥6 → densityLevel='高' |
| 4 | 数据来源声明字段完整 | disclaimer/freshness/sourceType均非空 |
| 5 | 未知城市使用默认竞争数据 | count=1, price=60, densityLevel='低' |
| 6 | 多城市覆盖率12+ | 12个预设城市都能生成有效评估 |

### 4.2 新店规划测试 (6 tests)

| # | 场景 | 断言 |
|:-:|:----|:-----|
| 1 | 完整新店规划输出 | score/competition/financialOverview/equipment/renovation/risk/aiSummary均完整 |
| 2 | luxury档次装修费用更高 | luxury.renovationTotal > economy.renovationTotal |
| 3 | 设备数量随tier因子调整 | luxury设备数量 > economy设备数量 |
| 4 | 风险因素覆盖选址+预算+回收期 | 三个主题在riskFactors中存在 |
| 5 | AI摘要包含城市和评分 | summary包含city/district/score |
| 6 | 未知城市使用默认数据 | city保留, count=1, price=60 |

### 4.3 Controller测试 (6+6 tests)

| # | 场景 | 断言 |
|:-:|:----|:-----|
| 正例 | 选址评估返回完整结果 | overallScore≥0, confidenceInterval, grade, competition, riskFactors |
| 反例 | 空城市抛400 | status=400 |
| 反例 | 空区域抛400 | status=400 |
| 正例 | 新店规划返回完整报告 | score≥0, competition, financialOverview, equipment, renovation |
| 反例 | 空城市抛400 | status=400 |
| 反例 | 空区域抛400 | status=400 |
| 反例 | 面积≤0抛400 | status=400 |
| 反例 | 无效tier抛400 | status=400 |
| 正例 | economy档次可运行 | result正常 |

---

## 5. 圈梁状态

| 门禁 | 状态 |
|:----|:----:|
| TSC 零错误 (intelligence模块) | ✅ |
| 测试无 .skip/.only | ✅ |
| 测试通过数 (service: 47, controller: 28) | ✅ |
| PRD 文档新建 | ✅ |
| 验收卡新建 | ✅ |
| commit消息前缀 `feat(scout):` | 🔲 (待提交) |
