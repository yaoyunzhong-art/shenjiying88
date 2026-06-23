import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import type { ApiResult } from '@m5/types'
import { map, Observable } from 'rxjs'

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<ApiResult<unknown>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        message: 'OK',
        data,
        timestamp: new Date().toISOString()
      }))
    )
  }
}
