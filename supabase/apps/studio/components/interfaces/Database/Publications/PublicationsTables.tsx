import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ChevronLeft, Search } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { NoSearchResults } from 'components/ui/NoSearchResults'
import { useDatabasePublicationsQuery } from 'data/database-publications/database-publications-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Card, LogoLoader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import { Admonition } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { PublicationsTableItem } from './PublicationsTableItem'

export const PublicationsTables = () => {
  const { t } = useTranslation()
  const { ref, id } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [filterString, setFilterString] = useState<string>('')

  const { can: canUpdatePublications, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'publications'
  )

  const { data: publications = [] } = useDatabasePublicationsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const selectedPublication = publications.find((pub) => pub.id === Number(id))

  const {
    data: tablesData = [],
    isPending: isLoading,
    isSuccess,
    isError,
    error,
  } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const tables = useMemo(() => {
    return tablesData.filter((table) =>
      filterString.length === 0 ? table : table.name.includes(filterString)
    )
  }, [tablesData, filterString])

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ButtonTooltip
              asChild
              type="outline"
              icon={<ChevronLeft />}
              style={{ padding: '5px' }}
              tooltip={{ content: { side: 'bottom', text: t('publications.back_to_list') } }}
            >
              <Link href={`/project/${ref}/database/publications`} />
            </ButtonTooltip>
            <div>
              <Input
                size="tiny"
                placeholder={t('publications.search_table_placeholder')}
                value={filterString}
                onChange={(e: any) => setFilterString(e.target.value)}
                icon={<Search />}
                className="w-48"
              />
            </div>
          </div>
          {!isLoadingPermissions && !canUpdatePublications && (
            <Admonition
              type="note"
              className="w-[500px]"
              title={t('publications.update_replications_permission_error')}
            />
          )}
        </div>
      </div>

      {(isLoading || isLoadingPermissions) && (
        <div className="mt-8">
          <LogoLoader />
        </div>
      )}

      {isError && <AlertError error={error} subject={t('publications.failed_to_retrieve_tables')} />}

      {isSuccess &&
        (tables.length === 0 ? (
          <NoSearchResults searchString={filterString} onResetFilter={() => setFilterString('')} />
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('publications.name')}</TableHead>
                  <TableHead>{t('publications.schema')}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t('publications.description')}</TableHead>
                  {/* 
                      We've disabled All tables toggle for publications. 
                      See https://github.com/supabase/supabase/pull/7233. 
                    */}
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {!!selectedPublication ? (
                  tables.map((table) => (
                    <PublicationsTableItem
                      key={table.id}
                      table={table}
                      selectedPublication={selectedPublication}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <p>{t('publications.publication_not_found', { id })}</p>
                      <p className="text-foreground-light">
                        {t('publications.publication_not_found_description')}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        ))}
    </>
  )
}
