import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { useIsInlineEditorEnabled } from 'components/interfaces/Account/Preferences/InlineEditorSettings'
import { CreateFunction } from 'components/interfaces/Database/Functions/CreateFunction'
import {
  ReportsSelectFilter,
  selectFilterSchema,
} from 'components/interfaces/Reports/v2/ReportsSelectFilter'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import SchemaSelector from 'components/ui/SchemaSelector'
import { useDatabaseFunctionDeleteMutation } from 'data/database-functions/database-functions-delete-mutation'
import type { DatabaseFunction } from 'data/database-functions/database-functions-query'
import { useDatabaseFunctionsQuery } from 'data/database-functions/database-functions-query'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useIsProtectedSchema } from 'hooks/useProtectedSchemas'
import { Search } from 'lucide-react'
import { useRouter } from 'next/router'
import { parseAsBoolean, parseAsJson, parseAsString, useQueryState } from 'nuqs'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useEditorPanelStateSnapshot } from 'state/editor-panel-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { AiIconAnimation, Card, Table, TableBody, TableHead, TableHeader, TableRow } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { ProtectedSchemaWarning } from '../../ProtectedSchemaWarning'
import FunctionList from './FunctionList'
import { TextConfirmModal } from '@/components/ui/TextConfirmModalWrapper'
import { useTranslation } from 'react-i18next'

const createFunctionSnippet = `create function function_name()
returns void
language plpgsql
as $$
begin
  -- Write your function logic here
end;
$$;`

export const FunctionsList = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const { search } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const aiSnap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()
  const { selectedSchema, setSelectedSchema } = useQuerySchemaState()
  const isInlineEditorEnabled = useIsInlineEditorEnabled()
  const {
    setValue: setEditorPanelValue,
    setTemplates: setEditorPanelTemplates,
    setInitialPrompt: setEditorPanelInitialPrompt,
  } = useEditorPanelStateSnapshot()

  const createFunction = () => {
    setSelectedFunctionIdToDuplicate(null)
    if (isInlineEditorEnabled) {
      setEditorPanelInitialPrompt(t('functions.create_function'))
      setEditorPanelValue(createFunctionSnippet)
      setEditorPanelTemplates([])
      openSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
    } else {
      setShowCreateFunctionForm(true)
    }
  }

  const duplicateFunction = (fn: DatabaseFunction) => {
    if (isInlineEditorEnabled) {
      const dupFn = {
        ...fn,
        name: `${fn.name}_duplicate`,
      }
      setEditorPanelInitialPrompt(t('functions.create_function'))
      setEditorPanelValue(dupFn.complete_statement)
      setEditorPanelTemplates([])
      openSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
    } else {
      setSelectedFunctionIdToDuplicate(fn.id.toString())
    }
  }

  const editFunction = (fn: DatabaseFunction) => {
    setSelectedFunctionIdToDuplicate(null)
    if (isInlineEditorEnabled) {
      setEditorPanelValue(fn.complete_statement)
      setEditorPanelTemplates([])
      openSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
    } else {
      setSelectedFunctionToEdit(fn.id.toString())
    }
  }

  const filterString = search ?? ''

  // Filters
  const [returnTypeFilter, setReturnTypeFilter] = useQueryState(
    'return_type',
    parseAsJson(selectFilterSchema.parse)
  )
  const [securityFilter, setSecurityFilter] = useQueryState(
    'security',
    parseAsJson(selectFilterSchema.parse)
  )

  const setFilterString = (str: string) => {
    const url = new URL(document.URL)
    if (str === '') {
      url.searchParams.delete('search')
    } else {
      url.searchParams.set('search', str)
    }
    router.push(url)
  }

  const { can: canCreateFunctions } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'functions'
  )

  const { isSchemaLocked } = useIsProtectedSchema({ schema: selectedSchema })

  // [Joshen] This is to preload the data for the Schema Selector
  useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const {
    data: functions = [],
    error,
    isPending: isLoading,
    isError,
    isSuccess,
  } = useDatabaseFunctionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  // Get unique return types from functions in the selected schema
  const schemaFunctions = functions.filter((fn) => fn.schema === selectedSchema)
  const uniqueReturnTypes = Array.from(new Set(schemaFunctions.map((fn) => fn.return_type))).sort()

  // Get security options based on what exists in the selected schema
  const hasDefiner = schemaFunctions.some((fn) => fn.security_definer)
  const hasInvoker = schemaFunctions.some((fn) => !fn.security_definer)
  const securityOptions = [
    ...(hasDefiner ? [{ label: 'Definer', value: 'definer' }] : []),
    ...(hasInvoker ? [{ label: 'Invoker', value: 'invoker' }] : []),
  ]

  const [showCreateFunctionForm, setShowCreateFunctionForm] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )

  const [functionIdToEdit, setSelectedFunctionToEdit] = useQueryState('edit', parseAsString)
  const functionToEdit = functions.find((fn) => fn.id.toString() === functionIdToEdit)

  const [functionIdToDuplicate, setSelectedFunctionIdToDuplicate] = useQueryState(
    'duplicate',
    parseAsString
  )
  const functionToDuplicate = functions.find((fn) => fn.id.toString() === functionIdToDuplicate)

  const [functionIdToDelete, setSelectedFunctionToDelete] = useQueryState('delete', parseAsString)
  const functionToDelete = functions.find((fn) => fn.id.toString() === functionIdToDelete)

  const {
    mutate: deleteDatabaseFunction,
    isPending: isDeletingFunction,
    isSuccess: isSuccessDelete,
  } = useDatabaseFunctionDeleteMutation({
    onSuccess: (_, variables) => {
      toast.success(t('functions.successfully_removed', { name: variables.func.name }))
      setSelectedFunctionToDelete(null)
    },
  })

  const onDeleteFunction = () => {
    if (!project) return console.error('Project is required')
    if (!functionToDelete) return console.error('Function is required')

    deleteDatabaseFunction({
      func: functionToDelete,
      projectRef: project.ref,
      connectionString: project.connectionString,
    })
  }

  useEffect(() => {
    if (isSuccess && !!functionIdToEdit && !functionToEdit) {
      toast(t('functions.function_not_found'))
      setSelectedFunctionToEdit(null)
    }
  }, [functionIdToEdit, functionToEdit, isSuccess, setSelectedFunctionToEdit])

  useEffect(() => {
    if (isSuccess && !!functionIdToDuplicate && !functionToDuplicate) {
      toast(t('functions.function_not_found'))
      setSelectedFunctionIdToDuplicate(null)
    }
  }, [functionIdToDuplicate, functionToDuplicate, isSuccess, setSelectedFunctionIdToDuplicate])

  useEffect(() => {
    if (isSuccess && !!functionIdToDelete && !functionToDelete && !isSuccessDelete) {
      toast(t('functions.function_not_found'))
      setSelectedFunctionToDelete(null)
    }
  }, [
    functionIdToDelete,
    functionToDelete,
    isSuccess,
    isSuccessDelete,
    setSelectedFunctionToDelete,
  ])

  if (isLoading) return <GenericSkeletonLoader />
  if (isError) return <AlertError error={error} subject={t('functions.failed_to_retrieve')} />

  return (
    <>
      {(functions ?? []).length === 0 ? (
        <div className="flex h-full w-full items-center justify-center">
          <ProductEmptyState
            title={t('functions.add_first_function')}
            ctaButtonLabel={t('functions.add_new_function')}
            onClickCta={() => createFunction()}
            disabled={!canCreateFunctions}
            disabledMessage={t('functions.create_permission_error')}
          >
            <p className="text-sm text-foreground-light">
              {t('functions.empty_state_description_1')}
            </p>
            <p className="text-sm text-foreground-light">
              {t('functions.empty_state_description_2')}
            </p>
          </ProductEmptyState>
        </div>
      ) : (
        <div className="w-full space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 flex-wrap">
            <div className="flex flex-col lg:flex-row lg:items-center gap-2">
              <SchemaSelector
                className="w-full lg:w-[180px]"
                size="tiny"
                showError={false}
                selectedSchemaName={selectedSchema}
                onSelectSchema={(schema) => {
                  setFilterString('')
                  // Wait for the filter to be cleared from the URL
                  setTimeout(() => {
                    setSelectedSchema(schema)
                  }, 50)
                }}
              />
              <Input
                placeholder={t('functions.search_placeholder')}
                size="tiny"
                icon={<Search />}
                value={filterString}
                className="w-full lg:w-52"
                onChange={(e) => setFilterString(e.target.value)}
              />
              <ReportsSelectFilter
                label={t('functions.return_type')}
                options={uniqueReturnTypes.map((type) => ({
                  label: type,
                  value: type,
                }))}
                value={returnTypeFilter ?? []}
                onChange={setReturnTypeFilter}
                showSearch
              />
              <ReportsSelectFilter
                label={t('functions.security')}
                options={securityOptions.map((option) => ({
                  ...option,
                  label: option.value === 'definer' ? t('functions.definer') : t('functions.invoker'),
                }))}
                value={securityFilter ?? []}
                onChange={setSecurityFilter}
              />
            </div>

            <div className="flex items-center gap-x-2">
              {!isSchemaLocked && (
                <>
                  <ButtonTooltip
                    disabled={!canCreateFunctions}
                    onClick={() => createFunction()}
                    className="flex-grow"
                    tooltip={{
                      content: {
                        side: 'bottom',
                        text: !canCreateFunctions
                          ? t('functions.create_permission_error')
                          : undefined,
                      },
                    }}
                  >
                    {t('functions.add_new_function')}
                  </ButtonTooltip>
                  <ButtonTooltip
                    type="default"
                    disabled={!canCreateFunctions}
                    className="px-1 pointer-events-auto"
                    icon={<AiIconAnimation size={16} />}
                    onClick={() => {
                      openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
                      aiSnap.newChat({
                        name: t('functions.create_new_function_chat_title'),
                        initialInput: t('functions.create_new_function_initial_input', { schema: selectedSchema }),
                      })
                    }}
                    tooltip={{
                      content: {
                        side: 'bottom',
                        text: !canCreateFunctions
                          ? t('functions.create_permission_error')
                          : t('functions.create_with_assistant_tooltip'),
                      },
                    }}
                  />
                </>
              )}
            </div>
          </div>

          {isSchemaLocked && <ProtectedSchemaWarning schema={selectedSchema} entity="functions" />}
          <Card>
            <Table className="table-fixed overflow-x-auto">
              <TableHeader>
                <TableRow>
                  <TableHead key="name">{t('table_editor.name')}</TableHead>
                  <TableHead key="arguments" className="table-cell">
                    {t('functions.arguments')}
                  </TableHead>
                  <TableHead key="return_type" className="table-cell">
                    {t('functions.return_type')}
                  </TableHead>
                  <TableHead key="security" className="table-cell w-[100px]">
                    {t('functions.security')}
                  </TableHead>
                  <TableHead key="buttons" className="w-1/6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <FunctionList
                  schema={selectedSchema}
                  filterString={filterString}
                  isLocked={isSchemaLocked}
                  returnTypeFilter={returnTypeFilter ?? []}
                  securityFilter={securityFilter ?? []}
                  duplicateFunction={duplicateFunction}
                  editFunction={editFunction}
                  deleteFunction={(fn) => setSelectedFunctionToDelete(fn.id.toString())}
                  functions={functions ?? []}
                />
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      <CreateFunction
        func={functionToEdit || functionToDuplicate}
        visible={showCreateFunctionForm || !!functionToEdit || !!functionToDuplicate}
        onClose={() => {
          setShowCreateFunctionForm(false)
          setSelectedFunctionToEdit(null)
          setSelectedFunctionIdToDuplicate(null)
        }}
        isDuplicating={!!functionToDuplicate}
      />

      <TextConfirmModal
        variant={'warning'}
        visible={!!functionToDelete}
        onCancel={() => setSelectedFunctionToDelete(null)}
        onConfirm={onDeleteFunction}
        title={t('functions.delete_title')}
        loading={isDeletingFunction}
        confirmLabel={t('functions.delete_confirm_label', { name: functionToDelete?.name })}
        confirmPlaceholder={t('functions.delete_placeholder')}
        confirmString={functionToDelete?.name ?? 'Unknown'}
        text={
          <>
            <span>{t('functions.delete_text_intro')}</span>{' '}
            <span className="text-bold text-foreground">{functionToDelete?.name}</span>{' '}
            <span>{t('functions.delete_text_from_schema')}</span>{' '}
            <span className="text-bold text-foreground">{functionToDelete?.schema}</span>
          </>
        }
        alert={{ title: t('functions.delete_alert') }}
      />
    </>
  )
}
