# Anti-Pattern · Leaky Abstraction (泄漏抽象)

> 创建: 2026-06-26 · Pulse-68 Day 2
> 严重度: 🟠 P1
> 来源: Phase-15+ ORM 泄漏 + LLM Provider 泄漏

---

## 1. 🚨 反模式

抽象层泄漏实现细节:
- ❌ Service 返回 ORM Entity (泄漏 schema)
- ❌ Repository 出现在 Controller (泄漏持久化)
- ❌ HTTP 状态码混入业务逻辑
- ❌ LLM Provider 出现在业务代码 (泄漏 AI 细节)

---

## 2. ❌ 反例

```typescript
// ❌ 反例 1: 返回 ORM Entity
@Controller('members')
export class MemberController {
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Member> {  // ⚠️ Entity 泄漏!
    return this.memberRepo.findOne(id)  // Controller 知道有 Repo!
  }
}

// ❌ 反例 2: Service 暴露 LLM Provider 细节
@Injectable()
export class AIReviewService {
  async reviewPR(): Promise<ClaudeResponse> {  // ⚠️ Claude 类型泄漏!
    return this.claudeProvider.generate(...)  // 业务代码依赖 Claude!
  }
}

// ❌ 反例 3: Controller 知道 DB 错误码
try {
  await this.userRepo.save(user)
} catch (err) {
  if (err.code === '23505') {  // ⚠️ PG unique violation 泄漏!
    throw new ConflictException('duplicate')
  }
}
```

---

## 3. ✅ 正确做法: 抽象 + 转换

```typescript
// ✅ Controller 只接 DTO
@Controller('members')
export class MemberController {
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<MemberResponseDto> {
    const member = await this.memberService.findById(id)
    return MemberResponseDto.fromEntity(member)  // Entity → DTO 转换
  }
}

// ✅ Service 返回业务类型 (隐藏 LLM)
@Injectable()
export class AIReviewService {
  async reviewPR(): Promise<ReviewOutput> {  // 业务类型
    const response = await this.llmProvider.generate(...)  // 内部隐藏 provider
    return this.parseReviewOutput(response)
  }
}

// ✅ 异常转换层
@Injectable()
export class UserService {
  async create(dto: CreateUserDto): Promise<User> {
    try {
      return await this.userRepo.save(dto)
    } catch (err) {
      if (this.isUniqueViolation(err)) {
        throw new BusinessException('USER_EXISTS', 'User already exists')  // 业务异常
      }
      throw err
    }
  }

  private isUniqueViolation(err: any): boolean {
    return err.code === '23505'  // 隔离在 service 内部
  }
}
```

---

## 4. 📐 抽象层级原则

```
Controller (HTTP 细节)
  ↓ DTO
Service (业务逻辑)
  ↓ Domain
Repository (持久化细节)
```

**每层只能依赖下一层**,不跨层调用。

---

## 5. ✅ 必须遵守

- [ ] Controller 不直接调用 Repository
- [ ] Controller 返回 DTO 而非 Entity
- [ ] Service 返回业务类型,隐藏 LLM / DB
- [ ] 错误在每层内部转换 (业务异常 vs 系统异常)
- [ ] ORM 注解不在 DTO 中
- [ ] Provider 类型不在业务代码中

---

## 6. 🔗 关联

- [api-design.md](../best-practices/api-design.md) · API 边界
- [god-object.md](./god-object.md) · 抽象不清导致 god
