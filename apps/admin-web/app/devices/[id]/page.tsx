import { DeviceDetailClient } from './device-detail-client';

export default async function DeviceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DeviceDetailClient deviceId={id} />;
}
