import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useFlag } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useSetProjectStatus } from 'data/projects/project-detail-query'
import { useProjectRestartMutation } from 'data/projects/project-restart-mutation'
import { useProjectRestartServicesMutation } from 'data/projects/project-restart-services-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import {
  useIsAwsK8sCloudProvider,
  useIsProjectActive,
  useSelectedProjectQuery,
} from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import { ChevronDown } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

const RestartServerButton = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const { data: project } = useSelectedProjectQuery()
  const isProjectActive = useIsProjectActive()
  const isAwsK8s = useIsAwsK8sCloudProvider()
  const { setProjectStatus } = useSetProjectStatus()

  const [serviceToRestart, setServiceToRestart] = useState<'project' | 'database'>()

  const { projectSettingsRestartProject } = useIsFeatureEnabled([
    'project_settings:restart_project',
  ])

  const projectRef = project?.ref ?? ''
  const projectRegion = project?.region ?? ''

  const projectRestartDisabled = useFlag('disableProjectRestarts')
  const { can: canRestartProject } = useAsyncCheckPermissions(
    PermissionAction.INFRA_EXECUTE,
    'reboot'
  )

  const { mutate: restartProject, isPending: isRestartingProject } = useProjectRestartMutation({
    onSuccess: () => {
      onRestartSuccess()
    },
    onError: (error) => {
      onRestartFailed(error, 'project')
    },
  })
  const { mutate: restartProjectServices, isPending: isRestartingServices } =
    useProjectRestartServicesMutation({
      onSuccess: () => {
        onRestartSuccess()
      },
      onError: (error) => {
        onRestartFailed(error, 'database')
      },
    })

  const isLoading = isRestartingProject || isRestartingServices

  const requestProjectRestart = () => {
    if (!canRestartProject) {
      return toast.error(t('settings.general.restart_permission_error'))
    }
    restartProject({ ref: projectRef })
  }

  const requestDatabaseRestart = async () => {
    if (!canRestartProject) {
      return toast.error(t('settings.general.restart_permission_error'))
    }
    restartProjectServices({ ref: projectRef, region: projectRegion, services: ['postgresql'] })
  }

  const onRestartFailed = (error: any, type: 'project' | 'database') => {
    const service =
      type === 'project'
        ? t('settings.general.restart_project_button')
        : t('settings.general.restart_database')
    toast.error(t('settings.general.restart_failed', { service, message: error.message }))
    setServiceToRestart(undefined)
  }

  const onRestartSuccess = () => {
    setProjectStatus({ ref: projectRef, status: PROJECT_STATUS.RESTARTING })
    toast.success(t('settings.general.restarting_server'))
    router.push(`/project/${projectRef}`)
    setServiceToRestart(undefined)
  }

  return (
    <>
      {projectSettingsRestartProject ? (
        <div className="flex">
          <ButtonTooltip
            type="default"
            className={cn(
              'px-3 hover:z-10',
              canRestartProject && isProjectActive ? 'rounded-r-none' : ''
            )}
            disabled={
              project === undefined ||
              !canRestartProject ||
              !isProjectActive ||
              projectRestartDisabled ||
              isAwsK8s
            }
            onClick={() => setServiceToRestart('project')}
            tooltip={{
              content: {
                side: 'bottom',
                text: projectRestartDisabled
                  ? t('settings.general.restart_project_tooltip_disabled')
                  : !canRestartProject
                    ? t('settings.general.restart_permission_error')
                    : !isProjectActive
                      ? t('settings.general.restart_project_tooltip_not_active')
                      : isAwsK8s
                        ? t('settings.general.restart_project_tooltip_aws')
                        : undefined,
              },
            }}
          >
            {t('settings.general.restart_project_button')}
          </ButtonTooltip>
          {canRestartProject && isProjectActive && !projectRestartDisabled && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="default"
                  className="rounded-l-none px-[4px] py-[5px] -ml-[1px]"
                  icon={<ChevronDown />}
                  disabled={!canRestartProject}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="bottom">
                <DropdownMenuItem
                  key="database"
                  disabled={isLoading}
                  onClick={() => {
                    setServiceToRestart('database')
                  }}
                >
                  <div className="space-y-1">
                    <p className="block text-foreground">
                      {t('settings.general.fast_database_reboot')}
                    </p>
                    <p className="block text-foreground-light">
                      {t('settings.general.fast_database_reboot_desc')}
                    </p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ) : (
        <Button
          type="default"
          disabled={isLoading}
          onClick={() => {
            setServiceToRestart('database')
          }}
        >
          {t('settings.general.restart_database')}
        </Button>
      )}

      <ConfirmationModal
        visible={serviceToRestart !== undefined}
        variant="destructive"
        title={t('settings.general.confirm_restart_title', { service: serviceToRestart })}
        description={t('settings.general.confirm_restart_desc', { service: serviceToRestart })}
        confirmLabel={t('settings.general.confirm_restart_button')}
        confirmLabelLoading={t('settings.general.restarting')}
        loading={isLoading}
        onCancel={() => setServiceToRestart(undefined)}
        onConfirm={async () => {
          if (serviceToRestart === 'project') {
            requestProjectRestart()
          } else if (serviceToRestart === 'database') {
            requestDatabaseRestart()
          }
        }}
      />
    </>
  )
}

export default RestartServerButton
