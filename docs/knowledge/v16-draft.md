# 📋 V16 开发计划（草案）

> **周一 2026-07-13 · 基于V15成果**
> 计划编制: 2026-07-12 17:25

## 📊 V15数据
- 今日101 commits · 累计1031 commits
- 15个无测试模块: member-config, member-dormancy, member-cross-tenant, marketing, member-level, auth, gateway, deploy, inventory, lowcode, notification, rbac, report, sync, tenant, etc.

## 🏆 V15回顾
### 三个突破性成果
1. ✅ **P0-001 @m5/api hang正式闭环** — `vitest forceExit` 根因定位+修复验证通过
2. ✅ **路由迁移完成** — stores/layout.tsx 门店侧边栏26模块 + promotions/operations → stores/[id]/
3. ✅ **TSC 14/14 稳态维持 连续8次全绿** — pulse#358→dispatch-358 8次连续闭环
4. ✅ **P-35 前台收银台** — storefront-web app/cashier/ 完整页面+测试
5. ✅ **P-36 会员中心增强** — 完整会员信息+充值/续费+消费记录+权益展示+等级进度条 [32/32测试全绿]
6. ✅ **全量119模块零hang验证** — 独立逐包验证确认无缓存污染

### ❌ 未完成/慢性问题
- 29个模块仍有测试fail（见下方fail明细）
- RQ-001~005 超5h未闭合 → 已P0升级多次

## 🎯 V16目标

### 突破目标（3项）
1. **修复15个无测试模块的空白** — member-config, member-dormancy, member-cross-tenant, member-level 等模块补充基础测试
2. **专家体系改革落地V1** — 报告→任务卡 + 三阶段赋能 + 测试专家矩阵
3. **TSC 14/14 持续零回归** — 累计15次连续全绿（当前8次）

### 持续性目标
- 店A倒计时18天(8/1) → P-37~P-40 页面
- **29个模块fail剩余明细:**

| 模块 | fail数 | 预计修复 |
|------|--------|---------|
| ai-diagnosis | 78 | 3d |
| voice-processing | 49 | 2d |
| license | 42 | 2d |
| cdn-cache | 39 | 2d |
| tenant-config | 30 | 1.5d |
| federated-learning | 23 | 1d |
| saas-advanced | 21 | 1d |
| multimodal-fusion | 21 | 1d |
| image-recognition | 15 | 0.5d |
| knowledge | 11 | 0.5d |
| points | 10 | 0.5d |
| anomaly-detector | 10 | 0.5d |
| 其他18个模块 | 1-4 | 0.5d |

> **合计: ~353个fail → 日均消灭5个 → 5.8天清空**

- 竞品数据周更新（周日）

### 预估
- 代码: 60,000+ 行
- 测试: 全绿
- TSC: 零错误
- 闭环度: +1%/天

## 🔄 V15→V16 关键路径
1. ⏩ **脉冲持续** — 保持TSC 14/14验证节奏
2. ⏩ **P-37~P-40页面** — 下一个店A冲刺
3. ⏩ **无测试模块补测** — 15个模块基础覆盖
4. ⏩ **专家体系改革落地** — 新工作流试运行
5. ⏩ **慢性fail清空** — 日均5个目标

---

*本草案待周一晨会对齐后锁定*
