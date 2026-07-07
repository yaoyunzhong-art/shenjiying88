# 🦞 龙虾哥 HEARTBEAT — 测试矩阵

## 全量测试矩阵

| 日期 | 总测试数 | 通过 | 失败 | TSC错误 | 0-test文件 | 耗时 | 状态 |
|---|---|---|---|---|---|---|---|
| 2026-07-08 | 25,075 | 24,466 | 609 | 59 | 128 | 2m43s | ⚠️ 有失败 |

## @m5/api 详细

| 日期 | 通过文件数 | 通过断言 | 失败文件数 | 失败断言 |
|---|---|---|---|---|
| 2026-07-08 | 1,191 | 24,466 | 85 | 609 |

## 失败摘要 (2026-07-08)

- **foundation 治理模块**: 大量 role test 全量失败 (~16个文件，~160+ 失败) — 疑似 governance 重构后 mock 未同步
- **portal / workbench / webhook / market**: controller/role test 大量失败 (~100+ 失败) — 接口变更
- **license-renewal / license-package**: 全量失败 (~60 失败) — 接口签名变更
- **ai-diagnosis.simulator**: 29/29 全量失败
- **common (filter, governance, guard)**: ~14 失败 — 底层拦截器变更
- **multimodal-fusion / health-dashboard / permission**: 模块级大量失败
- 59 TSC errors (主要来自 spec/test 文件，非生产代码)
- 128 个空测试文件需要填充
- ✅ shenjiying-mobile: 239/239 全绿

## 备注

- 全量回归 `full-regression.test.ts` 的 34 项检测均为 false negative（报告器 bug），不影响实际模块测试
- 15/16 pnpm 任务缓存命中（仅 `@m5/api` 实际执行）
