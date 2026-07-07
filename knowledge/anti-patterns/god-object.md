# Anti-Pattern · God Object (上帝对象)

> 创建: 2026-06-26 · Pulse-68 Day 2
> 严重度: 🟠 P1
> 来源: Phase-15+ MemberService / OrderService 监控

---

## 1. 🚨 反模式

单个 class / module 承担过多职责:
- ❌ 单一 class > 1000 行
- ❌ 单一 Service > 20 个 public 方法
- ❌ 单一 Controller > 10 个 endpoint
- ❌ 改动一处必影响多处

---

## 2. ❌ 反例

```typescript
// ❌ God Service
@Injectable()
export class MemberService {
  // 注册 / 登录 / 修改资料 / 上传头像 / 改密码 / 重置密码 / 绑定手机
  // 发送验证码 / 实名认证 / 会员等级 / 积分 / 优惠券 / 推荐
  // 列表 / 详情 / 搜索 / 导出 / 批量 / 软删 / 恢复
  async register() {}      // 1
  async login() {}         // 2
  async updateProfile() {} // 3
  async uploadAvatar() {}  // 4
  async changePassword() {} // 5
  // ... 20+ 方法
}
```

**问题**:
- 难测试 (mock 一堆依赖)
- 难维护 (改密码逻辑影响注册)
- 难复用 (无法单独用 `changePassword`)
- 多人协作冲突

---

## 3. ✅ 正确做法: 按职责拆分

```typescript
// ✅ 按 bounded context 拆分
@Injectable()
export class MemberAuthService {
  async login() {}
  async changePassword() {}
  async resetPassword() {}
  async sendVerificationCode() {}
}

@Injectable()
export class MemberProfileService {
  async updateProfile() {}
  async uploadAvatar() {}
  async verifyIdentity() {}
}

@Injectable()
export class MemberQueryService {
  async findById() {}
  async list() {}
  async search() {}
}

@Injectable()
export class MemberPointsService {
  async award() {}
  async deduct() {}
  async queryBalance() {}
}
```

---

## 4. ✅ 拆分原则

| 维度 | 拆分依据 |
|---|---|
| 业务领域 | Auth / Profile / Order / Points |
| 操作类型 | Command / Query (CQRS) |
| 频率 | Hot path / Cold path |
| 变更频率 | 高频变更 / 稳定 |

---

## 5. 🔍 检测方法

```bash
# 行数检查
wc -l apps/api/src/modules/**/*.service.ts | sort -n | tail -10

# 方法数检查
grep -c "^\s*async\s\+\w\+" apps/api/src/modules/member/member.service.ts
```

**阈值**:
- > 500 行 → 警告
- > 1000 行 → 必须拆分
- > 20 public 方法 → 必须拆分

---

## 6. 🔗 关联

- [cqrs-pattern.md](../patterns/cqrs-pattern.md) · 读写分离
