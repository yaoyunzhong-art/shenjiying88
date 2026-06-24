"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const loyalty_dto_1 = require("./loyalty.dto");
(0, node_test_1.describe)('Loyalty DTOs', () => {
    (0, node_test_1.describe)('PointsLedgerQueryDto', () => {
        (0, node_test_1.it)('should accept empty query (all optional)', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(loyalty_dto_1.PointsLedgerQueryDto, {});
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
        (0, node_test_1.it)('should accept query with orderId', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(loyalty_dto_1.PointsLedgerQueryDto, {
                orderId: 'order-001'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
        (0, node_test_1.it)('should accept query with memberId', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(loyalty_dto_1.PointsLedgerQueryDto, {
                memberId: 'mem-001'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
        (0, node_test_1.it)('should accept query with both fields', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(loyalty_dto_1.PointsLedgerQueryDto, {
                orderId: 'order-001',
                memberId: 'mem-001'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
    });
    (0, node_test_1.describe)('CouponRedemptionQueryDto', () => {
        (0, node_test_1.it)('should accept empty query', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(loyalty_dto_1.CouponRedemptionQueryDto, {});
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
        (0, node_test_1.it)('should accept query with couponCode', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(loyalty_dto_1.CouponRedemptionQueryDto, {
                couponCode: 'WELCOME2024'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
        (0, node_test_1.it)('should accept query with all fields', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(loyalty_dto_1.CouponRedemptionQueryDto, {
                orderId: 'order-001',
                memberId: 'mem-001',
                couponCode: 'WELCOME2024'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
    });
    (0, node_test_1.describe)('BlindboxFulfillmentQueryDto', () => {
        (0, node_test_1.it)('should accept empty query', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(loyalty_dto_1.BlindboxFulfillmentQueryDto, {});
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
        (0, node_test_1.it)('should accept query with blindboxPlanId', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(loyalty_dto_1.BlindboxFulfillmentQueryDto, {
                blindboxPlanId: 'plan-golden'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
        (0, node_test_1.it)('should accept query with all fields', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(loyalty_dto_1.BlindboxFulfillmentQueryDto, {
                orderId: 'order-001',
                memberId: 'mem-001',
                blindboxPlanId: 'plan-golden'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
    });
    (0, node_test_1.describe)('SettlementQueryDto', () => {
        (0, node_test_1.it)('should accept empty query', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(loyalty_dto_1.SettlementQueryDto, {});
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
        (0, node_test_1.it)('should accept query with memberId', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(loyalty_dto_1.SettlementQueryDto, {
                memberId: 'mem-001'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            node_assert_1.default.strictEqual(errors.length, 0);
        });
    });
});
//# sourceMappingURL=loyalty.dto.test.js.map