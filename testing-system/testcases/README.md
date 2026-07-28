# testing-system/testcases — 测试用例目录

## 模块说明

本目录是 Shenjiying88 测试系统的核心测试用例仓库，存放所有业务模块的功能测试用例、集成测试用例以及测试框架定义文件。测试用例以 TypeScript 编写，通过注册中心统一管理和调度，支持自动化与手动执行两种模式。

## 核心功能

- **用例注册与管理**：通过 `test-case-registry.ts` 集中注册所有测试用例，支持分类、标签和优先级管理
- **测试执行框架**：`testing-framework.ts` 提供统一的测试执行引擎，包含 Mock 工厂、断言工具与报告生成
- **模块覆盖**：覆盖后端 API、前端组件、数据流完整性等维度的测试场景
- **可扩展性**：新增模块只需注册新用例即可接入测试体系，无需改动框架代码

## 使用方式

测试系统自动加载本目录下的测试用例。开发者可通过以下命令或 API 触发执行：

```bash
# 运行所有测试用例
pnpm test

# 运行指定模块的测试
pnpm test -- --module=usa-street-game

# 查看测试注册表
cat testing-system/testcases/test-case-registry.ts
```

## 目录结构

```
testing-system/testcases/
├── README.md                    # 本文件
├── test-case-registry.ts        # 测试用例注册中心（所有用例在此注册）
└── testing-framework.ts         # 测试执行框架（Mock、断言、报告引擎）
```

> **注意**：新增测试用例时，请先在 `test-case-registry.ts` 中注册，然后编写对应的测试逻辑。
