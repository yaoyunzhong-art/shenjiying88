# Phase Kickoff · P-54 Phase 90 Storefront 财务页真数据化

---

## Phase 信息
- **Phase 编号**: P-54 / Phase 90
- **Phase 名称**: Storefront 财务页真数据化
- **预计开始**: 2026-07-20
- **预计结束**: 2026-07-20
- **预计天数**: 1 天

## Scope
### In Scope
- `finance/page.tsx` 去 mock
- 新增 storefront finance helper
- 财务摘要、流水、趋势接真数据
- 页面三态与重试
- finance page 定向回归
- 验收卡与台账回写

### Out of Scope
- admin finance 页面
- 后端 finance 大改
- settlement / invoice / reconciliation 改造
- Prisma 持久化重构

## 验收标准
- [ ] 页面摘要来自真实 `revenue/summary`
- [ ] 对账列表来自真实 `ledgers`
- [ ] 趋势图来自真实 ledger 聚合
- [ ] 页面具备 loading / error / empty / retry
- [ ] `app/finance/page.test.ts` 通过
- [ ] 验收卡和台账已回写

## Risks
| 风险 | 等级 | 缓解措施 |
|---|---|---|
| 当前 ledger 数据结构与旧 UI 字段不一致 | 高 | 抽 helper 做单点映射 |
| 页面无数据时被误判为失败 | 中 | 区分 empty 与 error |
| 趋势图时间维度口径漂移 | 中 | helper 内统一近 6 个月 bucket |

## 参与角色
- **Phase Owner**: 树哥
- **Champion**: 大飞哥
- **Reviewer**: 待回填

## 关联文档
- PRD: `docs/knowledge/prd/prd-storefront-finance-page-p54.md`
- 需求卡: `docs/knowledge/requirement-cards/2026-07-20-P54-storefront-finance-page.md`
- 上游 PRD: `docs/knowledge/prd/prd-transactions-finance-auto-ledger-p54.md`

## 开发流程
1. `PRD/Kickoff`: 文档先签发
2. `Scan`: 锁定 `finance/page.tsx` 与 finance API 口径
3. `Build`: 新建 helper 并改页面
4. `Verify`: 跑 finance page 定向测试与 diagnostics
5. `Acceptance`: 回写验收卡和对齐台账
6. `Bundle`: 交付代码、命令、证据、回滚

## 签字
- [x] Phase Owner: 树哥 日期: 2026-07-20
- [x] Champion: 大飞哥 日期: 2026-07-20
- [ ] Reviewer: _____________ 日期: _______
