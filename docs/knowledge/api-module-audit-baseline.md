# 📊 API模块全量审计基线（修正版）

> 生成: 2026-07-14 14:00 · 全量扫描 · 非推测
> 覆盖: apps/api/src/modules/ 共 **118** 模块

---

## 一、已有 Audit 模块（8/118）

| 模块 | 审计文件 | 评级 |
|:----|:---------|:----:|
| P-31 tenant | p31-tenant-audit.md | 🟡 |
| P-31 tenant-config | (含入P-31) | 🟡 |
| P-36 member-level | p36-member-level-audit.md | 🟢 |
| P-36 points | p36-points-audit.md | 🟢 |
| P-36 loyalty | p36-loyalty-audit.md | 🟢 |
| P-37 inventory | p37-inventory-audit.md | 🟡 |
| P-38 finance | p38-finance-audit.md | 🔴 |
| P-48 coupon | p48-coupon-audit.md | 🟢 |
| P-49 open-api | p49-open-platform-audit.md | 🟡 |
| P-49 openapi | p49-open-platform-audit.md | 🟡 |
| P-49 tenant-llm | p49-open-platform-audit.md | 🟡 |
| P-49 tob-web-seo-geo | p49-seo-geo-audit.md | 🟡 |
| P-53 deploy | p53-deploy-audit.md | 🟡 |

**审计覆盖率: 8/118 = 6.8%** 🔴

## 二、所有模块按PRD归属分组

### 有PRD的Phase（18个PRD文件 → 覆盖~50模块）

| Phase | PRD文件 | 应覆盖模块（推测） |
|:-----:|:--------|:-----------------|
| P-35 | prd-cashier-p35 | cashier, lyt, payment-gateway, transactions |
| P-36 | prd-member-p36 | member, member-level, points, loyalty, svip |
| P-30 | prd-logistics-p30 | reservation |
| P-31 | prd-tenant-p31 | tenant, tenant-config, saas-advanced, saas-billing |
| P-37 | prd-inventory-p37 | inventory, purchase-order相关 |
| P-38 | prd-finance-p38 | finance, reports, audit, currency, transactions |
| P-47 | prd-brand-p47 | brand-custom, marketing, marketing-metrics, campaign, content |
| P-48 | prd-coupon-p48 | coupon, alliance, referral, blindbox |
| P-49 | prd-open-platform-p49 | open-api, openapi, tenant-llm |
| P-49 | prd-ai-gateway-p49 | agent, ai包 |
| P-53 | prd-devops-p53 | deploy, ops-manual, runbook, canary, auto-rollback |

### 无PRD的模块（~68模块需要PRD摘要）

**AI层(25)**: ai-content/ai-cs/ai-diagnosis/ai-forecast/ai-insight/ai-marketing/ai-model-config/ai-push/ai-rag/ai-recommend/ai-review/ai-reviewer/ai-rule-engine/ai-sales/aiops/anomaly-detector/edge/federated-learning/image-recognition/knowledge/multimodal-fusion/ocr/recommend/recommender/retrieval/voice-processing

**基础设施(40)**: auth/permission/rbac/gateway/webhook/queue/notification/push/cdn-cache/monitoring/health/health-dashboard/audit/session/sandbox/security/compliance/foundation/lowcode/currency/device-adapter/docs/lineage/locale/multi-region/multimedia/observability/performance/perf-monitor/realtime/shared/time-series/workbench/i18n

**业务(3)**: champion/leads/tournament/scout

---

*数据来源: 2026-07-14 全量目录扫描*
