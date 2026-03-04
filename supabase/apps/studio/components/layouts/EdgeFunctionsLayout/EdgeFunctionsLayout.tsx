import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'

import { useParams } from 'common'
import { ProductMenu } from 'components/ui/ProductMenu'
import { withAuth } from 'hooks/misc/withAuth'
import { ProjectLayout } from '../ProjectLayout'

const EdgeFunctionsProductMenu = () => {
  const { t } = useTranslation()
  const { ref: projectRef = 'default' } = useParams()
  const router = useRouter()
  const page = router.pathname.split('/')[4]

  const menuItems = [
    {
      title: t('functions.sidebar.manage'),
      items: [
        {
          name: t('functions.sidebar.functions'),
          key: 'main',
          pages: ['', '[functionSlug]', 'new'],
          url: `/project/${projectRef}/functions`,
          items: [],
        },
        {
          name: t('functions.sidebar.secrets'),
          key: 'secrets',
          url: `/project/${projectRef}/functions/secrets`,
          items: [],
        },
      ],
    },
  ]

  return <ProductMenu page={page} menu={menuItems} />
}

const EdgeFunctionsLayout = ({ children }: PropsWithChildren<{}>) => {
  const { t } = useTranslation()

  return (
    <ProjectLayout
      title={t('functions.page_title')}
      product={t('functions.page_title')}
      productMenu={<EdgeFunctionsProductMenu />}
      isBlocking={false}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(EdgeFunctionsLayout)
