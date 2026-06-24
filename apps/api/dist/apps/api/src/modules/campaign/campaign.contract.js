"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toCampaignPlanContract = toCampaignPlanContract;
exports.toCampaignDispatchContract = toCampaignDispatchContract;
function toCampaignPlanContract(plan) {
    return {
        planId: plan.planId,
        tenantContext: plan.tenantContext,
        code: plan.code,
        title: plan.title,
        description: plan.description,
        status: plan.status,
        triggerEvent: plan.triggerEvent,
        conditions: plan.conditions,
        actions: plan.actions,
        priority: plan.priority,
        scheduledStart: plan.scheduledStart,
        scheduledEnd: plan.scheduledEnd,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt
    };
}
function toCampaignDispatchContract(dispatch) {
    return {
        dispatchId: dispatch.dispatchId,
        planId: dispatch.planId,
        actionIndex: dispatch.actionIndex,
        tenantContext: dispatch.tenantContext,
        memberId: dispatch.memberId,
        orderId: dispatch.orderId,
        paymentId: dispatch.paymentId,
        triggerEvent: dispatch.triggerEvent,
        status: dispatch.status,
        errorMessage: dispatch.errorMessage,
        resultRef: dispatch.resultRef,
        createdAt: dispatch.createdAt
    };
}
//# sourceMappingURL=campaign.contract.js.map