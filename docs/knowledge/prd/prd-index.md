# 📋 PRD 索引目录

> 需求文档中枢 · 最后更新: 2026-07-20 23:10 · 🎉 11个Phase全量覆盖
> 维护人: 🦞 龙虾哥

## 已签发 PRD（覆盖所有11个活跃Phase）

| ID | 标题 | Phase | 状态 | 文件 | AC数量 |
|:--:|:-----|:-----:|:----:|:----|:------:|
| PRD-001 | 前台收银台 (Cashier) | P-35 | 🟢 **已实现** | [prd-cashier-p35.md](./prd-cashier-p35.md) | 10 |
| PRD-002 | 会员中心 (Member Center) | P-36 | 🟢 **已实现** | [prd-member-p36.md](./prd-member-p36.md) | 10 |
| PRD-007 | 财务对账 (Finance) | P-38 | 🟢 已签发 | [prd-finance-p38.md](./prd-finance-p38.md) | 6 |
| PRD-008 | 库存采购 (Inventory) | P-37 | 🟢 已签发 | [prd-inventory-p37.md](./prd-inventory-p37.md) | 5 |
| PRD-009 | 联名券 (Coupon) | P-48 | 🟢 已签发 | [prd-coupon-p48.md](./prd-coupon-p48.md) | 4 |
| PRD-010 | SSE后勤 (Logistics) | P-30 | 🟢 已签发 | [prd-logistics-p30.md](./prd-logistics-p30.md) | 4 |
| PRD-011 | 多租户隔离 (Tenant) | P-31 | 🟢 已签发 | [prd-tenant-p31.md](./prd-tenant-p31.md) | 3 |
| PRD-012 | 品牌运营 (Brand) | P-47 | 🟢 已签发 | [prd-brand-p47.md](./prd-brand-p47.md) | 3 |
| PRD-013 | 部署DevOps | P-53 | 🟢 已签发 | [prd-devops-p53.md](./prd-devops-p53.md) | 5 |
| PRD-014 | 智能体接入网关 (AI Gateway) | P-49 | 🟢 已签发 | [prd-ai-gateway-p49.md](./prd-ai-gateway-p49.md) | 8 |
| PRD-015 | SEO/GEO 智能优化 (SEO & GEO Engine) | P-49 | 🟢 已签发 | [prd-seo-geo-p49.md](./prd-seo-geo-p49.md) | 8 |
| PRD-016 | 开放平台网关 (Open Platform Gateway) | P-49 | 🟢 已签发 | [prd-open-platform-p49.md](./prd-open-platform-p49.md) | 8 |
| PRD-017 | Checkout 收入主链闭环 (Checkout Revenue Chain) | P-54 | 🟢 已签发 | [prd-checkout-revenue-p54.md](./prd-checkout-revenue-p54.md) | 8 |

## 待迁移PRD（来自.trae，与已签发PRD内容重叠，待合并）

| 标题 | 源文件 | 映射Phase | 处理 |
|:-----|:------|:---------:|:----|
| B2B品牌官网 | prd-b2b-brand-website.md | P-47 | 🔄 合并入PRD-012 |
| 运动蚂蚁品牌官网 | prd-sports-ants-website.md | P-47 | 🔄 合并入PRD-012 |
| 智能体接入模块(Gateway) | prd-tenant-llm-gateway.md | P-49 | ✅ 已收口至 PRD-014 |
| SEO/GEO智能优化系统 | prd-seo-geo-intelligent-system.md | P-49 | ✅ 已收口至 PRD-015 |

## P-49 平台收口

| 能力 | 收口PRD | 说明 |
|:-----|:--------|:-----|
| AI 接入治理 | PRD-014 | 租户 LLM 配置、配额、审批、统计 |
| SEO / GEO | PRD-015 | 搜索流量与 AI 引用优化 |
| 开放平台基座 | PRD-016 | OAuth、签名、API Key、Webhook、Sandbox、Usage |

## PRD预备工具

| 名称 | 文件 | 用途 |
|:-----|:-----|:-----|
| Gate 0 预备清单 | [prd-preflight-checklist.md](./prd-preflight-checklist.md) | 提前补齐树哥开工前的最小 PRD 结构 |

## PRD覆盖率

| 统计项 | 值 | 目标 | 状态 |
|:------|:--:|:----:|:----:|
| 活跃Phase总数 | 11 (含 P-54 Checkout) | — | — |
| 已签发PRD的Phase | **11/11** | — | **🎉 100%** |
| 已有代码的Phase | 2 (P-35/36) | — | 已实现 |
| 待开发Phase | 9 | 7/20前 | 🟢 有计划 |

## 验收状态速查

| PRD | 需求卡 | 验收卡 | 开发中 | 已通过 | 通过率 |
|:---:|:-----:|:------:|:------:|:------:|:-----:|
| PRD-001 | 10 | 10 | ✅ **已实现** | 45 | 100% 🎉 |
| PRD-002 | 10 | 10 | ✅ **已实现** | 41 | 100% 🎉 |
| PRD-007 | 6 | 6 | ⬜ 待开发 | — | — |
| PRD-008 | 6 | 5 | ⬜ 待开发 | — | — |
| PRD-009 | 4 | 4 | ⬜ 待开发 | — | — |
| PRD-010 | 4 | 4 | ⬜ 待开发 | — | — |
| PRD-011 | 3 | 3 | ⬜ 待开发 | — | — |
| PRD-012 | 4 | 3 | ⬜ 待开发 | — | — |
| PRD-013 | 5 | 5 | ⬜ 待开发 | — | — |
| PRD-014 | 8 | 8 | ⬜ 待开发 | — | — |
| PRD-015 | 8 | 8 | ⬜ 待开发 | — | — |
| PRD-016 | 8 | 8 | ⬜ 待开发 | — | — |
| PRD-017 | 8 | 1 | ✅ 开发中 | — | — |

---

*🦞 龙虾哥体系延续 · 🎉 当前已扩展至 11 个活跃 Phase，可继续纳入派单前检查*
