export declare class PublishEventDto {
    eventName: string;
    source?: string;
    aggregateId?: string;
    idempotencyKey?: string;
    payload: Record<string, unknown>;
}
export declare class WebhookIngestDto {
    eventId?: string;
    eventType?: string;
    signature: string;
    timestamp: string;
    rawBody?: string;
    payload: Record<string, unknown>;
}
export declare class EventListQueryDto {
    source?: string;
}
//# sourceMappingURL=integration-orchestration.dto.d.ts.map