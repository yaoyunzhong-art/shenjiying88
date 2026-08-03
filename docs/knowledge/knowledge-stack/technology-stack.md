# 🏗️ shenjiying88 技术栈全景 (V24)

> 最后更新: 2026-07-29 01:26 CST
> 维护: 🦞 龙虾哥

---

## 一、仓库规模

| 指标 | 数值 |
|:-----|:---:|
| 总代码文件 (.ts/.tsx) | **9,598** |
| 总测试文件 | **4,500+** |
| 模块数 | **191** |
| Service 文件 | **394** |
| Controller 文件 | **228** |
| README 文档 | **289+** |
| E2E 端到端测试链 | **41条** (journey 38 + chain 3) |
| AuthGuard 覆盖率 | **100%** (224/224) |
| RLS 多租户 | **83%** (54/65表) |
| 安全基线 | **8/8 锁定 v2.4** |

## 二、7大应用

| 应用 | 框架 | 路径 |
|:-----|:-----|:-----|
| admin-web | Next.js App Router | `apps/admin-web/` |
| storefront-web | Next.js App Router | `apps/storefront-web/` |
| tob-web | Next.js | `apps/tob-web/` |
| api | NestJS | `apps/api/` |
| app | React Native | `apps/app/` |
| miniapp | 小程序 | `apps/miniapp/` |
| mobile | H5 | `apps/mobile/` |

## 三、5大共享包

| 包 | 说明 |
|:----|:-----|
| `packages/domain` | 领域模型/业务实体 |
| `packages/sdk` | 统一SDK (contract类型+API客户端) |
| `packages/ui` | 共享UI组件库 |
| `packages/types` | 共享TypeScript类型 |
| `packages/config-typescript` | TS配置基座 |

## 四、技术栈

### 后端
| 技术 | 版本 | 用途 |
|:-----|:---:|:-----|
| NestJS | v10+ | API框架 |
| Prisma | v5+ | ORM + 数据库迁移 |
| PostgreSQL | — | 主数据库 (通过阿里云 RDS) |
| Vitest | v1+ | 单元测试 |
| class-validator | — | DTO验证 |
| class-transformer | — | DTO转换 |

### 前端
| 技术 | 版本 | 用途 |
|:-----|:---:|:-----|
| Next.js | v14+ | SSR框架 |
| React | v18 | UI框架 |
| @testing-library/react | — | 组件测试 |
| Vitest | v1+ | 单元测试 |

### E2E 测试
| 技术 | 说明 |
|:-----|:-----|
| Playwright | 浏览器端到端测试 |
| Vitest + fetch | API端到端测试 (41条链) |

### 基础设施
| 技术 | 说明 |
|:-----|:-----|
| 阿里云 ECS | 香港节点 (47.239.159.30) |
| 阿里云 ACK RDS | PostgreSQL 托管 |
| kaniko | 容器构建 |
| k8s | 容器编排 |

## 五、开发模式

### 圈梁五道箍
- **树哥A**: 文档线 (README + ACCEPTANCE + PRD)
- **树哥B**: 单元测试线 (Service 测试 15+)
- **树哥C**: E2E 测试线 (端到端 25+)
- 每天早上 06:00-08:00 派单，全天三路并行

### 保底续产
- 每30分钟自动检查工作区
- 有未提交变更 → commit
- 无变更 → 跳过

### 龙虾哥文档体系
- 09:30 对齐检查
- 10:30 对齐自进化
- 17:00 开发推进检查
- 20:00 晚会6道门签署

### 安全体系
- 07:30 每日安全基线扫描
- 07:50 AI 知识简报
- AuthGuard 100% 覆盖 + 默认拒绝策略

## 六、V23→V24 新增

| 模块 | 状态 | Phase |
|:-----|:----:|:-----|
| brand-custom (版本/脚本/字体/多语言) | ✅ | V24 P1 |
| brand-analytics (KPI/归因/声量/ROI) | ✅ | V24 P1 |
| brand-workspace (布局/任务/审批/日历) | ✅ | V24 P1 |
| logistics-supplement (运输/路线/维保/油耗) | ✅ | V24 P1 |
| stock-transfer (调拨全生命周期) | ✅ | V24 P1 |
| minor-protection (年龄验证/消费限制/盲盒拦截) | ✅ | V24 P2 |

## 七、当前债

| 债项 | 状态 |
|:-----|:----:|
| RLS 11表待补 tenant_id | 🟡 SQL已生成, 待DB |
| admin-web ~363 假阳 | 🟡 清零路线已出 |
| storefront 1 checkout偏差 | 🟡 RCA已出 |
| 177模块缺 ACCEPTANCE | 🟡 |
| 阿里云节点不通 | 🔴 需人工 |
| 订单内存→DB迁移 | 🟡 推进中 |

---

*🦞 龙虾哥 · V24 · 2026-07-29 01:26 CST*
