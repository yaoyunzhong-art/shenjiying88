import { Module } from '@nestjs/common'
import { AiDiagnosisController } from './ai-diagnosis.controller'
import { AiDiagnosisService } from './ai-diagnosis.service'
// Entity types (interface only, no TypeORM registration needed)
import type { DiagnosisEntity, DiagnosisBatch } from './ai-diagnosis.entity'
// Re-export for consumers
export type { DiagnosisEntity, DiagnosisBatch }

@Module({
  controllers: [AiDiagnosisController],
  providers: [AiDiagnosisService],
  exports: [AiDiagnosisService]
})
export class AiDiagnosisModule {}
