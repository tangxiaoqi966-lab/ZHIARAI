import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useTranslation } from 'react-i18next'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, CriticalIcon } from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { DeleteProjectButton } from './DeleteProjectButton'

export const DeleteProjectPanel = () => {
  const { t } = useTranslation()
  const { data: project } = useSelectedProjectQuery()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()

  if (project === undefined) return null

  const title =
    selectedOrganization?.managed_by === 'vercel-marketplace'
      ? t('settings.general.delete_project_title_vercel')
      : t('settings.general.delete_project_title_default')
  const description =
    selectedOrganization?.managed_by === 'vercel-marketplace'
      ? t('settings.general.delete_project_desc_vercel')
      : t('settings.general.delete_project_desc_default')

  return (
    <PageSection id="delete-project">
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>{t('settings.general.delete_project')}</PageSectionTitle>
          <PageSectionDescription>
            {t('settings.general.delete_project_description')}
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>

      <PageSectionContent>
        <Alert_Shadcn_ variant="destructive">
          <CriticalIcon />
          <AlertTitle_Shadcn_>{title}</AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>{description}</AlertDescription_Shadcn_>
          <div className="mt-2">
            <DeleteProjectButton />
          </div>
        </Alert_Shadcn_>
      </PageSectionContent>
    </PageSection>
  )
}
