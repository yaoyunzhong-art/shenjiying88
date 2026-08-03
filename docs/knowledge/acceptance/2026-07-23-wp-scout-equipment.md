# 📋 验收卡: 侦察兵设备推荐+装修方案 — 2026-07-23

> **工作包**: WP-09 侦察兵全场景智能赋能 · 包2/4 (设备推荐+装修方案)
> **分支**: `tree/codeup-acr-ci-20260717`
> **模块**: `intelligence/` — controller.service.entity
> **状态**: ✅ 代码完成 | ✅ TSC通过 | ✅ PRD产出 | 🔲 待合并

---

## 1. 验收范围

| 场景 | 端点 | 验收标准 | 状态 |
|:----|:----|:--------|:----:|
| 场景C 设备选型推荐 | `POST /intelligence/device-recommendation` | 推荐设备清单(名/品牌/数量/单价/供应商/保修/月维护)+预算占比+替代方案 | ✅ |
| 场景D 装修方案 | `POST /intelligence/renovation-plan` | 四项分项估算+小计+档次适配+工期预估 | ✅ |

---

## 2. 验收测试记录

### 2.1 IntelligenceService → deviceRecommendation (6 tests)

```
  ▶ deviceRecommendation (6 tests)
    ✔ 正例: 返回完整设备推荐
    ✔ 正例: mixed类型覆盖面更广
    ✔ 正例: 豪华档配置数量高于经济档
    ✔ 正例: 预算利用率合理范围
    ✔ 正例: 未知城市正常返回设备
    ✔ 正例: 各storeType类型均可运行
```

### 2.2 IntelligenceService → renovationPlan (6 tests)

```
  ▶ renovationPlan (6 tests)
    ✔ 正例: 返回完整装修方案
    ✔ 正例: 不传style时默认为现代
    ✔ 正例: 豪华档装修费用更高
    ✔ 正例: 科技风格系数更高
    ✔ 正例: 一线城市人工成本更高
    ✔ 正例: 四种风格均可运行
```

### 2.3 Controller → deviceRecommendation (6 tests)

```
  ▶ POST /intelligence/device-recommendation (场景C) (6 tests)
    ✔ 正例: 返回设备推荐清单
    ✔ 正例: mixed类型返回更多设备
    ✔ 反例: 空城市抛400
    ✔ 反例: 面积<=0抛400
    ✔ 反例: 无效storeType抛400
    ✔ 反例: 无效tier抛400
```

### 2.4 Controller → renovationPlan (7 tests)

```
  ▶ POST /intelligence/renovation-plan (场景D) (7 tests)
    ✔ 正例: 返回装修方案
    ✔ 正例: 不传style时默认为现代
    ✔ 正例: 豪华档装修费用更高
    ✔ 反例: 空城市抛400
    ✔ 反例: 面积<=0抛400
    ✔ 反例: 无效tier抛400
    ✔ 反例: 无效style抛400
```

### 2.5 TSC 编译

- intelligence 模块: ✅ 零错误
- 全项目: ⚠️ 仅 ai-model-config snapshot.spec.ts 有预存错误（jest类型问题），非本模块范围

### 2.6 已有测试保留

- intelligence.service.test.ts: ✅ 原有tests保留通过
- intelligence.controller.spec.ts: ✅ 原有tests保留通过
- intelligence.role-extended.test.ts: ✅ 构造参数对齐
- intelligence.service-extended.spec.ts: ✅ 构造参数对齐

---

## 3. 关键输出验证

### 3.1 设备推荐响应结构

```json
{
  "budget": 200,
  "area": 300,
  "city": "上海",
  "storeType": "arcade",
  "tier": "标准",
  "devices": [
    {
      "name": "夹娃娃机", "brand": "广州雄业", "count": 10,
      "unitPrice": 8000, "totalPrice": 80000,
      "supplier": "广州雄业", "warrantyMonths": 6, "monthlyMaintenance": 80,
      "category": "礼品", "reason": "高利润率项目，平均回收期6个月"
    },
    ...
  ],
  "totalCost": 320000,
  "remainingBudget": 1680000,
  "budgetUtilizationPercent": 16,
  "alternatives": [
    {
      "name": "射击机", "brand": "世宇科技",
      "unitPrice": 35000, "count": 9, "totalPrice": 315000,
      "supplier": "世宇科技", "reason": "经典街机项目",
      "tradeOff": "价格更低，配置精简"
    },
    ...
  ],
  "notes": [
    "基于上海同城3家竞品设备数据推荐",
    "标准档配置，整体设备预算占总投资16%",
    "建议预留20.0万作为运营备用金"
  ]
}
```

### 3.2 装修方案响应结构

```json
{
  "area": 300,
  "tier": "标准",
  "city": "上海",
  "style": "现代",
  "baseDecoration": {
    "category": "基础装修", "amount": 263250, "percent": 45,
    "detail": "地面/墙面/吊顶/强弱电/空调/给排水"
  },
  "themedDesign": {
    "category": "主题设计", "amount": 146250, "percent": 25,
    "detail": "现代风格主题包装·灯光氛围·品牌标识·导视系统"
  },
  "furnitureDecor": {
    "category": "家具装饰", "amount": 117000, "percent": 20,
    "detail": "休息区沙发·吧台·展示柜·绿植装饰·地毯窗帘"
  },
  "fireSafetyApproval": {
    "category": "审批消防", "amount": 58500, "percent": 10,
    "detail": "消防报审·喷淋烟感·应急照明·安防监控·经营许可"
  },
  "items": [...],
  "subTotal": 585000,
  "budgetPercent": 40,
  "tierAdaptation": "标准型（性价比最优，适多数商圈投资，兼顾品质与成本）。现代风格在上海市场接受度高。核心功能优先保障，装饰可后期迭代升级。",
  "renovationDuration": "约16天（1个月内）",
  "recommendations": [
    "现代风格适合上海市场定位，建议确认核心客群偏好后再定稿",
    "标准档装修建议预留87750万作为不可预见费（约15%）",
    "预估工期约16天（1个月内），建议与设备采购同步推进以缩短开业筹备周期"
  ]
}
```

---

## 4. 边界/异常验证

| 场景 | 输入 | 预期 | 结果 |
|:----|:----|:----|:----:|
| 设备-空城市 | budget=200,city="" | 400 BadRequest | ✅ |
| 设备-面积≤0 | area=0 | 400 BadRequest | ✅ |
| 设备-无效storeType | storeType="invalid" | 400 BadRequest | ✅ |
| 设备-无效tier | tier="顶级" | 400 BadRequest | ✅ |
| 设备-未知城市 | city="未知城市" | 正常输出，devices非空 | ✅ |
| 装修-空城市 | area=300,city="" | 400 BadRequest | ✅ |
| 装修-面积≤0 | area=0 | 400 BadRequest | ✅ |
| 装修-无效tier | tier="顶级" | 400 BadRequest | ✅ |
| 装修-无效style | style="复古" | 400 BadRequest | ✅ |

---

## 5. 产出文件清单

| 文件 | 类型 | 说明 |
|:----|:----|:-----|
| `apps/api/src/modules/intelligence/intelligence.entity.ts` | 🔧 修改 | DeviceRecommendation/RenovationPlan 类型对齐任务规范 |
| `apps/api/src/modules/intelligence/venue-data.service.ts` | 🔧 修改 | 新增 getDevicesByCity() + CompetitorDeviceRecord 类型 |
| `apps/api/src/modules/intelligence/intelligence.service.ts` | 🔧 修改 | 新增 deviceRecommendation() + renovationPlan() + buildTierAdaptationRenovation() |
| `apps/api/src/modules/intelligence/intelligence.controller.ts` | 🔧 修改 | 新增 POST /device-recommendation + POST /renovation-plan |
| `apps/api/src/modules/intelligence/intelligence.controller.spec.ts` | 🔧 修改 | 13个新controller测试(6设备+7装修) |
| `apps/api/src/modules/intelligence/intelligence.service.test.ts` | 🔧 修改 | 12个新service测试(6设备+6装修) |
| `apps/api/src/modules/intelligence/intelligence.role-extended.test.ts` | 🔧 修改 | 构造参数对齐 |
| `apps/api/src/modules/intelligence/intelligence.service-extended.spec.ts` | 🔧 修改 | 构造参数对齐 |
| `docs/knowledge/prd/v23/v23-prd-scout-equipment.md` | 📄 新建 | PRD文档 |
| `docs/knowledge/acceptance/2026-07-23-wp-scout-equipment.md` | 📄 新建 | 验收卡 |

---

## 6. 圈梁确认

- [x] 无 `test.skip` / `test.only`
- [x] TSC intelligence模块零错误
- [x] 接口符合 PRD RQ-50-04 / RQ-50-05
- [x] commit前缀: `feat(scout): 设备推荐+装修方案`
