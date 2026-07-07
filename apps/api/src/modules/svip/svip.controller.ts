import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { Observable } from 'rxjs';
import { SvipService } from './svip.service';
import { SVIPPlan, SVIPSubscription, SVIPBenefit, SVIPBenefitType } from './svip.entity';

interface CreatePlanDto {
  name: string;
  price: number;
  durationDays: number;
  benefits: string[];
}

interface SubscribeDto {
  userId: string;
  planId: string;
}

interface UseBenefitDto {
  userId: string;
  benefitType: SVIPBenefitType;
}

@Controller('svip')
export class SvipController {
  constructor(private readonly svipService: SvipService) {}

  @Post('plans')
  createPlan(@Body() dto: CreatePlanDto): Observable<SVIPPlan> {
    return this.svipService.createPlan({
      name: dto.name,
      price: dto.price,
      durationDays: dto.durationDays,
      benefits: dto.benefits,
    });
  }

  @Get('plans')
  listPlans(): Observable<SVIPPlan[]> {
    return new Observable((observer) => {
      observer.next([]);
      observer.complete();
    });
  }

  @Post('subscribe')
  subscribe(@Body() dto: SubscribeDto): Observable<SVIPSubscription | null> {
    return this.svipService.subscribe(dto.userId, dto.planId);
  }

  @Get('subscription/:userId')
  getSubscription(@Param('userId') userId: string): Observable<SVIPSubscription | null> {
    return this.svipService.getSubscription(userId);
  }

  @Post(':subscriptionId/cancel')
  cancel(@Param('subscriptionId') subscriptionId: string): Observable<SVIPSubscription | null> {
    return this.svipService.cancelSubscription(subscriptionId);
  }

  @Post(':subscriptionId/renew')
  renew(@Param('subscriptionId') subscriptionId: string): Observable<SVIPSubscription | null> {
    return this.svipService.renewSubscription(subscriptionId);
  }

  @Post(':subscriptionId/benefit')
  useBenefit(
    @Param('subscriptionId') subscriptionId: string,
    @Body() dto: UseBenefitDto,
  ): Observable<SVIPBenefit | null> {
    return this.svipService.useBenefit(dto.userId, dto.benefitType);
  }

  @Get(':subscriptionId/benefits')
  getBenefits(@Param('subscriptionId') subscriptionId: string): Observable<SVIPBenefit[]> {
    return this.svipService.getBenefits(subscriptionId);
  }
}
