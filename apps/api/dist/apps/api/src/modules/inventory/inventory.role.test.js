"use strict";
/**
 * 🐜 自动: [inventory] [C] 角色测试
 *
 * 8 角色视角的 inventory 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界/业务场景）
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const inventory_controller_1 = require("./inventory.controller");
const inventory_service_1 = require("./inventory.service");
const inventory_entity_1 = require("./inventory.entity");
// ── 角色定义 ──
const ROLES = {
    StoreManager: '👔店长',
    FrontDesk: '🛒前台',
    HR: '👥HR',
    Security: '🔧安监',
    Guide: '🎮导玩员',
    Operations: '🎯运行专员',
    Teambuilding: '🤝团建',
    Marketing: '📢营销',
};
// ── 测试数据工厂 ──
const tenantCtx = {
    tenantId: 't-inv-role',
    brandId: 'b-arcade',
    storeId: 's-main',
};
function createController() {
    (0, inventory_service_1.resetInventoryServiceTestState)();
    const service = new inventory_service_1.InventoryService();
    return new inventory_controller_1.InventoryController(service);
}
// ─────────────────────────────────────────────────────────
// 👔店长 (StoreManager) — 全局库存管理、采购审批
// ─────────────────────────────────────────────────────────
(0, node_test_1.describe)(`${ROLES.StoreManager} — 店长视角`, () => {
    (0, node_test_1.default)('完整采购流程：创建商品 → 入库 → 创建采购单 → 确认 → 收货', () => {
        const ctrl = createController();
        // 创建商品
        const product = ctrl.createProduct(tenantCtx, {
            name: 'Switch 手柄',
            sku: 'SW-HL-001',
            unit: '个',
            price: 450,
            cost: 300,
            minStock: 5,
            maxStock: 100,
            currentStock: 0,
        });
        strict_1.default.equal(product.name, 'Switch 手柄');
        strict_1.default.equal(product.currentStock, 0);
        // 入库
        const { product: stockedProduct } = ctrl.stockIn(tenantCtx, {
            productId: product.id,
            quantity: 30,
            reason: '首单到货',
        });
        strict_1.default.equal(stockedProduct.currentStock, 30);
        // 创建采购单
        const po = ctrl.createPurchaseOrder(tenantCtx, {
            items: [{ productId: product.id, productName: product.name, sku: product.sku, quantity: 20, unitPrice: 300, totalPrice: 6000 }],
            totalAmount: 6000,
        });
        strict_1.default.equal(po.status, 'draft');
        // 确认采购单
        const confirmed = ctrl.confirmOrder(po.id, tenantCtx);
        strict_1.default.equal(confirmed.status, 'confirmed');
        // 收货 → 自动入库
        const received = ctrl.receiveOrder(po.id, tenantCtx);
        strict_1.default.equal(received.status, 'received');
        // 验证库存增加了采购量
        const updatedProduct = ctrl.getProduct(product.id, tenantCtx);
        strict_1.default.equal(updatedProduct.currentStock, 50);
    });
    (0, node_test_1.default)('低库存预警阈值可配置', () => {
        const ctrl = createController();
        const p1 = ctrl.createProduct(tenantCtx, {
            name: '饮料', sku: 'DR-001', unit: '瓶', price: 5, cost: 3,
            minStock: 10, maxStock: 200, currentStock: 8,
        });
        ctrl.createProduct(tenantCtx, {
            name: '零食', sku: 'SN-001', unit: '包', price: 10, cost: 6,
            minStock: 20, maxStock: 100, currentStock: 25,
        });
        // 使用默认阈值（minStock）
        const alerts = ctrl.getLowStockProducts(tenantCtx, undefined);
        (0, strict_1.default)(alerts.length > 0);
        const p1Alert = alerts.find((a) => a.product.id === p1.id);
        (0, strict_1.default)(p1Alert, '低库存商品应在预警列表');
        strict_1.default.equal(p1Alert.status, 'low');
    });
    (0, node_test_1.default)('越权：不可查看其他门店的库存', () => {
        const ctrl = createController();
        ctrl.createProduct(tenantCtx, {
            name: '街机摇杆', sku: 'ARC-STK-001', unit: '个', price: 800, cost: 500,
            minStock: 2, maxStock: 50, currentStock: 10,
        });
        const otherTenantCtx = { tenantId: 't-other-store', brandId: 'b-other', storeId: 's-other' };
        const products = ctrl.listProducts(otherTenantCtx, {});
        strict_1.default.equal(products.length, 0, '其他门店不应看到本门店商品');
    });
});
// ─────────────────────────────────────────────────────────
// 🛒前台 (FrontDesk) — 日常销售出库
// ─────────────────────────────────────────────────────────
(0, node_test_1.describe)(`${ROLES.FrontDesk} — 前台视角`, () => {
    (0, node_test_1.default)('正常销售出库流程', () => {
        const ctrl = createController();
        const product = ctrl.createProduct(tenantCtx, {
            name: '游戏币', sku: 'COIN-001', unit: '枚', price: 1, cost: 0.5,
            minStock: 500, maxStock: 10000, currentStock: 3000,
        });
        const { product: afterSale } = ctrl.stockOut(tenantCtx, {
            productId: product.id,
            quantity: 100,
            reason: '销售出库',
        });
        strict_1.default.equal(afterSale.currentStock, 2900);
    });
    (0, node_test_1.default)('库存不足时禁止出库', () => {
        const ctrl = createController();
        const product = ctrl.createProduct(tenantCtx, {
            name: '限量手办', sku: 'FIG-LMTD-001', unit: '个', price: 299, cost: 150,
            minStock: 0, maxStock: 5, currentStock: 2,
        });
        strict_1.default.throws(() => ctrl.stockOut(tenantCtx, { productId: product.id, quantity: 10 }), /Insufficient stock/);
    });
    (0, node_test_1.default)('出库后检查库存是否已更新', () => {
        const ctrl = createController();
        const product = ctrl.createProduct(tenantCtx, {
            name: '卡片包', sku: 'CARD-PK-001', unit: '包', price: 15, cost: 10,
            minStock: 10, maxStock: 200, currentStock: 50,
        });
        ctrl.stockOut(tenantCtx, { productId: product.id, quantity: 10 });
        ctrl.stockOut(tenantCtx, { productId: product.id, quantity: 5 });
        const updated = ctrl.getProduct(product.id, tenantCtx);
        strict_1.default.equal(updated.currentStock, 35);
    });
});
// ─────────────────────────────────────────────────────────
// 👥HR (人力资源) — 员工物资领用审批
// ─────────────────────────────────────────────────────────
(0, node_test_1.describe)(`${ROLES.HR} — HR视角`, () => {
    (0, node_test_1.default)('创建新供应商（入职物资采购渠道）', () => {
        const ctrl = createController();
        const supplier = ctrl.createSupplier(tenantCtx, {
            name: '办公用品供应商',
            contactName: '李经理',
            phone: '13800138000',
            email: 'li@office.com',
            address: '上海市浦东新区',
        });
        strict_1.default.equal(supplier.name, '办公用品供应商');
        strict_1.default.equal(supplier.contactName, '李经理');
    });
    (0, node_test_1.default)('查看供应商列表', () => {
        const ctrl = createController();
        ctrl.createSupplier(tenantCtx, { name: '文具商' });
        ctrl.createSupplier(tenantCtx, { name: '工装商' });
        const suppliers = ctrl.listSuppliers(tenantCtx);
        strict_1.default.equal(suppliers.length, 2);
    });
    (0, node_test_1.default)('无法访问非本租户供应商', () => {
        const ctrl = createController();
        ctrl.createSupplier(tenantCtx, { name: '本公司供应商' });
        const otherCtx = { tenantId: 't-hr-other', brandId: 'b-other', storeId: 's-other' };
        const suppliers = ctrl.listSuppliers(otherCtx);
        strict_1.default.equal(suppliers.length, 0);
    });
});
// ─────────────────────────────────────────────────────────
// 🔧安监 (Security) — 盘点调账、查看库存记录
// ─────────────────────────────────────────────────────────
(0, node_test_1.describe)(`${ROLES.Security} — 安监视角`, () => {
    (0, node_test_1.default)('盘点调账：发现库存差异后调整', () => {
        const ctrl = createController();
        const product = ctrl.createProduct(tenantCtx, {
            name: '摄像头', sku: 'CAM-001', unit: '个', price: 500, cost: 350,
            minStock: 2, maxStock: 20, currentStock: 10,
        });
        // 盘点发现实际有 8 个（少了 2）
        const { product: adjusted } = ctrl.adjustStock(tenantCtx, {
            productId: product.id,
            newQuantity: 8,
            reason: '盘点差异调整',
        });
        strict_1.default.equal(adjusted.currentStock, 8);
    });
    (0, node_test_1.default)('查看出入库记录', () => {
        const ctrl = createController();
        const product = ctrl.createProduct(tenantCtx, {
            name: '消防设备', sku: 'FIRE-001', unit: '个', price: 200, cost: 120,
            minStock: 1, maxStock: 10, currentStock: 3,
        });
        ctrl.stockIn(tenantCtx, { productId: product.id, quantity: 5, reason: '补货' });
        ctrl.stockOut(tenantCtx, { productId: product.id, quantity: 1, reason: '领用' });
        const records = ctrl.getStockRecords(tenantCtx, { productId: product.id });
        strict_1.default.equal(records.length, 2);
    });
    (0, node_test_1.default)('按类型筛选库存记录', () => {
        const ctrl = createController();
        const product = ctrl.createProduct(tenantCtx, {
            name: '门禁卡', sku: 'ACCESS-001', unit: '张', price: 30, cost: 20,
            minStock: 5, maxStock: 50, currentStock: 10,
        });
        ctrl.stockOut(tenantCtx, { productId: product.id, quantity: 3, reason: '保安领用' });
        const outRecords = ctrl.getStockRecords(tenantCtx, { productId: product.id, type: inventory_entity_1.StockRecordType.Outbound });
        (0, strict_1.default)(outRecords.length > 0);
        strict_1.default.equal(outRecords[0].type, 'outbound');
    });
});
// ─────────────────────────────────────────────────────────
// 🎮导玩员 (Guide) — 奖品商品出库、库存查询
// ─────────────────────────────────────────────────────────
(0, node_test_1.describe)(`${ROLES.Guide} — 导玩员视角`, () => {
    (0, node_test_1.default)('兑换奖品出库', () => {
        const ctrl = createController();
        const prize = ctrl.createProduct(tenantCtx, {
            name: '毛绒公仔', sku: 'PRIZE-TOY-001', unit: '个', price: 0, cost: 25,
            minStock: 5, maxStock: 50, currentStock: 20,
        });
        const { product: afterExchange } = ctrl.stockOut(tenantCtx, {
            productId: prize.id,
            quantity: 2,
            reason: '积分兑换',
        });
        strict_1.default.equal(afterExchange.currentStock, 18);
    });
    (0, node_test_1.default)('查询商品详情以告知玩家', () => {
        const ctrl = createController();
        const product = ctrl.createProduct(tenantCtx, {
            name: '扭蛋', sku: 'GACHA-001', unit: '个', price: 10, cost: 3,
            minStock: 10, maxStock: 200, currentStock: 100,
            barcode: '6923456789012',
            category: '奖品',
        });
        const details = ctrl.getProduct(product.id, tenantCtx);
        strict_1.default.equal(details.name, '扭蛋');
        strict_1.default.equal(details.barcode, '6923456789012');
        strict_1.default.equal(details.category, '奖品');
    });
    (0, node_test_1.default)('关键词搜索商品', () => {
        const ctrl = createController();
        ctrl.createProduct(tenantCtx, { name: '赛车模型', sku: 'CAR-001', unit: '个', price: 50, cost: 20, minStock: 5, maxStock: 30, currentStock: 15 });
        ctrl.createProduct(tenantCtx, { name: '赛车贴纸', sku: 'CAR-STK-001', unit: '张', price: 5, cost: 1, minStock: 10, maxStock: 100, currentStock: 50 });
        ctrl.createProduct(tenantCtx, { name: '积木套装', sku: 'BLOCK-001', unit: '盒', price: 80, cost: 30, minStock: 3, maxStock: 20, currentStock: 10 });
        const results = ctrl.listProducts(tenantCtx, { keyword: '赛车' });
        strict_1.default.equal(results.length, 2);
    });
});
// ─────────────────────────────────────────────────────────
// 🎯运行专员 (Operations) — 日常运营补货入库
// ─────────────────────────────────────────────────────────
(0, node_test_1.describe)(`${ROLES.Operations} — 运行专员视角`, () => {
    (0, node_test_1.default)('正常入库补货', () => {
        const ctrl = createController();
        const product = ctrl.createProduct(tenantCtx, {
            name: '矿泉水', sku: 'WATER-001', unit: '瓶', price: 3, cost: 1,
            minStock: 20, maxStock: 500, currentStock: 15,
        });
        const { product: restocked } = ctrl.stockIn(tenantCtx, {
            productId: product.id,
            quantity: 100,
            reason: '日常补货',
        });
        strict_1.default.equal(restocked.currentStock, 115);
    });
    (0, node_test_1.default)('批量入库含批次号', () => {
        const ctrl = createController();
        const p1 = ctrl.createProduct(tenantCtx, {
            name: '耳机', sku: 'AUD-001', unit: '副', price: 99, cost: 50,
            minStock: 5, maxStock: 50, currentStock: 10,
        });
        const { record } = ctrl.stockIn(tenantCtx, {
            productId: p1.id,
            quantity: 20,
            reason: '批量到货',
            batchNo: 'BATCH-20260601',
        });
        strict_1.default.equal(record.batchNo, 'BATCH-20260601');
        (0, strict_1.default)(record.id.startsWith('sr-'));
    });
    (0, node_test_1.default)('按日期范围筛选库存记录', () => {
        const ctrl = createController();
        const product = ctrl.createProduct(tenantCtx, {
            name: '纸巾', sku: 'TIS-001', unit: '包', price: 2, cost: 0.8,
            minStock: 30, maxStock: 200, currentStock: 50,
        });
        ctrl.stockIn(tenantCtx, { productId: product.id, quantity: 50, reason: '补货' });
        ctrl.stockOut(tenantCtx, { productId: product.id, quantity: 10, reason: '使用' });
        const now = new Date().toISOString();
        const past = new Date(Date.now() - 86400000).toISOString();
        const records = ctrl.getStockRecords(tenantCtx, {
            productId: product.id,
            dateFrom: past,
            dateTo: now,
        });
        strict_1.default.equal(records.length, 2);
    });
});
// ─────────────────────────────────────────────────────────
// 🤝团建 (Teambuilding) — 活动物资采购与管理
// ─────────────────────────────────────────────────────────
(0, node_test_1.describe)(`${ROLES.Teambuilding} — 团建视角`, () => {
    (0, node_test_1.default)('为团建活动创建临时用品采购单', () => {
        const ctrl = createController();
        // 先创建团建物资
        const food = ctrl.createProduct(tenantCtx, {
            name: '烧烤食材套餐', sku: 'BBQ-SET-001', unit: '套', price: 200, cost: 120,
            minStock: 0, maxStock: 20, currentStock: 0,
        });
        const drink = ctrl.createProduct(tenantCtx, {
            name: '饮料箱', sku: 'DRINK-BX-001', unit: '箱', price: 50, cost: 30,
            minStock: 0, maxStock: 10, currentStock: 0,
        });
        const po = ctrl.createPurchaseOrder(tenantCtx, {
            storeId: tenantCtx.storeId,
            items: [
                { productId: food.id, productName: food.name, sku: food.sku, quantity: 3, unitPrice: 120, totalPrice: 360 },
                { productId: drink.id, productName: drink.name, sku: drink.sku, quantity: 5, unitPrice: 30, totalPrice: 150 },
            ],
            totalAmount: 510,
        });
        strict_1.default.equal(po.items.length, 2);
        strict_1.default.equal(po.totalAmount, 510);
    });
    (0, node_test_1.default)('按门店筛选采购单', () => {
        const ctrl = createController();
        const product = ctrl.createProduct(tenantCtx, {
            name: '团建 T 恤', sku: 'TSH-001', unit: '件', price: 30, cost: 15,
            minStock: 0, maxStock: 100, currentStock: 0,
        });
        ctrl.createPurchaseOrder(tenantCtx, {
            items: [{ productId: product.id, productName: product.name, sku: product.sku, quantity: 20, unitPrice: 15, totalPrice: 300 }],
            totalAmount: 300,
        });
        const orders = ctrl.listPurchaseOrders(tenantCtx, { storeId: tenantCtx.storeId });
        strict_1.default.equal(orders.length, 1);
    });
});
// ─────────────────────────────────────────────────────────
// 📢营销 (Marketing) — 促销赠品库存查看与更新
// ─────────────────────────────────────────────────────────
(0, node_test_1.describe)(`${ROLES.Marketing} — 营销视角`, () => {
    (0, node_test_1.default)('创建促销赠品商品并补货', () => {
        const ctrl = createController();
        const gift = ctrl.createProduct(tenantCtx, {
            name: '限定徽章', sku: 'GIFT-BADGE-001', unit: '枚', price: 0, cost: 5,
            minStock: 20, maxStock: 500, currentStock: 0,
            imageUrl: 'https://cdn.example.com/badge-001.png',
        });
        strict_1.default.equal(gift.name, '限定徽章');
        strict_1.default.equal(gift.imageUrl, 'https://cdn.example.com/badge-001.png');
        const { product: stocked } = ctrl.stockIn(tenantCtx, {
            productId: gift.id,
            quantity: 300,
            reason: '活动备货',
        });
        strict_1.default.equal(stocked.currentStock, 300);
    });
    (0, node_test_1.default)('按分类筛选商品（促销商品选品）', () => {
        const ctrl = createController();
        ctrl.createProduct(tenantCtx, { name: '联名水杯', sku: 'CUP-001', unit: '个', price: 35, cost: 15, minStock: 5, maxStock: 100, currentStock: 30, category: '促销品' });
        ctrl.createProduct(tenantCtx, { name: '联名贴纸', sku: 'STK-002', unit: '张', price: 5, cost: 1, minStock: 10, maxStock: 500, currentStock: 200, category: '促销品' });
        ctrl.createProduct(tenantCtx, { name: '街机主板', sku: 'PCB-001', unit: '块', price: 1200, cost: 800, minStock: 1, maxStock: 10, currentStock: 3, category: '备件' });
        const promo = ctrl.listProducts(tenantCtx, { category: '促销品' });
        strict_1.default.equal(promo.length, 2);
    });
    (0, node_test_1.default)('创建商品时 status 默认为 active', () => {
        const ctrl = createController();
        const product = ctrl.createProduct(tenantCtx, {
            name: '宣传海报', sku: 'POSTER-001', unit: '张', price: 0, cost: 2,
            minStock: 10, maxStock: 200, currentStock: 50,
        });
        strict_1.default.equal(product.status, 'active');
    });
});
//# sourceMappingURL=inventory.role.test.js.map