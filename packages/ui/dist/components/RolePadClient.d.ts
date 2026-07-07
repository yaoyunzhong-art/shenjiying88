import React from 'react';
export type SupportedPadRole = 'store_manager' | 'front_desk' | 'sales_clerk';
export interface RolePadClientProps {
    role: SupportedPadRole;
    /** 当前激活的 tab，默认 'workbench' */
    activeTab?: string;
    /** tab 切换回调 */
    onTabChange?: (tab: string) => void;
    /** Pad 屏幕分辨率提示 */
    deviceWidthHint?: number;
}
export declare function RolePadClient({ role, activeTab, onTabChange, deviceWidthHint, }: RolePadClientProps): React.JSX.Element;
