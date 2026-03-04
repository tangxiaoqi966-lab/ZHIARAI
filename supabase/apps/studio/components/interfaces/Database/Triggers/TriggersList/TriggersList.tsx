import type { PostgresTrigger } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useIsInlineEditorEnabled } from 'components/interfaces/Account/Preferences/InlineEditorSettings'
import { ProtectedSchemaWarning } from 'components/interfaces/Database/ProtectedSchemaWarning'
import { TriggerSheet } from 'components/interfaces/Database/Triggers/TriggerSheet'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import SchemaSelector from 'components/ui/SchemaSelector'
import { useDatabaseTriggerDeleteMutation } from 'data/database-triggers/database-trigger-delete-mutation'
import { useDatabaseTriggersQuery } from 'data/database-triggers/database-triggers-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useIsProtectedSchema, useProtectedSchemas } from 'hooks/useProtectedSchemas'
import { DOCS_URL } from 'lib/constants'
import { DatabaseZap, Search } from 'lucide-react'
import { parseAsBoolean, parseAsJson, parseAsString, useQueryState } from 'nuqs'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { useEditorPanelStateSnapshot } from 'state/editor-panel-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { Card, Input, Table, TableBody, TableHead, TableHeader, TableRow } from 'ui'
import { EmptyStatePresentational } from 'ui-patterns'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { CreateTriggerButtons } from './CreateTriggerButtons'
import { TriggerList } from './TriggerList'
import { generateTriggerCreateSQL } from './TriggerList.utils'
import {
  ReportsSelectFilter,
  selectFilterSchema,
} from '@/components/interfaces/Reports/v2/ReportsSelectFilter'
import { TextConfirmModal } from '@/components/ui/TextConfirmModalWrapper'
import { useTranslation } from 'react-i18next'

export const TriggersList = () => {
  const { t } = useTranslation()
  const { data: project } = useSelectedProjectQuery()
  const { openSidebar } = useSidebarManagerSnapshot()
  const { selectedSchema, setSelectedSchema } = useQuerySchemaState()

  const [filterString, setFilterString] = useQueryState('search', parseAsString.withDefault(''))
  const [tablesFilter, setTablesFilter] = useQueryState(
    'tables',
    parseAsJson(selectFilterSchema.parse).withDefault([])
  )

  const isInlineEditorEnabled = useIsInlineEditorEnabled()
  const {
    templates: editorPanelTemplates,
    setValue: setEditorPanelValue,
    setTemplates: setEditorPanelTemplates,
    setInitialPrompt: setEditorPanelInitialPrompt,
  } = useEditorPanelStateSnapshot()

  const { data: protectedSchemas } = useProtectedSchemas()
  const { isSchemaLocked } = useIsProtectedSchema({ schema: selectedSchema })

  const { data = [] } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const hasTables =
    data.filter((a) => !protectedSchemas.find((s) => s.name === a.schema)).length > 0

  const {
    data: triggers = [],
    error,
    isPending,
    isSuccess,
    isError,
  } = useDatabaseTriggersQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { can: canCreateTriggers } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'triggers'
  )

  const [showCreateTriggerForm, setShowCreateTriggerForm] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )

  const [triggerIdToEdit, setTriggerToEdit] = useQueryState('edit', parseAsString)
  const triggerToEdit = triggers?.find((fn) => fn.id.toString() === triggerIdToEdit)

  const [triggerIdToDuplicate, setTriggerToDuplicate] = useQueryState('duplicate', parseAsString)
  const triggerToDuplicate = triggers?.find((fn) => fn.id.toString() === triggerIdToDuplicate)

  const [triggerIdToDelete, setTriggerToDelete] = useQueryState('delete', parseAsString)
  const triggerToDelete = triggers?.find((fn) => fn.id.toString() === triggerIdToDelete)

  const {
    mutate: deleteDatabaseTrigger,
    isPending: isDeletingTrigger,
    isSuccess: isSuccessDelete,
  } = useDatabaseTriggerDeleteMutation({
    onSuccess: (_, variables) => {
      toast.success(t('triggers.successfully_removed', { name: variables.trigger.name }))
      setTriggerToDelete(null)
    },
  })

  const createTrigger = () => {
    setTriggerToDuplicate(null)
    if (isInlineEditorEnabled) {
      setEditorPanelInitialPrompt(t('triggers.create_trigger'))
      setEditorPanelValue(`create trigger trigger_name
after insert or update or delete on table_name
for each row
execute function function_name();`)
      if (editorPanelTemplates.length > 0) {
        setEditorPanelTemplates([])
      }
      openSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
    } else {
      setShowCreateTriggerForm(true)
    }
  }

  const editTrigger = (trigger: PostgresTrigger) => {
    setTriggerToDuplicate(null)
    if (isInlineEditorEnabled) {
      setEditorPanelValue(generateTriggerCreateSQL(trigger))
      setEditorPanelTemplates([])
      openSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
    } else {
      setTriggerToEdit(trigger.id.toString())
    }
  }

  const duplicateTrigger = (trigger: PostgresTrigger) => {
    if (isInlineEditorEnabled) {
      const dupTrigger = {
        ...trigger,
        name: `${trigger.name}_duplicate`,
      }
      setEditorPanelValue(generateTriggerCreateSQL(dupTrigger))
      setEditorPanelTemplates([])
      openSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
    } else {
      setTriggerToDuplicate(trigger.id.toString())
    }
  }

  const onDeleteTrigger = () => {
    if (!project) return console.error('Project is required')
    if (!triggerToDelete) return console.error('Trigger ID is required')

    deleteDatabaseTrigger({
      projectRef: project.ref,
      connectionString: project.connectionString,
      trigger: triggerToDelete,
    })
  }

  const schemaTriggers = triggers.filter((x) => x.schema === selectedSchema)
  const tables = Array.from(new Set(schemaTriggers.map((x) => x.table))).sort()

  useEffect(() => {
    if (isSuccess && !!triggerIdToEdit && !triggerToEdit) {
      toast(t('triggers.trigger_not_found'))
      setTriggerToEdit(null)
    }
  }, [isSuccess, setTriggerToEdit, triggerIdToEdit, triggerToEdit])

  useEffect(() => {
    if (isSuccess && !!triggerIdToDuplicate && !triggerToDuplicate) {
      toast(t('triggers.trigger_not_found'))
      setTriggerToDuplicate(null)
    }
  }, [isSuccess, triggerIdToDuplicate, triggerToDuplicate, setTriggerToDuplicate])

  useEffect(() => {
    if (isSuccess && !!triggerIdToDelete && !triggerToDelete && !isSuccessDelete) {
      toast(t('triggers.trigger_not_found'))
      setTriggerToDelete(null)
    }
  }, [isSuccess, triggerIdToDelete, triggerToDelete, isSuccessDelete, setTriggerToDelete])

  if (isPending) {
    return <GenericSkeletonLoader />
  }

  if (isError) {
    return <AlertError error={error} subject={t('triggers.failed_to_retrieve')} />
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 flex-wrap">
          <div className="flex flex-col lg:flex-row lg:items-center gap-2 flex-wrap">
            <SchemaSelector
              className="w-full lg:w-[180px]"
              size="tiny"
              showError={false}
              selectedSchemaName={selectedSchema}
              onSelectSchema={setSelectedSchema}
            />
            <Input
              placeholder={t('triggers.search_placeholder')}
              size="tiny"
              icon={<Search />}
              value={filterString}
              className="w-full lg:w-52"
              onChange={(e) => setFilterString(e.target.value)}
            />
            <ReportsSelectFilter
              label={t('home.tables')}
              options={tables.map((type) => ({ label: type, value: type }))}
              value={tablesFilter ?? []}
              onChange={setTablesFilter}
              showSearch
            />
          </div>
          <div className="flex items-center gap-2">
            <DocsButton href={`${DOCS_URL}/guides/database/postgres/triggers`} />
            {!isSchemaLocked && (
              <CreateTriggerButtons
                hasTables={hasTables}
                canCreateTriggers={canCreateTriggers}
                selectedSchema={selectedSchema}
                onCreateTrigger={createTrigger}
                showPlusIcon={true}
              />
            )}
          </div>
        </div>

        {isSchemaLocked && <ProtectedSchemaWarning schema={selectedSchema} entity="triggers" />}

        {!isSchemaLocked && (schemaTriggers ?? []).length === 0 ? (
          <EmptyStatePresentational
            icon={DatabaseZap}
            title={t('triggers.add_first_trigger')}
            description={t('triggers.description')}
          >
            <CreateTriggerButtons
              hasTables={hasTables}
              canCreateTriggers={canCreateTriggers}
              selectedSchema={selectedSchema}
              onCreateTrigger={createTrigger}
              showPlusIcon={false}
              buttonType="default"
            />
          </EmptyStatePresentational>
        ) : (
          <div className="w-full overflow-hidden overflow-x-auto">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead key="name">{t('table_editor.name')}</TableHead>
                    <TableHead key="table">{t('home.tables')}</TableHead>
                    <TableHead key="function">{t('home.functions')}</TableHead>
                    <TableHead key="events">Events</TableHead>
                    <TableHead key="orientation">Orientation</TableHead>
                    <TableHead key="enabled" className="w-20">
                      Enabled
                    </TableHead>
                    <TableHead key="buttons" className="w-1/12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TriggerList
                    editTrigger={editTrigger}
                    duplicateTrigger={duplicateTrigger}
                    deleteTrigger={(trigger) => setTriggerToDelete(trigger.id.toString())}
                  />
                </TableBody>
              </Table>
            </Card>
          </div>
        )}
      </div>

      <TriggerSheet
        selectedTrigger={triggerToEdit || triggerToDuplicate}
        open={showCreateTriggerForm || !!triggerToEdit || !!triggerToDuplicate}
        onClose={() => {
          setShowCreateTriggerForm(false)
          setTriggerToEdit(null)
          setTriggerToDuplicate(null)
        }}
        isDuplicatingTrigger={!!triggerToDuplicate}
      />

      <TextConfirmModal
        variant="warning"
        visible={!!triggerToDelete}
        onCancel={() => setTriggerToDelete(null)}
        onConfirm={() => onDeleteTrigger()}
        title={t('triggers.delete_title')}
        loading={isDeletingTrigger}
        confirmLabel={t('triggers.delete_confirm_label', { name: triggerToDelete?.name })}
        confirmPlaceholder={t('triggers.delete_placeholder')}
        confirmString={triggerToDelete?.name ?? ''}
        text={
          <>
            {t('triggers.delete_text_intro')}{' '}
            <span className="text-bold text-foreground">{triggerToDelete?.name}</span> {t('triggers.delete_text_schema')}{' '}
            <span className="text-bold text-foreground">{triggerToDelete?.schema}</span>
          </>
        }
        alert={{
          title: t('triggers.delete_alert'),
        }}
      />
    </>
  )
}
