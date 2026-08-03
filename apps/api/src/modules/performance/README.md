# Performance 缓存性能

> 缓存性能管理服务，支持缓存配置、读取与批量操作

## 功能
- 缓存配置管理
- 缓存读写
- 批量操作

## 依赖
- AgentModule

## API
- POST /performance/cache/configure — 配置缓存
- GET /performance/cache/config — 缓存配置
- POST /performance/cache/get — 读取缓存
- POST /performance/cache/set — 写入缓存
- POST /performance/cache/mset — 批量写入
