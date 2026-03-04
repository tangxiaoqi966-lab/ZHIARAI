import type { PostgresPolicy } from '@supabase/postgres-meta'
import { isEmpty } from 'lodash'
import Link from 'next/link'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { useParams } from 'common'
import {
  PolicyTableRow,
  PolicyTableRowProps,
} from 'components/interfaces/Auth/Policies/PolicyTableRow'
import { ProtectedSchemaWarning } from 'components/interfaces/Database/ProtectedSchemaWarning'
import { NoSearchResults } from 'components/ui/NoSearchResults'
import { useDatabasePolicyDeleteMutation } from 'data/database-policies/database-policy-delete-mutation'
import { useTableUpdateMutation } from 'data/tables/table-update-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Button, Card, CardContent } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

interface PoliciesProps {
  search?: string
  schema: string
  tables: PolicyTableRowProps['table'][]
  hasTables: boolean
  isLocked: boolean
  visibleTableIds: Set<number>
  onSelectCreatePolicy: (table: string) => void
  onSelectEditPolicy: (policy: PostgresPolicy) => void
  onResetSearch?: () => void
}

export const Policies = ({
  search,
  schema,
  tables,
  hasTables,
  isLocked,
  visibleTableIds,
  onSelectCreatePolicy,
  onSelectEditPolicy: onSelectEditPolicyAI,
  onResetSearch,
}: PoliciesProps) => {
  const { t } = useTranslation()
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const [selectedTableToToggleRLS, setSelectedTableToToggleRLS] = useState<{
    id: number
    schema: string
    name: string
    rls_enabled: boolean
  }>()
  const [selectedPolicyToDelete, setSelectedPolicyToDelete] = useState<any>({})

  const { mutate: updateTable, isPending: isUpdatingTable } = useTableUpdateMutation({
    onError: (error) => {
      toast.error(t('auth_policies.toggle_rls_error', { error: error.message }))
    },
    onSettled: () => {
      closeConfirmModal()
    },
  })

  const { mutate: deleteDatabasePolicy, isPending: isDeletingPolicy } =
    useDatabasePolicyDeleteMutation({
      onSuccess: () => {
        toast.success(t('auth_policies.delete_policy_success'))
      },
      onSettled: () => {
        closeConfirmModal()
      },
    })

  const closeConfirmModal = useCallback(() => {
    setSelectedPolicyToDelete({})
    setSelectedTableToToggleRLS(undefined)
  }, [])

  const onSelectToggleRLS = useCallback(
    (table: { id: number; schema: string; name: string; rls_enabled: boolean }) => {
      setSelectedTableToToggleRLS(table)
    },
    []
  )

  const onSelectEditPolicy = useCallback(
    (policy: PostgresPolicy) => {
      onSelectEditPolicyAI(policy)
    },
    [onSelectEditPolicyAI]
  )

  const onSelectDeletePolicy = useCallback((policy: PostgresPolicy) => {
    setSelectedPolicyToDelete(policy)
  }, [])

  // Methods that involve some API
  const onToggleRLS = async () => {
    if (!selectedTableToToggleRLS) return console.error('Table is required')

    const payload = {
      id: selectedTableToToggleRLS.id,
      rls_enabled: !selectedTableToToggleRLS.rls_enabled,
    }

    updateTable({
      projectRef: project?.ref!,
      connectionString: project?.connectionString,
      id: selectedTableToToggleRLS.id,
      name: selectedTableToToggleRLS.name,
      schema: selectedTableToToggleRLS.schema,
      payload: payload,
    })
  }

  const onDeletePolicy = async () => {
    if (!project) return console.error('Project is required')
    deleteDatabasePolicy({
      projectRef: project.ref,
      connectionString: project.connectionString,
      originalPolicy: selectedPolicyToDelete,
    })
  }

  const handleCreatePolicy = useCallback(
    (tableData: PolicyTableRowProps['table']) => {
      onSelectCreatePolicy(tableData.name)
    },
    [onSelectCreatePolicy]
  )

  if (!hasTables) {
    return (
      <Card className="w-full bg-transparent">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <h2 className="heading-default">{t('auth_policies.no_tables_title')}</h2>

          <p className="text-sm text-foreground-light text-center mb-4">
            {t('auth_policies.no_tables_description')}
          </p>
          <Button asChild type="default">
            <Link href={`/project/${ref}/editor`}>{t('auth_policies.create_table')}</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-y-4 pb-4">
        {isLocked && <ProtectedSchemaWarning schema={schema} entity="policies" />}
        {tables.length > 0 ? (
          <>
            {tables.map((table) => {
              const isVisible = visibleTableIds.has(table.id)
              return (
                <section
                  key={table.id}
                  hidden={!isVisible}
                  aria-hidden={!isVisible}
                  data-testid={`policy-table-${table.name}`}
                >
                  <PolicyTableRow
                    table={table}
                    isLocked={schema === 'realtime' ? true : isLocked}
                    onSelectToggleRLS={onSelectToggleRLS}
                    onSelectCreatePolicy={handleCreatePolicy}
                    onSelectEditPolicy={onSelectEditPolicy}
                    onSelectDeletePolicy={onSelectDeletePolicy}
                  />
                </section>
              )
            })}
            {!!search && visibleTableIds.size === 0 && (
              <NoSearchResults searchString={search ?? ''} onResetFilter={onResetSearch} />
            )}
          </>
        ) : hasTables ? (
          <NoSearchResults searchString={search ?? ''} onResetFilter={onResetSearch} />
        ) : null}
      </div>

      <ConfirmationModal
        visible={!isEmpty(selectedPolicyToDelete)}
        variant="destructive"
        title={t('auth_policies.delete_policy_modal_title')}
        description={t('auth_policies.delete_policy_modal_description', { name: selectedPolicyToDelete.name })}
        confirmLabel={t('auth_policies.delete')}
        confirmLabelLoading={t('auth_policies.deleting')}
        loading={isDeletingPolicy}
        onCancel={closeConfirmModal}
        onConfirm={onDeletePolicy}
      />

      <ConfirmationModal
        visible={selectedTableToToggleRLS !== undefined}
        variant={selectedTableToToggleRLS?.rls_enabled ? 'destructive' : 'default'}
        title={selectedTableToToggleRLS?.rls_enabled ? t('auth_policies.disable_rls_modal_title') : t('auth_policies.enable_rls_modal_title')}
        description={selectedTableToToggleRLS?.rls_enabled ? t('auth_policies.disable_rls_modal_description', { name: selectedTableToToggleRLS?.name }) : t('auth_policies.enable_rls_modal_description', { name: selectedTableToToggleRLS?.name })}
        confirmLabel={selectedTableToToggleRLS?.rls_enabled ? t('auth_policies.disable_rls_confirm') : t('auth_policies.enable_rls_confirm')}
        confirmLabelLoading={selectedTableToToggleRLS?.rls_enabled ? t('auth_policies.disabling_rls') : t('auth_policies.enabling_rls')}
        loading={isUpdatingTable}
        onCancel={closeConfirmModal}
        onConfirm={onToggleRLS}
      />
    </>
  )
}
