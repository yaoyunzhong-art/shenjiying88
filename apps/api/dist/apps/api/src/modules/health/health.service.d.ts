import { type ComponentHealth, type HealthCheckResult, type HealthCheckContext } from './health.entity';
import { LytService } from '../lyt/lyt.service';
import { PrismaService } from '../../prisma/prisma.service';
export declare class HealthService {
    private readonly lytService;
    private readonly prismaService;
    constructor(lytService: LytService, prismaService: PrismaService);
    /**
     * 执行完整健康检查
     * 返回所有依赖组件的状态
     */
    check(context?: HealthCheckContext): Promise<HealthCheckResult>;
    /**
     * 快速连通性检查 — 仅返回 OK / DEGRADED
     */
    ping(): Promise<{
        alive: boolean;
        timestamp: string;
    }>;
    /**
     * 检查指定组件是否可用
     */
    checkComponent(name: string): Promise<ComponentHealth>;
    /**
     * 收集所有依赖组件的健康状态
     */
    private collectComponentHealths;
    /**
     * 探测单个组件
     */
    private probeComponent;
    private probeDatabase;
    private probeRedis;
    private probeLytAdapter;
    private probeMemory;
    private probeDisk;
    /**
     * 获取当前版本号
     */
    private getVersion;
    private getLytMode;
    private getSampleMember;
    private pingRedis;
    private createSocket;
}
//# sourceMappingURL=health.service.d.ts.map