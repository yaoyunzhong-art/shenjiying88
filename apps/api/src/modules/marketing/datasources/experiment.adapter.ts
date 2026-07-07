import { Injectable } from '@nestjs/common'
import type { TenantId, ABExperiment, ABAssignment, ABVariantType } from '../marketing.entity'

/**
 * Phase-42 T172: ExperimentAdapter
 * A/B 实验持久化 + 流量分配记录
 */
@Injectable()
export class ExperimentAdapter {
  private experiments = new Map<string, ABExperiment>()
  private assignments = new Map<string, ABAssignment>()

  seed(experiments: ABExperiment[]): void {
    for (const e of experiments) {
      this.experiments.set(e.id, { ...e })
    }
  }

  save(experiment: ABExperiment): ABExperiment {
    this.experiments.set(experiment.id, { ...experiment })
    return experiment
  }

  query(tenantId: TenantId, experimentId: string): ABExperiment | null {
    const e = this.experiments.get(experimentId)
    if (!e || e.tenantId !== tenantId) return null
    return { ...e }
  }

  queryAny(experimentId: string): ABExperiment | null {
    const e = this.experiments.get(experimentId)
    return e ? { ...e } : null
  }

  queryByTenant(tenantId: TenantId): ABExperiment[] {
    return Array.from(this.experiments.values())
      .filter(e => e.tenantId === tenantId)
      .map(e => ({ ...e }))
  }

  queryByCampaign(tenantId: TenantId, campaignId: string): ABExperiment[] {
    return Array.from(this.experiments.values())
      .filter(e => e.tenantId === tenantId && e.campaignId === campaignId)
      .map(e => ({ ...e }))
  }

  recordAssignment(experimentId: string, memberId: string, variant: ABVariantType): ABAssignment {
    const key = `${experimentId}:${memberId}`
    const existing = this.assignments.get(key)
    if (existing) return existing
    const assignment: ABAssignment = {
      experimentId,
      memberId,
      variant,
      assignedAt: new Date().toISOString()
    }
    this.assignments.set(key, assignment)
    return assignment
  }

  getAssignment(experimentId: string, memberId: string): ABAssignment | null {
    const key = `${experimentId}:${memberId}`
    return this.assignments.get(key) || null
  }

  countAssignments(experimentId: string, variant: ABVariantType): number {
    let n = 0
    for (const a of this.assignments.values()) {
      if (a.experimentId === experimentId && a.variant === variant) n++
    }
    return n
  }

  reset(): void {
    this.experiments.clear()
    this.assignments.clear()
  }
}