import { Module } from '@nestjs/common'
import { DeviceAdapterController } from './device-adapter.controller'
import { DeviceAdapterService } from './device-adapter.service'

/**
 * 设备适配器模块
 *
 * 提供设备注册管理、连接管理、POS/闸机/扫描仪/打印机 等设备操作能力。
 * 使用策略模式按品牌适配各设备通信协议。
 */
@Module({
  controllers: [DeviceAdapterController],
  providers: [DeviceAdapterService],
  exports: [DeviceAdapterService],
})
export class DeviceAdapterModule {}
