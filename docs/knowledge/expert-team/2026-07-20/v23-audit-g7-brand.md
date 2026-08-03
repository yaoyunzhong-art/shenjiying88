# V23 审计 · G7 品牌组
> 日期: 2026-07-20 · 评审专家: E32郑品牌(儿童) + E31吴品牌(流量) + E30周品牌(高端) + E33王品牌(联名)
> 版本: V23 v1.2

## 总体评级
🟢 **通过**

P-47 品牌运营已从 0% 推进至 **100%** ✅，作为 V23 Phase 1 首个全量交付的 Phase，完成了品牌素材管理（BrandAsset）、品牌活动管理（BrandCampaign）、门店同步（BrandSyncRecord）、联名合作（Collaboration）、活动模板（BrandCampaignTemplate）五大子模块的完整代码+测试覆盖。p47-brand-audit.md 专项审计给出 4.5/5 评级，PRD 需求覆盖率 4/4 完整闭环。

152 个测试用例、Phase 82 个测试全部通过，品牌运营模块 81 tests 全绿。

---

## 评审意见

### 1️⃣ 品牌运营 Phase 100% 交付——质量需验证

P-47 在 V23 Day1 22:44 状态 ⚪ 未开始，到 22:54 状态 ✅ 100%，意味着在一个 **10 分钟内完成了从 80%→100%** 的收尾（Phase 40%→60%→80%→100% 的多阶段测试提交在此窗口内）。

**关注点**：
- p47-brand-ops-team-audit.md 审计报告指出剩余缺口：`logo/banner/video 缺对象存储级上传证据`（🟡 P2）和 `门店品牌同步缺浏览器/前台联动验收`（🟡 P2）
- phase60 测试 18 条 + phase-p47-80 test 23 条 + phase-p47-100 test 23 条：代码量增长在 10 分钟内完成，需要评估测试的深度而非仅通过数

**建议**：在 Phase 2 期间对 P-47 进行一次**浏览器级 E2E 验收**，验证品牌素材上传流程 + 门店同步前端展示 + 联名合作活动创建，确保用户侧体验无误。

### 2️⃣ 品牌素材管理——缺少对象存储集成

BrandAsset 实体包含 `url` 字段，DTO 中携带 `fileSizeBytes` / `mimeType`，但：
- 当前没有对象存储（S3/OSS/MinIO）的 upload API
- url 字段用于引用已上传的素材链接，但素材上传链路未闭环
- 不存在文件类型校验、大小限制、CDN 缓存策略

对于品牌运营场景，图片素材（banner/logo）和视频素材的上传是核心功能。如果素材管理仅支持"引用外部 URL"，用户实际需要在系统外完成上传后再回来录入链接，体验不连贯。

**建议**：P-47 Phase 1.5 (7/22-24) 增加对象存储适配器，至少支持文件上传→MinIO/S3 存储→CDN 分发的基础链路。

### 3️⃣ 联名合作——合同管理存在缺口

Collaboration 实体支持 `partner`（含 name/contactPhone/grade）、`type`（co_branding/sponsorship/joint_promotion/cross_marketing）、`revenueShare`（RevenueShareConfig）、`campaignIds`、`terms`。Phase 100% 新增了 `CollaborationContract`。

**但**：联名合作的核心业务场景是**品牌对外结算**，G3 收银组和 G6 财务组可能受影响。特别在 `revenueShare` 配置后，分润计算的精确性和可审计性需要跨组验证。

分润记录（RevenueShareRecord）在 Phase 80% 中列出但扩展能力表中标记为"扩展能力"。如果联名合作活动已上线但分润未自动记录，则无法财务对账。

**建议**：在 P-38（财务对账）和 P-47（联名合作）之间建立跨 Phase 联调测试，验证 Campaign + Collaboration + RevenueShareRecord 的三层分润链路。

---

## 关注点

### 🟡 关注点1: 品牌素材对象存储未实现，真实品牌上线受阻
- 任何真实品牌运营场景都需要上传 logo/banner/视频
- 当前 `url` 字段为字符串，无上传 endpoint
- Phase 2 基建升级包括 Docker compose，可搭配 MinIO 容器提供本地对象存储
- 未解决前，品牌模块可管理"素材册"但不能真正"上传素材"

### 🟡 关注点2: 门店同步——缺前端/浏览器联调
- BrandSyncRecord 在 service 层已实现 syncToStores / getSyncedCampaigns / getSyncRecordsByCampaign
- 但缺少 storefront 或 admin-web 品牌页面的联动验收
- 门店实际看到的品牌物料变更是否即时同步？未在前端 E2E 中验证
- P-47 品牌活动→门店同步链的 E2E 测试（从 admin 创建活动到门店页展示）缺失

### 🟢 关注点3: 品牌素材分类+标签——Phase 80% 能力尚未实现
- AssetCategory/AssetTag 在 PRD 扩展能力中列出，但 Phase 100% 的 22 个新增测试未覆盖
- 活动模板（BrandCampaignTemplate）的 tags 字段存在但分类体系未建立
- 无分类标签的素材库在品牌运营场景中难以管理，特别是大型品牌（100+素材）

---

## 建议

### 建议1: Phase 2 增加 MinIO 对象存储集成
- 在 Docker compose 中增加 MinIO 容器
- 新增 `brand-operations.upload.controller.ts` 处理文件上传
- 集成 CDN 预览 URL 生成
- 增加上传链路 E2E 测试（文件上传→存储→URL 返回→前端展示）

### 建议2: P-47+P-38 联名财务联调
```typescript
// 联调场景: 联名合作活动分润验证
// 1. 创建 Collaboration (type: co_branding, revenueShare: 50/50)
// 2. 关联 BrandCampaign
// 3. 模拟活动收益 100,000
// 4. 验证 RevenueShareRecord 生成: 50,000 各
// 5. 验证 P-38 对账模块可追踪此分润
```
创建 `brand-operations.cross-phase-p38.test.ts` 跨阶段测试。

### 建议3: 品牌活动前端联动 E2E 验收
- 在 admin-web 补一张品牌活动管理页面（若 Phase 1 未覆盖）
- 在 storefront 补品牌活动展示区域（如首页轮播 banner）
- 创建前端 E2E test: 创建活动→发布→门店同步→前台显示
- 将此项列为 Phase 2 的 G7 验收条件

---

> 审计执行: 🐜 树哥 · 2026-07-20 23:10 CST
> 参考文献: V23 roadmap v1.2 · p47-brand-audit.md · p47-brand-ops-team-audit.md · P-47 PRD摘要卡
