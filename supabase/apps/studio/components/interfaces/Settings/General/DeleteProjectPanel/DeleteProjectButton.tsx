import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DeleteProjectModal } from './DeleteProjectModal'

export interface DeleteProjectButtonProps {
  type?: 'danger' | 'default'
}

export const DeleteProjectButton = ({ type = 'danger' }: DeleteProjectButtonProps) => {
  const { t } = useTranslation()
  const { data: project } = useSelectedProjectQuery()
  const [isOpen, setIsOpen] = useState(false)

  const { can: canDeleteProject } = useAsyncCheckPermissions(PermissionAction.UPDATE, 'projects', {
    resource: { project_id: project?.id },
  })

  return (
    <>
      <ButtonTooltip
        type={type}
        disabled={!canDeleteProject}
        onClick={() => setIsOpen(true)}
        tooltip={{
          content: {
            side: 'bottom',
            text: !canDeleteProject
              ? t('settings.general.delete_project_permission_error')
              : undefined,
          },
        }}
      >
        {t('settings.general.delete_project_button')}
      </ButtonTooltip>
      <DeleteProjectModal visible={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
