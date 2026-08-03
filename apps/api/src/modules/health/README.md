# health — 健康检查 + 数据库备份

## 端点
| 方法 | 路径 | 说明 |
|:-----|:-----|:-----|
| GET | `/health/ping` | 快速连通性 |
| GET | `/health` | 完整健康检查 (DB/Redis/LYT/内存/磁盘/EventBus/Queue) |
| GET | `/health/backup` | 数据库备份状态 |
| GET | `/health/backup/trigger` | 手动触发备份 |

## 自动备份
- 每小时 pg_dump → /tmp/m5-backups/
- 保留最近7份备份
- 2小时内无成功备份 → 健康检查 DEGRADED

## V23 Day5
- ✅ DatabaseBackupService 自动备份
- ✅ 部署验收脚本 (scripts/deploy-check.sh)
- ✅ k6 压测脚本 (scripts/load-test.js)
