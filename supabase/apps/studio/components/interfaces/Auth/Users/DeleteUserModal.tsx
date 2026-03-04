import { useParams } from 'common'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import { useUserDeleteMutation } from 'data/auth/user-delete-mutation'
import { User } from 'data/auth/users-infinite-query'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

interface DeleteUserModalProps {
  visible: boolean
  selectedUser?: User
  onClose: () => void
  onDeleteSuccess?: () => void
}

export const DeleteUserModal = ({
  visible,
  selectedUser,
  onClose,
  onDeleteSuccess,
}: DeleteUserModalProps) => {
  const { t } = useTranslation()
  const { ref: projectRef } = useParams()

  const { mutate: deleteUser, isPending: isDeleting } = useUserDeleteMutation({
    onSuccess: () => {
      toast.success(t('successfully_deleted') + ' ' + selectedUser?.email)
      onDeleteSuccess?.()
    },
  })

  const handleDeleteUser = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (selectedUser?.id === undefined) {
      return toast.error(t('failed_delete_user_id_not_found'))
    }
    deleteUser({ projectRef, userId: selectedUser.id })
  }

  return (
    <ConfirmationModal
      visible={visible}
      variant="destructive"
      title={t('confirm_delete_user')}
      loading={isDeleting}
      confirmLabel={t('delete')}
      onCancel={() => onClose()}
      onConfirm={() => handleDeleteUser()}
      alert={{
        title: t('delete_user_irreversible'),
        description: t('delete_user_description'),
      }}
    >
      <p className="text-sm text-foreground-light">
        {t('delete_user_warning')}{' '}
        {selectedUser?.email ?? selectedUser?.phone ?? t('this_user')}?
      </p>
    </ConfirmationModal>
  )
}
