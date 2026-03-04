import { useTranslation } from 'react-i18next'
import { EdgeFunctionSecrets } from 'components/interfaces/Functions/EdgeFunctionSecrets/EdgeFunctionSecrets'
import { FunctionsSecretsEmptyStateLocal } from 'components/interfaces/Functions/FunctionsEmptyState'
import { DefaultLayout } from 'components/layouts/DefaultLayout'
import EdgeFunctionsLayout from 'components/layouts/EdgeFunctionsLayout/EdgeFunctionsLayout'
import { IS_PLATFORM } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

const SecretsPage: NextPageWithLayout = () => {
  return (
    <PageContainer size="large">
      <PageSection>
        <PageSectionContent className="space-y-4 md:space-y-8">
          {IS_PLATFORM ? <EdgeFunctionSecrets /> : <FunctionsSecretsEmptyStateLocal />}
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}

const SecretsPageLayout = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation()

  return (
    <DefaultLayout>
      <EdgeFunctionsLayout>
        <div className="w-full min-h-full flex flex-col items-stretch">
          <PageHeader size="large">
            <PageHeaderMeta>
              <PageHeaderSummary>
                <PageHeaderTitle>{t('functions.secrets.title')}</PageHeaderTitle>
                <PageHeaderDescription>
                  {t('functions.secrets.description')}
                </PageHeaderDescription>
              </PageHeaderSummary>
            </PageHeaderMeta>
          </PageHeader>

          {children}
        </div>
      </EdgeFunctionsLayout>
    </DefaultLayout>
  )
}

SecretsPage.getLayout = (page) => {
  return <SecretsPageLayout>{page}</SecretsPageLayout>
}

export default SecretsPage
