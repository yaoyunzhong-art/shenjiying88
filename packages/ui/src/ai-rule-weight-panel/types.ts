// ── AI Rule Weight Panel Types ──────────────────────────────────────────

export interface RuleWeightItem {
  id: string;
  name: string;
  description: string;
  currentWeight: number;   // 0-100
  adjustable: boolean;
  category: 'risk' | 'promotion' | 'member' | 'stock' | 'staff';
  enabled: boolean;
}

export interface WeightAdjustResult {
  ruleId: string;
  oldWeight: number;
  newWeight: number;
  impact: 'low' | 'medium' | 'high';
  affectedCount: number;
  previewImpact: string;
}

export interface AIRuleWeightPanelProps {
  rules: RuleWeightItem[];
  onWeightChange?: (ruleId: string, newWeight: number) => void;
  onBatchAdjust?: (adjustments: WeightAdjustResult[]) => void;
  onReset?: () => void;
  loading?: boolean;
  disabled?: boolean;
}
