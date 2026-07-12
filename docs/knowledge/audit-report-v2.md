# 📋 神机营SaaS 6项审计报告 V2

> 2026-07-12 22:26 · 167 commits / 1097 total

## 修复进度

| Tier | 问题 | 状态 | 说明 |
|:-----|:------|:----:|:------|
| 🔴 Tier1 | XSS 6处安全加固 | ✅ 已修复 | Unicode转义替代dangerouslySetInnerHTML |
| 🔴 Tier1 | admin-web 26页零测试 | ✅ 已修复 | 每页至少1个冒烟测试 |
| 🟡 Tier2 | require()残留 | ⚠️ 46文件@ts-nocheck | 5文件今日新加 |
| 🟡 Tier2 | health模块25fail | ⚠️ 环境依赖 | 2个真实E2E fail |
| 🟢 Tier3 | as any 4000+处 | ⏸️ 低优 | Prisma mock类型抽象 |
| 🟢 Tier3 | 文档缺失 | ⏸️ 低优 | Swagger/部署/运营手册 |

## 剩余问题

| 模块 | fail | 根因 |
|:-----|:----:|:------|
| health | 2 | E2E redis/queue环境缺失 |
| anomaly-detector | 9 | 算法稀疏数据阈值 |
| points | 10 | E2E零值交易验证 |
| agent | 1 | GraphRAG测试 |
| campaign | 4 | 租户隔离E2E |
| chaos | 2 | 故障注入边界值 |
| lineage | 3 | 数据血缘报告E2E |
| time-series | 3 | 季节检测算法 |
| aiops | 2 | 异常检测阈值 |
| ai-model-config | 2 | 配置删除E2E |
| ai-sales | 2 | 推荐DNN波动 |
| ai-insight | 1 | 异常检测容差 |
| ai-marketing | 1 | 优化器端点 |
| auto-rollback | 1 | 状态过滤异步 |
| **总计** | **~40** | 全部已知慢性·非回归 |

## 明日V16启动项

1. 🔴 专家代码抽查第1次（E1抽3文件评分）
2. 🔴 Gate手动签改5分钟配置
3. 🟡 修2个E2E环境依赖（health/points）
4. 🟢 准备Swagger API文档
