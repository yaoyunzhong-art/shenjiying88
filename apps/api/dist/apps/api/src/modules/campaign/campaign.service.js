"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignService = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const loyalty_service_1 = require("../loyalty/loyalty.service");
const member_service_1 = require("../member/member.service");
const campaign_entity_1 = require("./campaign.entity");
const campaignPlanStore = new Map();
const campaignDispatchStore = new Map();
let CampaignService = class CampaignService {
    memberService;
    loyaltyService;
    constructor(memberService, loyaltyService) {
        this.memberService = memberService;
        this.loyaltyService = loyaltyService;
    }
    // ── Plan management ────────────────────────────────────────────────
    registerCampaign(input) {
        if (input.actions.length === 0) {
            throw new Error('Campaign must declare at least one action');
        }
        for (const [index, action] of input.actions.entries()) {
            this.validateAction(action, index);
        }
        const now = new Date().toISOString();
        const plan = {
            planId: `campaign-${(0, node_crypto_1.randomUUID)()}`,
            tenantContext: input.tenantContext,
            code: input.code,
            title: input.title,
            description: input.description,
            status: campaign_entity_1.CampaignStatus.Draft,
            triggerEvent: input.triggerEvent,
            conditions: input.conditions,
            actions: input.actions,
            priority: input.priority ?? 100,
            scheduledStart: input.scheduledStart,
            scheduledEnd: input.scheduledEnd,
            createdAt: now,
            updatedAt: now
        };
        campaignPlanStore.set(plan.planId, plan);
        return plan;
    }
    updateCampaignStatus(planId, status, tenantId) {
        const plan = campaignPlanStore.get(planId);
        if (!plan || plan.tenantContext.tenantId !== tenantId) {
            throw new Error(`Campaign plan not found: ${planId}`);
        }
        this.assertValidStatusTransition(plan.status, status);
        plan.status = status;
        plan.updatedAt = new Date().toISOString();
        campaignPlanStore.set(planId, plan);
        return plan;
    }
    listCampaigns(tenantId, filter) {
        return Array.from(campaignPlanStore.values())
            .filter((plan) => plan.tenantContext.tenantId === tenantId)
            .filter((plan) => (filter?.status ? plan.status === filter.status : true))
            .filter((plan) => (filter?.triggerEvent ? plan.triggerEvent === filter.triggerEvent : true))
            .sort((a, b) => a.priority - b.priority);
    }
    getCampaign(planId, tenantId) {
        const plan = campaignPlanStore.get(planId);
        if (!plan || plan.tenantContext.tenantId !== tenantId)
            return undefined;
        return plan;
    }
    listDispatches(tenantId, filter) {
        return Array.from(campaignDispatchStore.values())
            .filter((dispatch) => dispatch.tenantContext.tenantId === tenantId)
            .filter((dispatch) => (filter?.planId ? dispatch.planId === filter.planId : true))
            .filter((dispatch) => (filter?.memberId ? dispatch.memberId === filter.memberId : true))
            .filter((dispatch) => (filter?.status ? dispatch.status === filter.status : true))
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    // ── Trigger evaluation & dispatch ──────────────────────────────────
    evaluateTriggers(event) {
        const tenantId = event.tenantContext.tenantId;
        // Derive scope fields from tenantContext when not explicitly supplied, so
        // BrandScope/StoreScope conditions can match against tenant-scoped events.
        const enrichedEvent = {
            ...event,
            brandId: event.brandId ?? event.tenantContext.brandId,
            storeId: event.storeId ?? event.tenantContext.storeId
        };
        const candidateCampaigns = Array.from(campaignPlanStore.values())
            .filter((plan) => plan.tenantContext.tenantId === tenantId)
            .filter((plan) => plan.status === campaign_entity_1.CampaignStatus.Active)
            .filter((plan) => plan.triggerEvent === enrichedEvent.eventName)
            .filter((plan) => this.isWithinScheduledWindow(plan))
            .filter((plan) => this.matchesConditions(plan.conditions, enrichedEvent))
            .sort((a, b) => b.priority - a.priority);
        const dispatches = [];
        let dispatchedActions = 0;
        let skippedActions = 0;
        let failedActions = 0;
        for (const campaign of candidateCampaigns) {
            for (const [index, action] of campaign.actions.entries()) {
                const idempotencyKey = `${campaign.planId}:${index}:${event.memberId ?? '-'}:${event.orderId ?? '-'}`;
                const existing = Array.from(campaignDispatchStore.values()).find((d) => d.planId === campaign.planId &&
                    d.actionIndex === index &&
                    d.memberId === event.memberId &&
                    d.orderId === event.orderId);
                if (existing) {
                    skippedActions += 1;
                    dispatches.push(existing);
                    continue;
                }
                const dispatch = this.dispatchAction({
                    campaign,
                    actionIndex: index,
                    action,
                    event,
                    idempotencyKey
                });
                dispatches.push(dispatch);
                if (dispatch.status === campaign_entity_1.CampaignActionStatus.Dispatched)
                    dispatchedActions += 1;
                else if (dispatch.status === campaign_entity_1.CampaignActionStatus.Skipped)
                    skippedActions += 1;
                else if (dispatch.status === campaign_entity_1.CampaignActionStatus.Failed)
                    failedActions += 1;
            }
        }
        return {
            matchedCampaigns: candidateCampaigns.length,
            dispatchedActions,
            skippedActions,
            failedActions,
            dispatches
        };
    }
    // ── Internals ──────────────────────────────────────────────────────
    validateAction(action, index) {
        switch (action.kind) {
            case campaign_entity_1.CampaignActionKind.AwardPoints:
                if (!action.params.pointsAmount || action.params.pointsAmount <= 0) {
                    throw new Error(`Campaign action[${index}] (AwardPoints) requires positive pointsAmount`);
                }
                break;
            case campaign_entity_1.CampaignActionKind.IssueCoupon:
                if (!action.params.couponPlanId) {
                    throw new Error(`Campaign action[${index}] (IssueCoupon) requires couponPlanId`);
                }
                break;
            case campaign_entity_1.CampaignActionKind.IssueBlindbox:
                if (!action.params.blindboxPlanId) {
                    throw new Error(`Campaign action[${index}] (IssueBlindbox) requires blindboxPlanId`);
                }
                break;
            case campaign_entity_1.CampaignActionKind.RecommendTag:
                if (!action.params.tagCode) {
                    throw new Error(`Campaign action[${index}] (RecommendTag) requires tagCode`);
                }
                break;
        }
    }
    assertValidStatusTransition(from, to) {
        const validTransitions = {
            [campaign_entity_1.CampaignStatus.Draft]: [campaign_entity_1.CampaignStatus.Scheduled, campaign_entity_1.CampaignStatus.Active, campaign_entity_1.CampaignStatus.Paused],
            [campaign_entity_1.CampaignStatus.Scheduled]: [campaign_entity_1.CampaignStatus.Active, campaign_entity_1.CampaignStatus.Paused, campaign_entity_1.CampaignStatus.Draft, campaign_entity_1.CampaignStatus.Completed],
            [campaign_entity_1.CampaignStatus.Active]: [campaign_entity_1.CampaignStatus.Paused, campaign_entity_1.CampaignStatus.Completed],
            [campaign_entity_1.CampaignStatus.Paused]: [campaign_entity_1.CampaignStatus.Active, campaign_entity_1.CampaignStatus.Completed, campaign_entity_1.CampaignStatus.Draft],
            [campaign_entity_1.CampaignStatus.Completed]: []
        };
        if (!validTransitions[from].includes(to)) {
            throw new Error(`Invalid campaign status transition: ${from} → ${to}`);
        }
    }
    isWithinScheduledWindow(plan) {
        const eventTime = new Date().toISOString();
        if (plan.scheduledStart && eventTime < plan.scheduledStart)
            return false;
        if (plan.scheduledEnd && eventTime > plan.scheduledEnd)
            return false;
        return true;
    }
    matchesConditions(conditions, event) {
        for (const condition of conditions) {
            switch (condition.type) {
                case campaign_entity_1.CampaignConditionType.MinOrderAmount:
                    if (typeof event.orderAmount !== 'number' || event.orderAmount < Number(condition.value)) {
                        return false;
                    }
                    break;
                case campaign_entity_1.CampaignConditionType.MemberLevel:
                    if (!event.memberLevel || !this.valueMatchesString(event.memberLevel, condition.value)) {
                        return false;
                    }
                    break;
                case campaign_entity_1.CampaignConditionType.StoreScope:
                    if (!event.storeId || !this.valueMatchesString(event.storeId, condition.value)) {
                        return false;
                    }
                    break;
                case campaign_entity_1.CampaignConditionType.BrandScope:
                    if (!event.brandId || !this.valueMatchesString(event.brandId, condition.value)) {
                        return false;
                    }
                    break;
            }
        }
        return true;
    }
    valueMatchesString(actual, expected) {
        if (typeof expected === 'string')
            return actual === expected;
        if (Array.isArray(expected))
            return expected.includes(actual);
        return false;
    }
    dispatchAction(input) {
        const { campaign, actionIndex, action, event } = input;
        const now = new Date().toISOString();
        let status = campaign_entity_1.CampaignActionStatus.Dispatched;
        let errorMessage;
        let resultRef;
        try {
            switch (action.kind) {
                case campaign_entity_1.CampaignActionKind.AwardPoints:
                    if (!event.memberId) {
                        status = campaign_entity_1.CampaignActionStatus.Skipped;
                        errorMessage = 'memberId is required for AwardPoints';
                    }
                    else if (!this.memberService) {
                        status = campaign_entity_1.CampaignActionStatus.Skipped;
                        errorMessage = 'MemberService is not configured';
                    }
                    else {
                        const amount = action.params.pointsAmount ?? 0;
                        const reason = action.params.pointsReason ?? campaign.code;
                        this.memberService.awardPoints(event.memberId, amount, event.tenantContext);
                        resultRef = `points+${amount}:${reason}`;
                    }
                    break;
                case campaign_entity_1.CampaignActionKind.IssueCoupon:
                    if (!event.memberId) {
                        status = campaign_entity_1.CampaignActionStatus.Skipped;
                        errorMessage = 'memberId is required for IssueCoupon';
                    }
                    else if (!this.loyaltyService) {
                        status = campaign_entity_1.CampaignActionStatus.Skipped;
                        errorMessage = 'LoyaltyService is not configured';
                    }
                    else {
                        const redemption = this.loyaltyService.issueCouponFromPlan({
                            tenantContext: event.tenantContext,
                            memberId: event.memberId,
                            planId: action.params.couponPlanId,
                            source: `campaign:${campaign.code}`
                        });
                        resultRef = redemption.redemptionId;
                    }
                    break;
                case campaign_entity_1.CampaignActionKind.IssueBlindbox:
                    if (!event.memberId) {
                        status = campaign_entity_1.CampaignActionStatus.Skipped;
                        errorMessage = 'memberId is required for IssueBlindbox';
                    }
                    else if (!this.loyaltyService) {
                        status = campaign_entity_1.CampaignActionStatus.Skipped;
                        errorMessage = 'LoyaltyService is not configured';
                    }
                    else {
                        const fulfillment = this.loyaltyService.issueBlindboxFromPlan({
                            tenantContext: event.tenantContext,
                            memberId: event.memberId,
                            planId: action.params.blindboxPlanId,
                            quantity: action.params.blindboxQuantity
                        });
                        resultRef = fulfillment.fulfillmentId;
                    }
                    break;
                case campaign_entity_1.CampaignActionKind.RecommendTag:
                    resultRef = `tag:${action.params.tagCode}`;
                    break;
            }
        }
        catch (error) {
            status = campaign_entity_1.CampaignActionStatus.Failed;
            errorMessage = error instanceof Error ? error.message : 'unknown-dispatch-error';
        }
        const dispatch = {
            dispatchId: `dispatch-${(0, node_crypto_1.randomUUID)()}`,
            planId: campaign.planId,
            actionIndex,
            tenantContext: event.tenantContext,
            memberId: event.memberId,
            orderId: event.orderId,
            paymentId: event.paymentId,
            triggerEvent: event.eventName,
            status,
            errorMessage,
            resultRef,
            createdAt: now
        };
        campaignDispatchStore.set(dispatch.dispatchId, dispatch);
        return dispatch;
    }
    resetCampaignStoresForTests() {
        campaignPlanStore.clear();
        campaignDispatchStore.clear();
    }
};
exports.CampaignService = CampaignService;
exports.CampaignService = CampaignService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [member_service_1.MemberService,
        loyalty_service_1.LoyaltyService])
], CampaignService);
//# sourceMappingURL=campaign.service.js.map