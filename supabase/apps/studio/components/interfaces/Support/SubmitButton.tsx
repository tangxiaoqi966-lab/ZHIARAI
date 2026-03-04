import type { MouseEventHandler } from 'react'
// End of third-party imports

import { Button } from 'ui'
import { useTranslation, Trans } from 'react-i18next'

interface SubmitButtonProps {
  isSubmitting: boolean
  userEmail: string
  onClick?: MouseEventHandler<HTMLButtonElement>
}

export function SubmitButton({ isSubmitting, userEmail, onClick }: SubmitButtonProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-3">
      <Button
        htmlType="submit"
        size="small"
        block
        disabled={isSubmitting}
        loading={isSubmitting}
        onClick={onClick}
      >
        {t('support.submit_request')}
      </Button>
      <p className="text-xs text-foreground-lighter text-balance pr-4">
        <Trans
          i18nKey="support.contact_email_info"
          values={{ email: userEmail }}
          components={{
            1: <span className="text-foreground font-medium" />,
          }}
        />
      </p>
    </div>
  )
}
