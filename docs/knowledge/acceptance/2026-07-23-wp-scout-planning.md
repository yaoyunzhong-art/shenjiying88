# 📋 验收卡: 侦察兵选址评估+新店规划 — 2026-07-23

> **工作包**: WP-09 侦察兵全场景智能赋能 · 包1/4 (选址+新店规划)
> **分支**: `tree/codeup-acr-ci-20260717`
> **模块**: `intelligence/` — controller.service.entity
> **状态**: ✅ 代码完成 | ✅ 测试通过 | ✅ PRD产出 | 🔲 待合并

---

## 1. 验收范围

| 场景 | 端点 | 验收标准 | 状态 |
|:----|:----|:--------|:----:|
| 场景A 选址评估增强 | `GET /intelligence/siting-assessment` | 可行性评分+置信区间+等级+竞争分析+风险因素+数据来源声明 | ✅ |
| 场景B 新店开张规划 | `POST /intelligence/store-planning` | 评分+竞争分析+财务+设备+装修+风险+AI建议 — 完整报告 | ✅ |

---

## 2. 验收测试记录

### 2.1 IntelligenceService → sitingAssessment (6 tests)

```
  ▶ sitingAssessment (6 tests)
    ✔ 正例: 已知城市完整输出
    ✔ 正例: grade与score一致
    ✔ 正例: 竞争密度高时densityLevel为高
    ✔ 正例: 数据来源声明字段完整
    ✔ 边界: 未知城市使用默认竞争数据
    ✔ 正例: 多城市覆盖率12+
  ✔ sitingAssessment (6 tests) (0.54ms)
```

### 2.2 IntelligenceService → storePlanning (6 tests)

```
  ▶ storePlanning (6 tests)
    ✔ 正例: 完整新店规划输出
    ✔ 正例: luxury档次装修费用更高
    ✔ 正例: 设备数量随tier因子调整
    ✔ 正例: 风险因素包含选址+预算+回收期
    ✔ 正例: AI摘要包含城市和评分
    ✔ 边界: 未知城市使用默认数据
  ✔ storePlanning (6 tests) (0.63ms)
```

### 2.3 Base tests retention (35 tests)

```
  ✔ (原有35 tests全部保留通过)
```

### 2.4 Controller tests (28 tests)

```
  ✔ 28 tests (含6个新选址+6个新规划+16个原有) 全部通过
```

### 2.5 TSC 编译

- intelligence 模块: ✅ 零错误
- 全项目: ⚠️ 仅 ai-model-config snapshot.spec.ts 有预存错误，非本模块

---

## 3. 关键输出验证

### 3.1 选址评估响应结构

```json
{
  "city": "上海",
  "district": "徐汇",
  "overallScore": 73,
  "confidenceInterval": { "low": 63, "high": 83 },
  "grade": "非常适合",
  "competition": {
    "totalCompetitors": 8,
    "districtDistribution": { "徐汇": 8 },
    "avgTicketPrice": 128,
    "densityLevel": "高"
  },
  "riskFactors": [
    { "factor": "同城竞品密度", "level": "high", "suggestion": "建议差异化定位，避开头部竞品主力项目" },
    { "factor": "商圈租金水平", "level": "high", "suggestion": "¥280/㎡的租金偏高，需确保日均客流达标" },
    { "factor": "竞品客单价", "level": "low", "suggestion": "客单价适中，利于走量经营" }
  ],
  "financialEstimate": { "avgRent": 280, "monthlyRevenue": 192000, "monthlyCost": 144000, "paybackMonths": 24 },
  "suggestions": ["竞品密集区建议差异化定位", "租金偏高，建议评估日客流", "建议实地考察人流量", "优先选择商场位置", "该区域适合投资"],
  "dataSource": {
    "disclaimer": "本评估基于侦察兵同城竞品公开信息及行业基准数据，仅供参考，不构成投资建议。实际经营效果受多方因素影响。",
    "freshness": "数据更新于最近一次同城扫描",
    "sourceType": "侦察兵竞品数据库 + 行业基准"
  }
}
```

### 3.2 新店规划响应结构 (关键字段)

```json
{
  "city": "上海",
  "district": "徐汇",
  "score": 73,
  "grade": "非常适合",
  "competition": { "totalCompetitors": 8, "densityLevel": "高", "topCompetitors": ["上海竞品1", ...] },
  "financialOverview": {
    "initialInvestment": { "equipment": 1350000, "renovation": 480000, "total": 2286000 },
    "monthlyFixedCost": { "rent": 112000, "labor": 96000, "total": 223450 },
    "monthlyVariableCost": { "total": 22400 },
    "estimatedMonthlyRevenue": 192000,
    "paybackMonths": 999
  },
  "equipmentSuggestions": [
    { "name": "街机射击区", "count": 8, "supplier": "华立科技", "warrantyMonths": 12 },
    { "name": "VR体验区", "count": 4, "supplier": "Pico", "warrantyMonths": 24 },
    ...

  ],
  "renovationEstimate": { "baseRenovation": 240000, "themedDesign": 96000, "furnitureDecor": 96000, "fireSafetyApproval": 48000, "total": 480000 },
  "riskFactors": [
    { "factor": "同城竞品密度", "level": "high", ... },
    { "factor": "装修档次与预算匹配", "level": "medium", ... },
    { "factor": "回收期风险", "level": "medium", ... }
  ],
  "aiSummary": "上海徐汇选址评估73分(非常适合)。\n该区域有8家竞品，人均消费约¥128，竞争高。\n标准档装修400㎡，总投资约¥229万..."
}
```

---

## 4. 边界/异常验证

| 场景 | 输入 | 预期 | 结果 |
|:----|:----|:----|:----:|
| 未知城市选址 | ?city=foo&district=bar | 默认竞品数据(count=1,price=60)，正常输出 | ✅ |
| 未知城市新店规划 | body: city=foo,district=bar | 保留输入城市名，count=1，正常输出 | ✅ |
| 空城市选址 | ?city=&district=天河 | 400 BadRequest | ✅ |
| 空城市新店规划 | body: city="" | 400 BadRequest | ✅ |
| 面积≤0 | area=0 | 400 BadRequest | ✅ |
| 无效tier | tier="premium" | 400 BadRequest | ✅ |
| 空区域 | district="" | 400 BadRequest | ✅ |

---

## 5. 产出文件清单

| 文件 | 类型 | 说明 |
|:----|:----|:-----|
| `apps/api/src/modules/intelligence/intelligence.entity.ts` | 🔧 修改 | SitingAssessmentOutput 增强(加confidenceInterval/riskFactors/dataSource) |
| `apps/api/src/modules/intelligence/intelligence.service.ts` | 🔧 修改 | 新增 sitingAssessment() + storePlanning() |
| `apps/api/src/modules/intelligence/intelligence.controller.ts` | 🔧 修改 | GET /siting-assessment 增强 + POST /store-planning 新增 |
| `apps/api/src/modules/intelligence/intelligence.controller.spec.ts` | 🔧 修改 | 12个新controller测试(6选址+6规划) |
| `apps/api/src/modules/intelligence/intelligence.service.test.ts` | 🔧 修改 | 12个新service测试(6选址+6规划) |
| `docs/knowledge/prd/v23/v23-prd-scout-planning.md` | 📄 新建 | PRD文档 |
| `docs/knowledge/acceptance/2026-07-23-wp-scout-planning.md` | 📄 新建 | 验收卡 |

---

## 6. 圈梁确认

- [x] 无 `test.skip` / `test.only` → 47+28=75个test全部pass
- [x] TSC intelligence模块零错误
- [x] 接口符合 PRD-017 RQ-49/RQ-50
- [x] 数据免责声明: "本评估基于侦察兵同城竞品公开信息及行业基准数据，仅供参考，不构成投资建议"
- [x] commit前缀: `feat(scout): 选址评估+新店规划`
