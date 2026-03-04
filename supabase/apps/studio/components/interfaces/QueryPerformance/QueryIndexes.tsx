import { Check, Table2, Lightbulb } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTranslation, Trans } from 'react-i18next'

import { AccordionTrigger } from '@ui/components/shadcn/ui/accordion'
import { useIndexAdvisorStatus } from 'components/interfaces/QueryPerformance/hooks/useIsIndexAdvisorStatus'
import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import { Admonition } from 'ui-patterns'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useGetIndexAdvisorResult } from 'data/database/retrieve-index-advisor-result-query'
import { useGetIndexesFromSelectQuery } from 'data/database/retrieve-index-from-select-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import { useTrack } from 'lib/telemetry/track'
import {
  AccordionContent_Shadcn_,
  AccordionItem_Shadcn_,
  Accordion_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  CodeBlock,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Collapsible_Shadcn_,
  cn,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { useIndexInvalidation } from './hooks/useIndexInvalidation'
import { EnableIndexAdvisorButton } from './IndexAdvisor/EnableIndexAdvisorButton'
import {
  calculateImprovement,
  createIndexes,
  hasIndexRecommendations,
} from './IndexAdvisor/index-advisor.utils'
import { QueryPerformanceRow } from './QueryPerformance.types'
import { IndexAdvisorDisabledState } from './IndexAdvisor/IndexAdvisorDisabledState'
import { IndexImprovementText } from './IndexAdvisor/IndexImprovementText'
import { QueryPanelContainer, QueryPanelScoreSection, QueryPanelSection } from './QueryPanel'

interface QueryIndexesProps {
  selectedRow: Pick<QueryPerformanceRow, 'query'>
  columnName?: string
  suggestedSelectQuery?: string

  onClose?: () => void
}

// [Joshen] There's several more UX things we can do to help ease the learning curve of indexes I think
// e.g understanding "costs", what numbers of "costs" are actually considered insignificant

export const QueryIndexes = ({
  selectedRow,
  columnName,
  suggestedSelectQuery,
  onClose,
}: QueryIndexesProps) => {
  const { t } = useTranslation()
  // [Joshen] TODO implement this logic once the linter rules are in
  const isLinterWarning = false
  const { data: project } = useSelectedProjectQuery()
  const [showStartupCosts, setShowStartupCosts] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const track = useTrack()
  const [hasTrackedTabView, setHasTrackedTabView] = useState(false)

  const {
    data: usedIndexes,
    isSuccess,
    isPending: isLoading,
    isError,
    error,
  } = useGetIndexesFromSelectQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    query: selectedRow?.['query'],
  })

  const { data: extensions, isPending: isLoadingExtensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { isIndexAdvisorEnabled } = useIndexAdvisorStatus()

  const {
    data: indexAdvisorResult,
    error: indexAdvisorError,
    refetch,
    isError: isErrorIndexAdvisorResult,
    isSuccess: isSuccessIndexAdvisorResult,
    isLoading: isLoadingIndexAdvisorResult,
  } = useGetIndexAdvisorResult(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      query: selectedRow?.['query'],
    },
    { enabled: isIndexAdvisorEnabled }
  )

  const {
    index_statements,
    startup_cost_after,
    startup_cost_before,
    total_cost_after,
    total_cost_before,
  } = indexAdvisorResult ?? { index_statements: [], total_cost_after: 0, total_cost_before: 0 }
  const hasIndexRecommendation = hasIndexRecommendations(
    indexAdvisorResult,
    isSuccessIndexAdvisorResult
  )
  const totalImprovement = calculateImprovement(total_cost_before, total_cost_after)

  const invalidateQueries = useIndexInvalidation()

  useEffect(() => {
    if (!isLoadingIndexAdvisorResult && !hasTrackedTabView) {
      track('index_advisor_tab_clicked', {
        hasRecommendations: hasIndexRecommendation,
        isIndexAdvisorEnabled: isIndexAdvisorEnabled,
      })
      setHasTrackedTabView(true)
    }
  }, [
    isLoadingIndexAdvisorResult,
    hasIndexRecommendation,
    hasTrackedTabView,
    track,
    isIndexAdvisorEnabled,
  ])

  const createIndex = async () => {
    if (index_statements.length === 0) return

    setIsExecuting(true)
    track('index_advisor_create_indexes_button_clicked')

    try {
      await createIndexes({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        indexStatements: index_statements,
        onSuccess: () => refetch(),
      })

      // Only invalidate queries if index creation was successful
      invalidateQueries()
    } catch (error) {
      // Error is already handled by createIndexes with a toast notification
      // But we could add component-specific error handling here if needed
      console.error('Failed to create index:', error)
      setIsExecuting(false)
    } finally {
      setIsExecuting(false)

      onClose?.()
    }
  }

  if (!isLoadingExtensions && !isIndexAdvisorEnabled) {
    return (
      <QueryPanelContainer className="h-full">
        <QueryPanelSection className="pt-2">
          <div className="border rounded border-dashed flex flex-col items-center justify-center py-4 px-12 gap-y-1 text-center">
            <p className="text-sm text-foreground-light">{t('advisor.enable_button')}</p>
            <p className="text-center text-xs text-foreground-lighter mb-2">
              {t('advisor.enable_description')}
            </p>
            <div className="flex items-center gap-x-2">
              <DocsButton href={`${DOCS_URL}/guides/database/extensions/index_advisor`} />
              <EnableIndexAdvisorButton />
            </div>
          </div>
        </QueryPanelSection>
      </QueryPanelContainer>
    )
  }

  return (
    <QueryPanelContainer className="h-full overflow-y-auto py-0 pt-4">
      {(columnName || suggestedSelectQuery) && (
        <QueryPanelSection className="pt-2 pb-6 border-b">
          <div className="flex flex-col gap-y-3">
            <div>
              <h4 className="mb-2">{t('advisor.recommendation_reason')}</h4>
              {columnName && (
                <p className="text-sm text-foreground-light">
                  {t('advisor.recommendation_for_column')} <span className="font-mono">{columnName}</span>
                </p>
              )}
            </div>
            {suggestedSelectQuery && (
              <div className="flex flex-col gap-y-4">
                <p className="text-sm text-foreground-light">{t('advisor.based_on_query')}</p>
                <CodeBlock
                  hideLineNumbers
                  value={suggestedSelectQuery}
                  language="sql"
                  className={cn(
                    'max-w-full max-h-[200px]',
                    '!py-2 !px-2.5 prose dark:prose-dark',
                    '[&>code]:m-0 [&>code>span]:flex [&>code>span]:flex-wrap'
                  )}
                />
              </div>
            )}
          </div>
        </QueryPanelSection>
      )}
      <QueryPanelSection className="pt-2 mb-6">
        <div className="mb-4 flex flex-col gap-y-1">
          <h4 className="mb-2">{t('advisor.indexes_in_use')}</h4>
          <p className="text-sm text-foreground-light">
            {t('advisor.indexes_in_use_description', { plural: (usedIndexes ?? []).length > 1 ? 's' : '' })}
          </p>
        </div>
        {isLoading && <GenericSkeletonLoader />}
        {isError && (
          <AlertError
            projectRef={project?.ref}
            error={error}
            subject="Failed to retrieve indexes in use"
          />
        )}
        {isSuccess && (
          <div>
            {usedIndexes.length === 0 && (
              <div className="border rounded border-dashed flex flex-col items-center justify-center py-4 px-12 gap-y-1 text-center">
                <p className="text-sm text-foreground-light">
                  {t('advisor.no_indexes_used')}
                </p>
                <p className="text-center text-xs text-foreground-lighter">
                  {t('advisor.no_indexes_used_description')}
                </p>
              </div>
            )}
            {usedIndexes.map((index) => {
              return (
                <div
                  key={index.name}
                  className="flex items-center gap-x-4 bg-surface-100 border first:rounded-tl first:rounded-tr border-b-0 last:border-b last:rounded-b px-2 py-2"
                >
                  <div className="flex items-center gap-x-2">
                    <Table2 size={14} className="text-foreground-light" />
                    <span className="text-xs font-mono text-foreground-light">
                      {index.schema}.{index.table}
                    </span>
                  </div>
                  <span className="text-xs font-mono">{index.name}</span>
                </div>
              )
            })}
          </div>
        )}
      </QueryPanelSection>
      <QueryPanelSection className="flex flex-col gap-y-6 py-6 border-t">
        <div className="flex flex-col gap-y-1">
          {(!isSuccessIndexAdvisorResult || indexAdvisorResult !== null) && (
            <h4 className="mb-2">{t('advisor.new_recommendations')}</h4>
          )}
          {isLoadingExtensions ? (
            <GenericSkeletonLoader />
          ) : !isIndexAdvisorEnabled ? (
            <IndexAdvisorDisabledState />
          ) : (
            <>
              {isLoadingIndexAdvisorResult && <GenericSkeletonLoader />}
              {isErrorIndexAdvisorResult && (
                <AlertError
                  projectRef={project?.ref}
                  error={indexAdvisorError}
                  subject="Failed to retrieve result from index advisor"
                />
              )}
              {isSuccessIndexAdvisorResult && (
                <>
                  {indexAdvisorResult === null ? (
                    <Admonition
                      type="default"
                      showIcon={true}
                      title={t('advisor.recommendations_not_available')}
                      description={t('advisor.recommendations_not_available_description')}
                    />
                  ) : (index_statements ?? []).length === 0 ? (
                    <Alert_Shadcn_ className="[&>svg]:rounded-full">
                      <Check />
                      <AlertTitle_Shadcn_>{t('advisor.query_optimized')}</AlertTitle_Shadcn_>
                      <AlertDescription_Shadcn_>
                        {t('advisor.query_optimized_description')}
                      </AlertDescription_Shadcn_>
                    </Alert_Shadcn_>
                  ) : (
                    <>
                      {isLinterWarning ? (
                        <Alert_Shadcn_
                          variant="default"
                          className="border-brand-400 bg-alternative [&>svg]:p-0.5 [&>svg]:bg-transparent [&>svg]:text-brand my-3"
                        >
                          <Lightbulb />
                          <AlertTitle_Shadcn_>
                            {t('advisor.recommendation_alert_title', {
                              count: index_statements.length,
                              plural: index_statements.length > 1 ? 's' : '',
                            })}
                          </AlertTitle_Shadcn_>
                          <AlertDescription_Shadcn_>
                            <Trans
                              i18nKey="advisor.recommendation_alert_description"
                              values={{
                                improvement: totalImprovement.toFixed(2),
                                indexes: index_statements.length > 1 ? 'indexes' : 'index',
                              }}
                              components={{ 1: <span className="text-brand" /> }}
                            />
                          </AlertDescription_Shadcn_>
                        </Alert_Shadcn_>
                      ) : (
                        <IndexImprovementText
                          indexStatements={index_statements}
                          totalCostBefore={total_cost_before}
                          totalCostAfter={total_cost_after}
                          className="text-sm text-foreground-light"
                        />
                      )}
                      <CodeBlock
                        hideLineNumbers
                        value={index_statements.join(';\n') + ';'}
                        language="sql"
                        className={cn(
                          'max-w-full max-h-[310px]',
                          '!py-3 !px-3.5 prose dark:prose-dark transition',
                          '[&>code]:m-0 [&>code>span]:flex [&>code>span]:flex-wrap'
                        )}
                      />
                      <p className="text-sm text-foreground-light mt-3">
                        {t('advisor.recommendation_note')}
                      </p>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </QueryPanelSection>
      {isIndexAdvisorEnabled && hasIndexRecommendation && (
        <>
          <QueryPanelSection className="py-6 border-t">
            <div className="flex flex-col gap-y-1">
              <h4 className="mb-2">{t('advisor.query_costs')}</h4>
              <div className="border rounded-md flex flex-col bg-surface-100">
                <QueryPanelScoreSection
                  name={t('advisor.total_cost')}
                  description={t('advisor.total_cost_description')}
                  before={total_cost_before}
                  after={total_cost_after}
                />
                <Collapsible_Shadcn_ open={showStartupCosts} onOpenChange={setShowStartupCosts}>
                  <CollapsibleContent_Shadcn_ asChild className="pb-3">
                    <QueryPanelScoreSection
                      hideArrowMarkers
                      className="border-t"
                      name={t('advisor.startup_cost')}
                      description={t('advisor.startup_cost_description')}
                      before={startup_cost_before}
                      after={startup_cost_after}
                    />
                  </CollapsibleContent_Shadcn_>
                  <CollapsibleTrigger_Shadcn_ className="text-xs py-1.5 border-t text-foreground-light bg-studio w-full rounded-b-md">
                    View {showStartupCosts ? 'less' : 'more'}
                  </CollapsibleTrigger_Shadcn_>
                </Collapsible_Shadcn_>
              </div>
            </div>
          </QueryPanelSection>
          <QueryPanelSection className="py-6 border-t">
            <div className="flex flex-col gap-y-2">
              <h4 className="mb-2">{t('advisor.faq')}</h4>
              <Accordion_Shadcn_ collapsible type="single" className="border rounded-md">
                <AccordionItem_Shadcn_ value="1">
                  <AccordionTrigger className="px-4 py-3 text-sm font-normal text-foreground-light hover:text-foreground transition [&[data-state=open]]:text-foreground">
                    {t('advisor.faq_units_title')}
                  </AccordionTrigger>
                  <AccordionContent_Shadcn_ className="px-4 text-foreground-light">
                    {t('advisor.faq_units_content')}
                  </AccordionContent_Shadcn_>
                </AccordionItem_Shadcn_>
                <AccordionItem_Shadcn_ value="2" className="border-b-0">
                  <AccordionTrigger className="px-4 py-3 text-sm font-normal text-foreground-light hover:text-foreground transition [&[data-state=open]]:text-foreground">
                    {t('advisor.faq_prioritize_title')}
                  </AccordionTrigger>
                  <AccordionContent_Shadcn_ className="px-4 text-foreground-light [&>div]:space-y-2">
                    <p>{t('advisor.faq_prioritize_content_1')}</p>
                    <p>
                      {t('advisor.faq_prioritize_content_2')}
                    </p>
                    <p>
                      {t('advisor.faq_prioritize_content_3')}
                    </p>
                  </AccordionContent_Shadcn_>
                </AccordionItem_Shadcn_>
              </Accordion_Shadcn_>
            </div>
          </QueryPanelSection>
        </>
      )}

      {isIndexAdvisorEnabled && hasIndexRecommendation && (
        <div className="bg-studio sticky bottom-0 border-t py-3 flex items-center justify-between px-5">
          <div className="flex flex-col gap-y-0.5 text-xs">
            <span>{t('advisor.apply_index')}</span>
            <span className="text-xs text-foreground-light">
              {t('advisor.apply_index_description')}
            </span>
          </div>
          <Button
            disabled={isExecuting}
            loading={isExecuting}
            type="primary"
            onClick={() => createIndex()}
          >
            {t('advisor.create_index')}
          </Button>
        </div>
      )}
    </QueryPanelContainer>
  )
}
