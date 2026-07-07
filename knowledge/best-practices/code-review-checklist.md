# Best Practice · Code Review Checklist (代码评审清单)

> 创建: 2026-06-26 · Pulse-68 Day 2
> 强制: 🟡 P1 (PR 必查)
> 来源: 神机营 V5.1 Approver + Phase-15+ 实战

---

## 1. 🎯 目标

代码评审一致性:
- ✅ Approver 高效评审 (< 30min / PR)
- ✅ 关键问题不遗漏
- ✅ 标准统一 (团队共识)

---

## 2. ✅ 评审流程

```
PR 提交 → 自动检查 (CI)
  ↓ CI 通过
人工评审 (Approver)
  ↓ 批准 / 修改建议
合并 (merge)
  ↓
自动部署
```

---

## 3. 📐 Checklist (15 项必查)

### 3.1 业务正确性

- [ ] **需求匹配**:PR 解决了 issue 中描述的问题
- [ ] **边界条件**:null / empty / max / 特殊值
- [ ] **异常路径**:抛错 / timeout / 重试
- [ ] **数据完整性**:事务一致性 / 外键约束

### 3.2 安全

- [ ] **多租户隔离**:所有查询含 tenantId
- [ ] **输入校验**:DTO class-validator 完整
- [ ] **SQL 注入**:无字符串拼接 (用 ORM)
- [ ] **敏感信息**:无明文密码 / token / 卡号
- [ ] **审计日志**:关键操作已记录

### 3.3 性能

- [ ] **无 N+1 查询**:用 JOIN / relations
- [ ] **索引**:高频查询有索引
- [ ] **缓存**:热点数据已缓存
- [ ] **并发**:独立操作 Promise.all

### 3.4 可维护性

- [ ] **命名**:语义清晰 (无需注释即可理解)
- [ ] **函数长度**:单函数 ≤ 50 行
- [ ] **嵌套层级**:≤ 3 层
- [ ] **DRY**:无重复代码 (≥ 3 处考虑抽象)
- [ ] **SOLID**:依赖注入 / 接口隔离
- [ ] **注释**:复杂逻辑有 WHY (不是 WHAT)

### 3.5 测试

- [ ] **覆盖率**:新代码 ≥ 80%
- [ ] **测试命名**:清晰描述场景
- [ ] **边界用例**:happy + sad path 都覆盖

### 3.6 文档

- [ ] **API 文档**:Swagger / 注释完整
- [ ] **CHANGELOG**:破坏性变更已记录
- [ ] **迁移脚本**:DB 变更含迁移

---

## 4. 📐 评审话术

```markdown
✅ 同意:
- LGTM (Looks Good To Me)
- Approved

⚠️ 修改建议:
- Nit: 变量名 typo
- Suggest: 用 existing helper X 替代重复代码
- Question: 为何用 Y 而非 Z?

❌ 阻塞:
- Blocker: 多租户隔离缺失 (跨租户数据泄漏风险)
- Blocker: 测试覆盖率 < 60%
- Re-request: 修改后请重新提交评审
```

---

## 5. 📐 AI Code Reviewer (Phase-19)

```typescript
// apps/api/src/modules/ai-review/ai-review.service.ts
@Injectable()
export class AIReviewService {
  async reviewPRDiff(params: PRDiffReviewParams): Promise<ReviewResult> {
    // 1. RAG 检索相关代码上下文
    const codeContext = await this.retrievalService.retrieveCode(params.files.map(f => f.filePath))

    // 2. RAG 检索知识库上下文
    const knowledgeContext = await this.retrievalService.retrieveKnowledge(
      this.extractKeywords(params.prTitle + params.prDescription),
      topK: 5
    )

    // 3. LLM 评审
    const result = await this.llmProvider.generate({
      systemPrompt: REVIEW_DIFF_SYSTEM,
      userPrompt: REVIEW_DIFF_USER_TEMPLATE
        .replace('{prTitle}', params.prTitle)
        .replace('{filesContext}', this.formatFiles(params.files))
        .replace('{knowledgeContext}', knowledgeContext),
      temperature: 0.2,
      cacheKey: `review:${params.prId}`,
    })

    // 4. 解析 → ReviewOutput
    return this.parseReviewOutput(result.content)
  }
}
```

**输出**:
- 自动识别问题 (severity / category / filePath / suggestion)
- 引用知识库 (referencedLesson)
- 评分 (overallScore 1-10)
- 决定是否需 Approver 复审

---

## 6. ✅ 必须遵守

- [ ] 所有 PR 至少 1 Approver 批准
- [ ] 阻塞级问题必须解决才能合并
- [ ] 修改建议必须回复 (接受 / 拒绝 + 理由)
- [ ] 评审 SLA < 24h
- [ ] AI Review 仅辅助,人工最终决定

---

## 7. 🔗 关联

- [llm-integration.md](./llm-integration.md) · LLM 评审
- [testing-strategy.md](./testing-strategy.md) · 测试要求
- [security-checklist.md](./security-checklist.md) · 安全要求
