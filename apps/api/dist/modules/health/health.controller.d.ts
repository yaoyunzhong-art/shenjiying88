import { LytService } from '../lyt/lyt.service';
export declare class HealthController {
    private readonly lytService;
    constructor(lytService: LytService);
    getHealth(): Promise<{
        status: string;
        lytMode: string;
        sampleMember: import("@m5/domain").LytMemberProfile;
    }>;
}
//# sourceMappingURL=health.controller.d.ts.map