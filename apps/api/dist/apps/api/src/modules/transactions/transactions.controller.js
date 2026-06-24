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
exports.TransactionsController = void 0;
const common_1 = require("@nestjs/common");
const cashier_dto_1 = require("../cashier/cashier.dto");
const tenant_decorator_1 = require("../tenant/tenant.decorator");
const transactions_dto_1 = require("./transactions.dto");
const transactions_service_1 = require("./transactions.service");
let TransactionsController = class TransactionsController {
    transactionsService;
    constructor(transactionsService) {
        this.transactionsService = transactionsService;
    }
    startCheckout(tenantContext, body) {
        return this.transactionsService.startCheckout(tenantContext, body);
    }
    applyPaymentCallback(body) {
        return this.transactionsService.applyPaymentCallback(body);
    }
    getOrderTransaction(orderId, tenantContext) {
        return this.transactionsService.getOrderTransaction(orderId, tenantContext);
    }
    listOrderTransactions(tenantContext, query = {}) {
        return this.transactionsService.listOrderTransactions(tenantContext, query);
    }
    listLytOrderSnapshots(tenantContext) {
        return this.transactionsService.listLytOrderSnapshots(tenantContext);
    }
    getLytOrderSnapshot(externalOrderId, tenantContext) {
        return this.transactionsService.getLytOrderSnapshot(externalOrderId, tenantContext);
    }
    listLytPaymentSnapshots(tenantContext) {
        return this.transactionsService.listLytPaymentSnapshots(tenantContext);
    }
    getLytPaymentSnapshot(externalPaymentId, tenantContext) {
        return this.transactionsService.getLytPaymentSnapshot(externalPaymentId, tenantContext);
    }
    timeoutCloseOrder(orderId, tenantContext, body) {
        return this.transactionsService.timeoutCloseOrder(orderId, tenantContext, body);
    }
    batchTimeoutCloseOrders(tenantContext, body) {
        return this.transactionsService.batchTimeoutCloseOrders(tenantContext, body);
    }
    manualCloseOrder(orderId, tenantContext, body) {
        return this.transactionsService.manualCloseOrder(orderId, tenantContext, body);
    }
    listOrderRefunds(orderId, tenantContext) {
        return this.transactionsService.listOrderRefunds(orderId, tenantContext);
    }
    listRefunds(tenantContext, query = {}) {
        return this.transactionsService.listRefunds(tenantContext, query);
    }
    listPendingRefunds(tenantContext, query = {}) {
        return this.transactionsService.listPendingRefunds(tenantContext, query);
    }
    getRefundDashboard(tenantContext, query = {}) {
        return this.transactionsService.getRefundDashboard(tenantContext, query);
    }
    getRefund(refundId, tenantContext) {
        return this.transactionsService.getRefund(refundId, tenantContext);
    }
    requestRefund(orderId, tenantContext, body) {
        return this.transactionsService.requestRefund(orderId, tenantContext, body);
    }
    approveRefund(refundId, tenantContext, body) {
        return this.transactionsService.approveRefund(refundId, tenantContext, body);
    }
    rejectRefund(refundId, tenantContext, body) {
        return this.transactionsService.rejectRefund(refundId, tenantContext, body);
    }
    batchApproveRefunds(tenantContext, body) {
        return this.transactionsService.batchApproveRefunds(tenantContext, body);
    }
    batchRejectRefunds(tenantContext, body) {
        return this.transactionsService.batchRejectRefunds(tenantContext, body);
    }
    batchAssignRefunds(tenantContext, body) {
        return this.transactionsService.batchAssignRefunds(tenantContext, body);
    }
    batchClaimRefunds(tenantContext, body) {
        return this.transactionsService.batchClaimRefunds(tenantContext, body);
    }
    listMemberTransactions(memberId, tenantContext) {
        return this.transactionsService.listMemberTransactions(memberId, tenantContext);
    }
    listMemberRefunds(memberId, tenantContext, query) {
        return this.transactionsService.listRefunds(tenantContext, {
            ...query,
            memberId
        });
    }
};
exports.TransactionsController = TransactionsController;
__decorate([
    (0, common_1.Post)('checkout'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, transactions_dto_1.CreateTransactionCheckoutDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "startCheckout", null);
__decorate([
    (0, common_1.Post)('payments/standardized-callback'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cashier_dto_1.CashierPaymentCallbackDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "applyPaymentCallback", null);
__decorate([
    (0, common_1.Get)('orders/:orderId'),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "getOrderTransaction", null);
__decorate([
    (0, common_1.Get)('orders'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, transactions_dto_1.ListTransactionOrdersQueryDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "listOrderTransactions", null);
__decorate([
    (0, common_1.Get)('persistent/snapshots/orders'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "listLytOrderSnapshots", null);
__decorate([
    (0, common_1.Get)('persistent/snapshots/orders/:externalOrderId'),
    __param(0, (0, common_1.Param)('externalOrderId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "getLytOrderSnapshot", null);
__decorate([
    (0, common_1.Get)('persistent/snapshots/payments'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "listLytPaymentSnapshots", null);
__decorate([
    (0, common_1.Get)('persistent/snapshots/payments/:externalPaymentId'),
    __param(0, (0, common_1.Param)('externalPaymentId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "getLytPaymentSnapshot", null);
__decorate([
    (0, common_1.Post)('orders/:orderId/timeout-close'),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, transactions_dto_1.RequestTransactionTimeoutCloseDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "timeoutCloseOrder", null);
__decorate([
    (0, common_1.Post)('orders/batch-timeout-close'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, transactions_dto_1.BatchTimeoutCloseOrdersDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "batchTimeoutCloseOrders", null);
__decorate([
    (0, common_1.Post)('orders/:orderId/manual-close'),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, transactions_dto_1.RequestTransactionManualCloseDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "manualCloseOrder", null);
__decorate([
    (0, common_1.Get)('orders/:orderId/refunds'),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "listOrderRefunds", null);
__decorate([
    (0, common_1.Get)('refunds'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, transactions_dto_1.ListTransactionRefundsQueryDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "listRefunds", null);
__decorate([
    (0, common_1.Get)('refunds/pending'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, transactions_dto_1.ListTransactionRefundsQueryDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "listPendingRefunds", null);
__decorate([
    (0, common_1.Get)('refunds/dashboard'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, transactions_dto_1.GetTransactionRefundDashboardQueryDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "getRefundDashboard", null);
__decorate([
    (0, common_1.Get)('refunds/:refundId'),
    __param(0, (0, common_1.Param)('refundId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "getRefund", null);
__decorate([
    (0, common_1.Post)('orders/:orderId/refunds'),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, transactions_dto_1.RequestTransactionRefundDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "requestRefund", null);
__decorate([
    (0, common_1.Post)('refunds/:refundId/approve'),
    __param(0, (0, common_1.Param)('refundId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, transactions_dto_1.ReviewTransactionRefundDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "approveRefund", null);
__decorate([
    (0, common_1.Post)('refunds/:refundId/reject'),
    __param(0, (0, common_1.Param)('refundId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, transactions_dto_1.ReviewTransactionRefundDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "rejectRefund", null);
__decorate([
    (0, common_1.Post)('refunds/batch-approve'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, transactions_dto_1.BatchReviewTransactionRefundsDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "batchApproveRefunds", null);
__decorate([
    (0, common_1.Post)('refunds/batch-reject'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, transactions_dto_1.BatchReviewTransactionRefundsDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "batchRejectRefunds", null);
__decorate([
    (0, common_1.Post)('refunds/batch-assign'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, transactions_dto_1.BatchAssignTransactionRefundsDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "batchAssignRefunds", null);
__decorate([
    (0, common_1.Post)('refunds/batch-claim'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, transactions_dto_1.BatchClaimTransactionRefundsDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "batchClaimRefunds", null);
__decorate([
    (0, common_1.Get)('members/:memberId'),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "listMemberTransactions", null);
__decorate([
    (0, common_1.Get)('members/:memberId/refunds'),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, transactions_dto_1.ListTransactionRefundsQueryDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "listMemberRefunds", null);
exports.TransactionsController = TransactionsController = __decorate([
    (0, common_1.Controller)('transactions'),
    __metadata("design:paramtypes", [transactions_service_1.TransactionsService])
], TransactionsController);
//# sourceMappingURL=transactions.controller.js.map