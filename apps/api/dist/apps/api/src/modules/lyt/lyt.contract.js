"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toLytMemberProfileContract = toLytMemberProfileContract;
exports.toLytDeviceStatusContract = toLytDeviceStatusContract;
exports.toLytBootstrapContract = toLytBootstrapContract;
exports.toLytStandardizedWebhookEventContract = toLytStandardizedWebhookEventContract;
exports.toLytWebhookArchiveRecordContract = toLytWebhookArchiveRecordContract;
exports.toLytFixtureCatalogItemContract = toLytFixtureCatalogItemContract;
/** Map domain-level member profile to public contract. */
function toLytMemberProfileContract(profile) {
    return {
        id: profile.memberId,
        name: profile.nickname ?? profile.memberId,
        level: profile.levelName ?? 'N/A'
    };
}
/** Map device status to contract. */
function toLytDeviceStatusContract(input) {
    return {
        deviceId: input.deviceId,
        status: input.status
    };
}
/** Map service-level bootstrap to contract. */
function toLytBootstrapContract(bootstrap) {
    return {
        adapter: bootstrap.adapter,
        foundationDependencies: [...bootstrap.foundationDependencies],
        foundationContracts: [...bootstrap.foundationContracts],
        availableAdapters: bootstrap.availableAdapters?.map((item) => ({ ...item })),
        selectionStrategy: bootstrap.selectionStrategy
    };
}
function resolveCapability(sourceEventName) {
    if (sourceEventName.startsWith('member.'))
        return 'member';
    if (sourceEventName.startsWith('payment.'))
        return 'payment';
    if (sourceEventName.startsWith('order.'))
        return 'order';
    if (sourceEventName.startsWith('device.'))
        return 'device';
    if (sourceEventName.startsWith('gate.'))
        return 'gate';
    if (sourceEventName.startsWith('coin.'))
        return 'coin';
    if (sourceEventName.startsWith('coupon.'))
        return 'coupon';
    return 'unknown';
}
function resolveStandardizedEventName(sourceEventName) {
    switch (sourceEventName) {
        case 'member.sync':
            return 'member.profile-synced';
        case 'payment.success':
            return 'cashier.payment-succeeded';
        case 'payment.failed':
            return 'cashier.payment-failed';
        case 'order.updated':
            return 'cashier.order-updated';
        case 'device.status.changed':
            return 'store.device-status-changed';
        case 'gate.pass':
            return 'store.gate-pass-recorded';
        case 'coin.issue':
            return 'store.coin-issued';
        case 'coupon.redeemed':
            return 'promotion.coupon-redeemed';
        default:
            return 'lyt.unmapped-webhook-received';
    }
}
function toLytStandardizedWebhookEventContract(input) {
    const sourceEventName = input.eventType ?? 'lyt.webhook.received';
    const tenantId = typeof input.payload.tenantId === 'string' ? input.payload.tenantId : undefined;
    const brandId = typeof input.payload.brandId === 'string' ? input.payload.brandId : undefined;
    const storeId = typeof input.payload.storeId === 'string' ? input.payload.storeId : undefined;
    return {
        aggregateId: input.eventId,
        sourceEventName,
        standardizedEventName: resolveStandardizedEventName(sourceEventName),
        capability: resolveCapability(sourceEventName),
        tenantId,
        brandId,
        storeId,
        idempotencyKey: `lyt-standardized:${input.eventId}`,
        payload: {
            ...input.payload,
            sourceEventName,
            aggregateId: input.eventId
        }
    };
}
function toLytWebhookArchiveRecordContract(input) {
    return {
        source: input.source,
        eventId: input.standardizedEvent.aggregateId,
        sourceEventName: input.standardizedEvent.sourceEventName,
        standardizedEventName: input.standardizedEvent.standardizedEventName,
        capability: input.standardizedEvent.capability,
        fixtureKey: input.fixtureKey,
        signatureStatus: input.source === 'lyt-drill'
            ? 'not-applicable'
            : input.signatureVerified
                ? 'verified'
                : 'unverified',
        requestId: typeof input.rawPayload.requestId === 'string' ? input.rawPayload.requestId : undefined,
        tenantId: input.standardizedEvent.tenantId,
        brandId: input.standardizedEvent.brandId,
        storeId: input.standardizedEvent.storeId,
        occurredAt: typeof input.rawPayload.occurredAt === 'string' ? input.rawPayload.occurredAt : undefined,
        receivedAt: input.receivedAt ?? new Date().toISOString(),
        idempotencyKey: input.standardizedEvent.idempotencyKey,
        mappingVersion: 'lyt-field-mapping-spec-v1',
        rawPayload: { ...input.rawPayload },
        rawBody: input.rawBody,
        rawHeaders: input.rawHeaders ? { ...input.rawHeaders } : undefined,
        rawQuery: input.rawQuery ? { ...input.rawQuery } : undefined
    };
}
function toLytFixtureCatalogItemContract(input) {
    return {
        ...input,
        requiredRawFields: [...input.requiredRawFields],
        recommendedRawFields: [...input.recommendedRawFields],
        requiredHeaders: [...input.requiredHeaders],
        recommendedHeaders: [...input.recommendedHeaders],
        requiredQueryParams: [...input.requiredQueryParams],
        recommendedQueryParams: [...input.recommendedQueryParams],
        standardFieldChecklist: [...input.standardFieldChecklist],
        schemaChecklist: [...input.schemaChecklist],
        archiveChecklist: [...input.archiveChecklist],
        missingSampleFields: [...input.missingSampleFields],
        missingChecklistItems: [...input.missingChecklistItems],
        samplePayload: { ...input.samplePayload },
        sampleHeaders: { ...input.sampleHeaders },
        sampleQueryParams: { ...input.sampleQueryParams }
    };
}
//# sourceMappingURL=lyt.contract.js.map