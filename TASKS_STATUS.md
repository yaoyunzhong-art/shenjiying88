# 📋 V7.2 执行态任务状态

> 更新时间: 2026-07-19（已人工同步至当前口径）
> 对齐文件: `DEVELOP-PLAN-v7.md` / `V7.2-RESIGN-CHECKLIST.md` / `WEEKLY-RYG-STATUS-BOARD.md`

---

## 8张行动卡当前状态

| 卡片ID | 动作 | 负责人 | 截止 | 状态 |
|--------|------|--------|------|:----:|
| PLAN-REV-A1 | `DNS/TLS/正式域名` 责任人、证据物、超时升级机制 | E49 + E46 + E41 | 2026-07-20 | ✅ |
| PLAN-REV-A2 | `release bundle` 唯一生产交付口径 | E49 + E52 + E44 | 2026-07-20 | ✅ |
| PLAN-REV-B1 | 单列 `POS/Pad` 一线经营链 | E20 + E13 + E45 | 2026-07-21 | ✅ |
| PLAN-REV-B2 | `税务/发票` 升级为显式子任务流 | E10 + E36 + E50 | 2026-07-21 | ✅ |
| PLAN-REV-C1 | `checkout` 金额准确性 L3 浏览器验收 | E47 + E45 + E7 | 2026-07-23 | ✅ |
| PLAN-REV-C2 | `VRT` 视觉验收原型 | E21 + E47 + E53 | 2026-07-24 | ✅ |
| PLAN-REV-C3 | `P-49` 指标、文档、签收标准 | E39 + E50 + E33 | 2026-07-24 | ✅ |
| PLAN-REV-D1 | 每周红黄绿状态板 | E18 + E19 + E42 | 2026-07-20 | ✅ |

---

## 本周 P0

1. `DNS / TLS / 正式域名` 外部硬阻塞解除
2. `G8` 在 `DNS + TLS` 解阻后补正式窗口 `server dry-run / apply / rollback` 日志
3. `G1/G8` 外部阻塞责任板与正式窗口门禁口径持续对齐

## 本周 P1

1. `finance` 发票持久化与管理页承接
2. `members / products / events` 真实接口承接
3. `VRT` 从 `cashier / checkout` 扩到更多核心页面
4. `Phase/PRD/Runbook` 自动回写从试点扩到更多 Phase

## 本周 P2

1. `POS/Pad` 退款与真实 API 接线闭环
2. `checkout` 金额边界与更多优惠场景
3. 备份目录与外部导出物模板纪律治理

---

## 复签前硬门槛

### 必须满足

1. `G3` 退回条件至少完成 `2 项`
2. `G2 / G5 / G9` 条件项全部落地
3. 8 张行动卡均有负责人、截止和证据
4. `主计划 / 任务状态 / 复签检查表` 三者一致

### 当前判断

- `G1`: 🟡 唯一交付口径、主计划与复签总包已统一；`DNS + TLS` 已升格为外部硬阻塞，未解除前禁止正式发起
- `G2`: 🟢 外部阻塞责任化与敏感配置整改证据均已完成
- `G3`: 🟢 核心退回组已满足，`B1 + C1 + C2` 已完成，当前已满足 `3 项中的 3 项`
- `G4`: 🟢 `P-49` 验收写实与 `Phase/PRD/Runbook` 自动回写试点均已完成
- `G5`: 🟢 `POS/Pad` 与 `税务/发票` 两项已全部落地
- `G6`: 🟢 活动 / 营销 / 会员 / 门店联动入口、导航烟测、浏览器 PNG 证据已闭环
- `G7`: 🟢 miniapp 采购/退货高频链真实读写链、正式验收文档与浏览器 PNG 证据已闭环
- `G8`: 🟡 离线演练、预跑日志与正式窗口门禁已补齐；当前被 `DNS 无 A 记录 + m5-tls 缺失 + m5-tls.yaml 未就位` 阻断，待解阻后补真实窗口日志
- `G9`: 🟢 红黄绿状态板已建立

---

## 下一步

### 未来 48 小时优先级

1. 基于 [2026-07-19-v72-resign-bundle.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-v72-resign-bundle.md) 固化 `G1 / G8` 外部硬阻塞结论
2. 先解 `DNS / TLS / 正式域名` 外部资产，再补正式窗口 `server dry-run / apply / rollback` 运行日志
3. 复签前保持 `G1/G8` 与外部阻塞责任板口径完全一致

### 本状态页更新规则

- 每完成 1 张行动卡，必须更新一次
- 每次更新必须附带:
  - 证据文件
  - 当前结论
  - 是否影响复签

## 当前证据

- 外部阻塞责任清单: [EXTERNAL-BLOCKERS-OWNER-BOARD.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/EXTERNAL-BLOCKERS-OWNER-BOARD.md)
- 每周红黄绿状态板: [WEEKLY-RYG-STATUS-BOARD.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/WEEKLY-RYG-STATUS-BOARD.md)
- 唯一生产交付口径: [PRODUCTION-RELEASE-BUNDLE-POLICY.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/PRODUCTION-RELEASE-BUNDLE-POLICY.md)
- `PLAN-REV-B1` 任务卡: [2026-07-19-PLAN-REV-B1-pos-pad.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/requirement-cards/2026-07-19-PLAN-REV-B1-pos-pad.md)
- `PLAN-REV-B1` 浏览器验收: [2026-07-19-b1-cashier-browser-acceptance.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-b1-cashier-browser-acceptance.md)
- `PLAN-REV-B1` Playwright: [cashier-pos-minimal.spec.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/e2e/tests/cashier-pos-minimal.spec.ts)
- `PLAN-REV-B2` 任务卡: [2026-07-19-PLAN-REV-B2-tax-invoice.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/requirement-cards/2026-07-19-PLAN-REV-B2-tax-invoice.md)
- `PLAN-REV-C1` 浏览器验收: [2026-07-19-c1-checkout-browser-acceptance.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-c1-checkout-browser-acceptance.md)
- `PLAN-REV-C1` Playwright: [checkout-amount-l3.spec.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/e2e/tests/checkout-amount-l3.spec.ts)
- `PLAN-REV-C2` 验收记录: [2026-07-19-c2-vrt-acceptance.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-c2-vrt-acceptance.md)
- `PLAN-REV-C2` 原型说明: [VRT-ACCEPTANCE-PROTOTYPE.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/quality/VRT-ACCEPTANCE-PROTOTYPE.md)
- `PLAN-REV-C3` 签收文档: [2026-07-19-c3-p49-signoff.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-c3-p49-signoff.md)
- `G2` 敏感配置整改: [2026-07-19-g2-sensitive-config-remediation.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g2-sensitive-config-remediation.md)
- `G4` 自动回写试点: [2026-07-19-g4-writeback-pilot-acceptance.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g4-writeback-pilot-acceptance.md)
- `G4` 自动回写生成结果: [2026-07-19-g4-writeback-pilot-generated.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g4-writeback-pilot-generated.md)
- `G6` miniapp 联动正式验收: [2026-07-19-g6-miniapp-linkage-acceptance.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g6-miniapp-linkage-acceptance.md)
- `G6` miniapp 浏览器壳页与截图: [2026-07-19-g6-miniapp-browser-evidence.html](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g6-miniapp-browser-evidence.html) / [g6-browser-capture.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/scripts/g6-browser-capture.ts)
- `G7` miniapp 供应链路由注册: [app.config.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/miniapp/src/app.config.ts)
- `G7` miniapp 采购入口与跳转: [index.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/miniapp/src/pages/purchase-orders/index.tsx) / [index.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/miniapp/src/pages/member/index.tsx)
- `G7` miniapp 导航测试: [page-navigation.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/miniapp/src/page-navigation.test.ts)
- `G7` miniapp 供应链读模型: [supplychain-runtime.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/miniapp/src/supplychain-runtime.ts)
- `G7` miniapp 采购/退货详情接线: [index.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/miniapp/src/pages/purchase-orders/detail/index.tsx) / [index.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/miniapp/src/pages/return-orders/detail/index.tsx)
- `G7` miniapp 供应链读链测试: [supplychain-runtime.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/miniapp/src/supplychain-runtime.test.ts)
- `G7` miniapp 供应链写链接线: [index.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/miniapp/src/pages/purchase-orders/detail/index.tsx) / [index.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/miniapp/src/pages/return-orders/detail/index.tsx)
- `G7` miniapp 写链失败态收口: [supplychain-runtime.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/miniapp/src/supplychain-runtime.ts) / [page.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/miniapp/src/pages/purchase-orders/detail/page.test.ts) / [page.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/miniapp/src/pages/return-orders/detail/page.test.ts)
- 跨端 actor header 统一 helper: [index.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/sdk/src/index.ts) / [index.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/sdk/src/index.test.ts)
- 跨端 bootstrap 身份透传加固: [market-bootstrap.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/miniapp/src/market-bootstrap.ts) / [market-bootstrap.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/app/market-bootstrap.ts) / [bootstrap.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/tob-web/app/bootstrap.ts) / [bootstrap.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/bootstrap.ts)
- actor header 跨端断言测试: [market-bootstrap.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/miniapp/src/market-bootstrap.test.ts) / [market-bootstrap.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/app/market-bootstrap.test.ts) / [portal-snapshot.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/tob-web/app/portal-snapshot.test.ts) / [bootstrap.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/bootstrap.test.ts)
- `API` actor header 别名兼容: [tenant.middleware.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/tenant/tenant.middleware.ts) / [tenant.middleware.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/tenant/tenant.middleware.test.ts)
- admin view-model actor header 收编: [configuration-view-model.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/configuration-view-model.ts) / [rate-limits-view-model.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/rate-limits-view-model.ts) / [integration-orchestration-view-model.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/integration-orchestration-view-model.ts) / [identity-access-view-model.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/identity-access-view-model.ts)
- admin view-model actor header 断言: [configuration-view-model.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/configuration-view-model.test.ts) / [rate-limits-view-model.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/rate-limits-view-model.test.ts) / [integration-orchestration-view-model.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/integration-orchestration-view-model.test.ts) / [identity-access-view-model.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/identity-access-view-model.test.ts)
- 门店巡检/排班/库存页面 actor header 收口: [page.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/stores/[id]/inspection/page.tsx) / [page.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/stores/[id]/scheduling/page.tsx) / [page.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/stores/[id]/inventory/page.tsx)
- 门店巡检/排班/库存页面源码断言: [page.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/stores/[id]/inspection/page.test.ts) / [page.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/stores/[id]/scheduling/page.test.ts) / [page.test.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/stores/[id]/inventory/page.test.tsx)
- logistics route actor header 白名单透传: [proxy.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/api/logistics/proxy.ts) / [route.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/api/logistics/inspections/route.ts) / [route.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/api/logistics/clean-schedules/route.ts) / [route.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/api/logistics/material-requests/route.ts)
- logistics route actor header 子动作收口: [route.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/api/logistics/inspections/[id]/result/route.ts) / [route.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/api/logistics/inspections/[id]/remind/route.ts) / [route.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/api/logistics/clean-schedules/[id]/check-in/route.ts) / [route.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/api/logistics/clean-schedules/[id]/assign-area/route.ts) / [route.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/api/logistics/material-requests/[id]/approve/route.ts) / [route.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/api/logistics/material-requests/[id]/outbound/route.ts)
- logistics route actor header 断言测试: [route.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/api/logistics/inspections/route.test.ts) / [route.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/api/logistics/clean-schedules/route.test.ts) / [route.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/api/logistics/material-requests/route.test.ts) / [route.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/api/logistics/inspections/[id]/result/route.test.ts) / [route.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/api/logistics/inspections/[id]/remind/route.test.ts) / [route.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/api/logistics/clean-schedules/[id]/check-in/route.test.ts) / [route.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/api/logistics/clean-schedules/[id]/assign-area/route.test.ts)
- logistics proxy helper runtime 测试: [proxy.runtime.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/api/logistics/proxy.runtime.test.ts)
- logistics route test `NextRequest` 基座收口: [route.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/api/logistics/inspections/route.test.ts) / [route.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/api/logistics/clean-schedules/route.test.ts)
- DomainGovernanceDisplayModel 二次脱脂: [index.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/types/src/index.ts) / [index.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/types/src/index.test.ts) / [index.d.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/types/dist/index.d.ts) / [index.js](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/types/dist/index.js)
- 域名治理三端 Presenter 收口到 renderSections: [PortalDomainGovernanceCard.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/ui/src/components/PortalDomainGovernanceCard.tsx) / [DomainGovernanceCard.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/app/components/DomainGovernanceCard.tsx) / [DomainGovernancePanel.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/miniapp/src/components/DomainGovernancePanel.tsx)
- DomainGovernanceDisplayModel 三次脱脂: [index.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/types/src/index.ts) / [index.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/types/src/index.test.ts) / [index.d.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/types/dist/index.d.ts) / [index.js](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/types/dist/index.js)
- 域名治理顶层字段消费收口: [PortalDomainGovernanceCard.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/ui/src/components/PortalDomainGovernanceCard.tsx) / [DomainGovernanceCard.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/app/components/DomainGovernanceCard.tsx) / [DomainGovernancePanel.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/miniapp/src/components/DomainGovernancePanel.tsx) / [SettingsScreen.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/app/screens/settings/SettingsScreen.tsx)
- 域名治理 helper API 脱出公开面: [index.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/types/src/index.ts) / [index.d.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/types/dist/index.d.ts) / [index.js](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/types/dist/index.js)
- DomainGovernanceDisplayModel 四次脱脂: [index.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/types/src/index.ts) / [index.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/types/src/index.test.ts) / [index.d.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/types/dist/index.d.ts) / [index.js](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/types/dist/index.js)
- 域名治理 renderSections 内联收口: [index.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/types/src/index.ts) / [index.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/types/src/index.test.ts)
- 域名治理页面测试新口径: [HomeScreen.test.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/app/screens/home/HomeScreen.test.tsx) / [page.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/miniapp/src/pages/index/page.test.ts) / [page.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/miniapp/src/pages/member/page.test.ts) / [domain-governance-page.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/tob-web/app/domain-governance-page.test.ts) / [page.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/storefront-web/app/[...storeScope]/page.test.ts)
- DomainGovernanceDetailSlot/RenderSection 再脱脂: [index.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/types/src/index.ts) / [index.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/types/src/index.test.ts) / [index.d.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/types/dist/index.d.ts) / [index.js](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/types/dist/index.js)
- 域名治理 presenter 去 key 化: [DomainGovernanceCard.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/app/components/DomainGovernanceCard.tsx) / [DomainGovernancePanel.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/miniapp/src/components/DomainGovernancePanel.tsx) / [PortalDomainGovernanceCard.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/ui/src/components/PortalDomainGovernanceCard.tsx) / [DomainGovernanceCard.test.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/app/components/DomainGovernanceCard.test.tsx) / [PortalDomainGovernanceCard.test.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/ui/src/components/PortalDomainGovernanceCard.test.tsx) / [index.js](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/ui/dist/index.js)
- 域名治理 render item 命名收口: [index.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/types/src/index.ts) / [index.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/types/src/index.test.ts) / [DomainGovernanceCard.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/app/components/DomainGovernanceCard.tsx) / [PortalDomainGovernanceCard.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/ui/src/components/PortalDomainGovernanceCard.tsx) / [DomainGovernancePanel.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/miniapp/src/components/DomainGovernancePanel.tsx)
- 域名治理 item/items dist 对齐: [index.d.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/types/dist/index.d.ts) / [index.js](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/types/dist/index.js) / [index.js](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/ui/dist/index.js)
- 域名治理运行测试尝试: `node --import tsx --test apps/app/components/DomainGovernanceCard.test.tsx` 已发起但工具层长期挂起，已停止后台进程，当前以诊断与源码断言为准
- 域名治理共享 copy 常量收口: [index.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/types/src/index.ts) / [index.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/types/src/index.test.ts) / [DomainGovernanceCard.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/app/components/DomainGovernanceCard.tsx)
- 域名治理 copy 测试夹具对齐: [DomainGovernanceCard.test.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/app/components/DomainGovernanceCard.test.tsx) / [PortalDomainGovernanceCard.test.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/ui/src/components/PortalDomainGovernanceCard.test.tsx) / [HomeScreen.test.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/app/screens/home/HomeScreen.test.tsx)
- 域名治理 copy dist 对齐: [index.d.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/types/dist/index.d.ts) / [index.js](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/types/dist/index.js)
- 域名治理运行测试尝试 2: `node --import tsx --test packages/types/src/index.test.ts` 已发起但工具层再次 `RunningSkipped`，已停止后台进程，当前以诊断全绿与共享 copy 收口为准
- 域名治理状态摘要 formatter 收口: [index.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/types/src/index.ts) / [index.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/types/src/index.test.ts) / [index.d.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/types/dist/index.d.ts) / [index.js](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/types/dist/index.js)
- 域名治理页面测试剩余字面量收口: [SettingsScreen.test.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/app/screens/settings/SettingsScreen.test.tsx) / [HomeScreen.test.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/app/screens/home/HomeScreen.test.tsx) / [DomainGovernanceCard.test.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/app/components/DomainGovernanceCard.test.tsx) / [PortalDomainGovernanceCard.test.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/ui/src/components/PortalDomainGovernanceCard.test.tsx)
- `@m5/sdk` actor header 包导出对齐: [index.d.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/sdk/dist/index.d.ts) / [index.js](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/packages/sdk/dist/index.js)
- `G7` miniapp 供应链正式验收: [2026-07-19-g7-miniapp-supplychain-acceptance.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g7-miniapp-supplychain-acceptance.md)
- `G7` miniapp 浏览器验收记录: [2026-07-19-g7-miniapp-browser-acceptance.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g7-miniapp-browser-acceptance.md)
- 域名治理访问边界加固: [custom-domain.controller.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/saas-advanced/custom-domain.controller.ts) / [custom-domain.controller.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/saas-advanced/custom-domain.controller.test.ts)
- `custom-domain` 权限链 E2E: [custom-domain.e2e.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/saas-advanced/custom-domain.e2e.test.ts)
- 采购操作者绑定加固: [inventory-purchase.controller.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/inventory/inventory-purchase.controller.ts) / [inventory-purchase.controller.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/inventory/inventory-purchase.controller.test.ts)
- `G1` 唯一交付口径复签确认: [2026-07-19-g1-release-bundle-confirmation.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g1-release-bundle-confirmation.md)
- `G8` 切流演练证据: [2026-07-19-g8-cutover-drill-acceptance.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g8-cutover-drill-acceptance.md)
- `G8` 正式窗口执行包: [2026-07-19-g8-formal-window-execution-package.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g8-formal-window-execution-package.md)
- `G8` 外部阻塞报告: [2026-07-19-g8-external-blocker-report.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g8-external-blocker-report.md)
- `G8` 老板汇报版: [2026-07-19-g8-exec-brief.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g8-exec-brief.md)
- `G8` 外部催办模板: [2026-07-19-g8-external-escalation-templates.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g8-external-escalation-templates.md)
- `G8` 短消息生成脚本: [build-g8-short-escalation-messages.sh](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/scripts/build-g8-short-escalation-messages.sh)
- `G8` 最新 readiness 实跑: [00-formal-ready.log](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/00-formal-ready.log) / [READINESS-BLOCKERS.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/READINESS-BLOCKERS.md)
- `G8` 最新短消息产物: [ESCALATION-SHORT-MESSAGES.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/ESCALATION-SHORT-MESSAGES.md)
- `G8` 复签入口页: [ONE-PAGE-INDEX.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/ONE-PAGE-INDEX.md)
- `G8` 正式窗口就绪入口: [run-g8-formal-window-ready.sh](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/scripts/run-g8-formal-window-ready.sh)
- `G1~G9` 复签总包: [2026-07-19-v72-resign-bundle.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-v72-resign-bundle.md)
