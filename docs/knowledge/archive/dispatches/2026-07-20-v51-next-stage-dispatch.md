# 龙虾哥下一阶段调度指令 · V5.1 Top10 收口批次

> 签发时间: 2026-07-20 23:40
> 发令方: 龙虾哥
> 执行方: 树哥
> 指令性质: 必须执行
> 依据文档: [2026-07-20-v51-top10-alignment-ledger.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/task-log/2026-07-20-v51-top10-alignment-ledger.md)

---

## 一、总判断

当前 `V5.1 当前优先级最高 10 项开发任务` 核对结果为：

- `9/10` 已完成
- `1/10` 未完成

未完成项是：

- `storefront-web/finance` 真数据摘要与真实流水接线

因此下一阶段不得分散火力，必须继续沿 `P-54` 单主线推进，先把第 10 项打穿，再补跨模块联调证据。

---

## 二、执行目标

### 指令 1

树哥立即补齐 `apps/storefront-web/app/finance/page.tsx` 真数据化改造，替换当前所有 mock 摘要与 mock 流水。

### 指令 2

如 `storefront` 当前缺少可复用 finance helper，则必须先补最小 helper / proxy / SDK 封装，再接页面，不允许页面内散写 fetch。

### 指令 3

页面必须具备产品态三态体验：

- 加载中
- 加载失败可重试
- 空数据可解释

### 指令 4

完成页面接线后，必须补回归测试，至少覆盖：

- 摘要数据显示真实值
- 流水列表使用真实数据源
- 错误态与重试
- 空态

### 指令 5

完成页面接线后，必须补跨模块联调证据，至少覆盖：

- checkout 创建订单
- payment 支付成功
- finance 页面出现对应收入流水
- refund 完成后 finance 页面出现对应退款流水

---

## 三、必须遵守的开发流程

树哥下一步执行时，必须继续遵守以下顺序：

1. 先补 `PRD / requirement card / kickoff`
2. 再做代码扫描和接线设计
3. 再做实现
4. 再跑定向测试和诊断
5. 最后回写验收卡与台账

不得跳过文档阶段，不得只交代码不交证据，不得改成散点开发。

---

## 四、建议文件落点

### 需要新增或更新的文档

- `docs/knowledge/prd/` 下新增 finance page 真数据化 PRD
- `docs/knowledge/requirement-cards/` 下新增对应需求卡
- `docs/phases/p54/` 下新增对应 kickoff
- `docs/knowledge/acceptance/2026-07-20-p54-checkout-revenue-acceptance.md` 回写 finance 页面证据

### 需要优先扫描和改造的代码

- `apps/storefront-web/app/finance/page.tsx`
- `apps/storefront-web/lib/`
- `apps/api/src/modules/finance/`
- 如有需要，补 `apps/storefront-web/app/api/` 代理层

---

## 五、验收门槛

满足以下条件，龙虾哥才确认 Top10 全量闭环：

1. `storefront finance` 页面已完全去 mock
2. 收入与退款流水均可在页面侧查询到
3. 真实摘要与真实流水口径一致
4. 页面三态与失败重试齐全
5. 有测试命令、有结果、有验收卡回写
6. 与 `P-54` 主验收卡状态一致

---

## 六、树哥后续动作要求

- 先汇报 PRD 和实施方案
- 再执行改造
- 每完成一枪就同步证据
- 完成后再次向龙虾哥提交成果包

---

> 指令生效: 即刻
> 归档路径: `docs/knowledge/archive/dispatches/2026-07-20-v51-next-stage-dispatch.md`
