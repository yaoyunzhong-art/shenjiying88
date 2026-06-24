import { NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import type { TenantAwareRequest } from './tenant.types';
export declare class TenantMiddleware implements NestMiddleware {
    use(req: TenantAwareRequest, _res: Response, next: NextFunction): void;
}
//# sourceMappingURL=tenant.middleware.d.ts.map