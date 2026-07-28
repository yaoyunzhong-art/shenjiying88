import DeviceFormShellClient from './device-form-client'
import { loadDeviceFormSnapshot } from './device-form-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DeviceFormPage() {
  const snapshot = await loadDeviceFormSnapshot()
  return <DeviceFormShellClient snapshot={snapshot} />
}
