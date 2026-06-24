import { MockLytAdapter } from './adapters/mock-lyt.adapter';
import { RealLytAdapter } from './adapters/real-lyt.adapter';
import { SandboxLytAdapter } from './adapters/sandbox-lyt.adapter';
import type { ILytAdapter } from './interfaces/lyt-adapter.interface';
import type { LytResolvedConnection } from './lyt.entity';
export interface LytAdapterSelection {
    adapterName: string;
    adapterMode: 'mock' | 'sandbox' | 'real';
    reason: string;
}
export declare class LytAdapterRegistry {
    private readonly mockAdapter;
    private readonly sandboxAdapter;
    private readonly realAdapter;
    constructor(mockAdapter: MockLytAdapter, sandboxAdapter: SandboxLytAdapter, realAdapter: RealLytAdapter);
    listAvailableAdapters(): Array<{
        adapterName: string;
        adapterMode: 'mock' | 'sandbox' | 'real';
    }>;
    resolveAdapterSelection(connection: LytResolvedConnection): LytAdapterSelection;
    getAdapterForConnection(connection: LytResolvedConnection): ILytAdapter;
    getDefaultAdapter(): ILytAdapter;
}
//# sourceMappingURL=lyt-adapter.registry.d.ts.map