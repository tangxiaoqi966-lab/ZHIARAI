import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { SupportCategories } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import {
  calculateIOPSPrice,
  calculateThroughputPrice,
} from 'components/interfaces/DiskManagement/DiskManagement.utils'
import {
  DISK_PRICING,
  DiskType,
} from 'components/interfaces/DiskManagement/ui/DiskManagement.constants'
import { SupportLink } from 'components/interfaces/Support/SupportLink'
import { DocsButton } from 'components/ui/DocsButton'
import { useDiskAttributesQuery } from 'data/config/disk-attributes-query'
import { useEnablePhysicalBackupsMutation } from 'data/database/enable-physical-backups-mutation'
import { useOverdueInvoicesQuery } from 'data/invoices/invoices-overdue-query'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { Region, useReadReplicaSetUpMutation } from 'data/read-replicas/replica-setup-mutation'
import {
  MAX_REPLICAS_ABOVE_XL,
  MAX_REPLICAS_BELOW_XL,
  useReadReplicasQuery,
} from 'data/read-replicas/replicas-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useCheckEntitlements } from 'hooks/misc/useCheckEntitlements'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useIsAwsK8sCloudProvider, useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { AWS_REGIONS_DEFAULT, BASE_PATH, DOCS_URL } from 'lib/constants'
import { formatCurrency } from 'lib/helpers'
import type { AWS_REGIONS_KEYS } from 'shared-data'
import { AWS_REGIONS } from 'shared-data'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Collapsible_Shadcn_,
  Listbox,
  SidePanel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  WarningIcon,
  cn,
} from 'ui'
import { AVAILABLE_REPLICA_REGIONS } from './InstanceConfiguration.constants'

// [Joshen] FYI this is purely for AWS only, need to update to support Fly eventually

interface DeployNewReplicaPanelProps {
  visible: boolean
  selectedDefaultRegion?: AWS_REGIONS_KEYS
  onSuccess: () => void
  onClose: () => void
}

const DeployNewReplicaPanel = ({
  visible,
  selectedDefaultRegion,
  onSuccess,
  onClose,
}: DeployNewReplicaPanelProps) => {
  const { t } = useTranslation()
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()
  const { hasAccess: hasReadReplicaAccess } = useCheckEntitlements('instances.read_replicas')

  const { data } = useReadReplicasQuery({ projectRef })
  const { data: addons, isSuccess } = useProjectAddonsQuery({ projectRef })
  const { data: diskConfiguration } = useDiskAttributesQuery({ projectRef })

  const isNotOnHigherPlan = useMemo(
    () => !['team', 'enterprise', 'platform'].includes(org?.plan.id ?? ''),
    [org]
  )
  const { data: allOverdueInvoices } = useOverdueInvoicesQuery({
    enabled: isNotOnHigherPlan,
  })
  const overdueInvoices = (allOverdueInvoices ?? []).filter(
    (x) => x.organization_id === project?.organization_id
  )
  const hasOverdueInvoices = overdueInvoices.length > 0 && isNotOnHigherPlan
  const isAwsK8s = useIsAwsK8sCloudProvider()

  // Opting for useState temporarily as Listbox doesn't seem to work with react-hook-form yet
  const [defaultRegion] = Object.entries(AWS_REGIONS).find(
    ([_, name]) => name === AWS_REGIONS_DEFAULT
  ) ?? ['ap-southeast-1']
  // Will be following the primary's compute size for the time being
  const defaultCompute =
    addons?.selected_addons.find((addon) => addon.type === 'compute_instance')?.variant
      .identifier ?? 'ci_micro'

  // @ts-ignore
  const { size_gb, type, throughput_mbps, iops } = diskConfiguration?.attributes ?? {}
  const showNewDiskManagementUI = project?.cloud_provider === 'AWS'
  const readReplicaDiskSizes = (size_gb ?? 0) * 1.25
  const additionalCostDiskSize =
    readReplicaDiskSizes * (DISK_PRICING[type as DiskType]?.storage ?? 0)
  const additionalCostIOPS = calculateIOPSPrice({
    oldStorageType: type as DiskType,
    newStorageType: type as DiskType,
    oldProvisionedIOPS: 0,
    newProvisionedIOPS: iops ?? 0,
    numReplicas: 0,
  }).newPrice
  const additionalCostThroughput =
    type === 'gp3'
      ? calculateThroughputPrice({
          storageType: type as DiskType,
          newThroughput: throughput_mbps ?? 0,
          oldThroughput: 0,
          numReplicas: 0,
        }).newPrice
      : 0

  const [refetchInterval, setRefetchInterval] = useState<number | false>(false)
  const [selectedRegion, setSelectedRegion] = useState<string>(defaultRegion)
  const [selectedCompute, setSelectedCompute] = useState(defaultCompute)

  const { data: projectDetail, isSuccess: isProjectDetailSuccess } = useProjectDetailQuery(
    { ref: projectRef },
    {
      refetchInterval,
      refetchOnWindowFocus: false,
    }
  )

  useEffect(() => {
    if (!isProjectDetailSuccess) return
    if (projectDetail.is_physical_backups_enabled) {
      setRefetchInterval(false)
    }
  }, [projectDetail?.is_physical_backups_enabled, isProjectDetailSuccess])

  const { mutate: enablePhysicalBackups, isPending: isEnabling } = useEnablePhysicalBackupsMutation(
    {
      onSuccess: () => {
        toast.success(
          t('settings.infrastructure.enabling_physical_backups')
        )
        setRefetchInterval(5000)
      },
    }
  )

  const { mutate: setUpReplica, isPending: isSettingUp } = useReadReplicaSetUpMutation({
    onSuccess: () => {
      const region = AVAILABLE_REPLICA_REGIONS.find((r) => r.key === selectedRegion)?.name
      toast.success(`Spinning up new replica in ${region ?? ' Unknown'}...`)
      onSuccess()
      onClose()
    },
  })

  const currentPgVersion = Number(
    (project?.dbVersion ?? '').split('supabase-postgres-')[1]?.split('.')[0]
  )

  const maxNumberOfReplicas = ['ci_micro', 'ci_small', 'ci_medium', 'ci_large'].includes(
    selectedCompute
  )
    ? MAX_REPLICAS_BELOW_XL
    : MAX_REPLICAS_ABOVE_XL
  const reachedMaxReplicas =
    (data ?? []).filter((db) => db.identifier !== projectRef).length >= maxNumberOfReplicas
  const isAWSProvider = project?.cloud_provider === 'AWS'
  const isWalgEnabled = project?.is_physical_backups_enabled
  const currentComputeAddon = addons?.selected_addons.find(
    (addon) => addon.type === 'compute_instance'
  )
  const isProWithSpendCapEnabled = org?.plan.id === 'pro' && !org.usage_billing_enabled
  const isMinimallyOnSmallCompute =
    currentComputeAddon?.variant.identifier !== undefined &&
    currentComputeAddon?.variant.identifier !== 'ci_micro'
  const canDeployReplica =
    !reachedMaxReplicas &&
    currentPgVersion >= 15 &&
    isAWSProvider &&
    hasReadReplicaAccess &&
    isWalgEnabled &&
    currentComputeAddon !== undefined &&
    !hasOverdueInvoices &&
    !isAwsK8s &&
    !isProWithSpendCapEnabled

  const computeAddons =
    addons?.available_addons.find((addon) => addon.type === 'compute_instance')?.variants ?? []
  const selectedComputeMeta = computeAddons.find((addon) => addon.identifier === selectedCompute)
  const estComputeMonthlyCost = Math.floor((selectedComputeMeta?.price ?? 0) * 730) // 730 hours in a month

  const availableRegions =
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
      ? AVAILABLE_REPLICA_REGIONS.filter((x) =>
          ['SOUTHEAST_ASIA', 'CENTRAL_EU', 'EAST_US'].includes(x.key)
        )
      : AVAILABLE_REPLICA_REGIONS

  const onSubmit = async () => {
    const regionKey = AWS_REGIONS[selectedRegion as AWS_REGIONS_KEYS].code
    if (!projectRef) return console.error('Project is required')
    if (!regionKey) return toast.error('Unable to deploy replica: Unsupported region selected')

    const primary = data?.find((db) => db.identifier === projectRef)
    setUpReplica({ projectRef, region: regionKey as Region, size: primary?.size ?? 't4g.small' })
  }

  useEffect(() => {
    if (visible && isSuccess) {
      if (selectedDefaultRegion !== undefined) {
        setSelectedRegion(selectedDefaultRegion)
      } else if (defaultRegion) {
        setSelectedRegion(defaultRegion)
      }
      if (defaultCompute !== undefined) setSelectedCompute(defaultCompute)
    }
  }, [visible, isSuccess])

  return (
    <SidePanel
      visible={visible}
      onCancel={onClose}
      loading={isSettingUp}
      disabled={!canDeployReplica}
      className={cn(showNewDiskManagementUI ? 'max-w-[500px]' : '')}
      header={t('settings.infrastructure.deploy_new_read_replica')}
      onConfirm={() => onSubmit()}
      confirmText={t('settings.infrastructure.deploy_replica_button')}
      onOpenAutoFocus={() => {}}
      onCloseAutoFocus={() => {}}
      onEscapeKeyDown={() => {}}
      onPointerDownOutside={() => {}}
      onInteractOutside={() => {}}
    >
      <SidePanel.Content className="flex flex-col py-4 gap-y-4">
        {hasOverdueInvoices ? (
          <Alert_Shadcn_>
            <WarningIcon />
            <AlertTitle_Shadcn_>{t('settings.infrastructure.org_overdue_invoices')}</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              <span>
                {t('settings.infrastructure.resolve_invoices_first')}
              </span>
              <div className="mt-3">
                <Button asChild type="default">
                  <Link href={`/org/${org?.slug}/billing#invoices`}>{t('settings.infrastructure.view_invoices')}</Link>
                </Button>
              </div>
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        ) : !isAWSProvider ? (
          <Alert_Shadcn_>
            <WarningIcon />
            <AlertTitle_Shadcn_>
              {t('settings.infrastructure.read_replicas_aws_only_title')}
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              <span>
                {t('settings.infrastructure.read_replicas_aws_only_desc')}
              </span>
              <DocsButton
                abbrev={false}
                className="mt-3"
                href={`${DOCS_URL}/guides/platform/read-replicas#prerequisites`}
              />
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        ) : isAwsK8s ? (
          <Alert_Shadcn_>
            <WarningIcon />
            <AlertTitle_Shadcn_>
              {t('settings.infrastructure.read_replicas_aws_revamped_title')}
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              <span>
                {t('settings.infrastructure.read_replicas_aws_only_desc')}
              </span>
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        ) : currentPgVersion < 15 ? (
          <Alert_Shadcn_>
            <WarningIcon />
            <AlertTitle_Shadcn_>
              {t('settings.infrastructure.read_replicas_pg_version_title')}
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              {t('settings.infrastructure.contact_support_for_replicas')}
            </AlertDescription_Shadcn_>
            <AlertDescription_Shadcn_ className="mt-2">
              <Button type="default">
                <SupportLink
                  queryParams={{
                    projectRef,
                    category: SupportCategories.SALES_ENQUIRY,
                    subject: 'Enquiry on read replicas',
                    message: `Project DB version: ${project?.dbVersion}`,
                  }}
                >
                  {t('settings.infrastructure.contact_support')}
                </SupportLink>
              </Button>
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        ) : !isMinimallyOnSmallCompute ? (
          <Alert_Shadcn_>
            <WarningIcon />
            <AlertTitle_Shadcn_>
              {t('settings.infrastructure.small_compute_required_title')}
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              <span>
                {t('settings.infrastructure.small_compute_required_desc')}
              </span>
              <div className="flex items-center gap-x-2 mt-3">
                <Button asChild type="default">
                  <Link
                    href={
                      hasReadReplicaAccess
                        ? `/project/${projectRef}/settings/compute-and-disk`
                        : `/org/${org?.slug}/billing?panel=subscriptionPlan&source=deployNewReplicaPanelSmallCompute`
                    }
                  >
                    {hasReadReplicaAccess ? t('settings.infrastructure.change_compute_size') : t('settings.infrastructure.upgrade_to_pro')}
                  </Link>
                </Button>
                <DocsButton
                  abbrev={false}
                  href={`${DOCS_URL}/guides/platform/read-replicas#prerequisites`}
                />
              </div>
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        ) : !isWalgEnabled ? (
          <Alert_Shadcn_>
            <WarningIcon />
            <AlertTitle_Shadcn_>
              {refetchInterval !== false
                ? t('settings.infrastructure.enabling_physical_backups')
                : t('settings.infrastructure.physical_backups_required')}
            </AlertTitle_Shadcn_>
            {refetchInterval === false && (
              <AlertDescription_Shadcn_ className="mb-2">
                {t('settings.infrastructure.physical_backups_desc')}
              </AlertDescription_Shadcn_>
            )}
            <AlertDescription_Shadcn_>
              {refetchInterval !== false
                ? t('settings.infrastructure.check_back_later')
                : t('settings.infrastructure.enable_physical_backups_desc')}
            </AlertDescription_Shadcn_>
            {refetchInterval !== false ? (
              <AlertDescription_Shadcn_ className="mt-2">
                {t('settings.infrastructure.start_deploying_after')}
              </AlertDescription_Shadcn_>
            ) : (
              <AlertDescription_Shadcn_ className="flex items-center gap-x-2 mt-3">
                <Button
                  type="default"
                  loading={isEnabling}
                  disabled={isEnabling}
                  onClick={() => {
                    if (projectRef) enablePhysicalBackups({ ref: projectRef })
                  }}
                >
                  {t('settings.infrastructure.enable_physical_backups')}
                </Button>
                <DocsButton
                  abbrev={false}
                  href={`${DOCS_URL}/guides/platform/read-replicas#how-are-read-replicas-made`}
                />
              </AlertDescription_Shadcn_>
            )}
          </Alert_Shadcn_>
        ) : isProWithSpendCapEnabled ? (
          <Alert_Shadcn_>
            <WarningIcon />
            <AlertTitle_Shadcn_>
              {t('settings.infrastructure.spend_cap_disabled_title')}
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              <span>
                {t('settings.infrastructure.spend_cap_disabled_desc')}
              </span>
              <div className="flex items-center gap-x-2 mt-3">
                <Button asChild type="default">
                  <Link href={`/org/${org?.slug}/billing?panel=costControl`}>
                    {t('settings.infrastructure.disable_spend_cap')}
                  </Link>
                </Button>
              </div>
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        ) : reachedMaxReplicas ? (
          <Alert_Shadcn_>
            <WarningIcon />
            <AlertTitle_Shadcn_>
              {t('settings.infrastructure.max_replicas_title', { count: maxNumberOfReplicas })}
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              {t('settings.infrastructure.max_replicas_desc')}
            </AlertDescription_Shadcn_>
            {maxNumberOfReplicas === MAX_REPLICAS_BELOW_XL && (
              <>
                <AlertDescription_Shadcn_>
                  <span dangerouslySetInnerHTML={{ __html: t('settings.infrastructure.upgrade_compute_for_more', { max: MAX_REPLICAS_ABOVE_XL }) }} />
                  <div className="flex items-center gap-x-2 mt-3">
                    <Button asChild type="default">
                      <Link
                        href={
                          hasReadReplicaAccess
                            ? `/project/${projectRef}/settings/compute-and-disk`
                            : `/org/${org?.slug}/billing?panel=subscriptionPlan&source=deployNewReplicaPanelMaxReplicas`
                        }
                      >
                        {t('settings.infrastructure.upgrade_compute_size')}
                      </Link>
                    </Button>
                  </div>
                </AlertDescription_Shadcn_>
              </>
            )}
          </Alert_Shadcn_>
        ) : null}

        <div className="flex flex-col gap-y-6 mt-2">
          <Listbox
            size="small"
            id="region"
            name="region"
            disabled={!canDeployReplica}
            value={selectedRegion}
            onChange={setSelectedRegion}
            label={t('settings.infrastructure.select_region_label')}
          >
            {availableRegions.map((region) => (
              <Listbox.Option
                key={region.key}
                label={region.name}
                value={region.key}
                addOnBefore={() => (
                  <img
                    alt="region icon"
                    className="w-5 rounded-sm"
                    src={`${BASE_PATH}/img/regions/${region.region}.svg`}
                  />
                )}
              >
                <p className="flex items-center gap-x-2">
                  <span>{region.name}</span>
                  <span className="text-xs text-foreground-lighter font-mono">{region.region}</span>
                </p>
              </Listbox.Option>
            ))}
          </Listbox>

          <div className="flex flex-col gap-y-2">
            {showNewDiskManagementUI ? (
              <>
                <Collapsible_Shadcn_>
                  <CollapsibleTrigger_Shadcn_ className="w-full flex items-center justify-between [&[data-state=open]>svg]:!-rotate-180">
                    <p className="text-sm text-left">
                      <span dangerouslySetInnerHTML={{
                        __html: t('settings.infrastructure.replica_cost_summary', {
                          cost: formatCurrency(
                            estComputeMonthlyCost +
                            additionalCostDiskSize +
                            Number(additionalCostIOPS) +
                            Number(additionalCostThroughput)
                          )
                        })
                      }} />
                    </p>
                    <ChevronDown size={14} className="transition" />
                  </CollapsibleTrigger_Shadcn_>
                  <CollapsibleContent_Shadcn_ className="flex flex-col gap-y-1 mt-1">
                    <p className="text-foreground-light text-sm">
                      {t('settings.infrastructure.replica_cost_desc')}
                    </p>
                    <p className="text-foreground-light text-sm">
                      {t('settings.infrastructure.cost_breakdown')}
                    </p>
                    <Table>
                      <TableHeader className="font-mono uppercase text-xs [&_th]:h-auto [&_th]:pb-2 [&_th]:pt-4">
                        <TableRow>
                          <TableHead className="w-[140px] pl-0">{t('settings.infrastructure.item')}</TableHead>
                          <TableHead>{t('settings.infrastructure.description')}</TableHead>
                          <TableHead className="text-right pr-0">{t('settings.infrastructure.cost_per_month')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="[&_td]:py-0 [&_tr]:h-[50px] [&_tr]:border-dotted">
                        <TableRow>
                          <TableCell className="pl-0">{t('settings.infrastructure.compute_size')}</TableCell>
                          <TableCell>{selectedComputeMeta?.name}</TableCell>
                          <TableCell className="text-right font-mono pr-0" translate="no">
                            {formatCurrency(estComputeMonthlyCost)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-0">{t('settings.infrastructure.disk_size')}</TableCell>
                          <TableCell>
                            {((size_gb ?? 0) * 1.25).toLocaleString()} GB ({type})
                          </TableCell>
                          <TableCell className="text-right font-mono pr-0" translate="no">
                            {formatCurrency(additionalCostDiskSize)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-0">{t('settings.infrastructure.iops')}</TableCell>
                          <TableCell>{iops?.toLocaleString()} IOPS</TableCell>
                          <TableCell className="text-right font-mono pr-0" translate="no">
                            {formatCurrency(+additionalCostIOPS)}
                          </TableCell>
                        </TableRow>
                        {type === 'gp3' && (
                          <TableRow>
                            <TableCell className="pl-0">{t('settings.infrastructure.throughput')}</TableCell>
                            <TableCell>{throughput_mbps?.toLocaleString()} MB/s</TableCell>
                            <TableCell className="text-right font-mono pr-0">
                              {formatCurrency(+additionalCostThroughput)}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CollapsibleContent_Shadcn_>
                </Collapsible_Shadcn_>
              </>
            ) : (
              <p className="text-foreground-light text-sm" dangerouslySetInnerHTML={{
                __html: t('settings.infrastructure.old_disk_management_desc', {
                  size: selectedComputeMeta?.name,
                  cost: selectedComputeMeta?.price_description
                })
              }} />
            )}

            <p className="text-foreground-light text-sm">
              <span dangerouslySetInnerHTML={{
                __html: t('settings.infrastructure.read_more_billing').replace(
                  '<link>',
                  `<a href="${DOCS_URL}/guides/platform/manage-your-usage/read-replicas" target="_blank" rel="noreferrer" class="underline hover:text-foreground transition">`
                ).replace('</link>', '</a>')
              }} />
            </p>
          </div>
        </div>
      </SidePanel.Content>
    </SidePanel>
  )
}

export default DeployNewReplicaPanel
