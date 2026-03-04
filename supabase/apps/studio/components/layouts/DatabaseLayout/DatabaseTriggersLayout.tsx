import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'

import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import DatabaseLayout from './DatabaseLayout'

type DatabaseTriggersLayoutProps = PropsWithChildren

const DatabaseTriggersLayout = ({ children }: DatabaseTriggersLayoutProps) => {
  const { t } = useTranslation()
  const { ref } = useParams()
  const { can: canReadTriggers, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_READ,
    'triggers'
  )

  const navigationItems = [
    {
      label: t('database.pages.triggers.tabs.data'),
      href: `/project/${ref}/database/triggers/data`,
    },
    {
      label: t('database.pages.triggers.tabs.event'),
      href: `/project/${ref}/database/triggers/event`,
    },
  ]

  return (
    <DatabaseLayout title={t('navigation.database_label')}>
      {isPermissionsLoaded && !canReadTriggers ? (
        <NoPermission isFullPage resourceText={t('database.pages.triggers.resource_text')} />
      ) : (
        <PageLayout
          title={t('database.pages.triggers.title')}
          subtitle={t('database.pages.triggers.description')}
          navigationItems={navigationItems}
          size="large"
        >
          {children}
        </PageLayout>
      )}
    </DatabaseLayout>
  )
}

export default DatabaseTriggersLayout
