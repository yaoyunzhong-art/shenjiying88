import type { RoleWorkbench, WorkbenchNavItem, ClientChannel } from '@m5/domain';
/**
 * 工作台引导状态实体
 */
export interface WorkbenchBootstrapState {
    /** 引导版本 */
    version: string;
    /** 角色工作台集合 */
    workbenches: RoleWorkbench[];
    /** 是否已初始化 */
    initialized: boolean;
    /** 最后刷新时间 */
    refreshedAt?: string;
}
/**
 * 导航项优先级枚举
 */
export declare enum NavItemPriority {
    High = "HIGH",
    Medium = "MEDIUM",
    Low = "LOW"
}
/**
 * 拓展导航项，包含运行时元数据
 */
export interface WorkbenchNavItemRich extends WorkbenchNavItem {
    /** 导航优先级 */
    priority: NavItemPriority;
    /** 是否需要特定能力 */
    requiredCapability?: string;
    /** 是否仅在特定客户端可用 */
    clientRestriction?: ClientChannel[];
}
/**
 * 角色工作台能力标识
 */
export declare const WORKBENCH_CAPABILITIES: readonly ["tenant-management", "brand-matrix", "channel-orchestration", "member-crm", "checkout-nuclear", "offline-fallback", "daily-report", "field-scheduling", "promo-conversion", "audit-center", "market-governance", "regional-config", "portal-management", "campaign-execution"];
/** 角色工作台能力类型 */
export type WorkbenchCapability = (typeof WORKBENCH_CAPABILITIES)[number];
/**
 * 角色-能力映射表
 */
export declare const ROLE_CAPABILITY_MAP: Record<string, WorkbenchCapability[]>;
/**
 * 判断角色是否拥有某能力
 */
export declare function hasCapability(role: string, capability: WorkbenchCapability): boolean;
/**
 * 构造默认引导状态
 */
export declare function makeWorkbenchBootstrapState(workbenches: RoleWorkbench[], overrides?: Partial<Omit<WorkbenchBootstrapState, 'workbenches'>>): WorkbenchBootstrapState;
/** 待办卡片类型 */
export interface TodoCardType {
    key: string;
    label: string;
    description: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
}
/** 权限矩阵片段 */
export interface PermissionSnippet {
    resource: string;
    actions: string[];
    scope: 'platform' | 'tenant' | 'brand' | 'store';
}
/** 角色引导配置 */
export interface RoleBootstrapConfig {
    role: string;
    homePath: string;
    extendedNavItems: WorkbenchNavItemRich[];
    todoCardTypes: TodoCardType[];
    permissionSnippets: PermissionSnippet[];
}
export declare const SUPER_ADMIN_BOOTSTRAP: RoleBootstrapConfig;
export declare const OPERATIONS_BOOTSTRAP: RoleBootstrapConfig;
export declare const FINANCE_BOOTSTRAP: RoleBootstrapConfig;
export declare const WAREHOUSE_BOOTSTRAP: RoleBootstrapConfig;
export declare const COACH_BOOTSTRAP: RoleBootstrapConfig;
/** 所有角色引导配置聚合 */
export declare const ROLE_BOOTSTRAP_CONFIGS: Record<string, RoleBootstrapConfig>;
/**
 * 获取角色引导配置
 */
export declare function getRoleBootstrapConfig(role: string): RoleBootstrapConfig | undefined;
/**
 * 检查角色是否可访问目标角色的菜单（越权检查）
 */
export declare function canAccessRoleMenu(actorRole: string, targetMenuRole: string): boolean;
//# sourceMappingURL=workbench.entity.d.ts.map