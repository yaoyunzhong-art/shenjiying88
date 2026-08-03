# 📊 Benchmark — 性能基准测试

## 模块定位

`benchmark/` 目录包含 shenjiying88 M5 平台的**性能基准测试**相关文件。用于定义、执行和验证系统的性能基线，确保 API 延迟、吞吐量、资源使用、数据库和缓存性能满足生产环境要求。

## 核心功能

- 📋 定义性能基线指标（API 延迟 RPS、资源使用、数据库、缓存）
- 🚀 一键运行各类性能测试（延迟 / 吞吐量 / 负载 / 压力 / 稳定性 / 缓存 / 数据库）
- ✅ 将测试结果与基线对比，自动判断是否通过验收
- 🔁 支持 CI 模式集成到流水线

## 目录结构

```
benchmark/
├── README.md                      # 本文档
├── performance-baseline.yml       # 性能基线定义（YAML 格式）
└── run-benchmark.sh               # 测试运行脚本
```

## 使用方式

### 运行所有测试

```bash
cd /path/to/shenjiying88
bash benchmark/run-benchmark.sh
```

### 运行指定类型测试

```bash
bash benchmark/run-benchmark.sh latency     # API 延迟测试
bash benchmark/run-benchmark.sh throughput   # 吞吐量测试
bash benchmark/run-benchmark.sh load         # 负载测试
bash benchmark/run-benchmark.sh stress       # 压力测试
bash benchmark/run-benchmark.sh stability    # 稳定性测试
bash benchmark/run-benchmark.sh cache        # 缓存性能测试
bash benchmark/run-benchmark.sh database     # 数据库性能测试
```

### 常用选项

| 选项 | 作用 |
|------|------|
| `-h, --help` | 显示帮助信息 |
| `-v, --verbose` | 详细输出模式 |
| `-q, --quick` | 快速模式（缩短测试时长） |
| `-c, --ci` | CI 模式（无交互式输出） |
| `-o, --output DIR` | 指定输出目录（默认 `./results`） |
| `-b, --baseline FILE` | 指定基线文件（默认 `./performance-baseline.yml`） |

示例：

```bash
# 快速运行延迟测试，结果保存到 custom-results/
bash benchmark/run-benchmark.sh -q -o ./custom-results latency
```

## 性能基线概要

### API 延迟（毫秒）

| 接口 | P50 | P95 | P99 | Max |
|------|-----|-----|-----|-----|
| 健康检查 `GET /ping` | 10 | 25 | 50 | 100 |
| 用户登录 `POST /login` | 50 | 150 | 300 | 500 |
| 查询优惠券 `GET /coupons` | 40 | 100 | 200 | 400 |
| 领取优惠券 `POST /claim` | 80 | 200 | 400 | 800 |
| 创建巡检 `POST /inspections` | 50 | 120 | 250 | 500 |

### 吞吐量（RPS）

| 场景 | 并发用户 | 目标 RPS | 时长 | 错误率阈值 |
|------|---------|---------|------|-----------|
| 常规负载 | 100 | 1,000 | 60s | 1% |
| 峰值负载 | 500 | 5,000 | 60s | 5% |
| 压力测试 | 1,000 | 10,000 | 30s | 10% |
| 稳定性测试 | 200 | 2,000 | 3600s | 0.1% |

### 验收标准（必须满足）

- API P95 延迟 < 200ms
- API P99 延迟 < 500ms
- 常规负载 RPS >= 1000
- 错误率 < 1%
- CPU 使用率 < 70%
- 内存使用率 < 80%
