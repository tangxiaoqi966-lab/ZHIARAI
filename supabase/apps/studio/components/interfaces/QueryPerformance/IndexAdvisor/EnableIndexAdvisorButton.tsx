import { useTranslation, Trans } from 'react-i18next'
import { useState } from 'react'
import { toast } from 'sonner'

import { useDatabaseExtensionEnableMutation } from 'data/database-extensions/database-extension-enable-mutation'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useTrack } from 'lib/telemetry/track'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from 'ui'
import { getIndexAdvisorExtensions } from './index-advisor.utils'

export const EnableIndexAdvisorButton = () => {
  const { t } = useTranslation()
  const track = useTrack()
  const { data: project } = useSelectedProjectQuery()

  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { hypopg, indexAdvisor } = getIndexAdvisorExtensions(extensions)

  const { mutateAsync: enableExtension, isPending: isEnablingExtension } =
    useDatabaseExtensionEnableMutation()

  const onEnableIndexAdvisor = async () => {
    if (project === undefined) return toast.error('Project is required')

    try {
      // Enable hypopg extension if not already installed
      if (hypopg?.installed_version === null) {
        await enableExtension({
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          name: hypopg.name,
          schema: hypopg?.schema ?? 'extensions',
          version: hypopg.default_version,
        })
      }

      // Enable index_advisor extension if not already installed
      if (indexAdvisor?.installed_version === null) {
        await enableExtension({
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          name: indexAdvisor.name,
          schema: indexAdvisor?.schema ?? 'extensions',
          version: indexAdvisor.default_version,
        })
      }
      toast.success(t('advisor.enable_success'))
      setIsDialogOpen(false)
    } catch (error: any) {
      toast.error(t('advisor.enable_error', { error: error.message }))
    }
  }

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={() => setIsDialogOpen(!isDialogOpen)}>
      <AlertDialogTrigger asChild>
        <Button type="primary" onClick={() => track('index_advisor_banner_enable_button_clicked')}>
          {t('ui.create')}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('advisor.enable_dialog_title')}</AlertDialogTitle>
          <AlertDialogDescription>
            <Trans
              i18nKey="advisor.enable_dialog_description"
              components={{
                1: <code className="text-code-inline">index_advisor</code>,
                3: <code className="text-code-inline">hypopg</code>,
              }}
            />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onEnableIndexAdvisor()
              track('index_advisor_dialog_enable_button_clicked')
            }}
            disabled={isEnablingExtension}
          >
            {isEnablingExtension ? t('advisor.enabling') : t('advisor.enable_button')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
