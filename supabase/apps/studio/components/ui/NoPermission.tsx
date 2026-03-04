import { useTranslation } from 'react-i18next'
import { Admonition } from 'ui-patterns/admonition'

interface NoPermissionProps {
  resourceText: string
  isFullPage?: boolean
}

export const NoPermission = ({ resourceText, isFullPage = false }: NoPermissionProps) => {
  const { t } = useTranslation()
  
  const NoPermissionMessage = (
    <Admonition
      type="warning"
      title={t('errors.no_permission_title', { resourceText })}
      description={t('errors.no_permission_description')}
    />
  )

  if (isFullPage) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="max-w-lg">
          {NoPermissionMessage}
        </div>
      </div>
    )
  } else {
    return NoPermissionMessage
  }
}

export default NoPermission
