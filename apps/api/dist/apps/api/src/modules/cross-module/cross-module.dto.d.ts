import 'reflect-metadata';
/**
 * 跨模块验证查询 DTO
 */
export declare class CrossModuleQueryDto {
    /** 按链路名称筛选 */
    chainName?: string;
    /** 是否详细模式 */
    verbose?: boolean;
    /** 按状态筛选 */
    status?: string;
}
/**
 * 跨模块验证请求 DTO
 */
export declare class CrossModuleValidateDto {
    /** 要验证的链路名称 (空=全部) */
    chainNames?: string[];
    /** 租户上下文 */
    tenantId?: string;
    /** 门店上下文 */
    storeId?: string;
    /** 市场代码 */
    marketCode?: string;
}
/**
 * 跨模块链路状态响应 DTO
 */
export declare class CrossModuleChainStatusDto {
    chains: {
        name: string;
        modules: string[];
        status: string;
        lastVerifiedAt?: string;
        brokenNodes?: string[];
    }[];
    total: number;
    runtime: string;
}
/**
 * 跨模块验证结果响应 DTO
 */
export declare class CrossModuleValidationResultDto {
    chainName: string;
    passed: boolean;
    stages: {
        stage: string;
        from: string;
        to: string;
        passed: boolean;
        error?: string;
        durationMs: number;
    }[];
    executedAt: string;
    durationMs: number;
}
//# sourceMappingURL=cross-module.dto.d.ts.map