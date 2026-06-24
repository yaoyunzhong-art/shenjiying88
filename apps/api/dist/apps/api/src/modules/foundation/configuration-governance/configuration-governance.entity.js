"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigLayer = exports.SecretProviderKind = exports.SecretKind = exports.FeatureFlagState = exports.ConfigEntryStatus = void 0;
/**
 * 配置条目状态
 */
var ConfigEntryStatus;
(function (ConfigEntryStatus) {
    ConfigEntryStatus["ACTIVE"] = "ACTIVE";
    ConfigEntryStatus["DRAFT"] = "DRAFT";
    ConfigEntryStatus["ARCHIVED"] = "ARCHIVED";
})(ConfigEntryStatus || (exports.ConfigEntryStatus = ConfigEntryStatus = {}));
/**
 * Feature Flag 状态
 */
var FeatureFlagState;
(function (FeatureFlagState) {
    FeatureFlagState["DRAFT"] = "DRAFT";
    FeatureFlagState["ACTIVE"] = "ACTIVE";
    FeatureFlagState["PAUSED"] = "PAUSED";
    FeatureFlagState["ARCHIVED"] = "ARCHIVED";
})(FeatureFlagState || (exports.FeatureFlagState = FeatureFlagState = {}));
/**
 * 秘密凭证类型
 */
var SecretKind;
(function (SecretKind) {
    SecretKind["ApiKey"] = "api-key";
    SecretKind["WebhookSigning"] = "webhook-signing";
    SecretKind["Certificate"] = "certificate";
})(SecretKind || (exports.SecretKind = SecretKind = {}));
/**
 * 秘密凭证供应商
 */
var SecretProviderKind;
(function (SecretProviderKind) {
    SecretProviderKind["DATABASE"] = "DATABASE";
    SecretProviderKind["VAULT"] = "VAULT";
    SecretProviderKind["KMS"] = "KMS";
    SecretProviderKind["EXTERNAL"] = "EXTERNAL";
})(SecretProviderKind || (exports.SecretProviderKind = SecretProviderKind = {}));
/**
 * 配置层级
 */
var ConfigLayer;
(function (ConfigLayer) {
    ConfigLayer["Platform"] = "platform";
    ConfigLayer["Market"] = "market";
    ConfigLayer["Tenant"] = "tenant";
    ConfigLayer["Brand"] = "brand";
    ConfigLayer["Store"] = "store";
})(ConfigLayer || (exports.ConfigLayer = ConfigLayer = {}));
//# sourceMappingURL=configuration-governance.entity.js.map