import { LytService } from './lyt.service';
export declare class LytController {
    private readonly lytService;
    constructor(lytService: LytService);
    getBootstrap(): {
        adapter: string;
        foundationDependencies: import("@m5/types").FoundationModuleKey[];
        foundationContracts: string[];
    };
    getConnection(storeId: string): import("./adapters/mock-lyt.adapter").MockLytAdapter;
    getDeviceStatus(deviceId: string): Promise<{
        deviceId: string;
        status: "ONLINE";
    }>;
}
//# sourceMappingURL=lyt.controller.d.ts.map