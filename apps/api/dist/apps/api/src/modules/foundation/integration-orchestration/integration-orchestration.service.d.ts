import { PrismaService } from '../../../prisma/prisma.service';
import { TrustGovernanceService } from '../trust-governance/trust-governance.service';
import type { FoundationModuleDescriptor } from '../foundation.types';
interface EventEnvelope {
    envelopeId: string;
    eventName: string;
    source: string;
    aggregateId?: string;
    idempotencyKey: string;
    occurredAt: string;
    receivedAt: string;
    payload: Record<string, unknown>;
    headers: Record<string, string>;
}
interface AcceptWebhookInput {
    eventId?: string;
    eventType?: string;
    payload: Record<string, unknown>;
    signature?: string;
    timestamp: string;
    rawBody?: string;
}
export declare class IntegrationOrchestrationService {
    private readonly prisma;
    private readonly trustGovernanceService;
    constructor(prisma: PrismaService, trustGovernanceService: TrustGovernanceService);
    private readonly webhookSources;
    publishEvent(eventName: string, payload: Record<string, unknown>, options?: {
        source?: string;
        aggregateId?: string;
        idempotencyKey?: string;
        headers?: Record<string, string>;
    }): Promise<{
        status: string;
        envelope: EventEnvelope;
        persistedEventId: any;
        guarantees: string[];
    }>;
    acceptWebhook(source: string, input: AcceptWebhookInput): Promise<{
        status: string;
        source: string;
        signatureVerified: boolean;
        idempotency: {
            key: string;
            source: string;
            eventId: string;
            eventType: string;
            firstSeenAt: string;
            envelopeId: string;
            status: "accepted";
            payloadChecksum: string;
        };
        pipeline: string[];
        envelope?: undefined;
    } | {
        status: string;
        source: string;
        signatureVerified: boolean;
        idempotency: {
            key: string;
            source: string;
            eventId: string;
            eventType: string;
            firstSeenAt: string;
            envelopeId: string;
            status: "accepted";
            payloadChecksum: string;
        };
        envelope: EventEnvelope;
        pipeline: string[];
    }>;
    getWebhookSourceCatalog(): {
        source: string;
        algorithm: "hmac-sha256";
        toleranceSeconds: number;
        description: string;
        secretRef: string;
    }[];
    getIdempotencyRecords(source?: string): Promise<any>;
    getEventEnvelopes(source?: string): Promise<any>;
    generateSignature(source: string, timestamp: string, rawBody: string): string;
    getDescriptor(): FoundationModuleDescriptor;
    private getWebhookSource;
    private buildPayloadChecksum;
    private stableStringify;
    private signaturesEqual;
    private deriveAggregateType;
    private buildEphemeralIdempotencyKey;
    private isDomainEventIdempotencyConflict;
    private toEventEnvelope;
    private toIdempotencyRecord;
    private getJsonRecord;
    private getHeaderValue;
    private toStringRecord;
    private toInputJsonValue;
}
export {};
//# sourceMappingURL=integration-orchestration.service.d.ts.map