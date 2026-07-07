/**
 * Swagger/OpenAPI 文档配置 (V9 需求 1 · V10 Day 4)
 *
 * 自动生成 OpenAPI 3.0 规范文档
 * 包含: 系统预设、门店配置、一键切换、历史回滚等所有API
 */

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { INestApplication } from '@nestjs/common'
import * as fs from 'fs'
import * as path from 'path'

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('AI Model Config API')
    .setDescription(`
## AI模型配置管理 API

### 核心功能
- **系统预设**: 4套预配置 (GPT-4o / Claude 3.5 / Qwen / 自定义)
- **门店配置**: 支持CRUD + AES-256加密
- **一键切换**: < 500ms 延迟 + 热加载
- **历史版本**: 90天历史 + 一键回滚
- **WebSocket**: 实时推送配置变更

### 安全特性
- 多租户隔离 (RLS)
- 字段级加密 (API Key)
- JWT认证 + 权限校验
- 健康检查 + 自动回滚

### 性能指标
- 切换延迟: P95 < 500ms
- 可用率: ≥ 99.9%
- 缓存命中率: > 90%
    `)
    .setVersion('1.0.0')
    .addTag('系统预设', '系统级AI模型预设配置')
    .addTag('门店配置', '门店自有AI模型配置管理')
    .addTag('一键切换', '快速切换当前生效配置')
    .addTag('历史版本', '配置历史与回滚管理')
    .addTag('实时监控', 'WebSocket实时配置变更通知')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token for authentication',
      },
      'JWT',
    )
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'X-Tenant-ID',
        description: '租户ID for multi-tenant isolation',
      },
      'Tenant-ID',
    )
    .build()

  const document = SwaggerModule.createDocument(app, config)

  // 设置 Swagger UI 路径
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
      tryItOutEnabled: true,
    },
    customSiteTitle: 'AI Model Config API Docs',
  })

  // 导出 OpenAPI JSON 文件
  const outputPath = path.resolve(process.cwd(), 'openapi.json')
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2))

  console.log(`📚 Swagger UI: http://localhost:3000/api-docs`)
  console.log(`📄 OpenAPI JSON: ${outputPath}`)
}
