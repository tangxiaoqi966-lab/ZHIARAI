import { RealtimePolicies } from 'components/interfaces/Realtime/Policies'
import DefaultLayout from 'components/layouts/DefaultLayout'
import RealtimeLayout from 'components/layouts/RealtimeLayout/RealtimeLayout'
import { DocsButton } from 'components/ui/DocsButton'
import i18nInstance from 'lib/i18n/config'
import { DOCS_URL } from 'lib/constants'
import { useTranslation } from 'react-i18next'
import type { NextPageWithLayout } from 'types'
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

const RealtimePoliciesPage: NextPageWithLayout = () => {
  const { t } = useTranslation()

  return (
    <>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>{t('realtime.policies')}</PageHeaderTitle>
            <PageHeaderDescription>{t('realtime.policies_description')}</PageHeaderDescription>
          </PageHeaderSummary>
          <PageHeaderAside>
            <DocsButton href={`${DOCS_URL}/guides/realtime/authorization`} />
          </PageHeaderAside>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            <RealtimePolicies />
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}

RealtimePoliciesPage.getLayout = (page) => (
  <DefaultLayout>
    <RealtimeLayout title={i18nInstance.t('realtime.policies')}>{page}</RealtimeLayout>
  </DefaultLayout>
)

export default RealtimePoliciesPage
