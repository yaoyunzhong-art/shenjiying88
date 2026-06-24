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
const health_dto_1 = require("./health.dto");
const health_entity_1 = require("./health.entity");
(0, node_test_1.describe)('health.dto: HealthQueryDto', () => {
    (0, node_test_1.default)('default properties are undefined', () => {
        const dto = new health_dto_1.HealthQueryDto();
        strict_1.default.equal(dto.verbose, undefined);
        strict_1.default.equal(dto.scope, undefined);
    });
    (0, node_test_1.default)('can set verbose=true', () => {
        const dto = new health_dto_1.HealthQueryDto();
        dto.verbose = true;
        strict_1.default.equal(dto.verbose, true);
    });
    (0, node_test_1.default)('can set verbose=false', () => {
        const dto = new health_dto_1.HealthQueryDto();
        dto.verbose = false;
        strict_1.default.equal(dto.verbose, false);
    });
    (0, node_test_1.default)('can set scope string', () => {
        const dto = new health_dto_1.HealthQueryDto();
        dto.scope = 'platform';
        strict_1.default.equal(dto.scope, 'platform');
    });
    (0, node_test_1.default)('can set both verbose and scope', () => {
        const dto = new health_dto_1.HealthQueryDto();
        dto.verbose = true;
        dto.scope = 'tenant';
        strict_1.default.equal(dto.verbose, true);
        strict_1.default.equal(dto.scope, 'tenant');
    });
    (0, node_test_1.default)('instanceof check', () => {
        const dto = new health_dto_1.HealthQueryDto();
        strict_1.default.ok(dto instanceof health_dto_1.HealthQueryDto);
    });
});
(0, node_test_1.describe)('health.dto: HealthResponseDto', () => {
    (0, node_test_1.default)('default properties are undefined', () => {
        const dto = new health_dto_1.HealthResponseDto();
        strict_1.default.equal(dto.status, undefined);
        strict_1.default.equal(dto.checkedAt, undefined);
        strict_1.default.equal(dto.version, undefined);
        strict_1.default.equal(dto.lytMode, undefined);
        strict_1.default.equal(dto.sampleMember, undefined);
    });
    (0, node_test_1.default)('can construct complete response', () => {
        const dto = new health_dto_1.HealthResponseDto();
        dto.status = health_entity_1.HealthStatus.Ok;
        dto.checkedAt = new Date().toISOString();
        dto.version = '1.0.0';
        strict_1.default.equal(dto.status, 'OK');
        strict_1.default.ok(dto.checkedAt);
        strict_1.default.ok(!isNaN(Date.parse(dto.checkedAt)));
        strict_1.default.equal(dto.version, '1.0.0');
    });
    (0, node_test_1.default)('accepts all valid status values', () => {
        const statuses = [health_entity_1.HealthStatus.Ok, health_entity_1.HealthStatus.Degraded, health_entity_1.HealthStatus.Unavailable];
        for (const status of statuses) {
            const dto = new health_dto_1.HealthResponseDto();
            dto.status = status;
            dto.checkedAt = new Date().toISOString();
            dto.version = '1.0.0';
            strict_1.default.equal(dto.status, status);
        }
    });
    (0, node_test_1.default)('accepts response with sampleMember', () => {
        const dto = new health_dto_1.HealthResponseDto();
        dto.status = health_entity_1.HealthStatus.Ok;
        dto.checkedAt = new Date().toISOString();
        dto.version = '1.0.0';
        dto.sampleMember = { memberId: 'm-001', name: 'test' };
        strict_1.default.deepEqual(dto.sampleMember, { memberId: 'm-001', name: 'test' });
    });
    (0, node_test_1.default)('accepts response with lytMode', () => {
        const dto = new health_dto_1.HealthResponseDto();
        dto.status = health_entity_1.HealthStatus.Ok;
        dto.checkedAt = new Date().toISOString();
        dto.version = '1.0.0';
        dto.lytMode = 'mock';
        strict_1.default.equal(dto.lytMode, 'mock');
    });
    (0, node_test_1.default)('instanceof check', () => {
        const dto = new health_dto_1.HealthResponseDto();
        strict_1.default.ok(dto instanceof health_dto_1.HealthResponseDto);
    });
});
//# sourceMappingURL=health.dto.test.js.map