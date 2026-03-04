import { PostgresTrigger } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useDatabaseTriggersQuery } from 'data/database-triggers/database-triggers-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { includes, sortBy } from 'lodash'
import { Check, Copy, Edit, Edit2, MoreVertical, Trash, X } from 'lucide-react'
import Link from 'next/link'
import { parseAsJson, parseAsString, useQueryState } from 'nuqs'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  TableCell,
  TableRow,
} from 'ui'

import { generateTriggerCreateSQL } from './TriggerList.utils'
import { selectFilterSchema } from '@/components/interfaces/Reports/v2/ReportsSelectFilter'
import { useQuerySchemaState } from '@/hooks/misc/useSchemaQueryState'
import { useIsProtectedSchema } from '@/hooks/useProtectedSchemas'

import { useTranslation } from 'react-i18next'

interface TriggerListProps {
  editTrigger: (trigger: PostgresTrigger) => void
  duplicateTrigger: (trigger: PostgresTrigger) => void
  deleteTrigger: (trigger: PostgresTrigger) => void
}

export const TriggerList = ({ editTrigger, duplicateTrigger, deleteTrigger }: TriggerListProps) => {
  const { t } = useTranslation()
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const aiSnap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()

  const { can: canUpdateTriggers } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'triggers'
  )

  const { selectedSchema: schema } = useQuerySchemaState()
  const { isSchemaLocked: isLocked } = useIsProtectedSchema({ schema })
  const [filterString] = useQueryState('search', parseAsString.withDefault(''))
  const [tablesFilter] = useQueryState(
    'tables',
    parseAsJson(selectFilterSchema.parse).withDefault([])
  )

  const { data: triggers } = useDatabaseTriggersQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const filteredTriggers = (triggers ?? []).filter((x) => {
    const search = filterString?.toLowerCase()
    const matchesSearch =
      !search ||
      x.name.toLowerCase().includes(search) ||
      (!!x.function_name && includes(x.function_name.toLowerCase(), search))
    const matchesTables = !tablesFilter?.length || tablesFilter.includes(x.table)
    return matchesSearch && matchesTables
  })
  const _triggers = sortBy(
    filteredTriggers.filter((x) => x.schema == schema),
    (trigger) => trigger.name.toLocaleLowerCase()
  )

  if (_triggers.length === 0 && filterString.length === 0) {
    return (
      <TableRow key={schema}>
        <TableCell colSpan={7}>
          <p className="text-sm text-foreground">{t('triggers.no_triggers_created')}</p>
          <p className="text-sm text-foreground-light">
            {t('triggers.no_triggers_in_schema', { schema })}
          </p>
        </TableCell>
      </TableRow>
    )
  }

  if (_triggers.length === 0 && filterString.length > 0) {
    return (
      <TableRow key={schema}>
        <TableCell colSpan={7}>
          <p className="text-sm text-foreground">{t('triggers.no_results_found')}</p>
          <p className="text-sm text-foreground-light">
            {t('triggers.search_no_results', { search: filterString })}
          </p>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <>
      {_triggers.map((x) => (
        <TableRow key={x.id}>
          <TableCell className="space-x-2">
            <Button
              type="text"
              disabled={isLocked || !canUpdateTriggers}
              onClick={() => editTrigger(x)}
              title={x.name}
              className="text-link-table-cell text-left text-sm disabled:opacity-90 disabled:no-underline min-w-0 p-0 hover:bg-transparent font-medium max-w-48 title"
            >
              {x.name}
            </Button>
          </TableCell>

          <TableCell className="break-all">
            {x.table_id ? (
              <Link
                href={`/project/${projectRef}/editor/${x.table_id}`}
                className="text-link-table-cell block max-w-40 text-foreground-light"
              >
                {x.table}
              </Link>
            ) : (
              <p title={x.table} className="truncate">
                {x.table}
              </p>
            )}
          </TableCell>

          <TableCell className="space-x-2">
            {x.function_name ? (
              <Link
                href={`/project/${projectRef}/database/functions?search=${x.function_name}&schema=${x.function_schema}`}
                className="text-link-table-cell block max-w-40 text-foreground-light"
              >
                {x.function_name}
              </Link>
            ) : (
              <p className="truncate text-foreground-light">-</p>
            )}
          </TableCell>

          <TableCell>
            <div className="flex gap-2 flex-wrap">
              {x.events.map((event: string) => (
                <Badge key={event}>{`${x.activation} ${event}`}</Badge>
              ))}
            </div>
          </TableCell>

          <TableCell className="space-x-2">
            <p title={x.orientation} className="truncate">
              {x.orientation}
            </p>
          </TableCell>

          <TableCell>
            <div className="flex items-center justify-center">
              {x.enabled_mode !== 'DISABLED' ? (
                <Check strokeWidth={2} className="text-brand" />
              ) : (
                <X strokeWidth={2} />
              )}
            </div>
          </TableCell>

          <TableCell className="text-right">
            {!isLocked && (
              <div className="flex items-center justify-end">
                {canUpdateTriggers ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        aria-label="More options"
                        type="default"
                        className="px-1"
                        icon={<MoreVertical />}
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="bottom" align="end" className="w-52">
                      <DropdownMenuItem
                        className="space-x-2"
                        onClick={() => {
                          const sql = generateTriggerCreateSQL(x)
                          editTrigger(x)
                        }}
                      >
                        <Edit2 size={14} />
                        <p>{t('triggers.edit_trigger')}</p>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="space-x-2"
                        onClick={() => {
                          const sql = generateTriggerCreateSQL(x)
                          openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
                          aiSnap.newChat({
                            name: t('triggers.update_trigger_chat_title', { name: x.name }),
                            initialInput: t('triggers.update_trigger_initial_input', { schema: x.schema, table: x.table }),
                            suggestions: {
                              title: t('triggers.update_trigger_suggestions_title'),
                              prompts: [
                                {
                                  label: t('triggers.prompt_rename_trigger'),
                                  description: t('triggers.prompt_rename_trigger_desc'),
                                },
                                {
                                  label: t('triggers.prompt_change_events'),
                                  description: t('triggers.prompt_change_events_desc'),
                                },
                                {
                                  label: t('triggers.prompt_modify_timing'),
                                  description: t('triggers.prompt_modify_timing_desc'),
                                },
                              ],
                            },
                            sqlSnippets: [sql],
                          })
                        }}
                      >
                        <Edit size={14} />
                        <p>{t('triggers.edit_with_assistant')}</p>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="space-x-2" onClick={() => duplicateTrigger(x)}>
                        <Copy size={14} />
                        <p>{t('triggers.duplicate_trigger')}</p>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="space-x-2" onClick={() => deleteTrigger(x)}>
                        <Trash stroke="red" size={14} />
                        <p>{t('triggers.delete_trigger')}</p>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <ButtonTooltip
                    disabled
                    type="default"
                    className="px-1"
                    icon={<MoreVertical />}
                    tooltip={{
                      content: {
                        side: 'bottom',
                        text: t('triggers.update_permission_error'),
                      },
                    }}
                  />
                )}
              </div>
            )}
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}
