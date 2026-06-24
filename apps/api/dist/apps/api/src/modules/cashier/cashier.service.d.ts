import { IntegrationOrchestrationService } from '../foundation/integration-orchestration/integration-orchestration.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { MemberService } from '../member/member.service';
import type { RequestTenantContext } from '../tenant/tenant.types';
import type { CashierPaymentCallbackDto, CreateCashierOrderDto, CreateCashierPaymentDto } from './cashier.dto';
import { CashierOrderCloseReason, type CashierOrder, type CashierPayment } from './cashier.entity';
export declare class CashierService {
    private readonly memberService;
    private readonly loyaltyService?;
    private readonly integrationOrchestrationService?;
    constructor(memberService: MemberService, loyaltyService?: LoyaltyService | undefined, integrationOrchestrationService?: IntegrationOrchestrationService | undefined);
    private ensureMemberExists;
    private publishEvent;
    createOrder(tenantContext: RequestTenantContext, input: CreateCashierOrderDto): Promise<CashierOrder>;
    listOrders(tenantContext: RequestTenantContext): CashierOrder[];
    getOrder(orderId: string, tenantContext: RequestTenantContext): CashierOrder | undefined;
    createPayment(orderId: string, input: CreateCashierPaymentDto): Promise<CashierPayment>;
    listPayments(tenantContext: RequestTenantContext): CashierPayment[];
    listOrderPayments(orderId: string, tenantContext: RequestTenantContext): CashierPayment[];
    getLatestPayment(orderId: string, tenantContext: RequestTenantContext): CashierPayment | undefined;
    applyPaymentCallback(input: CashierPaymentCallbackDto): Promise<{
        order: CashierOrder;
        payment: CashierPayment;
    }>;
    closeTimedOutOrder(orderId: string, tenantContext: RequestTenantContext, reason?: CashierOrderCloseReason): Promise<{
        order: CashierOrder;
        payment?: CashierPayment;
    }>;
    closeOrder(orderId: string, tenantContext: RequestTenantContext, input?: {
        reason?: string;
        operator?: string;
    }): Promise<{
        order: CashierOrder;
        payment?: CashierPayment;
    }>;
    resetCashierStoresForTests(): void;
}
//# sourceMappingURL=cashier.service.d.ts.map