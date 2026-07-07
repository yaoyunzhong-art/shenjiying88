# 🧬 40 名专家经验库索引 (docs/expertise/INDEX.md)

> 创建: 2026-06-25 · Pulse-62
> 设计: 10 工作流 (W) × 4 生命周期阶段 (L) = 40 专家
> 详见: [dev-evaluation.md §7](../dev-evaluation.md)

---

## 矩阵总览

| W \ L | L1 设计 | L2 实现 | L3 验证 | L4 运维 |
|---|---|---|---|---|
| **W1 架构** | [W1L1](W1L1-architect-design.md) | [W1L2](W1L2-architect-build.md) | [W1L3](W1L3-architect-verify.md) | [W1L4](W1L4-architect-operate.md) |
| **W2 后端** | [W2L1](W2L1-backend-design.md) | [W2L2](W2L2-backend-build.md) | [W2L3](W2L3-backend-verify.md) | [W2L4](W2L4-backend-operate.md) |
| **W3 前端** | [W3L1](W3L1-frontend-design.md) | [W3L2](W3L2-frontend-build.md) | [W3L3](W3L3-frontend-verify.md) | [W3L4](W3L4-frontend-operate.md) |
| **W4 数据库** | [W4L1](W4L1-database-design.md) | [W4L2](W4L2-database-build.md) | [W4L3](W4L3-database-verify.md) | [W4L4](W4L4-database-operate.md) |
| **W5 测试** | [W5L1](W5L1-qa-design.md) | [W5L2](W5L2-qa-build.md) | [W5L3](W5L3-qa-verify.md) | [W5L4](W5L4-qa-operate.md) |
| **W6 可观测** | [W6L1](W6L1-observability-design.md) | [W6L2](W6L2-observability-build.md) | [W6L3](W6L3-observability-verify.md) | [W6L4](W6L4-observability-operate.md) |
| **W7 安全** | [W7L1](W7L1-security-design.md) | [W7L2](W7L2-security-build.md) | [W7L3](W7L3-security-verify.md) | [W7L4](W7L4-security-operate.md) |
| **W8 DevOps** | [W8L1](W8L1-devops-design.md) | [W8L2](W8L2-devops-build.md) | [W8L3](W8L3-devops-verify.md) | [W8L4](W8L4-devops-operate.md) |
| **W9 多租户** | [W9L1](W9L1-saas-design.md) | [W9L2](W9L2-saas-build.md) | [W9L3](W9L3-saas-verify.md) | [W9L4](W9L4-saas-operate.md) |
| **W10 产品** | [W10L1](W10L1-product-design.md) | [W10L2](W10L2-product-build.md) | [W10L3](W10L3-product-verify.md) | [W10L4](W10L4-product-operate.md) |

---

## 状态: 空模板 (待激活)

40 个文件均为空模板,等待首个任务激活。激活条件:
- **Skill 获得**:第一次有相关 Pulse 任务
- **Decision 记录**:第一次需要做该 W×L 交叉的决策
- **Anti-pattern 踩坑**:第一次踩坑

激活流程:
1. main agent 完成 1 个 W×L 相关任务
2. 更新对应文件
3. 在 `decision-history` 表格添加一行
4. commit

---

## 知识分享规则

### 跨专家学习
- W2L2 (后端实现) 学到的 `@Optional()` 兼容模式 → 共享给 W3L2 (前端实现)
- W6L3 (可观测验证) 发现的 metric 缺失 → 反馈给 W6L1 (可观测设计)
- 共享通过 `docs/expertise/_shared/` 目录

### 跨阶段接力
- L1 设计完成后,产出"设计稿" → L2 接力时读 `_shared/design-handoffs/{topic}.md`
- L2 实现完成后,产出"实现笔记" → L3 验证时读 `_shared/build-handoffs/{topic}.md`
- L3 验证完成后,产出"验证报告" → L4 运维时读 `_shared/verify-handoffs/{topic}.md`
