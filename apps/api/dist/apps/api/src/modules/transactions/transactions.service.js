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
exports.TransactionsService = void 0;
exports.resetTransactionsServiceTestState = resetTransactionsServiceTestState;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const cashier_service_1 = require("../cashier/cashier.service");
const cashier_entity_1 = require("../cashier/cashier.entity");
const loyalty_service_1 = require("../loyalty/loyalty.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const transactions_entity_1 = require("./transactions.entity");
const refundStore = new Map();
const lytOrderSnapshotStore = new Map();
const lytPaymentSnapshotStore = new Map();
function resetTransactionsServiceTestState() {
    refundStore.clear();
    lytOrderSnapshotStore.clear();
    lytPaymentSnapshotStore.clear();
}
let TransactionsService = class TransactionsService {
    cashierService;
    loyaltyService;
    prisma;
    constructor(cashierService, loyaltyService, prisma) {
        this.cashierService = cashierService;
        this.loyaltyService = loyaltyService;
        this.prisma = prisma;
    }
    getOrderSnapshotModel() {
        const prisma = this.prisma;
        const model = prisma?.lytOrderSnapshot;
        if (!model || typeof model !== 'object') {
            return undefined;
        }
        return model;
    }
    getPaymentSnapshotModel() {
        const prisma = this.prisma;
        const model = prisma?.lytPaymentSnapshot;
        if (!model || typeof model !== 'object') {
            return undefined;
        }
        return model;
    }
    normalizeSnapshotString(value) {
        if (typeof value !== 'string') {
            return undefined;
        }
        const normalized = value.trim();
        return normalized.length ? normalized : undefined;
    }
    normalizeSnapshotNumber(value, fallback = 0) {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }
        if (typeof value === 'string' && value.trim().length) {
            const parsed = Number(value);
            if (Number.isFinite(parsed)) {
                return parsed;
            }
        }
        return fallback;
    }
    normalizeOptionalSnapshotNumber(value) {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }
        return this.normalizeSnapshotNumber(value);
    }
    getOrderSnapshotCacheKey(tenantId, externalOrderId) {
        return `${tenantId}:${externalOrderId}`;
    }
    getPaymentSnapshotCacheKey(tenantId, externalPaymentId) {
        return `${tenantId}:${externalPaymentId}`;
    }
    toLytOrderSnapshot(input) {
        return {
            snapshotId: input.snapshotId,
            tenantContext: input.tenantContext,
            externalOrderId: input.externalOrderId,
            orderNo: input.orderNo,
            memberId: input.memberId,
            couponCode: input.couponCode,
            blindboxPlanId: input.blindboxPlanId,
            blindboxQuantity: input.blindboxQuantity,
            amount: input.amount,
            discountAmount: input.discountAmount,
            payableAmount: input.payableAmount,
            currency: input.currency,
            status: input.status,
            paidAt: input.paidAt,
            updatedAtFromSource: input.updatedAtFromSource,
            rawVersion: input.rawVersion,
            rawPayload: input.rawPayload ? { ...input.rawPayload } : undefined,
            source: input.source
        };
    }
    toLytPaymentSnapshot(input) {
        return {
            snapshotId: input.snapshotId,
            tenantContext: input.tenantContext,
            externalPaymentId: input.externalPaymentId,
            externalOrderId: input.externalOrderId,
            paymentChannel: input.paymentChannel,
            paymentStatus: input.paymentStatus,
            amount: input.amount,
            currency: input.currency,
            transactionNo: input.transactionNo,
            paidAt: input.paidAt,
            updatedAtFromSource: input.updatedAtFromSource,
            rawVersion: input.rawVersion,
            rawPayload: input.rawPayload ? { ...input.rawPayload } : undefined,
            source: input.source
        };
    }
    buildAggregate(orderId, tenantContext) {
        const order = this.cashierService.getOrder(orderId, tenantContext);
        if (!order) {
            throw new Error(`Transaction order ${orderId} not found`);
        }
        const payments = this.cashierService.listPayments(tenantContext)
            .filter((p) => p.orderId === orderId)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        const latestPayment = payments[0];
        const tenantId = tenantContext.tenantId;
        return {
            order,
            payment: latestPayment,
            settlement: this.loyaltyService.listSettlements(tenantId)
                .find((s) => s.orderId === orderId),
            pointsLedger: this.loyaltyService.listPointsLedger(tenantId)
                .filter((entry) => entry.orderId === orderId)
                .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
            couponRedemptions: this.loyaltyService.listCouponRedemptions(tenantId)
                .filter((r) => r.orderId === orderId)
                .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
            blindboxFulfillments: this.loyaltyService.listBlindboxFulfillments(tenantId)
                .filter((f) => f.orderId === orderId)
                .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
            refunds: this.listRefundRecordsForOrder(orderId, tenantId)
        };
    }
    listRefundRecordsForOrder(orderId, tenantId) {
        return Array.from(refundStore.values())
            .filter((refund) => refund.orderId === orderId && refund.tenantContext.tenantId === tenantId)
            .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
    }
    getReservedRefundAmount(refunds) {
        return refunds
            .filter((refund) => refund.status !== transactions_entity_1.TransactionRefundStatus.Rejected)
            .reduce((sum, refund) => sum + refund.refundAmount, 0);
    }
    getCompletedRefundAmount(refunds) {
        return refunds
            .filter((refund) => refund.status === transactions_entity_1.TransactionRefundStatus.Completed)
            .reduce((sum, refund) => sum + refund.refundAmount, 0);
    }
    requireRefund(refundId, tenantContext) {
        const refund = refundStore.get(refundId);
        if (!refund || refund.tenantContext.tenantId !== tenantContext.tenantId) {
            throw new Error(`Transaction refund ${refundId} not found`);
        }
        return refund;
    }
    getRefundWaitingMinutes(refund, asOfTime) {
        const requestedAt = new Date(refund.requestedAt).getTime();
        const asOf = new Date(asOfTime).getTime();
        if (Number.isNaN(requestedAt) || Number.isNaN(asOf) || asOf <= requestedAt) {
            return 0;
        }
        return Math.floor((asOf - requestedAt) / 60000);
    }
    getRefundAgingBucket(waitingMinutes) {
        if (waitingMinutes < 60) {
            return transactions_entity_1.TransactionRefundAgingBucket.Under1Hour;
        }
        if (waitingMinutes < 240) {
            return transactions_entity_1.TransactionRefundAgingBucket.Hour1To4;
        }
        if (waitingMinutes < 1440) {
            return transactions_entity_1.TransactionRefundAgingBucket.Hour4To24;
        }
        return transactions_entity_1.TransactionRefundAgingBucket.Over24Hours;
    }
    getRefundRiskLevel(refund, waitingMinutes) {
        if (waitingMinutes >= 1440 || refund.refundAmount >= 100) {
            return transactions_entity_1.TransactionRefundRiskLevel.High;
        }
        if (waitingMinutes >= 240 || refund.refundAmount >= 50) {
            return transactions_entity_1.TransactionRefundRiskLevel.Medium;
        }
        return transactions_entity_1.TransactionRefundRiskLevel.Low;
    }
    getRefundSlaThresholds(query) {
        const normalize = (value, fallback) => typeof value === 'number' && value > 0 ? value : fallback;
        const teamLeadMinutes = normalize(query?.teamLeadThresholdMinutes, 60);
        const opsManagerMinutes = normalize(query?.opsManagerThresholdMinutes, 240);
        const financeMinutes = normalize(query?.financeThresholdMinutes, 1440);
        return {
            teamLeadMinutes,
            opsManagerMinutes: Math.max(opsManagerMinutes, teamLeadMinutes),
            financeMinutes: Math.max(financeMinutes, opsManagerMinutes, teamLeadMinutes)
        };
    }
    getRefundEscalationLevel(refund, waitingMinutes, thresholds) {
        if (waitingMinutes >= thresholds.financeMinutes || refund.refundAmount >= 100) {
            return transactions_entity_1.TransactionRefundEscalationLevel.Finance;
        }
        if (waitingMinutes >= thresholds.opsManagerMinutes || refund.refundAmount >= 50) {
            return transactions_entity_1.TransactionRefundEscalationLevel.OpsManager;
        }
        if (waitingMinutes >= thresholds.teamLeadMinutes) {
            return transactions_entity_1.TransactionRefundEscalationLevel.TeamLead;
        }
        return transactions_entity_1.TransactionRefundEscalationLevel.None;
    }
    getRefundDispatchConfig() {
        return {
            [transactions_entity_1.TransactionRefundEscalationLevel.None]: {
                suggestedOwner: 'refund-ops-queue',
                dispatchReason: transactions_entity_1.TransactionRefundDispatchReason.PendingWithinSla
            },
            [transactions_entity_1.TransactionRefundEscalationLevel.TeamLead]: {
                suggestedOwner: 'refund-team-lead',
                dispatchReason: transactions_entity_1.TransactionRefundDispatchReason.ApproachingSlaBreach
            },
            [transactions_entity_1.TransactionRefundEscalationLevel.OpsManager]: {
                suggestedOwner: 'refund-ops-manager',
                dispatchReason: transactions_entity_1.TransactionRefundDispatchReason.SlaBreachedOrMediumRisk
            },
            [transactions_entity_1.TransactionRefundEscalationLevel.Finance]: {
                suggestedOwner: 'refund-finance-review',
                dispatchReason: transactions_entity_1.TransactionRefundDispatchReason.HighAmountOrLongOverdue
            }
        };
    }
    buildRefundDispatchItem(refund, asOfTime, thresholds) {
        const waitingMinutes = this.getRefundWaitingMinutes(refund, asOfTime);
        const escalationLevel = this.getRefundEscalationLevel(refund, waitingMinutes, thresholds);
        const dispatchConfig = this.getRefundDispatchConfig()[escalationLevel];
        return {
            refundId: refund.refundId,
            orderId: refund.orderId,
            memberId: refund.memberId,
            refundAmount: refund.refundAmount,
            operator: refund.operator,
            requestedAt: refund.requestedAt,
            waitingMinutes,
            escalationLevel,
            suggestedOwner: refund.assignedOwner ?? dispatchConfig.suggestedOwner,
            dispatchReason: dispatchConfig.dispatchReason,
            assignedOwner: refund.assignedOwner,
            assignedTo: refund.assignedTo,
            assignedAt: refund.assignedAt
        };
    }
    getDispatchQueue(tenantContext, query) {
        const asOfTime = query?.asOfTime ?? new Date().toISOString();
        const slaThresholds = this.getRefundSlaThresholds(query);
        return this.listPendingRefunds(tenantContext, query)
            .map((refund) => this.buildRefundDispatchItem(refund, asOfTime, slaThresholds))
            .sort((left, right) => {
            const escalationPriority = {
                [transactions_entity_1.TransactionRefundEscalationLevel.Finance]: 4,
                [transactions_entity_1.TransactionRefundEscalationLevel.OpsManager]: 3,
                [transactions_entity_1.TransactionRefundEscalationLevel.TeamLead]: 2,
                [transactions_entity_1.TransactionRefundEscalationLevel.None]: 1
            };
            if (escalationPriority[right.escalationLevel] !== escalationPriority[left.escalationLevel]) {
                return escalationPriority[right.escalationLevel] - escalationPriority[left.escalationLevel];
            }
            if (right.waitingMinutes !== left.waitingMinutes) {
                return right.waitingMinutes - left.waitingMinutes;
            }
            return left.requestedAt.localeCompare(right.requestedAt);
        });
    }
    getAssignmentDispatchQueue(tenantContext, input) {
        const query = input
            ? {
                memberId: input.memberId,
                orderId: input.orderId,
                reviewedBy: input.reviewedBy,
                requestedAfter: input.requestedAfter,
                requestedBefore: input.requestedBefore,
                reviewedAfter: input.reviewedAfter,
                reviewedBefore: input.reviewedBefore,
                status: input.status,
                limit: input.limit,
                recentReviewLimit: input.recentReviewLimit,
                priorityQueueLimit: input.priorityQueueLimit,
                dispatchQueueLimit: input.dispatchQueueLimit,
                recentEscalationLimit: input.recentEscalationLimit,
                teamLeadThresholdMinutes: input.teamLeadThresholdMinutes,
                opsManagerThresholdMinutes: input.opsManagerThresholdMinutes,
                financeThresholdMinutes: input.financeThresholdMinutes,
                asOfTime: input.asOfTime
            }
            : undefined;
        return this.getDispatchQueue(tenantContext, query);
    }
    async getLytOrderSnapshot(externalOrderId, tenantContext) {
        const snapshotModel = this.getOrderSnapshotModel();
        if (!snapshotModel?.findUnique) {
            return lytOrderSnapshotStore.get(this.getOrderSnapshotCacheKey(tenantContext.tenantId, externalOrderId));
        }
        const record = await snapshotModel.findUnique({
            where: {
                tenantId_externalOrderId: {
                    tenantId: tenantContext.tenantId,
                    externalOrderId
                }
            }
        });
        if (!record) {
            return undefined;
        }
        return this.toLytOrderSnapshot({
            snapshotId: String(record.id),
            tenantContext: {
                tenantId: String(record.tenantId),
                brandId: this.normalizeSnapshotString(record.brandId),
                storeId: this.normalizeSnapshotString(record.storeId),
                marketCode: tenantContext.marketCode
            },
            externalOrderId: String(record.externalOrderId),
            orderNo: this.normalizeSnapshotString(record.orderNo),
            memberId: this.normalizeSnapshotString(record.memberId),
            couponCode: this.normalizeSnapshotString(record.couponCode),
            blindboxPlanId: this.normalizeSnapshotString(record.blindboxPlanId),
            blindboxQuantity: this.normalizeOptionalSnapshotNumber(record.blindboxQuantity),
            amount: this.normalizeSnapshotNumber(record.amount),
            discountAmount: this.normalizeSnapshotNumber(record.discountAmount),
            payableAmount: this.normalizeSnapshotNumber(record.payableAmount),
            currency: this.normalizeSnapshotString(record.currency) ?? 'CNY',
            status: this.normalizeSnapshotString(record.status) ?? 'UPDATED',
            paidAt: record.paidAt instanceof Date
                ? record.paidAt.toISOString()
                : this.normalizeSnapshotString(record.paidAt),
            updatedAtFromSource: record.updatedAtFromSource instanceof Date
                ? record.updatedAtFromSource.toISOString()
                : String(record.updatedAtFromSource),
            rawVersion: this.normalizeSnapshotString(record.rawVersion),
            rawPayload: record.rawPayload && typeof record.rawPayload === 'object'
                ? record.rawPayload
                : undefined,
            source: 'prisma'
        });
    }
    async listLytOrderSnapshots(tenantContext) {
        const snapshotModel = this.getOrderSnapshotModel();
        if (!snapshotModel?.findMany) {
            return Array.from(lytOrderSnapshotStore.values()).filter((item) => item.tenantContext.tenantId === tenantContext.tenantId);
        }
        const records = await snapshotModel.findMany({
            where: { tenantId: tenantContext.tenantId },
            orderBy: [{ updatedAtFromSource: 'desc' }],
            take: 100
        });
        return records.map((record) => this.toLytOrderSnapshot({
            snapshotId: String(record.id),
            tenantContext: {
                tenantId: String(record.tenantId),
                brandId: this.normalizeSnapshotString(record.brandId),
                storeId: this.normalizeSnapshotString(record.storeId),
                marketCode: tenantContext.marketCode
            },
            externalOrderId: String(record.externalOrderId),
            orderNo: this.normalizeSnapshotString(record.orderNo),
            memberId: this.normalizeSnapshotString(record.memberId),
            couponCode: this.normalizeSnapshotString(record.couponCode),
            blindboxPlanId: this.normalizeSnapshotString(record.blindboxPlanId),
            blindboxQuantity: this.normalizeOptionalSnapshotNumber(record.blindboxQuantity),
            amount: this.normalizeSnapshotNumber(record.amount),
            discountAmount: this.normalizeSnapshotNumber(record.discountAmount),
            payableAmount: this.normalizeSnapshotNumber(record.payableAmount),
            currency: this.normalizeSnapshotString(record.currency) ?? 'CNY',
            status: this.normalizeSnapshotString(record.status) ?? 'UPDATED',
            paidAt: record.paidAt instanceof Date
                ? record.paidAt.toISOString()
                : this.normalizeSnapshotString(record.paidAt),
            updatedAtFromSource: record.updatedAtFromSource instanceof Date
                ? record.updatedAtFromSource.toISOString()
                : String(record.updatedAtFromSource),
            rawVersion: this.normalizeSnapshotString(record.rawVersion),
            rawPayload: record.rawPayload && typeof record.rawPayload === 'object'
                ? record.rawPayload
                : undefined,
            source: 'prisma'
        }));
    }
    async syncLytOrderSnapshot(input) {
        const amount = Math.max(0, this.normalizeSnapshotNumber(input.amount));
        const discountAmount = Math.max(0, this.normalizeSnapshotNumber(input.discountAmount));
        const payableAmount = Math.max(0, this.normalizeSnapshotNumber(input.payableAmount, amount));
        const currency = this.normalizeSnapshotString(input.currency) ?? 'CNY';
        const status = this.normalizeSnapshotString(input.status) ?? 'UPDATED';
        const updatedAtFromSource = input.updatedAt ?? input.paidAt ?? new Date().toISOString();
        const snapshot = this.toLytOrderSnapshot({
            snapshotId: `lyt-order-snapshot-${Date.now()}`,
            tenantContext: input.tenantContext,
            externalOrderId: input.externalOrderId,
            orderNo: input.orderNo,
            memberId: input.memberId,
            couponCode: input.couponCode,
            blindboxPlanId: input.blindboxPlanId,
            blindboxQuantity: input.blindboxQuantity,
            amount,
            discountAmount,
            payableAmount,
            currency,
            status,
            paidAt: input.paidAt,
            updatedAtFromSource,
            rawVersion: input.rawVersion,
            rawPayload: input.rawPayload,
            source: this.prisma ? 'prisma' : 'memory'
        });
        const snapshotModel = this.getOrderSnapshotModel();
        if (snapshotModel?.upsert) {
            const record = await snapshotModel.upsert({
                where: {
                    tenantId_externalOrderId: {
                        tenantId: input.tenantContext.tenantId,
                        externalOrderId: input.externalOrderId
                    }
                },
                create: {
                    tenantId: input.tenantContext.tenantId,
                    brandId: input.tenantContext.brandId,
                    storeId: input.tenantContext.storeId,
                    externalOrderId: input.externalOrderId,
                    orderNo: input.orderNo,
                    memberId: input.memberId,
                    couponCode: input.couponCode,
                    blindboxPlanId: input.blindboxPlanId,
                    blindboxQuantity: input.blindboxQuantity,
                    amount,
                    discountAmount,
                    payableAmount,
                    currency,
                    status,
                    paidAt: input.paidAt ? new Date(input.paidAt) : null,
                    updatedAtFromSource: new Date(updatedAtFromSource),
                    rawVersion: input.rawVersion,
                    rawPayload: input.rawPayload
                },
                update: {
                    brandId: input.tenantContext.brandId,
                    storeId: input.tenantContext.storeId,
                    orderNo: input.orderNo,
                    memberId: input.memberId,
                    couponCode: input.couponCode,
                    blindboxPlanId: input.blindboxPlanId,
                    blindboxQuantity: input.blindboxQuantity,
                    amount,
                    discountAmount,
                    payableAmount,
                    currency,
                    status,
                    paidAt: input.paidAt ? new Date(input.paidAt) : null,
                    updatedAtFromSource: new Date(updatedAtFromSource),
                    rawVersion: input.rawVersion,
                    rawPayload: input.rawPayload
                }
            });
            const persistentSnapshot = this.toLytOrderSnapshot({
                snapshotId: String(record.id),
                tenantContext: input.tenantContext,
                externalOrderId: input.externalOrderId,
                orderNo: input.orderNo,
                memberId: input.memberId,
                couponCode: input.couponCode,
                blindboxPlanId: input.blindboxPlanId,
                blindboxQuantity: input.blindboxQuantity,
                amount,
                discountAmount,
                payableAmount,
                currency,
                status,
                paidAt: input.paidAt,
                updatedAtFromSource,
                rawVersion: input.rawVersion,
                rawPayload: input.rawPayload,
                source: 'prisma'
            });
            lytOrderSnapshotStore.set(this.getOrderSnapshotCacheKey(input.tenantContext.tenantId, input.externalOrderId), persistentSnapshot);
            return persistentSnapshot;
        }
        lytOrderSnapshotStore.set(this.getOrderSnapshotCacheKey(input.tenantContext.tenantId, input.externalOrderId), snapshot);
        return snapshot;
    }
    async getLytPaymentSnapshot(externalPaymentId, tenantContext) {
        const snapshotModel = this.getPaymentSnapshotModel();
        if (!snapshotModel?.findUnique) {
            return lytPaymentSnapshotStore.get(this.getPaymentSnapshotCacheKey(tenantContext.tenantId, externalPaymentId));
        }
        const record = await snapshotModel.findUnique({
            where: {
                tenantId_externalPaymentId: {
                    tenantId: tenantContext.tenantId,
                    externalPaymentId
                }
            }
        });
        if (!record) {
            return undefined;
        }
        return this.toLytPaymentSnapshot({
            snapshotId: String(record.id),
            tenantContext: {
                tenantId: String(record.tenantId),
                brandId: this.normalizeSnapshotString(record.brandId),
                storeId: this.normalizeSnapshotString(record.storeId),
                marketCode: tenantContext.marketCode
            },
            externalPaymentId: String(record.externalPaymentId),
            externalOrderId: String(record.externalOrderId),
            paymentChannel: this.normalizeSnapshotString(record.paymentChannel),
            paymentStatus: this.normalizeSnapshotString(record.paymentStatus) ?? 'PENDING',
            amount: this.normalizeSnapshotNumber(record.amount),
            currency: this.normalizeSnapshotString(record.currency) ?? 'CNY',
            transactionNo: this.normalizeSnapshotString(record.transactionNo),
            paidAt: record.paidAt instanceof Date
                ? record.paidAt.toISOString()
                : this.normalizeSnapshotString(record.paidAt),
            updatedAtFromSource: record.updatedAtFromSource instanceof Date
                ? record.updatedAtFromSource.toISOString()
                : String(record.updatedAtFromSource),
            rawVersion: this.normalizeSnapshotString(record.rawVersion),
            rawPayload: record.rawPayload && typeof record.rawPayload === 'object'
                ? record.rawPayload
                : undefined,
            source: 'prisma'
        });
    }
    async listLytPaymentSnapshots(tenantContext) {
        const snapshotModel = this.getPaymentSnapshotModel();
        if (!snapshotModel?.findMany) {
            return Array.from(lytPaymentSnapshotStore.values()).filter((item) => item.tenantContext.tenantId === tenantContext.tenantId);
        }
        const records = await snapshotModel.findMany({
            where: { tenantId: tenantContext.tenantId },
            orderBy: [{ updatedAtFromSource: 'desc' }],
            take: 100
        });
        return records.map((record) => this.toLytPaymentSnapshot({
            snapshotId: String(record.id),
            tenantContext: {
                tenantId: String(record.tenantId),
                brandId: this.normalizeSnapshotString(record.brandId),
                storeId: this.normalizeSnapshotString(record.storeId),
                marketCode: tenantContext.marketCode
            },
            externalPaymentId: String(record.externalPaymentId),
            externalOrderId: String(record.externalOrderId),
            paymentChannel: this.normalizeSnapshotString(record.paymentChannel),
            paymentStatus: this.normalizeSnapshotString(record.paymentStatus) ?? 'PENDING',
            amount: this.normalizeSnapshotNumber(record.amount),
            currency: this.normalizeSnapshotString(record.currency) ?? 'CNY',
            transactionNo: this.normalizeSnapshotString(record.transactionNo),
            paidAt: record.paidAt instanceof Date
                ? record.paidAt.toISOString()
                : this.normalizeSnapshotString(record.paidAt),
            updatedAtFromSource: record.updatedAtFromSource instanceof Date
                ? record.updatedAtFromSource.toISOString()
                : String(record.updatedAtFromSource),
            rawVersion: this.normalizeSnapshotString(record.rawVersion),
            rawPayload: record.rawPayload && typeof record.rawPayload === 'object'
                ? record.rawPayload
                : undefined,
            source: 'prisma'
        }));
    }
    async syncLytPaymentSnapshot(input) {
        const amount = Math.max(0, this.normalizeSnapshotNumber(input.amount));
        const currency = this.normalizeSnapshotString(input.currency) ?? 'CNY';
        const paymentStatus = this.normalizeSnapshotString(input.paymentStatus) ?? 'PENDING';
        const updatedAtFromSource = input.updatedAt ?? input.paidAt ?? new Date().toISOString();
        const snapshot = this.toLytPaymentSnapshot({
            snapshotId: `lyt-payment-snapshot-${Date.now()}`,
            tenantContext: input.tenantContext,
            externalPaymentId: input.externalPaymentId,
            externalOrderId: input.externalOrderId,
            paymentChannel: input.paymentChannel,
            paymentStatus,
            amount,
            currency,
            transactionNo: input.transactionNo,
            paidAt: input.paidAt,
            updatedAtFromSource,
            rawVersion: input.rawVersion,
            rawPayload: input.rawPayload,
            source: this.prisma ? 'prisma' : 'memory'
        });
        const snapshotModel = this.getPaymentSnapshotModel();
        if (snapshotModel?.upsert) {
            const record = await snapshotModel.upsert({
                where: {
                    tenantId_externalPaymentId: {
                        tenantId: input.tenantContext.tenantId,
                        externalPaymentId: input.externalPaymentId
                    }
                },
                create: {
                    tenantId: input.tenantContext.tenantId,
                    brandId: input.tenantContext.brandId,
                    storeId: input.tenantContext.storeId,
                    externalPaymentId: input.externalPaymentId,
                    externalOrderId: input.externalOrderId,
                    paymentChannel: input.paymentChannel,
                    paymentStatus,
                    amount,
                    currency,
                    transactionNo: input.transactionNo,
                    paidAt: input.paidAt ? new Date(input.paidAt) : null,
                    updatedAtFromSource: new Date(updatedAtFromSource),
                    rawVersion: input.rawVersion,
                    rawPayload: input.rawPayload
                },
                update: {
                    brandId: input.tenantContext.brandId,
                    storeId: input.tenantContext.storeId,
                    externalOrderId: input.externalOrderId,
                    paymentChannel: input.paymentChannel,
                    paymentStatus,
                    amount,
                    currency,
                    transactionNo: input.transactionNo,
                    paidAt: input.paidAt ? new Date(input.paidAt) : null,
                    updatedAtFromSource: new Date(updatedAtFromSource),
                    rawVersion: input.rawVersion,
                    rawPayload: input.rawPayload
                }
            });
            const persistentSnapshot = this.toLytPaymentSnapshot({
                snapshotId: String(record.id),
                tenantContext: input.tenantContext,
                externalPaymentId: input.externalPaymentId,
                externalOrderId: input.externalOrderId,
                paymentChannel: input.paymentChannel,
                paymentStatus,
                amount,
                currency,
                transactionNo: input.transactionNo,
                paidAt: input.paidAt,
                updatedAtFromSource,
                rawVersion: input.rawVersion,
                rawPayload: input.rawPayload,
                source: 'prisma'
            });
            lytPaymentSnapshotStore.set(this.getPaymentSnapshotCacheKey(input.tenantContext.tenantId, input.externalPaymentId), persistentSnapshot);
            return persistentSnapshot;
        }
        lytPaymentSnapshotStore.set(this.getPaymentSnapshotCacheKey(input.tenantContext.tenantId, input.externalPaymentId), snapshot);
        return snapshot;
    }
    resolveRefundAssignmentTargets(tenantContext, input) {
        if (input?.refundIds?.length) {
            return input.refundIds.map((refundId) => this.requireRefund(refundId, tenantContext));
        }
        if (input?.suggestedOwner) {
            const limit = input.limit && input.limit > 0 ? input.limit : undefined;
            const queue = this.getAssignmentDispatchQueue(tenantContext, input).filter((item) => item.suggestedOwner === input.suggestedOwner);
            const selected = typeof limit === 'number' ? queue.slice(0, limit) : queue;
            return selected.map((item) => this.requireRefund(item.refundId, tenantContext));
        }
        return [];
    }
    matchesOrderQuery(aggregate, query) {
        if (!query) {
            return true;
        }
        if (query.memberId && aggregate.order.memberId !== query.memberId) {
            return false;
        }
        if (query.status && aggregate.order.status !== query.status) {
            return false;
        }
        if (query.paymentStatus && aggregate.payment?.status !== query.paymentStatus) {
            return false;
        }
        if (query.closeReason && aggregate.order.closeReason !== query.closeReason) {
            return false;
        }
        if (typeof query.hasRefund === 'boolean') {
            const hasRefund = aggregate.refunds.length > 0;
            if (hasRefund !== query.hasRefund) {
                return false;
            }
        }
        return true;
    }
    matchesRefundQuery(refund, query) {
        if (!query) {
            return true;
        }
        if (query.memberId && refund.memberId !== query.memberId) {
            return false;
        }
        if (query.orderId && refund.orderId !== query.orderId) {
            return false;
        }
        if (query.operator && refund.operator !== query.operator) {
            return false;
        }
        if (query.reviewedBy && refund.reviewedBy !== query.reviewedBy) {
            return false;
        }
        if (query.requestedAfter && refund.requestedAt.localeCompare(query.requestedAfter) < 0) {
            return false;
        }
        if (query.requestedBefore && refund.requestedAt.localeCompare(query.requestedBefore) > 0) {
            return false;
        }
        if (query.reviewedAfter) {
            if (!refund.reviewedAt || refund.reviewedAt.localeCompare(query.reviewedAfter) < 0) {
                return false;
            }
        }
        if (query.reviewedBefore) {
            if (!refund.reviewedAt || refund.reviewedAt.localeCompare(query.reviewedBefore) > 0) {
                return false;
            }
        }
        if (query.status && refund.status !== query.status) {
            return false;
        }
        return true;
    }
    async startCheckout(tenantContext, input) {
        const order = await this.cashierService.createOrder(tenantContext, {
            memberId: input.memberId,
            items: input.items,
            currency: input.currency,
            couponCode: input.couponCode,
            blindboxPlanId: input.blindboxPlanId,
            blindboxQuantity: input.blindboxQuantity
        });
        await this.cashierService.createPayment(order.orderId, {
            channel: input.paymentChannel,
            amount: input.amount,
            externalPaymentId: input.externalPaymentId
        });
        return this.buildAggregate(order.orderId, tenantContext);
    }
    async applyPaymentCallback(input) {
        const { order } = await this.cashierService.applyPaymentCallback(input);
        return this.buildAggregate(order.orderId, order.tenantContext);
    }
    getOrderTransaction(orderId, tenantContext) {
        return this.buildAggregate(orderId, tenantContext);
    }
    listOrderTransactions(tenantContext, query) {
        const limit = query?.limit && query.limit > 0 ? query.limit : undefined;
        const aggregates = this.cashierService
            .listOrders(tenantContext)
            .map((order) => this.buildAggregate(order.orderId, tenantContext))
            .filter((aggregate) => this.matchesOrderQuery(aggregate, query))
            .sort((left, right) => right.order.updatedAt.localeCompare(left.order.updatedAt));
        return typeof limit === 'number' ? aggregates.slice(0, limit) : aggregates;
    }
    async timeoutCloseOrder(orderId, tenantContext, _input) {
        const { order } = await this.cashierService.closeTimedOutOrder(orderId, tenantContext, cashier_entity_1.CashierOrderCloseReason.PaymentTimeout);
        return this.buildAggregate(order.orderId, tenantContext);
    }
    async batchTimeoutCloseOrders(tenantContext, input) {
        const limit = input?.limit && input.limit > 0 ? input.limit : undefined;
        const candidateOrderIds = input?.orderIds?.length ? new Set(input.orderIds) : undefined;
        const beforeTime = input?.beforeTime;
        const candidates = this.cashierService
            .listOrders(tenantContext)
            .filter((order) => {
            if (candidateOrderIds && !candidateOrderIds.has(order.orderId)) {
                return false;
            }
            if (input?.memberId && order.memberId !== input.memberId) {
                return false;
            }
            if (order.status !== cashier_entity_1.CashierOrderStatus.Created &&
                order.status !== cashier_entity_1.CashierOrderStatus.PendingPayment) {
                return false;
            }
            if (beforeTime && order.updatedAt.localeCompare(beforeTime) > 0) {
                return false;
            }
            return true;
        })
            .sort((left, right) => left.updatedAt.localeCompare(right.updatedAt));
        const targetOrders = typeof limit === 'number' ? candidates.slice(0, limit) : candidates;
        const processed = [];
        const skippedOrderIds = [];
        for (const order of targetOrders) {
            try {
                const result = await this.timeoutCloseOrder(order.orderId, tenantContext, {});
                processed.push(result);
            }
            catch {
                skippedOrderIds.push(order.orderId);
            }
        }
        return {
            processedCount: processed.length,
            skippedCount: skippedOrderIds.length,
            processedOrderIds: processed.map((entry) => entry.order.orderId),
            skippedOrderIds,
            orders: processed
        };
    }
    async manualCloseOrder(orderId, tenantContext, input) {
        const { order } = await this.cashierService.closeOrder(orderId, tenantContext, input);
        return this.buildAggregate(order.orderId, tenantContext);
    }
    listOrderRefunds(orderId, tenantContext) {
        return this.buildAggregate(orderId, tenantContext).refunds;
    }
    listRefunds(tenantContext, query) {
        const limit = query?.limit && query.limit > 0 ? query.limit : undefined;
        const refunds = Array.from(refundStore.values())
            .filter((refund) => refund.tenantContext.tenantId === tenantContext.tenantId)
            .filter((refund) => this.matchesRefundQuery(refund, query))
            .sort((left, right) => right.requestedAt.localeCompare(left.requestedAt));
        return typeof limit === 'number' ? refunds.slice(0, limit) : refunds;
    }
    listPendingRefunds(tenantContext, query) {
        const pendingRefunds = this.listRefunds(tenantContext, {
            ...query,
            status: transactions_entity_1.TransactionRefundStatus.Pending
        }).sort((left, right) => left.requestedAt.localeCompare(right.requestedAt));
        const limit = query?.limit && query.limit > 0 ? query.limit : undefined;
        return typeof limit === 'number' ? pendingRefunds.slice(0, limit) : pendingRefunds;
    }
    getRefundDashboard(tenantContext, query) {
        const asOfTime = query?.asOfTime ?? new Date().toISOString();
        const slaThresholds = this.getRefundSlaThresholds(query);
        const recentReviewLimit = query?.recentReviewLimit && query.recentReviewLimit > 0
            ? query.recentReviewLimit
            : 5;
        const priorityQueueLimit = query?.priorityQueueLimit && query.priorityQueueLimit > 0
            ? query.priorityQueueLimit
            : 5;
        const dispatchQueueLimit = query?.dispatchQueueLimit && query.dispatchQueueLimit > 0
            ? query.dispatchQueueLimit
            : 8;
        const recentEscalationLimit = query?.recentEscalationLimit && query.recentEscalationLimit > 0
            ? query.recentEscalationLimit
            : 5;
        const refunds = this.listRefunds(tenantContext, query);
        const pendingRefunds = refunds
            .filter((refund) => refund.status === transactions_entity_1.TransactionRefundStatus.Pending)
            .sort((left, right) => left.requestedAt.localeCompare(right.requestedAt));
        const reviewedRefunds = refunds
            .filter((refund) => (refund.status === transactions_entity_1.TransactionRefundStatus.Completed ||
            refund.status === transactions_entity_1.TransactionRefundStatus.Rejected) &&
            typeof refund.reviewedAt === 'string');
        const statusOrder = [
            transactions_entity_1.TransactionRefundStatus.Pending,
            transactions_entity_1.TransactionRefundStatus.Completed,
            transactions_entity_1.TransactionRefundStatus.Rejected
        ];
        const statusGroups = statusOrder.map((status) => {
            const entries = refunds.filter((refund) => refund.status === status);
            return {
                status,
                count: entries.length,
                totalAmount: entries.reduce((sum, refund) => sum + refund.refundAmount, 0)
            };
        });
        const agingOrder = [
            transactions_entity_1.TransactionRefundAgingBucket.Under1Hour,
            transactions_entity_1.TransactionRefundAgingBucket.Hour1To4,
            transactions_entity_1.TransactionRefundAgingBucket.Hour4To24,
            transactions_entity_1.TransactionRefundAgingBucket.Over24Hours
        ];
        const agingBuckets = agingOrder.map((bucket) => {
            const entries = pendingRefunds.filter((refund) => this.getRefundAgingBucket(this.getRefundWaitingMinutes(refund, asOfTime)) === bucket);
            return {
                bucket,
                count: entries.length,
                totalAmount: entries.reduce((sum, refund) => sum + refund.refundAmount, 0)
            };
        });
        const priorityQueue = pendingRefunds
            .map((refund) => {
            const waitingMinutes = this.getRefundWaitingMinutes(refund, asOfTime);
            const agingBucket = this.getRefundAgingBucket(waitingMinutes);
            const riskLevel = this.getRefundRiskLevel(refund, waitingMinutes);
            return {
                refundId: refund.refundId,
                orderId: refund.orderId,
                memberId: refund.memberId,
                refundAmount: refund.refundAmount,
                operator: refund.operator,
                requestedAt: refund.requestedAt,
                waitingMinutes,
                agingBucket,
                riskLevel
            };
        })
            .sort((left, right) => {
            const riskPriority = {
                [transactions_entity_1.TransactionRefundRiskLevel.High]: 3,
                [transactions_entity_1.TransactionRefundRiskLevel.Medium]: 2,
                [transactions_entity_1.TransactionRefundRiskLevel.Low]: 1
            };
            if (riskPriority[right.riskLevel] !== riskPriority[left.riskLevel]) {
                return riskPriority[right.riskLevel] - riskPriority[left.riskLevel];
            }
            if (right.waitingMinutes !== left.waitingMinutes) {
                return right.waitingMinutes - left.waitingMinutes;
            }
            return left.requestedAt.localeCompare(right.requestedAt);
        })
            .slice(0, priorityQueueLimit);
        const dispatchQueue = this.getDispatchQueue(tenantContext, query)
            .slice(0, dispatchQueueLimit);
        const recentReviews = reviewedRefunds
            .slice()
            .sort((left, right) => right.reviewedAt.localeCompare(left.reviewedAt))
            .slice(0, recentReviewLimit)
            .map((refund) => ({
            refundId: refund.refundId,
            orderId: refund.orderId,
            memberId: refund.memberId,
            refundAmount: refund.refundAmount,
            status: refund.status,
            reviewedAt: refund.reviewedAt,
            reviewedBy: refund.reviewedBy,
            reviewNote: refund.reviewNote
        }));
        const reviewerSummaries = Array.from(reviewedRefunds
            .filter((refund) => refund.reviewedBy)
            .reduce((map, refund) => {
            const current = map.get(refund.reviewedBy) ?? {
                reviewedBy: refund.reviewedBy,
                reviewCount: 0,
                lastReviewedAt: refund.reviewedAt
            };
            current.reviewCount += 1;
            if (current.lastReviewedAt.localeCompare(refund.reviewedAt) < 0) {
                current.lastReviewedAt = refund.reviewedAt;
            }
            map.set(refund.reviewedBy, current);
            return map;
        }, new Map())
            .values()).sort((left, right) => {
            if (right.reviewCount !== left.reviewCount) {
                return right.reviewCount - left.reviewCount;
            }
            return right.lastReviewedAt.localeCompare(left.lastReviewedAt);
        });
        const operatorQuickStats = Array.from(refunds
            .filter((refund) => refund.operator)
            .reduce((map, refund) => {
            const current = map.get(refund.operator) ?? {
                operator: refund.operator,
                count: 0,
                totalAmount: 0
            };
            current.count += 1;
            current.totalAmount += refund.refundAmount;
            map.set(refund.operator, current);
            return map;
        }, new Map())
            .values()).sort((left, right) => {
            if (right.count !== left.count) {
                return right.count - left.count;
            }
            return right.totalAmount - left.totalAmount;
        });
        const riskSummary = priorityQueue.reduce((summary, item) => {
            if (item.riskLevel === transactions_entity_1.TransactionRefundRiskLevel.High) {
                summary.highCount += 1;
            }
            else if (item.riskLevel === transactions_entity_1.TransactionRefundRiskLevel.Medium) {
                summary.mediumCount += 1;
            }
            else {
                summary.lowCount += 1;
            }
            return summary;
        }, { lowCount: 0, mediumCount: 0, highCount: 0 });
        const escalationSummary = dispatchQueue.reduce((summary, item) => {
            if (item.escalationLevel === transactions_entity_1.TransactionRefundEscalationLevel.Finance) {
                summary.financeCount += 1;
            }
            else if (item.escalationLevel === transactions_entity_1.TransactionRefundEscalationLevel.OpsManager) {
                summary.opsManagerCount += 1;
            }
            else if (item.escalationLevel === transactions_entity_1.TransactionRefundEscalationLevel.TeamLead) {
                summary.teamLeadCount += 1;
            }
            else {
                summary.noneCount += 1;
            }
            return summary;
        }, { noneCount: 0, teamLeadCount: 0, opsManagerCount: 0, financeCount: 0 });
        const ownerSummaries = Array.from(dispatchQueue
            .reduce((map, item) => {
            const current = map.get(item.suggestedOwner) ?? {
                suggestedOwner: item.suggestedOwner,
                escalationLevel: item.escalationLevel,
                pendingCount: 0,
                totalAmount: 0
            };
            current.pendingCount += 1;
            current.totalAmount += item.refundAmount;
            map.set(item.suggestedOwner, current);
            return map;
        }, new Map())
            .values()).sort((left, right) => {
            if (right.pendingCount !== left.pendingCount) {
                return right.pendingCount - left.pendingCount;
            }
            return right.totalAmount - left.totalAmount;
        });
        const recentEscalationTrail = dispatchQueue
            .filter((item) => item.escalationLevel !== transactions_entity_1.TransactionRefundEscalationLevel.None)
            .slice()
            .sort((left, right) => {
            if (right.waitingMinutes !== left.waitingMinutes) {
                return right.waitingMinutes - left.waitingMinutes;
            }
            return right.requestedAt.localeCompare(left.requestedAt);
        })
            .slice(0, recentEscalationLimit)
            .map((item) => ({
            refundId: item.refundId,
            orderId: item.orderId,
            memberId: item.memberId,
            refundAmount: item.refundAmount,
            requestedAt: item.requestedAt,
            waitingMinutes: item.waitingMinutes,
            escalationLevel: item.escalationLevel,
            suggestedOwner: item.suggestedOwner,
            dispatchReason: item.dispatchReason,
            assignedOwner: item.assignedOwner,
            assignedTo: item.assignedTo,
            assignedAt: item.assignedAt
        }));
        return {
            totalCount: refunds.length,
            totalRequestedAmount: refunds.reduce((sum, refund) => sum + refund.refundAmount, 0),
            totalCompletedAmount: refunds
                .filter((refund) => refund.status === transactions_entity_1.TransactionRefundStatus.Completed)
                .reduce((sum, refund) => sum + refund.refundAmount, 0),
            totalPendingAmount: pendingRefunds.reduce((sum, refund) => sum + refund.refundAmount, 0),
            statusGroups,
            pendingSummary: {
                count: pendingRefunds.length,
                totalAmount: pendingRefunds.reduce((sum, refund) => sum + refund.refundAmount, 0),
                oldestRequestedAt: pendingRefunds[0]?.requestedAt,
                newestRequestedAt: pendingRefunds[pendingRefunds.length - 1]?.requestedAt
            },
            agingBuckets,
            priorityQueue,
            recentReviews,
            reviewerSummaries,
            operatorQuickStats,
            riskSummary,
            escalationSummary,
            dispatchQueue,
            slaThresholds,
            ownerSummaries,
            recentEscalationTrail
        };
    }
    getRefund(refundId, tenantContext) {
        return this.requireRefund(refundId, tenantContext);
    }
    async requestRefund(orderId, tenantContext, input) {
        const aggregate = this.buildAggregate(orderId, tenantContext);
        const { order, payment } = aggregate;
        if (order.status !== cashier_entity_1.CashierOrderStatus.Paid) {
            throw new Error(`Transaction order ${orderId} is not eligible for refund`);
        }
        if (!payment || payment.status !== cashier_entity_1.CashierPaymentStatus.Succeeded) {
            throw new Error(`Transaction order ${orderId} has no successful payment to refund`);
        }
        const reservedRefundAmount = this.getReservedRefundAmount(aggregate.refunds);
        const remainingRefundable = Math.max(0, payment.amount - reservedRefundAmount);
        const targetRefundAmount = input.refundAmount ?? remainingRefundable;
        if (targetRefundAmount <= 0 || targetRefundAmount > remainingRefundable) {
            throw new Error(`Refund amount ${targetRefundAmount} exceeds refundable amount ${remainingRefundable}`);
        }
        const now = new Date().toISOString();
        const refund = {
            refundId: `refund-${(0, node_crypto_1.randomUUID)()}`,
            tenantContext,
            orderId,
            paymentId: payment.paymentId,
            memberId: order.memberId,
            refundAmount: targetRefundAmount,
            reason: input.reason,
            operator: input.operator,
            status: transactions_entity_1.TransactionRefundStatus.Pending,
            requestedAt: now
        };
        refundStore.set(refund.refundId, refund);
        return this.buildAggregate(orderId, tenantContext);
    }
    async approveRefund(refundId, tenantContext, input) {
        const refund = this.requireRefund(refundId, tenantContext);
        if (refund.status !== transactions_entity_1.TransactionRefundStatus.Pending) {
            throw new Error(`Transaction refund ${refundId} is not pending approval`);
        }
        const aggregate = this.buildAggregate(refund.orderId, tenantContext);
        const { order, payment } = aggregate;
        if (order.status !== cashier_entity_1.CashierOrderStatus.Paid) {
            throw new Error(`Transaction order ${refund.orderId} is not eligible for refund approval`);
        }
        if (!payment || payment.status !== cashier_entity_1.CashierPaymentStatus.Succeeded) {
            throw new Error(`Transaction order ${refund.orderId} has no successful payment to refund`);
        }
        const completedRefundAmount = this.getCompletedRefundAmount(aggregate.refunds);
        const remainingRefundable = Math.max(0, payment.amount - completedRefundAmount);
        if (refund.refundAmount > remainingRefundable) {
            throw new Error(`Refund amount ${refund.refundAmount} exceeds refundable amount ${remainingRefundable}`);
        }
        const now = new Date().toISOString();
        await this.loyaltyService.applyRefund(order, payment, refund.refundAmount, {
            revokeBlindbox: refund.refundAmount === remainingRefundable
        });
        refund.status = transactions_entity_1.TransactionRefundStatus.Completed;
        refund.completedAt = now;
        refund.reviewedAt = now;
        refund.reviewedBy = input?.operator;
        refund.reviewNote = input?.note;
        if (refund.refundAmount === remainingRefundable) {
            order.status = cashier_entity_1.CashierOrderStatus.Closed;
            order.closedAt = now;
            order.closeReason = cashier_entity_1.CashierOrderCloseReason.FullRefund;
            order.updatedAt = now;
        }
        return this.buildAggregate(refund.orderId, tenantContext);
    }
    rejectRefund(refundId, tenantContext, input) {
        const refund = this.requireRefund(refundId, tenantContext);
        if (refund.status !== transactions_entity_1.TransactionRefundStatus.Pending) {
            throw new Error(`Transaction refund ${refundId} is not pending approval`);
        }
        const now = new Date().toISOString();
        refund.status = transactions_entity_1.TransactionRefundStatus.Rejected;
        refund.reviewedAt = now;
        refund.reviewedBy = input?.operator;
        refund.reviewNote = input?.note;
        return this.buildAggregate(refund.orderId, tenantContext);
    }
    async batchApproveRefunds(tenantContext, input) {
        const targetRefundIds = input?.refundIds?.length ? input.refundIds : [];
        const processed = [];
        const skippedRefundIds = [];
        const processedAt = new Date().toISOString();
        for (const refundId of targetRefundIds) {
            try {
                const aggregate = await this.approveRefund(refundId, tenantContext, input);
                const approved = aggregate.refunds.find((refund) => refund.refundId === refundId);
                if (approved) {
                    processed.push(approved);
                }
                else {
                    skippedRefundIds.push(refundId);
                }
            }
            catch {
                skippedRefundIds.push(refundId);
            }
        }
        return {
            processedCount: processed.length,
            skippedCount: skippedRefundIds.length,
            processedRefundIds: processed.map((refund) => refund.refundId),
            skippedRefundIds,
            refunds: processed,
            auditSummary: {
                action: transactions_entity_1.TransactionRefundReviewAction.Approve,
                operator: input?.operator,
                note: input?.note,
                processedAt
            }
        };
    }
    batchRejectRefunds(tenantContext, input) {
        const targetRefundIds = input?.refundIds?.length ? input.refundIds : [];
        const processed = [];
        const skippedRefundIds = [];
        const processedAt = new Date().toISOString();
        for (const refundId of targetRefundIds) {
            try {
                const aggregate = this.rejectRefund(refundId, tenantContext, input);
                const rejected = aggregate.refunds.find((refund) => refund.refundId === refundId);
                if (rejected) {
                    processed.push(rejected);
                }
                else {
                    skippedRefundIds.push(refundId);
                }
            }
            catch {
                skippedRefundIds.push(refundId);
            }
        }
        return {
            processedCount: processed.length,
            skippedCount: skippedRefundIds.length,
            processedRefundIds: processed.map((refund) => refund.refundId),
            skippedRefundIds,
            refunds: processed,
            auditSummary: {
                action: transactions_entity_1.TransactionRefundReviewAction.Reject,
                operator: input?.operator,
                note: input?.note,
                processedAt
            }
        };
    }
    batchAssignRefunds(tenantContext, input) {
        const targets = this.resolveRefundAssignmentTargets(tenantContext, input);
        const processed = [];
        const skippedRefundIds = [];
        const processedAt = new Date().toISOString();
        for (const refund of targets) {
            if (refund.status !== transactions_entity_1.TransactionRefundStatus.Pending) {
                skippedRefundIds.push(refund.refundId);
                continue;
            }
            const dispatchItem = this.getAssignmentDispatchQueue(tenantContext, input).find((item) => item.refundId === refund.refundId);
            refund.assignedOwner = input?.suggestedOwner ?? dispatchItem?.suggestedOwner;
            refund.assignedTo = input?.assignee;
            refund.assignedAt = processedAt;
            refund.assignedBy = input?.operator;
            refund.assignmentNote = input?.note;
            processed.push(refund);
        }
        return {
            processedCount: processed.length,
            skippedCount: skippedRefundIds.length,
            processedRefundIds: processed.map((refund) => refund.refundId),
            skippedRefundIds,
            refunds: processed,
            assignmentSummary: {
                action: transactions_entity_1.TransactionRefundAssignmentAction.Assign,
                suggestedOwner: input?.suggestedOwner,
                assignee: input?.assignee,
                operator: input?.operator,
                note: input?.note,
                processedAt
            }
        };
    }
    batchClaimRefunds(tenantContext, input) {
        const targets = this.resolveRefundAssignmentTargets(tenantContext, input);
        const processed = [];
        const skippedRefundIds = [];
        const processedAt = new Date().toISOString();
        for (const refund of targets) {
            if (refund.status !== transactions_entity_1.TransactionRefundStatus.Pending) {
                skippedRefundIds.push(refund.refundId);
                continue;
            }
            const dispatchItem = this.getAssignmentDispatchQueue(tenantContext, input).find((item) => item.refundId === refund.refundId);
            refund.assignedOwner = input?.suggestedOwner ?? dispatchItem?.suggestedOwner;
            refund.assignedTo = input?.operator;
            refund.assignedAt = processedAt;
            refund.assignedBy = input?.operator;
            refund.assignmentNote = input?.note;
            processed.push(refund);
        }
        return {
            processedCount: processed.length,
            skippedCount: skippedRefundIds.length,
            processedRefundIds: processed.map((refund) => refund.refundId),
            skippedRefundIds,
            refunds: processed,
            assignmentSummary: {
                action: transactions_entity_1.TransactionRefundAssignmentAction.Claim,
                suggestedOwner: input?.suggestedOwner,
                assignee: input?.operator,
                operator: input?.operator,
                note: input?.note,
                processedAt
            }
        };
    }
    listMemberTransactions(memberId, tenantContext) {
        return this.cashierService
            .listOrders(tenantContext)
            .filter((order) => order.memberId === memberId)
            .map((order) => {
            const aggregate = this.buildAggregate(order.orderId, tenantContext);
            const latestBlindboxRecord = aggregate.blindboxFulfillments[aggregate.blindboxFulfillments.length - 1];
            return {
                orderId: order.orderId,
                memberId: order.memberId,
                status: order.status,
                paymentStatus: aggregate.payment?.status,
                totalAmount: order.totalAmount,
                currency: order.currency,
                awardedPoints: aggregate.pointsLedger.reduce((sum, entry) => sum + entry.points, 0),
                refundedAmount: this.getCompletedRefundAmount(aggregate.refunds),
                refundStatus: aggregate.refunds[0]?.status,
                couponCode: order.couponCode,
                blindboxPlanId: order.blindboxPlanId,
                blindboxStatus: latestBlindboxRecord?.status,
                closeReason: order.closeReason,
                closedBy: order.closedBy,
                closeNote: order.closeNote,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
                paidAt: order.paidAt,
                closedAt: order.closedAt
            };
        })
            .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [cashier_service_1.CashierService,
        loyalty_service_1.LoyaltyService,
        prisma_service_1.PrismaService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map