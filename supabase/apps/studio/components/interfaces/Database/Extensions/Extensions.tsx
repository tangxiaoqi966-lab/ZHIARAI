import { PermissionAction } from '@supabase/shared-types/out/constants'
import { isNull, partition } from 'lodash'
import { AlertCircle, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useParams } from 'common'
import InformationBox from 'components/ui/InformationBox'
import { NoSearchResults } from 'components/ui/NoSearchResults'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  Card,
  Input,
  ShadowScrollArea,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { ExtensionRow } from './ExtensionRow'
import { HIDDEN_EXTENSIONS, SEARCH_TERMS } from './Extensions.constants'

export const Extensions = () => {
  const { t } = useTranslation()
  const { filter } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [filterString, setFilterString] = useState<string>('')

  const { data, isPending: isLoading } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const extensions =
    filterString.length === 0
      ? data ?? []
      : (data ?? []).filter((ext) => {
          const nameMatchesSearch = ext.name.toLowerCase().includes(filterString.toLowerCase())
          const searchTermsMatchesSearch = (SEARCH_TERMS[ext.name] || []).some((x) =>
            x.includes(filterString.toLowerCase())
          )
          return nameMatchesSearch || searchTermsMatchesSearch
        })
  const extensionsWithoutHidden = extensions.filter((ext) => !HIDDEN_EXTENSIONS.includes(ext.name))
  const [enabledExtensions, disabledExtensions] = partition(
    extensionsWithoutHidden,
    (ext) => !isNull(ext.installed_version)
  )

  const { can: canUpdateExtensions, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'extensions'
  )

  useEffect(() => {
    if (filter !== undefined) setFilterString(filter as string)
  }, [filter])

  return (
    <>
      <div className="mb-4">
        <Input
          size="tiny"
          placeholder={t('extensions.search_placeholder')}
          value={filterString}
          onChange={(e) => setFilterString(e.target.value)}
          className="w-52"
          icon={<Search />}
        />
      </div>

      {isPermissionsLoaded && !canUpdateExtensions && (
        <InformationBox
          icon={<AlertCircle className="text-foreground-light" size={18} strokeWidth={2} />}
          title={t('extensions.update_permission_error')}
        />
      )}

      {isLoading ? (
        <GenericSkeletonLoader />
      ) : (
        <Card>
          <ShadowScrollArea stickyLastColumn>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead key="name">{t('extensions.name')}</TableHead>
                  <TableHead key="version">{t('extensions.version')}</TableHead>
                  <TableHead key="schema">{t('extensions.schema')}</TableHead>
                  <TableHead key="description">{t('extensions.description')}</TableHead>
                  <TableHead key="used-by">{t('extensions.used_by')}</TableHead>
                  <TableHead key="links">{t('extensions.links')}</TableHead>
                  {/* 
                    [Joshen] All these classes are just to make the last column sticky 
                    I reckon we can pull these out into the Table component where we can declare
                    sticky columns via props, but we can do that if we start to have more tables
                    in the dashboard with sticky columns
                  */}
                  <TableHead key="enabled" className="px-0">
                    <div className="!bg-200 px-4 w-full h-full flex items-center border-l">
                      {t('extensions.enabled')}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...enabledExtensions, ...disabledExtensions].map((extension) => (
                  <ExtensionRow key={extension.name} extension={extension} />
                ))}
                {extensions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <NoSearchResults
                        className="border-none !p-0 bg-transparent"
                        searchString={filterString}
                        onResetFilter={() => setFilterString('')}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ShadowScrollArea>
        </Card>
      )}
    </>
  )
}
