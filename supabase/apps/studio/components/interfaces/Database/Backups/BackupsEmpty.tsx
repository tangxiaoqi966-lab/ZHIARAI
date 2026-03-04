import { DatabaseBackup } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { EmptyStatePresentational } from 'ui-patterns'

export const BackupsEmpty = () => {
  const { t } = useTranslation()
  return (
    <EmptyStatePresentational
      icon={DatabaseBackup}
      title={t('backups.no_backups_yet')}
      description={t('backups.check_again_tomorrow')}
    />
  )
}
