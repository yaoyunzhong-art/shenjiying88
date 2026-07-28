# Brand Custom 品牌定制

> 品牌个性化配置服务，管理租户品牌主题、域名、邮件模板、版本、脚本、字体与多语言

## 功能

### 基础功能
- **租户品牌管理** — 注册/激活/停用，全租户查询
- **主题配置** — 自定义颜色/字体/CSS变量，预设主题快速应用
- **域名配置** — 自定义域名/CDN/API/Web子域名，SSL管理
- **邮件模板** — 6种业务模板（欢迎/订单/退款/营销/密码重置/SVIP升级），变量渲染
- **预览主题** — 可视化预览主题效果，生成初始化站点

### 新增高级功能

#### 📦 品牌版本管理 (v2.0)
- 创建版本快照 — 将当前 theme + domain 配置保存为一个版本
- 版本列表 — 按时间倒序查看所有版本
- 版本回滚 — 快速恢复到任意历史版本
- 版本对比 — 比较两个版本的 theme/domain 差异（字段级 diff）

#### 📜 自定义脚本注入 (v2.0)
- 三位置注入 — `head` / `body_start` / `body_end`
- 脚本管理 — 添加/更新/启用/禁用/删除
- 渲染接口 — 按位置生成可直接插入页面的 HTML
- 适用场景 — 统计脚本(GA/GA4)、在线客服(Pigeon/Tidio)、社交分享、广告像素

#### 🅰️ 自定义字体管理 (v2.0)
- 注册字体 — 名称/URL/格式(woff/woff2/ttf/eot)/字重/样式
- 自动去重 — 同名+同字重+同样式视为重复
- CSS 生成 — 自动生成 `@font-face` 声明，含 `font-display: swap`
- 字体列表/删除

#### 🌐 多语言品牌设置 (v2.0)
- 按语言配置品牌名称、描述、标语
- 自动 fallback — 未配置的语言使用默认品牌名
- 完整的本地化品牌配置查询

#### 🏥 品牌健康检查 (v2.0)
- 单项检查 — Logo/Favicon/主色/域名/SSL/邮件模板/字体/脚本/多语言/字体
- 完整性评分 — 0–100 百分制
- 全租户报告 — 平均分 + 各租户明细
- 可操作建议 — 每项检查附带改进建议

## 依赖
- AgentModule (TenantGuard)
- class-validator (DTO 校验)
- class-transformer

## API 完整列表

### 租户品牌管理
| 方法 | 路由 | 说明 |
|------|------|------|
| POST | `/brand-custom/tenants` | 注册租户品牌 |
| GET | `/brand-custom/tenants` | 品牌列表 |
| PATCH | `/brand-custom/tenants/:tenantId/active` | 激活/停用品牌 |

### 主题配置
| 方法 | 路由 | 说明 |
|------|------|------|
| GET | `/brand-custom/tenants/:tenantId/theme` | 获取主题 |
| PATCH | `/brand-custom/tenants/:tenantId/theme` | 更新主题 |
| POST | `/brand-custom/tenants/:tenantId/theme/presets/:presetId` | 应用预设主题 |
| GET | `/brand-custom/presets` | 获取所有预设 |
| GET | `/brand-custom/tenants/:tenantId/theme/css` | 生成 CSS 变量 |

### 域名配置
| 方法 | 路由 | 说明 |
|------|------|------|
| GET | `/brand-custom/tenants/:tenantId/domain` | 获取域名配置 |
| PATCH | `/brand-custom/tenants/:tenantId/domain` | 更新域名配置 |
| GET | `/brand-custom/tenants/:tenantId/domain/dns` | DNS 配置指引 |

### 邮件模板
| 方法 | 路由 | 说明 |
|------|------|------|
| POST | `/brand-custom/tenants/:tenantId/email-templates` | 创建/更新邮件模板 |
| GET | `/brand-custom/tenants/:tenantId/email-templates/:templateType` | 获取邮件模板 |
| POST | `/brand-custom/tenants/:tenantId/email-templates/:templateType/render` | 渲染邮件模板 |
| POST | `/brand-custom/tenants/:tenantId/email-templates/:templateType/test-send` | 发送测试邮件 |

### 预览
| 方法 | 路由 | 说明 |
|------|------|------|
| POST | `/brand-custom/preview` | 预览主题效果 |

### 📦 品牌版本管理 (v2.0)
| 方法 | 路由 | 说明 |
|------|------|------|
| POST | `/brand-custom/tenants/:tenantId/versions` | 创建版本快照 |
| GET | `/brand-custom/tenants/:tenantId/versions` | 版本列表 |
| POST | `/brand-custom/tenants/:tenantId/versions/:versionId/rollback` | 回滚到指定版本 |
| GET | `/brand-custom/tenants/:tenantId/versions/:v1/diff/:v2` | 比较两个版本差异 |

### 📜 自定义脚本注入 (v2.0)
| 方法 | 路由 | 说明 |
|------|------|------|
| POST | `/brand-custom/tenants/:tenantId/inject-scripts` | 添加注入脚本 |
| GET | `/brand-custom/tenants/:tenantId/inject-scripts` | 获取所有脚本 |
| PATCH | `/brand-custom/tenants/:tenantId/inject-scripts/:scriptId` | 更新脚本 |
| DELETE | `/brand-custom/tenants/:tenantId/inject-scripts/:scriptId` | 删除脚本 |
| GET | `/brand-custom/tenants/:tenantId/inject-scripts/render/:location` | 渲染指定位置脚本 |

### 🅰️ 自定义字体管理 (v2.0)
| 方法 | 路由 | 说明 |
|------|------|------|
| POST | `/brand-custom/tenants/:tenantId/fonts` | 注册自定义字体 |
| GET | `/brand-custom/tenants/:tenantId/fonts` | 字体列表 |
| DELETE | `/brand-custom/tenants/:tenantId/fonts/:fontId` | 删除字体 |
| GET | `/brand-custom/tenants/:tenantId/fonts/css` | 生成 @font-face CSS |

### 🌐 多语言品牌设置 (v2.0)
| 方法 | 路由 | 说明 |
|------|------|------|
| POST | `/brand-custom/tenants/:tenantId/locales` | 设置语言品牌文字 |
| GET | `/brand-custom/tenants/:tenantId/locales/:locale` | 获取指定语言设置 |
| GET | `/brand-custom/tenants/:tenantId/locales` | 列出所有语言配置 |
| GET | `/brand-custom/tenants/:tenantId/localized-brand/:locale` | 获取本地化品牌全配置 |

### 🏥 品牌健康检查 (v2.0)
| 方法 | 路由 | 说明 |
|------|------|------|
| GET | `/brand-custom/tenants/:tenantId/health` | 单租户健康检查 |
| GET | `/brand-custom/health/report` | 全租户完整性报告 |

## 使用示例

### 版本管理
```bash
# 创建版本
curl -X POST /brand-custom/tenants/abc/versions \
  -H 'Content-Type: application/json' \
  -d '{"note": "发布前备份 - v2.1 主题更新"}'

# 回滚
curl -X POST /brand-custom/tenants/abc/versions/v-xxx-123/rollback

# 版本对比
curl /brand-custom/tenants/abc/versions/v1/diff/v2
```

### 脚本注入
```bash
# 添加 GA4 脚本
curl -X POST /brand-custom/tenants/abc/inject-scripts \
  -d '{"location": "head", "name": "Google Analytics 4", "content": "<!-- Google tag (gtag.js) --><script async src=\"https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX\"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-XXXXXXXXXX');</script>"}'

# 渲染 head 位置
curl /brand-custom/tenants/abc/inject-scripts/render/head
```

### 字体管理
```bash
# 注册字体
curl -X POST /brand-custom/tenants/abc/fonts \
  -d '{"name": "NotoSansSC", "url": "/fonts/NotoSansSC-Regular.woff2", "format": "woff2", "weight": "400"}'

# 生成 CSS
curl /brand-custom/tenants/abc/fonts/css
# → @font-face { font-family: 'NotoSansSC'; src: url('/fonts/NotoSansSC-Regular.woff2') format('woff2'); ... }
```

### 多语言
```bash
# 设置中文品牌名
curl -X POST /brand-custom/tenants/abc/locales \
  -d '{"locale": "zh-CN", "brandName": "神机营", "description": "新一代电商平台", "tagline": "让生意更简单"}'

# 获取本地化品牌
curl /brand-custom/tenants/abc/localized-brand/zh-CN
```

### 健康检查
```bash
# 单租户检查
curl /brand-custom/tenants/abc/health
# → { "completeness": 67, "checks": [...] }

# 全租户报告
curl /brand-custom/health/report
# → { "averageCompleteness": 72, "scores": [...] }
```

## 预设主题

| ID | 名称 | 主色 | 适用场景 |
|----|------|------|---------|
| tech | 科技蓝 | #0066FF | 科技/IT |
| restaurant | 餐饮橙 | #FF6B35 | 餐饮外卖 |
| retail | 零售绿 | #2ECC71 | 零售商城 |
| entertainment | 娱乐紫 | #9B59B6 | 娱乐/直播 |
| education | 教育蓝 | #3498DB | 教育/培训 |

## 技术说明

- 当前使用内存存储 (`Map`)，生产环境需对接持久化数据库
- All routes are protected by `@UseGuards(TenantGuard)`
- DTO 使用 `class-validator` 装饰器进行输入校验
- 版本快照使用 `structuredClone` 实现深拷贝
- 字体 CSS 生成采用 `font-display: swap` 策略，减少 FOIT
- 脚本渲染自动检测纯文本 vs HTML 片断
