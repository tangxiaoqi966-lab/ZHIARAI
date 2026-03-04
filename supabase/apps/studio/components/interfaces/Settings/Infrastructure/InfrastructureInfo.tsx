import { useFlag, useParams } from 'common'
import { NoticeBar } from 'components/interfaces/DiskManagement/ui/NoticeBar'
import {
  ScaffoldContainer,
  ScaffoldDivider,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { useProjectUpgradeEligibilityQuery } from 'data/config/project-upgrade-eligibility-query'
import { useProjectServiceVersionsQuery } from 'data/projects/project-service-versions'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useIsOrioleDb, useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Badge, Button, Input, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { ProjectUpgradeAlert } from '../General/Infrastructure/ProjectUpgradeAlert'
import { InstanceConfiguration } from './InfrastructureConfiguration/InstanceConfiguration'
import { ReadReplicasWarning, ValidationErrorsWarning } from './UpgradeWarnings'

export const InfrastructureInfo = () => {
  const { t } = useTranslation()
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const unifiedReplication = useFlag('unifiedReplication')

  const { projectAuthAll: authEnabled, projectSettingsDatabaseUpgrades: showDatabaseUpgrades } =
    useIsFeatureEnabled(['project_auth:all', 'project_settings:database_upgrades'])

  const {
    data,
    error,
    isPending: isLoadingUpgradeEligibility,
    isError: isErrorUpgradeEligibility,
    isSuccess: isSuccessUpgradeEligibility,
  } = useProjectUpgradeEligibilityQuery({
    projectRef: ref,
  })

  const {
    data: serviceVersions,
    error: serviceVersionsError,
    isPending: isLoadingServiceVersions,
    isError: isErrorServiceVersions,
    isSuccess: isSuccessServiceVersions,
  } = useProjectServiceVersionsQuery({ projectRef: ref })

  const { data: databases } = useReadReplicasQuery({ projectRef: ref })
  const { current_app_version, current_app_version_release_channel, latest_app_version } =
    data || {}

  const isOnLatestVersion = current_app_version === latest_app_version
  const currentPgVersion = (current_app_version ?? '')
    .split('supabase-postgres-')[1]
    ?.replace('-orioledb', '')
  const isVisibleReleaseChannel =
    current_app_version_release_channel &&
    !['ga', 'withdrawn'].includes(current_app_version_release_channel)
      ? current_app_version_release_channel
      : undefined
  const isOrioleDb = useIsOrioleDb()
  const latestPgVersion = (latest_app_version ?? '').split('supabase-postgres-')[1]

  const isInactive = project?.status === 'INACTIVE'
  const hasReadReplicas = (databases ?? []).length > 1

  const hasValidationErrors = (data?.validation_errors ?? []).length > 0

  return (
    <>
      <ScaffoldDivider />
      {project?.cloud_provider !== 'FLY' &&
        (unifiedReplication ? (
          <ScaffoldContainer>
            <ScaffoldSection isFullWidth>
              <NoticeBar
                visible={true}
                type="default"
                title={t('settings.infrastructure.read_replicas_moved_title')}
                description={t('settings.infrastructure.read_replicas_moved_desc')}
                actions={
                  <Button type="default" asChild>
                    <Link href={`/project/${ref}/database/replication`} className="!no-underline">
                      {t('settings.infrastructure.go_to_replication')}
                    </Link>
                  </Button>
                }
              />
            </ScaffoldSection>
          </ScaffoldContainer>
        ) : (
          <>
            <InstanceConfiguration />
            <ScaffoldDivider />
          </>
        ))}

      <ScaffoldContainer>
        <ScaffoldSection>
          <ScaffoldSectionDetail>
            <h4 className="text-base capitalize m-0">{t('settings.infrastructure.service_versions_title')}</h4>
            <p className="text-foreground-light text-sm pr-8 mt-1">
              {t('settings.infrastructure.service_versions_desc')}
            </p>
          </ScaffoldSectionDetail>
          <ScaffoldSectionContent>
            {isInactive ? (
              <Admonition
                type="note"
                showIcon={false}
                title={t('settings.infrastructure.service_versions_paused_title')}
                description={t('settings.infrastructure.service_versions_paused_desc')}
              />
            ) : (
              <>
                {/* [Joshen] Double check why we need this waterfall loading behaviour here */}
                {isLoadingUpgradeEligibility && <GenericSkeletonLoader />}
                {isErrorUpgradeEligibility && (
                  <AlertError error={error} subject={t('settings.infrastructure.failed_retrieve_postgres_version')} />
                )}
                {isSuccessUpgradeEligibility && (
                  <>
                    {isLoadingServiceVersions && <GenericSkeletonLoader />}
                    {isErrorServiceVersions && (
                      <AlertError
                        error={serviceVersionsError}
                        subject={t('settings.infrastructure.failed_retrieve_versions')}
                      />
                    )}
                    {isSuccessServiceVersions && (
                      <>
                        {authEnabled && (
                          <Input
                            readOnly
                            disabled
                            label={t('settings.infrastructure.auth_version_label')}
                            value={serviceVersions?.gotrue ?? ''}
                          />
                        )}
                        <Input
                          readOnly
                          disabled
                          label={t('settings.infrastructure.postgrest_version_label')}
                          value={serviceVersions?.postgrest ?? ''}
                        />
                        <Input
                          readOnly
                          disabled
                          value={currentPgVersion || serviceVersions?.['supabase-postgres'] || ''}
                          label={t('settings.infrastructure.postgres_version_label')}
                          actions={[
                            isVisibleReleaseChannel && (
                              <Tooltip key="release-channel">
                                <TooltipTrigger>
                                  <Badge variant="warning" className="mr-1">
                                    {isVisibleReleaseChannel}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="w-44 text-center">
                                  {t('settings.infrastructure.release_channel_tooltip', {
                                    channel: isVisibleReleaseChannel,
                                  })}
                                </TooltipContent>
                              </Tooltip>
                            ),
                            isOrioleDb && (
                              <Tooltip key="orioledb">
                                <TooltipTrigger>
                                  <Badge variant="default" className="mr-1">
                                    OrioleDB
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="w-44 text-center">
                                  {t('settings.infrastructure.orioledb_tooltip')}
                                </TooltipContent>
                              </Tooltip>
                            ),
                            isOnLatestVersion && (
                              <Tooltip key="latest-version">
                                <TooltipTrigger>
                                  <Badge variant="success" className="mr-1">
                                    {t('settings.infrastructure.latest_badge')}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="w-52 text-center">
                                  {t('settings.infrastructure.latest_tooltip')}
                                </TooltipContent>
                              </Tooltip>
                            ),
                          ]}
                        />
                      </>
                    )}

                    {showDatabaseUpgrades && data && data.eligible ? (
                      hasReadReplicas ? (
                        <ReadReplicasWarning latestPgVersion={latestPgVersion} />
                      ) : (
                        <ProjectUpgradeAlert />
                      )
                    ) : null}

                    {showDatabaseUpgrades && data && !data.eligible && hasValidationErrors ? (
                      <ValidationErrorsWarning validationErrors={data.validation_errors ?? []} />
                    ) : null}
                  </>
                )}
              </>
            )}
          </ScaffoldSectionContent>
        </ScaffoldSection>
      </ScaffoldContainer>
    </>
  )
}
