# 慢性fail状态 (2026-07-13 00:02)

## 当前状态

| 模块 | fail/total | 状态 | 备注 |
|:-----|:----------:|:----:|:-----|
| points | 0/295 ✅ | 已修复 | 10个E2E validation + behaviour fix |
| anomaly-detector | 0/271 ✅ | 已修复 | sigma/IQR min-history guard, configure fix |
| health | 0/301 ✅ | 已修复 | event-bus/queue-producer在默认check中包含 |
| ai-model-config | 1 suite fail | 已知 | controller.test.ts require()无法解析.ts(MODULE_NOT_FOUND) |

## 累计修复

- **points**: 10 fail
- **anomaly-detector**: 10 fail
- **health**: 2 fail
- **ai-model-config**: 2 test fail (reviewCode → submitReview, deleteConfig mock state)
- **总计**: 24 fail → 1 suite fail ✅
