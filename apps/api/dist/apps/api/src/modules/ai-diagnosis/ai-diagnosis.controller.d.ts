import { AiDiagnosisService } from './ai-diagnosis.service';
import type { DiagnosisBatch } from './ai-diagnosis.entity';
import { CreateDiagnosisDto, CreateDiagnosisBatchDto, UpdateDiagnosisDto, DiagnosisQueryDto, DiagnosisResponse, DiagnosisListResponse, DiagnosisBatchResponse, DiagnosisRiskReportResponse } from './ai-diagnosis.dto';
export declare class AiDiagnosisController {
    private readonly diagnosisService;
    constructor(diagnosisService: AiDiagnosisService);
    create(dto: CreateDiagnosisDto): DiagnosisResponse;
    list(query: DiagnosisQueryDto): DiagnosisListResponse;
    get(diagnosisId: string): DiagnosisResponse;
    update(diagnosisId: string, dto: UpdateDiagnosisDto): DiagnosisResponse;
    remove(diagnosisId: string): void;
    createBatch(dto: CreateDiagnosisBatchDto): DiagnosisBatchResponse;
    getBatch(batchId: string): DiagnosisBatchResponse;
    listBatches(engineId?: string, tenantId?: string): DiagnosisBatch[];
    riskReport(engineId?: string, tenantId?: string): DiagnosisRiskReportResponse;
}
//# sourceMappingURL=ai-diagnosis.controller.d.ts.map