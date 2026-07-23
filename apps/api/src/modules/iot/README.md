# IoT 物联网

> 物联网设备管理服务，支持设备注册、状态上报与管理

## 功能
- 设备 CRUD 管理
- 设备状态上报
- 设备移除

## API
- POST /iot/devices — 注册设备
- GET /iot/devices — 设备列表
- GET /iot/devices/:deviceId — 设备详情
- POST /iot/devices/:deviceId/status — 上报状态
- DELETE /iot/devices/:deviceId — 移除设备
