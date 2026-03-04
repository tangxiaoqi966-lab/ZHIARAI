import { SupportCategories } from '@supabase/shared-types/out/constants'
import { SupportLink } from 'components/interfaces/Support/SupportLink'
import { PropsWithChildren, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Admonition } from 'ui-patterns/admonition'

import { Button } from 'ui'
import { useTrack } from 'lib/telemetry/track'

export interface AlertErrorProps {
  projectRef?: string
  subject?: string
  error?: { message: string } | null
  layout?: 'vertical' | 'horizontal'
  className?: string
  showIcon?: boolean
  showInstructions?: boolean
  showErrorPrefix?: boolean
  additionalActions?: React.ReactNode
}

const ContactSupportButton = ({
  projectRef,
  subject,
  error,
}: {
  projectRef?: string
  subject?: string
  error?: { message: string } | null
}) => {
  const { t } = useTranslation()
  return (
    <Button asChild type="default" className="w-min">
      <SupportLink
        queryParams={{
          category: SupportCategories.DASHBOARD_BUG,
          projectRef,
          subject,
          error: error?.message,
        }}
      >
        {t('integrations.errors.contact_support')}
      </SupportLink>
    </Button>
  )
}

// [Joshen] To standardize the language for all error UIs
export const AlertError = ({
  projectRef,
  subject,
  error,
  className,
  showIcon = true,
  layout = 'horizontal',
  showInstructions = true,
  showErrorPrefix = true,
  children,
  additionalActions,
}: PropsWithChildren<AlertErrorProps>) => {
  const { t } = useTranslation()
  const track = useTrack()
  const hasTrackedRef = useRef(false)

  const formattedErrorMessage = error?.message?.includes('503')
    ? '503 Service Temporarily Unavailable'
    : error?.message

  useEffect(() => {
    if (!hasTrackedRef.current) {
      hasTrackedRef.current = true
      if (Math.random() < 0.1) {
        track('dashboard_error_created', {
          source: 'admonition',
        })
      }
    }
  }, [track])

  return (
    <Admonition
      type="warning"
      layout={additionalActions ? 'vertical' : layout}
      showIcon={showIcon}
      title={subject}
      description={
        <>
          {error?.message && (
            <p>
              {showErrorPrefix && `${t('schema_selector.error_prefix')} `}
              {formattedErrorMessage}
            </p>
          )}
          {showInstructions && (
            <p>
              {t('integrations.errors.try_refreshing')}
            </p>
          )}
          {children}
        </>
      }
      actions={
        additionalActions ? (
          <>
            {additionalActions}
            <ContactSupportButton projectRef={projectRef} subject={subject} error={error} />
          </>
        ) : (
          <ContactSupportButton projectRef={projectRef} subject={subject} error={error} />
        )
      }
      className={className}
    />
  )
}

export default AlertError
