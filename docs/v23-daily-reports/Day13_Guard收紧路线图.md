# IdentityAccessGuard 收紧路线图

## 当前状态 (Day13-T3修复后)
- 默认放行：未注解controller自动通过
- 200+ controller无@Public/@Roles/@Permissions/@TenantScope

## 目标
- 默认拒绝：未注解controller返回401
- 所有200+ controller显式标注
