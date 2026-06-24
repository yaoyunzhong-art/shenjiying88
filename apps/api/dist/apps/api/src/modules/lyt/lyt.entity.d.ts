import type { RequestTenantContext } from '../tenant/tenant.types';
/**
 * LYT 设备类型枚举
 */
export declare enum LytDeviceType {
    GateReader = "GATE_READER",
    PrizeMachine = "PRIZE_MACHINE",
    CastScreen = "CAST_SCREEN",
    Camera = "CAMERA",
    Sensor = "SENSOR"
}
/**
 * LYT 设备状态枚举
 */
export declare enum LytDeviceStatus {
    Online = "ONLINE",
    Offline = "OFFLINE",
    Maintenance = "MAINTENANCE"
}
/**
 * LYT 设备实体核心属性
 */
export interface LytDevice {
    /** 设备唯一标识 */
    deviceId: string;
    /** 租户上下文 */
    tenantContext: RequestTenantContext;
    /** 所属门店 ID */
    storeId: string;
    /** 设备类型 */
    deviceType: LytDeviceType;
    /** 设备名称 */
    name: string;
    /** 设备状态 */
    status: LytDeviceStatus;
    /** 最后心跳时间 */
    lastHeartbeatAt?: string;
    /** 注册时间 */
    registeredAt: string;
    /** 固件版本 */
    firmwareVersion?: string;
}
/**
 * LYT 连接会话实体
 */
export interface LytConnectionSession {
    /** 会话 ID */
    sessionId: string;
    /** 关联设备 ID */
    deviceId: string;
    /** 连接建立时间 */
    connectedAt: string;
    /** 连接断开时间 */
    disconnectedAt?: string;
    /** 连接状态 */
    status: 'ACTIVE' | 'CLOSED';
}
export interface LytResolvedConnection {
    vendor: string;
    tenantId: string;
    brandId?: string;
    storeId: string;
    vendorTenantId: string;
    vendorBrandId?: string;
    vendorStoreId: string;
    endpoint: string;
    authMode: string;
    hasCredential: boolean;
    credentialRef?: string;
    capabilities: string[];
    connectionStatus: 'configured' | 'pending-configuration';
    source: 'prisma' | 'fallback';
    resolutionLevel?: 'store' | 'brand' | 'tenant' | 'fallback';
    resolutionKey?: string;
    resolutionChain?: string[];
    healthStatus?: 'healthy' | 'stale' | 'pending-configuration';
    lastCheckedAt?: string;
    updatedAt?: string;
}
/**
 * LYT 设备 bootstrap 响应
 */
export interface LytBootstrap {
    tenantContext: RequestTenantContext;
    capabilities: string[];
    phase: string;
}
/**
 * 判断设备是否在线
 */
export declare function isDeviceOnline(status: LytDeviceStatus): boolean;
/**
 * 判断设备是否需要关注（离线或维护超过指定分钟数视为异常）
 */
export declare function isDeviceAnomalous(device: LytDevice, thresholdMinutes?: number): boolean;
/**
 * LYT 设备健康汇总
 */
export interface LytDeviceHealthSummary {
    total: number;
    online: number;
    offline: number;
    maintenance: number;
    anomalous: number;
    healthRate: number;
    deviceTypeBreakdown: Record<LytDeviceType, {
        total: number;
        online: number;
        offline: number;
        maintenance: number;
    }>;
}
/**
 * 计算设备健康汇总
 */
export declare function computeDeviceHealthSummary(devices: LytDevice[], thresholdMinutes?: number): LytDeviceHealthSummary;
/**
 * 构造默认 LYT bootstrap
 */
export declare function makeLytBootstrap(tenantContext: RequestTenantContext, overrides?: Partial<Pick<LytBootstrap, 'capabilities' | 'phase'>>): LytBootstrap;
//# sourceMappingURL=lyt.entity.d.ts.map