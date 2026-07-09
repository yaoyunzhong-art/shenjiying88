已执行：

1. 创建 resource-check.sh — 每60min检查CPU负载，超过90%时 renice -n 20 node进程（不kill）
2. 创建 cron 每60min自动运行
3. 首次检查已跑完（当前负载正常）

当前系统：M4 MacBook Pro 24GB，CPU负载正常（2.15/12核=18%），内存14/24GB（58%），磁盘128/512GB（25%）——全部在安全范围内

已执行完毕。