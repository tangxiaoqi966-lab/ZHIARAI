import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { toast } from 'sonner'

import { useParams } from 'common'
import { DocsButton } from 'components/ui/DocsButton'
import { useDatabaseExtensionEnableMutation } from 'data/database-extensions/database-extension-enable-mutation'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button } from 'ui'
import { Markdown } from '../../Markdown'
import { getIndexAdvisorExtensions } from './index-advisor.utils'

export const IndexAdvisorDisabledState = () => {
  const { t } = useTranslation()
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { hypopg, indexAdvisor } = getIndexAdvisorExtensions(extensions)

  const { mutateAsync: enableExtension, isPending: isEnablingExtension } =
    useDatabaseExtensionEnableMutation()

  const onEnableIndexAdvisor = async () => {
    if (project === undefined) return console.error('Project is required')

    try {
      if (hypopg?.installed_version === null) {
        await enableExtension({
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          name: hypopg.name,
          schema: hypopg?.schema ?? 'extensions',
          version: hypopg.default_version,
        })
      }
      if (indexAdvisor?.installed_version === null) {
        await enableExtension({
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          name: indexAdvisor.name,
          schema: indexAdvisor?.schema ?? 'extensions',
          version: indexAdvisor.default_version,
        })
      }
      toast.success(t('advisor.enable_success'))
    } catch (error: any) {
      toast.error(t('advisor.enable_error', { error: error.message }))
    }
  }

  return (
    <Alert_Shadcn_ className="mb-6">
      <AlertTitle_Shadcn_>
        <Markdown
          className="text-foreground"
          content={
            indexAdvisor === undefined
              ? t('advisor.newer_postgres_version_required')
              : t('advisor.extensions_required')
          }
        />
      </AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>
        <Markdown
          content={
            indexAdvisor === undefined
              ? t('advisor.upgrade_postgres_description')
              : t('advisor.extensions_description')
          }
        />
      </AlertDescription_Shadcn_>

      <AlertDescription_Shadcn_ className="mt-3">
        <div className="flex items-center gap-x-2">
          {indexAdvisor === undefined ? (
            <Button asChild type="default">
              <Link href={`/project/${ref}/settings/infrastructure`}>{t('advisor.upgrade_postgres_version')}</Link>
            </Button>
          ) : (
            <Button
              type="default"
              disabled={isEnablingExtension}
              loading={isEnablingExtension}
              onClick={() => onEnableIndexAdvisor()}
            >
              {t('advisor.enable_extensions')}
            </Button>
          )}
          <DocsButton href={`${DOCS_URL}/guides/database/extensions/index_advisor`} />
        </div>
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}
