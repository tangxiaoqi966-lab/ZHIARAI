import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useDebounce } from '@uidotdev/usehooks'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { FilePlus, FolderPlus, Plus, X } from 'lucide-react'
import { useRouter } from 'next/router'
import { type ChangeEvent, type KeyboardEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useLocalStorage } from 'hooks/misc/useLocalStorage'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useProfile } from 'lib/profile'
import { getAppStateSnapshot } from 'state/app-state'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import {
  InnerSideBarFilters,
  InnerSideBarFilterSearchInput,
  InnerSideBarFilterSortDropdown,
  InnerSideBarFilterSortDropdownItem,
} from 'ui-patterns/InnerSideMenu'
import { SearchList } from './SQLEditorNavV2/SearchList'
import { SQLEditorNav } from './SQLEditorNavV2/SQLEditorNav'

export const SQLEditorMenu = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const { ref } = useParams()
  const { profile } = useProfile()
  const { data: project } = useSelectedProjectQuery()
  const snapV2 = useSqlEditorV2StateSnapshot()

  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [sort, setSort] = useLocalStorage<'name' | 'inserted_at'>(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_SORT(ref ?? ''),
    'inserted_at'
  )

  const appState = getAppStateSnapshot()
  const debouncedSearch = useDebounce(search, 500)

  const { can: canCreateSQLSnippet } = useAsyncCheckPermissions(
    PermissionAction.CREATE,
    'user_content',
    {
      resource: { type: 'sql', owner_id: profile?.id },
      subject: { id: profile?.id },
    }
  )

  const createNewFolder = () => {
    if (!ref) return console.error('Project ref is required')
    setSearch('')
    setShowSearch(false)
    snapV2.addNewFolder({ projectRef: ref })
  }

  const handleNewQuery = async () => {
    if (!ref) return console.error('Project ref is required')
    if (!project) return console.error('Project is required')
    if (!profile) return console.error('Profile is required')
    if (!canCreateSQLSnippet) {
      return toast(t('sql_editor.menu.insufficient_permissions_save_queries'))
    }
    try {
      router.push(`/project/${ref}/sql/new?skip=true`)
      setSearch('')
      setShowSearch(false)
    } catch (error: any) {
      toast.error(t('sql_editor.menu.failed_create_query', { message: error.message }))
    }
  }

  useEffect(() => {
    setShowSearch(debouncedSearch.length > 0)
  }, [debouncedSearch])

  return (
    <div className="h-full flex flex-col justify-between">
      <div className="flex flex-col gap-y-4 flex-grow">
        <div className="mt-4 mx-4 flex items-center justify-between gap-x-2">
          <InnerSideBarFilters className="w-full p-0 gap-0">
            <InnerSideBarFilterSearchInput
              name="search-queries"
              placeholder={t('sql_editor.menu.search_placeholder')}
              aria-labelledby={t('sql_editor.menu.search_label')}
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value
                setSearch(value)
                if (value.length === 0) setShowSearch(false)
              }}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.code === 'Escape') {
                  setSearch('')
                  setShowSearch(false)
                }
              }}
            >
              {showSearch ? (
                <Tooltip>
                  <TooltipTrigger
                    className="absolute right-1 top-[.4rem] md:top-[.3rem] transition-colors text-foreground-light hover:text-foreground"
                    onClick={() => {
                      setSearch('')
                      setShowSearch(false)
                    }}
                  >
                    <X size={18} />
                  </TooltipTrigger>
                  <TooltipContent>{t('sql_editor.menu.clear_search')}</TooltipContent>
                </Tooltip>
              ) : (
                <InnerSideBarFilterSortDropdown
                  value={sort}
                  onValueChange={(value: any) => setSort(value)}
                >
                  <InnerSideBarFilterSortDropdownItem key="name" value="name">
                    {t('sql_editor.menu.sort_alphabetical')}
                  </InnerSideBarFilterSortDropdownItem>
                  <InnerSideBarFilterSortDropdownItem key="inserted_at" value="inserted_at">
                    {t('sql_editor.menu.sort_created_at')}
                  </InnerSideBarFilterSortDropdownItem>
                </InnerSideBarFilterSortDropdown>
              )}
            </InnerSideBarFilterSearchInput>
          </InnerSideBarFilters>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                data-testid="sql-editor-new-query-button"
                type="default"
                icon={<Plus className="text-foreground" />}
                className="w-[26px]"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom" className="w-48">
              <DropdownMenuItem className="gap-x-2" onClick={() => handleNewQuery()}>
                <FilePlus size={14} />
                {t('sql_editor.menu.create_snippet')}
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-x-2" onClick={() => createNewFolder()}>
                <FolderPlus size={14} />
                {t('sql_editor.menu.create_folder')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {showSearch ? <SearchList search={debouncedSearch} /> : <SQLEditorNav sort={sort} />}
      </div>

      <div className="p-4 border-t sticky bottom-0 bg-studio">
        <Button block type="default" onClick={() => appState.setOnGoingQueriesPanelOpen(true)}>
          {t('sql_editor.menu.view_running_queries')}
        </Button>
      </div>
    </div>
  )
}
