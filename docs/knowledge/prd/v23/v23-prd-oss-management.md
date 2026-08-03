# V23-PRD-12: OSS 文件管理模块 — OSS Management

> 版本: v1.0 · 签发人: 树哥
> 日期: 2026-07-21 · 状态: 🟢 已签发
> 圈梁: G1-C5

- **名称**: OSS 文件管理
- **用途**: 提供统一的对象存储文件管理能力，支持 Aliyun OSS / AWS S3 / Tencent COS / MinIO 等多存储后端
- **输出**: `apps/api/src/modules/oss/` (entity / dto / controller / service / contract / tests)
- **圈梁状态**: 代码✅ 测试✅ 审计✅ PRD新建
- **日期**: 2026-07-21
- **作用**: G1-C5 文件存储&管理合规

## 完成定义

1. [x] 文件上传初始化（预签名 URL 返回）
2. [x] 文件上传完成确认（ETag 校验 + 状态流转）
3. [x] 文件下载（预签名 URL）
4. [x] 文件删除（单个 + 批量）
5. [x] 文件列表（分页 + 类型/标签/状态筛选 + 排序）
6. [x] 多桶管理（创建/查询/更新/删除）
7. [x] 预签名 URL 生成（上传/下载）
8. [x] 内容去重（contentHash）
9. [x] MIME 白名单校验
10. [x] 文件大小限制
11. [x] 存储分类统计
12. [x] 跨模块合约定义

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/oss/files/init-upload` | 初始化上传，返回预签名 URL |
| POST | `/oss/files/:id/complete` | 完成上传确认 |
| POST | `/oss/files/:id/download-url` | 生成下载 URL |
| GET | `/oss/files/:id` | 获取文件详情 |
| GET | `/oss/files` | 文件列表（分页/筛选/排序） |
| DELETE | `/oss/files/:id` | 删除单个文件 |
| DELETE | `/oss/files` | 批量删除文件 |
| POST | `/oss/files/:id/signed-url` | 生成预签名 URL |
| POST | `/oss/buckets` | 创建存储桶 |
| GET | `/oss/buckets` | 桶列表 |
| GET | `/oss/buckets/:id` | 桶详情 |
| PATCH | `/oss/buckets/:id` | 更新桶配置 |
| DELETE | `/oss/buckets/:id` | 删除桶 |
| GET | `/oss/stats` | 存储统计 |

## 关键设计

### 文件状态机
```
uploading → (completeUpload) → ready
                                  ↕ (失败)
                                failed
```

### 去重策略
文件上传前客户端需计算 SHA-256 contentHash。服务端以 `{tenantId}:{contentHash}` 为键做去重：
- **同租户同哈希** → 返回已存在的文件引用
- **跨租户同哈希** → 创建新文件记录（实际存储复用）

### 文件大小限制
| 类型 | 上限 |
|------|------|
| image | 50 MB |
| video | 2 GB |
| audio | 500 MB |
| document | 100 MB |
| archive | 500 MB |
| other | 200 MB |

### MIME 白名单
支持 30+ 常见 MIME type：图片（jpeg/png/gif/webp/svg/heic/tiff）、视频（mp4/webm/mov/avi）、音频（mpeg/wav/ogg/aac/flac）、文档（pdf/word/excel/ppt/txt/csv/md）、压缩包（zip/gz/tar/7z）、其他（json/xml/octet-stream）

### 存储桶自动创建
当租户首次上传文件且未指定桶时，Service 自动创建 `shenjiying-oss-{tenantId}` 默认 Aliyun OSS 桶。

## 圈梁检查清单

- [x] 圈梁表: `oss-ringbeam.test.ts` (10 个场景)
- [x] Controller 测试: `oss.controller.test.ts` (16 个场景)
- [x] TSC 编译: —
- [x] API 合约: `oss.contract.ts` (稳定合约)

## 文件清单

```
apps/api/src/modules/oss/
├── oss.entity.ts           # 实体 & 工具函数
├── oss.dto.ts              # 请求/响应 DTO
├── oss.contract.ts         # 跨模块合约
├── oss.service.ts          # 业务逻辑
├── oss.controller.ts       # REST 端点 (13 个)
├── oss.module.ts           # NestJS 模块
├── oss.ringbeam.test.ts    # 圈梁测试 (10 场景)
└── oss.controller.test.ts  # Controller 测试 (16 场景)
```

## 依赖

- NestJS 核心 (Controller / Service / Module)
- `TenantGuard` (来自 agent 模块)
- `encryption.util` (来自 ai-model-config 模块)
- `requireTenantContext` (来自 common/context)

## 后续迭代

1. P2 实际 OSS SDK 集成 (ali-oss / @aws-sdk/client-s3)
2. P3 分片上传支持
3. P3 事件通知 (上传完成 / 删除触发 webhook)
4. P3 文件版本管理
5. P3 图片处理能力 (缩略图 / 水印 / 裁剪)
