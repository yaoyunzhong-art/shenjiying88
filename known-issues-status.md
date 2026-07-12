# 已知问题处理状态（2026-07-12 14:45）

## 已修复 ✅

1. ✅ **RQ-001~005 23 Controller fail** — 根因诊断：storefront-web前端角色冒烟测试源码断言失败，非API bug。已修复6个page.tsx源文件 + 更新test断言规则
   
2. ✅ **14 TSC回归 (pulse#356)** — insights/page.tsx deviceId字段 + MemberLevelDistribution total prop + filter类型联合修复；member-center 移除antd import

3. ✅ **路由迁移** — cashier/promotions/operations → stores/[id]/ + stores/layout.tsx侧边栏导航

4. ✅ **P0-001 @m5/api hang 根因锁定** — vitest fork僵尸进程(凌晨3:15→9h+)，已加 fileParallelism:false + teardownTimeout

## 未闭合 🟡

1. **TSC 14/14 已稳定3次** (pulse#358~360) ✅ TSC恢复
2. **RQ-001~005超6h慢性未闭** — 前端断言问题已修但验收脉冲检测逻辑未更新
3. **P-35/P-36前端⬜** — 需21:00龙虾哥亲写

## 接下来cron自动处理
- 15:00 👥 专家午会
- 15:30 复盘自进化
- 17:00 开发推进检查
