import { TFunction } from 'i18next'
import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import { IS_PLATFORM } from 'lib/constants'

export const generateAuthMenu = (
  ref: string,
  flags?: {
    authenticationSignInProviders: boolean
    authenticationRateLimits: boolean
    authenticationEmails: boolean
    authenticationMultiFactor: boolean
    authenticationAttackProtection: boolean
    authenticationShowOverview: boolean
    authenticationOauth21: boolean
    authenticationPerformance: boolean
  },
  t?: TFunction
): ProductMenuGroup[] => {
  const {
    authenticationSignInProviders,
    authenticationRateLimits,
    authenticationEmails,
    authenticationMultiFactor,
    authenticationAttackProtection,
    authenticationShowOverview,
    authenticationOauth21,
    authenticationPerformance,
  } = flags ?? {}

  return [
    {
      title: t ? t('navigation.manage') : 'Manage',
      items: [
        ...(authenticationShowOverview
          ? [{ name: t ? t('navigation.auth.overview') : 'Overview', key: 'overview', url: `/project/${ref}/auth/overview`, items: [] }]
          : []),
        { name: t ? t('navigation.auth.users') : 'Users', key: 'users', url: `/project/${ref}/auth/users`, items: [] },
        ...(authenticationOauth21
          ? [
              {
                name: t ? t('navigation.auth.oauth_apps') : 'OAuth Apps',
                key: 'oauth-apps',
                url: `/project/${ref}/auth/oauth-apps`,
                items: [],
              },
            ]
          : []),
      ],
    },
    ...(authenticationEmails && IS_PLATFORM
      ? [
          {
            title: t ? t('navigation.notifications') : 'Notifications',
            items: [
              ...(authenticationEmails
                ? [
                    {
                      name: t ? t('navigation.auth.email') : 'Email',
                      key: 'email',
                      pages: ['templates', 'smtp'],
                      url: `/project/${ref}/auth/templates`,
                      items: [],
                    },
                  ]
                : []),
            ],
          },
        ]
      : []),
    {
      title: t ? t('navigation.configuration') : 'Configuration',
      items: [
        {
          name: t ? t('navigation.auth.policies') : 'Policies',
          key: 'policies',
          url: `/project/${ref}/auth/policies`,
          items: [],
        },
        ...(IS_PLATFORM
          ? [
              ...(authenticationSignInProviders
                ? [
                    {
                      name: t ? t('navigation.auth.sign_in_providers') : 'Sign In / Providers',
                      key: 'sign-in-up',
                      pages: ['providers', 'third-party'],
                      url: `/project/${ref}/auth/providers`,
                      items: [],
                    },
                  ]
                : []),
              ...(authenticationOauth21
                ? [
                    {
                      name: t ? t('navigation.auth.oauth_server') : 'OAuth Server',
                      key: 'oauth-server',
                      url: `/project/${ref}/auth/oauth-server`,
                      label: 'Beta',
                    },
                  ]
                : []),
              {
                name: t ? t('navigation.auth.sessions') : 'Sessions',
                key: 'sessions',
                url: `/project/${ref}/auth/sessions`,
                items: [],
              },
              ...(authenticationRateLimits
                ? [
                    {
                      name: t ? t('navigation.auth.rate_limits') : 'Rate Limits',
                      key: 'rate-limits',
                      url: `/project/${ref}/auth/rate-limits`,
                      items: [],
                    },
                  ]
                : []),
              ...(authenticationMultiFactor
                ? [
                    {
                      name: t ? t('navigation.auth.mfa') : 'Multi-Factor',
                      key: 'mfa',
                      url: `/project/${ref}/auth/mfa`,
                      items: [],
                    },
                  ]
                : []),
              {
                name: t ? t('navigation.auth.url_configuration') : 'URL Configuration',
                key: 'url-configuration',
                url: `/project/${ref}/auth/url-configuration`,
                items: [],
              },
              ...(authenticationAttackProtection
                ? [
                    {
                      name: t ? t('navigation.auth.attack_protection') : 'Attack Protection',
                      key: 'protection',
                      url: `/project/${ref}/auth/protection`,
                      items: [],
                    },
                  ]
                : []),
              {
                name: t ? t('navigation.auth.hooks') : 'Auth Hooks',
                key: 'hooks',
                url: `/project/${ref}/auth/hooks`,
                items: [],
                label: 'Beta',
              },
              {
                name: t ? t('navigation.auth.audit_logs') : 'Audit Logs',
                key: 'audit-logs',
                url: `/project/${ref}/auth/audit-logs`,
                items: [],
              },
              ...(authenticationPerformance
                ? [
                    {
                      name: t ? t('navigation.auth.performance') : 'Performance',
                      key: 'performance',
                      url: `/project/${ref}/auth/performance`,
                      items: [],
                    },
                  ]
                : []),
            ]
          : []),
      ],
    },
  ]
}
