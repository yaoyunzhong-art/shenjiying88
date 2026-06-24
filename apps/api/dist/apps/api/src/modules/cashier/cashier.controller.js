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
exports.CashierController = void 0;
const common_1 = require("@nestjs/common");
const tenant_decorator_1 = require("../tenant/tenant.decorator");
const cashier_dto_1 = require("./cashier.dto");
const cashier_service_1 = require("./cashier.service");
let CashierController = class CashierController {
    cashierService;
    constructor(cashierService) {
        this.cashierService = cashierService;
    }
    listOrders(tenantContext) {
        return this.cashierService.listOrders(tenantContext);
    }
    getOrder(orderId, tenantContext) {
        const order = this.cashierService.getOrder(orderId, tenantContext);
        if (!order) {
            throw new Error(`Cashier order ${orderId} not found`);
        }
        return order;
    }
    createOrder(tenantContext, body) {
        return this.cashierService.createOrder(tenantContext, body);
    }
    createPayment(orderId, body) {
        return this.cashierService.createPayment(orderId, body);
    }
    listPayments(tenantContext) {
        return this.cashierService.listPayments(tenantContext);
    }
    applyPaymentCallback(body) {
        return this.cashierService.applyPaymentCallback(body);
    }
};
exports.CashierController = CashierController;
__decorate([
    (0, common_1.Get)('orders'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CashierController.prototype, "listOrders", null);
__decorate([
    (0, common_1.Get)('orders/:orderId'),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CashierController.prototype, "getOrder", null);
__decorate([
    (0, common_1.Post)('orders'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, cashier_dto_1.CreateCashierOrderDto]),
    __metadata("design:returntype", void 0)
], CashierController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Post)('orders/:orderId/payments'),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, cashier_dto_1.CreateCashierPaymentDto]),
    __metadata("design:returntype", void 0)
], CashierController.prototype, "createPayment", null);
__decorate([
    (0, common_1.Get)('payments'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CashierController.prototype, "listPayments", null);
__decorate([
    (0, common_1.Post)('payments/standardized-callback'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cashier_dto_1.CashierPaymentCallbackDto]),
    __metadata("design:returntype", void 0)
], CashierController.prototype, "applyPaymentCallback", null);
exports.CashierController = CashierController = __decorate([
    (0, common_1.Controller)('cashier'),
    __metadata("design:paramtypes", [cashier_service_1.CashierService])
], CashierController);
//# sourceMappingURL=cashier.controller.js.map