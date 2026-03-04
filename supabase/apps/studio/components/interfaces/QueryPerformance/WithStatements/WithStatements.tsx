import { LoadingLine, cn } from 'ui'
import { useState, useEffect, useMemo } from 'react'

import { Button } from 'ui'
import { X, RefreshCw, RotateCcw } from 'lucide-react'
import { Markdown } from '../../Markdown'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { Admonition } from 'ui-patterns'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL, IS_PLATFORM } from 'lib/constants'
import { executeSql } from 'data/sql/execute-sql-query'
import { toast } from 'sonner'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { formatDatabaseID } from 'data/read-replicas/replicas.utils'
import { PresetHookResult } from 'components/interfaces/Reports/Reports.utils'
import { DbQueryHook } from 'hooks/analytics/useDbQuery'
import { QueryPerformanceMetrics } from '../QueryPerformanceMetrics'
import { QueryPerformanceFilterBar } from '../QueryPerformanceFilterBar'
import { QueryPerformanceGrid } from '../QueryPerformanceGrid'
import { transformStatementDataToRows } from './WithStatements.utils'
import { DownloadResultsButton } from 'components/ui/DownloadResultsButton'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { captureQueryPerformanceError } from '../QueryPerformance.utils'
import { getErrorMessage } from 'lib/get-error-message'
import { parseAsString, useQueryStates } from 'nuqs'

import { useTranslation, Trans } from 'react-i18next'

interface WithStatementsProps {
  queryHitRate: PresetHookResult
  queryPerformanceQuery: DbQueryHook<any>
  queryMetrics: PresetHookResult
}

export const WithStatements = ({
  queryHitRate,
  queryPerformanceQuery,
  queryMetrics,
}: WithStatementsProps) => {
  const { t } = useTranslation()
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const state = useDatabaseSelectorStateSnapshot()
  const { data, isLoading, isRefetching, error: queryError } = queryPerformanceQuery
  const isPrimaryDatabase = state.selectedDatabaseId === ref
  const formattedDatabaseId = formatDatabaseID(state.selectedDatabaseId ?? '')

  const hitRateError = 'error' in queryHitRate ? queryHitRate.error : null
  const metricsError = 'error' in queryMetrics ? queryMetrics.error : null
  const mainQueryError = queryError || null

  const [showResetgPgStatStatements, setShowResetgPgStatStatements] = useState(false)

  const [showBottomSection, setShowBottomSection] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.QUERY_PERF_SHOW_BOTTOM_SECTION,
    true
  )

  const [{ indexAdvisor }] = useQueryStates({
    indexAdvisor: parseAsString.withDefault('false'),
  })

  const handleRefresh = () => {
    queryPerformanceQuery.runQuery()
    queryHitRate.runQuery()
    queryMetrics.runQuery()
  }

  const processedData = useMemo(() => {
    return transformStatementDataToRows(data || [], indexAdvisor === 'true')
  }, [data, indexAdvisor])

  const { data: databases } = useReadReplicasQuery({ projectRef: ref })

  useEffect(() => {
    state.setSelectedDatabaseId(ref)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref])

  useEffect(() => {
    if (mainQueryError) {
      const errorMessage = getErrorMessage(mainQueryError)
      captureQueryPerformanceError(mainQueryError, {
        projectRef: ref,
        databaseIdentifier: state.selectedDatabaseId,
        queryPreset: 'unified',
        queryType: 'mainQuery',
        postgresVersion: project?.dbVersion,
        databaseType: isPrimaryDatabase ? 'primary' : 'read-replica',
        sql: queryPerformanceQuery.resolvedSql,
        errorMessage: errorMessage || undefined,
      })
    }
  }, [
    mainQueryError,
    ref,
    state.selectedDatabaseId,
    project?.dbVersion,
    isPrimaryDatabase,
    queryPerformanceQuery.resolvedSql,
  ])

  useEffect(() => {
    if (hitRateError) {
      const errorMessage = getErrorMessage(hitRateError)
      captureQueryPerformanceError(hitRateError, {
        projectRef: ref,
        databaseIdentifier: state.selectedDatabaseId,
        queryPreset: 'queryHitRate',
        queryType: 'hitRate',
        postgresVersion: project?.dbVersion,
        databaseType: isPrimaryDatabase ? 'primary' : 'read-replica',
        errorMessage: errorMessage || undefined,
      })
    }
  }, [hitRateError, ref, state.selectedDatabaseId, project?.dbVersion, isPrimaryDatabase])

  useEffect(() => {
    if (metricsError) {
      const errorMessage = getErrorMessage(metricsError)
      captureQueryPerformanceError(metricsError, {
        projectRef: ref,
        databaseIdentifier: state.selectedDatabaseId,
        queryPreset: 'queryMetrics',
        queryType: 'metrics',
        postgresVersion: project?.dbVersion,
        databaseType: isPrimaryDatabase ? 'primary' : 'read-replica',
        errorMessage: errorMessage || undefined,
      })
    }
  }, [metricsError, ref, state.selectedDatabaseId, project?.dbVersion, isPrimaryDatabase])

  const hasError = mainQueryError || hitRateError || metricsError
  const errorMessage = mainQueryError
    ? getErrorMessage(mainQueryError) || t('advisor.failed_to_load_data')
    : hitRateError
      ? getErrorMessage(hitRateError) || t('advisor.failed_to_load_hit_rate')
      : metricsError
        ? getErrorMessage(metricsError) || t('advisor.failed_to_load_metrics')
        : null

  return (
    <>
      {hasError && (
        <div className="px-6 pt-4">
          <Admonition
            type="destructive"
            title={t('advisor.error_loading_data')}
            description={
              errorMessage ||
              t('advisor.failed_to_load_data')
            }
          />
        </div>
      )}
      <QueryPerformanceMetrics />
      <QueryPerformanceFilterBar
        showRolesFilter={true}
        actions={
          <>
            <ButtonTooltip
              type="default"
              size="tiny"
              icon={<RefreshCw />}
              onClick={handleRefresh}
              tooltip={{ content: { side: 'top', text: t('advisor.refresh') } }}
              className="w-[26px]"
            />
            <ButtonTooltip
              type="default"
              size="tiny"
              icon={<RotateCcw />}
              onClick={() => setShowResetgPgStatStatements(true)}
              tooltip={{ content: { side: 'top', text: t('advisor.reset_report') } }}
              className="w-[26px]"
            />

            <DownloadResultsButton
              results={processedData}
              fileName={`Supabase Query Performance Statements (${ref})`}
              align="end"
            />
          </>
        }
      />
      <LoadingLine loading={isLoading || isRefetching} />
      <QueryPerformanceGrid
        aggregatedData={processedData}
        isLoading={isLoading}
        error={
          mainQueryError
            ? getErrorMessage(mainQueryError) || t('advisor.failed_to_load_data')
            : null
        }
        onRetry={handleRefresh}
      />
      <div
        className={cn('px-6 py-6 flex gap-x-4 border-t relative', {
          hidden: showBottomSection === false,
        })}
      >
        <Button
          className="absolute top-1.5 right-3 px-1.5"
          type="text"
          size="tiny"
          onClick={() => setShowBottomSection(false)}
        >
          <X size="14" />
        </Button>
        <div className="w-[33%] flex flex-col gap-y-1 text-sm">
          <p>{t('advisor.reset_report_title')}</p>
          <p className="text-xs text-foreground-light">
            {t('advisor.reset_report_desc')}
          </p>
          <Button
            type="default"
            className="!mt-3 w-min"
            onClick={() => setShowResetgPgStatStatements(true)}
          >
            {t('advisor.reset_report')}
          </Button>
        </div>

        <div className="w-[33%] flex flex-col gap-y-1 text-sm">
          <p>{t('advisor.how_report_generated')}</p>
          <div className="text-xs">
            <p>
              <Trans
                i18nKey="advisor.how_report_generated_desc"
                components={{
                  1: (
                    <a
                      href={`${DOCS_URL}/guides/platform/performance#examining-query-performance`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="underline transition underline-offset-2 decoration-foreground-lighter hover:decoration-foreground text-inherit hover:text-foreground"
                    >
                      Learn more here
                    </a>
                  ),
                }}
              />
            </p>
          </div>
        </div>

        <div className="w-[33%] flex flex-col gap-y-1 text-sm">
          <p>{t('advisor.inspect_db')}</p>
          <div className="text-xs">
            <p>
              <Trans
                i18nKey="advisor.inspect_db_desc"
                components={{
                  1: (
                    <a
                      href={`${DOCS_URL}/guides/database/inspect`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="underline transition underline-offset-2 decoration-foreground-lighter hover:decoration-foreground text-inherit hover:text-foreground"
                    >
                      Learn more here
                    </a>
                  ),
                }}
              />
            </p>
          </div>
        </div>
      </div>

      <ConfirmationModal
        visible={showResetgPgStatStatements}
        size="medium"
        variant="destructive"
        title={t('advisor.reset_analysis_title')}
        confirmLabel={t('advisor.reset_analysis_confirm')}
        confirmLabelLoading={t('advisor.reset_analysis_loading')}
        onCancel={() => setShowResetgPgStatStatements(false)}
        onConfirm={async () => {
          const connectionString = databases?.find(
            (db) => db.identifier === state.selectedDatabaseId
          )?.connectionString

          if (IS_PLATFORM && !connectionString) {
            return toast.error('Unable to run query: Connection string is missing')
          }

          try {
            await executeSql({
              projectRef: project?.ref,
              connectionString,
              sql: `SELECT pg_stat_statements_reset();`,
            })
            handleRefresh()
            setShowResetgPgStatStatements(false)
          } catch (error: any) {
            toast.error(`Failed to reset analysis: ${error.message}`)
          }
        }}
      >
        <p className="text-foreground-light text-sm">
          <Trans
            i18nKey="advisor.reset_analysis_desc"
            values={{
              database: isPrimaryDatabase
                ? t('advisor.primary_database')
                : t('advisor.read_replica', { id: formattedDatabaseId }),
            }}
            components={{
              1: <span className="text-foreground" />,
            }}
          />
        </p>
      </ConfirmationModal>
    </>
  )
}
