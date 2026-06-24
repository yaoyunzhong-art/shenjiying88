import { LytDeviceType, LytDeviceStatus } from './lyt.entity';
/**
 * LYT 设备查询参数 DTO
 */
export declare class LytDeviceQueryDto {
    /** 设备类型筛选 */
    deviceType?: LytDeviceType;
    /** 设备状态筛选 */
    status?: LytDeviceStatus;
    /** 门店 ID 筛选 */
    storeId?: string;
    /** 搜索关键字（设备名称/ID） */
    keyword?: string;
    /** 分页页码 */
    page?: number;
    /** 每页条数 */
    pageSize?: number;
}
/**
 * LYT 设备创建 DTO
 */
export declare class LytDeviceCreateDto {
    /** 设备类型 */
    deviceType: LytDeviceType;
    /** 设备名称 */
    name: string;
    /** 所属门店 ID */
    storeId: string;
    /** 固件版本（可选） */
    firmwareVersion?: string;
}
/**
 * LYT 设备更新 DTO
 */
export declare class LytDeviceUpdateDto {
    /** 设备名称 */
    name?: string;
    /** 设备状态 */
    status?: LytDeviceStatus;
    /** 固件版本 */
    firmwareVersion?: string;
}
/**
 * LYT 网关通行验证 DTO
 */
export declare class LytGateVerifyDto {
    /** 通行码 */
    passCode: string;
    /** 门店 ID */
    storeId: string;
}
/**
 * LYT Bootstrap 响应 DTO
 */
export declare class LytBootstrapResponseDto {
    tenantContext: Record<string, unknown>;
    capabilities: string[];
    phase: string;
}
/**
 * LYT webhook 回调 DTO
 */
export declare class LytWebhookIngestDto {
    eventId?: string;
    eventType?: string;
    signature: string;
    timestamp: string;
    rawBody?: string;
    fixtureKey?: string;
    rawHeaders?: Record<string, string>;
    rawQuery?: Record<string, string>;
    payload: Record<string, unknown>;
}
export declare class LytWebhookDrillDto {
    eventId?: string;
    eventType?: string;
    dryRun?: boolean;
    fixtureKey?: string;
    payload?: Record<string, unknown>;
}
export declare class LytWebhookFixtureReplayDto {
    fixtureKey: string;
    eventId?: string;
    payload?: Record<string, unknown>;
    strictValidation?: boolean;
    headers?: Record<string, string>;
    query?: Record<string, string>;
}
export declare class LytFixtureCompareDto {
    payload?: Record<string, unknown>;
    headers?: Record<string, string>;
    query?: Record<string, string>;
}
export declare class LytFixtureImportPreviewDto {
    payload?: Record<string, unknown>;
    headers?: Record<string, string>;
    query?: Record<string, string>;
}
export declare class LytFixtureImportPlanDto {
    payload?: Record<string, unknown>;
    headers?: Record<string, string>;
    query?: Record<string, string>;
}
//# sourceMappingURL=lyt.dto.d.ts.map