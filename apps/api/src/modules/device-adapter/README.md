# Device Adapter 设备适配器模块

> **状态:** ✅ Active

IoT 设备注册管理与命令执行引擎，采用**策略模式 (Strategy Pattern)** 按品牌适配各设备通信协议。支持 POS 机、闸机、扫描仪、打印机、电子秤、自助终端等零售设备类型。

## 核心功能特性

| # | 特性 | 说明 |
|---|------|------|
| 1 | **多品牌策略适配器** | 内置 Huawei (HiPay SDK)、Honeywell (HHP)、Zebra (ZPL)、Epson (ESC/POS)、Deli (Custom)、Generic (HTTP/REST) 六种协议适配器 |
| 2 | **设备全生命周期管理** | 注册、配置、连接/断开、心跳检测、注销，支持按 type / brand / status 过滤查询 |
| 3 | **多种设备类型操作** | POS 交易/退款/读卡、闸机开门/访问日志、扫描仪扫描/数据解析、打印机打印/二维码打印 |
| 4 | **连接管理** | USB / 串口 / 蓝牙 / WiFi / 以太网，支持批量连接同类型设备 |
| 5 | **命令历史追踪** | 每台设备保留最近 100 条命令记录，支持查询回溯 |

## 技术栈 / 依赖

| 依赖 | 用途 |
|------|------|
| NestJS `@nestjs/common` | Module / Controller / Service 框架 |
| `class-validator` / `class-transformer` | DTO 校验与转换 |
| `TenantGuard` (agent 模块) | 多租户认证守卫 |

## API 端点概览

### 设备注册管理

| 方法 | 路径 | 描述 |
|------|------|------|
| `POST` | `/device-adapter/devices` | 注册新设备 |
| `GET` | `/device-adapter/devices` | 获取设备列表（支持 `type`, `brand`, `status` 过滤） |
| `GET` | `/device-adapter/devices/:deviceId` | 获取单个设备详情 |
| `DELETE` | `/device-adapter/devices/:deviceId` | 删除设备 |

### 连接管理

| 方法 | 路径 | 描述 |
|------|------|------|
| `POST` | `/device-adapter/devices/:deviceId/connect` | 连接单个设备 |
| `POST` | `/device-adapter/devices/:deviceId/disconnect` | 断开设备 |
| `POST` | `/device-adapter/devices/connect-all` | 批量连接同类型设备 |

### 设备状态

| 方法 | 路径 | 描述 |
|------|------|------|
| `GET` | `/device-adapter/devices/:deviceId/status` | 获取设备在线状态 |
| `POST` | `/device-adapter/devices/:deviceId/heartbeat` | 设备心跳检测 |
| `GET` | `/device-adapter/status` | 全部设备状态概览 |

### POS 操作

| 方法 | 路径 | 描述 |
|------|------|------|
| `POST` | `/device-adapter/devices/:deviceId/pos/transaction` | POS 交易（金额、币种） |
| `POST` | `/device-adapter/devices/:deviceId/pos/refund` | POS 退款 |
| `POST` | `/device-adapter/devices/:deviceId/pos/read-card` | POS 读卡 |

### 闸机操作

| 方法 | 路径 | 描述 |
|------|------|------|
| `POST` | `/device-adapter/devices/:deviceId/gate/open` | 闸机开门（方向: in / out / both） |
| `GET` | `/device-adapter/devices/:deviceId/gate/access-log` | 闸机通行记录 |

### 扫描仪操作

| 方法 | 路径 | 描述 |
|------|------|------|
| `POST` | `/device-adapter/devices/:deviceId/scanner/scan` | 扫描条形码/二维码 |
| `POST` | `/device-adapter/scanner/parse` | 解析扫描数据（自动识别 qr / code128 / ean13 / upc 格式） |

### 打印机操作

| 方法 | 路径 | 描述 |
|------|------|------|
| `POST` | `/device-adapter/devices/:deviceId/printer/print` | 打印文本内容 |
| `POST` | `/device-adapter/devices/:deviceId/printer/print-qr` | 打印二维码 |

### 命令历史

| 方法 | 路径 | 描述 |
|------|------|------|
| `GET` | `/device-adapter/devices/:deviceId/commands` | 查询设备命令历史 |

## 测试覆盖情况

| 测试文件 | 类型 | Test 数 |
|----------|------|---------|
| `device-adapter.service.spec.ts` | 单元测试 (Service) | 39 |
| `device-adapter.controller.spec.ts` | 单元测试 (Controller) | 42 |
| `device-adapter.service.test.ts` | Service 集成测试 | 66 |
| `device-adapter.controller.test.ts` | Controller 集成测试 | 41 |
| `device-adapter.dto.test.ts` | DTO 验证测试 | 61 |
| `device-adapter.entity.test.ts` | 实体类型测试 | 24 |
| `device-adapter.module.test.ts` | 模块依赖注入测试 | 4 |
| `device-adapter.test.ts` | 综合测试 | 53 |
| `device-adapter.role.test.ts` | 角色场景测试 | 19 |
| `device-adapter.role-v2.test.ts` | 角色场景 v2 | 16 |
| `device-adapter.role-v3.test.ts` | 角色场景 v3 | 18 |
| `device-adapter.role-extended.test.ts` | 扩展场景测试 | 20 |
| `device-adapter.role-scenario.test.ts` | 场景测试 | 23 |
| `device-adapter.e2e.test.ts` | E2E 测试 | 8 |
| `device-adapter-ringbeam.test.ts` | RingBeat 兼容性测试 | 2 |

**共计 15 个测试文件，~436 个测试用例。**

## 配置与环境变量

### 设备类型

| 类型 | 枚举值 | 说明 |
|------|--------|------|
| POS | `pos` | 收银 POS 机 |
| Gate | `gate` | 闸机 |
| Scanner | `scanner` | 条码/二维码扫描仪 |
| Printer | `printer` | 小票/标签打印机 |
| Scale | `scale` | 电子秤 |
| Kiosk | `kiosk` | 自助终端 |

### 品牌适配器 & 协议

| 品牌 | 协议 | 支持操作 |
|------|------|----------|
| Huawei | HiPay SDK | transaction、refund、readCard |
| Honeywell | HHP Protocol | scan |
| Zebra | ZPL | print、printQR |
| Epson | ESC/POS | print、printQR |
| Deli | Deli Custom | readWeight |
| Generic | HTTP/REST | 通用转发 |

### 模块注册

```typescript
// app.module.ts
import { DeviceAdapterModule } from './modules/device-adapter/device-adapter.module'

@Module({
  imports: [DeviceAdapterModule],
})
export class AppModule {}
```
