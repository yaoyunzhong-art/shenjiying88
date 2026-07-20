# Phase Kickoff · P-54 Checkout 收入主链

---

## Phase 信息
- **Phase 编号**: P-54
- **Phase 名称**: Checkout 收入主链闭环
- **预计开始**: 2026-07-20
- **预计结束**: 2026-07-23
- **预计天数**: 4 天

## Scope (范围)
### In Scope
- `storefront-web` checkout 创建真实订单
- `storefront-web` h5 payment/result 真状态查询
- `transactions -> finance` 支付/退款自动落账
- `storefront-web/finance` 最小真实摘要与流水接线

### Out of Scope
- 第三方支付网关商业正式接入
- 完整对账大屏与老板驾驶舱
- 税务/发票全量产品化重构

## 验收标准
- [ ] Checkout 成功创建真实订单并返回 `orderId`
- [ ] H5 支付页金额取自真实订单聚合
- [ ] 支付结果页不再依赖前端 `status=success`
- [ ] 支付/退款会自动形成财务流水
- [ ] storefront 与 api 相关回归通过

## Risks (风险)
| 风险 | 等级 | 缓解措施 |
|---|---|---|
| storefront 老测试依赖假流程 | 高 | 先补测试再切真链 |
| finance 自动落账影响现有行为 | 高 | 只接最小 revenue/refund 两条记账入口 |
| transactions 与 finance 依赖收口不干净 | 中 | 先跑 controller/service 回归，再扩大页面接线 |

## 参与角色
- **Phase Owner**: 树哥
- **Champion**: 大飞哥
- **Approver (≥2)**: 待回填
- **Reviewer**: 待回填

## 关联 RFC
- PRD-017 · Checkout 收入主链闭环

## 开发流程
1. `PRD/Kickoff`: 先签发文档，再动代码
2. `Scan`: 读取真实文件与测试入口，补当前缺口清单
3. `Build`: 按 `checkout -> payment -> finance` 顺序分段落地
4. `Verify`: 每段完成后立即跑对应测试与诊断
5. `Acceptance`: 回写验收卡、命令、结果、风险
6. `Bundle`: 收代码、配置、证据、回滚四要素

## 签字
- [x] Phase Owner: 树哥 日期: 2026-07-20
- [x] Champion: 大飞哥 日期: 2026-07-20
- [ ] Approver 1: _____________ 日期: _______
- [ ] Approver 2: _____________ 日期: _______

> 签字完成后，此文档作为 P-54 的唯一 kickoff 入口，不再另起并行主线。
