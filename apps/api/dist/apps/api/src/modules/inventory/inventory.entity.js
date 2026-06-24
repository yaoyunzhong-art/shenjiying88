"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseOrderStatus = exports.StockRecordType = exports.ProductStatus = void 0;
var ProductStatus;
(function (ProductStatus) {
    ProductStatus["Active"] = "active";
    ProductStatus["Inactive"] = "inactive";
    ProductStatus["Discontinued"] = "discontinued";
})(ProductStatus || (exports.ProductStatus = ProductStatus = {}));
var StockRecordType;
(function (StockRecordType) {
    StockRecordType["Inbound"] = "inbound";
    StockRecordType["Outbound"] = "outbound";
    StockRecordType["Return"] = "return";
    StockRecordType["Adjustment"] = "adjustment";
})(StockRecordType || (exports.StockRecordType = StockRecordType = {}));
var PurchaseOrderStatus;
(function (PurchaseOrderStatus) {
    PurchaseOrderStatus["Draft"] = "draft";
    PurchaseOrderStatus["Submitted"] = "submitted";
    PurchaseOrderStatus["Confirmed"] = "confirmed";
    PurchaseOrderStatus["Received"] = "received";
    PurchaseOrderStatus["Cancelled"] = "cancelled";
})(PurchaseOrderStatus || (exports.PurchaseOrderStatus = PurchaseOrderStatus = {}));
//# sourceMappingURL=inventory.entity.js.map