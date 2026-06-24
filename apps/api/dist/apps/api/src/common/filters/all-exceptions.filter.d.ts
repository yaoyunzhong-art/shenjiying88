import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { RequestGovernanceService } from '../governance/request-governance.service';
export declare class AllExceptionsFilter implements ExceptionFilter {
    private readonly requestGovernanceService;
    constructor(requestGovernanceService: RequestGovernanceService);
    catch(exception: unknown, host: ArgumentsHost): void;
}
//# sourceMappingURL=all-exceptions.filter.d.ts.map