# AI Content Module

## 模块概述
AI 内容生成与处理模块，涵盖团建报告生成、内容审核、视频去重、进度分析四大能力。支持多租户隔离，集成 Team Building Report Generator、Content Moderation Service、Video Deduplication Service、Progress Analyzer 四个独立服务。

## 核心功能
- **Team Building Report** — 团建活动报告生成/获取/亮点编辑/分享
- **Content Moderation** — 单条/批量内容审核、标记待审、审核通过/拒绝、审核队列查看
- **Video Deduplication** — 视频指纹计算、重复视频检测、双视频指纹相似度比对
- **Progress Analysis** — 成员进度指标记录、进步率计算、绩效对比分析
- **RingBeam** — 环信通信模式集成

## API 端点列表

| 方法 | 路由 | 说明 |
|------|------|------|
| POST | `ai-content/report/generate` | 生成团建报告 |
| GET | `ai-content/report/:eventId` | 获取团建报告 |
| PUT | `ai-content/report/:reportId/highlights` | 添加报告亮点 |
| PUT | `ai-content/report/:reportId/share` | 分享报告 |
| POST | `ai-content/moderate` | 审核单条内容 |
| POST | `ai-content/moderate/batch` | 批量审核内容 |
| POST | `ai-content/moderate/:contentId/flag` | 标记内容待审 |
| PUT | `ai-content/moderate/:contentId/review` | 审核通过/拒绝 |
| GET | `ai-content/moderate/queue` | 获取审核队列 |
| POST | `ai-content/video/fingerprint` | 计算视频指纹 |
| POST | `ai-content/video/detect-duplicates` | 检测重复视频 |
| POST | `ai-content/video/compare` | 比对两个视频指纹 |
| POST | `ai-content/progress/improvement` | 计算成员进步率 |
| POST | `ai-content/progress/compare` | 绩效对比分析 |

## 依赖关系
- **TeamBuildingReportGenerator** — 团建报告生成服务（内部依赖）
- **ContentModerationService** — 内容审核服务（内部依赖）
- **VideoDeduplicationService** — 视频去重服务（内部依赖）
- **ProgressAnalyzer** — 进度分析器（内部依赖）
- **TenantGuard** — 多租户安全守卫（复用 agent module）
- **NestJS** — Controller / Service / Module 架构
- **ValidationPipe** — DTO 参数校验

## 配置说明
```
# TenantId 从 JWT/Header 自动提取
# Content Moderation: 规则和关键词配置在 moderation 策略中
# Video Deduplication: 指纹算法参数可调
# Progress Analysis: 指标定义和周期配置
# 生产环境建议将 In-memory 存储切换为持久化数据库
```
