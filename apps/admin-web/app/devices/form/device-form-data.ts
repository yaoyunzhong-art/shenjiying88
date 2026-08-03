export interface DeviceFormSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'devices-form-mock'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadDeviceFormSnapshot(): Promise<DeviceFormSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'devices-form-mock',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadDeviceFormSnapshot -> local device form shell snapshot',
    businessDataSource: 'legacy devices/form client workflow preserved under E54 wrapper',
    refreshPath: 'DeviceFormPage -> loadDeviceFormSnapshot()',
    note: '当前设备新建页仍沿用本地表单交互，本轮完成 E54 壳层化、来源态透明化与刷新链路统一。',
  }
}
