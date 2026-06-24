"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toProductContract = toProductContract;
exports.toStockRecordContract = toStockRecordContract;
exports.toSupplierContract = toSupplierContract;
exports.toPurchaseOrderContract = toPurchaseOrderContract;
exports.toStockAlertContract = toStockAlertContract;
exports.isStockSufficient = isStockSufficient;
/**
 * Convert internal Product to cross-module contract.
 */
function toProductContract(product) {
    return {
        id: product.id,
        tenantId: product.tenantId,
        brandId: product.brandId,
        storeId: product.storeId,
        name: product.name,
        sku: product.sku,
        category: product.category,
        unit: product.unit,
        price: product.price,
        cost: product.cost,
        minStock: product.minStock,
        maxStock: product.maxStock,
        currentStock: product.currentStock,
        status: product.status,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
    };
}
/**
 * Convert internal StockRecord to cross-module contract.
 */
function toStockRecordContract(record) {
    return {
        id: record.id,
        productId: record.productId,
        type: record.type,
        quantity: record.quantity,
        beforeStock: record.beforeStock,
        afterStock: record.afterStock,
        reason: record.reason,
        createdAt: record.createdAt,
    };
}
/**
 * Convert internal Supplier to cross-module contract.
 */
function toSupplierContract(supplier) {
    return {
        id: supplier.id,
        tenantId: supplier.tenantId,
        name: supplier.name,
        contactName: supplier.contactName,
        phone: supplier.phone,
        email: supplier.email,
        createdAt: supplier.createdAt,
    };
}
/**
 * Convert internal PurchaseOrder to cross-module contract.
 */
function toPurchaseOrderContract(order) {
    return {
        id: order.id,
        tenantId: order.tenantId,
        storeId: order.storeId,
        supplierId: order.supplierId,
        status: order.status,
        itemCount: order.items.length,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        receivedAt: order.receivedAt,
    };
}
/**
 * Convert internal StockAlert to cross-module contract.
 */
function toStockAlertContract(alert) {
    return {
        productId: alert.product.id,
        productName: alert.product.name,
        sku: alert.product.sku,
        currentStock: alert.currentStock,
        minStock: alert.minStock,
        maxStock: alert.maxStock,
        status: alert.status,
    };
}
/**
 * Check if stock level is sufficient for a given quantity.
 */
function isStockSufficient(currentStock, requiredQty) {
    return currentStock >= requiredQty;
}
//# sourceMappingURL=inventory.contract.js.map