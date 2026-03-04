import { useParams } from 'common'
import { Auth, EdgeFunctions, Realtime, SqlEditor, Storage, TableEditor } from 'icons'
import { ExternalLink, Settings } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'ui'
import { useTranslation } from 'react-i18next'

import { APIKeys } from './APIKeys'
import { GetStartedHero } from './GetStartedHero'
import { DocsButton } from '@/components/ui/DocsButton'
import { InlineLink } from '@/components/ui/InlineLink'
import Panel from '@/components/ui/Panel'
import { EditorIndexPageLink } from '@/data/prefetchers/project.$ref.editor'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { DOCS_URL } from '@/lib/constants'

export const NewProjectPanel = () => {
  const { ref } = useParams()
  const { t } = useTranslation()

  const {
    projectAuthAll: authEnabled,
    projectEdgeFunctionAll: edgeFunctionsEnabled,
    projectStorageAll: storageEnabled,
  } = useIsFeatureEnabled(['project_auth:all', 'project_edge_function:all', 'project_storage:all'])

  return (
    <div className="grid grid-cols-12 gap-4 lg:gap-20">
      <div className="col-span-12">
        <div className="flex flex-col space-y-12 md:space-y-20">
          <div className="flex h-full flex-col justify-between">
            <div className="space-y-2">
              <h2>{t('home.new_project_panel.welcome')}</h2>
              <p className="text-base text-foreground-light">
                {t('home.new_project_panel.welcome_description')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 flex flex-col justify-center space-y-8 lg:col-span-7">
              <div className="space-y-2">
                <h2>{t('home.new_project_panel.build_database')}</h2>
                <p className="text-base text-foreground-light">
                  {t('home.new_project_panel.build_database_description')}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild type="default" icon={<TableEditor strokeWidth={1.5} />}>
                  <EditorIndexPageLink projectRef={ref}>{t('navigation.table_editor')}</EditorIndexPageLink>
                </Button>
                <Button asChild type="default" icon={<SqlEditor strokeWidth={1.5} />}>
                  <Link href={`/project/${ref}/sql/new`}>{t('navigation.sql_editor')}</Link>
                </Button>
                <Button asChild type="default" icon={<ExternalLink />}>
                  <Link href={`${DOCS_URL}/guides/database`} target="_blank" rel="noreferrer">
                    {t('home.new_project_panel.about_database')}
                  </Link>
                </Button>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-5">
              <GetStartedHero />
            </div>
          </div>

          {authEnabled && edgeFunctionsEnabled && storageEnabled && (
            <div className="flex h-full flex-col justify-between space-y-6">
              <div className="max-w-2xl space-y-2">
                <h2>{t('home.new_project_panel.explore_products')}</h2>
                <p className="text-base text-foreground-light">
                  {t('home.new_project_panel.explore_products_description')}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 md:gap-4 md:gap-y-0 xl:grid-cols-4">
                <Panel>
                  <Panel.Content className="flex flex-col space-y-4 md:px-3">
                    <div className="flex items-center space-x-3">
                      <div className="rounded bg-surface-300 p-1.5 text-foreground-light shadow-sm">
                        <Auth size={16} strokeWidth={1.5} />
                      </div>
                      <h5>{t('navigation.authentication')}</h5>
                    </div>
                    <div className="flex flex-grow md:min-h-[50px] xl:min-h-[75px]">
                      <p className="text-sm text-foreground-light">
                        {t('home.new_project_panel.authentication_description')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button type="default" asChild>
                        <Link href={`/project/${ref}/auth/users`}>{t('home.new_project_panel.explore_auth')}</Link>
                      </Button>

                      <Button
                        className="translate-y-[1px]"
                        icon={<ExternalLink />}
                        type="default"
                        asChild
                      >
                        <Link href={`${DOCS_URL}/guides/auth`} target="_blank" rel="noreferrer">
                          {t('home.new_project_panel.about_auth')}
                        </Link>
                      </Button>
                    </div>
                  </Panel.Content>
                </Panel>

                <Panel>
                  <Panel.Content className="flex flex-col space-y-4 md:px-3">
                    <div className="flex items-center space-x-3">
                      <div className="rounded bg-surface-300 p-1.5 text-foreground-light shadow-sm">
                        <Storage size={16} strokeWidth={1.5} />
                      </div>
                      <h5>{t('navigation.storage')}</h5>
                    </div>
                    <div className="flex md:min-h-[50px] xl:min-h-[75px]">
                      <p className="text-sm text-foreground-light">
                        {t('home.new_project_panel.storage_description')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button type="default" asChild>
                        <Link href={`/project/${ref}/storage/buckets`}>{t('home.new_project_panel.explore_storage')}</Link>
                      </Button>

                      <Button
                        className="translate-y-[1px]"
                        icon={<ExternalLink />}
                        type="default"
                        asChild
                      >
                        <Link href={`${DOCS_URL}/guides/storage`} target="_blank" rel="noreferrer">
                          {t('home.new_project_panel.about_storage')}
                        </Link>
                      </Button>
                    </div>
                  </Panel.Content>
                </Panel>

                <Panel>
                  <Panel.Content className="flex flex-col space-y-4 md:px-3">
                    <div className="flex items-center space-x-3">
                      <div className="rounded bg-surface-300 p-1.5 text-foreground-light shadow-sm">
                        <EdgeFunctions size={16} strokeWidth={1.5} />
                      </div>
                      <h5>{t('navigation.edge_functions')}</h5>
                    </div>
                    <div className="flex md:min-h-[50px] xl:min-h-[75px]">
                      <p className="text-sm text-foreground-light">
                        {t('home.new_project_panel.edge_functions_description')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button type="default" asChild>
                        <Link href={`/project/${ref}/functions`}>{t('home.new_project_panel.explore_functions')}</Link>
                      </Button>
                      <Button
                        className="translate-y-[1px]"
                        icon={<ExternalLink />}
                        type="default"
                        asChild
                      >
                        <Link
                          href={`${DOCS_URL}/guides/functions`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {t('home.new_project_panel.about_functions')}
                        </Link>
                      </Button>
                    </div>
                  </Panel.Content>
                </Panel>
                <Panel>
                  <Panel.Content className="flex flex-col space-y-4 md:px-3">
                    <div className="flex items-center space-x-4">
                      <div className="rounded bg-surface-300 p-1.5 text-foreground-light shadow-sm">
                        <Realtime size={16} strokeWidth={1.5} />
                      </div>
                      <h5>{t('navigation.realtime')}</h5>
                    </div>
                    <div className="flex md:min-h-[50px] xl:min-h-[75px]">
                      <p className="text-sm text-foreground-light">
                        {t('home.new_project_panel.realtime_description')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button type="default" asChild>
                        <Link href={`/project/${ref}/realtime/inspector`}>{t('home.new_project_panel.explore_realtime')}</Link>
                      </Button>
                      <Button
                        className="translate-y-[1px]"
                        icon={<ExternalLink />}
                        type="default"
                        asChild
                      >
                        <Link href={`${DOCS_URL}/guides/realtime`} target="_blank" rel="noreferrer">
                          {t('home.new_project_panel.about_realtime')}
                        </Link>
                      </Button>
                    </div>
                  </Panel.Content>
                </Panel>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="col-span-12 lg:col-span-4">
        <div className="space-y-6">
          <div className="space-y-2">
            <h2>{t('home.new_project_panel.connect_to_project')}</h2>
            <p className="text-base text-foreground-light text-balance">
              {t('home.new_project_panel.connect_description')}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button asChild type="default" icon={<Settings size={16} strokeWidth={1.5} />}>
              <Link href={`/project/${ref}/settings/api-keys`}>{t('home.new_project_panel.api_keys_settings')}</Link>
            </Button>
            <DocsButton href={`${DOCS_URL}/guides/database/api`} />
          </div>
        </div>
      </div>
      <div className="col-span-12 lg:col-span-8">
        <APIKeys />
      </div>
    </div>
  )
}
