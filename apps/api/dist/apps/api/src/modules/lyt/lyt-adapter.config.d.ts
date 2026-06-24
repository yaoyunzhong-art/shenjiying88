import type { ConfigService } from '@nestjs/config';
type LytHttpAdapterMode = 'sandbox' | 'real';
export interface LytHttpAdapterConfigSnapshot {
    baseUrl: string;
    signingSecret: string;
    timeoutMs: number;
    maxRetries: number;
}
export declare function resolveLytHttpAdapterConfig(mode: LytHttpAdapterMode, configService?: Pick<ConfigService, 'get'>): LytHttpAdapterConfigSnapshot;
export {};
//# sourceMappingURL=lyt-adapter.config.d.ts.map