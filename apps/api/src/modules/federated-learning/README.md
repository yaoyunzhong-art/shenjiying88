# Federated Learning 联邦学习模块

> 多租户联邦学习平台。支持跨租户分布式模型训练、梯度聚合、差分隐私和同态加密，在数据不出租户边界的前提下完成联合训练。

## 核心功能

- **联邦任务管理** — 任务创建、激活、暂停、完成全生命周期管理，支持协调者（Coordinator）与参与者（Participant）角色
- **训练轮次编排** — 从 `collecting`（收集梯度）→ `aggregating`（聚合）→ `completed`（完成）的自动化状态机
- **梯度提交** — 参与方提交加密梯度，按 round 验证租户白名单和截止时间，同租户每轮仅提交一次
- **联邦聚合算法** — 支持三种主流聚合策略：
  - **FedAvg** — 加权平均聚合，支持按样本数加权
  - **FedProx** — 近端项约束，适合 Non-IID 数据分布
  - **SCAFFOLD** — 控制变量修正，减少客户端漂移
- **差分隐私 (DP)** — 梯度裁剪（L2 Clipping）+ 高斯噪声注入，提供 ε/δ 隐私预算追踪（basic / advanced 组合）
- **同态加密** — 梯度加密传输抽象层（MockHomomorphicCipher 开发用，生产对接 Paillier / CKKS）
- **隐私预算监控** — 每轮记录 ε 消耗，达到预算上限自动阻止新轮次
- **多租户安全** — TenantGuard 守卫 + 租户白名单 + 权限校验（`federated:read` / `federated:update`）

## 主要 API 端点

| 方法 | 路由 | 说明 |
|------|------|------|
| POST | `federated/tasks` | 创建联邦学习任务 |
| GET | `federated/tasks` | 列出当前租户的所有联邦任务 |
| GET | `federated/tasks/:id` | 获取任务详情 |
| POST | `federated/tasks/:id/activate` | 激活任务（draft → active）|
| POST | `federated/tasks/:taskId/rounds` | 启动新训练轮次 |
| GET | `federated/tasks/:taskId/rounds` | 列出指定任务的所有轮次 |
| POST | `federated/tasks/:taskId/submit` | 客户端提交加密梯度 |
| POST | `rounds/:roundId/aggregate` | 聚合指定轮次的梯度 |
| GET | `federated/tasks/:taskId/privacy` | 查询任务隐私预算消耗情况 |

## 核心数据结构与算法

| 组件 | 说明 |
|------|------|
| `FederatedTask` | 联邦任务实体（模型架构、参与方列表、聚合方法、隐私预算等） |
| `FederatedRound` | 训练轮次实体（状态机、截止时间、版本号、参与者统计） |
| `GradientSubmission` | 梯度提交实体（加密梯度、样本数、提交方、状态） |
| `PrivacyAccount` | 差分隐私账户（跟踪 ε/δ 消耗） |
| `HomomorphicCipher` | 同态加密抽象接口（encrypt / decrypt） |
| `fedAvg` / `fedProx` / `scaffold` | 三种聚合算法实现 |
| `gaussianNoise` / `clipGradient` | 差分隐私原语 |
| `computeEpsilonConsumed` | ε 消耗计算（高斯机制） |

## 依赖关系

- **AgentModule** — 引用 `TenantGuard` 多租户守卫
- **Foundation Identity & Access** — 权限注解（`@RequirePermissions` / `@RequireTenantScope`）
- **Tenant Context** — 通过 `requireTenantContext()` 获取当前租户上下文
- **NestJS** — Controller / Service / Module 架构，`@Global()` 模块（全局注册）

## 配置说明

联邦学习模块暂无可配置 env，以下参数通过 DTO 创建任务时指定：

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `privacyBudgetEpsilon` | `1.0` | 总隐私预算 ε |
| `privacyBudgetDelta` | `1e-5` | 总隐私预算 δ |
| `totalRounds` | `10` | 训练总轮次 |
| `aggregationMethod` | `fedavg` | 聚合策略（fedavg / fedprox / scaffold） |
| `minParticipants` | `2` | 最小参与客户端数 |
| `noiseMultiplier` | `1.1` | 差分隐私噪声乘子 |
| `maxGradientNorm` | `1.0` | 梯度裁剪 L2 范数阈值 |
| `collectionDeadlineMs` | `3600000` | 梯度收集截止时间（ms） |

## 隐私预算计算

- **噪声机制**: 高斯机制（Gaussian Mechanism），δ 按轮次均分（`δ_per_round = total_δ / total_rounds`）
- **ε 消耗**: 通过 `computeEpsilonConsumed` 基于 Clipping 阈值、噪声乘子、δ 实时计算
- **组合方式**: 默认 Basic Composition（线性累加），预留 Advanced Composition（矩会计）扩展点

## 模块结构

```
federated-learning/
├── README.md
├── federated-learning.controller.ts   # 规范名导出（委托至 federated.controller）
├── federated-learning.service.ts      # 规范名导出（委托至 federated.service）
├── federated.module.ts                # NestJS 模块定义（@Global）
├── federated.controller.ts            # REST 控制器实现
├── federated.service.ts               # 联邦学习核心逻辑
├── federated.dto.ts                   # DTO 类型定义
├── federated.entity.ts                # 实体定义 + 聚合算法实现 + ID 生成器 + 差分隐私原语
├── federated.contract.ts              # 跨模块合约
├── *.spec.ts / *.test.ts              # 单元测试 & 集成测试
└── *.e2e.test.ts                      # E2E 测试
```
