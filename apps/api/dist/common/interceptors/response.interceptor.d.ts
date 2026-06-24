import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import type { ApiResult } from '@m5/types';
import { Observable } from 'rxjs';
export declare class ResponseInterceptor implements NestInterceptor {
    intercept(_context: ExecutionContext, next: CallHandler): Observable<ApiResult<unknown>>;
}
//# sourceMappingURL=response.interceptor.d.ts.map