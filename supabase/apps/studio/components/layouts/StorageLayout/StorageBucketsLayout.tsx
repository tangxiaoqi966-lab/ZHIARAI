import Link from 'next/link'
import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'

import { IS_PLATFORM, useParams } from 'common'
import { BUCKET_TYPES, getBucketTypes } from 'components/interfaces/Storage/Storage.constants'
import { useStorageV2Page } from 'components/interfaces/Storage/Storage.utils'
import { DocsButton } from 'components/ui/DocsButton'
import { usePathname } from 'next/navigation'
import { NavMenu, NavMenuItem } from 'ui'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderNavigationTabs,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

export const StorageBucketsLayout = ({
  title,
  hideSubtitle = false,
  children,
}: PropsWithChildren<{ title?: string; hideSubtitle?: boolean }>) => {
  const { t } = useTranslation()
  const { ref } = useParams()
  const pathname = usePathname()
  const page = useStorageV2Page()
  const bucketTypeConfig = getBucketTypes(t)
  const config =
    !!page && page !== 's3'
      ? bucketTypeConfig?.[page as keyof typeof bucketTypeConfig]
      : undefined

  const navigationItems =
    page === 'files'
      ? [
          {
            label: t('storage.buckets'),
            href: `/project/${ref}/storage/files`,
          },
          ...(IS_PLATFORM
            ? [
                {
                  label: t('storage.settings'),
                  href: `/project/${ref}/storage/files/settings`,
                },
              ]
            : []),
          {
            label: t('storage.policies'),
            href: `/project/${ref}/storage/files/policies`,
          },
        ]
      : []

  return (
    <>
      <PageHeader>
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>{title || (config?.displayName ?? t('navigation.storage'))}</PageHeaderTitle>
            {!hideSubtitle && (
              <PageHeaderDescription>
                {config?.description || t('storage.description')}
              </PageHeaderDescription>
            )}
          </PageHeaderSummary>

          <PageHeaderAside>
            {config?.docsUrl && <DocsButton key="docs" href={config.docsUrl} />}
          </PageHeaderAside>
        </PageHeaderMeta>

        {navigationItems.length > 0 && (
          <PageHeaderNavigationTabs>
            <NavMenu>
              {navigationItems.map((item) => (
                <NavMenuItem key={item.label} active={pathname === item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </NavMenuItem>
              ))}
            </NavMenu>
          </PageHeaderNavigationTabs>
        )}
      </PageHeader>
      {children}
    </>
  )
}
