# OSS 对象存储

> 对象存储服务，提供文件上传、下载与管理

## 功能
- 文件分片初始化
- 上传完成确认
- 下载 URL 生成
- 文件查询

## API
- POST /oss/files/init-upload — 初始化上传
- POST /oss/files/:id/complete — 完成上传
- POST /oss/files/:id/download-url — 下载 URL
- GET /oss/files/:id — 文件详情
- GET /oss/files — 文件列表
