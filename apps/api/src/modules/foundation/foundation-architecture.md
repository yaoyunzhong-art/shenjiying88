# API Foundation Architecture Skeleton

## 目标
- 为 `apps/api` 定义 Task 3 所需底座能力的最小可运行骨架。
- 通过全局 `FoundationModule` 聚合认证授权、配置治理、集成编排、治理合规、韧性运行五个能力域。
- 强制 `market`、`portal`、`workbench`、`LYTAdapter` 通过底座入口协作，而不是在业务模块中各自散落实现。

## 模块分组
- `identity-access`
  - 认证入口
  - 授权与策略引擎入口
  - 强制租户隔离入口
- `configuration-governance`
  - 配置中心与规则中心入口
  - secrets / 证书治理入口
  - Feature Flag / 灰度发布入口
- `integration-orchestration`
  - 事件总线入口
  - Webhook 网关入口
  - 通知通道抽象入口
  - 开放平台 / 沙箱入口
- `trust-governance`
  - 审计入口
  - 限流、防滥用与配额入口
  - 隐私治理入口
  - AI 治理入口
- `resilience-operations`
  - 门店边缘同步入口
  - 监控告警、日志与追踪入口
  - 备份恢复与容灾入口

## Task 5 运行治理补充
- 边缘离线
  - 门店节点默认通过本地队列、幂等键和中心对账实现弱网续传。
  - 离线缓存只保留最小必要数据，恢复顺序遵循 `local-queue -> reconciliation -> conflict-review`。
- 数据生命周期
  - 热数据：`PostgreSQL` / `Redis`，承载交易、会话、限流计数。
  - 温数据：`ClickHouse`，承载审计查询、运营分析、AI 用量聚合。
  - 冷数据：对象存储归档，要求租户标签、校验和和恢复索引。
- 可观测性
  - `Prometheus + Alertmanager` 负责指标与告警。
  - `Loki + Promtail` 负责结构化日志采集。
  - `Tempo + OTel Collector` 负责链路追踪与上下文传播。
- 运行治理
  - `configuration-governance` 负责 secrets/证书轮换、环境隔离和 IaC 参数化约束。
  - `trust-governance` 负责限流、配额、防滥用与 AI 成本治理。
  - `resilience-operations` 负责备份恢复、容灾演练和值班 runbook。

## 依赖关系
- `market`
  - 依赖 `identity-access` 获取租户作用域。
  - 依赖 `configuration-governance` 获取市场配置、登录策略与灰度配置。
  - 依赖 `trust-governance` 记录配置变更审计。
  - 遵循 `resilience-operations` 的恢复基线。
- `portal`
  - 依赖 `identity-access` 完成门户身份解析。
  - 依赖 `configuration-governance` 装配域名、模板和渠道策略。
  - 依赖 `integration-orchestration` 接入通知和开放平台。
  - 依赖 `trust-governance` 处理限流、隐私和 AI 安全。
- `workbench`
  - 依赖 `identity-access` 决定角色工作台和权限边界。
  - 依赖 `configuration-governance` 下发能力开关和规则配置。
  - 依赖 `integration-orchestration` 串联事件、通知和外部接入。
  - 依赖 `resilience-operations` 预留离线同步和恢复方案。
- `LYTAdapter`
  - 依赖 `configuration-governance` 管理凭证、证书和开关。
  - 依赖 `integration-orchestration` 对接 webhook 与事件总线。
  - 依赖 `trust-governance` 承接审计与防滥用。
  - 依赖 `resilience-operations` 预留门店弱网回放与容灾。

## 当前落地形式
- `FoundationController` 暴露 `/api/v1/foundation/bootstrap`、`/api/v1/foundation/modules`、`/api/v1/foundation/consumers`。
- 每个子模块以 `*.module.ts + *.service.ts` 输出可直接消费的职责、入口、下游契约与 capability status 自描述，不再只停留在 skeleton 占位。
- 现有 `market`、`portal`、`workbench`、`lyt` 通过 import 与 bootstrap 输出显式声明底座依赖。
- `/api/v1/foundation/bootstrap` 额外下发统一 `frontendBootstrap` 合同，明确哪些能力必须来自 API、哪些允许端内短缓存，以及租户作用域、脱敏、灰度与风控挑战的接线原则。
- `foundation-bootstrap.contract` 与 `foundation-enum-validation.contract` 共同锁住 bootstrap、modules、consumers 与 capability status 的自描述不漂移。
- 多端各自保留本地 `bootstrap` 文件，但只作为消费同一合同的薄适配层，不重复定义租户边界和高危能力策略。

## 后续演进建议
- 将各入口的占位方法替换为 DTO、Guard、Interceptor、Repository 和异步基础设施实现。
- 把配置快照、审计记录、限流计数和 webhook 幂等键接到持久层。
- 按模块补充 e2e contract tests，优先覆盖租户隔离、Webhook 幂等、恢复演练和灰度配置装配。
- 把运行治理基线文档与 `infra/docker/docker-compose.ops.yml` 保持联动，确保模板、告警和 runbook 同步演进。
