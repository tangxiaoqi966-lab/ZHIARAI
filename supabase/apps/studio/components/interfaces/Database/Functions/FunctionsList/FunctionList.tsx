import { PermissionAction } from '@supabase/shared-types/out/constants'
import { includes, noop, sortBy } from 'lodash'
import { Copy, Edit, Edit2, FileText, MoreVertical, Trash } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  TableCell,
  TableRow,
} from 'ui'
import type { DatabaseFunction } from 'data/database-functions/database-functions-query'

import { useTranslation } from 'react-i18next'

interface FunctionListProps {
  schema: string
  filterString: string
  isLocked: boolean
  returnTypeFilter: string[]
  securityFilter: string[]
  duplicateFunction: (fn: any) => void
  editFunction: (fn: any) => void
  deleteFunction: (fn: any) => void
  functions: DatabaseFunction[]
}

const FunctionList = ({
  schema,
  filterString,
  isLocked,
  returnTypeFilter,
  securityFilter,
  duplicateFunction = noop,
  editFunction = noop,
  deleteFunction = noop,
  functions,
}: FunctionListProps) => {
  const { t } = useTranslation()
  const router = useRouter()
  const { data: selectedProject } = useSelectedProjectQuery()
  const aiSnap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()

  const filteredFunctions = (functions ?? []).filter((x) => {
    const matchesName = includes(x.name.toLowerCase(), filterString.toLowerCase())
    const matchesReturnType =
      returnTypeFilter.length === 0 || returnTypeFilter.includes(x.return_type)
    const matchesSecurity =
      securityFilter.length === 0 ||
      (securityFilter.includes('definer') && x.security_definer) ||
      (securityFilter.includes('invoker') && !x.security_definer)
    return matchesName && matchesReturnType && matchesSecurity
  })
  const _functions = sortBy(
    filteredFunctions.filter((x) => x.schema == schema),
    (func) => func.name.toLocaleLowerCase()
  )
  const projectRef = selectedProject?.ref
  const { can: canUpdateFunctions } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'functions'
  )

  if (_functions.length === 0 && filterString.length === 0) {
    return (
      <TableRow key={schema}>
        <TableCell colSpan={5}>
          <p className="text-sm text-foreground">{t('functions.no_functions_created')}</p>
          <p className="text-sm text-foreground-light">
            {t('functions.no_functions_in_schema', { schema })}
          </p>
        </TableCell>
      </TableRow>
    )
  }

  if (_functions.length === 0 && filterString.length > 0) {
    return (
      <TableRow key={schema}>
        <TableCell colSpan={5}>
          <p className="text-sm text-foreground">{t('functions.no_results_found')}</p>
          <p className="text-sm text-foreground-light">
            {t('functions.search_no_results', { search: filterString })}
          </p>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <>
      {_functions.map((x) => {
        const isApiDocumentAvailable = schema == 'public' && x.return_type !== 'trigger'

        return (
          <TableRow key={x.id}>
            <TableCell className="truncate">
              <Button
                type="text"
                className="text-link-table-cell text-sm disabled:opacity-100 disabled:no-underline p-0 hover:bg-transparent title"
                disabled={isLocked || !canUpdateFunctions}
                onClick={() => editFunction(x)}
                title={x.name}
              >
                {x.name}
              </Button>
            </TableCell>
            <TableCell className="table-cell">
              <p
                title={x.argument_types}
                className={`truncate ${x.argument_types ? 'text-foreground-light' : 'text-foreground-muted'}`}
              >
                {x.argument_types || '–'}
              </p>
            </TableCell>
            <TableCell className="table-cell">
              {x.return_type === 'trigger' ? (
                <Link
                  href={`/project/${projectRef}/database/triggers?search=${x.name}`}
                  className="truncate text-link"
                  title={x.return_type}
                >
                  {x.return_type}
                </Link>
              ) : (
                <p title={x.return_type} className="truncate text-foreground-light">
                  {x.return_type}
                </p>
              )}
            </TableCell>
            <TableCell className="table-cell">
              <p className="truncate text-foreground-light">
                {x.security_definer ? t('functions.definer') : t('functions.invoker')}
              </p>
            </TableCell>
            <TableCell className="text-right">
              {!isLocked && (
                <div className="flex items-center justify-end">
                  {canUpdateFunctions ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-label="More options"
                          type="default"
                          className="px-1"
                          icon={<MoreVertical />}
                        />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="left" className="w-52">
                        {isApiDocumentAvailable && (
                          <DropdownMenuItem
                            className="space-x-2"
                            onClick={() => router.push(`/project/${projectRef}/api?rpc=${x.name}`)}
                          >
                            <FileText size={14} />
                            <p>{t('functions.client_api_docs')}</p>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="space-x-2" onClick={() => editFunction(x)}>
                          <Edit2 size={14} />
                          <p>{t('functions.edit_function')}</p>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="space-x-2"
                          onClick={() => {
                            openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
                            aiSnap.newChat({
                              name: t('functions.update_function_chat_title', { name: x.name }),
                              initialInput: t('functions.update_function_initial_input'),
                              suggestions: {
                                title: t('functions.update_function_suggestions_title'),
                                prompts: [
                                  {
                                    label: t('functions.prompt_rename_function'),
                                    description: t('functions.prompt_rename_function_desc'),
                                  },
                                  {
                                    label: t('functions.prompt_modify_function'),
                                    description: t('functions.prompt_modify_function_desc'),
                                  },
                                  {
                                    label: t('functions.prompt_add_trigger'),
                                    description: t('functions.prompt_add_trigger_desc'),
                                  },
                                ],
                              },
                              sqlSnippets: [x.complete_statement],
                            })
                          }}
                        >
                          <Edit size={14} />
                          <p>{t('functions.edit_with_assistant')}</p>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="space-x-2"
                          onClick={() => duplicateFunction(x)}
                        >
                          <Copy size={14} />
                          <p>{t('functions.duplicate_function')}</p>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="space-x-2" onClick={() => deleteFunction(x)}>
                          <Trash size={14} className="text-destructive" />
                          <p>{t('functions.delete_function')}</p>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <ButtonTooltip
                      disabled
                      type="default"
                      icon={<MoreVertical />}
                      className="px-1"
                      tooltip={{
                        content: {
                          side: 'left',
                          text: t('functions.update_permission_error'),
                        },
                      }}
                    />
                  )}
                </div>
              )}
            </TableCell>
          </TableRow>
        )
      })}
    </>
  )
}

export default FunctionList
