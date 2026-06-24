import 'reflect-metadata';
/**
 * 健康检查查询参数 DTO
 * 注意：为了避免 tsx/class-validator 兼容性问题，装饰器定义集中于此文件
 */
export declare class HealthQueryDto {
    verbose?: boolean;
    scope?: string;
}
/**
 * 健康检查响应 DTO
 */
export declare class HealthResponseDto {
    status: string;
    checkedAt: string;
    version: string;
    lytMode?: string;
    sampleMember?: Record<string, unknown>;
}
//# sourceMappingURL=health.dto.d.ts.map