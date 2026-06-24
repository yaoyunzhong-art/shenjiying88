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
exports.CashierService = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const integration_orchestration_service_1 = require("../foundation/integration-orchestration/integration-orchestration.service");
const loyalty_service_1 = require("../loyalty/loyalty.service");
const member_service_1 = require("../member/member.service");
const cashier_entity_1 = require("./cashier.entity");
const orderStore = new Map();
const paymentStore = new Map();
let CashierService = class CashierService {
    memberService;
    loyaltyService;
    integrationOrchestrationService;
    constructor(memberService, loyaltyService, integrationOrchestrationService) {
        this.memberService = memberService;
        this.loyaltyService = loyaltyService;
        this.integrationOrchestrationService = integrationOrchestrationService;
    }
    async ensureMemberExists(memberId, tenantContext) {
        const persisted = await this.memberService.getPersistentProfile(memberId, tenantContext);
        const inMemory = this.memberService.getProfile(memberId);
        const member = persisted ?? inMemory;
        if (!member) {
            throw new Error(`Member ${memberId} not found`);
        }
        if (member.tenantContext.tenantId !== tenantContext.tenantId) {
            throw new Error(`Member ${memberId} does not belong to tenant ${tenantContext.tenantId}`);
        }
        return member;
    }
    async publishEvent(eventName, payload) {
        if (!this.integrationOrchestrationService) {
            return;
        }
        await this.integrationOrchestrationService.publishEvent(eventName, payload, {
            source: 'cashier',
            aggregateId: typeof payload.orderId === 'string'
                ? payload.orderId
                : typeof payload.paymentId === 'string'
                    ? payload.paymentId
                    : undefined
        });
    }
    async createOrder(tenantContext, input) {
        await this.ensureMemberExists(input.memberId, tenantContext);
        if (!input.items?.length) {
            throw new Error('Cashier order must include at least one item');
        }
        const now = new Date().toISOString();
        const order = {
            orderId: `order-${(0, node_crypto_1.randomUUID)()}`,
            tenantContext,
            memberId: input.memberId,
            items: input.items.map((item) => ({ ...item })),
            currency: input.currency ?? 'CNY',
            totalAmount: (0, cashier_entity_1.computeCashierOrderTotal)(input.items),
            couponCode: input.couponCode,
            blindboxPlanId: input.blindboxPlanId,
            blindboxQuantity: input.blindboxQuantity,
            status: cashier_entity_1.CashierOrderStatus.Created,
            createdAt: now,
            updatedAt: now,
            source: 'memory'
        };
        orderStore.set(order.orderId, order);
        await this.publishEvent('cashier.order-created', {
            orderId: order.orderId,
            tenantId: tenantContext.tenantId,
            memberId: order.memberId,
            totalAmount: order.totalAmount,
            currency: order.currency
        });
        return order;
    }
    listOrders(tenantContext) {
        return Array.from(orderStore.values()).filter((order) => order.tenantContext.tenantId === tenantContext.tenantId);
    }
    getOrder(orderId, tenantContext) {
        const order = orderStore.get(orderId);
        if (!order || order.tenantContext.tenantId !== tenantContext.tenantId) {
            return undefined;
        }
        return order;
    }
    async createPayment(orderId, input) {
        const order = orderStore.get(orderId);
        if (!order) {
            throw new Error(`Order ${orderId} not found`);
        }
        const now = new Date().toISOString();
        const payment = {
            paymentId: `payment-${(0, node_crypto_1.randomUUID)()}`,
            orderId,
            externalPaymentId: input.externalPaymentId,
            channel: input.channel,
            amount: input.amount ?? order.totalAmount,
            status: cashier_entity_1.CashierPaymentStatus.Pending,
            createdAt: now,
            updatedAt: now
        };
        paymentStore.set(payment.paymentId, payment);
        order.status = cashier_entity_1.CashierOrderStatus.PendingPayment;
        order.latestPaymentId = payment.paymentId;
        order.updatedAt = now;
        await this.publishEvent('cashier.payment-created', {
            orderId,
            paymentId: payment.paymentId,
            channel: payment.channel,
            amount: payment.amount
        });
        return payment;
    }
    listPayments(tenantContext) {
        return Array.from(paymentStore.values()).filter((payment) => {
            const order = orderStore.get(payment.orderId);
            return order?.tenantContext.tenantId === tenantContext.tenantId;
        });
    }
    listOrderPayments(orderId, tenantContext) {
        const order = orderStore.get(orderId);
        if (!order || order.tenantContext.tenantId !== tenantContext.tenantId) {
            return [];
        }
        return Array.from(paymentStore.values()).filter((payment) => payment.orderId === orderId);
    }
    getLatestPayment(orderId, tenantContext) {
        const order = this.getOrder(orderId, tenantContext);
        if (!order?.latestPaymentId) {
            return undefined;
        }
        return paymentStore.get(order.latestPaymentId);
    }
    async applyPaymentCallback(input) {
        const order = orderStore.get(input.orderId);
        if (!order) {
            throw new Error(`Order ${input.orderId} not found`);
        }
        if (order.tenantContext.tenantId !== input.tenantId) {
            throw new Error(`Order ${input.orderId} does not belong to tenant ${input.tenantId}`);
        }
        if (order.status === cashier_entity_1.CashierOrderStatus.Closed) {
            throw new Error(`Order ${input.orderId} is already closed`);
        }
        const existingPayment = Array.from(paymentStore.values()).find((payment) => payment.orderId === input.orderId &&
            (input.externalPaymentId
                ? payment.externalPaymentId === input.externalPaymentId
                : payment.paymentId === order.latestPaymentId)) ??
            await this.createPayment(input.orderId, {
                channel: input.channel ?? 'unknown',
                amount: input.amount,
                externalPaymentId: input.externalPaymentId
            });
        const now = new Date().toISOString();
        existingPayment.externalPaymentId = input.externalPaymentId ?? existingPayment.externalPaymentId;
        existingPayment.transactionNo = input.transactionNo;
        existingPayment.sourceEventName = input.standardizedEventName;
        existingPayment.updatedAt = now;
        existingPayment.completedAt = now;
        if (input.standardizedEventName === 'cashier.payment-succeeded') {
            existingPayment.status = cashier_entity_1.CashierPaymentStatus.Succeeded;
            order.status = cashier_entity_1.CashierOrderStatus.Paid;
            order.paidAt = now;
            await this.loyaltyService?.settlePaidOrder(order, existingPayment);
        }
        else {
            existingPayment.status = cashier_entity_1.CashierPaymentStatus.Failed;
            existingPayment.failureReason = 'Payment callback reported failure';
            order.status = cashier_entity_1.CashierOrderStatus.PaymentFailed;
            await this.loyaltyService?.settleFailedOrder(order, existingPayment);
        }
        order.latestPaymentId = existingPayment.paymentId;
        order.updatedAt = now;
        paymentStore.set(existingPayment.paymentId, existingPayment);
        orderStore.set(order.orderId, order);
        await this.publishEvent(input.standardizedEventName, {
            orderId: order.orderId,
            paymentId: existingPayment.paymentId,
            transactionNo: existingPayment.transactionNo,
            status: existingPayment.status
        });
        return {
            order,
            payment: existingPayment
        };
    }
    async closeTimedOutOrder(orderId, tenantContext, reason = cashier_entity_1.CashierOrderCloseReason.PaymentTimeout) {
        const order = orderStore.get(orderId);
        if (!order) {
            throw new Error(`Order ${orderId} not found`);
        }
        if (order.tenantContext.tenantId !== tenantContext.tenantId) {
            throw new Error(`Order ${orderId} does not belong to tenant ${tenantContext.tenantId}`);
        }
        if (order.status === cashier_entity_1.CashierOrderStatus.Paid) {
            throw new Error(`Paid order ${orderId} cannot be timeout-closed`);
        }
        const payment = order.latestPaymentId ? paymentStore.get(order.latestPaymentId) : undefined;
        if (order.status === cashier_entity_1.CashierOrderStatus.Closed) {
            return { order, payment };
        }
        if (order.status !== cashier_entity_1.CashierOrderStatus.PendingPayment && order.status !== cashier_entity_1.CashierOrderStatus.Created) {
            throw new Error(`Order ${orderId} is not eligible for timeout close`);
        }
        const now = new Date().toISOString();
        if (payment && payment.status === cashier_entity_1.CashierPaymentStatus.Pending) {
            payment.status = cashier_entity_1.CashierPaymentStatus.Failed;
            payment.failureReason = 'Payment timed out';
            payment.sourceEventName = 'cashier.payment-timeout-closed';
            payment.updatedAt = now;
            payment.completedAt = now;
            paymentStore.set(payment.paymentId, payment);
            await this.publishEvent('cashier.payment-failed', {
                orderId: order.orderId,
                paymentId: payment.paymentId,
                status: payment.status,
                failureReason: payment.failureReason
            });
        }
        order.status = cashier_entity_1.CashierOrderStatus.Closed;
        order.closedAt = now;
        order.closeReason = reason;
        order.updatedAt = now;
        orderStore.set(order.orderId, order);
        if (payment) {
            await this.loyaltyService?.settleFailedOrder(order, payment);
        }
        await this.publishEvent('cashier.order-closed', {
            orderId: order.orderId,
            tenantId: tenantContext.tenantId,
            closeReason: reason,
            status: order.status
        });
        return { order, payment };
    }
    async closeOrder(orderId, tenantContext, input) {
        const order = orderStore.get(orderId);
        if (!order) {
            throw new Error(`Order ${orderId} not found`);
        }
        if (order.tenantContext.tenantId !== tenantContext.tenantId) {
            throw new Error(`Order ${orderId} does not belong to tenant ${tenantContext.tenantId}`);
        }
        if (order.status === cashier_entity_1.CashierOrderStatus.Paid) {
            throw new Error(`Paid order ${orderId} cannot be manually closed`);
        }
        const payment = order.latestPaymentId ? paymentStore.get(order.latestPaymentId) : undefined;
        if (order.status === cashier_entity_1.CashierOrderStatus.Closed) {
            return { order, payment };
        }
        if (order.status !== cashier_entity_1.CashierOrderStatus.PendingPayment && order.status !== cashier_entity_1.CashierOrderStatus.Created) {
            throw new Error(`Order ${orderId} is not eligible for manual close`);
        }
        const now = new Date().toISOString();
        if (payment && payment.status === cashier_entity_1.CashierPaymentStatus.Pending) {
            payment.status = cashier_entity_1.CashierPaymentStatus.Failed;
            payment.failureReason = 'Order manually closed';
            payment.sourceEventName = 'cashier.payment-manual-close';
            payment.updatedAt = now;
            payment.completedAt = now;
            paymentStore.set(payment.paymentId, payment);
            await this.publishEvent('cashier.payment-failed', {
                orderId: order.orderId,
                paymentId: payment.paymentId,
                status: payment.status,
                failureReason: payment.failureReason
            });
        }
        order.status = cashier_entity_1.CashierOrderStatus.Closed;
        order.closedAt = now;
        order.closeReason = cashier_entity_1.CashierOrderCloseReason.ManualCancel;
        order.closedBy = input?.operator;
        order.closeNote = input?.reason;
        order.updatedAt = now;
        orderStore.set(order.orderId, order);
        if (payment) {
            await this.loyaltyService?.settleFailedOrder(order, payment);
        }
        await this.publishEvent('cashier.order-closed', {
            orderId: order.orderId,
            tenantId: tenantContext.tenantId,
            closeReason: cashier_entity_1.CashierOrderCloseReason.ManualCancel,
            closedBy: order.closedBy,
            closeNote: order.closeNote,
            status: order.status
        });
        return { order, payment };
    }
    resetCashierStoresForTests() {
        orderStore.clear();
        paymentStore.clear();
    }
};
exports.CashierService = CashierService;
exports.CashierService = CashierService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __param(2, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [member_service_1.MemberService,
        loyalty_service_1.LoyaltyService,
        integration_orchestration_service_1.IntegrationOrchestrationService])
], CashierService);
//# sourceMappingURL=cashier.service.js.map