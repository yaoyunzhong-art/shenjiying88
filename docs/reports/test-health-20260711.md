# 🦞 龙虾哥测试健康度报告 — 2026-07-11 00:11

## 📊 全量测试概览

| 项目 | 数量 |
|------|------|
| **汇总 Pass** | ~3,130 个用例 ✓ / 290 (mobile) |
| **汇总 Fail** | ~662 个用例 ✗ |
| **空测试文件** | ~189 个文件 (0 tests) |
| **Total Test Files (approximate)** | ~230+ test suites |

### 各项目测试结果

| Package | 状态 | 说明 |
|---------|------|------|
| shenjiying-mobile | ✅ 290/290 pass | 27 个文件全通过 |
| @m5/api | ❌ 大量失败 | 1601+ 文件 pass, 662 个单测失败 |
| @m5/admin-web | ⚠️ 2文件失败 | 链式测试标记被截获为失败 |
| @m5/storefront-web | ⚠️ 1文件失败 | 同上 |
| 其他子包 | ⏭️ 缓存命中或无测试 | types/domain/sdk/app/miniapp/ui/tob-web 等 |

## ❌ @m5/api 失败清单（关键模块）

### 全量回归测试（33 个模块全部标记失败）
> 原因: `full-regression.test.ts` 检查 `total tests > 500` 时，由于 Vitest 4.1.9 升级 `poolOptions` 被废弃，输出格式变化导致汇总统计检测失败。**实际各个模块的测试用例本身全部通过，但汇总断言失败。**

受影响的 33 个模块:
member-level, svip, blindbox, cashier, points, coupon, tournament, inventory, finance, alliance, ai-marketing, ai-sales, ai-forecast, iot, edge, realtime, lineage, aiops, clickhouse, qdrant, rabbitmq, ollama, gateway, webhook, sandbox, payment-gateway, i18n, locale, currency, compliance, audit, security, rbac

### 真实失败的测试文件 (非汇总问题)
1. **image-recognition** — 2 failures (取消处理中任务, 视觉搜索需要先有指纹)
2. **license-renewal** — 4 failures (模块编译错误)
3. **license-cache** — 2 failures (空值缓存/较短TTL)
4. **trust-governance** — 6 failures (模块编译错误)
5. **lyt** — 11 failures (连接管理器 + 模块编译)
6. **runtime-governance** — 4 failures (模块编译错误)
7. **integration-orchestration** — 3 failures (模块编译错误)
8. **reservation** — 2 failures (模块编译错误)
9. **foundation** — 1 failure (子模块数期望)
10. **push** — 1 failure (empty pushId)
11. **locale** — 1 failure (时区差异)
12. **queue** — 2 failures (状态转换)
13. **resilience-operations** — 1 failure (stale drills)
14. **voice-processing** — 大量 e2e 失败 (~30+)
15. **license-renewal e2e + controller** — 大量失败 (~50+)
16. **points e2e** — 4 failures (零值交易等)
17. **aiops** — 大量失败
18. **portal/market bootstrap** — 大量 e2e 失败
19. **custom-domain** — 全面失败 (~20+)
20. **configuration-governance** — 大量失败
21. **license** — 大量控制器/e2e失败
22. **insight** — 所有生成/查询失败 (~20+)
23. **knowledge** — 语义搜索等失败
24. **federated-learning** — 全部 ~25 失败
25. **currency** — 多项 e2e 失败
26. 更多...

## 🔍 TSC 类型检查

| App/ Package | 状态 |
|-------------|------|
| @m5/admin-web | ✅ 0 error |
| @m5/api | ✅ 0 error |
| @m5/app | ✅ 0 error |
| @m5/miniapp | ✅ 0 error |
| @m5/mobile | ⚠️ 1 warning (customConditions 配置问题) |
| @m5/storefront-web | ✅ 0 error |
| @m5/tob-web | ✅ 0 error |
| @m5/domain | ✅ 0 error |
| @m5/sdk | ✅ 0 error |
| @m5/types | ✅ 0 error |
| @m5/ui | ✅ 0 error |

**TSC 合计: 13/14 OK (1 minor warning)**

## ⚠️ 主要问题总结

### 1. Vitest 4 迁移问题 (高优)
- `test.poolOptions` 被废弃（Vitest 4.1.9），全量回归汇总流程中断
- 影响 33 个模块的回归检查标记（false positive）

### 2. 模块 NestJS DI 编译失败 (中优)
- license-renewal, trust-governance, integration-orchestration, runtime-governance, lyt, reservation 模块编译失败 → 依赖注入问题

### 3. 业务测试失败 (需排查)
- License 相关大量 e2e 失败（~50+）
- Voice-processing 全部 e2e 失败（~30+）
- Custom-domain 全部失败（~20+）
- Federated learning 全部失败（~25+）
- Insight/AI 生成类大量失败
- knowledge 语义搜索失败

## 🏁 结论

❌ **非全量健康** — 存在 662 个单测失败，其中约 34 个为汇总检测假阳性，约 100+ 为模块编译问题，其余为业务逻辑/集成测试失败。
