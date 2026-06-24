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
const ai_diagnosis_dto_1 = require("./ai-diagnosis.dto");
(0, node_test_1.describe)('AiDiagnosis DTO', () => {
    (0, node_test_1.describe)('CreateDiagnosisDto', () => {
        (0, node_test_1.default)('should accept valid input', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_diagnosis_dto_1.CreateDiagnosisDto, {
                engineId: 'engine-001',
                scenarioId: 'scenario-001',
                tenantId: 'T001',
                requestedBy: 'user-001',
                promptSummary: 'Test diagnosis'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.equal(errors.length, 0);
        });
        (0, node_test_1.default)('should reject empty engineId', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_diagnosis_dto_1.CreateDiagnosisDto, {
                engineId: '',
                scenarioId: 'scenario-001',
                tenantId: 'T001',
                requestedBy: 'user-001'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.ok(errors.length > 0);
            strict_1.default.ok(errors.some((e) => e.property === 'engineId'));
        });
        (0, node_test_1.default)('should reject missing required fields', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_diagnosis_dto_1.CreateDiagnosisDto, {});
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.ok(errors.length >= 4);
        });
        (0, node_test_1.default)('should accept optional promptSummary and inputSnapshot', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_diagnosis_dto_1.CreateDiagnosisDto, {
                engineId: 'engine-001',
                scenarioId: 'scenario-001',
                tenantId: 'T001',
                requestedBy: 'user-001'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.equal(errors.length, 0);
        });
    });
    (0, node_test_1.describe)('CreateDiagnosisBatchDto', () => {
        (0, node_test_1.default)('should accept valid batch input', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_diagnosis_dto_1.CreateDiagnosisBatchDto, {
                engineId: 'engine-001',
                scenarioIds: ['s1', 's2', 's3'],
                tenantId: 'T001',
                triggeredBy: 'user-001'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.equal(errors.length, 0);
        });
        (0, node_test_1.default)('should reject empty scenarioIds', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_diagnosis_dto_1.CreateDiagnosisBatchDto, {
                engineId: 'engine-001',
                scenarioIds: [],
                tenantId: 'T001',
                triggeredBy: 'user-001'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            // empty array is valid at DTO level, service handles logic
            strict_1.default.equal(errors.length, 0);
        });
        (0, node_test_1.default)('should reject missing engineId', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_diagnosis_dto_1.CreateDiagnosisBatchDto, {
                scenarioIds: ['s1'],
                tenantId: 'T001',
                triggeredBy: 'user-001'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.ok(errors.some((e) => e.property === 'engineId'));
        });
    });
    (0, node_test_1.describe)('UpdateDiagnosisDto', () => {
        (0, node_test_1.default)('should accept valid status update', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_diagnosis_dto_1.UpdateDiagnosisDto, {
                status: 'COMPLETED',
                riskLevel: 'high',
                recommendation: 'All clear'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.equal(errors.length, 0);
        });
        (0, node_test_1.default)('should reject invalid status', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_diagnosis_dto_1.UpdateDiagnosisDto, {
                status: 'INVALID_STATUS'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.ok(errors.length > 0);
            strict_1.default.ok(errors.some((e) => e.property === 'status'));
        });
        (0, node_test_1.default)('should reject invalid risk level', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_diagnosis_dto_1.UpdateDiagnosisDto, {
                riskLevel: 'extreme'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.ok(errors.length > 0);
            strict_1.default.ok(errors.some((e) => e.property === 'riskLevel'));
        });
        (0, node_test_1.default)('should accept all valid risk levels', async () => {
            for (const level of ['low', 'medium', 'high', 'critical']) {
                const dto = (0, class_transformer_1.plainToInstance)(ai_diagnosis_dto_1.UpdateDiagnosisDto, { riskLevel: level });
                const errors = await (0, class_validator_1.validate)(dto);
                strict_1.default.equal(errors.length, 0, `riskLevel ${level} should be valid`);
            }
        });
        (0, node_test_1.default)('should accept empty update (all optional)', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_diagnosis_dto_1.UpdateDiagnosisDto, {});
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.equal(errors.length, 0);
        });
    });
    (0, node_test_1.describe)('DiagnosisQueryDto', () => {
        (0, node_test_1.default)('should accept all filters', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_diagnosis_dto_1.DiagnosisQueryDto, {
                engineId: 'engine-001',
                status: 'COMPLETED',
                riskLevel: 'high',
                tenantId: 'T001'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.equal(errors.length, 0);
        });
        (0, node_test_1.default)('should reject invalid status filter', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_diagnosis_dto_1.DiagnosisQueryDto, {
                status: 'INVALID'
            });
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.ok(errors.length > 0);
            strict_1.default.ok(errors.some((e) => e.property === 'status'));
        });
        (0, node_test_1.default)('should accept empty query (all optional)', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(ai_diagnosis_dto_1.DiagnosisQueryDto, {});
            const errors = await (0, class_validator_1.validate)(dto);
            strict_1.default.equal(errors.length, 0);
        });
    });
});
//# sourceMappingURL=ai-diagnosis.dto.test.js.map