/** 设备管理模块共享类型 */

export type DeviceType = 'POS' | 'printer' | 'scanner' | 'tablet' | 'kiosk' | 'scale';
export type DeviceStatus = 'online' | 'offline' | 'warning' | 'maintenance';

export interface DeviceItem {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  ip: string;
  storeId: string;
  storeName: string;
  lastCheckAt: string;
  firmwareVersion: string;
  serialNumber: string;
}
