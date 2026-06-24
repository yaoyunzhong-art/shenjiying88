"use strict";
/**
 * 🐜 扩展角色测试: inventory 模块
 *
 * 4 个附加角色视角：
 * 👔店长 — 检查库存状况
 * 🎮导玩员 — 查看游戏奖品库存
 * 🎯运行专员 — 执行库存盘点
 * 📢营销 — 检查促销库存可用性
 *
 * 每个角色 3 个测试用例（正常 + 业务异常 + 边界）
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
// ── 测试数据工厂 ──
const tenantCtx = {
    tenantId: 't-inv-ext',
    brandId: 'b-arcade',
    storeId: 's-main',
};
function createController() {
    (0, inventory_service_1.resetInventoryServiceTestState)();
    const service = new inventory_service_1.InventoryService();
    return new inventory_controller_1.InventoryController(service);
}
// ──────────────────────────────────────────────────────────────────────
// 👔店长 — 检查库存状况 (stock lookup, availability checks)
// ──────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('👔店长 — 库存检查视角', () => {
    (0, node_test_1.default)('成功查询多品类库存状况 (successful stock lookup)', () => {
        const ctrl = createController();
        ctrl.createProduct(tenantCtx, {
            name: '游戏币', sku: 'COIN-001', unit: '枚', price: 1, cost: 0.5,
            minStock: 500, maxStock: 10000, currentStock: 3500,
        });
        ctrl.createProduct(tenantCtx, {
            name: '饮料', sku: 'DR-001', unit: '瓶', price: 5, cost: 3,
            minStock: 20, maxStock: 500, currentStock: 200,
        });
        ctrl.createProduct(tenantCtx, {
            name: 'Switch 手柄', sku: 'SW-HL-001', unit: '个', price: 450, cost: 300,
            minStock: 5, maxStock: 50, currentStock: 12,
        });
        const products = ctrl.listProducts(tenantCtx, {});
        strict_1.default.equal(products.length, 3);
        const coins = products.find((p) => p.sku === 'COIN-001');
        strict_1.default.equal(coins.currentStock, 3500);
        strict_1.default.equal(coins.price, 1);
        const drinks = products.find((p) => p.sku === 'DR-001');
        strict_1.default.equal(drinks.currentStock, 200);
    });
    (0, node_test_1.default)('低库存预警 — 库存低于最小阈值 (insufficient stock rejection)', () => {
        const ctrl = createController();
        ctrl.createProduct(tenantCtx, {
            name: '限量扭蛋', sku: 'GACHA-LTD-001', unit: '个', price: 20, cost: 8,
            minStock: 10, maxStock: 100, currentStock: 25,
        });
        // 出库至低于 minStock 不应失败（只是预警）
        const { product: afterSale } = ctrl.stockOut(tenantCtx, {
            productId: ctrl.listProducts(tenantCtx, {}).find((p) => p.sku === 'GACHA-LTD-001').id,
            quantity: 20,
            reason: '销售出库',
        });
        strict_1.default.equal(afterSale.currentStock, 5);
        (0, strict_1.default)(afterSale.currentStock < afterSale.minStock, '库存应低于最小值以触发预警');
        // 店长查看低库存预警列表
        const alerts = ctrl.getLowStockProducts(tenantCtx, undefined);
        (0, strict_1.default)(alerts.length > 0);
        const alert = alerts.find((a) => a.product.sku === 'GACHA-LTD-001');
        (0, strict_1.default)(alert, '低库存商品应在预警中');
        strict_1.default.equal(alert.status, 'low');
    });
    (0, node_test_1.default)('无效商品 ID 查询返回错误 (invalid product ID)', () => {
        const ctrl = createController();
        // 创建正常商品
        ctrl.createProduct(tenantCtx, {
            name: '正常商品', sku: 'NORMAL-001', unit: '个', price: 10, cost: 5,
            minStock: 5, maxStock: 50, currentStock: 20,
        });
        // 查询不存在的商品 ID
        strict_1.default.throws(() => ctrl.getProduct('non-existent-id', tenantCtx), /Product non-existent-id not found/);
    });
});
// ──────────────────────────────────────────────────────────────────────
// 🎮导玩员 — 查看游戏奖品库存 (guide looking up game inventory)
// ──────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('🎮导玩员 — 奖品库存查询视角', () => {
    (0, node_test_1.default)('查询奖品商品详情与库存余量', () => {
        const ctrl = createController();
        const prize = ctrl.createProduct(tenantCtx, {
            name: '毛绒公仔大号', sku: 'PRIZE-BEAR-L', unit: '个', price: 0, cost: 35,
            minStock: 3, maxStock: 30, currentStock: 15,
            category: '奖品',
            barcode: '6923456789999',
        });
        const details = ctrl.getProduct(prize.id, tenantCtx);
        strict_1.default.equal(details.name, '毛绒公仔大号');
        strict_1.default.equal(details.currentStock, 15);
        strict_1.default.equal(details.category, '奖品');
        strict_1.default.equal(details.barcode, '6923456789999');
    });
    (0, node_test_1.default)('兑换奖品时库存不足拒绝出库', () => {
        const ctrl = createController();
        const prize = ctrl.createProduct(tenantCtx, {
            name: '稀有手办', sku: 'PRIZE-FIG-LTD', unit: '个', price: 0, cost: 80,
            minStock: 1, maxStock: 5, currentStock: 2,
            category: '奖品',
        });
        strict_1.default.throws(() => ctrl.stockOut(tenantCtx, {
            productId: prize.id,
            quantity: 10,
            reason: '积分兑换',
        }), /Insufficient stock/);
    });
    (0, node_test_1.default)('按分类筛选奖品库存列表', () => {
        const ctrl = createController();
        ctrl.createProduct(tenantCtx, {
            name: '公仔', sku: 'TOY-001', unit: '个', price: 0, cost: 20,
            minStock: 5, maxStock: 50, currentStock: 30, category: '奖品',
        });
        ctrl.createProduct(tenantCtx, {
            name: '手办', sku: 'FIG-001', unit: '个', price: 0, cost: 60,
            minStock: 2, maxStock: 20, currentStock: 5, category: '奖品',
        });
        ctrl.createProduct(tenantCtx, {
            name: '清洁用品', sku: 'CLEAN-001', unit: '瓶', price: 15, cost: 8,
            minStock: 5, maxStock: 30, currentStock: 10, category: '耗材',
        });
        const prizes = ctrl.listProducts(tenantCtx, { category: '奖品' });
        strict_1.default.equal(prizes.length, 2);
        (0, strict_1.default)(prizes.every((p) => p.price === 0), '奖品类商品价格应为 0');
    });
});
// ──────────────────────────────────────────────────────────────────────
// 🎯运行专员 — 执行库存盘点 (operations running inventory check)
// ──────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('🎯运行专员 — 库存盘点视角', () => {
    (0, node_test_1.default)('盘点调整 — 发现库存差异后精准修正', () => {
        const ctrl = createController();
        const p = ctrl.createProduct(tenantCtx, {
            name: '耳机', sku: 'AUDIO-001', unit: '副', price: 99, cost: 50,
            minStock: 5, maxStock: 50, currentStock: 30,
        });
        // 盘点发现实际库存 27（盘亏 3）
        const { product: adjusted } = ctrl.adjustStock(tenantCtx, {
            productId: p.id,
            newQuantity: 27,
            reason: '月度盘点差异调整',
        });
        strict_1.default.equal(adjusted.currentStock, 27);
    });
    (0, node_test_1.default)('盘点记录包含操作人和时间信息', () => {
        const ctrl = createController();
        const p = ctrl.createProduct(tenantCtx, {
            name: '鼠标垫', sku: 'MPAD-001', unit: '张', price: 20, cost: 8,
            minStock: 10, maxStock: 100, currentStock: 50,
        });
        ctrl.stockIn(tenantCtx, { productId: p.id, quantity: 20, reason: '补货', batchNo: 'BATCH-JUN-001' });
        ctrl.stockOut(tenantCtx, { productId: p.id, quantity: 5, reason: '员工领用' });
        ctrl.adjustStock(tenantCtx, { productId: p.id, newQuantity: 65, reason: '盘点' });
        const records = ctrl.getStockRecords(tenantCtx, { productId: p.id });
        strict_1.default.equal(records.length, 3);
        // 验证调整记录
        const adj = records.find((r) => r.type === 'adjustment');
        (0, strict_1.default)(adj, '应包含调整记录');
        (0, strict_1.default)(adj.createdAt, '调整记录应有时间戳');
    });
    (0, node_test_1.default)('跨门店盘点隔离 — 其他门店不可见本店库存', () => {
        const ctrl = createController();
        ctrl.createProduct(tenantCtx, {
            name: '本店商品', sku: 'STORE-OWN-001', unit: '个', price: 10, cost: 5,
            minStock: 5, maxStock: 50, currentStock: 20,
        });
        const otherCtx = { tenantId: 't-other-store', brandId: 'b-other', storeId: 's-other' };
        const otherProducts = ctrl.listProducts(otherCtx, {});
        strict_1.default.equal(otherProducts.length, 0, '其他门店不可见本店商品');
    });
});
// ──────────────────────────────────────────────────────────────────────
// 📢营销 — 检查促销库存可用性 (marketing checking promotion inventory)
// ──────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('📢营销 — 促销库存视角', () => {
    (0, node_test_1.default)('检查促销赠品库存是否充足', () => {
        const ctrl = createController();
        const gift = ctrl.createProduct(tenantCtx, {
            name: '限定徽章', sku: 'GIFT-BADGE-002', unit: '枚', price: 0, cost: 5,
            minStock: 20, maxStock: 500, currentStock: 400,
            category: '赠品',
        });
        // 检查当前库存是否足够支持活动
        (0, strict_1.default)(gift.currentStock >= 100, '促销赠品应至少 100 件');
        // 模拟活动消耗
        const { product: afterUsage } = ctrl.stockOut(tenantCtx, {
            productId: gift.id,
            quantity: 150,
            reason: '618 促销活动发放',
        });
        strict_1.default.equal(afterUsage.currentStock, 250);
    });
    (0, node_test_1.default)('促销商品库存不足时触发预警通知', () => {
        const ctrl = createController();
        const promo = ctrl.createProduct(tenantCtx, {
            name: '联名贴纸', sku: 'PROMO-STK-001', unit: '张', price: 0, cost: 1,
            minStock: 50, maxStock: 1000, currentStock: 60,
            category: '促销品',
        });
        // 使用 20 张，剩余 40，低于 minStock(50)
        const { product: afterUse } = ctrl.stockOut(tenantCtx, {
            productId: promo.id,
            quantity: 20,
            reason: '活动发放',
        });
        strict_1.default.equal(afterUse.currentStock, 40);
        (0, strict_1.default)(afterUse.currentStock < afterUse.minStock, '库存应低于阈值触发预警');
        const alerts = ctrl.getLowStockProducts(tenantCtx, undefined);
        const alert = alerts.find((a) => a.product.id === promo.id);
        (0, strict_1.default)(alert, '促销商品应在低库存预警中');
        strict_1.default.equal(alert.status, 'low');
    });
    (0, node_test_1.default)('按分类查询促销品库存预算', () => {
        const ctrl = createController();
        ctrl.createProduct(tenantCtx, {
            name: '定制水杯', sku: 'PROMO-CUP-001', unit: '个', price: 0, cost: 10,
            minStock: 10, maxStock: 200, currentStock: 100, category: '促销品',
        });
        ctrl.createProduct(tenantCtx, {
            name: '定制 T 恤', sku: 'PROMO-TEE-001', unit: '件', price: 0, cost: 20,
            minStock: 10, maxStock: 100, currentStock: 80, category: '促销品',
        });
        ctrl.createProduct(tenantCtx, {
            name: '街机主板', sku: 'HW-PCB-001', unit: '块', price: 1200, cost: 800,
            minStock: 1, maxStock: 10, currentStock: 3, category: '备件',
        });
        const promos = ctrl.listProducts(tenantCtx, { category: '促销品' });
        strict_1.default.equal(promos.length, 2);
        const totalBudget = promos.reduce((sum, p) => sum + p.currentStock * p.cost, 0);
        (0, strict_1.default)(totalBudget > 0, '促销品库存预算应大于 0');
    });
});
//# sourceMappingURL=inventory.role-extended.test.js.map