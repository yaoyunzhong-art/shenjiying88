"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantContext = void 0;
const common_1 = require("@nestjs/common");
exports.TenantContext = (0, common_1.createParamDecorator)((_data, ctx) => {
    const req = ctx.switchToHttp().getRequest();
    return req.tenantContext;
});
//# sourceMappingURL=tenant.decorator.js.map