"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrossModuleValidationResultDto = exports.CrossModuleChainStatusDto = exports.CrossModuleValidateDto = exports.CrossModuleQueryDto = void 0;
require("reflect-metadata");
/**
 * 跨模块验证查询 DTO
 */
class CrossModuleQueryDto {
    /** 按链路名称筛选 */
    chainName;
    /** 是否详细模式 */
    verbose;
    /** 按状态筛选 */
    status;
}
exports.CrossModuleQueryDto = CrossModuleQueryDto;
/**
 * 跨模块验证请求 DTO
 */
class CrossModuleValidateDto {
    /** 要验证的链路名称 (空=全部) */
    chainNames;
    /** 租户上下文 */
    tenantId;
    /** 门店上下文 */
    storeId;
    /** 市场代码 */
    marketCode;
}
exports.CrossModuleValidateDto = CrossModuleValidateDto;
/**
 * 跨模块链路状态响应 DTO
 */
class CrossModuleChainStatusDto {
    chains;
    total;
    runtime;
}
exports.CrossModuleChainStatusDto = CrossModuleChainStatusDto;
/**
 * 跨模块验证结果响应 DTO
 */
class CrossModuleValidationResultDto {
    chainName;
    passed;
    stages;
    executedAt;
    durationMs;
}
exports.CrossModuleValidationResultDto = CrossModuleValidationResultDto;
//# sourceMappingURL=cross-module.dto.js.map