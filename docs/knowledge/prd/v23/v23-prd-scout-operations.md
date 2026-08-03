# 🗺️ PRD: 侦察兵全周期运营+数据底座 — WP-09 SceneG+SceneH
> 日期: 2026-07-23 | 圈梁: 代码✅ 测试✅ PRD新建
> 分支: `tree/codeup-acr-ci-20260717`
> 优先级: P1
> 覆盖: intelligence 模块 — 全周期运营方案(operations-plan) + 数据底座整合(sync-knowledge/data-base/summary)
> 前依赖: intelligence 模块完整 + empower_card 模块完整

---

## 1. 背景与目标

### 1.1 业务背景

V23 侦察兵全场景赋能包4/4，覆盖门店开业后全周期运营管理方案和侦察兵数据底座整合能力。

### 1.2 目标

| # | 场景 | 端点 | 核心产出 |
|:-:|:----|:----|:---------|
| RQ-50-03 | 全周期运营方案 | `POST /intelligence/operations-plan` | 4阶段运营方案（早期/成长期/成熟期/焕新期），含运营要点+定价策略+活动节奏+竞品应对+风险提示 |
| BS-0134 | 数据同步 | `POST /intelligence/sync-knowledge` | 将侦察兵采集的竞争态势写入empower_card知识库 |
| BS-0135 | 数据底座 | `GET /intelligence/data-base/summary` | 场馆总数/采集维度/知识条目/城市覆盖率 |

### 1.3 范围

| BS | 名称 | 模块 | 状态 |
|:--:|:-----|:----|:----:|
| BS-0134 | 侦察兵数据→知识库同步 | intelligence.service + empower-card | ✅ IMPLEMENTED |
| BS-0135 | 数据底座概要 | intelligence.service | ✅ IMPLEMENTED |
| RQ-50-03 | 全周期运营方案4阶段 | intelligence.service | ✅ IMPLEMENTED |

---

## 2. 接口设计

### 2.1 场景G: 全周期运营方案

```typescript
// POST /intelligence/operations-plan
// Body: { storeId: string, stage: 'early'|'growth'|'mature'|'renewal' }

interface OperationsPlanOutput {
  storeId: string
  stage: 'early' | 'growth' | 'mature' | 'renewal'
  stageName: string           // 开业初期/快速成长期/成熟运营期/转型升级焕新期
  duration: string            // 1-3个月/3-12个月/1-3年/3年以上
  keyPoints: StageOperationKeyPoint[]  // 运营要点列表(≥8项)
  pricingStrategy: string               // 价格策略建议
  activityRhythm: string[]              // 活动节奏表(≥4项)
  competitorContingencies: CompetitorContingency[] // 竞品应对预案(≥3项)
  riskWarnings: string[]                // 风险提示(≥4项)
  milestones: string[]                  // 里程碑(≥3项)
}
```

#### 各阶段详情

| 阶段 | 时间 | 核心关注点 |
|:----|:----|:--------|
| 开业初期(early) | 1-3个月 | 开业活动/渗透定价/设备调试/团队培训 |
| 快速成长期(growth) | 3-12个月 | 营销节奏/会员拉新/竞品应对/数据分析 |
| 成熟运营期(mature) | 1-3年 | 设备更新/会员深耕/活动升级/降本增效 |
| 焕新期(renewal) | 3年以上 | 重新装修/设备换代/品牌升级/模式创新 |

### 2.2 场景H: 数据底座

```typescript
// POST /intelligence/sync-knowledge
// 触发侦察兵数据→知识库同步

interface SyncKnowledgeResult {
  synced: boolean
  scoutDataCount: number
  knowledgeEntriesCreated: number
  timestamp: string
}

// GET /intelligence/data-base/summary

interface DataBaseSummary {
  venueCount: number              // 覆盖门店总数
  dimensionCoverage: string[]      // 覆盖的数据维度
  updateStatus: {                  // 同步状态
    lastFullSync: string | null
    lastIncrementalSync: string
    overallFreshness: 'fresh' | 'stale' | 'outdated'
  }
  knowledgeBaseEntries: number     // 知识库条目数
  coverageByCity: Record<string, { venueCount: number; avgFreshness: number }>
}
```

---

## 3. 模块架构

### 3.1 修改文件清单

```
apps/api/src/modules/intelligence/
├── intelligence.entity.ts               (已有: OperationsPlanInput/Output, DataBaseSummary, SyncKnowledgeResult)
├── intelligence.service.ts              (更新: 新增 generateOperationsPlan + syncKnowledge + getDataBaseSummary)
├── intelligence.controller.ts           (更新: 新增 3 个端点)
├── intelligence.controller.spec.ts      (更新: 新增 12 个测试)
├── intelligence.module.ts               (更新: 注册 EmpowerCardService)
```

### 3.2 数据流

```
POST /intelligence/operations-plan
  → IntelligenceController.operationsPlan(body)
    → IntelligenceService.generateOperationsPlan(input)
      → getStageData(stage) → buildEarlyStage() / buildGrowthStage() / ...

POST /intelligence/sync-knowledge
  → IntelligenceController.syncKnowledge()
    → IntelligenceService.syncKnowledge()
      → MonitorCollectorService.incrementalScan()  // 采集侦察兵数据
      → EmpowerCardService.create()                // 写入知识库

GET /intelligence/data-base/summary
  → IntelligenceController.dataBaseSummary()
    → IntelligenceService.getDataBaseSummary()
      → COMPETITOR_DENSITY 统计 + lastScanResult + empowerCardService.list()
```

---

## 4. 测试设计

### 4.1 Controller 测试 (12 tests)

| # | 场景 | 断言 |
|:-:|:----|:-----|
| 1 | 早期方案完整输出 | storeId/stage/stageName/duration 正确，keyPoints≥4，activityRhythm≥4 |
| 2 | 成长期阶段名正确 | stageName='快速成长期', duration='3-12个月' |
| 3 | 成熟期阶段名正确 | stageName='成熟运营期' |
| 4 | 焕新期方案完整 | pricingStrategy长度>10 |
| 5 | 空storeId抛400 | status=400 |
| 6 | 无效stage抛400 | status=400 |
| 7 | syncKnowledge返回结果 | synced=true, scoutDataCount≥0 |
| 8 | dataBaseSummary返回 | venueCount≥0, dimensionCoverage≥4 |

---

## 5. 圈梁状态

| 门禁 | 状态 |
|:----|:----:|
| TSC 零错误 (intelligence模块) | ✅ |
| 测试无 .skip/.only | ✅ |
| Controller测试通过数 | ✅ 36/36 |
| PRD 文档新建 | ✅ |
| 验收卡新建 | ✅ |
| commit消息前缀 `feat(scout):` | 🔲 (待提交) |
