"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReplayRuntimeGovernanceActionDto = exports.RecordRuntimeGovernanceCallbackDto = exports.SyncRuntimeGovernanceActionDto = exports.SubmitRuntimeGovernanceActionDto = void 0;
const class_validator_1 = require("class-validator");
const types_1 = require("@m5/types");
class SubmitRuntimeGovernanceActionDto {
    app;
    action;
    nextStep;
    riskLevel;
    requestEndpoint;
    payload;
    payloadSummary;
    recommendedAction;
    handlerName;
    idempotencyKey;
    actorId;
}
exports.SubmitRuntimeGovernanceActionDto = SubmitRuntimeGovernanceActionDto;
__decorate([
    (0, class_validator_1.IsIn)(types_1.runtimeGovernanceClientApps),
    __metadata("design:type", String)
], SubmitRuntimeGovernanceActionDto.prototype, "app", void 0);
__decorate([
    (0, class_validator_1.IsIn)(types_1.runtimeGovernanceApiActionKeys),
    __metadata("design:type", String)
], SubmitRuntimeGovernanceActionDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsIn)(types_1.runtimeGovernanceNextSteps),
    __metadata("design:type", String)
], SubmitRuntimeGovernanceActionDto.prototype, "nextStep", void 0);
__decorate([
    (0, class_validator_1.IsIn)(types_1.runtimeGovernanceRiskLevels),
    __metadata("design:type", String)
], SubmitRuntimeGovernanceActionDto.prototype, "riskLevel", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitRuntimeGovernanceActionDto.prototype, "requestEndpoint", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SubmitRuntimeGovernanceActionDto.prototype, "payload", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitRuntimeGovernanceActionDto.prototype, "payloadSummary", void 0);
__decorate([
    (0, class_validator_1.IsIn)(types_1.runtimeGovernanceRecommendedActions),
    __metadata("design:type", String)
], SubmitRuntimeGovernanceActionDto.prototype, "recommendedAction", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitRuntimeGovernanceActionDto.prototype, "handlerName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitRuntimeGovernanceActionDto.prototype, "idempotencyKey", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitRuntimeGovernanceActionDto.prototype, "actorId", void 0);
class SyncRuntimeGovernanceActionDto {
    handlerName;
    ticketCode;
    idempotencyKey;
}
exports.SyncRuntimeGovernanceActionDto = SyncRuntimeGovernanceActionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SyncRuntimeGovernanceActionDto.prototype, "handlerName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SyncRuntimeGovernanceActionDto.prototype, "ticketCode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SyncRuntimeGovernanceActionDto.prototype, "idempotencyKey", void 0);
class RecordRuntimeGovernanceCallbackDto {
    callbackStatus;
    ackToken;
    lastEvent;
    summary;
    idempotencyKey;
}
exports.RecordRuntimeGovernanceCallbackDto = RecordRuntimeGovernanceCallbackDto;
__decorate([
    (0, class_validator_1.IsIn)(types_1.runtimeGovernanceCallbackStatuses),
    __metadata("design:type", String)
], RecordRuntimeGovernanceCallbackDto.prototype, "callbackStatus", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecordRuntimeGovernanceCallbackDto.prototype, "ackToken", void 0);
__decorate([
    (0, class_validator_1.IsIn)(types_1.runtimeGovernanceCallbackEvents),
    __metadata("design:type", String)
], RecordRuntimeGovernanceCallbackDto.prototype, "lastEvent", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecordRuntimeGovernanceCallbackDto.prototype, "summary", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecordRuntimeGovernanceCallbackDto.prototype, "idempotencyKey", void 0);
class ReplayRuntimeGovernanceActionDto {
    ledgerKey;
    requestedFrom;
    ticketCode;
    idempotencyKey;
}
exports.ReplayRuntimeGovernanceActionDto = ReplayRuntimeGovernanceActionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReplayRuntimeGovernanceActionDto.prototype, "ledgerKey", void 0);
__decorate([
    (0, class_validator_1.IsIn)(types_1.runtimeGovernanceReplaySources),
    __metadata("design:type", String)
], ReplayRuntimeGovernanceActionDto.prototype, "requestedFrom", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReplayRuntimeGovernanceActionDto.prototype, "ticketCode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReplayRuntimeGovernanceActionDto.prototype, "idempotencyKey", void 0);
//# sourceMappingURL=runtime-governance.dto.js.map