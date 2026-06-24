"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResilienceOperationsService = void 0;
const common_1 = require("@nestjs/common");
let ResilienceOperationsService = class ResilienceOperationsService {
    observabilitySignals = [
        {
            signal: 'metrics',
            status: 'healthy',
            coverage: 96,
            collectionLagSeconds: 18,
            lastCollectedAt: '2026-06-12T09:58:00.000Z',
            owner: 'platform-ops',
            alertRoutes: ['alertmanager/platform-primary', 'ops-oncall-wecom'],
            evidence: ['infra/docker/prometheus/prometheus.yml', 'infra/docker/alertmanager/alertmanager.yml']
        },
        {
            signal: 'logs',
            status: 'warning',
            coverage: 88,
            collectionLagSeconds: 92,
            lastCollectedAt: '2026-06-12T09:56:40.000Z',
            owner: 'platform-ops',
            alertRoutes: ['alertmanager/platform-primary'],
            evidence: ['infra/docker/loki/config.yml', 'infra/docker/promtail/config.yml']
        },
        {
            signal: 'traces',
            status: 'warning',
            coverage: 84,
            collectionLagSeconds: 74,
            lastCollectedAt: '2026-06-12T09:57:05.000Z',
            owner: 'platform-ops',
            alertRoutes: ['alertmanager/platform-primary', 'ops-oncall-wecom'],
            evidence: ['infra/docker/otel-collector/config.yml', 'infra/docker/tempo/tempo.yml']
        }
    ];
    retryPolicies = [
        {
            key: 'edge-sync-retry',
            capability: 'edge-sync',
            trigger: 'store-edge upload timeout or weak network',
            maxAttempts: 6,
            backoff: 'exponential: 30s -> 5m',
            recoveryAction: 'switch to reconciliation queue and conflict review',
            escalationTarget: 'ops-oncall-wecom'
        },
        {
            key: 'webhook-delivery-retry',
            capability: 'webhook-delivery',
            trigger: 'delivery failed or downstream 5xx',
            maxAttempts: 5,
            backoff: 'progressive: 15s -> 10m',
            recoveryAction: 'move to dead-letter queue with replay token',
            escalationTarget: 'integration-ops'
        },
        {
            key: 'backup-restore-validation',
            capability: 'backup-restore',
            trigger: 'restore validation failed',
            maxAttempts: 3,
            backoff: 'fixed: 10m',
            recoveryAction: 'fallback to previous snapshot and open incident',
            escalationTarget: 'security-admin'
        }
    ];
    recoveryPlans = [
        {
            resource: 'postgres-primary',
            status: 'ready',
            rtoMinutes: 30,
            rpoMinutes: 10,
            lastDrillAt: '2026-05-28T02:00:00.000Z',
            staleAfterDays: 45,
            dependencies: ['postgres-backup', 'prometheus', 'audit-verification'],
            runbook: 'docs/operations-runbook-template.md#database-recovery'
        },
        {
            resource: 'edge-sync-pipeline',
            status: 'attention',
            rtoMinutes: 20,
            rpoMinutes: 5,
            lastDrillAt: '2026-04-01T03:00:00.000Z',
            staleAfterDays: 30,
            dependencies: ['local-queue', 'reconciliation-service', 'conflict-review'],
            runbook: 'docs/operations-runbook-template.md#edge-replay'
        },
        {
            resource: 'observability-stack',
            status: 'ready',
            rtoMinutes: 15,
            rpoMinutes: 15,
            lastDrillAt: '2026-06-01T01:30:00.000Z',
            staleAfterDays: 30,
            dependencies: ['prometheus', 'loki', 'tempo', 'otel-collector'],
            runbook: 'docs/operations-runbook-template.md#observability-recovery'
        }
    ];
    getManagementMetadata() {
        return [
            this.buildGovernanceMetadata('observability.read', {
                resource: 'observability',
                action: 'read',
                requiredRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'],
                requiredPermissions: ['foundation.governance.read']
            }),
            this.buildGovernanceMetadata('retry-policy.read', {
                resource: 'retry-policy',
                action: 'read',
                requiredRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'],
                requiredPermissions: ['foundation.governance.read']
            }),
            this.buildGovernanceMetadata('recovery-plan.read', {
                resource: 'recovery-plan',
                action: 'read',
                requiredRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'],
                requiredPermissions: ['foundation.governance.read']
            }),
            this.buildGovernanceMetadata('edge-replay.write', {
                resource: 'edge-replay',
                action: 'write',
                requiredRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS'],
                requiredPermissions: ['foundation.operations.recovery.write']
            })
        ];
    }
    stageEdgeReplay(storeId, operationCount) {
        return {
            status: 'staged',
            storeId,
            operationCount,
            replayPipeline: ['local-queue', 'network-recovery', 'reconciliation', 'conflict-review'],
            retryPolicy: this.retryPolicies.find((policy) => policy.key === 'edge-sync-retry'),
            observabilityHooks: ['metrics:edge_sync_backlog', 'logs:edge-replay', 'traces:edge-sync-replay'],
            recoveryPlan: this.recoveryPlans.find((plan) => plan.resource === 'edge-sync-pipeline')
        };
    }
    describeRecoveryPlan(resource) {
        const plan = this.recoveryPlans.find((item) => item.resource === resource);
        return {
            status: plan?.status ?? 'attention',
            resource,
            baseline: ['backup', 'restore-drill', 'cross-az-failover', 'audit-verification'],
            plan: plan ?? null
        };
    }
    getObservabilitySignals(filters = {}) {
        return this.observabilitySignals.filter((signal) => !filters.status || signal.status === filters.status);
    }
    listRetryPolicies(filters = {}) {
        return this.retryPolicies.filter((policy) => !filters.capability || policy.capability === filters.capability);
    }
    listRecoveryPlans(filters = {}) {
        return this.recoveryPlans.filter((plan) => !filters.status || plan.status === filters.status);
    }
    getOperationsOverview() {
        const signals = this.getObservabilitySignals();
        const retryPolicies = this.listRetryPolicies();
        const recoveryPlans = this.listRecoveryPlans();
        const now = Date.now();
        const stalePlans = recoveryPlans.filter((plan) => {
            const staleAt = Date.parse(plan.lastDrillAt) + plan.staleAfterDays * 24 * 60 * 60 * 1000;
            return staleAt < now;
        });
        return {
            generatedAt: new Date().toISOString(),
            observability: {
                totalSignals: signals.length,
                degradedSignals: signals.filter((signal) => signal.status !== 'healthy').length,
                byStatus: buildCountMap(signals.map((signal) => signal.status)),
                averageCoverage: Math.round(signals.reduce((sum, signal) => sum + signal.coverage, 0) / signals.length),
                maxCollectionLagSeconds: Math.max(...signals.map((signal) => signal.collectionLagSeconds)),
                signals
            },
            retries: {
                totalPolicies: retryPolicies.length,
                byCapability: buildCountMap(retryPolicies.map((policy) => policy.capability)),
                maxAttempts: Math.max(...retryPolicies.map((policy) => policy.maxAttempts)),
                policies: retryPolicies
            },
            recovery: {
                totalPlans: recoveryPlans.length,
                attentionRequired: recoveryPlans.filter((plan) => plan.status === 'attention').length,
                staleDrills: stalePlans.length,
                plans: recoveryPlans
            }
        };
    }
    getGovernanceBaselines() {
        return [
            {
                key: 'edge-offline',
                name: '边缘离线与弱网回放',
                ownerModule: 'resilience-operations',
                summary: '门店边缘节点必须支持本地缓存、顺序回放和中心对账，避免断网期间业务停摆。',
                controls: [
                    '边缘节点维护本地队列、幂等键和重试上限。',
                    '恢复联网后按 local-queue -> reconciliation -> conflict-review 顺序回放。',
                    '离线缓存只保留最小必要数据，敏感字段默认脱敏或摘要化。',
                    '设备、门店、租户维度都需要同步健康度和最后心跳。'
                ],
                evidence: ['apps/api/src/modules/foundation/resilience-operations/resilience-operations.service.ts', 'docs/operations-governance-baseline.md']
            },
            {
                key: 'observability-alerting',
                name: '监控告警、日志与追踪',
                ownerModule: 'resilience-operations',
                summary: '以 metrics、logs、traces 三信号统一发现故障，并通过告警路由约束值班响应。',
                controls: [
                    'Prometheus 负责指标与规则，Alertmanager 负责路由和值班升级。',
                    'Loki/Promtail 采集结构化日志，Tempo/OTel Collector 汇总链路追踪。',
                    '审计、边缘同步、限流、AI 调用必须携带 traceId 与 tenant scope。',
                    '基础设施模板默认暴露健康检查与采集端口，但不对公网直接开放。'
                ],
                evidence: ['infra/docker/docker-compose.ops.yml', 'infra/docker/prometheus/prometheus.yml']
            },
            {
                key: 'backup-restore-drill',
                name: '备份恢复与容灾演练',
                ownerModule: 'resilience-operations',
                summary: '把备份、恢复、演练和复盘视为同一条运行链路，保证恢复不是纸面能力。',
                controls: [
                    '数据库、消息、对象归档都要有快照频率、保留期和恢复顺序。',
                    '演练至少验证配置、主库、缓存重建、消息补偿和审计校验。',
                    '每次演练都输出 RTO/RPO、失败点和待补行动项。',
                    '跨可用区或跨云切换需通过 runbook 明确触发条件与回切标准。'
                ],
                evidence: ['docs/operations-governance-baseline.md', 'docs/operations-runbook-template.md']
            }
        ];
    }
    getDescriptor() {
        return {
            key: 'resilience-operations',
            name: 'Resilience Operations Module',
            purpose: '承载边缘同步与灾备恢复基线，避免门店弱网和区域故障阶段性补丁化。',
            inboundContracts: ['Store edge operations', 'Recovery drill requests', 'Resource backup metadata'],
            outboundContracts: ['Replay batch plan', 'Recovery baseline and runbook hooks'],
            capabilities: [
                {
                    key: 'edge-sync',
                    name: '边缘同步入口',
                    responsibilities: ['为门店弱网缓存和回放留入口', '预留中心对账和冲突处理', '隔离边缘节点凭证与同步批次'],
                    entrypoints: ['ResilienceOperationsService.stageEdgeReplay'],
                    consumers: ['workbench', 'lyt-adapter'],
                    status: 'active'
                },
                {
                    key: 'disaster-recovery',
                    name: '灾备恢复入口',
                    responsibilities: ['定义备份恢复基线', '保留演练记录占位', '约束配置/审计/对象存储恢复顺序'],
                    entrypoints: ['ResilienceOperationsService.describeRecoveryPlan', 'ResilienceOperationsService.listRecoveryPlans'],
                    consumers: ['market', 'portal', 'workbench', 'lyt-adapter'],
                    status: 'active'
                },
                {
                    key: 'observability',
                    name: '可观测性入口',
                    responsibilities: ['统一指标、日志、追踪三信号采集', '对接阈值告警和值班路由', '为恢复演练提供故障证据'],
                    entrypoints: ['ResilienceOperationsService.getObservabilitySignals', 'ResilienceOperationsService.getOperationsOverview'],
                    consumers: ['market', 'portal', 'workbench', 'lyt-adapter'],
                    status: 'active'
                }
            ]
        };
    }
    buildGovernanceMetadata(operation, input) {
        return {
            operation,
            rbac: {
                resource: input.resource,
                action: input.action,
                requiredRoles: input.requiredRoles,
                requiredPermissions: input.requiredPermissions
            }
        };
    }
};
exports.ResilienceOperationsService = ResilienceOperationsService;
exports.ResilienceOperationsService = ResilienceOperationsService = __decorate([
    (0, common_1.Injectable)()
], ResilienceOperationsService);
function buildCountMap(values) {
    return values.reduce((result, value) => {
        result[value] = (result[value] ?? 0) + 1;
        return result;
    }, {});
}
//# sourceMappingURL=resilience-operations.service.js.map