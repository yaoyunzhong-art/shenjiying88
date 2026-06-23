import type { Metadata } from 'next';
import { getDevices } from './devices-data';
import { DeviceListClient } from './device-list-client';

export const metadata: Metadata = {
  title: '设备管理 - M5 指挥台',
  description: '门店设备在线状态监控与固件管理',
};

export default function DevicesPage() {
  const devices = getDevices();

  return <DeviceListClient devices={devices} />;
}
