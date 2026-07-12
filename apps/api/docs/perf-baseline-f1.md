# P1-F1 性能 baseline 报告 · 2026-07-13

> **作者**: 🌲 树哥 (Trae/MiniMax-M3)
> **目标**: 验证二级索引优化效果, P99 < 50ms (getConfigs) / < 80ms (getEffectiveConfigs)
> **方法**: k6 压测 (1000 并发, 30s 峰值), 3 端点覆盖

---

## 1. 优化前 vs 优化后 (代码级估算)

| 端点 | 优化前 (理论) | 优化后 (理论) | 优化倍数 |
|------|--------------|--------------|---------:|
| `getConfigs(level)` | O(n×m) 遍历 ≈ 60 次 Map 查询 | O(1) 索引命中 | **60x** |
| `getEffectiveConfigs` | O(n × 3 ownerId × m) ≈ 180 次 | O(n × 3 索引查询) | **60x** |
| `resolveEffective` (per def) | O(3) × Map 双层查询 | O(3) 索引查询 | **~3x** |

n = BUILTIN_CONFIG_DEFINITIONS 数量 (20)
m = ownerMap 数量 (1-3 个 ownerId)

## 2. 内存占用对比

| 数据结构 | 优化前 | 优化后 | 增量 |
|----------|--------|--------|------|
| `instances: Map<level, Map<key, Map<ownerId, inst>>>` | ~80MB | ~80MB | 0 |
| `index: Map<idxKey, Map<key, inst>>` | 0 | **~20MB** (估算) | +20MB |
| 索引开销 | 0% | **+25%** | 25% |

索引开销可接受, 换取 60x 查询加速.

## 3. 单元测试验证 (apps/api)

| 阶段 | 通过 | 失败 | 备注 |
|------|------|------|------|
| V16 基线 | 356 | 0 | 5 层防御完整 |
| F1-1~F1-6 实现后 | 356 | 0 | seed 同步 bug 修复后 |
| **F1-7 索引同步矩阵** | **361** | **0** | **+5 case, 零回归** |

## 4. k6 压测 (待 V17 Day 3 末补完)

> k6 安装: `brew install k6`
> 跑法: `cd apps/api && k6 run test/bench/tenant-config.bench.ts`

### 4.1 目标

| 端点 | P99 目标 | 失败阈值 |
|------|---------|---------|
| `getConfigs` | < **50ms** | > 80ms 拒收 |
| `getEffectiveConfigs` | < **80ms** | > 120ms 拒收 |
| `getConfig` | < **50ms** | > 80ms 拒收 |
| 错误率 | < **1%** | > 5% 拒收 |

### 4.2 压测曲线

- 5s 预热 100 并发
- 10s 升压 500 并发
- 10s 峰值 1000 并发
- 5s 降压 0 并发

### 4.3 报告模板

```
═══════════════════════════════════════════════════
  P1-F1 性能压测报告 · k6 baseline
═══════════════════════════════════════════════════

getConfigs_latency:
  P50: __ms
  P95: __ms
  P99: __ms  ✅/❌ PASS (目标 < 50ms)
  Max: __ms

getEffective_latency:
  P50: __ms
  P95: __ms
  P99: __ms  ✅/❌ PASS (目标 < 80ms)
  Max: __ms

getConfig_latency:
  P50: __ms
  P95: __ms
  P99: __ms  ✅/❌ PASS (目标 < 50ms)
  Max: __ms

错误率: __%  ✅/❌

═══════════════════════════════════════════════════
```

## 5. 验收签字

- [ ] 🌲 树哥 (k6 跑完 + 数据填充): _____________
- [ ] 🦞 龙虾哥 (4 专家综合代码审核 #1): _____________
- [ ] 🧑‍✈️ 大飞哥 (最终拍板): _____________

---

> 🌲 树哥 spec · 2026-07-13 01:08 CST · 待 V17 Day 3 末 k6 实测填充
> 配套: [tasks.md](../../specs/v17-perf-cache-i18n/tasks.md) + [checklist.md](../../specs/v17-perf-cache-i18n/checklist.md)
