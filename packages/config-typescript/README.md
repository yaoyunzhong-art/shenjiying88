# @m5/config-typescript — TypeScript Configurations / TypeScript 配置共享包

**@m5/config-typescript** 是 M5 平台统一的 TypeScript 编译配置共享包，为 monorepo 内不同运行时环境（Next.js / NestJS / 基础库）提供标准的 `tsconfig.json` 继承基线与预设。其他包通过 `extends` 引用本包，确保全仓库 TypeScript 配置一致。

---

## 技术栈 Tech Stack

| 技术       | 说明                     |
|------------|--------------------------|
| TypeScript | tsconfig 配置文件         |
| JSON Schema | 配置校验               |

---

## 目录结构 Directory Structure

```
packages/config-typescript/
├── base.json      # 基础配置（declaration, sourceMap, outDir 等）
├── next.json      # Next.js 预设（ESNext 模块, Bundler 解析, JSX, noEmit）
├── nest.json      # NestJS 预设（CommonJS 模块, Node 解析, 装饰器）
├── package.json
└── README.md      # 本文件
```

---

## 配置说明 Configuration Presets

### base.json — 基础配置

所有预设均继承于此，提供通用的编译选项：

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist"
  }
}
```

### next.json — Next.js 预设

适用于 Next.js App Router / Pages Router 项目：

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "preserve",
    "allowJs": true,
    "noEmit": true,
    "incremental": true,
    "plugins": [{ "name": "next" }]
  }
}
```

特性：
- `ESNext` 模块格式，`Bundler` 模块解析策略
- `jsx: preserve` — 保留 JSX，由 Next.js 编译
- `noEmit: true` — 构建由 Next.js 处理
- `allowJs: true` — 允许引入 JS 文件
- `plugins: [{ name: "next" }]` — Next.js TS 插件

### nest.json — NestJS 预设

适用于 NestJS 后端服务项目：

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "Node",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "incremental": true
  }
}
```

特性：
- `CommonJS` 模块格式，`Node` 模块解析策略
- `experimentalDecorators` / `emitDecoratorMetadata` — 支持 NestJS 装饰器语法
- `incremental: true` — 增量编译加速

---

## 使用示例 Usage Example

在 monorepo 内的子包 `tsconfig.json` 中引用：

```jsonc
// apps/admin-web/tsconfig.json
{
  "extends": "@m5/config-typescript/next.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@m5/ui": ["../../packages/ui/src"],
      "@m5/sdk": ["../../packages/sdk/src"]
    }
  },
  "include": ["src"]
}
```

```jsonc
// apps/api-gateway/tsconfig.json
{
  "extends": "@m5/config-typescript/nest.json",
  "compilerOptions": {
    "baseUrl": ".",
    "target": "ES2022"
  },
  "include": ["src"]
}
```

```jsonc
// packages/ui/tsconfig.json
{
  "extends": "@m5/config-typescript/base.json",
  "compilerOptions": {
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

---

## Scripts 说明

| 命令              | 说明                              |
|-------------------|-----------------------------------|
| `pnpm build`      | 无构建需求（纯配置文件包）          |
| `pnpm lint`       | 无 lint 需求                      |
| `pnpm typecheck`  | 无 typecheck 需求                 |
| `pnpm test`       | 无测试                            |

---

## 依赖说明 Dependencies

无运行时依赖。本包仅为 JSON 配置文件集合。

🔄 此文件由保底续产机器人自动生成 — 2026-07-22
