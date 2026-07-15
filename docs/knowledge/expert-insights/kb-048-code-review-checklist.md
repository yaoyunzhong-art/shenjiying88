# Code Review清单

> 分类: 开发实践 | 标签: Code Review, 代码质量, 协作规范 | 适用: 开发团队

## 概述

Code Review是保障代码质量、共享知识和发现潜在缺陷的重要实践。与自动化工具不同，Code Review可以发现设计层面的问题——糟糕的架构决策、过度工程化、潜在的性能问题、安全漏洞模式和可维护性隐患。Shenjiying88团队将Code Review作为开发的必选项而非可选项：任何PR必须至少获得一位Senior开发者的Approval才能合并到主分支。

根据SmartBear的研究，高效的Code Review可以在代码进入测试阶段前发现约60-70%的缺陷。然而效果取决于Review的质量而非数量——浏览式Review(看一眼就Approved）效果有限；深入Review需要理解代码上下文、检查边界条件和测试覆盖。Shenjiying88的Code Review Checklist覆盖了架构设计、代码规范、安全性、性能、可测试性和文档六个维度。

## 核心原则

- **原则1: PR粒度控制在200-400行**: 过大的PR(>1000行）会让Reviewer疲惫且难以发现深层问题。每个PR应当聚焦于一个单一功能或修复，变更量控制在200-400行之间。Shenjiying88在CI中配置了PR大小检查——超过500行Diff的PR需要特别说明理由或拆分为多个PR。
- **原则2: 检查设计多于检查格式**: 格式问题(缩进、命名约定）交给ESLint/Prettier自动化处理，Reviewer的精力应当集中在: 接口设计是否合理、模块间依赖是否健康、异常路径是否处理、测试是否覆盖了边界条件。Shenjiying88的Review Checklist中设计类问题占60%、代码风格类问题仅10%。
- **原则3: 每个PR必须包含测试**: 新功能PR必须包含至少一个测试用例(单元测试或集成测试），Bug修复PR必须包含重现该Bug的测试用例。没有测试覆盖的代码在Review中会被标记为"缺少测试"(Needs Tests block）。
- **原则4: 尊重作者但坚持质量**: Review应以协作和学习的姿态进行，而非对抗。问题以询问的口气提出("如果...会怎样？"、"此处是否考虑了租户隔离？"）。但对于安全漏洞、数据一致性问题等硬性缺陷，必须Block PR。
- **原则5: 24小时内响应Review请求**: Review响应速度直接影响开发效率。Shenjiying88的团队约定：Review请求在24小时内得到首次回复。Creator也应在Review后48小时内处理Comment并更新PR。

## 实践案例（基于shenjiying88项目）

- **案例1: Code Review Checklist模板**: Shenjiying88的PR模板包含Checklist项：[ ] 所有测试通过；[ ] 新增代码有相应测试；[ ] API设计符合OpenAPI规范；[ ] 租户隔离正确实现；[ ] 错误处理覆盖异常路径；[ ] 日志记录完善(INFO级操作日志 + ERROR级异常日志）；[ ] 数据库迁移脚本包含回滚；[ ] 敏感信息未硬编码在代码中。提交PR时作者逐项确认。

- **案例2: 安全专项Review**: 对于涉及数据访问、认证授权、支付相关的代码变更，额外增加安全Review。安全Review重点关注：SQL注入防护、XSS防护、CSRF Token、权限校验、敏感数据加密、租户隔离验证。安全Review通常由安全工程师或架构师执行，可以Block任何PR。

## 反模式警示

- **反模式1: Rubber Stamp Review(橡皮图章式Review）**: 不阅读代码就点击Approved。主要原因有：PR太大不想看、信任作者、时间紧迫。这完全失去了Code Review的价值。解决方案：PR控制在可Review的规模、轮流分配Reviewer、Review时间计入开发工时。

- **反模式2: 过于主观的风格争论**: "我觉得用for循环更好"、"我喜欢箭头函数不喜欢function关键字"等个人风格偏好不应出现在Review中。Code Review应当关注客观标准——功能正确性、安全性、性能、可维护性。风格问题交给格式化工具处理。

## 参考文献

- SmartBear (2024) "The State of Code Review 2024"
- Google Engineering Practices (2024) "How to do a Code Review"
- Michaela Greiler (2025) "Code Review Mastery"
