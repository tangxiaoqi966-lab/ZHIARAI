import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useParams } from 'common'
import { replicaKeys } from 'data/read-replicas/keys'
import { useReadReplicaRemoveMutation } from 'data/read-replicas/replica-remove-mutation'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useTranslation } from 'react-i18next'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

interface DropAllReplicasConfirmationModalProps {
  visible: boolean
  onSuccess: () => void
  onCancel: () => void
}

const DropAllReplicasConfirmationModal = ({
  visible,
  onSuccess,
  onCancel,
}: DropAllReplicasConfirmationModalProps) => {
  const { t } = useTranslation()
  const { ref: projectRef } = useParams()
  const queryClient = useQueryClient()
  const { data: databases } = useReadReplicasQuery({ projectRef })
  const { mutateAsync: removeReadReplica, isPending: isRemoving } = useReadReplicaRemoveMutation()

  const onConfirmRemove = async () => {
    if (!projectRef) return console.error('Project is required')
    if (databases === undefined) return console.error('Unable to retrieve replicas')
    if (databases.length === 1) toast(t('settings.infrastructure.no_read_replicas'))

    const replicas = databases.filter((db) => db.identifier !== projectRef)
    try {
      await Promise.all(
        replicas.map((db) =>
          removeReadReplica({
            projectRef,
            identifier: db.identifier,
            invalidateReplicaQueries: false,
          })
        )
      )
      toast.success(t('settings.infrastructure.tearing_down_all_replicas_toast'))

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: replicaKeys.list(projectRef) }),
        queryClient.invalidateQueries({ queryKey: replicaKeys.loadBalancers(projectRef) }),
      ])

      onSuccess()
      onCancel()
    } catch (error) {
      toast.error(t('settings.infrastructure.failed_drop_all_replicas'))
    }
  }

  return (
    <ConfirmationModal
      variant={'destructive'}
      size="medium"
      loading={isRemoving}
      visible={visible}
      title={t('settings.infrastructure.confirm_drop_all_replicas_title')}
      confirmLabel={t('settings.infrastructure.drop_all_replicas_button')}
      confirmLabelLoading={t('settings.infrastructure.dropping_all_replicas')}
      onCancel={() => onCancel()}
      onConfirm={() => onConfirmRemove()}
      alert={{
        title: t('settings.infrastructure.action_cannot_be_undone'),
        description: t('settings.infrastructure.drop_all_replicas_alert_desc'),
      }}
    >
      <p className="text-sm">{t('settings.infrastructure.before_deleting_all_replicas')}</p>
      <ul className="text-sm text-foreground-light list-disc pl-6">
        <li>{t('settings.infrastructure.drop_all_replicas_notice_1')}</li>
      </ul>
    </ConfirmationModal>
  )
}

export default DropAllReplicasConfirmationModal
