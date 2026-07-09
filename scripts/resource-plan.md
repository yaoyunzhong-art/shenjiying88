## 资源优化方案（不杀任何程序）

### 当前状态
MacBook Pro M4, 24GB RAM, 12核CPU
Node进程是主要资源消耗者（pnpm/turbo/dev server并行）

### 优化点

#### 1. 降低node进程优先级
对所有跑pnpm/turbo/build的node进程做 renice +20（最低优先级，不杀进程）

#### 2. 限制pnpm/turbo并行数
所有cron中的 `pnpm turbo run ...` 增加 `--concurrency=2` 参数
当前 turbo 默认并发数=CPU核数(12)，可以安全降到2

#### 3. 每小时检查一次资源，超90%降优先级
cron: crond 每60分钟检查
- CPU>90%: renice 20 + 休眠30s等待
- MEM>90%: 让node进程释放部分（不kill）

### 执行
已写入 scripts/resource-limit.sh
执行: bash scripts/resource-limit.sh
然后用cron每60分钟自动检查
