"use strict";
/**
 * 🐜 自动: [svip] [A] dto.test.ts 补全
 *
 * 覆盖: SvipTierDto / CreateSvipMemberDto / SvipBenefitDto
 *       SvipUpgradeDto / UseSvipBenefitDto / SvipMemberQueryDto / SvipTierQueryDto
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
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const svip_dto_1 = require("./svip.dto");
// ================================================================
// SvipTierDto
// ================================================================
(0, node_test_1.describe)('SvipTierDto', () => {
    (0, node_test_1.default)('有效输入应通过', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.SvipTierDto, {
            name: '金卡会员',
            level: 2,
            minSpendAmount: 10000,
            minPoints: 2000,
            benefits: ['discount_90', 'priority_queue']
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('缺失必填字段应报错', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.SvipTierDto, {});
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length >= 4);
        const props = errors.map((e) => e.property);
        strict_1.default.ok(props.includes('name'));
        strict_1.default.ok(props.includes('level'));
        strict_1.default.ok(props.includes('minSpendAmount'));
        strict_1.default.ok(props.includes('minPoints'));
    });
    (0, node_test_1.default)('level 超出范围(1-5)应报错', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.SvipTierDto, {
            name: '无效等级',
            level: 10,
            minSpendAmount: 5000,
            minPoints: 500,
            benefits: []
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.some((e) => e.property === 'level'));
    });
    (0, node_test_1.default)('level 小于 1 应报错', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.SvipTierDto, {
            name: '负等级',
            level: 0,
            minSpendAmount: 100,
            minPoints: 10,
            benefits: []
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.some((e) => e.property === 'level'));
    });
    (0, node_test_1.default)('负的金额应报错', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.SvipTierDto, {
            name: '负金额',
            level: 1,
            minSpendAmount: -100,
            minPoints: 500,
            benefits: []
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.some((e) => e.property === 'minSpendAmount'));
    });
    (0, node_test_1.default)('负的积分应报错', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.SvipTierDto, {
            name: '负积分',
            level: 1,
            minSpendAmount: 1000,
            minPoints: -10,
            benefits: []
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.some((e) => e.property === 'minPoints'));
    });
    (0, node_test_1.default)('id 和 icon 和 color 为可选', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.SvipTierDto, {
            name: '测试',
            level: 3,
            minSpendAmount: 30000,
            minPoints: 6000,
            benefits: ['discount_88'],
            icon: 'vip-icon',
            color: '#888888'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('benefits 应为字符串数组', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.SvipTierDto, {
            name: '测试',
            level: 1,
            minSpendAmount: 5000,
            minPoints: 500,
            benefits: 'not-an-array'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.some((e) => e.property === 'benefits'));
    });
});
// ================================================================
// CreateSvipMemberDto
// ================================================================
(0, node_test_1.describe)('CreateSvipMemberDto', () => {
    (0, node_test_1.default)('有效输入应通过', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.CreateSvipMemberDto, {
            memberId: 'mem-001',
            tierId: 'tier-001',
            totalSpend: 6000,
            currentPoints: 600,
            expiresAt: '2025-06-01T00:00:00Z'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('缺失必填字段应报错', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.CreateSvipMemberDto, {});
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length >= 3);
        const props = errors.map((e) => e.property);
        strict_1.default.ok(props.includes('memberId'));
        strict_1.default.ok(props.includes('tierId'));
    });
    (0, node_test_1.default)('无效日期格式应报错', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.CreateSvipMemberDto, {
            memberId: 'mem-002',
            tierId: 'tier-001',
            totalSpend: 5000,
            currentPoints: 500,
            expiresAt: 'not-a-date'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.some((e) => e.property === 'expiresAt'));
    });
    (0, node_test_1.default)('负消费应报错', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.CreateSvipMemberDto, {
            memberId: 'mem-003',
            tierId: 'tier-001',
            totalSpend: -100,
            currentPoints: 500,
            expiresAt: '2025-06-01T00:00:00Z'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.some((e) => e.property === 'totalSpend'));
    });
    (0, node_test_1.default)('brandId 和 storeId 为可选', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.CreateSvipMemberDto, {
            memberId: 'mem-004',
            tierId: 'tier-001',
            totalSpend: 5000,
            currentPoints: 500,
            expiresAt: '2025-06-01T00:00:00Z',
            brandId: 'brand-1',
            storeId: 'store-1',
            autoRenew: true
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('joinedAt 可选', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.CreateSvipMemberDto, {
            memberId: 'mem-005',
            tierId: 'tier-001',
            totalSpend: 5000,
            currentPoints: 500,
            expiresAt: '2025-06-01T00:00:00Z',
            joinedAt: '2024-01-01T00:00:00Z'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
});
// ================================================================
// SvipBenefitDto
// ================================================================
(0, node_test_1.describe)('SvipBenefitDto', () => {
    (0, node_test_1.default)('有效输入应通过', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.SvipBenefitDto, {
            tierId: 'tier-001',
            benefitType: 'discount',
            benefitValue: '95%',
            description: '95折优惠'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('缺失必填字段应报错', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.SvipBenefitDto, {});
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length >= 3);
    });
    (0, node_test_1.default)('无效 benefitType 应报错', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.SvipBenefitDto, {
            tierId: 'tier-001',
            benefitType: 'invalid_type',
            benefitValue: '95%',
            description: 'test'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.some((e) => e.property === 'benefitType'));
    });
    (0, node_test_1.default)('所有有效 benefitType 应通过', async () => {
        const types = ['discount', 'freeUpgrade', 'priorityQueue', 'vipRoom', 'exclusiveEvent'];
        for (const bt of types) {
            const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.SvipBenefitDto, {
                tierId: 'tier-001',
                benefitType: bt,
                benefitValue: 'test',
                description: 'test'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.equal(errors.length, 0, `benefitType ${bt} 应有效`);
        }
    });
    (0, node_test_1.default)('id 和 isActive 为可选', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.SvipBenefitDto, {
            tierId: 'tier-001',
            benefitType: 'discount',
            benefitValue: '90%',
            description: '9折',
            isActive: false
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
});
// ================================================================
// SvipUpgradeDto
// ================================================================
(0, node_test_1.describe)('SvipUpgradeDto', () => {
    (0, node_test_1.default)('有效输入应通过 (TargetTierLevel)', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.SvipUpgradeDto, {
            memberId: 'mem-001',
            targetTierLevel: 3,
            reason: '消费达标'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('缺失 memberId 应报错', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.SvipUpgradeDto, { targetTierLevel: 2 });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.some((e) => e.property === 'memberId'));
    });
    (0, node_test_1.default)('targetTierLevel 超出范围应报错', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.SvipUpgradeDto, {
            memberId: 'mem-001',
            targetTierLevel: 10
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.some((e) => e.property === 'targetTierLevel'));
    });
    (0, node_test_1.default)('targetTierLevel 小于 1 应报错', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.SvipUpgradeDto, {
            memberId: 'mem-001',
            targetTierLevel: 0
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.some((e) => e.property === 'targetTierLevel'));
    });
    (0, node_test_1.default)('所有可选字段不提供应通过', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.SvipUpgradeDto, { memberId: 'mem-001' });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('totalSpend 和 currentPoints 可选', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.SvipUpgradeDto, {
            memberId: 'mem-001',
            totalSpend: 30000,
            currentPoints: 6000
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('负的 totalSpend 应报错', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.SvipUpgradeDto, {
            memberId: 'mem-001',
            totalSpend: -100
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.some((e) => e.property === 'totalSpend'));
    });
});
// ================================================================
// UseSvipBenefitDto
// ================================================================
(0, node_test_1.describe)('UseSvipBenefitDto', () => {
    (0, node_test_1.default)('有效输入应通过', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.UseSvipBenefitDto, {
            memberId: 'mem-001',
            benefitType: 'discount'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('缺失 memberId 应报错', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.UseSvipBenefitDto, { benefitType: 'discount' });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.some((e) => e.property === 'memberId'));
    });
    (0, node_test_1.default)('缺失 benefitType 应报错', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.UseSvipBenefitDto, { memberId: 'mem-001' });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.some((e) => e.property === 'benefitType'));
    });
    (0, node_test_1.default)('无效 benefitType 应报错', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.UseSvipBenefitDto, {
            memberId: 'mem-001',
            benefitType: 'not_valid'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.some((e) => e.property === 'benefitType'));
    });
    (0, node_test_1.default)('referenceOrderId 和 referencePaymentId 可选', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.UseSvipBenefitDto, {
            memberId: 'mem-001',
            benefitType: 'discount',
            referenceOrderId: 'order-001'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
});
// ================================================================
// SvipMemberQueryDto
// ================================================================
(0, node_test_1.describe)('SvipMemberQueryDto', () => {
    (0, node_test_1.default)('所有字段为空应通过', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.SvipMemberQueryDto, {});
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('有效 status 应通过', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.SvipMemberQueryDto, { status: 'active' });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('无效 status 应报错', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.SvipMemberQueryDto, { status: 'invalid_status' });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.some((e) => e.property === 'status'));
    });
    (0, node_test_1.default)('有效 tierLevel 应通过', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.SvipMemberQueryDto, { tierLevel: 3 });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('tierLevel 超出范围应报错', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.SvipMemberQueryDto, { tierLevel: 10 });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.some((e) => e.property === 'tierLevel'));
    });
    (0, node_test_1.default)('tierLevel 小于 1 应报错', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.SvipMemberQueryDto, { tierLevel: 0 });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.some((e) => e.property === 'tierLevel'));
    });
    (0, node_test_1.default)('所有有效 status 枚举值应通过', async () => {
        for (const status of ['active', 'expired', 'frozen']) {
            const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.SvipMemberQueryDto, { status });
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.equal(errors.length, 0, `status ${status} 应有效`);
        }
    });
});
// ================================================================
// SvipTierQueryDto
// ================================================================
(0, node_test_1.describe)('SvipTierQueryDto', () => {
    (0, node_test_1.default)('空查询应通过', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.SvipTierQueryDto, {});
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('有效 level 应通过', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.SvipTierQueryDto, { level: 2 });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('level 小于 1 应报错', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.SvipTierQueryDto, { level: 0 });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.some((e) => e.property === 'level'));
    });
    (0, node_test_1.default)('level 大于 5 应报错', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(svip_dto_1.SvipTierQueryDto, { level: 6 });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.some((e) => e.property === 'level'));
    });
});
//# sourceMappingURL=svip.dto.test.js.map