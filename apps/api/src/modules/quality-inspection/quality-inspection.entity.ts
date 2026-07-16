// ── Quality Inspection Enums ──

export enum InspectionType {
  Incoming = 'INCOMING',
  Outgoing = 'OUTGOING',
  InProcess = 'IN_PROCESS',
  Final = 'FINAL'
}

export enum InspectionResult {
  Pass = 'PASS',
  Fail = 'FAIL',
  Conditional = 'CONDITIONAL'
}

export enum Severity {
  Critical = 'CRITICAL',
  Major = 'MAJOR',
  Minor = 'MINOR',
  Observation = 'OBSERVATION'
}

// ── Defect ──

export interface Defect {
  id: string
  code: string
  description: string
  severity: Severity
}

// ── InspectionRecord ──

export interface InspectionRecord {
  id: string
  inspectNo: string
  type: InspectionType
  itemName: string
  itemBatch: string
  result: InspectionResult
  severity: Severity
  defects: Defect[]
  inspector: string
  inspectedAt: string
  notes?: string
  tenantId: string
  createdAt: string
}
