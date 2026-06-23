import { loadAdminRuntimeOperationDetail } from '../../operations-view-model';
import { AdminRuntimeOperationDetailView } from './detail-presenter';

interface AdminRuntimeOperationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminRuntimeOperationDetailPage({
  params,
}: AdminRuntimeOperationDetailPageProps) {
  const { id } = await params;

  const snapshot = await loadAdminRuntimeOperationDetail(id);

  return (
    <AdminRuntimeOperationDetailView
      operationId={id}
      snapshot={snapshot}
    />
  );
}
