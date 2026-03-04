import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'

import { useParams } from 'common'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import AuthLayout from './AuthLayout'

export const AuthEmailsLayout = ({ children }: PropsWithChildren<{}>) => {
  const { t } = useTranslation()
  const { ref } = useParams()

  const showEmails = useIsFeatureEnabled('authentication:emails')

  const navItems = [
    {
      label: t('auth.templates'),
      href: `/project/${ref}/auth/templates`,
    },
    {
      label: t('auth.smtp_settings'),
      href: `/project/${ref}/auth/smtp`,
    },
  ]

  return (
    <AuthLayout>
      {showEmails ? (
        <PageLayout
          title={t('auth.emails')}
          subtitle={t('auth.emails_description')}
          navigationItems={navItems}
        >
          {children}
        </PageLayout>
      ) : (
        <UnknownInterface urlBack={`/project/${ref}/auth/users`} />
      )}
    </AuthLayout>
  )
}
