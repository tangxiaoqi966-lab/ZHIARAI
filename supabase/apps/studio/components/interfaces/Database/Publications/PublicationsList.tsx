import { PermissionAction } from '@supabase/shared-types/out/constants'
import { AlertCircle, Info, Search } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import InformationBox from 'components/ui/InformationBox'
import { NoSearchResults } from 'components/ui/NoSearchResults'
import { useDatabasePublicationsQuery } from 'data/database-publications/database-publications-query'
import { useDatabasePublicationUpdateMutation } from 'data/database-publications/database-publications-update-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  Button,
  Card,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { PublicationSkeleton } from './PublicationSkeleton'

interface PublicationEvent {
  event: string
  key: string
}

export const PublicationsList = () => {
  const { t } = useTranslation()
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [filterString, setFilterString] = useState<string>('')

  const {
    data = [],
    error,
    isPending: isLoading,
    isSuccess,
    isError,
  } = useDatabasePublicationsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { mutate: updatePublications } = useDatabasePublicationUpdateMutation({
    onSuccess: () => {
      toast.success(t('publications.successfully_updated_event'))
      setToggleListenEventValue(null)
    },
  })

  const { can: canUpdatePublications, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'publications'
  )

  const publicationEvents: PublicationEvent[] = [
    { event: 'Insert', key: 'publish_insert' },
    { event: 'Update', key: 'publish_update' },
    { event: 'Delete', key: 'publish_delete' },
    { event: 'Truncate', key: 'publish_truncate' },
  ]
  const publications = (
    filterString.length === 0
      ? data
      : data.filter((publication) => publication.name.includes(filterString))
  ).sort((a, b) => a.id - b.id)

  const [toggleListenEventValue, setToggleListenEventValue] = useState<{
    publication: any
    event: PublicationEvent
    currentStatus: any
  } | null>(null)

  const toggleListenEvent = async () => {
    if (!toggleListenEventValue || !project) return

    const { publication, event, currentStatus } = toggleListenEventValue
    const payload = {
      projectRef: project.ref,
      connectionString: project.connectionString,
      id: publication.id,
    } as any
    payload[`publish_${event.event.toLowerCase()}`] = !currentStatus
    updatePublications(payload)
  }

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Input
              size="tiny"
              icon={<Search />}
              className="w-48"
              placeholder={t('publications.search_placeholder')}
              value={filterString}
              onChange={(e: any) => setFilterString(e.target.value)}
            />
          </div>
          {isPermissionsLoaded && !canUpdatePublications && (
            <div className="w-[500px]">
              <InformationBox
                icon={<AlertCircle className="text-foreground-light" strokeWidth={2} />}
                title={t('publications.update_permission_error')}
              />
            </div>
          )}
        </div>
      </div>

      <div className="w-full overflow-hidden overflow-x-auto">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('publications.name')}</TableHead>
                <TableHead>{t('publications.system_id')}</TableHead>
                <TableHead>{t('publications.insert')}</TableHead>
                <TableHead>{t('publications.update')}</TableHead>
                <TableHead>{t('publications.delete')}</TableHead>
                <TableHead>{t('publications.truncate')}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 2 }).map((_, i) => <PublicationSkeleton key={i} index={i} />)}

              {isError && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <AlertError error={error} subject={t('publications.failed_to_retrieve')} />
                  </TableCell>
                </TableRow>
              )}

              {isSuccess &&
                publications.map((x) => (
                  <TableRow key={x.name}>
                    <TableCell>
                      <div className="flex items-center gap-x-2">
                        {x.name}
                        {/* [Joshen] Making this tooltip very specific for these 2 publications */}
                        {['supabase_realtime', 'supabase_realtime_messages_publication'].includes(
                          x.name
                        ) && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Info size={14} className="text-foreground-light" />
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              {x.name === 'supabase_realtime'
                                ? t('publications.realtime_tooltip')
                                : x.name === 'supabase_realtime_messages_publication'
                                  ? t('publications.realtime_messages_tooltip')
                                  : undefined}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{x.id}</TableCell>
                    {publicationEvents.map((event) => (
                      <TableCell key={event.key}>
                        <Switch
                          size="small"
                          checked={(x as any)[event.key]}
                          disabled={!canUpdatePublications}
                          onClick={() => {
                            setToggleListenEventValue({
                              publication: x,
                              event,
                              currentStatus: (x as any)[event.key],
                            })
                          }}
                        />
                      </TableCell>
                    ))}
                    <TableCell>
                      <div className="flex justify-end">
                        <Button asChild type="default" style={{ paddingTop: 3, paddingBottom: 3 }}>
                          <Link href={`/project/${ref}/database/publications/${x.id}`}>
                            {x.tables === null
                              ? t('publications.all_tables')
                              : x.tables.length === 1
                                ? t('publications.table_count', { count: x.tables.length })
                                : t('publications.table_count_plural', { count: x.tables.length })}
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {!isLoading && publications.length === 0 && (
        <NoSearchResults
          searchString={filterString}
          onResetFilter={() => setFilterString('')}
          className="rounded-t-none border-t-0"
        />
      )}

      <ConfirmationModal
        visible={toggleListenEventValue !== null}
        title={t('publications.toggle_confirm_title', { event: toggleListenEventValue?.event.event.toLowerCase() })}
        confirmLabel={t('publications.confirm')}
        confirmLabelLoading={t('publications.updating')}
        onCancel={() => setToggleListenEventValue(null)}
        onConfirm={() => {
          toggleListenEvent()
        }}
      >
        <p className="text-sm text-foreground-light">
          {t('publications.toggle_confirm_description', {
            action: toggleListenEventValue?.currentStatus ? t('publications.stop') : t('publications.start'),
            event: toggleListenEventValue?.event.event.toLowerCase(),
            name: toggleListenEventValue?.publication.name,
          })}
        </p>
      </ConfirmationModal>
    </>
  )
}
