import { toast } from 'sonner'

import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { useProjectRestartMutation } from 'data/projects/project-restart-mutation'
import { replicaKeys } from 'data/read-replicas/keys'
import { Database } from 'data/read-replicas/replicas-query'
import { formatDatabaseID } from 'data/read-replicas/replicas.utils'
import { useTranslation } from 'react-i18next'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { REPLICA_STATUS } from './InstanceConfiguration.constants'

interface RestartReplicaConfirmationModalProps {
  selectedReplica?: Database
  onSuccess: () => void
  onCancel: () => void
}

export const RestartReplicaConfirmationModal = ({
  selectedReplica,
  onSuccess,
  onCancel,
}: RestartReplicaConfirmationModalProps) => {
  const { t } = useTranslation()
  const { ref } = useParams()
  const queryClient = useQueryClient()
  const formattedId = formatDatabaseID(selectedReplica?.identifier ?? '')

  const { mutate: restartProject, isPending: isRestartingProject } = useProjectRestartMutation({
    onSuccess: () => {
      toast.success(t('settings.infrastructure.restart_replica_toast', { id: formattedId }))

      // [Joshen] Temporarily optimistic rendering until API supports immediate status update
      queryClient.setQueriesData({ queryKey: replicaKeys.list(ref) }, (old: Database[]) => {
        const updatedReplicas = old.map((x) => {
          if (x.identifier === selectedReplica?.identifier) {
            return { ...x, status: REPLICA_STATUS.RESTARTING }
          } else {
            return x
          }
        })
        return updatedReplicas
      })

      queryClient.setQueriesData({ queryKey: replicaKeys.statuses(ref) }, (old: Database[]) => {
        const updatedReplicas = old.map((x) => {
          if (x.identifier === selectedReplica?.identifier) {
            return { ...x, status: REPLICA_STATUS.RESTARTING }
          } else {
            return x
          }
        })
        return updatedReplicas
      })

      onSuccess()
      onCancel()
    },
    onError: (error) => {
      toast.error(t('settings.infrastructure.failed_restart_replica', { message: error.message }))
    },
  })

  const onConfirmRestartReplica = () => {
    if (!ref) return console.error('Project is required')
    if (selectedReplica === undefined) return toast.error(t('settings.infrastructure.no_replica_selected'))
    restartProject({ ref, identifier: selectedReplica.identifier })
  }

  return (
    <ConfirmationModal
      size="medium"
      variant="warning"
      loading={isRestartingProject}
      visible={selectedReplica !== undefined}
      title={t('settings.infrastructure.confirm_restart_replica_title', { id: formattedId })}
      confirmLabel={t('settings.infrastructure.confirm_restart_replica_button')}
      confirmLabelLoading={t('settings.infrastructure.confirm_restart_replica_loading')}
      onCancel={() => onCancel()}
      onConfirm={() => onConfirmRestartReplica()}
    >
      <p className="text-sm">
        {t('settings.infrastructure.restart_replica_desc')}
      </p>
      <ul className="text-sm text-foreground-light py-1 list-disc mx-4 space-y-1">
        <li>
          {t('settings.infrastructure.restart_replica_notice_1')}
        </li>
      </ul>
      <p className="text-sm mt-2">{t('settings.infrastructure.restart_replica_confirm_question')}</p>
    </ConfirmationModal>
  )
}
