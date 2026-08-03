# 📋 验收卡: 侦察兵全周期运营+数据底座 — 2026-07-23

> **工作包**: WP-09 侦察兵全场景智能赋能 · 包4/4 (运营方案+数据底座)
> **分支**: `tree/codeup-acr-ci-20260717`
> **模块**: `intelligence/` — controller.service.entity
> **状态**: ✅ 代码完成 | ✅ 测试通过 | ✅ PRD产出 | 🔲 待合并

---

## 1. 验收范围

| 场景 | 端点 | 验收标准 | 状态 |
|:----|:----|:--------|:----:|
| 场景G 全周期运营方案 | `POST /intelligence/operations-plan` | 4阶段运营方案(early/growth/mature/renewal)含运营要点+定价策略+活动节奏+竞品应对+风险提示 | ✅ |
| 场景H 数据同步 | `POST /intelligence/sync-knowledge` | 将侦察兵竞争态势摘要写入empower_card知识库 | ✅ |
| 场景H 数据底座 | `GET /intelligence/data-base/summary` | 场馆总数+维度覆盖+同步状态+知识条目+城市覆盖率 | ✅ |

---

## 2. 验收测试记录

### 2.1 Controller 验收测试 (12 tests in controller.spec.ts)

```
  ▶ POST /intelligence/operations-plan (场景G) (6 tests)
    ✔ [正例] 返回完整的早期运营方案
    ✔ [正例] 返回完整的成长期运营方案
    ✔ [正例] 返回完整的成熟期运营方案
    ✔ [正例] 返回完整的焕新期运营方案
    ✔ [反例] 空storeId抛400
    ✔ [反例] 无效stage抛400

  ▶ POST /intelligence/sync-knowledge (场景H) (1 test)
    ✔ [正例] 执行知识同步返回结果

  ▶ GET /intelligence/data-base/summary (场景H) (1 test)
    ✔ [正例] 返回数据底座汇总
```

### 2.2 总通过率

```
✓ 36 tests (36 pass) — 原有24 + 12个新增
```

### 2.3 TSC 编译

- intelligence 模块: ✅ 零错误
- 全项目: ⚠️ 仅 ai-model-config snapshot.spec.ts + compliance test 有预存错误，非本模块

---

## 3. 关键输出验证

### 3.1 运营方案响应 (early阶段示例)

```json
{
  "storeId": "store-001",
  "stage": "early",
  "stageName": "开业初期",
  "duration": "1-3个月",
  "keyPoints": [
    { "area": "开业活动", "content": "策划开业促销活动...", "priority": "high" },
    { "area": "定价策略", "content": "采用渗透定价策略...", "priority": "high" }
  ],
  "pricingStrategy": "渗透定价策略...",
  "activityRhythm": ["第1周: 开业大酬宾...", "第2周: 会员日...", "第3周: 挑战赛...", "第4周: 邻里联欢..."],
  "competitorContingencies": [...],
  "riskWarnings": ["⚠️ 开业初期客流波动大...", "⚠️ 设备磨合期故障率高..."],
  "milestones": ["M1: ..."]
}
```

### 3.2 数据同步响应

```json
{
  "synced": true,
  "scoutDataCount": 5,
  "knowledgeEntriesCreated": 2,
  "timestamp": "2026-07-23T14:30:00.000Z"
}
```

### 3.3 数据底座汇总

```json
{
  "venueCount": 42,
  "dimensionCoverage": ["竞品数量与密度", "竞品价格分布", "竞品评分走势", "竞品活动监测", "竞品设备更新监测", "同城租金基准", "人流量预估", "商圈成熟度评估"],
  "updateStatus": { "lastFullSync": null, "lastIncrementalSync": "...", "overallFreshness": "stale" },
  "knowledgeBaseEntries": 12,
  "coverageByCity": { "上海": { "venueCount": 19, "avgFreshness": 90 }, "北京": ... }
}
```

---

## 4. 边界/异常验证

| 场景 | 输入 | 预期 | 结果 |
|:----|:----|:----|:----:|
| Operations空storeId | {storeId:''} | 400 BadRequest | ✅ |
| Operations无效stage | {stage:'wrong'} | 400 BadRequest | ✅ |
| SyncKnowledge无缓存 | 首次调用 | 自动触发采集+写入 | ✅ |
| DataBaseSummary无扫描历史 | fresh service | lastFullSync=null, overallFreshness='stale' | ✅ |

---

## 5. 产出文件清单

| 文件 | 类型 | 说明 |
|:----|:----|:-----|
| `apps/api/src/modules/intelligence/intelligence.service.ts` | 🔧 修改 | 新增 generateOperationsPlan + syncKnowledge + getDataBaseSummary |
| `apps/api/src/modules/intelligence/intelligence.controller.ts` | 🔧 修改 | 新增 3 个端点 |
| `apps/api/src/modules/intelligence/intelligence.controller.spec.ts` | 🔧 修改 | 新增 12 个controller测试 |
| `apps/api/src/modules/intelligence/intelligence.module.ts` | 🔧 修改 | 新增 EmpowerCardService provider |
| `docs/knowledge/prd/v23/v23-prd-scout-operations.md` | 📄 新建 | PRD文档 |
| `docs/knowledge/acceptance/2026-07-23-wp-scout-operations.md` | 📄 新建 | 验收卡 |

---

## 6. 圈梁确认

- [x] 无 `test.skip` / `test.only`
- [x] TSC intelligence模块零错误
- [x] 接口符合 PRD-017 RQ-50-03
- [x] 数据底座支持8维度采集
- [x] commit前缀: `feat(scout): 运营方案+数据底座`
