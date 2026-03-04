import { useTranslation } from 'react-i18next'
import { EnumeratedTypes } from 'components/interfaces/Database/EnumeratedTypes/EnumeratedTypes'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
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

const DatabaseEnumeratedTypes: NextPageWithLayout = () => {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>{t('database.pages.enums.title')}</PageHeaderTitle>
            <PageHeaderDescription>
              {t('database.pages.enums.description')}
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            <EnumeratedTypes />
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}

DatabaseEnumeratedTypes.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseEnumeratedTypes
