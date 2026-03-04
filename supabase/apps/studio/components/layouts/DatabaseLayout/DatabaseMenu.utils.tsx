import { ArrowUpRight } from 'lucide-react'

import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import { TFunction } from 'i18next'
import { IS_PLATFORM } from 'lib/constants'
import type { Project } from 'data/projects/project-detail-query'

export const generateDatabaseMenu = (
  project?: Project,
  flags?: {
    pgNetExtensionExists: boolean
    pitrEnabled: boolean
    columnLevelPrivileges: boolean
    showPgReplicate: boolean
    enablePgReplicate: boolean
    showRoles: boolean
    showWrappers: boolean
  },
  t?: TFunction
): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'
  const {
    pgNetExtensionExists,
    pitrEnabled,
    columnLevelPrivileges,
    showPgReplicate,
    enablePgReplicate,
    showRoles,
    showWrappers,
  } = flags || {}

  return [
    {
      title: t ? t('navigation.database_management') : 'Database Management',
      items: [
        {
          name: t ? t('navigation.database.schema_visualizer') : 'Schema Visualizer',
          key: 'schemas',
          url: `/project/${ref}/database/schemas`,
          items: [],
        },
        { name: t ? t('navigation.database.tables') : 'Tables', key: 'tables', url: `/project/${ref}/database/tables`, items: [] },
        {
          name: t ? t('navigation.database.functions') : 'Functions',
          key: 'functions',
          url: `/project/${ref}/database/functions`,
          items: [],
        },
        {
          name: t ? t('navigation.database.triggers') : 'Triggers',
          key: 'triggers',
          url: `/project/${ref}/database/triggers/data`,
          items: [],
        },
        {
          name: t ? t('navigation.database.enumerated_types') : 'Enumerated Types',
          key: 'types',
          url: `/project/${ref}/database/types`,

          items: [],
        },
        {
          name: t ? t('navigation.database.extensions') : 'Extensions',
          key: 'extensions',
          url: `/project/${ref}/database/extensions`,
          items: [],
        },
        {
          name: t ? t('navigation.database.indexes') : 'Indexes',
          key: 'indexes',
          url: `/project/${ref}/database/indexes`,
          items: [],
        },
        {
          name: t ? t('navigation.database.publications') : 'Publications',
          key: 'publications',
          url: `/project/${ref}/database/publications`,
          items: [],
        },
      ],
    },
    {
      title: t ? t('navigation.configuration') : 'Configuration',
      items: [
        ...(showRoles
          ? [{ name: t ? t('navigation.database.roles') : 'Roles', key: 'roles', url: `/project/${ref}/database/roles`, items: [] }]
          : []),
        ...(columnLevelPrivileges
          ? [
              {
                name: t ? t('navigation.database.column_privileges') : 'Column Privileges',
                key: 'column-privileges',
                url: `/project/${ref}/database/column-privileges`,
                items: [],
              },
            ]
          : []),
        {
          name: t ? t('navigation.database.policies') : 'Policies',
          key: 'policies',
          url: `/project/${ref}/auth/policies`,
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
          items: [],
        },
        { name: t ? t('navigation.database.settings') : 'Settings', key: 'settings', url: `/project/${ref}/database/settings`, items: [] },
        { name: t ? t('navigation.database.migrations') : 'Migrations', key: 'migrations', url: `/project/${ref}/database/migrations`, items: [] },
      ],
    },
    {
      title: t ? t('navigation.platform') : 'Platform',
      items: [
        ...(IS_PLATFORM && showPgReplicate
          ? [
              {
                name: t ? t('navigation.database.replication') : 'Replication',
                key: 'replication',
                url: `/project/${ref}/database/replication`,
                label: enablePgReplicate ? (t ? t('labels.new') : 'New') : undefined,
                items: [],
              },
            ]
          : []),
        ...(IS_PLATFORM
          ? [
              {
                name: t ? t('navigation.database.backups') : 'Backups',
                key: 'backups',
                url: pitrEnabled
                  ? `/project/${ref}/database/backups/pitr`
                  : `/project/${ref}/database/backups/scheduled`,
                items: [],
              },
            ]
          : []),
        ...(showWrappers
          ? [
              {
                name: t ? t('navigation.database.wrappers') : 'Wrappers',
                key: 'wrappers',
                url: `/project/${ref}/integrations?category=wrapper`,
                rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
                items: [],
              },
            ]
          : []),
        ...(!!pgNetExtensionExists
          ? [
              {
                name: t ? t('navigation.database.webhooks') : 'Webhooks',
                key: 'hooks',
                url: `/project/${ref}/integrations/webhooks/overview`,
                rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
                items: [],
              },
            ]
          : []),
      ],
    },
    {
      title: t ? t('navigation.tools') : 'Tools',
      items: [
        {
          name: t ? t('navigation.database.security_advisor') : 'Security Advisor',
          key: 'security-advisor',
          url: `/project/${ref}/advisors/security`,
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
          items: [],
        },
        {
          name: t ? t('navigation.database.performance_advisor') : 'Performance Advisor',
          key: 'performance-advisor',
          url: `/project/${ref}/advisors/performance`,
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
          items: [],
        },
        {
          name: t ? t('navigation.database.query_performance') : 'Query Performance',
          key: 'query-performance',
          url: `/project/${ref}/observability/query-performance`,
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
          items: [],
        },
      ],
    },
  ]
}
