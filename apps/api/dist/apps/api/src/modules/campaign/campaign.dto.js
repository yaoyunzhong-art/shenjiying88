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
exports.UpdateCampaignStatusDto = exports.RegisterCampaignDto = exports.CampaignActionDto = exports.CampaignConditionDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
require("reflect-metadata");
const campaign_entity_1 = require("./campaign.entity");
class CampaignConditionDto {
    type;
    value;
}
exports.CampaignConditionDto = CampaignConditionDto;
__decorate([
    (0, class_validator_1.IsEnum)(campaign_entity_1.CampaignConditionType),
    __metadata("design:type", String)
], CampaignConditionDto.prototype, "type", void 0);
class CampaignActionDto {
    kind;
    params;
}
exports.CampaignActionDto = CampaignActionDto;
__decorate([
    (0, class_validator_1.IsEnum)(campaign_entity_1.CampaignActionKind),
    __metadata("design:type", String)
], CampaignActionDto.prototype, "kind", void 0);
class RegisterCampaignDto {
    code;
    title;
    description;
    triggerEvent;
    conditions;
    actions;
    priority;
    scheduledStart;
    scheduledEnd;
}
exports.RegisterCampaignDto = RegisterCampaignDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterCampaignDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterCampaignDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterCampaignDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(campaign_entity_1.CampaignTrigger),
    __metadata("design:type", String)
], RegisterCampaignDto.prototype, "triggerEvent", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CampaignConditionDto),
    __metadata("design:type", Array)
], RegisterCampaignDto.prototype, "conditions", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CampaignActionDto),
    __metadata("design:type", Array)
], RegisterCampaignDto.prototype, "actions", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], RegisterCampaignDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsISO8601)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterCampaignDto.prototype, "scheduledStart", void 0);
__decorate([
    (0, class_validator_1.IsISO8601)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterCampaignDto.prototype, "scheduledEnd", void 0);
class UpdateCampaignStatusDto {
    status;
}
exports.UpdateCampaignStatusDto = UpdateCampaignStatusDto;
__decorate([
    (0, class_validator_1.IsEnum)(campaign_entity_1.CampaignStatus),
    __metadata("design:type", String)
], UpdateCampaignStatusDto.prototype, "status", void 0);
//# sourceMappingURL=campaign.dto.js.map