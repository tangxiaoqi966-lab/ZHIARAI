import { TFunction } from 'i18next'
import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'
import { IS_PLATFORM } from 'lib/constants'

export const generateRealtimeMenu = (project: Project, t?: TFunction): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'
  const showRealtimeSettings = IS_PLATFORM

  return [
    {
      title: t ? t('navigation.tools') : 'Tools',
      items: [
        {
          name: t ? t('realtime.inspector') : 'Inspector',
          key: 'inspector',
          url: `/project/${ref}/realtime/inspector`,
          items: [],
        },
      ],
    },
    {
      title: t ? t('navigation.configuration') : 'Configuration',
      items: [
        {
          name: t ? t('navigation.policies') : 'Policies',
          key: 'policies',
          url: `/project/${ref}/realtime/policies`,
          items: [],
        },
        ...(showRealtimeSettings
          ? [
              {
                name: t ? t('navigation.settings') : 'Settings',
                key: 'settings',
                url: `/project/${ref}/realtime/settings`,
                items: [],
              },
            ]
          : []),
      ],
    },
  ]
}
