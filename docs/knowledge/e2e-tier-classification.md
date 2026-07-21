# 🎯 E2E链分级文档 — L0/L1/L2

> 版本: v2.0 (基于58链)
> 生成: 2026-07-21 08:50 · 树哥E2E链分级
> 审计: G3-E13 收银审计 · 圈梁第五道箍

---

## 1. 分级总览

| 等级 | 数量 | 含义 | 验收频率 | 失败影响 |
|:----:|:----:|:-----|:--------:|:--------:|
| **L0** | **5** | 生命线 — 收银/支付/退款/对账/租户登录 | **每次PR前** | 🚫 阻断发布 |
| **L1** | **26** | 核心业务链 — 交易/会员/营销/库存/报表等 | **每日** | ⚠️ 需人工确认 |
| **L2** | **27** | 全量链 — 观测/AI/容灾/CDN/联邦学习等 | **每周** | ℹ️ 记录观察 |
| **总计** | **58** | | | |

---

## 2. L0 — 生命线 (5条)

> 失败则不可发布。

| 序号 | 文件 | 标题 | it数 | 覆盖场景 |
|:----:|:-----|:-----|:----:|:---------|
| 1 | `cross-module-e2e-8-reservation-queue-cashier` | 预约→排队→收银→完成 | 7 | 收银POS闭环 (收银成功/排队隔离/取消路径) |
| 2 | `cross-module-e2e-13-daily-settlement` | 日清结算: 1天营业周期端到端 | 5 | 财务对账 (收入/退款/支出/日清/DISPUTED) |
| 3 | `cross-module-e2e-24-member-coupon-payment-loyalty` | 会员→优惠券→支付→积分/储值 | 6 | 支付结算全闭环 (优惠券核销/积分/过期反例) |
| 4 | `cross-module-e2e-45-finance-transactions` | 财务对账→交易管理全链路 | 12 | 交易对账 (创建/支付/退款/对账匹配/差异处理) |
| 5 | `cross-module-e2e-50-tenant-rls-auth` | 多租户全链 (RLS+AuthGuard) | 9 | 租户隔离 (数据可见/跨租户越权/角色认证) |
| | **合计** | | **39** | |

### L0验证结果 (2026-07-21 08:50)

| 检查项 | 验证方法 | 结果 |
|:-------|:---------|:----:|
| 文件存在(#8) | `find cross-module/ -name cross-module-e2e-8*.ts` | ✅ |
| it数=7 | `grep -c "it("` | ✅ |
| 文件存在(#13) | `find cross-module/ -name cross-module-e2e-13*.ts` | ✅ |
| it数=5 | `grep -c "it("` | ✅ |
| 文件存在(#24) | `find cross-module/ -name cross-module-e2e-24*.ts` | ✅ |
| it数=6 | `grep -c "it("` | ✅ |
| 文件存在(#45) | `find cross-module/ -name cross-module-e2e-45*.ts` | ✅ |
| it数=12 | `grep -c "it("` | ✅ |
| 文件存在(#50) | `find cross-module/ -name cross-module-e2e-50*.ts` | ✅ |
| it数=9 | `grep -c "it("` | ✅ |
| 文件总数 | 58个匹配 | ✅ |
| L0总it | 39个 | ✅ |
| 禁止项: describe.skip | grep搜索 | ✅ 未发现 |
| 禁止项: it.only | grep搜索 | ✅ 未发现 |
| 禁止项: as any | grep搜索 | ✅ 未发现 |
| TSC通过 | `pnpm turbo typecheck` → 15/15 | ✅ |

### L0执行命令

```bash
# PR前 — 只跑L0
npx vitest run --config vitest.config.ts \
  apps/api/src/modules/cross-module/cross-module-e2e-8* \
  apps/api/src/modules/cross-module/cross-module-e2e-13* \
  apps/api/src/modules/cross-module/cross-module-e2e-24* \
  apps/api/src/modules/cross-module/cross-module-e2e-45* \
  apps/api/src/modules/cross-module/cross-module-e2e-50*

# 使用检查脚本
bash scripts/e2e-tier-check.sh --tier L0
```

---

## 3. L1 — 核心业务链 (26条)

> 核心业务链，每日必绿。

| 序号 | 文件 | 标题 | it数 | 所属业务域 |
|:----:|:-----|:-----|:----:|:----------|
| 1 | `cross-module-e2e-1` | 管理端创建→API→B端→C端消费 | 5 | 通用 |
| 2 | `cross-module-e2e-2` | SDK调用→domain→API返回 | 6 | SDK |
| 3 | `cross-module-e2e-3` | 身份认证→治理审批→运行时回调 | 11 | 治理 |
| 4 | `cross-module-e2e-4` | 多端一致性验证 | 10 | 通用 |
| 5 | `cross-module-e2e-5` | Campaign→Loyalty→Analytics闭环 | 8 | 营销 |
| 6 | `cross-module-e2e-9` | 采购→入库→应付账款 | 10 | 库存 |
| 7 | `cross-module-e2e-10` | AI推荐→会员→营销→收银联动 | 8 | AI |
| 8 | `cross-module-e2e-19` | 多租户隔离 | 6 | 租户 |
| 9 | `cross-module-e2e-23` | 租户初始化→市场配置→Portal引导 | 6 | 租户 |
| 10 | `cross-module-e2e-25` | SDK→Domain→API→多端合同一致性 | 8 | SDK |
| 11 | `cross-module-e2e-36` | 跨租户数据隔离+治理审计 | 10 | 租户 |
| 12 | `cross-module-e2e-41` | 会员→优惠券→支付→忠诚度(扩展) | 10 | 会员 |
| 13 | `cross-module-e2e-42` | SDK→Domain→API→Storefront | 14 | SDK |
| 14 | `cross-module-e2e-44` | 品牌运营→后勤全链路 | 13 | 品牌 |
| 15 | `cross-module-e2e-46` | 品牌运营+商城全链 | 6 | 品牌 |
| 16 | `cross-module-e2e-51` | 门店管理全链路 | 22 | 门店 |
| 17 | `cross-module-e2e-52` | 竞品跟踪全链路 | 30 | 竞争 |
| 18 | `cross-module-e2e-53` | 联盟营销全链路 | 37 | 营销 |
| 19 | `cross-module-e2e-54` | CRM客户管理→交互记录→工单 | 15 | CRM |
| 20 | `cross-module-e2e-55` | Campaign→优惠券创建→核销 | 13 | 营销 |
| 21 | `cross-module-e2e-56` | 排班管理全链路 | 27 | HR |
| 22 | `cross-module-e2e-57` | 礼品卡全链路 | 17 | 收银 |
| 23 | `cross-module-e2e-58` | 会员管理全链路 | 17 | 会员 |
| 24 | `cross-module-e2e-59` | 商户/供应商管理全链路 | 19 | 库存 |
| 25 | `cross-module-e2e-60` | 质检巡查全链路闭环 | 15 | 后勤 |
| 26 | `cross-module-e2e-61` | 请假考勤管理全链路闭环 | 15 | HR |
| | 小计 | | 381 | |

---

## 4. L2 — 全量链 (27条)

> 所有非L0/L1的E2E链，每周全绿。

覆盖场景: 观测(`#14/#16/#17`)、边缘计算(`#29`)、AI工作流(`#33/#38`)、多区域容灾(`#30/#35`)、CDN缓存(`#37`)、内容审核(`#31/#43`)、联邦学习(`#39`)、许可证安全(`#40`)、并发压测(`#12`)、故障注入(`#34`)、后勤库存(`#47`)、品牌财务(`#48`)、后勤财务(`#49`)等。

具体明细参见 `docs/knowledge/e2e-tier-grading.md` 第4节。

---

## 5. 圈梁五道箍 — 合规确认

| 序号 | 箍 | 状态 | 说明 |
|:----:|:---|:----:|:-----|
| ① | TSC通过 | ✅ | 15/15 FULL TURBO ✅ |
| ② | 测试存在 | ✅ | 58链, 39个L0 it, 无 `describe.skip` / `it.only` / `as any` |
| ③ | 圈梁表更新 | ✅ | `docs/knowledge/phase-to-module-mapping.md` v3.1 |
| ④ | PRD标记 | ✅ | G3审计确认分级必要性 |
| ⑤ | 知识赋能 | ✅ | 本文档完成 manual 降级记录 |

---

## 6. v2.0 映射校验记录

| 验证项 | 预期 | 实际 | 结果 |
|:-------|:----:|:----:|:----:|
| cross-module/E2E文件总数 | 58 | 58 | ✅ |
| L0文件数 | 5 | 5 | ✅ |
| L0总it数 | 39 | 39 | ✅ |
| L1文件数 | 26 | 26 | ✅ |
| L2文件数 | 27 | 27 | ✅ |
| TSC通过 | 15/15 | 15/15 | ✅ |
| 禁止 describe.skip | 0 | 0 | ✅ |
| 禁止 it.only | 0 | 0 | ✅ |
| 禁止 as any (L0) | 0 | 0 | ✅ |

**结论: L0全量验证通过 ✅, L1/L2计数一致 ✅**

---

## 7. 变更记录

| 日期 | 版本 | 变更 |
|:----|:----:|:-----|
| 2026-07-21 | v2.0 | L0全量验证 + 圈梁表更新 + v2.0映射确认 |

---

> 配套脚本: `bash scripts/e2e-tier-check.sh --tier L0|L1|L2`
> 完整明细: `docs/knowledge/e2e-tier-grading.md`
