import type { RequestTenantContext } from '../tenant/tenant.types';
import { PortalService } from './portal.service';
export declare class PortalController {
    private readonly portalService;
    constructor(portalService: PortalService);
    /** 获取完整的门户 bootstrap 信息（含 tenant/brand/store 门户 + 市场配置 + 基础依赖） */
    getBootstrap(tenantContext: RequestTenantContext): import("@m5/types").PortalBootstrapResponse;
    /** 仅获取租户级别 ToB 门户信息 */
    getTenantPortal(tenantContext: RequestTenantContext): import("@m5/domain").TobPortal;
    /** 仅获取品牌级别 ToB 门户信息 */
    getBrandPortal(tenantContext: RequestTenantContext): import("@m5/domain").TobPortal;
    /** 仅获取门店级别 ToC 门户信息 */
    getStorePortal(tenantContext: RequestTenantContext): import("@m5/domain").StorePortal;
}
//# sourceMappingURL=portal.controller.d.ts.map