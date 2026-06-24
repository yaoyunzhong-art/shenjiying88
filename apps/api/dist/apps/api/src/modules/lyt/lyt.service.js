"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LytService = void 0;
const common_1 = require("@nestjs/common");
const foundation_service_1 = require("../foundation/foundation.service");
const integration_orchestration_service_1 = require("../foundation/integration-orchestration/integration-orchestration.service");
const runtime_governance_service_1 = require("../foundation/runtime-governance/runtime-governance.service");
const trust_governance_service_1 = require("../foundation/trust-governance/trust-governance.service");
const loyalty_service_1 = require("../loyalty/loyalty.service");
const member_service_1 = require("../member/member.service");
const transactions_service_1 = require("../transactions/transactions.service");
const campaign_service_1 = require("../campaign/campaign.service");
const lyt_adapter_registry_1 = require("./lyt-adapter.registry");
const lyt_connection_manager_1 = require("./lyt-connection.manager");
const lyt_governance_query_service_1 = require("./lyt-governance-query.service");
const lyt_contract_1 = require("./lyt.contract");
const lyt_fixture_catalog_1 = require("./lyt-fixture.catalog");
const lyt_entity_1 = require("./lyt.entity");
let LytService = class LytService {
    adapterRegistry;
    foundationService;
    connectionManager;
    integrationOrchestrationService;
    loyaltyService;
    memberService;
    transactionsService;
    runtimeGovernanceService;
    governanceQueryService;
    trustGovernanceService;
    campaignService;
    governedCapabilities = ['member', 'payment', 'order', 'device', 'gate', 'coin', 'inventory', 'shelf'];
    constructor(adapterRegistry, foundationService, connectionManager, integrationOrchestrationService, loyaltyService, memberService, transactionsService, runtimeGovernanceService, governanceQueryService, trustGovernanceService, campaignService) {
        this.adapterRegistry = adapterRegistry;
        this.foundationService = foundationService;
        this.connectionManager = connectionManager;
        this.integrationOrchestrationService = integrationOrchestrationService;
        this.loyaltyService = loyaltyService;
        this.memberService = memberService;
        this.transactionsService = transactionsService;
        this.runtimeGovernanceService = runtimeGovernanceService;
        this.governanceQueryService = governanceQueryService;
        this.trustGovernanceService = trustGovernanceService;
        this.campaignService = campaignService;
    }
    async emitAudit(input) {
        if (!this.trustGovernanceService) {
            return;
        }
        const riskLevel = input.riskLevel ?? this.resolveWebhookRuntimeRiskLevel({ capability: input.standardizedEvent.capability });
        await this.trustGovernanceService.recordAudit(input.eventType, {
            aggregateId: input.aggregateId,
            sourceEventName: input.standardizedEvent.sourceEventName,
            standardizedEventName: input.standardizedEvent.standardizedEventName,
            capability: input.standardizedEvent.capability,
            ...input.details
        }, {
            tenantId: input.standardizedEvent.tenantId,
            actorId: 'lyt-adapter',
            source: 'lyt-adapter',
            riskLevel
        });
    }
    resolveWebhookRuntimeRiskLevel(standardizedEvent) {
        if (standardizedEvent.capability === 'payment' || standardizedEvent.capability === 'order') {
            return 'high';
        }
        if (standardizedEvent.capability === 'unknown') {
            return 'low';
        }
        return 'medium';
    }
    buildWebhookRuntimePayloadSummary(input) {
        return `LYT webhook ${input.standardizedEvent.sourceEventName} -> ${input.standardizedEvent.standardizedEventName} (${input.acceptedStatus}, ${input.standardizedEvent.capability})`;
    }
    async attachWebhookRuntimeReceipt(input) {
        if (!this.runtimeGovernanceService) {
            return null;
        }
        const runtimeReceipt = await this.runtimeGovernanceService.submitAction({
            app: 'lyt',
            action: 'webhook-callback',
            nextStep: 'PROCEED',
            riskLevel: this.resolveWebhookRuntimeRiskLevel(input.standardizedEvent),
            requestEndpoint: '/api/v1/lyt/webhooks',
            payload: {
                aggregateId: input.standardizedEvent.aggregateId,
                sourceEventName: input.standardizedEvent.sourceEventName,
                standardizedEventName: input.standardizedEvent.standardizedEventName,
                capability: input.standardizedEvent.capability,
                requestId: input.archiveRecord.requestId,
                fixtureKey: input.archiveRecord.fixtureKey,
                signatureStatus: input.archiveRecord.signatureStatus,
                acceptedStatus: input.acceptedStatus
            },
            payloadSummary: this.buildWebhookRuntimePayloadSummary(input),
            recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
            handlerName: 'lyt-webhook-handler',
            idempotencyKey: `lyt-webhook-submit:${input.aggregateId}`,
            actorId: 'lyt-webhook',
            tenantId: input.standardizedEvent.tenantId,
            brandId: input.standardizedEvent.brandId,
            storeId: input.standardizedEvent.storeId
        });
        return this.runtimeGovernanceService.recordCallback(runtimeReceipt.receiptCode, {
            callbackStatus: 'callback-recorded',
            ackToken: input.acceptedIdempotencyKey ?? `lyt-webhook-ack:${input.aggregateId}`,
            lastEvent: 'HANDLER_COMPLETED',
            summary: input.acceptedStatus === 'duplicate'
                ? 'LYT 重复 webhook 已命中既有 runtime receipt，并保留 callback 治理链。'
                : 'LYT webhook 已接收并挂入统一 runtime callback 治理链。',
            idempotencyKey: `lyt-webhook-callback:${input.aggregateId}`,
            actorId: 'lyt-webhook',
            tenantId: input.standardizedEvent.tenantId
        });
    }
    async syncMemberSnapshotFromStandardizedEvent(standardizedEvent) {
        if (standardizedEvent.standardizedEventName !== 'member.profile-synced' || !this.memberService) {
            return null;
        }
        const externalMemberId = typeof standardizedEvent.payload.externalMemberId === 'string'
            ? standardizedEvent.payload.externalMemberId
            : undefined;
        const tenantId = standardizedEvent.tenantId;
        if (!tenantId || !externalMemberId) {
            return {
                status: 'skipped',
                reason: 'missing-tenant-or-external-member-id'
            };
        }
        try {
            const synced = await this.memberService.syncLytMemberSnapshot({
                tenantContext: {
                    tenantId,
                    brandId: standardizedEvent.brandId,
                    storeId: standardizedEvent.storeId
                },
                externalMemberId,
                memberCode: typeof standardizedEvent.payload.memberCode === 'string'
                    ? standardizedEvent.payload.memberCode
                    : undefined,
                mobile: typeof standardizedEvent.payload.mobile === 'string'
                    ? standardizedEvent.payload.mobile
                    : undefined,
                nickname: typeof standardizedEvent.payload.nickname === 'string'
                    ? standardizedEvent.payload.nickname
                    : undefined,
                levelCode: typeof standardizedEvent.payload.levelCode === 'string'
                    ? standardizedEvent.payload.levelCode
                    : undefined,
                points: typeof standardizedEvent.payload.points === 'number'
                    ? standardizedEvent.payload.points
                    : undefined,
                growthValue: typeof standardizedEvent.payload.growthValue === 'number'
                    ? standardizedEvent.payload.growthValue
                    : undefined,
                status: typeof standardizedEvent.payload.status === 'string'
                    ? standardizedEvent.payload.status
                    : undefined,
                updatedAt: typeof standardizedEvent.payload.updatedAt === 'string'
                    ? standardizedEvent.payload.updatedAt
                    : undefined,
                rawVersion: 'lyt-field-mapping-spec-v1',
                rawPayload: standardizedEvent.payload
            });
            return {
                status: 'synced',
                snapshotId: synced.snapshot.snapshotId,
                externalMemberId: synced.snapshot.externalMemberId,
                memberProfileId: synced.profile.memberId
            };
        }
        catch (error) {
            return {
                status: 'failed',
                reason: error instanceof Error ? error.message : 'unknown-member-sync-error'
            };
        }
    }
    async syncOrderSnapshotFromStandardizedEvent(standardizedEvent) {
        if (standardizedEvent.standardizedEventName !== 'cashier.order-updated' || !this.transactionsService) {
            return null;
        }
        const externalOrderId = typeof standardizedEvent.payload.externalOrderId === 'string'
            ? standardizedEvent.payload.externalOrderId
            : typeof standardizedEvent.payload.orderId === 'string'
                ? standardizedEvent.payload.orderId
                : undefined;
        const tenantId = standardizedEvent.tenantId;
        if (!tenantId || !externalOrderId) {
            return {
                status: 'skipped',
                reason: 'missing-tenant-or-external-order-id'
            };
        }
        try {
            const snapshot = await this.transactionsService.syncLytOrderSnapshot({
                tenantContext: {
                    tenantId,
                    brandId: standardizedEvent.brandId,
                    storeId: standardizedEvent.storeId
                },
                externalOrderId,
                orderNo: typeof standardizedEvent.payload.orderNo === 'string'
                    ? standardizedEvent.payload.orderNo
                    : undefined,
                memberId: typeof standardizedEvent.payload.memberId === 'string'
                    ? standardizedEvent.payload.memberId
                    : undefined,
                couponCode: typeof standardizedEvent.payload.couponCode === 'string'
                    ? standardizedEvent.payload.couponCode
                    : undefined,
                blindboxPlanId: typeof standardizedEvent.payload.blindboxPlanId === 'string'
                    ? standardizedEvent.payload.blindboxPlanId
                    : undefined,
                blindboxQuantity: typeof standardizedEvent.payload.blindboxQuantity === 'number'
                    ? standardizedEvent.payload.blindboxQuantity
                    : undefined,
                amount: typeof standardizedEvent.payload.amount === 'number'
                    ? standardizedEvent.payload.amount
                    : undefined,
                discountAmount: typeof standardizedEvent.payload.discountAmount === 'number'
                    ? standardizedEvent.payload.discountAmount
                    : undefined,
                payableAmount: typeof standardizedEvent.payload.payableAmount === 'number'
                    ? standardizedEvent.payload.payableAmount
                    : undefined,
                currency: typeof standardizedEvent.payload.currency === 'string'
                    ? standardizedEvent.payload.currency
                    : undefined,
                status: typeof standardizedEvent.payload.status === 'string'
                    ? standardizedEvent.payload.status
                    : undefined,
                paidAt: typeof standardizedEvent.payload.paidAt === 'string'
                    ? standardizedEvent.payload.paidAt
                    : undefined,
                updatedAt: typeof standardizedEvent.payload.updatedAt === 'string'
                    ? standardizedEvent.payload.updatedAt
                    : typeof standardizedEvent.payload.occurredAt === 'string'
                        ? standardizedEvent.payload.occurredAt
                        : undefined,
                rawVersion: 'lyt-field-mapping-spec-v1',
                rawPayload: standardizedEvent.payload
            });
            return {
                status: 'synced',
                snapshotId: snapshot.snapshotId,
                externalOrderId: snapshot.externalOrderId
            };
        }
        catch (error) {
            return {
                status: 'failed',
                reason: error instanceof Error ? error.message : 'unknown-order-sync-error'
            };
        }
    }
    async triggerSnapshotConsumersFromStandardizedEvent(input) {
        if (input.standardizedEventName === 'member.profile-synced') {
            if (!this.memberService) {
                return null;
            }
            const memberId = typeof input.memberSnapshotSync?.memberProfileId === 'string'
                ? input.memberSnapshotSync.memberProfileId
                : typeof input.memberSnapshotSync?.memberId === 'string'
                    ? input.memberSnapshotSync.memberId
                    : undefined;
            if (!memberId) {
                return {
                    status: 'skipped',
                    reason: 'member-profile-id-not-found'
                };
            }
            const operationsProfile = await this.memberService.getOperationsProfile(memberId, input.tenantContext);
            if (!operationsProfile) {
                return {
                    status: 'skipped',
                    reason: 'member-operations-profile-not-found'
                };
            }
            const operationsTasks = operationsProfile.recommendedActions.length > 0
                ? await this.memberService.enqueueOperationsTasks({
                    memberId,
                    tenantContext: input.tenantContext,
                    source: 'manual-refresh'
                })
                : undefined;
            return {
                status: 'consumed',
                memberOperationsSync: {
                    status: 'ready',
                    memberId: operationsProfile.memberId,
                    lifecycleStage: operationsProfile.lifecycleStage,
                    audienceSegments: operationsProfile.audienceSegments,
                    recommendedActionCodes: operationsProfile.recommendedActions.map((action) => action.code),
                    triggerCodes: operationsProfile.automationTriggers.map((trigger) => trigger.code),
                    queuedTaskIds: operationsTasks?.queuedTasks.map((task) => task.taskId) ?? [],
                    existingTaskIds: operationsTasks?.existingTasks.map((task) => task.taskId) ?? [],
                    executedReceiptIds: operationsTasks?.executedReceipts.map((receipt) => receipt.executionId) ?? [],
                    executedRuntimeReceiptCodes: operationsTasks?.executedReceipts
                        .map((receipt) => receipt.runtimeReceiptCode)
                        .filter((code) => Boolean(code)) ?? []
                }
            };
        }
        if (input.standardizedEventName === 'cashier.order-updated') {
            if (!this.transactionsService || !this.memberService) {
                return null;
            }
            const externalOrderId = typeof input.orderSnapshotSync?.externalOrderId === 'string'
                ? input.orderSnapshotSync.externalOrderId
                : typeof input.payload.externalOrderId === 'string'
                    ? input.payload.externalOrderId
                    : typeof input.payload.orderId === 'string'
                        ? input.payload.orderId
                        : undefined;
            if (!externalOrderId) {
                return {
                    status: 'skipped',
                    reason: 'order-snapshot-id-not-found'
                };
            }
            const orderSnapshot = await this.transactionsService.getLytOrderSnapshot(externalOrderId, input.tenantContext);
            if (!orderSnapshot) {
                return {
                    status: 'skipped',
                    reason: 'order-snapshot-not-found'
                };
            }
            if (orderSnapshot.status !== 'PAID') {
                return {
                    status: 'skipped',
                    reason: 'order-not-paid'
                };
            }
            if (!orderSnapshot.memberId) {
                return {
                    status: 'skipped',
                    reason: 'order-member-id-not-found'
                };
            }
            const operationsProfile = await this.memberService.getOperationsProfile(orderSnapshot.memberId, input.tenantContext);
            if (!operationsProfile) {
                return {
                    status: 'skipped',
                    reason: 'member-operations-profile-not-found'
                };
            }
            const operationsTasks = operationsProfile.recommendedActions.length > 0
                ? await this.memberService.enqueueOperationsTasks({
                    memberId: orderSnapshot.memberId,
                    tenantContext: input.tenantContext,
                    source: 'payment-success',
                    sourceOrderId: orderSnapshot.externalOrderId
                })
                : undefined;
            return {
                status: 'consumed',
                memberOperationsSync: {
                    status: 'ready',
                    memberId: operationsProfile.memberId,
                    lifecycleStage: operationsProfile.lifecycleStage,
                    audienceSegments: operationsProfile.audienceSegments,
                    recommendedActionCodes: operationsProfile.recommendedActions.map((action) => action.code),
                    triggerCodes: operationsProfile.automationTriggers.map((trigger) => trigger.code),
                    queuedTaskIds: operationsTasks?.queuedTasks.map((task) => task.taskId) ?? [],
                    existingTaskIds: operationsTasks?.existingTasks.map((task) => task.taskId) ?? [],
                    executedReceiptIds: operationsTasks?.executedReceipts.map((receipt) => receipt.executionId) ?? [],
                    executedRuntimeReceiptCodes: operationsTasks?.executedReceipts
                        .map((receipt) => receipt.runtimeReceiptCode)
                        .filter((code) => Boolean(code)) ?? []
                }
            };
        }
        if (!this.transactionsService || !this.loyaltyService) {
            return null;
        }
        if (input.standardizedEventName !== 'cashier.payment-succeeded' &&
            input.standardizedEventName !== 'cashier.payment-failed') {
            return null;
        }
        const externalPaymentId = typeof input.paymentSnapshotSync?.externalPaymentId === 'string'
            ? input.paymentSnapshotSync.externalPaymentId
            : typeof input.payload.externalPaymentId === 'string'
                ? input.payload.externalPaymentId
                : typeof input.payload.paymentId === 'string'
                    ? input.payload.paymentId
                    : undefined;
        const externalOrderId = typeof input.orderSnapshotSync?.externalOrderId === 'string'
            ? input.orderSnapshotSync.externalOrderId
            : typeof input.payload.externalOrderId === 'string'
                ? input.payload.externalOrderId
                : typeof input.payload.orderId === 'string'
                    ? input.payload.orderId
                    : undefined;
        if (!externalPaymentId || !externalOrderId) {
            return {
                status: 'skipped',
                reason: 'missing-snapshot-ids'
            };
        }
        const paymentSnapshot = await this.transactionsService.getLytPaymentSnapshot(externalPaymentId, input.tenantContext);
        let orderSnapshot = await this.transactionsService.getLytOrderSnapshot(externalOrderId, input.tenantContext);
        if (!paymentSnapshot) {
            return {
                status: 'skipped',
                reason: 'payment-snapshot-not-found'
            };
        }
        if (!orderSnapshot) {
            orderSnapshot = await this.transactionsService.syncLytOrderSnapshot({
                tenantContext: input.tenantContext,
                externalOrderId,
                orderNo: typeof input.payload.orderNo === 'string'
                    ? input.payload.orderNo
                    : undefined,
                memberId: typeof input.payload.memberId === 'string'
                    ? input.payload.memberId
                    : undefined,
                couponCode: typeof input.payload.couponCode === 'string'
                    ? input.payload.couponCode
                    : undefined,
                blindboxPlanId: typeof input.payload.blindboxPlanId === 'string'
                    ? input.payload.blindboxPlanId
                    : undefined,
                blindboxQuantity: typeof input.payload.blindboxQuantity === 'number'
                    ? input.payload.blindboxQuantity
                    : undefined,
                amount: typeof input.payload.amount === 'number'
                    ? input.payload.amount
                    : paymentSnapshot.amount,
                discountAmount: typeof input.payload.discountAmount === 'number'
                    ? input.payload.discountAmount
                    : 0,
                payableAmount: typeof input.payload.payableAmount === 'number'
                    ? input.payload.payableAmount
                    : paymentSnapshot.amount,
                currency: typeof input.payload.currency === 'string'
                    ? input.payload.currency
                    : paymentSnapshot.currency,
                status: typeof input.payload.status === 'string'
                    ? input.payload.status
                    : input.standardizedEventName === 'cashier.payment-succeeded'
                        ? 'PAID'
                        : 'PAYMENT_FAILED',
                paidAt: typeof input.payload.paidAt === 'string'
                    ? input.payload.paidAt
                    : paymentSnapshot.paidAt,
                updatedAt: typeof input.payload.updatedAt === 'string'
                    ? input.payload.updatedAt
                    : paymentSnapshot.updatedAtFromSource,
                rawVersion: 'lyt-field-mapping-spec-v1',
                rawPayload: input.payload
            });
        }
        const settlement = input.standardizedEventName === 'cashier.payment-succeeded'
            ? await this.loyaltyService.settlePaidOrderFromSnapshots(orderSnapshot, paymentSnapshot)
            : await this.loyaltyService.settleFailedOrderFromSnapshots(orderSnapshot, paymentSnapshot);
        const memberOperations = input.standardizedEventName === 'cashier.payment-succeeded' &&
            this.memberService &&
            orderSnapshot.memberId
            ? await this.memberService.getOperationsProfile(orderSnapshot.memberId, input.tenantContext)
            : undefined;
        const memberOperationsTasks = input.standardizedEventName === 'cashier.payment-succeeded' &&
            this.memberService &&
            orderSnapshot.memberId
            ? await this.memberService.enqueueOperationsTasks({
                memberId: orderSnapshot.memberId,
                tenantContext: input.tenantContext,
                source: 'payment-success',
                sourceOrderId: orderSnapshot.externalOrderId,
                sourcePaymentId: paymentSnapshot.externalPaymentId
            })
            : undefined;
        const campaignEvaluation = input.standardizedEventName === 'cashier.payment-succeeded' &&
            this.campaignService &&
            orderSnapshot.memberId
            ? this.campaignService.evaluateTriggers({
                eventName: 'payment.success',
                tenantContext: input.tenantContext,
                memberId: orderSnapshot.memberId,
                orderId: orderSnapshot.externalOrderId,
                paymentId: paymentSnapshot.externalPaymentId,
                orderAmount: orderSnapshot.payableAmount
            })
            : undefined;
        return {
            status: 'consumed',
            settlementId: settlement.settlementId,
            orderId: settlement.orderId,
            paymentId: settlement.paymentId,
            campaignDispatchCount: campaignEvaluation?.dispatchedActions ?? 0,
            campaignSkippedCount: campaignEvaluation?.skippedActions ?? 0,
            memberOperationsSync: memberOperations
                ? {
                    status: 'ready',
                    memberId: memberOperations.memberId,
                    lifecycleStage: memberOperations.lifecycleStage,
                    audienceSegments: memberOperations.audienceSegments,
                    recommendedActionCodes: memberOperations.recommendedActions.map((action) => action.code),
                    triggerCodes: memberOperations.automationTriggers.map((trigger) => trigger.code),
                    queuedTaskIds: memberOperationsTasks?.queuedTasks.map((task) => task.taskId) ?? [],
                    existingTaskIds: memberOperationsTasks?.existingTasks.map((task) => task.taskId) ?? [],
                    executedReceiptIds: memberOperationsTasks?.executedReceipts.map((receipt) => receipt.executionId) ?? [],
                    executedRuntimeReceiptCodes: memberOperationsTasks?.executedReceipts
                        .map((receipt) => receipt.runtimeReceiptCode)
                        .filter((code) => Boolean(code)) ?? []
                }
                : null
        };
    }
    async syncPaymentSnapshotFromStandardizedEvent(standardizedEvent) {
        if (!this.transactionsService ||
            (standardizedEvent.standardizedEventName !== 'cashier.payment-succeeded' &&
                standardizedEvent.standardizedEventName !== 'cashier.payment-failed')) {
            return null;
        }
        const externalPaymentId = typeof standardizedEvent.payload.externalPaymentId === 'string'
            ? standardizedEvent.payload.externalPaymentId
            : typeof standardizedEvent.payload.paymentId === 'string'
                ? standardizedEvent.payload.paymentId
                : undefined;
        const externalOrderId = typeof standardizedEvent.payload.externalOrderId === 'string'
            ? standardizedEvent.payload.externalOrderId
            : typeof standardizedEvent.payload.orderId === 'string'
                ? standardizedEvent.payload.orderId
                : undefined;
        const tenantId = standardizedEvent.tenantId;
        if (!tenantId || !externalPaymentId || !externalOrderId) {
            return {
                status: 'skipped',
                reason: 'missing-tenant-payment-or-order-id'
            };
        }
        try {
            const snapshot = await this.transactionsService.syncLytPaymentSnapshot({
                tenantContext: {
                    tenantId,
                    brandId: standardizedEvent.brandId,
                    storeId: standardizedEvent.storeId
                },
                externalPaymentId,
                externalOrderId,
                paymentChannel: typeof standardizedEvent.payload.paymentChannel === 'string'
                    ? standardizedEvent.payload.paymentChannel
                    : typeof standardizedEvent.payload.channel === 'string'
                        ? standardizedEvent.payload.channel
                        : undefined,
                paymentStatus: typeof standardizedEvent.payload.paymentStatus === 'string'
                    ? standardizedEvent.payload.paymentStatus
                    : standardizedEvent.standardizedEventName === 'cashier.payment-succeeded'
                        ? 'SUCCEEDED'
                        : 'FAILED',
                amount: typeof standardizedEvent.payload.amount === 'number'
                    ? standardizedEvent.payload.amount
                    : undefined,
                currency: typeof standardizedEvent.payload.currency === 'string'
                    ? standardizedEvent.payload.currency
                    : undefined,
                transactionNo: typeof standardizedEvent.payload.transactionNo === 'string'
                    ? standardizedEvent.payload.transactionNo
                    : undefined,
                paidAt: typeof standardizedEvent.payload.paidAt === 'string'
                    ? standardizedEvent.payload.paidAt
                    : typeof standardizedEvent.payload.occurredAt === 'string'
                        ? standardizedEvent.payload.occurredAt
                        : undefined,
                updatedAt: typeof standardizedEvent.payload.updatedAt === 'string'
                    ? standardizedEvent.payload.updatedAt
                    : typeof standardizedEvent.payload.occurredAt === 'string'
                        ? standardizedEvent.payload.occurredAt
                        : undefined,
                rawVersion: 'lyt-field-mapping-spec-v1',
                rawPayload: standardizedEvent.payload
            });
            return {
                status: 'synced',
                snapshotId: snapshot.snapshotId,
                externalPaymentId: snapshot.externalPaymentId
            };
        }
        catch (error) {
            return {
                status: 'failed',
                reason: error instanceof Error ? error.message : 'unknown-payment-sync-error'
            };
        }
    }
    getAdapter() {
        return this.adapterRegistry.getDefaultAdapter();
    }
    async getAdapterSelection(storeId, tenantContext) {
        const connection = await this.connectionManager.getConnectionForStore(storeId, tenantContext);
        const selection = this.adapterRegistry.resolveAdapterSelection(connection);
        return {
            ...selection,
            vendor: connection.vendor,
            vendorTenantId: connection.vendorTenantId,
            vendorBrandId: connection.vendorBrandId,
            vendorStoreId: connection.vendorStoreId,
            endpoint: connection.endpoint,
            authMode: connection.authMode,
            capabilities: [...connection.capabilities],
            connectionStatus: connection.connectionStatus,
            credentialRef: connection.credentialRef,
            resolutionLevel: connection.resolutionLevel,
            healthStatus: connection.healthStatus
        };
    }
    async getConnection(storeId, tenantContext) {
        return this.connectionManager.getConnectionForStore(storeId, tenantContext);
    }
    async getConnectionCapabilityReadiness(storeId, tenantContext) {
        if (this.governanceQueryService) {
            return this.governanceQueryService.getConnectionCapabilityReadiness(storeId, tenantContext);
        }
        const [connection, storeRecord] = await Promise.all([
            this.connectionManager.getConnectionForStore(storeId, tenantContext),
            this.findStoreRecord(storeId, tenantContext)
        ]);
        return this.buildConnectionCapabilityReadiness(connection, storeRecord);
    }
    async getConnectionGovernanceSummary(tenantContext) {
        if (this.governanceQueryService) {
            return this.governanceQueryService.getConnectionGovernanceSummary(tenantContext);
        }
        const scopedStores = await this.connectionManager.listScopedStores(tenantContext);
        const readinessList = await Promise.all(scopedStores.map((store) => this.getConnectionCapabilityReadiness(store.id, {
            tenantId: store.tenantId,
            brandId: store.brandId
        })));
        const capabilityBreakdown = this.governedCapabilities.map((capability) => ({
            capability,
            readyStores: readinessList.filter((item) => item.readinessByCapability.some((entry) => entry.capability === capability && entry.readiness === 'ready')).length,
            inheritedReadyStores: readinessList.filter((item) => item.readinessByCapability.some((entry) => entry.capability === capability && entry.readiness === 'inherited-ready')).length,
            staleStores: readinessList.filter((item) => item.readinessByCapability.some((entry) => entry.capability === capability && entry.readiness === 'stale')).length,
            pendingStores: readinessList.filter((item) => item.readinessByCapability.some((entry) => entry.capability === capability && entry.readiness === 'pending-configuration')).length,
            notEnabledStores: readinessList.filter((item) => item.readinessByCapability.some((entry) => entry.capability === capability && entry.readiness === 'not-enabled')).length
        }));
        const storeGroups = this.buildGovernanceStoreGroups(readinessList);
        return {
            generatedAt: new Date().toISOString(),
            scope: {
                tenantId: tenantContext?.tenantId,
                brandId: tenantContext?.brandId
            },
            totalStores: readinessList.length,
            configuredStores: readinessList.filter((item) => item.connectionStatus === 'configured').length,
            pendingConfigurationStores: readinessList.filter((item) => item.connectionStatus === 'pending-configuration').length,
            staleStores: readinessList.filter((item) => item.healthStatus === 'stale').length,
            inheritedStores: readinessList.filter((item) => item.resolutionLevel === 'brand' || item.resolutionLevel === 'tenant')
                .length,
            storeLevelConfiguredStores: readinessList.filter((item) => item.resolutionLevel === 'store').length,
            capabilityBreakdown,
            recommendedNextActions: this.buildGovernanceSummaryRecommendations(readinessList, capabilityBreakdown),
            storeGroups,
            stores: readinessList
                .map((item) => this.buildGovernanceSummaryStoreItem(item))
                .sort((left, right) => {
                const riskOrder = { high: 0, medium: 1, low: 2 };
                return (riskOrder[left.governanceRiskLevel] - riskOrder[right.governanceRiskLevel] ||
                    right.blockingIssueCount - left.blockingIssueCount ||
                    right.alertCodes.length - left.alertCodes.length ||
                    left.storeId.localeCompare(right.storeId));
            })
        };
    }
    async getConnectionGovernanceAlerts(tenantContext) {
        if (this.governanceQueryService) {
            return this.governanceQueryService.getConnectionGovernanceAlerts(tenantContext);
        }
        const readinessList = await this.getScopedReadinessList(tenantContext);
        const alerts = this.buildGovernanceAlerts(readinessList);
        return {
            generatedAt: new Date().toISOString(),
            scope: {
                tenantId: tenantContext?.tenantId,
                brandId: tenantContext?.brandId
            },
            alerts
        };
    }
    async getStoreCapabilityAccessView(storeId, tenantContext) {
        if (this.governanceQueryService) {
            return this.governanceQueryService.getStoreCapabilityAccessView(storeId, tenantContext);
        }
        const readiness = await this.getConnectionCapabilityReadiness(storeId, tenantContext);
        return {
            storeId: readiness.storeId,
            storeCode: readiness.storeCode,
            storeName: readiness.storeName,
            connectionStatus: readiness.connectionStatus,
            resolutionLevel: readiness.resolutionLevel,
            healthStatus: readiness.healthStatus,
            accessByCapability: readiness.readinessByCapability.map((item) => ({
                capability: item.capability,
                readiness: item.readiness,
                access: this.mapReadinessToCapabilityAccess(item.readiness),
                reason: this.getCapabilityAccessReason(item.capability, item.readiness)
            })),
            recommendedNextActions: [...readiness.recommendedNextActions]
        };
    }
    getFixtures(filters) {
        const catalog = (0, lyt_fixture_catalog_1.getLytFixtureCatalog)({
            transport: filters?.transport,
            capability: filters?.capability
        });
        return catalog.map((item) => {
            const validation = (0, lyt_fixture_catalog_1.evaluateLytFixtureValidation)(item);
            return (0, lyt_contract_1.toLytFixtureCatalogItemContract)({
                key: item.key,
                title: item.title,
                transport: item.transport,
                capability: item.capability,
                riskLevel: item.riskLevel,
                method: item.method,
                path: item.path,
                recommendedUsage: item.recommendedUsage,
                eventType: item.eventType,
                mappingVersion: item.mappingVersion,
                requiredRawFields: item.requiredRawFields,
                recommendedRawFields: item.recommendedRawFields,
                requiredHeaders: item.requiredHeaders,
                recommendedHeaders: item.recommendedHeaders,
                requiredQueryParams: item.requiredQueryParams,
                recommendedQueryParams: item.recommendedQueryParams,
                standardFieldChecklist: item.standardFieldChecklist,
                schemaChecklist: item.schemaChecklist,
                archiveChecklist: item.archiveChecklist,
                validationStatus: validation.validationStatus,
                missingSampleFields: validation.missingSampleFields,
                missingChecklistItems: validation.missingChecklistItems,
                samplePayload: item.samplePayload,
                sampleHeaders: item.sampleHeaders,
                sampleQueryParams: item.sampleQueryParams
            });
        });
    }
    getFixtureSummary(filters) {
        const fixtures = this.getFixtures(filters);
        const missingFieldBreakdown = fixtures.reduce((acc, fixture) => {
            for (const field of fixture.missingSampleFields) {
                acc[field] = (acc[field] ?? 0) + 1;
            }
            return acc;
        }, {});
        const missingChecklistBreakdown = fixtures.reduce((acc, fixture) => {
            for (const item of fixture.missingChecklistItems) {
                acc[item] = (acc[item] ?? 0) + 1;
            }
            return acc;
        }, {});
        const recommendedChecklistBreakdown = fixtures.reduce((acc, fixture) => {
            for (const item of [
                ...fixture.recommendedRawFields.map((field) => `payload:${field}`),
                ...fixture.recommendedHeaders.map((field) => `headers:${field}`),
                ...fixture.recommendedQueryParams.map((field) => `query:${field}`)
            ]) {
                acc[item] = (acc[item] ?? 0) + 1;
            }
            return acc;
        }, {});
        const blockedFixtureKeys = fixtures
            .filter((fixture) => fixture.validationStatus === 'needs-sample-completion')
            .map((fixture) => fixture.key);
        return {
            totalFixtures: fixtures.length,
            readyFixtures: fixtures.filter((fixture) => fixture.validationStatus === 'ready-for-rehearsal').length,
            blockedFixtures: fixtures.filter((fixture) => fixture.validationStatus === 'needs-sample-completion').length,
            highRiskBlockedFixtures: fixtures.filter((fixture) => fixture.riskLevel === 'high' && fixture.validationStatus === 'needs-sample-completion').length,
            blockedFixtureKeys,
            transportBreakdown: fixtures.reduce((acc, fixture) => {
                acc[fixture.transport] += 1;
                return acc;
            }, { api: 0, webhook: 0 }),
            capabilityBreakdown: fixtures.reduce((acc, fixture) => {
                acc[fixture.capability] = (acc[fixture.capability] ?? 0) + 1;
                return acc;
            }, {}),
            missingFieldBreakdown,
            missingChecklistBreakdown,
            recommendedChecklistBreakdown,
            recommendedNextActions: this.buildFixtureSummaryRecommendations(fixtures, missingChecklistBreakdown),
            fixtures: fixtures.map((fixture) => ({
                key: fixture.key,
                riskLevel: fixture.riskLevel,
                validationStatus: fixture.validationStatus,
                missingSampleFields: [...fixture.missingSampleFields],
                missingChecklistItems: [...fixture.missingChecklistItems]
            }))
        };
    }
    getFixture(key) {
        const fixture = (0, lyt_fixture_catalog_1.getLytFixtureByKey)(key);
        if (!fixture) {
            throw new common_1.NotFoundException(`LYT fixture not found: ${key}`);
        }
        const validation = (0, lyt_fixture_catalog_1.evaluateLytFixtureValidation)(fixture);
        return (0, lyt_contract_1.toLytFixtureCatalogItemContract)({
            key: fixture.key,
            title: fixture.title,
            transport: fixture.transport,
            capability: fixture.capability,
            riskLevel: fixture.riskLevel,
            method: fixture.method,
            path: fixture.path,
            recommendedUsage: fixture.recommendedUsage,
            eventType: fixture.eventType,
            mappingVersion: fixture.mappingVersion,
            requiredRawFields: fixture.requiredRawFields,
            recommendedRawFields: fixture.recommendedRawFields,
            requiredHeaders: fixture.requiredHeaders,
            recommendedHeaders: fixture.recommendedHeaders,
            requiredQueryParams: fixture.requiredQueryParams,
            recommendedQueryParams: fixture.recommendedQueryParams,
            standardFieldChecklist: fixture.standardFieldChecklist,
            schemaChecklist: fixture.schemaChecklist,
            archiveChecklist: fixture.archiveChecklist,
            validationStatus: validation.validationStatus,
            missingSampleFields: validation.missingSampleFields,
            missingChecklistItems: validation.missingChecklistItems,
            samplePayload: fixture.samplePayload,
            sampleHeaders: fixture.sampleHeaders,
            sampleQueryParams: fixture.sampleQueryParams
        });
    }
    compareFixtureInput(key, input) {
        const fixture = (0, lyt_fixture_catalog_1.getLytFixtureByKey)(key);
        if (!fixture) {
            throw new common_1.NotFoundException(`LYT fixture not found: ${key}`);
        }
        const payload = input.payload ?? {};
        const headers = input.headers ?? {};
        const query = input.query ?? {};
        const payloadMissingRequired = (0, lyt_fixture_catalog_1.getMissingFixtureFields)(fixture, payload);
        const headersMissingRequired = (0, lyt_fixture_catalog_1.getMissingFixtureHeaders)(fixture, headers);
        const queryMissingRequired = (0, lyt_fixture_catalog_1.getMissingFixtureQueryParams)(fixture, query);
        const payloadMissingRecommended = this.getMissingOptionalKeys(fixture.recommendedRawFields, payload);
        const headersMissingRecommended = this.getMissingOptionalKeys(fixture.recommendedHeaders, headers);
        const queryMissingRecommended = this.getMissingOptionalKeys(fixture.recommendedQueryParams, query);
        return {
            fixtureKey: fixture.key,
            readiness: payloadMissingRequired.length || headersMissingRequired.length || queryMissingRequired.length
                ? 'missing-required'
                : 'ready',
            comparedAt: new Date().toISOString(),
            payload: {
                missingRequired: payloadMissingRequired,
                missingRecommended: payloadMissingRecommended,
                ...this.classifyExtraObservedKeys(payload, [...fixture.requiredRawFields, ...fixture.recommendedRawFields], 'payload')
            },
            headers: {
                missingRequired: headersMissingRequired,
                missingRecommended: headersMissingRecommended,
                ...this.classifyExtraObservedKeys(headers, [...fixture.requiredHeaders, ...fixture.recommendedHeaders], 'headers')
            },
            query: {
                missingRequired: queryMissingRequired,
                missingRecommended: queryMissingRecommended,
                ...this.classifyExtraObservedKeys(query, [...fixture.requiredQueryParams, ...fixture.recommendedQueryParams], 'query')
            },
            recommendedNextActions: this.buildCompareRecommendations({
                payloadMissingRequired,
                headersMissingRequired,
                queryMissingRequired,
                payloadMissingRecommended,
                headersMissingRecommended,
                queryMissingRecommended,
                riskyPayloadExtras: this.classifyExtraObservedKeys(payload, [...fixture.requiredRawFields, ...fixture.recommendedRawFields], 'payload').riskyExtraObserved,
                riskyHeaderExtras: this.classifyExtraObservedKeys(headers, [...fixture.requiredHeaders, ...fixture.recommendedHeaders], 'headers').riskyExtraObserved,
                riskyQueryExtras: this.classifyExtraObservedKeys(query, [...fixture.requiredQueryParams, ...fixture.recommendedQueryParams], 'query').riskyExtraObserved
            })
        };
    }
    previewFixtureImport(key, input) {
        const fixture = (0, lyt_fixture_catalog_1.getLytFixtureByKey)(key);
        if (!fixture) {
            throw new common_1.NotFoundException(`LYT fixture not found: ${key}`);
        }
        const nextSamplePayload = {
            ...fixture.samplePayload,
            ...(input.payload ?? {})
        };
        const nextSampleHeaders = {
            ...fixture.sampleHeaders,
            ...(input.headers ?? {})
        };
        const nextSampleQueryParams = {
            ...fixture.sampleQueryParams,
            ...(input.query ?? {})
        };
        const compareReport = this.compareFixtureInput(key, input);
        return {
            fixtureKey: fixture.key,
            previewedAt: new Date().toISOString(),
            readinessAfterImport: this.compareFixtureInput(key, {
                payload: nextSamplePayload,
                headers: nextSampleHeaders,
                query: nextSampleQueryParams
            }).readiness,
            changedSections: [
                ...(this.getChangedKeys(fixture.samplePayload, nextSamplePayload).length > 0 ? ['payload'] : []),
                ...(this.getChangedKeys(fixture.sampleHeaders, nextSampleHeaders).length > 0 ? ['headers'] : []),
                ...(this.getChangedKeys(fixture.sampleQueryParams, nextSampleQueryParams).length > 0 ? ['query'] : [])
            ],
            changedKeys: {
                payload: this.getChangedKeys(fixture.samplePayload, nextSamplePayload),
                headers: this.getChangedKeys(fixture.sampleHeaders, nextSampleHeaders),
                query: this.getChangedKeys(fixture.sampleQueryParams, nextSampleQueryParams)
            },
            nextSamplePayload,
            nextSampleHeaders,
            nextSampleQueryParams,
            compareReport
        };
    }
    planFixtureImport(key, input) {
        const fixture = (0, lyt_fixture_catalog_1.getLytFixtureByKey)(key);
        if (!fixture) {
            throw new common_1.NotFoundException(`LYT fixture not found: ${key}`);
        }
        const preview = this.previewFixtureImport(key, input);
        const compareBeforeImport = this.compareFixtureInput(key, input);
        const compareAfterImport = this.compareFixtureInput(key, {
            payload: preview.nextSamplePayload,
            headers: preview.nextSampleHeaders,
            query: preview.nextSampleQueryParams
        });
        const payloadSection = this.buildImportPlanSection(fixture.samplePayload, preview.nextSamplePayload, compareBeforeImport.payload.safeExtraObserved, compareBeforeImport.payload.riskyExtraObserved, compareAfterImport.payload.missingRequired, compareAfterImport.payload.missingRecommended);
        const headersSection = this.buildImportPlanSection(fixture.sampleHeaders, preview.nextSampleHeaders, compareBeforeImport.headers.safeExtraObserved, compareBeforeImport.headers.riskyExtraObserved, compareAfterImport.headers.missingRequired, compareAfterImport.headers.missingRecommended);
        const querySection = this.buildImportPlanSection(fixture.sampleQueryParams, preview.nextSampleQueryParams, compareBeforeImport.query.safeExtraObserved, compareBeforeImport.query.riskyExtraObserved, compareAfterImport.query.missingRequired, compareAfterImport.query.missingRecommended);
        const riskyExtraCount = payloadSection.riskyExtraCandidates.length +
            headersSection.riskyExtraCandidates.length +
            querySection.riskyExtraCandidates.length;
        const importDecision = compareAfterImport.readiness === 'missing-required'
            ? 'blocked-by-required'
            : riskyExtraCount > 0
                ? 'needs-review'
                : 'ready-to-promote';
        return {
            fixtureKey: fixture.key,
            plannedAt: new Date().toISOString(),
            importDecision,
            readinessBeforeImport: compareBeforeImport.readiness,
            readinessAfterImport: compareAfterImport.readiness,
            changedSections: [...preview.changedSections],
            recommendedPromotions: this.getRecommendedPromotions({
                payload: payloadSection,
                headers: headersSection,
                query: querySection
            }),
            recommendedNextActions: this.buildImportPlanRecommendations({
                importDecision,
                compareAfterImport,
                payloadSection,
                headersSection,
                querySection
            }),
            sections: {
                payload: payloadSection,
                headers: headersSection,
                query: querySection
            },
            preview
        };
    }
    buildFixtureSummaryRecommendations(fixtures, missingChecklistBreakdown) {
        const actions = [];
        const highRiskBlocked = fixtures.filter((fixture) => fixture.riskLevel === 'high' && fixture.validationStatus === 'needs-sample-completion');
        if (highRiskBlocked.length > 0) {
            actions.push('优先补齐高风险 webhook 样例的缺失字段，再开启 strictValidation 回放');
        }
        if (fixtures.some((fixture) => fixture.requiredHeaders.length > 0 || fixture.requiredQueryParams.length > 0)) {
            actions.push('继续补齐 headers/query checklist 对应的真实厂商文档与抓包样例');
        }
        if (fixtures.some((fixture) => fixture.schemaChecklist.length > 0)) {
            actions.push('将 schema checklist 对照到真实 HTTP method、path、headers、body 约束文档');
        }
        const topMissingChecklist = Object.entries(missingChecklistBreakdown).sort((a, b) => b[1] - a[1])[0];
        if (topMissingChecklist) {
            actions.push(`优先补齐高频缺失项 ${topMissingChecklist[0]}，减少样例阻塞`);
        }
        if (actions.length === 0) {
            actions.push('当前样例已可进入真实报文对照与 strictValidation 演练');
        }
        return actions;
    }
    async findStoreRecord(storeId, tenantContext) {
        const scopedStores = await this.connectionManager.listScopedStores(tenantContext);
        return scopedStores.find((store) => store.id === storeId);
    }
    async getScopedReadinessList(tenantContext) {
        const scopedStores = await this.connectionManager.listScopedStores(tenantContext);
        return Promise.all(scopedStores.map((store) => this.getConnectionCapabilityReadiness(store.id, {
            tenantId: store.tenantId,
            brandId: store.brandId
        })));
    }
    buildConnectionCapabilityReadiness(connection, storeRecord) {
        const readinessByCapability = this.governedCapabilities.map((capability) => ({
            capability,
            enabled: connection.capabilities.includes(capability),
            readiness: this.resolveCapabilityReadiness(connection, capability)
        }));
        const missingRequirements = [];
        if (!connection.hasCredential) {
            missingRequirements.push('credential');
        }
        if (connection.connectionStatus === 'pending-configuration') {
            missingRequirements.push('store-scoped-connection');
        }
        if (connection.healthStatus === 'stale') {
            missingRequirements.push('connection-health-refresh');
        }
        if (!connection.vendorTenantId) {
            missingRequirements.push('vendor-tenant-mapping');
        }
        if (connection.brandId && !connection.vendorBrandId) {
            missingRequirements.push('vendor-brand-mapping');
        }
        if (!connection.vendorStoreId) {
            missingRequirements.push('vendor-store-mapping');
        }
        if (connection.resolutionLevel === 'brand' || connection.resolutionLevel === 'tenant') {
            missingRequirements.push('store-level-capability-verification');
        }
        return {
            storeId: connection.storeId,
            storeCode: storeRecord?.code,
            storeName: storeRecord?.name,
            tenantId: connection.tenantId,
            brandId: connection.brandId,
            vendor: connection.vendor,
            vendorTenantId: connection.vendorTenantId,
            vendorBrandId: connection.vendorBrandId,
            vendorStoreId: connection.vendorStoreId,
            connectionStatus: connection.connectionStatus,
            resolutionLevel: connection.resolutionLevel,
            healthStatus: connection.healthStatus,
            hasCredential: connection.hasCredential,
            credentialRef: connection.credentialRef,
            enabledCapabilities: [...connection.capabilities],
            readinessByCapability,
            missingRequirements,
            recommendedNextActions: this.buildCapabilityReadinessRecommendations(connection, readinessByCapability, missingRequirements)
        };
    }
    resolveCapabilityReadiness(connection, capability) {
        if (!connection.capabilities.includes(capability)) {
            return 'not-enabled';
        }
        if (connection.connectionStatus === 'pending-configuration' || !connection.hasCredential) {
            return 'pending-configuration';
        }
        if (connection.healthStatus === 'stale') {
            return 'stale';
        }
        if (connection.resolutionLevel === 'brand' || connection.resolutionLevel === 'tenant') {
            return 'inherited-ready';
        }
        return 'ready';
    }
    buildCapabilityReadinessRecommendations(connection, readinessByCapability, missingRequirements) {
        const actions = [];
        if (connection.connectionStatus === 'pending-configuration') {
            actions.push('优先为该门店补齐独立 endpoint 与 credential，避免长期停留在 fallback/mock 状态');
        }
        if (connection.healthStatus === 'stale') {
            actions.push('尽快刷新该门店连接健康检查，确认 token、签名和 endpoint 是否仍然有效');
        }
        if (!connection.vendorTenantId || (connection.brandId && !connection.vendorBrandId) || !connection.vendorStoreId) {
            actions.push('优先补齐 vendorTenantId / vendorBrandId / vendorStoreId 映射，避免我方主键与 LYT 外部编码混用');
        }
        if (connection.resolutionLevel === 'brand' || connection.resolutionLevel === 'tenant') {
            actions.push('当前门店仍在继承上级连接，建议逐店核对 vendorStoreId 与 capability 开通范围');
        }
        if (readinessByCapability.some((item) => item.readiness === 'not-enabled')) {
            actions.push('根据门店实际设备与经营形态确认未开通 capability 是否需要补配或显式禁用');
        }
        if (missingRequirements.length === 0) {
            actions.push('当前门店连接与 capability readiness 已具备接入治理条件，可继续接真实读面与运营台');
        }
        return actions;
    }
    buildGovernanceSummaryRecommendations(readinessList, capabilityBreakdown) {
        const actions = [];
        if (readinessList.some((item) => item.connectionStatus === 'pending-configuration')) {
            actions.push('优先清理 pending-configuration 门店，先补真实 endpoint、credential 和 vendorStoreId 映射');
        }
        if (readinessList.some((item) => item.healthStatus === 'stale')) {
            actions.push('针对 stale 门店批量执行连接巡检，确认签名、凭证和健康检查时效');
        }
        if (readinessList.some((item) => item.missingRequirements.some((entry) => entry.startsWith('vendor-')))) {
            actions.push('优先补齐 vendorTenantId / vendorBrandId / vendorStoreId 映射，先统一外部编码再继续推进工作台接入');
        }
        if (readinessList.some((item) => item.resolutionLevel === 'brand' || item.resolutionLevel === 'tenant')) {
            actions.push('对继承品牌/租户默认连接的门店逐店核查 capability readiness，避免上级默认配置掩盖门店差异');
        }
        const topPendingCapability = [...capabilityBreakdown].sort((a, b) => b.pendingStores - a.pendingStores)[0];
        if (topPendingCapability && topPendingCapability.pendingStores > 0) {
            actions.push(`优先补齐 capability ${topPendingCapability.capability} 的门店开通信息，减少门店侧功能降级`);
        }
        if (actions.length === 0) {
            actions.push('当前租户/品牌的 LYT 连接治理状态稳定，可继续推进真实门店读面和运营工作台接入');
        }
        return actions;
    }
    buildGovernanceStoreGroups(readinessList) {
        const groups = [];
        const definitions = [
            {
                code: 'high-risk-stores',
                label: '高风险门店',
                severity: 'high',
                recommendedFocus: 'high-risk',
                primaryActionLabel: '优先处理高风险门店',
                recommendedNextActions: ['优先处理 pending、凭证缺失和 vendor 映射缺口门店，避免真实接入继续阻塞'],
                match: (item) => item.connectionStatus === 'pending-configuration' ||
                    !item.hasCredential ||
                    item.missingRequirements.some((entry) => entry.startsWith('vendor-'))
            },
            {
                code: 'pending-configuration-stores',
                label: '待配置门店',
                severity: 'high',
                recommendedFocus: 'connection-setup',
                primaryActionLabel: '进入连接配置',
                recommendedNextActions: ['优先补齐 endpoint、credential 与 vendorStoreId，尽快退出 fallback/mock 状态'],
                match: (item) => item.connectionStatus === 'pending-configuration'
            },
            {
                code: 'stale-stores',
                label: '健康过期门店',
                severity: 'high',
                recommendedFocus: 'health-check',
                primaryActionLabel: '执行健康巡检',
                recommendedNextActions: ['批量执行连接巡检并刷新健康状态，确认 token、签名和域名仍有效'],
                match: (item) => item.healthStatus === 'stale'
            },
            {
                code: 'vendor-mapping-gaps',
                label: '外部编码映射缺口',
                severity: 'high',
                recommendedFocus: 'vendor-mapping',
                primaryActionLabel: '补齐外部编码映射',
                recommendedNextActions: ['先统一 vendorTenantId / vendorBrandId / vendorStoreId，再推进工作台接入与事件治理'],
                match: (item) => item.missingRequirements.some((entry) => entry.startsWith('vendor-'))
            },
            {
                code: 'credential-missing-stores',
                label: '凭证缺失门店',
                severity: 'high',
                recommendedFocus: 'credential-binding',
                primaryActionLabel: '绑定真实凭证',
                recommendedNextActions: ['为缺失凭证的门店补齐 credentialRef 或安全密钥绑定'],
                match: (item) => !item.hasCredential
            },
            {
                code: 'inherited-store-verification',
                label: '继承配置待核验',
                severity: 'medium',
                recommendedFocus: 'inheritance-verification',
                primaryActionLabel: '核验继承配置',
                recommendedNextActions: ['逐店核对 vendorStoreId、能力开通范围和门店级差异配置'],
                match: (item) => item.resolutionLevel === 'brand' || item.resolutionLevel === 'tenant'
            }
        ];
        for (const definition of definitions) {
            const storeIds = readinessList.filter(definition.match).map((item) => item.storeId);
            if (storeIds.length === 0) {
                continue;
            }
            groups.push({
                code: definition.code,
                label: definition.label,
                severity: definition.severity,
                count: storeIds.length,
                storeIds,
                recommendedFocus: definition.recommendedFocus,
                primaryActionLabel: definition.primaryActionLabel,
                recommendedNextActions: [...definition.recommendedNextActions]
            });
        }
        return groups.sort((left, right) => {
            const severityOrder = { high: 0, medium: 1, low: 2 };
            return severityOrder[left.severity] - severityOrder[right.severity] || right.count - left.count || left.label.localeCompare(right.label);
        });
    }
    buildGovernanceSummaryStoreItem(readiness) {
        const alertCodes = this.getStoreAlertCodes(readiness);
        const blockingIssueCount = readiness.readinessByCapability.filter((item) => item.readiness === 'pending-configuration' || item.readiness === 'stale').length;
        const issueActions = this.getStoreIssueActions(readiness, alertCodes);
        const primaryAction = issueActions[0];
        return {
            storeId: readiness.storeId,
            storeCode: readiness.storeCode,
            storeName: readiness.storeName,
            resolutionLevel: readiness.resolutionLevel,
            healthStatus: readiness.healthStatus,
            connectionStatus: readiness.connectionStatus,
            enabledCapabilities: [...readiness.enabledCapabilities],
            missingRequirements: [...readiness.missingRequirements],
            governanceRiskLevel: this.getStoreGovernanceRiskLevel(readiness, alertCodes),
            alertCodes,
            blockingIssueCount,
            primaryIssueCode: primaryAction.code,
            primaryFocus: primaryAction.focus,
            primaryActionLabel: primaryAction.label,
            secondaryIssues: issueActions.slice(1),
            focusTrail: this.buildStoreFocusTrail(issueActions),
            recommendedNextActions: [...readiness.recommendedNextActions]
        };
    }
    getStoreAlertCodes(readiness) {
        const alertCodes = [];
        if (readiness.connectionStatus === 'pending-configuration') {
            alertCodes.push('pending-configuration-stores');
        }
        if (readiness.healthStatus === 'stale') {
            alertCodes.push('stale-connections');
        }
        if (!readiness.hasCredential) {
            alertCodes.push('credential-missing-stores');
        }
        if (readiness.missingRequirements.some((item) => item.startsWith('vendor-'))) {
            alertCodes.push('vendor-mapping-gaps');
        }
        if (readiness.resolutionLevel === 'brand' || readiness.resolutionLevel === 'tenant') {
            alertCodes.push('inherited-store-verification');
        }
        if (readiness.readinessByCapability.some((item) => item.readiness === 'pending-configuration')) {
            alertCodes.push('capability-pending-stores');
        }
        if (readiness.readinessByCapability.some((item) => item.readiness === 'not-enabled')) {
            alertCodes.push('capability-not-enabled-gaps');
        }
        return alertCodes;
    }
    getStoreGovernanceRiskLevel(readiness, alertCodes) {
        if (readiness.connectionStatus === 'pending-configuration' ||
            !readiness.hasCredential ||
            readiness.missingRequirements.some((item) => item.startsWith('vendor-'))) {
            return 'high';
        }
        if (readiness.healthStatus === 'stale' ||
            readiness.resolutionLevel === 'brand' ||
            readiness.resolutionLevel === 'tenant' ||
            alertCodes.includes('capability-pending-stores')) {
            return 'medium';
        }
        return 'low';
    }
    getStoreIssueActions(readiness, alertCodes) {
        const actions = [];
        const pushAction = (action) => {
            if (!actions.some((item) => item.code === action.code)) {
                actions.push(action);
            }
        };
        if (readiness.connectionStatus === 'pending-configuration') {
            pushAction({
                code: 'pending-configuration-stores',
                focus: 'connection-setup',
                label: '补齐连接配置'
            });
        }
        if (readiness.missingRequirements.some((item) => item.startsWith('vendor-'))) {
            pushAction({
                code: 'vendor-mapping-gaps',
                focus: 'vendor-mapping',
                label: '补齐外部编码映射'
            });
        }
        if (!readiness.hasCredential) {
            pushAction({
                code: 'credential-missing-stores',
                focus: 'credential-binding',
                label: '绑定真实凭证'
            });
        }
        if (readiness.healthStatus === 'stale') {
            pushAction({
                code: 'stale-connections',
                focus: 'health-check',
                label: '执行健康巡检'
            });
        }
        if (readiness.resolutionLevel === 'brand' || readiness.resolutionLevel === 'tenant') {
            pushAction({
                code: 'inherited-store-verification',
                focus: 'inheritance-verification',
                label: '核验继承配置'
            });
        }
        if (alertCodes.includes('capability-pending-stores')) {
            pushAction({
                code: 'capability-pending-stores',
                focus: 'capability-rollout',
                label: '推进能力开通'
            });
        }
        if (actions.length === 0) {
            pushAction({
                code: 'healthy',
                focus: 'stable',
                label: '查看稳定读面'
            });
        }
        return actions;
    }
    buildStoreFocusTrail(issueActions) {
        const focusTrail = [];
        for (const action of issueActions) {
            if (!focusTrail.includes(action.focus)) {
                focusTrail.push(action.focus);
            }
        }
        return focusTrail;
    }
    buildGovernanceAlerts(readinessList) {
        const alerts = [];
        const pendingStores = readinessList.filter((item) => item.connectionStatus === 'pending-configuration');
        if (pendingStores.length > 0) {
            alerts.push({
                severity: 'high',
                code: 'pending-configuration-stores',
                count: pendingStores.length,
                summary: '存在仍未完成真实连接配置的门店，相关能力将持续被阻塞',
                affectedStoreIds: pendingStores.map((item) => item.storeId),
                affectedCapabilities: this.collectAffectedCapabilities(pendingStores, ['pending-configuration']),
                recommendedNextActions: ['优先补齐 endpoint、credential 与 vendorStoreId，尽快退出 fallback/mock 状态']
            });
        }
        const staleStores = readinessList.filter((item) => item.healthStatus === 'stale');
        if (staleStores.length > 0) {
            alerts.push({
                severity: 'high',
                code: 'stale-connections',
                count: staleStores.length,
                summary: '存在健康状态已 stale 的门店连接，需尽快复核凭证、签名与 endpoint',
                affectedStoreIds: staleStores.map((item) => item.storeId),
                affectedCapabilities: this.collectAffectedCapabilities(staleStores, ['stale']),
                recommendedNextActions: ['批量执行连接巡检并刷新健康状态，确认 token、签名和域名仍有效']
            });
        }
        const credentialMissingStores = readinessList.filter((item) => !item.hasCredential);
        if (credentialMissingStores.length > 0) {
            alerts.push({
                severity: 'high',
                code: 'credential-missing-stores',
                count: credentialMissingStores.length,
                summary: '存在缺少真实 credential 的门店，无法安全进入正式接入链路',
                affectedStoreIds: credentialMissingStores.map((item) => item.storeId),
                affectedCapabilities: this.collectAffectedCapabilities(credentialMissingStores, ['pending-configuration']),
                recommendedNextActions: ['为缺失凭证的门店补齐 credentialRef 或安全密钥绑定']
            });
        }
        const vendorMappingGapStores = readinessList.filter((item) => item.missingRequirements.some((entry) => entry.startsWith('vendor-')));
        if (vendorMappingGapStores.length > 0) {
            alerts.push({
                severity: 'high',
                code: 'vendor-mapping-gaps',
                count: vendorMappingGapStores.length,
                summary: '存在门店缺少 LYT 外部编码映射，需先补齐 vendorTenantId / vendorBrandId / vendorStoreId',
                affectedStoreIds: vendorMappingGapStores.map((item) => item.storeId),
                affectedCapabilities: this.collectEnabledCapabilities(vendorMappingGapStores),
                recommendedNextActions: ['先统一 LYT 外部编码映射，再推进真实门店接入、事件治理与前端读面']
            });
        }
        const inheritedStores = readinessList.filter((item) => item.resolutionLevel === 'brand' || item.resolutionLevel === 'tenant');
        if (inheritedStores.length > 0) {
            alerts.push({
                severity: 'medium',
                code: 'inherited-store-verification',
                count: inheritedStores.length,
                summary: '存在仍继承品牌或租户默认连接的门店，需逐店核对 capability 与 vendorStoreId',
                affectedStoreIds: inheritedStores.map((item) => item.storeId),
                affectedCapabilities: this.collectAffectedCapabilities(inheritedStores, ['inherited-ready']),
                recommendedNextActions: ['优先核验继承门店的 vendorStoreId、能力开通范围和门店级差异配置']
            });
        }
        const pendingByCapability = this.governedCapabilities
            .map((capability) => ({
            capability,
            stores: readinessList.filter((item) => item.readinessByCapability.some((entry) => entry.capability === capability && entry.readiness === 'pending-configuration'))
        }))
            .filter((entry) => entry.stores.length > 0)
            .sort((left, right) => right.stores.length - left.stores.length)[0];
        if (pendingByCapability) {
            alerts.push({
                severity: 'medium',
                code: 'capability-pending-stores',
                count: pendingByCapability.stores.length,
                summary: `capability ${pendingByCapability.capability} 在多个门店仍未达到接入就绪，相关工作台需保持阻塞`,
                affectedStoreIds: pendingByCapability.stores.map((item) => item.storeId),
                affectedCapabilities: [pendingByCapability.capability],
                recommendedNextActions: [`优先补齐 capability ${pendingByCapability.capability} 的门店开通、凭证和真实链路校验`]
            });
        }
        const notEnabledByCapability = this.governedCapabilities
            .map((capability) => ({
            capability,
            stores: readinessList.filter((item) => item.readinessByCapability.some((entry) => entry.capability === capability && entry.readiness === 'not-enabled'))
        }))
            .filter((entry) => entry.stores.length > 0)
            .sort((left, right) => right.stores.length - left.stores.length)[0];
        if (notEnabledByCapability) {
            alerts.push({
                severity: 'low',
                code: 'capability-not-enabled-gaps',
                count: notEnabledByCapability.stores.length,
                summary: `capability ${notEnabledByCapability.capability} 在部分门店未启用，前端需按门店能力隐藏无效入口`,
                affectedStoreIds: notEnabledByCapability.stores.map((item) => item.storeId),
                affectedCapabilities: [notEnabledByCapability.capability],
                recommendedNextActions: [`确认 capability ${notEnabledByCapability.capability} 是业务不适用还是待补配，避免前端误开放入口`]
            });
        }
        return alerts;
    }
    collectAffectedCapabilities(readinessList, targetStates) {
        return this.governedCapabilities.filter((capability) => readinessList.some((item) => item.readinessByCapability.some((entry) => entry.capability === capability && targetStates.includes(entry.readiness))));
    }
    collectEnabledCapabilities(readinessList) {
        return this.governedCapabilities.filter((capability) => readinessList.some((item) => item.enabledCapabilities.includes(capability)));
    }
    mapReadinessToCapabilityAccess(readiness) {
        if (readiness === 'ready') {
            return 'enabled';
        }
        if (readiness === 'inherited-ready' || readiness === 'stale') {
            return 'degraded';
        }
        if (readiness === 'pending-configuration') {
            return 'blocked';
        }
        return 'hidden';
    }
    getCapabilityAccessReason(capability, readiness) {
        if (readiness === 'ready') {
            return `${capability} 已具备门店级稳定接入条件，可正常开放`;
        }
        if (readiness === 'inherited-ready') {
            return `${capability} 当前来自品牌/租户继承连接，建议保留降级提示并继续逐店核验`;
        }
        if (readiness === 'stale') {
            return `${capability} 当前连接健康状态已 stale，建议降级显示并优先巡检`;
        }
        if (readiness === 'pending-configuration') {
            return `${capability} 尚未完成真实连接配置，前端应阻塞相关操作入口`;
        }
        return `${capability} 未在当前门店启用，前端应隐藏无效入口`;
    }
    getMissingOptionalKeys(keys, input) {
        return keys.filter((key) => {
            const value = input[key];
            return value === undefined || value === null || value === '';
        });
    }
    classifyExtraObservedKeys(input, allowedKeys, scope) {
        const extraKeys = Object.keys(input).filter((key) => !allowedKeys.includes(key));
        const safeExtraObserved = extraKeys.filter((key) => this.isSafeExtraObservedKey(key, scope));
        const riskyExtraObserved = extraKeys.filter((key) => !this.isSafeExtraObservedKey(key, scope));
        return {
            safeExtraObserved,
            riskyExtraObserved
        };
    }
    isSafeExtraObservedKey(key, scope) {
        const normalized = key.toLowerCase();
        if (scope === 'headers') {
            return normalized.startsWith('x-') || normalized.includes('trace') || normalized.includes('request-id');
        }
        if (scope === 'query') {
            return normalized.includes('trace') || normalized.includes('page') || normalized.includes('channel');
        }
        return normalized.includes('remark') || normalized.includes('note') || normalized.includes('source');
    }
    getChangedKeys(previous, next) {
        const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);
        return Array.from(keys).filter((key) => previous[key] !== next[key]);
    }
    buildImportPlanSection(previous, next, safeExtraCandidates, riskyExtraCandidates, unresolvedRequiredAfterImport, unresolvedRecommendedAfterImport) {
        const changedKeys = this.getChangedKeys(previous, next);
        return {
            add: changedKeys.filter((key) => previous[key] === undefined),
            update: changedKeys.filter((key) => previous[key] !== undefined),
            safeExtraCandidates: [...safeExtraCandidates],
            riskyExtraCandidates: [...riskyExtraCandidates],
            unresolvedRequiredAfterImport: [...unresolvedRequiredAfterImport],
            unresolvedRecommendedAfterImport: [...unresolvedRecommendedAfterImport]
        };
    }
    getRecommendedPromotions(sections) {
        const entries = [];
        for (const scope of ['payload', 'headers', 'query']) {
            const section = sections[scope];
            for (const key of [...section.add, ...section.update, ...section.safeExtraCandidates]) {
                const label = `${scope}:${key}`;
                if (!entries.includes(label)) {
                    entries.push(label);
                }
            }
        }
        return entries;
    }
    buildImportPlanRecommendations(input) {
        const actions = [];
        if (input.importDecision === 'blocked-by-required') {
            actions.push('导入后仍缺少 required 项，先补齐缺失字段后再升级 fixture sample');
        }
        if (input.payloadSection.riskyExtraCandidates.length ||
            input.headersSection.riskyExtraCandidates.length ||
            input.querySection.riskyExtraCandidates.length) {
            actions.push('导入前先审查 risky extra 字段，确认是否纳入 fixture 合同或仅保留在抓包归档中');
        }
        if (input.headersSection.add.includes('signature') ||
            input.headersSection.update.includes('signature') ||
            input.headersSection.add.includes('timestamp') ||
            input.headersSection.update.includes('timestamp')) {
            actions.push('复核 signature/timestamp 是否适合作为稳定样例值，避免把一次性签名直接固化进 fixture');
        }
        if (input.compareAfterImport.payload.missingRecommended.length ||
            input.compareAfterImport.headers.missingRecommended.length ||
            input.compareAfterImport.query.missingRecommended.length) {
            actions.push('导入后继续补齐 remaining recommended 项，提升后续 compare 与回放完整度');
        }
        if (input.importDecision === 'ready-to-promote' &&
            input.payloadSection.safeExtraCandidates.length +
                input.headersSection.safeExtraCandidates.length +
                input.querySection.safeExtraCandidates.length >
                0) {
            actions.push('当前抓包已可作为 sample 候选，safe extra 可随样例一并纳入并继续观察稳定性');
        }
        if (actions.length === 0) {
            actions.push('当前导入计划已稳定，可直接将变更后的 sample 纳入 fixture 基线');
        }
        return actions;
    }
    buildCompareRecommendations(input) {
        const actions = [];
        if (input.payloadMissingRequired.length || input.headersMissingRequired.length || input.queryMissingRequired.length) {
            actions.push('先补齐 required 项，再进行 strictValidation 演练或真实对接联调');
        }
        if (input.headersMissingRequired.length || input.headersMissingRecommended.length) {
            actions.push('补齐 headers 抓包样例，重点核对 signature、timestamp 和厂商扩展头');
        }
        if (input.queryMissingRequired.length || input.queryMissingRecommended.length) {
            actions.push('补齐 query 参数样例，并确认 traceId 或路由透传参数约定');
        }
        if (input.payloadMissingRecommended.length) {
            actions.push('补齐 recommended payload 字段，提升标准化事件与归档信息完整度');
        }
        if (input.riskyPayloadExtras.length || input.riskyHeaderExtras.length || input.riskyQueryExtras.length) {
            actions.push('优先审查 unknown risky extra 字段，确认是否需要纳入 fixture 合同或过滤掉');
        }
        if (actions.length === 0) {
            actions.push('当前输入已覆盖 required/recommended 项，可进入真实厂商报文对照');
        }
        return actions;
    }
    async replayWebhookFixture(input) {
        const fixture = (0, lyt_fixture_catalog_1.getLytFixtureByKey)(input.fixtureKey);
        if (!fixture) {
            throw new common_1.NotFoundException(`LYT fixture not found: ${input.fixtureKey}`);
        }
        if (fixture.transport !== 'webhook') {
            throw new common_1.BadRequestException(`LYT fixture is not webhook-capable: ${input.fixtureKey}`);
        }
        const payload = {
            ...fixture.samplePayload,
            ...(input.payload ?? {})
        };
        const headers = {
            ...fixture.sampleHeaders,
            ...(input.headers ?? {})
        };
        const query = {
            ...fixture.sampleQueryParams,
            ...(input.query ?? {})
        };
        const missingChecklistItems = [
            ...(0, lyt_fixture_catalog_1.getMissingFixtureFields)(fixture, payload).map((field) => `payload:${field}`),
            ...(0, lyt_fixture_catalog_1.getMissingFixtureHeaders)(fixture, headers).map((field) => `headers:${field}`),
            ...(0, lyt_fixture_catalog_1.getMissingFixtureQueryParams)(fixture, query).map((field) => `query:${field}`)
        ];
        if (input.strictValidation && missingChecklistItems.length > 0) {
            throw new common_1.BadRequestException(`LYT fixture input missing required checklist items: ${missingChecklistItems.join(', ')}`);
        }
        const timestamp = headers.timestamp ?? new Date().toISOString();
        const signature = headers.signature ?? `fixture:${fixture.key}`;
        return this.acceptWebhook({
            fixtureKey: fixture.key,
            eventId: input.eventId ?? `fixture-${fixture.key}-${Date.now()}`,
            eventType: fixture.eventType,
            signature,
            timestamp,
            rawBody: JSON.stringify(payload),
            rawHeaders: headers,
            rawQuery: query,
            payload
        }).then(async (result) => {
            const standardizedEvent = result.standardizedEvent;
            if (standardizedEvent?.aggregateId) {
                const sourceEventName = standardizedEvent.sourceEventName ?? fixture.eventType ?? 'unknown';
                const standardizedEventName = standardizedEvent.standardizedEventName ?? fixture.eventType ?? 'unknown';
                const capability = standardizedEvent.capability ?? 'unknown';
                await this.emitAudit({
                    eventType: 'lyt.fixture.replayed',
                    aggregateId: standardizedEvent.aggregateId,
                    standardizedEvent: {
                        tenantId: standardizedEvent.tenantId,
                        brandId: standardizedEvent.brandId,
                        storeId: standardizedEvent.storeId,
                        capability,
                        sourceEventName,
                        standardizedEventName
                    },
                    details: {
                        fixtureKey: fixture.key,
                        strictValidation: Boolean(input.strictValidation),
                        acceptedStatus: result.status ?? 'accepted'
                    }
                });
            }
            return result;
        });
    }
    async drillWebhook(input) {
        const fixture = input.fixtureKey ? (0, lyt_fixture_catalog_1.getLytFixtureByKey)(input.fixtureKey) : null;
        const resolvedPayload = {
            ...(fixture?.samplePayload ?? {}),
            ...(input.payload ?? {})
        };
        const standardizedEvent = (0, lyt_contract_1.toLytStandardizedWebhookEventContract)({
            eventId: input.eventId ?? `drill-${Date.now()}`,
            eventType: input.eventType ?? fixture?.eventType,
            payload: resolvedPayload
        });
        const archiveRecord = (0, lyt_contract_1.toLytWebhookArchiveRecordContract)({
            source: 'lyt-drill',
            standardizedEvent,
            rawPayload: resolvedPayload,
            fixtureKey: fixture?.key
        });
        if (input.dryRun) {
            return {
                mode: 'dry-run',
                standardizedEvent,
                archiveRecord,
                standardizedEnvelope: null,
                standardizedPublicationStatus: null
            };
        }
        const standardizedPublication = await this.integrationOrchestrationService.publishEvent(standardizedEvent.standardizedEventName, standardizedEvent.payload, {
            source: 'lyt-drill',
            aggregateId: standardizedEvent.aggregateId,
            idempotencyKey: standardizedEvent.idempotencyKey,
            headers: {
                'x-lyt-drill-event': standardizedEvent.sourceEventName,
                ...(standardizedEvent.tenantId ? { 'x-tenant-id': standardizedEvent.tenantId } : {}),
                ...(standardizedEvent.brandId ? { 'x-brand-id': standardizedEvent.brandId } : {}),
                ...(standardizedEvent.storeId ? { 'x-store-id': standardizedEvent.storeId } : {})
            }
        });
        return {
            mode: 'published',
            standardizedEvent,
            archiveRecord,
            standardizedEnvelope: standardizedPublication.envelope
                ? {
                    aggregateId: standardizedPublication.envelope.aggregateId,
                    eventName: standardizedPublication.envelope.eventName,
                    source: standardizedPublication.envelope.source
                }
                : null,
            standardizedPublicationStatus: standardizedPublication.status ?? null
        };
    }
    getBootstrap() {
        const foundationDependency = this.foundationService.getDependencySummary('lyt-adapter');
        return {
            adapter: this.adapterRegistry.getDefaultAdapter().adapterName,
            foundationDependencies: foundationDependency?.dependsOn ?? [],
            foundationContracts: foundationDependency?.handoffContracts ?? [],
            availableAdapters: this.adapterRegistry.listAvailableAdapters(),
            selectionStrategy: 'connection-driven: mock -> sandbox -> real'
        };
    }
    async acceptWebhook(input) {
        const receivedAt = new Date().toISOString();
        const accepted = await this.integrationOrchestrationService.acceptWebhook('lyt', input);
        const aggregateId = accepted.envelope?.aggregateId ?? accepted.idempotency?.key?.replace(/^lyt:/, '');
        if (!aggregateId) {
            return {
                ...accepted,
                standardizedEvent: null,
                standardizedEnvelope: null,
                runtimeReceipt: null
            };
        }
        const standardizedEvent = (0, lyt_contract_1.toLytStandardizedWebhookEventContract)({
            eventId: aggregateId,
            eventType: input.eventType,
            payload: input.payload
        });
        const archiveRecord = (0, lyt_contract_1.toLytWebhookArchiveRecordContract)({
            source: 'lyt-callback',
            standardizedEvent,
            rawPayload: input.payload,
            rawBody: input.rawBody,
            rawHeaders: input.rawHeaders,
            rawQuery: input.rawQuery,
            receivedAt,
            fixtureKey: input.fixtureKey,
            signatureVerified: typeof accepted.signatureVerified === 'boolean' ? accepted.signatureVerified : false
        });
        const runtimeReceipt = await this.attachWebhookRuntimeReceipt({
            acceptedStatus: accepted.status,
            aggregateId,
            acceptedIdempotencyKey: typeof accepted.idempotency?.key === 'string' ? accepted.idempotency.key : undefined,
            standardizedEvent,
            archiveRecord
        });
        if (accepted.status === 'duplicate') {
            const memberSnapshotSync = await this.syncMemberSnapshotFromStandardizedEvent(standardizedEvent);
            const orderSnapshotSync = await this.syncOrderSnapshotFromStandardizedEvent(standardizedEvent);
            const paymentSnapshotSync = await this.syncPaymentSnapshotFromStandardizedEvent(standardizedEvent);
            const snapshotConsumerSync = standardizedEvent.tenantId
                ? await this.triggerSnapshotConsumersFromStandardizedEvent({
                    standardizedEventName: standardizedEvent.standardizedEventName,
                    tenantContext: {
                        tenantId: standardizedEvent.tenantId,
                        brandId: standardizedEvent.brandId,
                        storeId: standardizedEvent.storeId
                    },
                    memberSnapshotSync,
                    orderSnapshotSync,
                    paymentSnapshotSync,
                    payload: standardizedEvent.payload
                })
                : null;
            await this.emitAudit({
                eventType: 'lyt.webhook.accepted',
                aggregateId,
                standardizedEvent,
                details: {
                    acceptedStatus: 'duplicate',
                    signatureVerified: typeof accepted.signatureVerified === 'boolean' ? accepted.signatureVerified : false,
                    ...(input.fixtureKey ? { fixtureKey: input.fixtureKey } : {})
                },
                riskLevel: 'low'
            });
            return {
                ...accepted,
                standardizedEvent,
                archiveRecord,
                standardizedEnvelope: null,
                runtimeReceipt,
                memberSnapshotSync,
                orderSnapshotSync,
                paymentSnapshotSync,
                snapshotConsumerSync
            };
        }
        const memberSnapshotSync = await this.syncMemberSnapshotFromStandardizedEvent(standardizedEvent);
        const orderSnapshotSync = await this.syncOrderSnapshotFromStandardizedEvent(standardizedEvent);
        const paymentSnapshotSync = await this.syncPaymentSnapshotFromStandardizedEvent(standardizedEvent);
        const snapshotConsumerSync = standardizedEvent.tenantId
            ? await this.triggerSnapshotConsumersFromStandardizedEvent({
                standardizedEventName: standardizedEvent.standardizedEventName,
                tenantContext: {
                    tenantId: standardizedEvent.tenantId,
                    brandId: standardizedEvent.brandId,
                    storeId: standardizedEvent.storeId
                },
                memberSnapshotSync,
                orderSnapshotSync,
                paymentSnapshotSync,
                payload: standardizedEvent.payload
            })
            : null;
        const standardizedPublication = await this.integrationOrchestrationService.publishEvent(standardizedEvent.standardizedEventName, standardizedEvent.payload, {
            source: 'lyt-standardized',
            aggregateId: standardizedEvent.aggregateId,
            idempotencyKey: standardizedEvent.idempotencyKey,
            headers: {
                'x-lyt-source-event': standardizedEvent.sourceEventName,
                ...(standardizedEvent.tenantId ? { 'x-tenant-id': standardizedEvent.tenantId } : {}),
                ...(standardizedEvent.brandId ? { 'x-brand-id': standardizedEvent.brandId } : {}),
                ...(standardizedEvent.storeId ? { 'x-store-id': standardizedEvent.storeId } : {})
            }
        });
        await this.emitAudit({
            eventType: 'lyt.webhook.accepted',
            aggregateId,
            standardizedEvent,
            details: {
                acceptedStatus: 'accepted',
                publicationStatus: standardizedPublication.status,
                signatureVerified: typeof accepted.signatureVerified === 'boolean' ? accepted.signatureVerified : false,
                ...(input.fixtureKey ? { fixtureKey: input.fixtureKey } : {})
            }
        });
        return {
            ...accepted,
            standardizedEvent,
            archiveRecord,
            standardizedEnvelope: standardizedPublication.envelope,
            standardizedPublicationStatus: standardizedPublication.status,
            runtimeReceipt,
            memberSnapshotSync,
            orderSnapshotSync,
            paymentSnapshotSync,
            snapshotConsumerSync
        };
    }
    /**
     * 获取设备健康汇总
     * 统计各设备类型的在线/离线/维护数量及异常设备数量
     */
    getDeviceHealthSummary(devices, thresholdMinutes) {
        return (0, lyt_entity_1.computeDeviceHealthSummary)(devices, thresholdMinutes);
    }
};
exports.LytService = LytService;
exports.LytService = LytService = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, common_1.Optional)()),
    __param(5, (0, common_1.Optional)()),
    __param(6, (0, common_1.Optional)()),
    __param(7, (0, common_1.Optional)()),
    __param(8, (0, common_1.Optional)()),
    __param(9, (0, common_1.Optional)()),
    __param(10, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [lyt_adapter_registry_1.LytAdapterRegistry,
        foundation_service_1.FoundationService,
        lyt_connection_manager_1.LytConnectionManager,
        integration_orchestration_service_1.IntegrationOrchestrationService,
        loyalty_service_1.LoyaltyService,
        member_service_1.MemberService,
        transactions_service_1.TransactionsService,
        runtime_governance_service_1.RuntimeGovernanceService,
        lyt_governance_query_service_1.LytGovernanceQueryService,
        trust_governance_service_1.TrustGovernanceService,
        campaign_service_1.CampaignService])
], LytService);
//# sourceMappingURL=lyt.service.js.map