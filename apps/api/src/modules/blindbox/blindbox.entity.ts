export enum BlindBoxStatus {
  ACTIVE = 'active',
  DRAFT = 'draft',
  PAUSED = 'paused',
}

export enum DrawType {
  SINGLE = 'single',
  BATCH10 = 'batch10',
}

export interface BlindBoxPrize {
  prizeId: string;
  tierId: string;
  name: string;
  description: string;
  stock: number;
  weight: number;
  isMythic: boolean;
}

export interface BlindBoxTier {
  tierId: string;
  name: string;
  probability: number;
  prizes: Array<{
    prizeId: string;
    name: string;
    stock: number;
    weight: number;
  }>;
}

export interface BlindBoxPlan {
  planId: string;
  name: string;
  tiers: BlindBoxTier[];
  guaranteePityCount: number;
  status: BlindBoxStatus;
  createdAt: Date;
}

export interface BlindBoxDrawRecord {
  recordId: string;
  planId: string;
  userId: string;
  tier: string;
  prizeId: string;
  prizeName: string;
  drawType: DrawType;
  createdAt: Date;
}
