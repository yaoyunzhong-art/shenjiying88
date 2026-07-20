# V23 审计 · G10 联名+合作组
> 日期: 2026-07-20 · 评审专家: E30周品牌高端 + E31吴品牌流量 + E32郑品牌亲子 + E33王品牌联名
> 版本: V23 v1.2

## 总体评级
🟡 **有条件通过**

## 评审意见

### 1️⃣ 联名合作（Collaboration）模块骨架完整，4类合作类型覆盖业内主流场景

P-47 的 Collaboration 子模块定义了清晰的合作伙伴结构与 4 种联名合作类型：

| 类型 | 枚举值 | 适用场景 |
|:-----|:------:|:---------|
| 联合品牌 | co_branding | 品牌×品牌联名产品/活动 |
| 赞助合作 | sponsorship | 品牌赞助赛事/场地 |
| 联合推广 | joint_promotion | 互推导流、联合营销 |
| 交叉营销 | cross_marketing | 品牌×异业联盟 |

Collaboration 实体包含 `PartnerInfo`（含 name/contactPhone/grade）和 `RevenueShareConfig`，支持分润配置。配合 `CollaborationContract`（Phase 100% 扩展能力）和 `RevenueShareRecord`（分润结算记录），整体设计覆盖了联名合作从合同签署到分润结算的全生命周期。

**核心数字**：P-47 81 测试全绿 + Phase 60% 测试 22 个 + Phase 100% 测试 22 个（含 contract/abtest/export/recycle 等），测试覆盖率充足。

### 2️⃣ RevenueShare分润配置协议层设计良好，但执行层缺乏自动化

`RevenueShareConfig` 以 JSON 形式嵌入 Collaboration 实体，支持灵活的分润比例配置。Phase 100% 扩展中的 `RevenueShareRecord` 提供了"分润记录与结算"的实体定义。

**审计发现的问题**：
- **分润计算引擎缺失**：RevenueShareRecord 目前只是"记录"实体，不代表"自动计算"引擎。如果联名合作涉及跨门店/跨时段动态分润（例如：品牌 A 的联名活动在门店 X 的 14天活动期内，每日分润基于当日营收计算），当前没有实现自动化的分润计算公式引擎
- **分润结算未对接 P-38 财务对账**：联名分润的财务入账需要与 P-38 Finance 模块联动，但代码层无 cross-module 引用
- **无分润试算/预览功能**：运营人员在设置分润比例时，无法看到基于历史数据的预估分润金额

**建议**：Phase 2（7/27→30）中，如果联名合作涉及真实分润结算，需要：
1. 补充分润计算 service 方法（基于 campaign 期间的日营收 * 分润比例）
2. 对接 P-38 的分录写入（RevenueShareRecord → FinanceEntity）
3. 至少在后端增加一个 `GET /collaborations/:id/projected-revenue` 试算端点

### 3️⃣ 联名合作效果追踪缺乏数据回流机制

PRD 摘要卡描述联名合作需要"效果追踪（门店转化率/LBS数据）"，G10 晚间简报中也提到了这一能力。

**当前实现的问题**：
- Collaboration 实体中没有任何"效果指标"字段（impressions / conversions / revenue / ROI）
- `getMetrics` 方法在 service 中存在，但缺乏实际的 metrics 数据源定义
- 没有对接 P-38（财务）或 storefront（前端转化数据）的数据回流
- 联名合作效果的可视化依赖于外部系统手动统计，未嵌入 admin-web

如果联名合作上线后，运营人员无法在系统内查看活动的 ROI、到店转化率、联名商品销售排行——则联名模块的价值大打折扣。

### 4️⃣ 合作伙伴分级管理停留在静态 grade 字段，无动态升降级

PartnerInfo.grade 字段存在，但：
- 当前是静态属性，创建后不可变更
- 缺乏升降级触发条件（如：累计合作金额达到 X 时自动提升 grade）
- 缺乏 grade×分润率的联动逻辑（不同 grade 享受不同分润比例）

**参考建议**：参考 V20 圈梁知识体系的"等级划分"思想，为合作伙伴建立：
- grade 状态机（trial → silver → gold → platinum）+ 升降级触发条件
- grade 影响分润比例、审批简化程度、活动资源配额
- 合作伙伴健康度评分（合作频次 + 分润金额 + 客户满意度）

## 关注点

### 🔴 联名合作"合同管理"是 Phase 100% 扩展能力，但当前 Phase 1 已标 100%

PRD 摘要卡的扩展能力列表中，CollaborationContract 标注为"Phase 100% 扩展能力"。但 V23 Phase 计划中 P-47 的当前状态为 100% ✅。这里存在**状态不匹配**：

- 如果合同管理是"100% 已完成"，则 Collaboration 实体应当关联合同实体（contractId / contractUrl / contractStatus）
- 如果合同管理是"扩展能力（可选的）"，则 PRD 状态不应标 100%，而应标 80%（核心完成）+20%（扩展预留）

建议 G10 和 G1 架构组核查：Phase 1 的"100%"是否包括合同管理。如果不包括，需要修正状态。

### 🟡 联名活动与品牌活动（Campaign）的关联逻辑待验证

Collaboration 实体的 `campaignIds` 字段（类型未明确是 JSON array 还是关联表）可以关联多个 BrandCampaign。

**潜在问题**：
- 一个联名合作可能有多个品牌活动（例如：品牌 A 和品牌 B 同时开展 3 个联合推广活动）
- 一个品牌活动也可能对应多个联名合作（例如：一个 promotion 活动同时与多个赞助商合作）
- 当前是 N:M 关系，但代码层是否有唯一的联名键防止重复分润？

建议补充唯一约束 + 联名合作分润的去重校验逻辑，避免同一笔交易被多次分润。

### 🟡 品牌素材（BrandAsset）与联名合作素材的管理边界未划分

P-47 的 BrandAsset 管理品牌的所有 logo/banner/video/copy 等素材。联名合作活动通常也需要品牌素材参与（例如：联名活动的 banner 需要双方品牌的 logo）。

**问题**：Collaboration 实体没有明确的 `sharedAssets` 字段或方法，管理联名活动素材的归属（谁提供的素材？使用范围？授权期限？）不清晰。

建议在 Collaboration 上增加 `sharedAssets: { providedBy: partnerId, assetId: string, usageScope: string }[]`，明确素材归属。

## 建议

### 1. 补充合作伙伴动态分级体系，实现 grade 升降级自动化

**操作方案**：
- PartnerGrade 枚举: trial(0) → silver(1) → gold(2) → platinum(3)
- 触发器：累计分润金额达到阈值时自动升级
- Grade 影响审批流（银牌以下需要完整审批，金牌以上可快速通过）

**优先级**：P2（联名合作模块上线后第一个运营周期前完成即可）

### 2. 联名效果追踪数据回流：对接 storefront 转化率 + P-38 财务收入

**操作方案**：
- 在 `Collaboration` 实体新增 metrics 字段（JSONB 存储）：`{impressions, clicks, conversions, revenue, rosi}`
- 新增 `POST /collaborations/:id/metrics` 端点接受 storefront 和 P-38 的数据回写
- admin-web 联名管理详情页增加"效果看板"区块

**优先级**：P1（Phase 2 完成，确保上线第一天运营人员能看到效果数据）

### 3. 合同实体阶段对齐：Phase 1 完成度修正为 80%+20%预留

**操作方案**：
- 在 PRD 摘要卡中明确标注：「CollaborationContract - 🔴 Phase 2 扩展（当前为预留）」
- 在 Phase 1 转为 100% 之前，补充合同管理的基本实体和 CRUD
- 如果确实超出了 Phase 1 范围，则在 V23 风险清单中记录为"已完成识别但延期的功能边界"

**优先级**：P0（Phase 1 关闸前必须澄清）

---

**G10 最终评级: 🟡 有条件通过**

通过条件：Phase 1 关闸前（7/26）完成以下两项：
1. 澄清"合同管理"的完成度状态（PRD 摘要卡修正）
2. 至少完成联名合作效果的 metrics 数据接收端点（可以不接前端，但 API 层必须就绪）

若不满足条件，G10 将于 Phase 1 关闸时升级为🔴退回。

*🐜 G10 联名+合作组 · V23 审计 · 2026-07-20 23:11 CST*
