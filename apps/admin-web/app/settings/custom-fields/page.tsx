import CustomFieldsClient from './custom-fields-client'
import { loadCustomFieldsSnapshot } from './custom-fields-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CustomFieldsPage() {
  const snapshot = await loadCustomFieldsSnapshot()

  return <CustomFieldsClient snapshot={snapshot} />
}
