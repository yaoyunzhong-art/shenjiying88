# 安全模块 (Security)

## 用途
应用安全防护层：API 安全扫描（SQL 注入/XSS/IDOR 检测）、WAF 规则管理（IP/路径/UA/Header 过滤 + 速率限制）、敏感数据泄露检测、JWT 弱密钥检测。

## 关键端点
| 路由 | 说明 |
|------|------|
| `POST /security/scan` | 单目标安全扫描 |
| `POST /security/scan/batch` | 批量安全扫描 |
| `POST /security/detect/sensitive-data` | 敏感数据暴露检测 |
| `POST /security/detect/jwt-weak-secret` | JWT 弱密钥检测 |
| `POST /security/detect/idor` | IDOR 越权检测 |
| `POST /security/waf/rules` | WAF 规则 CRUD |
| `POST /security/waf/evaluate` | WAF 请求评估 |

## 测试位置
`apps/api/src/modules/security/` — **13** 个测试文件：控制器单测 (`.spec.ts`)、服务单测 (`.test.ts`)、WAF 测试、扫描器测试、DTO/Entity 测试、E2E (`.e2e.test.ts`)、角色权限测试。
