# 深度测试报告 · 2026-07-04 19:40

> 测试类型: 深度测试 (分模块针对性测试)
> 更新时间: 2026-07-04 19:40 CST

---

## 一、深度测试结果汇总

| 测试批次 | 通过 | 失败 | 总计 | 通过率 |
|----------|------|------|------|--------|
| cashier | 346 | 21 | 367 | 94.2% |
| coupon+recommend | 672 | 7 | 679 | 98.9% |
| webhook+scheduler | 21 | 29 | 50 | 42.0% |
| ai-content+agent | 417 | 3 | 420 | 99.3% |
| distribution+multi-region | 238 | 1 | 239 | 99.6% |
| tenant+level(含tenant-llm) | 524 | 44 | 568 | 92.3% |
| health+transactions | 653 | 28 | 681 | 95.9% |
| blindbox+member | 707 | 9 | 716 | 98.7% |
| gateway+ai-ops | 39 | 0 | 39 | 100% |
| lineage+sandbox | 145 | 30 | 175 | 82.9% |
| data-privacy+monitoring | 188 | 1 | 189 | 99.5% |
| open-api+canary | 314 | 0 | 314 | 100% |
| license+model-registry | 327 | 155 | 482 | 67.8% |
| **汇总(本轮)** | **4591** | **328** | **4919** | **93.3%** |

---

## 二、失败测试分析

### 2.1 按模块分类

| 模块 | 失败数 | 错误类型 | 根因 |
|------|--------|----------|------|
| license-renewal | 155 | MODULE_NOT_FOUND | require()无法加载TS模块 |
| webhook | 29 | MODULE_NOT_FOUND | require()无法加载TS模块 |
| cashier | 21 | MODULE_NOT_FOUND | require()无法加载TS模块 |
| lineage | 30 | TypeError | SensitiveDataService导入问题 |
| tenant-llm | 44 | TypeError | GeoService导入问题 |
| health-dashboard | 27 | MODULE_NOT_FOUND | require()无法加载TS模块 |
| recommend | 7 | AssertionError | computeWeights业务逻辑bug |
| ai-content | 2 | AssertionError | improvement为负 |
| agent | 1 | Timeout | 5秒超时 |
| multi-region | 1 | AssertionError | lastHealth字段缺失 |
| transactions | 1 | NestJS DI | 依赖注入问题 |
| monitoring | 1 | RegexError | 正则表达式.it()方法错误 |
| canary | 2 | Require/InitError | 模块加载和变量初始化 |

### 2.2 主要错误类型

| 错误类型 | 数量 | 说明 |
|----------|------|------|
| require()加载失败 | 232 | vitest无法解析TS模块 |
| 构造函数导入问题 | 74 | GeoService/SensitiveDataService not a constructor |
| 业务逻辑bug | 7 | computeWeights/improvement计算 |
| 测试超时 | 1 | load-test超时 |
| 字段缺失 | 1 | lastHealth字段 |
| NestJS DI问题 | 1 | 依赖注入配置问题 |
| 正则表达式错误 | 1 | .it()方法使用错误 |
| 变量初始化 | 1 | 访问未初始化变量 |

---

## 三、测试调度中心状态

| 指标 | 值 |
|------|-----|
| PID | 19927 |
| 班次 | A班 (15:00-23:00) |
| 当前周期 | 第6周期 |
| 状态 | 运行中 |
| 下次冒烟测试 | 20:00 |

---

## 四、待修复问题 (按专家分组)

### E9 吴AI (Recommend+AI-Content)

| 问题 | 失败数 | 建议 |
|------|--------|------|
| computeWeights subset忽略 | 7 | 检查computeWeights实现，修复subset过滤逻辑 |
| improvement为负 | 2 | 检查ProgressAnalyzer.calculateImprovement |

### E13 李收银 (Cashier)

| 问题 | 失败数 | 建议 |
|------|--------|------|
| require()加载失败 | 21 | 将require()改为import或使用existsSync验证 |

### E21 周无忧 (Webhook)

| 问题 | 失败数 | 建议 |
|------|--------|------|
| require()加载失败 | 29 | 将require()改为import |

### E40 吕监控 (tenant-llm+lineage)

| 问题 | 失败数 | 建议 |
|------|--------|------|
| GeoService导入问题 | 44 | 检查GeoService导入方式 |
| SensitiveDataService导入问题 | 30 | 检查SensitiveDataService导入方式 |

### E41 王监事 (license-renewal)

| 问题 | 失败数 | 建议 |
|------|--------|------|
| require()加载失败 | 155 | 将require()改为import |

---

## 五、已知问题说明

### require()兼容性问题

多个测试文件使用`require('./module-name')`语法加载TypeScript模块。在vitest环境中，这些require调用无法正确解析`.ts`文件。

**受影响模块**:
- cashier.role.test.ts
- webhook.controller.spec.ts
- health-dashboard.role.test.ts
- license-renewal.role.test.ts
- canary.controller.test.ts

**建议修复方案**:
1. 方案A：改用`import`语法
2. 方案B：使用`existsSync` + `readFileSync`验证

---

## 六、质量趋势

| 日期 | 总测试 | 通过 | 失败 | 通过率 |
|------|--------|------|------|--------|
| 2026-07-03 | 4191 | 4043 | 148 | 96.5% |
| 2026-07-04(本轮) | 4919 | 4591 | 328 | 93.3% |

**趋势**: 通过率下降3.2个百分点，主要新增license-renewal模块155个require()问题
