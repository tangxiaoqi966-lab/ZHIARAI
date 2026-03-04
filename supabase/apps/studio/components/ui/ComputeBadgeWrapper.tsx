import Link from 'next/link'
import { useState } from 'react'

import { getAddons } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import { ProjectDetail } from 'data/projects/project-detail-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { ProjectAddonVariantMeta } from 'data/subscriptions/types'
import { getCloudProviderArchitecture } from 'lib/cloudprovider-utils'
import { INSTANCE_MICRO_SPECS } from 'lib/constants'
import { Button, HoverCard, HoverCardContent, HoverCardTrigger, Separator } from 'ui'
import { ComputeBadge } from 'ui-patterns/ComputeBadge'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import { useTranslation } from 'react-i18next'

const Row = ({ label, stat }: { label: string; stat: React.ReactNode | string }) => {
  return (
    <div className="flex flex-row gap-2">
      <span className="text-sm text-foreground-light w-16">{label}</span>
      <span className="text-sm">{stat}</span>
    </div>
  )
}

interface ComputeBadgeWrapperProps {
  slug?: string
  projectRef?: string
  cloudProvider?: string
  computeSize?: ProjectDetail['infra_compute_size']
}

export const ComputeBadgeWrapper = ({
  slug,
  projectRef,
  cloudProvider,
  computeSize,
}: ComputeBadgeWrapperProps) => {
  const { t } = useTranslation()
  // handles the state of the hover card
  // once open it will fetch the addons
  const [open, setOpenState] = useState(false)

  // returns hardcoded values for infra
  const cpuArchitecture = getCloudProviderArchitecture(cloudProvider)

  // fetches addons
  const { data: addons, isPending: isLoadingAddons } = useProjectAddonsQuery(
    { projectRef },
    { enabled: open }
  )
  const selectedAddons = addons?.selected_addons ?? []

  const { computeInstance } = getAddons(selectedAddons)
  const computeInstanceMeta = computeInstance?.variant?.meta

  const meta = (
    computeInstanceMeta === undefined && computeSize === 'micro'
      ? INSTANCE_MICRO_SPECS
      : computeInstanceMeta
  ) as ProjectAddonVariantMeta

  const availableCompute = addons?.available_addons.find(
    (addon) => addon.name === 'Compute Instance'
  )?.variants

  const highestComputeAvailable = availableCompute?.[availableCompute.length - 1].identifier

  const isHighestCompute = computeSize === highestComputeAvailable?.replace('ci_', '')

  const { data, isPending: isLoadingSubscriptions } = useOrgSubscriptionQuery(
    { orgSlug: slug },
    { enabled: open }
  )

  const isEligibleForFreeUpgrade = data?.plan.id !== 'free' && computeSize === 'nano'

  const isLoading = isLoadingAddons || isLoadingSubscriptions

  if (!computeSize) return null

  return (
    <HoverCard onOpenChange={() => setOpenState(!open)} openDelay={280}>
      <HoverCardTrigger asChild className="group" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center">
          <ComputeBadge infraComputeSize={computeSize} />
        </div>
      </HoverCardTrigger>
      <HoverCardContent
        side="bottom"
        align="start"
        className="p-0 overflow-hidden w-96"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-2 px-5 text-xs text-foreground-lighter">{t('home.compute.size')}</div>
        <Separator />
        <div className="p-3 px-5 flex flex-row gap-4">
          <div>
            <ComputeBadge infraComputeSize={computeSize} />
          </div>
          <div className="flex flex-col gap-4">
            {isLoading ? (
              <>
                <div className="flex flex-col gap-1">
                  <ShimmeringLoader className="h-[20px] py-0 w-32" />
                  <ShimmeringLoader className="h-[20px] py-0 w-32" />
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  {meta !== undefined ? (
                    <>
                      <Row
                        label={t('home.compute.cpu')}
                        stat={`${meta.cpu_cores ?? '?'}-${t('home.compute.core')} ${cpuArchitecture} ${meta.cpu_dedicated ? `(${t('home.compute.dedicated')})` : `(${t('home.compute.shared')})`}`}
                      />
                      <Row label={t('home.compute.memory')} stat={`${meta.memory_gb ?? '-'} GB`} />
                    </>
                  ) : (
                    <>
                      {/* meta is only undefined for nano sized compute */}
                      <Row label={t('home.compute.cpu')} stat={t('home.compute.shared')} />
                      <Row label={t('home.compute.memory')} stat={`${t('home.compute.up_to')} 0.5 GB`} />
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        {(!isHighestCompute || isEligibleForFreeUpgrade) && (
          <>
            <Separator />
            <div className="p-3 px-5 text-sm flex flex-col gap-2 bg-studio">
              <div className="flex flex-col gap-0">
                <p className="text-foreground">
                  {isEligibleForFreeUpgrade
                    ? t('home.compute.free_upgrade_available')
                    : t('home.compute.unlock_more_compute')}
                </p>
                <p className="text-foreground-light">
                  {isEligibleForFreeUpgrade
                    ? t('home.compute.free_upgrade_desc')
                    : t('home.compute.scale_desc')}
                </p>
              </div>
              <div>
                <Button asChild type="default" htmlType="button" role="button">
                  <Link href={`/project/${projectRef}/settings/compute-and-disk`}>
                    {t('home.compute.upgrade_compute')}
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </HoverCardContent>
    </HoverCard>
  )
}
