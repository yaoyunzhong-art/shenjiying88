# 工作流矩阵 V4 归档说明

## 迁移记录
- **原位置**: `docs/expertise/W*.md` (40 文件,W1-W10 × L1-L4)
- **归档位置**: `docs/expertise/_archive/wf-matrix-v4/`
- **迁移日期**: 2026-06-25 · Pulse-64
- **迁移原因**: V5.1 编制从"工作流 × 生命周期"(W-L 矩阵)升级为"业务专家团"(E1-E40)

## V4 → V5.1 差异
| 维度 | V4 工作流矩阵 | V5.1 业务专家团 |
|---|---|---|
| 编号 | W1-W10 × L1-L4 = 40 | E1-E40 |
| 视角 | 技术工作流(架构/后端/前端/DB/QA/Ops/安全/可观测性/SAAS/产品) | 业务角色(架构师/安全专家/营销/数据/UX/财务/租户等) |
| 角色 | 抽象技术岗位 | 真人 + 领域 |
| 反馈渠道 | 文档更新 | 3 渠道(Morning Voice / Weekly Memo / Emergency Veto) |
| 决策机制 | 由开发者代决 | ≥3 Approver 投票 |
| 评级体系 | 无 | 5 级 (Observer→Champion) |

## 保留内容
- [W9L2-saas-build.md](../_archive/wf-matrix-v4/W9L2-saas-build.md) 含 Pulse-62 累积的 5 skill + 7 decision + 5 anti-pattern (Phase-15D/E + 16D/E/F 经验)
- [W5L3-qa-verify.md](../_archive/wf-matrix-v4/W5L3-qa-verify.md) 含 Pulse-63 累积的 4 skill + 4 decision + 4 anti-pattern (P0-002 修复经验)

## 后续计划
- V5.1 阶段: 经验库迁入 `experts/E*.md` 个人档案的"反馈日志"段
- Phase-15/16/63 经验对应到具体业务专家 (E1/E7/E10 等)
- V4 矩阵作为技术维度补充,不删除(仅归档)