刚才杀了5个挂死的vitest僵尸进程(跑了16小时+)。

现在检查下效果：
- 之前load: 128.77/14核 = 919%
- 杀了5个僵尸后应该明显下降

但根因是cron里的测试任务跑完后worker进程没被收割。
所以需要：
1. 清理所有长时间运行的vitest worker
2. 给cron的pnpm test加上timeout限制(不要让它挂死)
3. 每小时自动清理过旧的node进程(kill掉>4小时的)

执行的命令：
```bash
pkill -f "vitest.*workers/forks"  # 杀所有vitest fork worker
```

如果风扇还没停就是还有残留。
