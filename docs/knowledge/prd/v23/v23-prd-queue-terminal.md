# V23 PRD: 排队与终端 (Queue & Terminal)

> **WP-12A** · BS-0155~BS-0160 · P0
> 来源: `docs/knowledge/2026-07-23-6-8-development-master-backlog-v2.md §6`
> 更新: 2026-07-23

---

## 1. 概述

排队与终端模块提供门店场景下的**双模排队**（线上/线下）和**终端硬件链路**（设备注册/心跳/离线检测/MQTT 通信）能力。

### 范围 (BS-0155 ~ BS-0160)

| 编号 | 特性 | 模块 | 状态 |
|------|------|------|------|
| BS-0155 | 双模排队 — 线上排队（微信/App） | `queue` | ✅ 实现 |
| BS-0156 | 双模排队 — 线下排队（终端取号） | `queue` | ✅ 实现 |
| BS-0157 | 终端设备注册/管理 | `device-adapter` + `iot` | ✅ 实现 |
| BS-0158 | 终端心跳/离线检测 | `iot/iot-hardware.service` | ✅ 实现 |
| BS-0159 | MQTT 消息发布/订阅 | `iot/iot-hardware.service` (MQTTBrokerService) | ✅ 实现 |
| BS-0160 | 终端三合一（收银/排队/打印） | `device-adapter` (kiosk 类型预留) | ⚠️ 部分实现 |

---

## 2. 双模排队 (BS-0155, BS-0156)

### 位置
- `apps/api/src/modules/queue/` (20 文件)

### 线上/线下双模覆盖

| 模式 | 入口 | 实现文件 | 说明 |
|------|------|----------|------|
| **线上排队** (微信/App) | `POST /queue/join` | `queue.controller.ts` line 25 | 通过 API 取号, partySize=1, 自动生成 A/B/C 号段 |
| **线下排队** (终端取号) | `POST /queue/join` | `queue.service.ts` takeNumber() | 复用同一入口, 终端通过 API 加入队列 |
| 叫号 | `POST /queue/call-next` | `queue.service.ts` callNext() | 按优先级 + 号顺序, 自动记录实际等待时间 |
| 开始服务 | `POST /queue/:id/start-service` | `queue.service.ts` startService() | Called → Serving 状态转换 |
| 完成服务 | `POST /queue/:id/complete` | `queue.service.ts` completeService() | Serving → Completed |
| 过号标记 | `POST /queue/:id/no-show` | `queue.service.ts` markNoShow() | Called → NoShow |
| 排队查询 | `GET /queue/status/:resourceId` | `queue.controller.ts` | 返回排队统计 (等待/叫号/服务/完成/取消/过号数 + 平均延时) |
| 位置查询 | `GET /queue/position?memberId=&resourceId=` | `queue.controller.ts` | 返回用户在等待队列中的位置和预估等待时间 |
| 离开/取消 | `POST /queue/:id/leave` | `queue.service.ts` leaveQueue() | Waiting → Cancelled |

### 状态机

```
Waiting ←→ Called ←→ Serving ←→ Completed
    ↕           ↕          ↕
 Cancelled   NoShow    Cancelled
```

### 队列类型
- `booking` (A 号段) — 预约
- `waiting` (B 号段) — 等待
- `service` (C 号段) — 服务

### 存储
- **内存 Map** (`queueStore` + `queueNumberCounters`) — 当前未接入 Redis/DB
- 生产环境需迁移至持久化存储

### 线上/App 并行
- **支持**: 同一 resource 下, 线上和线下取号者共享同一排队序列
- **区分**: 通过 `userId` / `memberId` + `type` 过滤; 线上和线下共用排队号段
- **缺省**: 未实现「线上排队优先于线下」的混合策略, 仅根据 `priority` 字段排序

---

## 3. 终端硬件链路 (BS-0157, BS-0158)

### 3.1 设备适配器 (device-adapter)

| 特性 | 实现 | 说明 |
|------|------|------|
| 设备注册 | `POST /device-adapter/devices` | 支持 DeviceConfig 注册 (id/type/brand/connection/timeout/retries) |
| 设备列表 | `GET /device-adapter/devices` | 支持 type/brand/status 过滤 |
| 连接管理 | `POST .../connect` / `disconnect` | USB/串口/蓝牙/WiFi/以太网 |
| 设备状态 | `GET .../status` | Online/Offline/Error/Maintenance |
| POS 操作 | transaction/refund/readCard | 华为 HiPay SDK |
| 闸机操作 | gateOpen/gateGetAccessLog | 方向控制 + 通行日志 |
| 扫描仪 | scannerScan/scannerParse | QR/Code128/EAN13/UPC |
| 打印机 | printerPrint/printerPrintQR | ZPL/ESC/POS |
| 心跳 | `POST .../heartbeat` | 刷新设备 online 状态 |

**品牌策略**: 华为 (HiPay)、Honeywell (HHP)、Zebra (ZPL)、Epson (ESC/POS)、得力 (Custom)、Generic (HTTP/REST)

### 3.2 IoT 模块 (BS-0158 心跳/离线检测)

| 特性 | 实现位置 | 说明 |
|------|----------|------|
| 设备注册 | `ESP32DeviceService.registerDevice()` | ESP32_S3/C3/ESP32/ESP8266 |
| 设备上线 | `POST /iot/devices/online` | 注册 + 状态 ONLINE |
| 设备下线 | `POST /iot/devices/offline` | 状态 OFFLINE + 重置心跳 |
| 心跳上报 | `POST /iot/heartbeat` | `AdaptiveHeartbeatService.recordHeartbeat()` |
| 动态间隔调整 | `calcOptimalInterval()` | 根据延迟自适应: <100ms 缩短, >500ms 延长 |
| 超时告警 | `alertIfTimeout()` | 连续 3 次超时触发告警 |
| 滑动窗口 | 保留最近 100 条记录 | `HeartbeatRecord[]` 滑动窗口 |
| 延迟统计 | `getLatencyStats()` | avg/min/max/count |

### 3.3 终端三合一 (BS-0160)

**当前覆盖度**: ⚠️ 部分实现
- `device-adapter` 模块中有 `kiosk` 设备类型枚举 (`DeviceType.KIOSK`)
- 但无专门的「终端三合一(收银/排队/打印)」编排流程
- 各能力独立存在 (POS 交易 / 排队 API / 打印机), 缺少统一终端编排层

---

## 4. MQTT 基础 (BS-0159)

### 实现位置
- `apps/api/src/modules/iot/iot-hardware.service.ts` → `MQTTBrokerService`

### 覆盖能力

| 特性 | 方法 | 说明 |
|------|------|------|
| MQTT 连接 | `connect(brokerUrl)` | 连接到外部 Broker |
| 断开 | `disconnect()` | 断开并清空订阅 |
| 发布消息 | `publish(topic, payload, qos=0)` | 单条发布 |
| 批量发布 | `publishBatch(messages)` | 固件推送等场景 |
| 订阅主题 | `subscribe(topic, handler)` | 支持 `+` 和 `#` 通配符 |
| 取消订阅 | `unsubscribe(topic, handler?)` | 可选指定或多个 |
| 消息历史 | `getMessageHistory(topic?)` | 最近 1000 条 |
| 连接状态 | `isConnected()` | 返回布尔值 |

### 消息路由
- 通配符匹配: `topicMatches(pattern, topic)` 支持 MQTT 标准 `+` (单层) 和 `#` (多层)
- OTA 推送: `devices/:deviceId/ota` 主题

### API 端点
| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/iot/mqtt/connect` | 连接 Broker |
| `POST` | `/iot/mqtt/disconnect` | 断开 Broker |
| `POST` | `/iot/mqtt/publish` | 发布消息 |
| `POST` | `/iot/mqtt/batch-publish` | 批量发布 |
| `GET` | `/iot/mqtt/history` | 消息历史 |
| `GET` | `/iot/mqtt/status` | 连接状态 |

### 缺省项
- ⚠️ MQTT over WebSocket: 当前为内存模拟, 无真实 Broker 长连接
- ⚠️ TLS/SSL 加密: 未实现
- ⚠️ 认证鉴权: 未实现 (无 username/password/client_id 模型)
- ⚠️ 掉线重连: 未实现自动重连逻辑
- ⚠️ Last Will & Testament: 未实现
- ⚠️ 保留消息/持久会话: 未实现

---

## 5. 模块依赖图

```
AppModule
 ├── QueueModule         (排队核心: controller + service + entity + dto + contract)
 ├── DeviceAdapterModule (设备适配: POS/闸机/扫描仪/打印机/自助终端)
 ├── IoTModule           (IoT管理: ESP32/心跳/MQTT/OTA/工单)
 ├── SessionModule       (会话管理: 用户会话/并发控制/超时)
 └── RealtimeModule      (实时通信: WebSocket房间/协作/CRDT)
     └── CollabService
```

所有模块已在 `app.module.ts` 中依次导入 (line 248/270/282/285/313)。

---

## 6. 测试覆盖概览

| 模块 | 测试文件数 | 测试用例数 | 状态 |
|------|-----------|-----------|------|
| queue | 11 | ~180 | ✅ |
| device-adapter | 15 | ~436 | ✅ |
| iot | 10 | ~200 | ✅ (E2E auth failures pre-existing) |
| session | 7 | ~150 | ✅ |
| realtime | 9 | ~378 | ✅ (E2E auth failures pre-existing) |

### 已知失败
- `realtime.e2e-http.test.ts`: TenantGuard 导致 HTTP 401 (需 auth context)
- `iot.e2e.test.ts`: 同上
- `device-adapter.e2e.test.ts`: 同上
- `queue.controller.test.ts`: `require()` 引用问题
- 以上均为**已有问题**，非本次新增

---

## 7. 门禁级缺失

| # | 缺失项 | 影响 | 优先级 |
|---|--------|------|--------|
| 1 | 排队持久化 (Redis/DB) | 生产不可用, 服务重启数据丢失 | P0 |
| 2 | 终端三合一编排层 | kiosk 类型空有定义, 无编排逻辑 | P1 |
| 3 | MQTT 真实 Broker 连接 | 当前为内存模拟 | P1 |
| 4 | 线上/线下排队混合策略 | 无 VIP/线上优先于线下的排序策略 | P2 |
| 5 | 终端离线自动检测/通知 | 需要 Timer 扫描 + 通知 | P2 |
| 6 | MQTT Auth/TLS/重连 | 安全合规要求 | P2 |

---

## 8. 参考

- `6-8_refs`: [BS-0155..BS-0160]
- `blocker_id`: none
