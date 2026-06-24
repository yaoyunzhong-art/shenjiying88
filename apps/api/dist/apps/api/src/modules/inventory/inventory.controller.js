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
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const tenant_decorator_1 = require("../tenant/tenant.decorator");
const inventory_dto_1 = require("./inventory.dto");
const inventory_service_1 = require("./inventory.service");
let InventoryController = class InventoryController {
    inventoryService;
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    // ─── Products ─────────────────────────────────────────
    createProduct(tenantContext, body) {
        return this.inventoryService.createProduct(tenantContext, body);
    }
    updateProduct(productId, tenantContext, body) {
        return this.inventoryService.updateProduct(productId, tenantContext, body);
    }
    getProduct(productId, tenantContext) {
        return this.inventoryService.getProduct(productId, tenantContext);
    }
    listProducts(tenantContext, query = {}) {
        return this.inventoryService.listProducts(tenantContext, query);
    }
    // ─── Stock Operations ─────────────────────────────────
    stockIn(tenantContext, body) {
        return this.inventoryService.stockIn(tenantContext, body);
    }
    stockOut(tenantContext, body) {
        return this.inventoryService.stockOut(tenantContext, body);
    }
    adjustStock(tenantContext, body) {
        return this.inventoryService.adjustStock(tenantContext, body);
    }
    checkStock(productId, qty, tenantContext) {
        const requiredQty = Number(qty) || 0;
        const ok = this.inventoryService.checkStock(productId, requiredQty, tenantContext);
        return { productId, requiredQty, sufficient: ok };
    }
    getLowStockProducts(tenantContext, threshold) {
        const thresholdNum = threshold ? Number(threshold) : undefined;
        return this.inventoryService.getLowStockProducts(tenantContext, thresholdNum);
    }
    getStockRecords(tenantContext, query = {}) {
        return this.inventoryService.getStockRecords(tenantContext, query);
    }
    // ─── Suppliers ────────────────────────────────────────
    createSupplier(tenantContext, body) {
        return this.inventoryService.createSupplier(tenantContext, body);
    }
    listSuppliers(tenantContext) {
        return this.inventoryService.listSuppliers(tenantContext);
    }
    // ─── Purchase Orders ──────────────────────────────────
    createPurchaseOrder(tenantContext, body) {
        return this.inventoryService.createPurchaseOrder(tenantContext, body);
    }
    confirmOrder(orderId, tenantContext) {
        return this.inventoryService.confirmOrder(orderId, tenantContext);
    }
    receiveOrder(orderId, tenantContext) {
        return this.inventoryService.receiveOrder(orderId, tenantContext);
    }
    listPurchaseOrders(tenantContext, query = {}) {
        return this.inventoryService.listPurchaseOrders(tenantContext, query);
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Post)('products'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, inventory_dto_1.CreateProductDto]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "createProduct", null);
__decorate([
    (0, common_1.Put)('products/:productId'),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, inventory_dto_1.UpdateProductDto]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "updateProduct", null);
__decorate([
    (0, common_1.Get)('products/:productId'),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getProduct", null);
__decorate([
    (0, common_1.Get)('products'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, inventory_dto_1.ProductQueryDto]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "listProducts", null);
__decorate([
    (0, common_1.Post)('stock/in'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, inventory_dto_1.StockInDto]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "stockIn", null);
__decorate([
    (0, common_1.Post)('stock/out'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, inventory_dto_1.StockOutDto]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "stockOut", null);
__decorate([
    (0, common_1.Post)('stock/adjust'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, inventory_dto_1.AdjustStockDto]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "adjustStock", null);
__decorate([
    (0, common_1.Get)('stock/check/:productId'),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Query)('qty')),
    __param(2, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "checkStock", null);
__decorate([
    (0, common_1.Get)('stock/low-products'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Query)('threshold')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getLowStockProducts", null);
__decorate([
    (0, common_1.Get)('stock/records'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, inventory_dto_1.StockRecordQueryDto]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getStockRecords", null);
__decorate([
    (0, common_1.Post)('suppliers'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, inventory_dto_1.CreateSupplierDto]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "createSupplier", null);
__decorate([
    (0, common_1.Get)('suppliers'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "listSuppliers", null);
__decorate([
    (0, common_1.Post)('purchase-orders'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, inventory_dto_1.CreatePurchaseOrderDto]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "createPurchaseOrder", null);
__decorate([
    (0, common_1.Post)('purchase-orders/:orderId/confirm'),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "confirmOrder", null);
__decorate([
    (0, common_1.Post)('purchase-orders/:orderId/receive'),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "receiveOrder", null);
__decorate([
    (0, common_1.Get)('purchase-orders'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, inventory_dto_1.PurchaseOrderQueryDto]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "listPurchaseOrders", null);
exports.InventoryController = InventoryController = __decorate([
    (0, common_1.Controller)('inventory'),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map