"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireTenantScope = exports.RequirePermissions = exports.RequireRoles = exports.CurrentActor = exports.TENANT_SCOPE_METADATA_KEY = exports.PERMISSIONS_METADATA_KEY = exports.ROLES_METADATA_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.ROLES_METADATA_KEY = 'identity-access:roles';
exports.PERMISSIONS_METADATA_KEY = 'identity-access:permissions';
exports.TENANT_SCOPE_METADATA_KEY = 'identity-access:tenant-scope';
exports.CurrentActor = (0, common_1.createParamDecorator)((_data, ctx) => {
    const req = ctx.switchToHttp().getRequest();
    return req.actorContext;
});
const RequireRoles = (...roles) => (0, common_1.SetMetadata)(exports.ROLES_METADATA_KEY, roles);
exports.RequireRoles = RequireRoles;
const RequirePermissions = (...permissions) => (0, common_1.SetMetadata)(exports.PERMISSIONS_METADATA_KEY, permissions);
exports.RequirePermissions = RequirePermissions;
const RequireTenantScope = (metadata = {}) => (0, common_1.SetMetadata)(exports.TENANT_SCOPE_METADATA_KEY, metadata);
exports.RequireTenantScope = RequireTenantScope;
//# sourceMappingURL=identity-access.decorator.js.map