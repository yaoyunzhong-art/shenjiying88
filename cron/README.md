# ⏰ Cron — 定时任务

## 模块定位

`cron/` 目录包含 shenjiying88 项目的**定时任务（Cron Job）**配置及执行产物。用于定义周期性自动化任务，如夜间收盘数据处理、知识演化日志归档等。

## 核心功能

- 📅 定义系统定时任务（crontab 语法）
- 🧠 执行晚间收盘自动化：退化曲线计算 + L3 日评分 + 引用归档
- 📂 保存定时任务执行输出结果

## 目录结构

```
cron/
├── README.md                          # 本文档
├── v21-evening-close.cron             # V21 晚间收盘定时任务配置
└── output/                            # 定时任务执行输出产物
    └── 20260706_shenjiying88_intelligence_report.md   # 监督层知识采集报告
```

## 当前定时任务

### V21 晚间收盘 (v21-evening-close.cron)

**调度**: 每日 22:00（北京时间）

**执行命令**:
```bash
0 22 * * * cd /path/to/shenjiying88 && tsx scripts/v21-evening-close.ts full
```

**功能模式**:

| 模式 | 说明 |
|------|------|
| `full` | 完整流程：退化曲线 + L3 日评分 + 引用归档（默认） |
| `score-only` | 仅计算 L3 日评分 |
| `decay-only` | 仅运行退化曲线计算 |

**输出**:
- 主日志追加到 `docs/knowledge/evolution-log.md`
- 错误日志写入 `logs/v21-evening-error.log`

**环境依赖**:
- `POSTGRES_URL` 环境变量（或 `~/.pg_service.conf`）

## 部署方式

### 方式一：crontab

```bash
crontab /path/to/shenjiying88/cron/v21-evening-close.cron
```

### 方式二：Gateway Cron

```bash
gateway cron create --file /path/to/shenjiying88/cron/v21-evening-close.cron
```

## 输出说明

`output/` 目录保存定时任务执行过程中生成的报告、快照等产物。例如：
- `*_intelligence_report.md` — 监督层定时知识采集报告
- 命名格式：`YYYYMMDD_<项目名>_<主题>.md`
