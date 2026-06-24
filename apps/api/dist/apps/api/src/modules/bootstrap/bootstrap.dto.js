"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BootstrapMetadataResponseDto = exports.BootstrapHealthResponseDto = exports.BootstrapMetadataQueryDto = exports.BootstrapHealthQueryDto = void 0;
/**
 * Bootstrap 健康查询参数 DTO
 */
class BootstrapHealthQueryDto {
    /** 是否返回详细依赖信息 */
    verbose;
}
exports.BootstrapHealthQueryDto = BootstrapHealthQueryDto;
/**
 * Bootstrap 元数据查询参数 DTO
 */
class BootstrapMetadataQueryDto {
    /** 过滤指定 Foundation 模块 */
    moduleKey;
    /** 包含契约详情 */
    includeContracts;
}
exports.BootstrapMetadataQueryDto = BootstrapMetadataQueryDto;
/**
 * Bootstrap 健康响应 DTO
 */
class BootstrapHealthResponseDto {
    status;
    uptime;
    phase;
    checkedAt;
}
exports.BootstrapHealthResponseDto = BootstrapHealthResponseDto;
/**
 * Bootstrap 元数据响应 DTO
 */
class BootstrapMetadataResponseDto {
    tenantContext;
    foundationDependencies;
    foundationContracts;
    phase;
    generatedAt;
}
exports.BootstrapMetadataResponseDto = BootstrapMetadataResponseDto;
//# sourceMappingURL=bootstrap.dto.js.map