import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'
import { TFunction } from 'i18next'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import { ArrowUpRight } from 'lucide-react'
import type { Organization } from 'types'

export const generateSettingsMenu = (
  ref?: string,
  project?: Project,
  organization?: Organization,
  features?: {
    auth?: boolean
    authProviders?: boolean
    edgeFunctions?: boolean
    storage?: boolean
    invoices?: boolean
    legacyJwtKeys?: boolean
    logDrains?: boolean
    billing?: boolean
  },
  t?: TFunction
): ProductMenuGroup[] => {
  if (!IS_PLATFORM) {
    return [
      {
        title: t ? t('navigation.project_settings') : 'Project Settings',
        items: [
          {
            name: t ? t('navigation.settings.log_drains') : `Log Drains`,
            key: `log-drains`,
            url: `/project/${ref}/settings/log-drains`,
            items: [],
          },
        ],
      },
    ]
  }

  const isProjectActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  const legacyJwtKeysEnabled = features?.legacyJwtKeys ?? true
  const billingEnabled = features?.billing ?? true

  return [
    {
      title: t ? t('navigation.project_settings') : 'Project Settings',
      items: [
        {
          name: t ? t('navigation.settings.general') : 'General',
          key: 'general',
          url: `/project/${ref}/settings/general`,
          items: [],
        },
        {
          name: t ? t('navigation.settings.compute_and_disk') : 'Compute and Disk',
          key: 'compute-and-disk',
          url: `/project/${ref}/settings/compute-and-disk`,
          items: [],
          disabled: !isProjectActive,
        },
        {
          name: t ? t('navigation.settings.infrastructure') : 'Infrastructure',
          key: 'infrastructure',
          url: `/project/${ref}/settings/infrastructure`,
          items: [],
          disabled: !isProjectActive,
        },

        {
          name: t ? t('navigation.settings.integrations') : 'Integrations',
          key: 'integrations',
          url: `/project/${ref}/settings/integrations`,
          items: [],
          disabled: !isProjectActive,
        },

        {
          name: t ? t('navigation.api_keys') : 'API Keys',
          key: 'api-keys',
          url: `/project/${ref}/settings/api-keys/new`,
          items: [],
          disabled: !isProjectActive,
        },
        {
          name: t ? t('navigation.settings.jwt_keys') : 'JWT Keys',
          key: 'jwt',
          url: legacyJwtKeysEnabled
            ? `/project/${ref}/settings/jwt`
            : `/project/${ref}/settings/jwt/signing-keys`,
          items: [],
          disabled: !isProjectActive,
        },

        {
          name: t ? t('navigation.settings.log_drains') : `Log Drains`,
          key: `log-drains`,
          url: `/project/${ref}/settings/log-drains`,
          items: [],
          disabled: !isProjectActive,
        },
        {
          name: t ? t('navigation.settings.addons') : 'Add Ons',
          key: 'addons',
          url: `/project/${ref}/settings/addons`,
          items: [],
        },
      ],
    },
    {
      title: t ? t('navigation.settings.configuration') : 'Configuration',
      items: [
        {
          name: t ? t('navigation.settings.data_api') : 'Data API',
          key: 'api',
          url: `/project/${ref}/integrations/data_api/overview`,
          items: [],
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
          disabled: !isProjectActive,
        },
        {
          name: t ? t('navigation.settings.vault') : 'Vault',
          key: 'vault',
          url: `/project/${ref}/integrations/vault/overview`,
          items: [],
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
          label: 'Beta',
          disabled: !isProjectActive,
        },
      ],
    },
    {
      title: t ? t('navigation.settings.billing') : 'Billing',
      items: [
        ...(billingEnabled
          ? [
              {
                name: t ? t('navigation.settings.subscription') : 'Subscription',
                key: 'subscription',
                url: `/org/${organization?.slug}/billing`,
                items: [],
                rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
              },
            ]
          : []),
        {
          name: t ? t('navigation.settings.usage') : 'Usage',
          key: 'usage',
          url: `/org/${organization?.slug}/usage?projectRef=${ref}`,
          items: [],
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
        },
      ],
    },
  ]
}
