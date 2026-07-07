import { Controller, Get, Post, Query, Param, Body } from '@nestjs/common';
import { Observable } from 'rxjs';
import { BlindboxService } from './blindbox.service';
import {
  BlindBoxPlan,
  BlindBoxDrawRecord,
} from './blindbox.entity';

interface CreatePlanDto {
  name: string;
  tiers: {
    tierId: string;
    name: string;
    probability: number;
    prizes: Array<{
      prizeId: string;
      name: string;
      stock: number;
      weight: number;
    }>;
  }[];
  guaranteePityCount: number;
}

interface DrawResult {
  success: boolean;
  data?: BlindBoxDrawRecord | BlindBoxDrawRecord[];
  message?: string;
}

@Controller('blindbox')
export class BlindboxController {
  constructor(private readonly blindboxService: BlindboxService) {}

  @Post('plans')
  createPlan(@Body() dto: CreatePlanDto): Observable<BlindBoxPlan> {
    return this.blindboxService.createPlan({
      name: dto.name,
      tiers: dto.tiers.map((t) => ({
        tierId: t.tierId,
        name: t.name,
        probability: t.probability,
        prizes: t.prizes.map((p) => ({
          prizeId: p.prizeId,
          name: p.name,
          stock: p.stock,
          weight: p.weight,
        })),
      })),
      guaranteePityCount: dto.guaranteePityCount,
    });
  }

  @Post(':planId/draw')
  draw(
    @Param('planId') planId: string,
    @Body() body: { userId: string },
  ): Observable<DrawResult> {
    return new Observable((observer) => {
      this.blindboxService.drawSingle(body.userId, planId).subscribe({
        next: (record) => {
          if (record) {
            observer.next({ success: true, data: record });
          } else {
            observer.next({ success: false, message: 'Plan not found or not active' });
          }
          observer.complete();
        },
        error: (err) => {
          observer.next({ success: false, message: err.message });
          observer.complete();
        },
      });
    });
  }

  @Post(':planId/draw/batch')
  drawBatch(
    @Param('planId') planId: string,
    @Body() body: { userId: string },
  ): Observable<DrawResult> {
    return new Observable((observer) => {
      this.blindboxService.drawBatch10(body.userId, planId).subscribe({
        next: (records) => {
          if (records.length > 0) {
            observer.next({ success: true, data: records });
          } else {
            observer.next({ success: false, message: 'Plan not found or not active' });
          }
          observer.complete();
        },
        error: (err) => {
          observer.next({ success: false, message: err.message });
          observer.complete();
        },
      });
    });
  }

  @Get(':planId/probabilities')
  getProbabilities(
    @Param('planId') planId: string,
  ): Observable<{ tiers: { name: string; probability: number }[]; sum: number } | null> {
    return this.blindboxService.getProbability公示(planId);
  }

  @Get(':planId/prize-pool')
  getPrizePool(
    @Param('planId') planId: string,
  ): Observable<{ planId: string; name: string; prizePools: any[] } | null> {
    return this.blindboxService.getPrizePool(planId);
  }

  @Get(':planId/history')
  getHistory(
    @Param('planId') planId: string,
    @Query('userId') userId: string,
    @Query('limit') limit?: string,
  ): Observable<BlindBoxDrawRecord[]> {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    return this.blindboxService.getDrawHistory(userId, planId, parsedLimit);
  }
}
