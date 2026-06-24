import { EventListQueryDto, PublishEventDto, WebhookIngestDto } from './integration-orchestration.dto';
import { IntegrationOrchestrationService } from './integration-orchestration.service';
export declare class IntegrationOrchestrationController {
    private readonly integrationOrchestrationService;
    constructor(integrationOrchestrationService: IntegrationOrchestrationService);
    getWebhookSources(): unknown;
    getEvents(query: EventListQueryDto): Promise<unknown>;
    getIdempotencyRecords(query: EventListQueryDto): Promise<unknown>;
    publishEvent(body: PublishEventDto): Promise<unknown>;
    ingestWebhook(source: string, body: WebhookIngestDto): Promise<unknown>;
}
//# sourceMappingURL=integration-orchestration.controller.d.ts.map