import { ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PropsWithChildren } from 'react'

import Indexes from 'components/interfaces/Database/Indexes/Indexes'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { DocsButton } from 'components/ui/DocsButton'
import { DOCS_URL } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import { Button } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

const IndexesPage: NextPageWithLayout = () => {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>{t('database.indexes_title')}</PageHeaderTitle>
            <PageHeaderDescription>
              {t('database.indexes_description')}
            </PageHeaderDescription>
          </PageHeaderSummary>
          <PageHeaderAside>
            <DocsButton
              className="no-underline"
              href={`${DOCS_URL}/guides/database/query-optimization`}
            />
            <Button asChild type="default" icon={<ExternalLink strokeWidth={1.5} />}>
              <a
                target="_blank"
                rel="noreferrer"
                className="no-underline"
                href={`${DOCS_URL}/guides/database/extensions/index_advisor`}
              >
                {t('advisor.title')}
              </a>
            </Button>
          </PageHeaderAside>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            <Indexes />
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}

const IndexesPageLayout = ({ children }: PropsWithChildren) => {
  const { t } = useTranslation()
  return <DatabaseLayout title={t('database.indexes_layout_title')}>{children}</DatabaseLayout>
}

IndexesPage.getLayout = (page) => (
  <DefaultLayout>
    <IndexesPageLayout>{page}</IndexesPageLayout>
  </DefaultLayout>
)

export default IndexesPage
