import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { DropdownMenuItemTooltip } from 'components/ui/DropdownMenuItemTooltip'
import SparkBar from 'components/ui/SparkBar'
import {
  DatabaseInitEstimations,
  ReplicaInitializationStatus,
  useReadReplicasStatusesQuery,
} from 'data/read-replicas/replicas-status-query'
import { formatDatabaseID } from 'data/read-replicas/replicas.utils'
import dayjs from 'dayjs'
import { useCustomContent } from 'hooks/custom-content/useCustomContent'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { BASE_PATH } from 'lib/constants'
import { Database, DatabaseBackup, HelpCircle, Loader2, MoreVertical } from 'lucide-react'
import Link from 'next/link'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useTranslation } from 'react-i18next'
import { Handle, NodeProps, Position } from 'reactflow'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import {
  Badge,
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import {
  ERROR_STATES,
  INIT_PROGRESS,
  NODE_SEP,
  NODE_WIDTH,
  Region,
  REPLICA_STATUS,
} from './InstanceConfiguration.constants'
import { formatSeconds } from './InstanceConfiguration.utils'

interface NodeData {
  id: string
  provider: string
  region: Region
  computeSize?: string
  status: string
  inserted_at: string
}

interface PrimaryNodeData extends NodeData {
  numReplicas: number
  numRegions: number
  hasLoadBalancer: boolean
}

interface LoadBalancerData extends NodeData {
  numDatabases: number
}

interface ReplicaNodeData extends NodeData {
  onSelectRestartReplica: () => void
  onSelectResizeReplica: () => void
  onSelectDropReplica: () => void
}

export const LoadBalancerNode = ({ data }: NodeProps<LoadBalancerData>) => {
  const { t } = useTranslation()
  const { ref } = useParams()
  const { numDatabases } = data

  return (
    <>
      <div className="flex flex-col rounded bg-surface-100 border border-default">
        <div
          className="flex items-start justify-between p-3 gap-x-4"
          style={{ width: NODE_WIDTH / 2 - 10 }}
        >
          <div className="flex gap-x-3">
            <div className="min-w-8 h-8 bg-blue-600 border border-blue-800 rounded-md flex items-center justify-center">
              <Database size={16} />
            </div>
            <div className="flex flex-col gap-y-0.5">
              <p className="text-sm">{t('settings.infrastructure.api_load_balancer')}</p>
              <p className="text-sm text-foreground-light">
                <span className="text-foreground">
                  {t('settings.infrastructure.api_load_balancer_desc', { count: numDatabases })}
                </span>
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="text" icon={<MoreVertical />} className="px-1" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40" side="bottom" align="end">
              <DropdownMenuItem asChild className="gap-x-2">
                <Link href={`/project/${ref}/integrations/data_api/overview?source=load-balancer`}>
                  {t('settings.infrastructure.view_api_url')}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: 'transparent' }} />
    </>
  )
}

export const PrimaryNode = ({ data }: NodeProps<PrimaryNodeData>) => {
  const { t } = useTranslation()
  // [Joshen] Just FYI Handles cannot be conditionally rendered
  const { provider, region, computeSize, numReplicas, numRegions, hasLoadBalancer } = data

  const { projectHomepageShowInstanceSize } = useIsFeatureEnabled([
    'project_homepage:show_instance_size',
  ])
  const { infraAwsNimbusLabel } = useCustomContent(['infra:aws_nimbus_label'])
  const providerLabel = provider === 'AWS_NIMBUS' ? infraAwsNimbusLabel : provider

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className={!hasLoadBalancer ? 'opacity-0' : ''}
        style={{ background: 'transparent' }}
      />
      <div className="flex flex-col rounded bg-surface-100 border border-default">
        <div
          className="flex items-start justify-between p-3"
          style={{ width: NODE_WIDTH / 2 - 10 }}
        >
          <div className="flex gap-x-3">
            <div className="w-8 h-8 bg-brand-500 border border-brand-600 rounded-md flex items-center justify-center">
              <Database size={16} />
            </div>
            <div className="flex flex-col gap-y-0.5">
              <p className="text-sm">{t('settings.infrastructure.primary_database')}</p>
              <p className="flex items-center gap-x-1">
                <span className="text-sm text-foreground-light">{region.name}</span>
              </p>
              <p className="flex items-center gap-x-1">
                <span className="text-sm text-foreground-light">{region.region}</span>
                {projectHomepageShowInstanceSize && (
                  <>
                    <span className="text-sm text-foreground-light">•</span>
                    <span className="text-sm text-foreground-light">{computeSize}</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <img
            alt="region icon"
            className="w-8 rounded-sm mt-0.5"
            src={`${BASE_PATH}/img/regions/${region.region}.svg`}
          />
        </div>
        {numReplicas > 0 && (
          <div className="border-t p-3 py-2">
            <p className="text-sm text-foreground-light">
              <span className="text-foreground">
                {t('settings.infrastructure.replicas_deployed_across', {
                  replicas: numReplicas,
                  regions: numRegions,
                })}
              </span>
            </p>
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className={numReplicas === 0 ? 'opacity-0' : ''}
        style={{ background: 'transparent' }}
      />
    </>
  )
}

export const ReplicaNode = ({ data }: NodeProps<ReplicaNodeData>) => {
  const { t } = useTranslation()
  const {
    id,
    region,
    computeSize,
    status,
    inserted_at,
    onSelectRestartReplica,
    onSelectDropReplica,
  } = data
  const { ref } = useParams()
  const dbSelectorState = useDatabaseSelectorStateSnapshot()
  const { can: canManageReplicas } = useAsyncCheckPermissions(PermissionAction.CREATE, 'projects')
  const { projectHomepageShowInstanceSize } = useIsFeatureEnabled([
    'project_homepage:show_instance_size',
  ])

  const [, setShowConnect] = useQueryState('showConnect', parseAsBoolean.withDefault(false))

  const { data: databaseStatuses } = useReadReplicasStatusesQuery({ projectRef: ref })
  const { replicaInitializationStatus } =
    (databaseStatuses ?? []).find((db) => db.identifier === id) || {}

  const {
    status: initStatus,
    progress,
    estimations,
    error,
  } = (replicaInitializationStatus as {
    status?: string
    progress?: string
    estimations?: DatabaseInitEstimations
    error?: string
  }) ?? { status: undefined, progress: undefined, estimations: undefined, error: undefined }

  const created = dayjs(inserted_at).format('DD MMM YYYY')
  const stage = progress !== undefined ? Number(progress.split('_')[0]) : 0
  const stagePercent = stage / (Object.keys(INIT_PROGRESS).length - 1)

  const isInTransition =
    (
      [
        REPLICA_STATUS.UNKNOWN,
        REPLICA_STATUS.COMING_UP,
        REPLICA_STATUS.GOING_DOWN,
        REPLICA_STATUS.RESTORING,
        REPLICA_STATUS.RESTARTING,
        REPLICA_STATUS.RESIZING,
        REPLICA_STATUS.INIT_READ_REPLICA,
      ] as string[]
    ).includes(status) || initStatus === ReplicaInitializationStatus.InProgress

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ background: 'transparent' }} />
      <div
        className="flex justify-between items-start rounded bg-surface-100 border border-default p-3"
        style={{ width: NODE_WIDTH / 2 - 10 }}
      >
        <div className="flex gap-x-3">
          <div
            className={cn(
              'w-8 h-8 border rounded-md flex items-center justify-center',
              status === REPLICA_STATUS.ACTIVE_HEALTHY &&
                initStatus === ReplicaInitializationStatus.Completed
                ? 'bg-brand-400 border-brand-500'
                : 'bg-surface-100 border-foreground/20'
            )}
          >
            {isInTransition ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <DatabaseBackup size={16} />
            )}
          </div>
          <div className="flex flex-col gap-y-0.5">
            <div className="flex items-center gap-x-2">
              <p className="text-sm truncate">
                {id.length > 0
                  ? t('settings.infrastructure.read_replica_with_id', { id: formatDatabaseID(id) })
                  : t('settings.infrastructure.read_replica')}
              </p>
              {initStatus === ReplicaInitializationStatus.InProgress ||
              status === REPLICA_STATUS.COMING_UP ||
              status === REPLICA_STATUS.UNKNOWN ||
              status === REPLICA_STATUS.INIT_READ_REPLICA ? (
                <Badge>{t('settings.infrastructure.replica_status.coming_up')}</Badge>
              ) : initStatus === ReplicaInitializationStatus.Failed ||
                status === REPLICA_STATUS.INIT_READ_REPLICA_FAILED ? (
                <>
                  <Badge variant="destructive">
                    {t('settings.infrastructure.replica_status.init_failed')}
                  </Badge>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle size={16} />
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      align="end"
                      alignOffset={-70}
                      className="w-60 text-center"
                    >
                      {t('settings.infrastructure.replica_init_failed_tooltip')}
                    </TooltipContent>
                  </Tooltip>
                </>
              ) : status === REPLICA_STATUS.GOING_DOWN ? (
                <Badge>{t('settings.infrastructure.replica_status.going_down')}</Badge>
              ) : status === REPLICA_STATUS.RESTARTING ? (
                <Badge>{t('settings.infrastructure.replica_status.restarting')}</Badge>
              ) : status === REPLICA_STATUS.RESIZING ? (
                <Badge>{t('settings.infrastructure.replica_status.resizing')}</Badge>
              ) : status === REPLICA_STATUS.ACTIVE_HEALTHY ? (
                <Badge variant="success">{t('settings.infrastructure.replica_status.healthy')}</Badge>
              ) : (
                <Badge variant="warning">{t('settings.infrastructure.replica_status.unhealthy')}</Badge>
              )}
            </div>
            <div className="my-0.5">
              <p className="text-sm text-foreground-light">{region.name}</p>
              <p className="flex text-sm text-foreground-light items-center gap-x-1">
                <span>{region.region}</span>
                {projectHomepageShowInstanceSize && !!computeSize && (
                  <>
                    <span>•</span>
                    <span>{computeSize}</span>
                  </>
                )}
              </p>
            </div>
            {initStatus === ReplicaInitializationStatus.InProgress && progress !== undefined ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-56">
                    <SparkBar
                      labelBottom={INIT_PROGRESS[progress as keyof typeof INIT_PROGRESS]}
                      labelBottomClass="text-xs !normal-nums text-foreground-light"
                      type="horizontal"
                      value={stagePercent * 100}
                      max={100}
                      barClass="bg-brand"
                    />
                  </div>
                </TooltipTrigger>
                {estimations !== undefined && (
                  <TooltipContent asChild side="bottom">
                    <div className="w-56">
                      <p className="text-foreground-light mb-0.5">
                        {t('settings.infrastructure.duration_estimates')}
                      </p>
                      {estimations.baseBackupDownloadEstimateSeconds !== undefined && (
                        <p>
                          {t('settings.infrastructure.base_backup_download')}:{' '}
                          {formatSeconds(estimations.baseBackupDownloadEstimateSeconds)}
                        </p>
                      )}
                      {estimations.walArchiveReplayEstimateSeconds !== undefined && (
                        <p>
                          {t('settings.infrastructure.wal_archive_replay')}:{' '}
                          {formatSeconds(estimations.walArchiveReplayEstimateSeconds)}
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            ) : error !== undefined ? (
              <p className="text-sm text-foreground-light">
                {t('settings.infrastructure.error_prefix')}{' '}
                {ERROR_STATES[error as keyof typeof ERROR_STATES]}
              </p>
            ) : (
              <p className="text-sm text-foreground-light">
                {t('settings.infrastructure.created', { created })}
              </p>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="text" icon={<MoreVertical />} className="px-1" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40" side="bottom" align="end">
            <DropdownMenuItem
              disabled={status !== REPLICA_STATUS.ACTIVE_HEALTHY}
              className="gap-x-2"
              onClick={() => {
                setShowConnect(true)
                dbSelectorState.setSelectedDatabaseId(id)
              }}
            >
              {t('settings.infrastructure.view_connection_string')}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-x-2"
              disabled={status !== REPLICA_STATUS.ACTIVE_HEALTHY}
            >
              <Link href={`/project/${ref}/observability/database?db=${id}&chart=replication-lag`}>
                {t('settings.infrastructure.view_replication_lag')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-x-2"
              onClick={() => onSelectRestartReplica()}
              disabled={status !== REPLICA_STATUS.ACTIVE_HEALTHY}
            >
              {t('settings.infrastructure.restart_replica_action')}
            </DropdownMenuItem>
            <DropdownMenuItemTooltip
              className="gap-x-2 !pointer-events-auto"
              disabled={!canManageReplicas}
              onClick={() => {
                if (canManageReplicas) onSelectDropReplica()
              }}
              tooltip={{
                content: { side: 'left', text: t('settings.infrastructure.drop_replica_permission_error') },
              }}
            >
              {t('settings.infrastructure.drop_replica_action')}
            </DropdownMenuItemTooltip>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}

export const RegionNode = ({ data }: any) => {
  const { region, numReplicas } = data
  const regionNodeWidth =
    20 + (NODE_WIDTH / 2 - 10) * numReplicas + (numReplicas - 1) * (NODE_SEP + 10)

  return (
    <div
      className="relative flex justify-between rounded bg-black/10 border border-default border-white/10 border-2 p-3"
      style={{ width: regionNodeWidth, height: 162 }}
    >
      <div className="absolute bottom-2 flex items-center justify-between gap-x-2">
        <img
          alt="region icon"
          className="w-5 rounded-sm"
          src={`${BASE_PATH}/img/regions/${region.region}.svg`}
        />
        <p className="text-sm">{region.name}</p>
      </div>
    </div>
  )
}
