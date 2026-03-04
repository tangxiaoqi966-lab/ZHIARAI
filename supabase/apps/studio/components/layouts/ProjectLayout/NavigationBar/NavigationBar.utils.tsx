import { ICON_SIZE, ICON_STROKE_WIDTH } from 'components/interfaces/Sidebar'
import { generateAuthMenu } from 'components/layouts/AuthLayout/AuthLayout.utils'
import { generateDatabaseMenu } from 'components/layouts/DatabaseLayout/DatabaseMenu.utils'
import { generateSettingsMenu } from 'components/layouts/ProjectSettingsLayout/SettingsMenu.utils'
import { generateRealtimeMenu } from 'components/layouts/RealtimeLayout/RealtimeMenu.utils'
import type { Route } from 'components/ui/ui.types'
import { EditorIndexPageLink } from 'data/prefetchers/project.$ref.editor'
import type { Project } from 'data/projects/project-detail-query'
import { TFunction } from 'i18next'
import { Auth, Database, EdgeFunctions, Realtime, SqlEditor, Storage, TableEditor } from 'icons'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import { Blocks, FileText, Lightbulb, List, Settings, Telescope } from 'lucide-react'

export const generateToolRoutes = (
  ref?: string,
  project?: Project,
  features?: {},
  t?: TFunction
): Route[] => {
  const isProjectActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP
  const buildingUrl = `/project/${ref}`

  return [
    {
      key: 'editor',
      label: t ? t('navigation.table_editor') : 'Table Editor',
      disabled: !isProjectActive,
      icon: <TableEditor size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/editor`),
      linkElement: <EditorIndexPageLink projectRef={ref} />,
    },
    {
      key: 'sql',
      label: t ? t('navigation.sql_editor') : 'SQL Editor',
      disabled: !isProjectActive,
      icon: <SqlEditor size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/sql`),
    },
  ]
}

export const generateProductRoutes = (
  ref?: string,
  project?: Project,
  features?: {
    auth?: boolean
    edgeFunctions?: boolean
    storage?: boolean
    realtime?: boolean
    authOverviewPage?: boolean
  },
  t?: TFunction
): Route[] => {
  const isProjectActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP
  const buildingUrl = `/project/${ref}`

  const authEnabled = features?.auth ?? true
  const edgeFunctionsEnabled = features?.edgeFunctions ?? true
  const storageEnabled = features?.storage ?? true
  const realtimeEnabled = features?.realtime ?? true
  const authOverviewPageEnabled = features?.authOverviewPage ?? false

  const databaseMenu = generateDatabaseMenu(project, undefined, t)
  const authMenu = generateAuthMenu(ref as string, undefined, t)
  const realtimeMenu = generateRealtimeMenu(project as Project, t)

  return [
    {
      key: 'database',
      label: t ? t('navigation.database_label') : 'Database',
      disabled: !isProjectActive,
      icon: <Database size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link:
        ref &&
        (isProjectBuilding
          ? buildingUrl
          : isProjectActive
            ? `/project/${ref}/database/schemas`
            : `/project/${ref}/database/backups/scheduled`),
      items: databaseMenu,
    },
    ...(authEnabled
      ? [
          {
            key: 'auth',
            label: t ? t('navigation.authentication') : 'Authentication',
            disabled: !isProjectActive,
            icon: <Auth size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link:
              ref &&
              (isProjectBuilding
                ? buildingUrl
                : authOverviewPageEnabled
                  ? `/project/${ref}/auth/overview`
                  : `/project/${ref}/auth/users`),
            items: authMenu,
          },
        ]
      : []),
    ...(storageEnabled
      ? [
          {
            key: 'storage',
            label: t ? t('navigation.storage') : 'Storage',
            disabled: !isProjectActive,
            icon: <Storage size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/storage/files`),
          },
        ]
      : []),
    ...(edgeFunctionsEnabled
      ? [
          {
            key: 'functions',
            label: t ? t('navigation.edge_functions') : 'Edge Functions',
            disabled: false,
            icon: <EdgeFunctions size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link: ref && `/project/${ref}/functions`,
          },
        ]
      : []),
    ...(realtimeEnabled
      ? [
          {
            key: 'realtime',
            label: t ? t('navigation.realtime') : 'Realtime',
            disabled: !isProjectActive,
            icon: <Realtime size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/realtime/inspector`),
            items: realtimeMenu,
          },
        ]
      : []),
  ]
}

export const generateOtherRoutes = (
  ref?: string,
  project?: Project,
  features?: { unifiedLogs?: boolean; showReports?: boolean; apiDocsSidePanel?: boolean },
  t?: TFunction
): Route[] => {
  const isProjectActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP
  const buildingUrl = `/project/${ref}`

  const { unifiedLogs, showReports, apiDocsSidePanel } = features ?? {}
  const unifiedLogsEnabled = unifiedLogs ?? false
  const reportsEnabled = showReports ?? true
  const apiDocsSidePanelEnabled = apiDocsSidePanel ?? false

  return [
    {
      key: 'advisors',
      label: t ? t('navigation.advisors') : 'Advisors',
      disabled: !isProjectActive,
      icon: <Lightbulb size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/advisors/security`),
    },
    ...(IS_PLATFORM && reportsEnabled
      ? [
          {
            key: 'observability',
            label: t ? t('navigation.observability') : 'Observability',
            disabled: !isProjectActive,
            icon: <Telescope size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/observability`),
          },
        ]
      : []),
    {
      key: 'logs',
      label: t ? t('navigation.logs') : 'Logs',
      disabled: false,
      icon: <List size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && (unifiedLogsEnabled ? `/project/${ref}/logs` : `/project/${ref}/logs/explorer`),
    },
    ...(apiDocsSidePanelEnabled
      ? [
          {
            key: 'api',
            label: t ? t('navigation.api_docs') : 'API Docs',
            disabled: !isProjectActive,
            icon: <FileText size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            link:
              ref &&
              (isProjectBuilding ? buildingUrl : `/project/${ref}/integrations/data_api/docs`),
          },
        ]
      : []),
    {
      key: 'integrations',
      label: t ? t('navigation.integrations') : 'Integrations',
      disabled: !isProjectActive,
      icon: <Blocks size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link: ref && (isProjectBuilding ? buildingUrl : `/project/${ref}/integrations`),
    },
  ]
}

export const generateSettingsRoutes = (ref?: string, project?: Project, t?: TFunction): Route[] => {
  const settingsMenu = generateSettingsMenu(ref as string, project, undefined, undefined, t)
  return [
    {
      key: 'settings',
      label: t ? t('navigation.project_settings') : 'Project Settings',
      icon: <Settings size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      link:
        ref &&
        (IS_PLATFORM ? `/project/${ref}/settings/general` : `/project/${ref}/settings/log-drains`),
      items: settingsMenu,
      disabled: false,
    },
  ]
}
