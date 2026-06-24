import { CrossModuleService } from './cross-module.service';
import type { CrossModuleValidateDto } from './cross-module.dto';
export interface CrossModuleChainStatus {
    chains: {
        name: string;
        modules: string[];
        status: string;
        lastVerifiedAt?: string;
        brokenNodes?: string[];
    }[];
    total: number;
    runtime: 'cross-module-e2e';
}
export declare class CrossModuleController {
    private readonly crossModuleService;
    constructor(crossModuleService: CrossModuleService);
    /** 返回跨模块 E2E 验证链路清单 */
    getChainStatus(): CrossModuleChainStatus;
    /** 返回验证摘要统计 */
    getSummary(): {
        total: number;
        defined: number;
        validating: number;
        verified: number;
        broken: number;
    };
    /** 执行跨模块链路验证 */
    validate(body: CrossModuleValidateDto): Promise<import("./cross-module.entity").CrossModuleValidationResult[]>;
    /** 验证单条链路 */
    validateChain(chainName: string, body: CrossModuleValidateDto): Promise<import("./cross-module.entity").CrossModuleValidationResult>;
    /** 检查是否所有链路已验证通过 */
    getAllVerified(): {
        allVerified: boolean;
        checkedAt: string;
    };
    /** 检查是否有断开链路 */
    getHasBroken(): {
        hasBroken: boolean;
        checkedAt: string;
    };
    /** 重置所有链路状态到 Defined */
    resetAll(): {
        reset: boolean;
        resetAt: string;
    };
}
//# sourceMappingURL=cross-module.controller.d.ts.map