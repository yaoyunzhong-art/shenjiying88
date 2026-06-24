import { type CrossModuleChain, type CrossModuleContext, type CrossModuleValidationResult, toValidationSummary } from './cross-module.entity';
/**
 * 跨模块验证服务
 *
 * 管理跨模块 E2E 验证链路的生命周期：
 * - 列出所有链路及其状态
 * - 执行验证并对接各个模块
 */
export declare class CrossModuleService {
    /**
     * 内置的 4 条跨模块验证链路
     */
    private readonly chains;
    /**
     * 列出所有跨模块链路
     */
    listChains(filter?: {
        chainName?: string;
        status?: string;
    }): CrossModuleChain[];
    /**
     * 获取链路状态摘要
     */
    getSummary(): ReturnType<typeof toValidationSummary>;
    /**
     * 执行跨模块验证
     */
    validate(chainNames: string[] | undefined, context?: CrossModuleContext): Promise<CrossModuleValidationResult[]>;
    /**
     * 验证单条链路
     */
    private validateChain;
    /**
     * 模拟模块间连接检查
     */
    private simulateModuleConnection;
    /**
     * 检查所有链路是否全部验证通过
     */
    checkAllVerified(): boolean;
    /**
     * 检查是否存在断开的链路
     */
    checkHasBroken(): boolean;
    /**
     * 重置所有链路状态
     */
    resetAll(): void;
}
//# sourceMappingURL=cross-module.service.d.ts.map