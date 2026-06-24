export const adminGovernanceApprovalsRoute = {
  href: '/approvals',
  detailHrefBase: '/approvals',
  backHref: '/approvals',
  title: '治理审批中心',
  description: '统一处理高风险 replay、审批执行与失败补偿等治理审批单。',
  emptyTitle: '审批单不存在',
  emptyMessage: (ticket: string) => `审批单 ${ticket} 不存在`,
} as const;

export function buildGovernanceApprovalDetailHref(ticket: string): string {
  return `${adminGovernanceApprovalsRoute.detailHrefBase}/${ticket}`;
}
