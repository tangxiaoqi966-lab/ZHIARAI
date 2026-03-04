import { useParams } from 'common'
import { useCreateTenantSourceMutation } from 'data/replication/create-tenant-source-mutation'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  cn,
} from 'ui'
import { Admonition } from 'ui-patterns'

import { DestinationType } from './DestinationPanel/DestinationPanel.types'
import { DocsButton } from '@/components/ui/DocsButton'
import { UpgradePlanButton } from '@/components/ui/UpgradePlanButton'
import { DOCS_URL } from '@/lib/constants'

const EnableReplicationModal = () => {
  const { t } = useTranslation()
  const { ref: projectRef } = useParams()
  const [open, setOpen] = useState(false)

  const { mutate: createTenantSource, isPending: creatingTenantSource } =
    useCreateTenantSourceMutation({
      onSuccess: () => {
        toast.success(t('replication.enable_success'))
        setOpen(false)
      },
      onError: (error) => {
        toast.error(t('replication.enable_error', { error: error.message }))
      },
    })

  const onEnableReplication = async () => {
    if (!projectRef) return console.error('Project ref is required')
    createTenantSource({ projectRef })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="primary" className="w-min">
          {t('replication.enable_replication')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('replication.enable_replication_title')}</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="flex flex-col gap-y-2 !p-0">
          <Admonition
            type="warning"
            className="rounded-none border-0"
            title={t('replication.alpha_warning_title')}
          >
            <p className="text-sm !leading-normal">
              {t('replication.alpha_warning_description_1')}
            </p>
            <p className="text-sm !leading-normal">
              {t('replication.alpha_warning_description_2')}
            </p>
          </Admonition>
        </DialogSection>
        <DialogFooter>
          <Button type="default" disabled={creatingTenantSource} onClick={() => setOpen(false)}>
            {t('replication.cancel')}
          </Button>
          <Button type="primary" loading={creatingTenantSource} onClick={onEnableReplication}>
            {t('replication.enable_replication')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const EnableReplicationCallout = ({
  type,
  className,
  hasAccess,
}: {
  type?: DestinationType | null
  className?: string
  hasAccess: boolean
}) => {
  const { t } = useTranslation()
  return (
    <div className={cn('border rounded-md p-4 md:p-12 flex flex-col gap-y-4', className)}>
      <div className="flex flex-col gap-y-1">
        <h4>{t('replication.callout_title')}</h4>
        <p className="text-sm text-foreground-light">
          {hasAccess ? t('replication.callout_description_enable') : t('replication.callout_description_upgrade')} {t('replication.callout_description_suffix')} {type ?? t('replication.callout_description_default_type')}
        </p>
      </div>
      <div className="flex gap-x-2">
        {hasAccess ? (
          <EnableReplicationModal />
        ) : (
          <UpgradePlanButton source="replication" featureProposition="use replication" />
        )}
        <DocsButton href={`${DOCS_URL}/guides/database/replication#replication`} />
      </div>
    </div>
  )
}
