# 🗺️ PRD: 侦察兵设备推荐+装修方案 — WP-09 SceneC+SceneD
> 日期: 2026-07-23 | 圈梁: 代码✅ 测试✅ PRD新建
> 分支: `tree/codeup-acr-ci-20260717`
> 优先级: P1
> 覆盖: intelligence 模块 — 设备选型推荐(device-recommendation) + 装修方案(renovation-plan)
> 前依赖: intelligence 模块已有 (17 文件) — IntelligenceController, IntelligenceService, VenueDataService

---

## 1. 背景与目标

### 1.1 业务背景

shenjiying88 平台已在 intelligence 模块实现选址评估 (`GET /intelligence/siting-assessment`)、新店规划 (`POST /intelligence/store-planning`) 等 V23 场景能力。为满足全场景智能赋能需求，继续扩展：

1. **场景C**: 门店设备选型智能推荐 (`POST /intelligence/device-recommendation`)
2. **场景D**: 个性化装修方案建议 (`POST /intelligence/renovation-plan`)

### 1.2 目标

| # | 场景 | 端点 | 核心产出 |
|:-:|:----|:----|:---------|
| RQ-50-04 | 门店设备选型推荐 | `POST /intelligence/device-recommendation` | 推荐设备清单+总预算占比+替代方案 |
| RQ-50-05 | 个性化装修方案 | `POST /intelligence/renovation-plan` | 四项分项估算+小计+档次适配+工期预估 |

### 1.3 范围

| BS | 名称 | 模块 | 状态 |
|:--:|:-----|:----|:----:|
| BS-0131a | 设备选型推荐 — 基于竞品设备数据 | intelligence.service + venue-data.service | ✅ IMPLEMENTED |
| BS-0131b | 装修方案 — 面积/tier/city/style四项分项 | intelligence.service | ✅ IMPLEMENTED |

---

## 2. 接口设计

### 2.1 场景C: 设备选型智能推荐

```typescript
// POST /intelligence/device-recommendation
// Body: { budget, area, city, storeType: 'arcade'|'game'|'mixed', tier: '经济'|'标准'|'精装'|'豪华' }

interface DeviceRecommendationOutput {
  budget: number               // 预算（万）
  area: number                 // 面积（㎡）
  city: string                 // 城市
  storeType: string            // 门店类型
  tier: string                 // 档次
  devices: RecommendedDevice[] // 推荐设备清单
  totalCost: number            // 设备总价
  remainingBudget: number      // 剩余预算
  budgetUtilizationPercent: number // 预算利用率%
  alternatives: AlternativeDeviceRecommendation[] // 替代方案(≥3项)
  notes: string[]              // 建议(≥3条)
}

interface RecommendedDevice {
  name: string                 // 设备名称
  brand: string                // 品牌
  count: number                // 数量
  unitPrice: number            // 单价
  totalPrice: number           // 总价
  supplier: string             // 供应商
  warrantyMonths: number       // 保修月数
  monthlyMaintenance: number   // 月维护费
  category: string             // 类别(街机/VR/礼品等)
  reason: string               // 推荐理由
}

interface AlternativeDeviceRecommendation {
  name: string
  brand: string
  totalPrice: number
  count: number
  unitPrice: number
  supplier: string
  reason: string
  tradeOff: string             // 替代权衡说明
}
```

### 2.2 场景D: 装修方案建议

```typescript
// POST /intelligence/renovation-plan
// Body: { area, tier: '经济'|'标准'|'精装'|'豪华', city, style?: '现代'|'工业'|'卡通'|'科技' }

interface RenovationPlanOutput {
  area: number
  tier: string
  city: string
  style: string                // 默认为'现代'
  baseDecoration: RenovationItem     // 基础装修(硬装) 45%
  themedDesign: RenovationItem       // 主题设计 25%
  furnitureDecor: RenovationItem     // 家具装饰 20%
  fireSafetyApproval: RenovationItem // 审批消防 10%
  items: RenovationItem[]      // 四项分项
  subTotal: number             // 装修总价
  budgetPercent: number        // 预算占比(约总投40%)
  tierAdaptation: string       // 档次适配建议
  renovationDuration: string   // 装修工期
  recommendations: string[]    // 推荐建议(≥4条)
}

interface RenovationItem {
  category: string             // 分项名称
  amount: number               // 金额
  percent: number              // 占比
  detail: string               // 详细说明
}
```

---

## 3. 模块架构

### 3.1 新增/修改文件清单

```
apps/api/src/modules/intelligence/
├── intelligence.entity.ts               (更新: DeviceRecommendation/RenovationPlan 类型)
├── venue-data.service.ts                (更新: getDevicesByCity 方法)
├── intelligence.service.ts              (更新: 新增 deviceRecommendation + renovationPlan)
├── intelligence.controller.ts           (更新: 新增 POST /device-recommendation + POST /renovation-plan)
├── intelligence.controller.spec.ts      (更新: 新增 6+7 个 controller 测试)
├── intelligence.service.test.ts         (更新: 新增 6+6 个 service 测试)
├── intelligence.role-extended.test.ts   (更新: 构造参数调整)
├── intelligence.service-extended.spec.ts(更新: 构造参数调整)
docs/knowledge/prd/v23/
├── v23-prd-scout-equipment.md           (新建: 本文)
docs/knowledge/acceptance/
├── 2026-07-23-wp-scout-equipment.md     (新建: 验收卡)
```

### 3.2 数据流

```
场景C: 设备选型
  POST /intelligence/device-recommendation
  └── IntelligenceController.deviceRecommendation(body)
      └── IntelligenceService.deviceRecommendation(input)
          ├── VenueDataService.getDevicesByCity(city) → 同城竞品设备
          ├── 按 budget/storeType/tier 过滤候选设备
          ├── 按竞品平均配置数 + tier 因子计算设备数量
          ├── 按预算裁剪
          ├── 生成替代方案 + 建议列表
          └── 组装输出

场景D: 装修方案
  POST /intelligence/renovation-plan
  └── IntelligenceController.renovationPlan(body)
      └── IntelligenceService.renovationPlan(input)
          ├── 按 tier 计算装修单价 (800~4000元/㎡)
          ├── 按 style 计算风格系数 (1.0~1.25)
          ├── 按 city 计算人工成本系数 (0.9~1.3)
          ├── 四项分项: 基础45%/主题25%/家具20%/消防10%
          ├── 计算工期 (基础天数+tier加成+风格加成)
          └── 组装输出
```

### 3.3 评分模型

**设备选型:**
| 维度 | 计算方式 |
|:----|:---------|
| 设备候选池 | 12类设备，按storeType过滤类别 |
| 数量基准 | 同城竞品平均配置数，无数据则默认2台 |
| tier因子 | 经济0.6 / 标准1.0 / 精装1.4 / 豪华1.8 |
| 预算裁剪 | 按单价从低到高分配，预算不足时减量 |

**装修方案:**
| 维度 | 计算方式 |
|:----|:---------|
| 单价基准 | 经济800 / 标准1500 / 精装2500 / 豪华4000 (元/㎡) |
| 风格系数 | 现代1.0 / 工业1.1 / 卡通1.15 / 科技1.25 |
| 人工系数 | 一线城市1.3 ~ 二线1.0 ~ 三线0.9 |
| 分项配比 | 基础45%/主题25%/家具20%/消防10% |
| 工期计算 | base=ceil(area/50)+tier加成(0~35天)+风格加成(0~15天) |

---

## 4. 测试设计

### 4.1 设备选型测试 (Service 6 + Controller 6)

**Service:**
| # | 场景 | 断言 |
|:-:|:----|:-----|
| 1 | 完整设备推荐 | devices/totalCost/budgetUtilizationPercent/alternatives/notes 均非空 |
| 2 | mixed类型覆盖面更广 | mixedCategories.size ≥ arcadeCategories.size |
| 3 | 豪华档数量 ≥ 经济档 | luxury.devices[i].count ≥ economy.devices[i].count |
| 4 | 预算利用率合理 | 0% ≤ utilization ≤ 100% |
| 5 | 未知城市正常返回设备 | city保留, devices非空 |
| 6 | 各storeType均可运行 | arcade/game/mixed 都返回devices |

**Controller:**
| # | 场景 | 断言 |
|:-:|:----|:-----|
| 1 | 正例 | devices/alternatives/notes 非空 |
| 2 | mixed vs arcade | mixed.devices.length ≥ arcade |
| 3 | 反例空城市 | 400 |
| 4 | 反例面积≤0 | 400 |
| 5 | 反例无效storeType | 400 |
| 6 | 反例无效tier | 400 |

### 4.2 装修方案测试 (Service 6 + Controller 7)

**Service:**
| # | 场景 | 断言 |
|:-:|:----|:-----|
| 1 | 完整装修方案 | 四项分项非空, items=4, subTotal, duration, recommendations≥3 |
| 2 | 不传style默认为现代 | style='现代' |
| 3 | 豪华档 > 经济档 | luxury.subTotal > economy.subTotal |
| 4 | 科技风格 > 现代 | tech.subTotal > modern.subTotal |
| 5 | 一线人工 > 二线 | shanghai.subTotal > chengdu.subTotal |
| 6 | 四种风格均可运行 | 现代/工业/卡通/科技 |

**Controller:**
| # | 场景 | 断言 |
|:-:|:----|:-----|
| 1 | 正例 | 四项非空, items=4, subTotal, duration, recommendations |
| 2 | 不传style默认为现代 | style='现代' |
| 3 | 豪华 > 经济 | luxury.subTotal > economy.subTotal |
| 4 | 反例空城市 | 400 |
| 5 | 反例面积≤0 | 400 |
| 6 | 反例无效tier | 400 |
| 7 | 反例无效style | 400 |

---

## 5. 圈梁状态

| 门禁 | 状态 |
|:----|:----:|
| TSC 零错误 (intelligence模块) | ✅ |
| 测试无 .skip/.only | ✅ |
| PRD 文档新建 | ✅ |
| 验收卡新建 | ✅ |
| commit消息前缀 `feat(scout):` | 🔲 (待提交) |
