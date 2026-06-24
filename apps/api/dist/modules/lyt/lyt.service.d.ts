import { FoundationService } from '../foundation/foundation.service';
import { MockLytAdapter } from './adapters/mock-lyt.adapter';
export declare class LytService {
    private readonly adapter;
    private readonly foundationService;
    constructor(adapter: MockLytAdapter, foundationService: FoundationService);
    getAdapter(): MockLytAdapter;
    getBootstrap(): {
        adapter: string;
        foundationDependencies: import("@m5/types").FoundationModuleKey[];
        foundationContracts: string[];
    };
}
//# sourceMappingURL=lyt.service.d.ts.map