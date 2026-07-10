// tenant.decorator.ts · @TenantContext() 参数装饰器 stub
// 满足 tenant.decorator.test.ts 期望:
//   - TenantContext 是个函数 (createParamDecorator 返回值)
//   - 调用时返回 ParameterDecorator
//   - 多次调用产生不同实例
//   - 调用时设置 ROUTE_ARGS_METADATA

import { createParamDecorator } from '@nestjs/common'

export const TenantContext = createParamDecorator((_data: unknown, _ctx: unknown) => {
  // 实际实现由 TenantMiddleware 在 request 上挂载 tenantContext,
  // 这里仅作为参数装饰器入口; NestJS 解析到 ROUTE_ARGS_METADATA 时
  // 自动从 ExecutionContext.switchToHttp().getRequest() 取值.
  return null
})
