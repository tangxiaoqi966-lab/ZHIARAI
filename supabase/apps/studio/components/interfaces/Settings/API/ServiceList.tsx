import { AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Alert_Shadcn_, AlertTitle_Shadcn_ } from 'ui'

import { ScaffoldSection } from '@/components/layouts/Scaffold'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'
import { PostgrestConfig } from './PostgrestConfig'

export const ServiceList = () => {
  const { t } = useTranslation()
  const { data: project, isPending: isLoading } = useSelectedProjectQuery()

  return (
    <ScaffoldSection isFullWidth id="api-settings" className="gap-6">
      {!isLoading && project?.status !== PROJECT_STATUS.ACTIVE_HEALTHY ? (
        <Alert_Shadcn_ variant="destructive">
          <AlertCircle size={16} />
          <AlertTitle_Shadcn_>
            {t('settings.api_settings.unavailable_not_active')}
          </AlertTitle_Shadcn_>
        </Alert_Shadcn_>
      ) : (
        <PostgrestConfig />
      )}
    </ScaffoldSection>
  )
}
