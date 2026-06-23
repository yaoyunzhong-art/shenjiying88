import { loadAdminGovernanceReadModel } from '../bootstrap';
import { AdminAlertsClient } from './alerts-client';

export default async function AdminAlertsPage() {
  const governance = await loadAdminGovernanceReadModel();
  return <AdminAlertsClient initialGovernance={governance} />;
}
