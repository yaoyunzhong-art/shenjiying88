# 🗺️ Phase → 模块映射表 V1

> 生成: 2026-07-14 14:05 · 基于118模块扫描 + 10个PRD文件

---

## 一、已绑定Phase（10个Phase → ~48模块）

| Phase | 名称 | PRD | 核心模块 | 延伸模块 | 审计状态 |
|:-----:|:-----|:----|:---------|:---------|:--------:|
| P-35 | 收银店A | ✅ | cashier(61files) | lyt(31), payment-gateway(20), transactions(18) | 🟡部分 |
| P-36 | 会员店A | ✅ | member(47), member-level(21), points(20), loyalty(23) | svip(19) | 🟢完成 |
| P-30 | SSE后勤 | ✅ | logistics(5), reservation(20) | admin-web inspection(page) | 🟡部分 |
| P-31 | 多租户隔离 | ✅ | tenant(45), tenant-config(23) | saas-advanced(25), saas-billing(18) | 🟡部分 |
| P-37 | 库存采购 | ✅ | inventory(48) | — | 🟡完成 |
| P-38 | 财务对账 | ✅ | finance(47), reports(29), audit(18), reconciliation-rules(2) | currency(19), transactions(18) | 🟡进行中 |
| P-47 | 品牌运营 | ✅ | brand-custom(21), marketing(33) | marketing-metrics(20), content(19), campaign(25) | ⬜ |
| P-48 | 联名券 | ✅ | coupon(28), alliance(26) | referral(21), blindbox(23), loyalty(23) | 🟢完成 |
| P-49 | 开放平台 | ✅ | open-api(18), openapi(47), tenant-llm(25) | agent(49), AI模块群(25模块) | 🟡部分 |
| P-53 | 部署DevOps | ✅ | deploy(21), ops-manual(21) | runbook(21), canary(20), auto-rollback(19) | 🟡完成 |

## 二、无Phase模块需要绑定

### V19 Day2 D段新增页面绑定 (2026-07-17)
| 页面 | 位置 | 代码✅ | 测试✅ | 审计✅ | PRD | 推荐Phase |
|:-----|:----|:-----:|:-----:|:-----:|:----:|:---------|
| Dashboard | admin-web/app/dashboard/ | 292行 | 42行 | 🆕 | 🔴 | P-Admin 指挥台 |
| Analytics | admin-web/app/analytics/ | 281行 | 43行 | 🆕 | 🔴 | P-Admin 数据 |
| Knowledge | admin-web/app/knowledge/ | 196行 | 32行 | 🆕 | 🔴 | P-Admin 知识 |
| Users | admin-web/app/users/ | 158行 | 32行 | 🆕 | 🔴 | P-Admin 用户 |
| Account | storefront-web/app/account/ | 498行 | 362行 | 🆕 | 🔴 | P-36会员 |

### V19 Day2 凌晨 storefront 薄页面补齐 (2026-07-18 02:25-03:10)
| 页面 | 位置 | 代码 | 测试 | 审计 | PRD | 推荐Phase |
|:-----|:----|:---:|:----:|:----:|:---:|:---------|
| Alerts | storefront-web/app/alerts/[id]/ | 已有 | 171行🆕 | ✅V15 | 🟡已有 | P-36会员 |
| Coupons/[id] | storefront-web/app/coupons/[id]/ | 已有 | 163行🆕 | ✅V15 | 🟡已有 | P-48联名券 |
| Coupons/new | storefront-web/app/coupons/new/ | 已有 | 147行🆕 | ✅V15 | 🟡已有 | P-48联名券 |
| Members/[id] | storefront-web/app/members/[id]/ | 已有 | 223行🆕 | ✅V15 | 🟡已有 | P-36会员 |
| Members/new | storefront-web/app/members/new/ | 已有 | 191行🆕 | ✅V15 | 🟡已有 | P-36会员 |
| Products/[id] | storefront-web/app/products/[id]/ | 已有 | 203行🆕 | ✅V15 | 🟡已有 | P-37库存 |
| Products/new | storefront-web/app/products/new/ | 已有 | 155行🆕 | ✅V15 | 🟡已有 | P-37库存 |
| Refunds/new | storefront-web/app/refunds/new/ | 已有 | 175行🆕 | ✅V15 | 🟡已有 | P-38财务 |
| Reports/[id] | storefront-web/app/reports/[id]/ | 已有 | 142行🆕 | ✅V15 | 🟡已有 | P-39报表 |
| Reports/new | storefront-web/app/reports/new/ | 已有 | 139行🆕 | ✅V15 | 🟡已有 | P-39报表 |
| Stock/[id] | storefront-web/app/stock/[id]/ | 已有 | 215行🆕 | ✅V15 | 🟡已有 | P-37库存 |
| Stock/new | storefront-web/app/stock/new/ | 已有 | 163行🆕 | ✅V15 | 🟡已有 | P-37库存 |
| Suppliers/new | storefront-web/app/suppliers/new/ | 已有 | 170行🆕 | ✅V15 | 🟡已有 | P-37库存 |
| Home page | storefront-web/app/ | 已有 | 131行🆕 | ✅V15 | 🟡已有 | — |
| Campaigns/new | storefront-web/app/campaigns/new/ | 已有 | 163行🆕 | ✅V15 | 🟡已有 | P-47品牌 |

### 基础设施组（建议创建 Phase-P0 基础设施）
| 模块 | 文件数 | 测试 | 推荐Phase |
|:-----|:------:|:----:|:---------:|
| auth | 24 | ✅15 | 新建P-Infra-1 权限框架 |
| permission | 23 | ✅14 | 新建P-Infra-1 权限框架 |
| rbac | 17 | ✅13 | 新建P-Infra-1 权限框架 |
| security | 19 | ✅13 | 新建P-Infra-2 安全 |
| compliance | 33 | ✅22 | 新建P-Infra-2 安全 |
| gateway | 19 | ✅13 | 新建P-Infra-3 网关 |
| monitoring | 22 | ✅16 | 新建P-Infra-4 可观测 |
| foundation | 166 | ✅17 | 新建P-Infra-5 底座 |

### AI组（建议创建 Phase-AI-1~3）
| 模块 | 文件数 | 测试 | 建议分组 |
|:-----|:------:|:----:|:---------|
| agent | 49 | ✅29 | P-AI-1 智能体框架 |
| ai-rule-engine | 27 | ✅26 | P-AI-2 规则引擎 |
| ai-recommend | 20 | ✅14 | P-AI-3 推荐系统 |
| ai-cs | 40 | ✅19 | P-AI-4 客服 |
| ai-forecast | 36 | ✅23 | P-AI-5 预测 |
| ai-marketing | 30 | ✅18 | P-AI-6 营销 |

---

*🦞 龙虾哥 · Phase→模块映射 · 2026-07-14*
