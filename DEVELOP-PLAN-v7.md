# 🚀 M5 科学四阶段开发计划 V7.2

> 日期: 2026-07-19
> 版本: V7.2
> 依据:
> - [develop-plan-v7-54-expert-review.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/expert-team/2026-07-19/develop-plan-v7-54-expert-review.md)
> - [V7.2-RESIGN-CHECKLIST.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/V7.2-RESIGN-CHECKLIST.md)
> - [V7.2-7DAY-EXECUTION-SCHEDULE.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/V7.2-7DAY-EXECUTION-SCHEDULE.md)
> - [TASKS_STATUS.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/TASKS_STATUS.md)

---

## 一句话目标

将项目从“旧版专家驱动模板计划”推进到“生产阻塞清零 + 核心经营链闭环 + 复签可执行”的真实上线计划。

---

## 当前判断

| 维度 | 当前判断 |
|------|----------|
| 总体进度 | `70%~80%`，平台骨架成型，正处于核心链路收口阶段 |
| 当前结论 | `🟡 可准备复签，暂不建议正式发起` |
| 已闭环 | `PLAN-REV-A1 / A2 / B1 / B2 / C1 / C2 / C3 / D1` |
| 最大阻塞 | `G1` 最终复签确认与外部资产落地 |
| 剩余收尾 | `G6 / G7 / G8` 运行类证据 |

---

## 核心原则

1. 正式生产只认 `版本化 release bundle`
2. 发布主链固定为 `render -> preflight -> dry-run -> apply -> verify -> rollback`
3. 核心业务必须从“代码测试”升级到“浏览器/运行证据”
4. 外部阻塞必须 `责任人化 + 证据化 + 超时升级`
5. DTO、Swagger、Service、Controller、持久化与测试必须同步闭环

---

## 四阶段计划

## Phase A · 生产阻塞清零

目标: 先把正式发布口径、外部资产和高敏配置收硬，避免“功能看似齐全、上线仍不可执行”。

### P0

| 任务 | 等级 | 验收标准 |
|------|:---:|----------|
| `DNS/TLS/域名` 外部阻塞责任人化 | P0 | 每项阻塞均有负责人、证据物、SLA 与超时升级 |
| `release bundle` 成为唯一生产交付口径 | P0 | 不认源码清单、不认 `latest`、不认临时 `kubectl apply` |
| `ConfigMap/Secret` 回到模板口径 | P0 | 不再保留 `DATABASE_URL` 与真实密码明文 |
| `dry-run / apply / rollback` 演练链补证 | P0 | 至少具备一套可复核的运行证据包 |

### 当前状态

- `PLAN-REV-A1`: ✅
- `PLAN-REV-A2`: ✅
- `G1`: 🟡
- `G2`: 🟢
- `G8`: 🟡

## Phase B · 核心业务闭环补齐

目标: 把一线经营链和财务链从“有页面/有代码”推进到“有最小可演示链和任务卡”。

### P1

| 任务 | 等级 | 验收标准 |
|------|:---:|----------|
| `POS/Pad` 一线经营链补齐 | P1 | 至少 1 条选品 -> 会员 -> 支付 -> 成功链浏览器可跑通 |
| `税务/发票` 显式子任务流 | P1 | `finance` 主线及 6 个子流显式落卡 |
| `members/products/events` 真实接口承接 | P1 | 页面与真实接口开始收口，不停留在 mock |
| `finance` 发票持久化与管理页承接 | P1 | 从任务卡推进到页面/持久化/报表承接 |

### 当前状态

- `PLAN-REV-B1`: ✅
- `PLAN-REV-B2`: ✅
- `G5`: 🟢

## Phase C · 工程门禁收硬

目标: 把“可测试”升级成“可验证、可回归、可签收”。

### P1 / P2

| 任务 | 等级 | 验收标准 |
|------|:---:|----------|
| `checkout` 金额链 L3 浏览器验收 | P1 | 运费/优惠券/应付金额浏览器级可回归 |
| `VRT` 视觉验收原型 | P2 | 至少 2 个关键页面、双设备基线与 diff 报告 |
| `P-49` 指标/文档/签收标准写实 | P1 | 有指标面、文档标准、圈梁测试执行结果 |
| `Phase/PRD/Runbook` 自动回写试点 | P2 | 至少 2 个 Phase 可自动生成回写结果 |

### 当前状态

- `PLAN-REV-C1`: ✅
- `PLAN-REV-C2`: ✅
- `PLAN-REV-C3`: ✅
- `G3`: 🟢
- `G4`: 🟢

## Phase D · 上线前签收

目标: 将计划、周板、复签表、运行证据统一成可交付的复签总包。

### P0 / P1

| 任务 | 等级 | 验收标准 |
|------|:---:|----------|
| 每周红黄绿状态板 | P0 | 外部阻塞与内部任务分栏管理 |
| `G1~G9` 复签总包 | P1 | 单入口聚合 Gate 状态、证据与阻塞 |
| `G6 / G7 / G8` 收尾证据 | P1 | 联动验收链、miniapp 高频链、运行演练证据齐套 |

### 当前状态

- `PLAN-REV-D1`: ✅
- `复签总包`: ✅ 已备包，未正式发起

---

## 54 位专家回写后的 8 张行动卡

| 卡片ID | 动作 | 截止 | 当前状态 |
|--------|------|------|:--------:|
| PLAN-REV-A1 | `DNS/TLS/正式域名` 责任人、证据物、超时升级机制 | 2026-07-20 | ✅ |
| PLAN-REV-A2 | `release bundle` 唯一生产交付口径 | 2026-07-20 | ✅ |
| PLAN-REV-B1 | 单列 `POS/Pad` 一线经营链 | 2026-07-21 | ✅ |
| PLAN-REV-B2 | `税务/发票` 升级为显式子任务流 | 2026-07-21 | ✅ |
| PLAN-REV-C1 | `checkout` L3 浏览器验收 | 2026-07-23 | ✅ |
| PLAN-REV-C2 | `VRT` 视觉验收原型 | 2026-07-24 | ✅ |
| PLAN-REV-C3 | `P-49` 指标/文档/签收标准 | 2026-07-24 | ✅ |
| PLAN-REV-D1 | 每周红黄绿状态板 | 2026-07-20 | ✅ |

---

## 当前 Gate 判断

| Gate | 状态 | 当前事实 |
|------|:----:|----------|
| G1 | 🟡 | 唯一生产交付口径已建立，待最终复签确认与外部资产落地 |
| G2 | 🟢 | 外部阻塞责任化与敏感配置整改证据已齐 |
| G3 | 🟢 | `B1 + C1 + C2` 已满足 `3/3` |
| G4 | 🟢 | `P-49` 写实与自动回写试点已完成 |
| G5 | 🟢 | `POS/Pad` 与 `税务/发票` 证据已齐 |
| G6 | 🟡 | 待补活动/营销/会员/门店联动验收链 |
| G7 | 🟡 | 待补 miniapp 供应链/会员高频链证据 |
| G8 | 🟡 | 待补 `dry-run / apply / rollback` 运行证据 |
| G9 | 🟢 | 管理视图已建立 |

---

## 未来 48 小时优先级

1. 完成 `G1` 最终复签确认材料
2. 完成 `G8` 演练证据包
3. 补 `G6` 联动验收链
4. 补 `G7` miniapp 高频链证据
5. 在 [2026-07-19-v72-resign-bundle.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-v72-resign-bundle.md) 上更新总体结论

---

## 退出条件

发起 `G1~G9` 正式复签前，必须同时满足:

1. `G3` 至少完成 `2 项`，当前已满足 `3/3`
2. `G2 / G5 / G9` 条件项全部落地，当前已满足
3. `G1 / G6 / G7 / G8` 仅剩窗口确认或运行类补证，不再有结构性缺口
4. `主计划 / 任务状态 / 复签检查表 / 复签总包` 四者口径一致

---

## 修改记录

| 日期 | 修改人 | 内容 |
|:----:|:------:|------|
| 2026-07-19 | 树哥 | 将旧版 `V7` 模板重写为当前 `V7.2` 执行态，对齐行动卡、Gate、周排期与复签总包口径 |
