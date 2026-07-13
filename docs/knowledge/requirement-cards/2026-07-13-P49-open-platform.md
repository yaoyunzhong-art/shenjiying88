# P-49 开放平台 · 需求卡片
> 创建: 2026-07-13 | 截止: 7/30 (开放平台 Phase 收口)

## PRD 收口
- PRD-014: 智能体接入网关
- PRD-015: SEO/GEO 智能优化
- PRD-016: 开放平台网关

## 业务需求
E44 开放平台: P-49 需要形成完整平台基座，覆盖租户 AI 接入、开放 API 网关、签名校验、API Key 生命周期、Webhook/Sandbox/Usage，以及后续 SEO/GEO 的流量入口治理。

## 技术方案
E1 陈架构: `apps/api/src/modules/open-api` 承担 OAuth/HMAC/客户端接入，`apps/api/src/modules/openapi` 承担 API Key/Webhook/Sandbox/Usage 门面，`apps/api/src/modules/tenant-llm` 承担租户 AI 接入治理。

## 树哥接单清单
- `open-api`: 对齐 `RQ-49-21/22/24`，补 OAuth + HMAC + tenantContext 验收映射
- `openapi`: 对齐 `RQ-49-23/25/26/27/28`，补 API Key / Webhook / Sandbox / Usage 圈梁
- `tenant-llm`: 对齐 `RQ-49-01~08`，补租户隔离、审批、统计与权限链路
- `SEO/GEO`: 先以 PRD 和页面契约收口，后续再接前端实现与监控看板

## 优先顺序
1. P0: OAuth / HMAC / API Key / tenant 隔离
2. P1: Webhook / Sandbox / Usage / Docs
3. P1: tenant-llm 审批、统计、全球化展示
4. P2: SEO/GEO 页面与监控闭环

## 专家签名
- [ ] E44 开放平台(业务必要性)
- [ ] E1 陈架构(技术可行性)
- [ ] E16 安全(签名/隔离/密钥治理)

## 执行证据
- 圈梁测试: `apps/api/src/modules/openapi/open-platform-ringbeam.test.ts` (`13 tests`)
- 租户服务测试: `apps/api/src/modules/tenant-llm/llm-config.tenant-service.test.ts` (`30 tests`)
- PRD 校验: `bash scripts/prd-validate.sh`
- 专项审计: `docs/knowledge/p49-open-platform-audit.md`

## 当前缺口
- `tenant-llm` 还缺 `AC-49-08` 权限拒绝与审计日志圈梁
- `SEO/GEO` 仍处于 PRD/契约阶段，尚未进入前台实现闭环
- P-49 还缺更上层的 API smoke / E2E 证据
