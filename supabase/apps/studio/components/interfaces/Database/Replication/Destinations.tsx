import { useQueryClient } from '@tanstack/react-query'
import { useFlag, useParams } from 'common'
import { AlertError } from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import { useReplicationDestinationsQuery } from 'data/replication/destinations-query'
import { replicationKeys } from 'data/replication/keys'
import { fetchReplicationPipelineVersion } from 'data/replication/pipeline-version-query'
import { useReplicationPipelinesQuery } from 'data/replication/pipelines-query'
import { useReplicationSourcesQuery } from 'data/replication/sources-query'
import { useCheckEntitlements } from 'hooks/misc/useCheckEntitlements'
import { DOCS_URL } from 'lib/constants'
import { Plus, Search, X } from 'lucide-react'
import { parseAsStringEnum, useQueryState } from 'nuqs'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'

import { REPLICA_STATUS } from '../../Settings/Infrastructure/InfrastructureConfiguration/InstanceConfiguration.constants'
import { DestinationPanel } from './DestinationPanel/DestinationPanel'
import { DestinationType } from './DestinationPanel/DestinationPanel.types'
import { DestinationRow } from './DestinationRow'
import { EnableReplicationCallout } from './EnableReplicationCallout'
import { PIPELINE_ERROR_MESSAGES } from './Pipeline.utils'
import { ReadReplicaRow } from './ReadReplicas/ReadReplicaRow'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'

export const Destinations = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { ref: projectRef } = useParams()
  const { hasAccess: hasETLReplicationAccess, isLoading: isLoadingEntitlement } =
    useCheckEntitlements('replication.etl')

  const unifiedReplication = useFlag('unifiedReplication')

  const prefetchedRef = useRef(false)
  const [filterString, setFilterString] = useState<string>('')
  const [statusRefetchInterval, setStatusRefetchInterval] = useState<number | false>(5000)

  const [_, setDestinationType] = useQueryState(
    'type',
    parseAsStringEnum<DestinationType>([
      'Read Replica',
      'BigQuery',
      'Analytics Bucket',
    ]).withOptions({
      history: 'push',
      clearOnDefault: true,
    })
  )

  const {
    data: databases = [],
    error: databasesError,
    isPending: isDatabasesLoading,
    isError: isDatabasesError,
    isSuccess: isDatabasesSuccess,
  } = useReadReplicasQuery({ projectRef }, { refetchInterval: statusRefetchInterval })
  const readReplicas = databases.filter((x) => x.identifier !== projectRef)
  const hasReplicas = isDatabasesSuccess && readReplicas.length > 0
  const filteredReplicas =
    filterString.length === 0
      ? readReplicas
      : readReplicas.filter((replica) => replica.identifier.includes(filterString.toLowerCase()))

  const {
    data: sourcesData,
    error: sourcesError,
    isPending: isSourcesLoading,
    isError: isSourcesError,
    isSuccess: isSourcesSuccess,
  } = useReplicationSourcesQuery({
    projectRef,
  })
  const sourceId = sourcesData?.sources.find((s) => s.name === projectRef)?.id
  const replicationNotEnabled = isSourcesSuccess && !sourceId

  const {
    data: destinationsData,
    error: destinationsError,
    isPending: isDestinationsLoading,
    isError: isDestinationsError,
    isSuccess: isDestinationsSuccess,
  } = useReplicationDestinationsQuery({
    projectRef,
  })
  const destinations = destinationsData?.destinations ?? []
  const hasDestinations = isDestinationsSuccess && destinationsData?.destinations.length > 0
  const filteredDestinations =
    filterString.length === 0
      ? destinations ?? []
      : (destinations ?? []).filter((destination) =>
          destination.name.toLowerCase().includes(filterString.toLowerCase())
        )

  const {
    data: pipelinesData,
    error: pipelinesError,
    isPending: isPipelinesLoading,
    isError: isPipelinesError,
    isSuccess: isPipelinesSuccess,
  } = useReplicationPipelinesQuery({
    projectRef,
  })

  const isLoading =
    isSourcesLoading || isDestinationsLoading || isDatabasesLoading || isLoadingEntitlement
  const hasErrorsFetchingData = isSourcesError || isDestinationsError || isDatabasesError

  useEffect(() => {
    if (
      projectRef &&
      !prefetchedRef.current &&
      pipelinesData?.pipelines &&
      pipelinesData.pipelines.length > 0 &&
      isPipelinesSuccess
    ) {
      prefetchedRef.current = true
      pipelinesData.pipelines.forEach((p) => {
        if (!p?.id) return
        queryClient.prefetchQuery({
          queryKey: replicationKeys.pipelinesVersion(projectRef, p.id),
          queryFn: ({ signal }) =>
            fetchReplicationPipelineVersion({ projectRef, pipelineId: p.id }, signal),
          staleTime: Infinity,
        })
      })
    }
  }, [projectRef, pipelinesData?.pipelines, isPipelinesSuccess, queryClient])

  useEffect(() => {
    if (!isDatabasesSuccess) return

    const pollReplicas = async () => {
      const fixedStatuses = [
        REPLICA_STATUS.ACTIVE_HEALTHY,
        REPLICA_STATUS.ACTIVE_UNHEALTHY,
        REPLICA_STATUS.INIT_READ_REPLICA_FAILED,
      ]

      const replicasInTransition = readReplicas.filter((db) => !fixedStatuses.includes(db.status))
      const hasTransientStatus = replicasInTransition.length > 0

      // If all replicas are active healthy, stop fetching statuses
      if (!hasTransientStatus) setStatusRefetchInterval(false)
    }

    pollReplicas()
  }, [isDatabasesSuccess, readReplicas])

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Input
              placeholder={t('replication.filter_placeholder')}
              size="tiny"
              icon={<Search />}
              value={filterString}
              className="w-full lg:w-52"
              onChange={(e: any) => setFilterString(e.target.value)}
              actions={
                filterString.length > 0 && (
                  <Button
                    type="text"
                    icon={<X />}
                    className="p-0 h-5 w-5"
                    onClick={() => setFilterString('')}
                  />
                )
              }
            />
          </div>
          <div className="flex items-center gap-x-2">
            {(unifiedReplication || !!sourceId) && (
              <Button
                type="default"
                icon={<Plus />}
                onClick={() => setDestinationType('Read Replica')}
              >
                {t('replication.add_destination')}
              </Button>
            )}
            <DocsButton href={`${DOCS_URL}/guides/database/replication`} />
          </div>
        </div>
      </div>

      <div className="w-full overflow-hidden overflow-x-auto flex flex-col gap-y-4">
        {hasErrorsFetchingData && (
          <AlertError
            error={sourcesError || destinationsError || databasesError}
            subject={PIPELINE_ERROR_MESSAGES.RETRIEVE_DESTINATIONS}
          />
        )}

        {isLoading ? (
          <GenericSkeletonLoader />
        ) : !unifiedReplication && replicationNotEnabled ? (
          <EnableReplicationCallout hasAccess={hasETLReplicationAccess} />
        ) : (unifiedReplication && hasReplicas) || hasDestinations ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead key="type" className="w-[20px]" />
                    <TableHead key="name" className="w-[250px]">
                      {t('replication.name')}
                    </TableHead>
                    <TableHead key="status" className="w-[150px]">
                      {t('replication.status')}
                    </TableHead>
                    <TableHead key="lag" className="w-[80px]">
                      {t('replication.lag')}
                    </TableHead>
                    <TableHead key="publication">{t('replication.publication')}</TableHead>
                    <TableHead key="actions" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unifiedReplication &&
                    filteredReplicas.map((replica) => {
                      return (
                        <ReadReplicaRow
                          key={replica.identifier}
                          replica={replica}
                          onUpdateReplica={() => setStatusRefetchInterval(5000)}
                        />
                      )
                    })}

                  {filteredDestinations.map((destination) => (
                    <DestinationRow key={destination.id} destinationId={destination.id} />
                  ))}

                  {!isLoading &&
                    filteredDestinations.length === 0 &&
                    filteredReplicas.length === 0 &&
                    ((unifiedReplication && hasReplicas) || hasDestinations) && (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <p>{t('replication.no_results_found')}</p>
                          <p className="text-foreground-light">
                            {t('replication.search_no_results', { filterString })}
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          !isLoading &&
          !hasErrorsFetchingData && (
            <div
              className={cn(
                'w-full',
                'border border-dashed bg-surface-100 border-overlay',
                'flex flex-col px-16 rounded-lg justify-center items-center py-8 mt-4'
              )}
            >
              <h4>
                {unifiedReplication
                  ? t('replication.empty_state_title_unified')
                  : t('replication.empty_state_title_default')}
              </h4>
              <p className="text-foreground-light text-sm text-balance text-center mt-1">
                {unifiedReplication
                  ? t('replication.empty_state_description_unified')
                  : t('replication.empty_state_description_default')}
              </p>
              <Button
                icon={<Plus />}
                onClick={() => setDestinationType('Read Replica')}
                className="mt-4"
              >
                {t('replication.add_destination')}
              </Button>
            </div>
          )
        )}
      </div>

      <DestinationPanel onSuccessCreateReadReplica={() => setStatusRefetchInterval(5000)} />
    </>
  )
}
