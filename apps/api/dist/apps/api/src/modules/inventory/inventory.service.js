"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
exports.resetInventoryServiceTestState = resetInventoryServiceTestState;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const inventory_entity_1 = require("./inventory.entity");
const productStore = new Map();
const stockRecordStore = new Map();
const supplierStore = new Map();
const purchaseOrderStore = new Map();
function resetInventoryServiceTestState() {
    productStore.clear();
    stockRecordStore.clear();
    supplierStore.clear();
    purchaseOrderStore.clear();
}
let InventoryService = class InventoryService {
    // ─── Product CRUD ─────────────────────────────────────
    createProduct(tenantContext, input) {
        const now = new Date().toISOString();
        const product = {
            id: `prod-${(0, node_crypto_1.randomUUID)()}`,
            tenantId: tenantContext.tenantId,
            brandId: tenantContext.brandId,
            storeId: tenantContext.storeId,
            name: input.name,
            sku: input.sku,
            category: input.category,
            unit: input.unit,
            price: input.price,
            cost: input.cost,
            minStock: input.minStock,
            maxStock: input.maxStock,
            currentStock: input.currentStock,
            status: input.status ?? inventory_entity_1.ProductStatus.Active,
            imageUrl: input.imageUrl,
            barcode: input.barcode,
            createdAt: now,
            updatedAt: now
        };
        productStore.set(product.id, product);
        return product;
    }
    updateProduct(productId, tenantContext, input) {
        const product = this.requireProduct(productId, tenantContext);
        const now = new Date().toISOString();
        const updated = {
            ...product,
            name: input.name ?? product.name,
            sku: input.sku ?? product.sku,
            category: input.category !== undefined ? input.category : product.category,
            unit: input.unit ?? product.unit,
            price: input.price ?? product.price,
            cost: input.cost ?? product.cost,
            minStock: input.minStock ?? product.minStock,
            maxStock: input.maxStock ?? product.maxStock,
            status: input.status ?? product.status,
            imageUrl: input.imageUrl !== undefined ? input.imageUrl : product.imageUrl,
            barcode: input.barcode !== undefined ? input.barcode : product.barcode,
            updatedAt: now
        };
        productStore.set(productId, updated);
        return updated;
    }
    getProduct(productId, tenantContext) {
        return this.requireProduct(productId, tenantContext);
    }
    listProducts(tenantContext, query) {
        const limit = query?.limit && query.limit > 0 ? query.limit : undefined;
        const offset = query?.offset && query.offset > 0 ? query.offset : 0;
        let products = Array.from(productStore.values())
            .filter((p) => p.tenantId === tenantContext.tenantId);
        if (query?.category) {
            products = products.filter((p) => p.category === query.category);
        }
        if (query?.status) {
            products = products.filter((p) => p.status === query.status);
        }
        if (query?.keyword) {
            const keyword = query.keyword.toLowerCase();
            products = products.filter((p) => p.name.toLowerCase().includes(keyword) ||
                p.sku.toLowerCase().includes(keyword) ||
                (p.barcode && p.barcode.includes(keyword)));
        }
        products.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        if (typeof limit === 'number') {
            products = products.slice(offset, offset + limit);
        }
        return products;
    }
    // ─── Stock Operations ─────────────────────────────────
    stockIn(tenantContext, input) {
        const product = this.requireProduct(input.productId, tenantContext);
        const beforeStock = product.currentStock;
        const afterStock = beforeStock + input.quantity;
        return this.applyStockChange(product, {
            type: inventory_entity_1.StockRecordType.Inbound,
            quantity: input.quantity,
            beforeStock,
            afterStock,
            reason: input.reason,
            batchNo: input.batchNo
        });
    }
    stockOut(tenantContext, input) {
        const product = this.requireProduct(input.productId, tenantContext);
        this.checkProductStock(product, input.quantity);
        const beforeStock = product.currentStock;
        const afterStock = beforeStock - input.quantity;
        return this.applyStockChange(product, {
            type: inventory_entity_1.StockRecordType.Outbound,
            quantity: input.quantity,
            beforeStock,
            afterStock,
            reason: input.reason
        });
    }
    adjustStock(tenantContext, input) {
        const product = this.requireProduct(input.productId, tenantContext);
        const beforeStock = product.currentStock;
        const diff = input.newQuantity - beforeStock;
        const type = diff >= 0 ? inventory_entity_1.StockRecordType.Adjustment : inventory_entity_1.StockRecordType.Adjustment;
        return this.applyStockChange(product, {
            type,
            quantity: Math.abs(diff),
            beforeStock,
            afterStock: input.newQuantity,
            reason: input.reason
        });
    }
    checkStock(productId, requiredQty, tenantContext) {
        const product = this.requireProduct(productId, tenantContext);
        return this.checkProductStock(product, requiredQty);
    }
    getLowStockProducts(tenantContext, threshold) {
        return Array.from(productStore.values())
            .filter((p) => p.tenantId === tenantContext.tenantId && p.status === inventory_entity_1.ProductStatus.Active)
            .reduce((alerts, product) => {
            const effectiveThreshold = threshold ?? product.minStock;
            if (product.currentStock <= 0) {
                alerts.push({
                    product,
                    currentStock: product.currentStock,
                    minStock: effectiveThreshold,
                    maxStock: product.maxStock,
                    status: 'out_of_stock'
                });
            }
            else if (product.currentStock <= effectiveThreshold) {
                alerts.push({
                    product,
                    currentStock: product.currentStock,
                    minStock: effectiveThreshold,
                    maxStock: product.maxStock,
                    status: 'low'
                });
            }
            return alerts;
        }, []);
    }
    getStockRecords(tenantContext, query) {
        const limit = query?.limit && query.limit > 0 ? query.limit : undefined;
        const offset = query?.offset && query.offset > 0 ? query.offset : 0;
        let records = Array.from(stockRecordStore.values());
        // Filter by tenant via product ownership
        records = records.filter((r) => {
            const product = productStore.get(r.productId);
            return product && product.tenantId === tenantContext.tenantId;
        });
        if (query?.productId) {
            records = records.filter((r) => r.productId === query.productId);
        }
        if (query?.type) {
            records = records.filter((r) => r.type === query.type);
        }
        if (query?.dateFrom) {
            records = records.filter((r) => r.createdAt >= query.dateFrom);
        }
        if (query?.dateTo) {
            records = records.filter((r) => r.createdAt <= query.dateTo);
        }
        records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        if (typeof limit === 'number') {
            records = records.slice(offset, offset + limit);
        }
        return records;
    }
    // ─── Supplier CRUD ────────────────────────────────────
    createSupplier(tenantContext, input) {
        const now = new Date().toISOString();
        const supplier = {
            id: `supplier-${(0, node_crypto_1.randomUUID)()}`,
            tenantId: tenantContext.tenantId,
            name: input.name,
            contactName: input.contactName,
            phone: input.phone,
            email: input.email,
            address: input.address,
            createdAt: now
        };
        supplierStore.set(supplier.id, supplier);
        return supplier;
    }
    listSuppliers(tenantContext) {
        return Array.from(supplierStore.values())
            .filter((s) => s.tenantId === tenantContext.tenantId)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    // ─── Purchase Order ───────────────────────────────────
    createPurchaseOrder(tenantContext, input) {
        const now = new Date().toISOString();
        const items = input.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
        }));
        const order = {
            id: `po-${(0, node_crypto_1.randomUUID)()}`,
            tenantId: tenantContext.tenantId,
            storeId: input.storeId ?? tenantContext.storeId,
            supplierId: input.supplierId,
            status: inventory_entity_1.PurchaseOrderStatus.Draft,
            items,
            totalAmount: input.totalAmount,
            createdAt: now
        };
        purchaseOrderStore.set(order.id, order);
        return order;
    }
    confirmOrder(orderId, tenantContext) {
        const order = this.requirePurchaseOrder(orderId, tenantContext);
        if (order.status !== inventory_entity_1.PurchaseOrderStatus.Draft && order.status !== inventory_entity_1.PurchaseOrderStatus.Submitted) {
            throw new Error(`Purchase order ${orderId} cannot be confirmed (current status: ${order.status})`);
        }
        order.status = inventory_entity_1.PurchaseOrderStatus.Confirmed;
        order.orderedAt = new Date().toISOString();
        purchaseOrderStore.set(orderId, order);
        return order;
    }
    receiveOrder(orderId, tenantContext) {
        const order = this.requirePurchaseOrder(orderId, tenantContext);
        if (order.status !== inventory_entity_1.PurchaseOrderStatus.Confirmed) {
            throw new Error(`Purchase order ${orderId} must be confirmed before receiving`);
        }
        // Auto stock-in for each item
        for (const item of order.items) {
            const product = productStore.get(item.productId);
            if (product && product.tenantId === tenantContext.tenantId) {
                this.stockIn(tenantContext, {
                    productId: item.productId,
                    quantity: item.quantity,
                    reason: `采购收货 PO#${orderId}`,
                    batchNo: orderId
                });
            }
        }
        order.status = inventory_entity_1.PurchaseOrderStatus.Received;
        order.receivedAt = new Date().toISOString();
        purchaseOrderStore.set(orderId, order);
        return order;
    }
    listPurchaseOrders(tenantContext, query) {
        const limit = query?.limit && query.limit > 0 ? query.limit : undefined;
        const offset = query?.offset && query.offset > 0 ? query.offset : 0;
        let orders = Array.from(purchaseOrderStore.values())
            .filter((o) => o.tenantId === tenantContext.tenantId);
        if (query?.status) {
            orders = orders.filter((o) => o.status === query.status);
        }
        if (query?.supplierId) {
            orders = orders.filter((o) => o.supplierId === query.supplierId);
        }
        if (query?.storeId) {
            orders = orders.filter((o) => o.storeId === query.storeId);
        }
        orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        if (typeof limit === 'number') {
            orders = orders.slice(offset, offset + limit);
        }
        return orders;
    }
    // ─── Private Helpers ──────────────────────────────────
    requireProduct(productId, tenantContext) {
        const product = productStore.get(productId);
        if (!product || product.tenantId !== tenantContext.tenantId) {
            throw new Error(`Product ${productId} not found`);
        }
        return product;
    }
    requirePurchaseOrder(orderId, tenantContext) {
        const order = purchaseOrderStore.get(orderId);
        if (!order || order.tenantId !== tenantContext.tenantId) {
            throw new Error(`Purchase order ${orderId} not found`);
        }
        return order;
    }
    checkProductStock(product, requiredQty) {
        if (product.currentStock < requiredQty) {
            throw new Error(`Insufficient stock for product ${product.name} (${product.sku}): ` +
                `required ${requiredQty}, available ${product.currentStock}`);
        }
        return true;
    }
    applyStockChange(product, params) {
        const now = new Date().toISOString();
        const record = {
            id: `sr-${(0, node_crypto_1.randomUUID)()}`,
            productId: product.id,
            storeId: product.storeId,
            type: params.type,
            quantity: params.quantity,
            beforeStock: params.beforeStock,
            afterStock: params.afterStock,
            reason: params.reason,
            batchNo: params.batchNo,
            createdAt: now
        };
        stockRecordStore.set(record.id, record);
        product.currentStock = params.afterStock;
        product.updatedAt = now;
        productStore.set(product.id, product);
        return { product, record };
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)()
], InventoryService);
//# sourceMappingURL=inventory.service.js.map