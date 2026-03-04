import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { replicaKeys } from '@/data/read-replicas/keys'
import { useParams } from 'common'
import { useReadReplicaRemoveMutation } from 'data/read-replicas/replica-remove-mutation'
import type { Database } from 'data/read-replicas/replicas-query'
import { formatDatabaseID } from 'data/read-replicas/replicas.utils'
import { useTranslation } from 'react-i18next'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { REPLICA_STATUS } from './InstanceConfiguration.constants'

interface DropReplicaConfirmationModalProps {
  selectedReplica?: Database
  onSuccess: () => void
  onCancel: () => void
}

export const DropReplicaConfirmationModal = ({
  selectedReplica,
  onSuccess,
  onCancel,
}: DropReplicaConfirmationModalProps) => {
  const { t } = useTranslation()
  const { ref: projectRef } = useParams()
  const queryClient = useQueryClient()
  const formattedId = formatDatabaseID(selectedReplica?.identifier ?? '')
  const { mutate: removeReadReplica, isPending: isRemoving } = useReadReplicaRemoveMutation({
    onSuccess: () => {
      toast.success(t('settings.infrastructure.tearing_down_replica_toast', { id: formattedId }))

      // [Joshen] Temporarily optimistic rendering until API supports immediate status update
      queryClient.setQueriesData(
        { queryKey: replicaKeys.list(projectRef) },
        (old: Database[] | undefined) => {
          const updatedReplicas = old?.map((x) => {
            if (x.identifier === selectedReplica?.identifier) {
              return { ...x, status: REPLICA_STATUS.GOING_DOWN }
            }
            return x
          })
          return updatedReplicas
        }
      )

      onSuccess()
      onCancel()
    },
  })

  const onConfirmRemove = async () => {
    if (!projectRef) return console.error('Project is required')
    if (selectedReplica === undefined)
      return toast.error(t('settings.infrastructure.no_replica_selected'))

    removeReadReplica({
      projectRef,
      identifier: selectedReplica.identifier,
      invalidateReplicaQueries: true,
    })
  }

  return (
    <ConfirmationModal
      variant="destructive"
      size="medium"
      loading={isRemoving}
      visible={selectedReplica !== undefined}
      title={t('settings.infrastructure.confirm_drop_replica_title', { id: formattedId })}
      confirmLabel={t('settings.infrastructure.drop_replica_action')}
      confirmLabelLoading={t('settings.infrastructure.dropping_replica')}
      onCancel={() => onCancel()}
      onConfirm={() => onConfirmRemove()}
      alert={{
        title: t('settings.infrastructure.action_cannot_be_undone'),
        description: t('settings.infrastructure.drop_replica_alert_desc'),
      }}
    >
      <p className="text-sm">{t('settings.infrastructure.before_deleting_replica')}</p>
      <ul className="text-sm text-foreground-light py-1 list-disc mx-4 space-y-1">
        <li>{t('settings.infrastructure.drop_replica_notice_1')}</li>
      </ul>
    </ConfirmationModal>
  )
}
