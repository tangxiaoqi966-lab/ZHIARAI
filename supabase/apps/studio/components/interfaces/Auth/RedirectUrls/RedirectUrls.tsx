import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import { HorizontalShimmerWithIcon } from 'components/ui/Shimmers'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { DOCS_URL } from 'lib/constants'
import { Button, ScrollArea, cn } from 'ui'
const Modal = require('ui').Modal as any
import {
  PageSection,
  PageSectionAside,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { AddNewURLModal } from './AddNewURLModal'
import { RedirectUrlList } from './RedirectUrlList'
import { ValueContainer } from './ValueContainer'

const MAX_URLS_LENGTH = 2 * 1024

export const RedirectUrls = () => {
  const { t } = useTranslation()
  const { ref: projectRef } = useParams()
  const {
    data: authConfig,
    error: authConfigError,
    isPending: isLoading,
    isError,
    isSuccess,
  } = useAuthConfigQuery({ projectRef })
  const { mutate: updateAuthConfig, isPending: isUpdatingConfig } = useAuthConfigUpdateMutation()

  const URI_ALLOW_LIST_ARRAY = useMemo(() => {
    return authConfig?.URI_ALLOW_LIST
      ? authConfig.URI_ALLOW_LIST.split(/\s*[,]+\s*/).filter((url: string) => url)
      : []
  }, [authConfig?.URI_ALLOW_LIST])

  const [open, setOpen] = useState(false)
  const [openRemoveSelected, setOpenRemoveSelected] = useState(false)
  const [selectedUrls, setSelectedUrls] = useState<string[]>([])

  const onConfirmDeleteUrl = async (urls?: string[]) => {
    if (!urls || urls.length === 0) return

    // Remove selectedUrl from array and update
    const payload = URI_ALLOW_LIST_ARRAY.filter((url: string) => !selectedUrls.includes(url))
    const payloadString = payload.join(',')
    if (payloadString.length > MAX_URLS_LENGTH) {
      return toast.error(t('redirect_urls.too_many_urls'))
    }
    updateAuthConfig(
      { projectRef: projectRef!, config: { URI_ALLOW_LIST: payloadString } },
      {
        onError: (error) => {
          toast.error(t('redirect_urls.failed_to_remove', { error: error?.message }))
        },
        onSuccess: () => {
          setSelectedUrls([])
          setOpenRemoveSelected(false)
          toast.success(t('redirect_urls.successfully_removed'))
        },
      }
    )
  }

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>{t('redirect_urls.title')}</PageSectionTitle>
          <PageSectionDescription>
            {t('redirect_urls.description')}
          </PageSectionDescription>
        </PageSectionSummary>
        <PageSectionAside>
          <DocsButton href={`${DOCS_URL}/guides/auth/concepts/redirect-urls`} />
        </PageSectionAside>
      </PageSectionMeta>
      <PageSectionContent>
        {isLoading && (
          <>
            <ValueContainer>
              <HorizontalShimmerWithIcon />
            </ValueContainer>
            <ValueContainer>
              <HorizontalShimmerWithIcon />
            </ValueContainer>
          </>
        )}

        {isError && (
          <AlertError error={authConfigError} subject={t('redirect_urls.failed_to_retrieve_auth_config')} />
        )}

        {isSuccess && (
          <RedirectUrlList
            allowList={URI_ALLOW_LIST_ARRAY}
            selectedUrls={selectedUrls}
            onSelectUrl={setSelectedUrls}
            onSelectAddURL={() => setOpen(true)}
            onSelectClearSelection={() => setSelectedUrls([])}
            onSelectRemoveURLs={() => setOpenRemoveSelected(true)}
          />
        )}

        <AddNewURLModal
          visible={open}
          allowList={URI_ALLOW_LIST_ARRAY}
          onClose={() => setOpen(false)}
        />

        <Modal
          hideFooter
          size="large"
          visible={openRemoveSelected}
          header={t('redirect_urls.remove_urls_modal_title')}
          onCancel={() => {
            setSelectedUrls([])
            setOpenRemoveSelected(false)
          }}
        >
          <Modal.Content className="flex flex-col gap-y-2">
            <p className="mb-2 text-sm text-foreground-light">
              {t('redirect_urls.remove_urls_modal_description', { count: selectedUrls.length })}
            </p>
            <ScrollArea className={cn(selectedUrls.length > 4 ? 'h-[250px]' : '')}>
              <div className="flex flex-col -space-y-1">
                {selectedUrls.map((url) => {
                  return (
                    <ValueContainer key={url} className="px-4 py-3 hover:bg-surface-100">
                      {url}
                    </ValueContainer>
                  )
                })}
              </div>
            </ScrollArea>
            <p className="text-foreground-light text-sm">
              {t('redirect_urls.remove_urls_warning')}
            </p>
          </Modal.Content>
          <Modal.Separator />
          <Modal.Content className="flex items-center gap-x-2">
            <Button
              block
              type="default"
              size="medium"
              onClick={() => {
                setSelectedUrls([])
                setOpenRemoveSelected(false)
              }}
            >
              {t('redirect_urls.cancel')}
            </Button>
            <Button
              block
              size="medium"
              type="warning"
              loading={isUpdatingConfig}
              onClick={() => onConfirmDeleteUrl(selectedUrls)}
            >
              {isUpdatingConfig ? t('redirect_urls.removing') : t('redirect_urls.remove_url')}
            </Button>
          </Modal.Content>
        </Modal>
      </PageSectionContent>
    </PageSection>
  )
}
