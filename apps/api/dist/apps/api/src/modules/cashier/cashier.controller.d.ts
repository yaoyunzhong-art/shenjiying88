import type { RequestTenantContext } from '../tenant/tenant.types';
import { CashierPaymentCallbackDto, CreateCashierOrderDto, CreateCashierPaymentDto } from './cashier.dto';
import { CashierService } from './cashier.service';
export declare class CashierController {
    private readonly cashierService;
    constructor(cashierService: CashierService);
    listOrders(tenantContext: RequestTenantContext): import("./cashier.entity").CashierOrder[];
    getOrder(orderId: string, tenantContext: RequestTenantContext): import("./cashier.entity").CashierOrder;
    createOrder(tenantContext: RequestTenantContext, body: CreateCashierOrderDto): Promise<import("./cashier.entity").CashierOrder>;
    createPayment(orderId: string, body: CreateCashierPaymentDto): Promise<import("./cashier.entity").CashierPayment>;
    listPayments(tenantContext: RequestTenantContext): import("./cashier.entity").CashierPayment[];
    applyPaymentCallback(body: CashierPaymentCallbackDto): Promise<{
        order: import("./cashier.entity").CashierOrder;
        payment: import("./cashier.entity").CashierPayment;
    }>;
}
//# sourceMappingURL=cashier.controller.d.ts.map