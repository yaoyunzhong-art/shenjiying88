"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthResponseDto = exports.HealthQueryDto = void 0;
require("reflect-metadata");
/**
 * 健康检查查询参数 DTO
 * 注意：为了避免 tsx/class-validator 兼容性问题，装饰器定义集中于此文件
 */
class HealthQueryDto {
    verbose;
    scope;
}
exports.HealthQueryDto = HealthQueryDto;
/**
 * 健康检查响应 DTO
 */
class HealthResponseDto {
    status;
    checkedAt;
    version;
    lytMode;
    sampleMember;
}
exports.HealthResponseDto = HealthResponseDto;
//# sourceMappingURL=health.dto.js.map