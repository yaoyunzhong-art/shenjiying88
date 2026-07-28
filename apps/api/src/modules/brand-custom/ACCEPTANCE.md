# Brand Custom Module — Acceptance Criteria

> 品牌定制模块 v2.0 验收标准

---

## ✅ A. 基础功能回归 (Must Pass)

| # | 场景 | 步骤 | 预期 |
|---|------|------|------|
| A1 | 注册租户 | POST /tenants with tenantId + brandName | 返回完整 TenantBrand，含默认主题/域名 |
| A2 | 品牌列表 | GET /tenants | 返回已注册的所有品牌 |
| A3 | 激活控制 | PATCH /tenants/:id/active { active: false } | 商标记为 inactive |
| A4 | 获取主题 | GET /tenants/:id/theme | 返回当前主题配置 |
| A5 | 更新主题 | PATCH /tenants/:id/theme with partial fields | 仅更新传入字段，其余不变 |
| A6 | 预设主题 | POST /tenants/:id/theme/presets/tech | 返回科技蓝主题 |
| A7 | 预设列表 | GET /presets | 返回 5 个预设 |
| A8 | CSS 变量 | GET /tenants/:id/theme/css | 返回 :root { ... } CSS 字符串 |
| A9 | 域名配置 | PATCH /tenants/:id/domain with fields | 域名更新成功 |
| A10 | 域名查询 | GET /tenants/:id/domain | 返回当前域名配置 |
| A11 | DNS 指引 | GET /tenants/:id/domain/dns | 返回合法 DNS 记录数组 |
| A12 | 邮件模板 | POST /tenants/:id/email-templates | 创建/更新模板成功 |
| A13 | 邮件渲染 | POST /tenants/:id/email-templates/welcome/render | 变量被替换为实际值 |
| A14 | 测试邮件 | POST /tenants/:id/email-templates/welcome/test-send | 返回 { success: true } |
| A15 | 预览主题 | POST /preview with theme fields | 返回 HTML snippet |
| A16 | 租户不存在 | 对不存在的 tenantId 调用任何方法 | 抛 Error |
| A17 | 重复注册 | 两次 POST /tenants 同一个 tenantId | 第二次抛 Error |
| A18 | DTO 校验 | 缺少必填字段请求 API | 返回 400 + validation errors |

---

## ✅ B. 版本管理 (Version Management)

| # | 场景 | 步骤 | 预期 |
|---|------|------|------|
| B1 | 创建版本 | POST /tenants/:id/versions { note: "备份" } | 返回 BrandVersion，含 theme + domainConfig 快照 |
| B2 | 版本深拷贝 | 创建版本后修改 theme，版本不受影响 | 版本快照保持创建时的值 |
| B3 | 列出版本 | GET /tenants/:id/versions | 返回所有版本数组 |
| B4 | 空版本列表 | 新租户 GET 版本 | 返回空数组 |
| B5 | 回滚恢复 | 改变 theme → POST rollback → GET theme | 主题恢复为版本状态 |
| B6 | 回滚不存在的版本 | POST rollback 不存在的 versionId | 抛 Error |
| B7 | 版本差异 | 创建 V1 → 修改 theme → 创建 V2 → GET diff | 返回 themeChanges 含变更字段 |
| B8 | 无差异 | GET diff of same version on both sides | hasChanges = false |
| B9 | 域名变更差异 | 修改域名后创建 V2，diff 含 domainChanges | domainChanges 非空 |
| B10 | CSS 变量差异 | 修改 cssVariables 后版本差异可见 | themeChanges 含 cssVariables 项 |

---

## ✅ C. 脚本注入 (Script Injection)

| # | 场景 | 步骤 | 预期 |
|---|------|------|------|
| C1 | 添加 Head 脚本 | POST /tenants/:id/inject-scripts { location: "head", name: "GA", content: "..." } | 返回 InjectScript |
| C2 | 添加 Body 脚本 | POST /tenants/:id/inject-scripts { location: "body_end", ... } | created 成功 |
| C3 | 列表脚本 | GET /tenants/:id/inject-scripts | 返回所有脚本 |
| C4 | 空列表 | 新租户 GET 脚本 | 返回空数组 |
| C5 | 更新脚本 | PATCH /tenants/:id/inject-scripts/:sid { enabled: false } | 启用状态切换 |
| C6 | 删除脚本 | DELETE /tenants/:id/inject-scripts/:sid | 已删除，列表不再出现 |
| C7 | 渲染 head | GET /tenants/:id/inject-scripts/render/head | 只返回 head 位置已启用的脚本 |
| C8 | 渲染 body_end | GET /tenants/:id/inject-scripts/render/body_end | 只返回该位置的脚本 |
| C9 | 禁用过滤 | 禁用某个脚本 → 渲染该位置 | 禁用脚本不包含在输出中 |
| C10 | 脚本名称校验 | name 超过 100 字符 | 400 |
| C11 | 脚本内容校验 | content 超过 50000 字符 | 400 |
| C12 | 删除不存在的脚本 | DELETE 不存在的 scriptId | 抛 Error |

---

## ✅ D. 自定义字体 (Custom Fonts)

| # | 场景 | 步骤 | 预期 |
|---|------|------|------|
| D1 | 注册字体 | POST /tenants/:id/fonts { name, url, format: "woff2" } | 返回 CustomFont |
| D2 | 注册含字重 | POST /tenants/:id/fonts { ..., weight: "700", style: "italic" } | 含 weight/style 字段 |
| D3 | 重复注册 | 注册相同 name+weight+style | 抛 Error（去重） |
| D4 | 不同字重可共存 | 注册 "Inter"/400 和 "Inter"/700 | 都成功 |
| D5 | 字体列表 | GET /tenants/:id/fonts | 返回所有字体 |
| D6 | 删除字体 | DELETE /tenants/:id/fonts/:fontId | 列表不再含该字体 |
| D7 | 生成 CSS | GET /tenants/:id/fonts/css | 返回 @font-face CSS |
| D8 | CSS 格式正确 | 含单引号 font-family、src format、font-display: swap | 语法正确 |
| D9 | 多种字体 CSS | 注册 3 种字体后生成 CSS | 包含 3 个 @font-face 块 |
| D10 | 空 CSS | 无字体时生成 | 返回空字符串 |
| D11 | 格式映射 | woff2 → format('woff2'), ttf → format('truetype') | 映射正确 |
| D12 | DTO 校验 | 非法 format | 400 |

---

## ✅ E. 多语言品牌设置 (Locales)

| # | 场景 | 步骤 | 预期 |
|---|------|------|------|
| E1 | 设置 locale | POST /tenants/:id/locales { locale: "zh-CN", brandName: "中文名" } | 返回 LocaleSetting |
| E2 | 更新已有 locale | POST 相同 locale | 字段更新 |
| E3 | 获取 locale | GET /tenants/:id/locales/zh-CN | 返回该语言设置 |
| E4 | 不存在的 locale | GET /tenants/:id/locales/jp | 返回 null |
| E5 | 列出 locales | GET /tenants/:id/locales | 返回所有语言 |
| E6 | 空 locale 列表 | 新租户 | 空数组 |
| E7 | 本地化品牌 | GET /tenants/:id/localized-brand/zh-CN | 含品牌名(本地化)、主题全配置 |
| E8 | Fallback | 未配置的语言 GET localized-brand | 使用默认品牌名 |
| E9 | locale 格式 | locale 至少 2 字符 | 短 locale 400 |

---

## ✅ F. 品牌健康检查 (Health Check)

| # | 场景 | 步骤 | 预期 |
|---|------|------|------|
| F1 | 健康检查 | GET /tenants/:id/health | 返回 BrandHealthScore |
| F2 | 评分范围 | completeness 0–100 | 整数百分比 |
| F3 | 含 Logo 检查 | Logo 已配置 → status: pass | 对应 message |
| F4 | 缺 Logo | Logo 为空 → status: fail | 含改进建议 |
| F5 | 邮件模板检查 | 无模板 → fail; 缺 welcome → warn; 齐全 → pass | 状态正确 |
| F6 | SSL 检查 | sslEnabled=false → warn | 建议启用 |
| F7 | 脚本/字体/多语言非必需 | 为空 → pass (非 fail) | 不影响核心评分 |
| F8 | 全租户报告 | GET /health/report | 含 averageCompleteness + scores[] |
| F9 | 报告正确性 | 手动计算得分平均值 | 等于返回的 averageCompleteness |
| F10 | 空租户报告 | 无任何租户时 GET report | averageCompleteness = 0 |
| F11 | 各项检查数 | 至少 10 项检查 | checks.length >= 10 |
| F12 | 不存在的租户 | GET /tenants/notexist/health | 抛 Error |

---

## ✅ G. 代码质量 (Code Quality)

| # | 标准 | 要求 |
|---|------|------|
| G1 | 无语法错误 | TypeScript 编译通过 |
| G2 | 无原有代码删除 | 所有原始方法/接口保留（仅新增） |
| G3 | DTO 使用 class-validator | 所有新 DTO 有 @IsString/@IsOptional 等装饰器 |
| G4 | 类型一致性 | 实体类型在 controller/service 间一致传递 |
| G5 | Error 模式一致 | 所有异常使用 throw Error("message")（匹配既有风格） |
| G6 | 路由文档更新 | README.md 包含所有新 API |
| G7 | 验收文档 | ACCEPTANCE.md 包含全部验收标准 |

---

## 评分权重

| 类别 | 权重 | 最低通过 |
|------|------|---------|
| A: 基础功能 | 30% | 100% |
| B: 版本管理 | 15% | 90% |
| C: 脚本注入 | 15% | 90% |
| D: 自定义字体 | 15% | 90% |
| E: 多语言 | 10% | 90% |
| F: 健康检查 | 10% | 90% |
| G: 代码质量 | 5% | 100% |

> **总通过条件**: 所有类别达到最低通过率，且 G 类 100% 通过。
