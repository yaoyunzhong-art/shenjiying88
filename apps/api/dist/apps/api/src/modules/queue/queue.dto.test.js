"use strict";
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
const queue_dto_1 = require("./queue.dto");
const queue_entity_1 = require("./queue.entity");
async function validateDto(cls, payload) {
    const instance = (0, class_transformer_1.plainToInstance)(cls, payload);
    const errors = await (0, class_validator_1.validate)(instance);
    return errors;
}
(0, node_test_1.describe)('queue.dto: JoinQueueDto', () => {
    (0, node_test_1.default)('accepts valid join payload', async () => {
        const errors = await validateDto(queue_dto_1.JoinQueueDto, {
            queueType: queue_entity_1.QueueType.Waiting,
            memberId: 'member-1',
            memberName: 'Alice',
            resourceId: 'r-1'
        });
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('rejects missing queueType', async () => {
        const errors = await validateDto(queue_dto_1.JoinQueueDto, { memberId: 'm1' });
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some((e) => e.property === 'queueType'));
    });
    (0, node_test_1.default)('rejects invalid queueType value', async () => {
        const errors = await validateDto(queue_dto_1.JoinQueueDto, { queueType: 'INVALID', memberId: 'm1' });
        strict_1.default.ok(errors.length > 0);
    });
    (0, node_test_1.default)('rejects empty memberId', async () => {
        const errors = await validateDto(queue_dto_1.JoinQueueDto, { queueType: queue_entity_1.QueueType.Waiting, memberId: '' });
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some((e) => e.property === 'memberId'));
    });
    (0, node_test_1.default)('accepts optional priority=0', async () => {
        const errors = await validateDto(queue_dto_1.JoinQueueDto, {
            queueType: queue_entity_1.QueueType.Booking,
            memberId: 'm',
            priority: 0
        });
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('rejects negative priority', async () => {
        const errors = await validateDto(queue_dto_1.JoinQueueDto, {
            queueType: queue_entity_1.QueueType.Waiting,
            memberId: 'm',
            priority: -1
        });
        strict_1.default.ok(errors.length > 0);
    });
    (0, node_test_1.default)('rejects priority > 100', async () => {
        const errors = await validateDto(queue_dto_1.JoinQueueDto, {
            queueType: queue_entity_1.QueueType.Waiting,
            memberId: 'm',
            priority: 101
        });
        strict_1.default.ok(errors.length > 0);
    });
});
(0, node_test_1.describe)('queue.dto: QueueQueryDto', () => {
    (0, node_test_1.default)('accepts empty query (all optional)', async () => {
        const errors = await validateDto(queue_dto_1.QueueQueryDto, {});
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('accepts full filter payload', async () => {
        const errors = await validateDto(queue_dto_1.QueueQueryDto, {
            type: queue_entity_1.QueueType.Booking,
            status: queue_entity_1.QueueStatus.Waiting,
            resourceId: 'r-1',
            memberId: 'm-1',
            userId: 'u-1',
            queueNumber: 'A001',
            pageSize: 20,
            page: 0,
            sortBy: 'createdAt',
            sortOrder: 'asc'
        });
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('accepts memberId filter', async () => {
        const errors = await validateDto(queue_dto_1.QueueQueryDto, { memberId: 'm-1' });
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('rejects invalid status', async () => {
        const errors = await validateDto(queue_dto_1.QueueQueryDto, { status: 'INVALID' });
        strict_1.default.ok(errors.length > 0);
    });
    (0, node_test_1.default)('rejects pageSize > 100', async () => {
        const errors = await validateDto(queue_dto_1.QueueQueryDto, { pageSize: 200 });
        strict_1.default.ok(errors.length > 0);
    });
    (0, node_test_1.default)('rejects negative pageSize', async () => {
        const errors = await validateDto(queue_dto_1.QueueQueryDto, { pageSize: 0 });
        strict_1.default.ok(errors.length > 0);
    });
    (0, node_test_1.default)('rejects negative page', async () => {
        const errors = await validateDto(queue_dto_1.QueueQueryDto, { page: -1 });
        strict_1.default.ok(errors.length > 0);
    });
    (0, node_test_1.default)('rejects invalid sortOrder', async () => {
        const errors = await validateDto(queue_dto_1.QueueQueryDto, { sortOrder: 'invalid' });
        strict_1.default.ok(errors.length > 0);
    });
});
(0, node_test_1.describe)('queue.dto: CallNextDto', () => {
    (0, node_test_1.default)('accepts valid call-next payload', async () => {
        const errors = await validateDto(queue_dto_1.CallNextDto, { resourceId: 'r-1' });
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('rejects missing resourceId', async () => {
        const errors = await validateDto(queue_dto_1.CallNextDto, {});
        strict_1.default.ok(errors.length > 0);
    });
});
(0, node_test_1.describe)('queue.dto: CreateQueueDto (back-compat)', () => {
    (0, node_test_1.default)('accepts valid create payload', async () => {
        const errors = await validateDto(queue_dto_1.CreateQueueDto, {
            type: queue_entity_1.QueueType.Waiting,
            userId: 'u-1',
            userName: 'Alice',
            partySize: 2
        });
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('rejects missing userName', async () => {
        const errors = await validateDto(queue_dto_1.CreateQueueDto, {
            type: queue_entity_1.QueueType.Waiting,
            userId: 'u-1',
            partySize: 2
        });
        strict_1.default.ok(errors.length > 0);
    });
    (0, node_test_1.default)('rejects partySize > 99', async () => {
        const errors = await validateDto(queue_dto_1.CreateQueueDto, {
            type: queue_entity_1.QueueType.Waiting,
            userId: 'u-1',
            userName: 'u',
            partySize: 100
        });
        strict_1.default.ok(errors.length > 0);
    });
    (0, node_test_1.default)('rejects partySize < 1', async () => {
        const errors = await validateDto(queue_dto_1.CreateQueueDto, {
            type: queue_entity_1.QueueType.Waiting,
            userId: 'u-1',
            userName: 'u',
            partySize: 0
        });
        strict_1.default.ok(errors.length > 0);
    });
});
(0, node_test_1.describe)('queue.dto: UpdateQueueDto', () => {
    (0, node_test_1.default)('accepts empty update (all optional)', async () => {
        const errors = await validateDto(queue_dto_1.UpdateQueueDto, {});
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('accepts partial update', async () => {
        const errors = await validateDto(queue_dto_1.UpdateQueueDto, { partySize: 4 });
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('rejects partySize out of range', async () => {
        const errors = await validateDto(queue_dto_1.UpdateQueueDto, { partySize: 200 });
        strict_1.default.ok(errors.length > 0);
    });
});
//# sourceMappingURL=queue.dto.test.js.map