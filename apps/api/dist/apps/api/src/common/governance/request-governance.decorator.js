"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireRateLimit = exports.RATE_LIMIT_METADATA_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.RATE_LIMIT_METADATA_KEY = 'trust-governance:rate-limit';
const RequireRateLimit = (metadata) => (0, common_1.SetMetadata)(exports.RATE_LIMIT_METADATA_KEY, metadata);
exports.RequireRateLimit = RequireRateLimit;
//# sourceMappingURL=request-governance.decorator.js.map