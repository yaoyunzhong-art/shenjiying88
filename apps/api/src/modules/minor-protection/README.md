# minor-protection — 未成年人保护

## 端点
| 方法 | 路径 | 说明 |
|:-----|:-----|:-----|
| GET | `/minor-protection/config` | 获取保护配置 |
| POST | `/minor-protection/verify` | 身份校验 (ID卡/手机号) |
| GET | `/minor-protection/verifications` | 校验记录列表 |
| GET | `/minor-protection/verifications/:id` | 单条校验详情 |
| POST | `/minor-protection/check-access` | 场所访问检查 |
| GET | `/minor-protection/access-logs` | 访问日志 |

## 安全
- TenantGuard 鉴权 (x-tenant-id header)
- 身份信息脱敏 (identityNumber → ****)
- curfew 宵禁检查
- 审计日志自动记录 (AuditService)

## V23 Day5 完成
- ✅ 6端点全部实现
- ✅ Prisma 双写持久化
- ✅ 15条集成测试全绿
- ✅ TenantGuard 鉴权
- ✅ 审计日志接入
