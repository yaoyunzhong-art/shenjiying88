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
const bootstrap_dto_1 = require("./bootstrap.dto");
(0, node_test_1.describe)('BootstrapHealthQueryDto', () => {
    (0, node_test_1.default)('verbose defaults to undefined', () => {
        const dto = new bootstrap_dto_1.BootstrapHealthQueryDto();
        strict_1.default.equal(dto.verbose, undefined);
    });
    (0, node_test_1.default)('accepts verbose=true', () => {
        const dto = new bootstrap_dto_1.BootstrapHealthQueryDto();
        dto.verbose = true;
        strict_1.default.equal(dto.verbose, true);
    });
    (0, node_test_1.default)('accepts verbose=false', () => {
        const dto = new bootstrap_dto_1.BootstrapHealthQueryDto();
        dto.verbose = false;
        strict_1.default.equal(dto.verbose, false);
    });
});
(0, node_test_1.describe)('BootstrapMetadataQueryDto', () => {
    (0, node_test_1.default)('moduleKey defaults to undefined', () => {
        const dto = new bootstrap_dto_1.BootstrapMetadataQueryDto();
        strict_1.default.equal(dto.moduleKey, undefined);
    });
    (0, node_test_1.default)('accepts moduleKey filter', () => {
        const dto = new bootstrap_dto_1.BootstrapMetadataQueryDto();
        dto.moduleKey = 'foundation';
        strict_1.default.equal(dto.moduleKey, 'foundation');
    });
    (0, node_test_1.default)('includeContracts defaults to undefined', () => {
        const dto = new bootstrap_dto_1.BootstrapMetadataQueryDto();
        strict_1.default.equal(dto.includeContracts, undefined);
    });
    (0, node_test_1.default)('accepts includeContracts=true', () => {
        const dto = new bootstrap_dto_1.BootstrapMetadataQueryDto();
        dto.includeContracts = true;
        strict_1.default.equal(dto.includeContracts, true);
    });
});
(0, node_test_1.describe)('BootstrapHealthResponseDto', () => {
    (0, node_test_1.default)('constructs valid response', () => {
        const dto = new bootstrap_dto_1.BootstrapHealthResponseDto();
        dto.status = 'ok';
        dto.uptime = 123.45;
        dto.phase = 'scaffold';
        dto.checkedAt = '2026-01-15T00:00:00.000Z';
        strict_1.default.equal(dto.status, 'ok');
        strict_1.default.equal(dto.uptime, 123.45);
        strict_1.default.equal(dto.phase, 'scaffold');
        strict_1.default.equal(dto.checkedAt, '2026-01-15T00:00:00.000Z');
    });
    (0, node_test_1.default)('accepts degraded status', () => {
        const dto = new bootstrap_dto_1.BootstrapHealthResponseDto();
        dto.status = 'degraded';
        dto.uptime = 0;
        dto.phase = 'scaffold';
        dto.checkedAt = new Date().toISOString();
        strict_1.default.equal(dto.status, 'degraded');
    });
});
(0, node_test_1.describe)('BootstrapMetadataResponseDto', () => {
    (0, node_test_1.default)('constructs valid metadata response', () => {
        const dto = new bootstrap_dto_1.BootstrapMetadataResponseDto();
        dto.tenantContext = { tenantId: 't-1', brandId: 'b-1' };
        dto.foundationDependencies = ['foundation'];
        dto.foundationContracts = ['test-contract'];
        dto.phase = 'scaffold';
        dto.generatedAt = '2026-01-15T00:00:00.000Z';
        strict_1.default.deepStrictEqual(dto.tenantContext, { tenantId: 't-1', brandId: 'b-1' });
        strict_1.default.deepStrictEqual(dto.foundationDependencies, ['foundation']);
        strict_1.default.deepStrictEqual(dto.foundationContracts, ['test-contract']);
        strict_1.default.equal(dto.phase, 'scaffold');
        strict_1.default.equal(dto.generatedAt, '2026-01-15T00:00:00.000Z');
    });
    (0, node_test_1.default)('accepts empty dependencies', () => {
        const dto = new bootstrap_dto_1.BootstrapMetadataResponseDto();
        dto.tenantContext = {};
        dto.foundationDependencies = [];
        dto.foundationContracts = [];
        dto.phase = 'ready';
        dto.generatedAt = new Date().toISOString();
        strict_1.default.deepStrictEqual(dto.foundationDependencies, []);
        strict_1.default.deepStrictEqual(dto.foundationContracts, []);
        strict_1.default.equal(dto.phase, 'ready');
    });
});
//# sourceMappingURL=bootstrap.dto.test.js.map