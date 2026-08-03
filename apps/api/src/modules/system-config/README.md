# system-config — SaaS 平台级配置

## 端点
| 方法 | 路径 | 说明 |
|:-----|:-----|:-----|
| GET | `/system-config` | 获取系统配置 |
| GET | `/system-config/:key` | 获取指定配置项 |
| POST | `/system-config` | 创建/更新配置 |

## 与 tenant-config 的区别
- system-config: 全局系统/平台级配置，跨租户共享
- tenant-config: 租户内三级配置 (W-S/W-T/W-B)

## V23 完成
- ✅ Controller + Service
- ✅ Feature Flags 管理
- ✅ 配置变更审计
