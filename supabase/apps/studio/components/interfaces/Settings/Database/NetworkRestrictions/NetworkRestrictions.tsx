import { PermissionAction } from '@supabase/shared-types/out/constants'
import { AlertCircle, ChevronDown, Globe, Lock } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DocsButton } from 'components/ui/DocsButton'
import { useNetworkRestrictionsQuery } from 'data/network-restrictions/network-restrictions-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import {
  PageSection,
  PageSectionAside,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import AddRestrictionModal from './AddRestrictionModal'
import AllowAllModal from './AllowAllModal'
import DisallowAllModal from './DisallowAllModal'
import RemoveRestrictionModal from './RemoveRestrictionModal'

interface AccessButtonProps {
  disabled: boolean
  onClick: (value: boolean) => void
}

const AllowAllAccessButton = ({ disabled, onClick }: AccessButtonProps) => {
  const { t } = useTranslation()
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="default" disabled={disabled} onClick={() => onClick(true)}>
          {t('network_restrictions.allow_all_access')}
        </Button>
      </TooltipTrigger>
      {disabled && (
        <TooltipContent side="bottom">
          {t('network_restrictions.update_permission_error')}
        </TooltipContent>
      )}
    </Tooltip>
  )
}

const DisallowAllAccessButton = ({ disabled, onClick }: AccessButtonProps) => {
  const { t } = useTranslation()
  return (
    <ButtonTooltip
      disabled={disabled}
      type="default"
      onClick={() => onClick(true)}
      tooltip={{
        content: {
          side: 'bottom',
          text: disabled
            ? t('network_restrictions.update_permission_error')
            : undefined,
        },
      }}
    >
      {t('network_restrictions.restrict_all_access')}
    </ButtonTooltip>
  )
}

export const NetworkRestrictions = () => {
  const { t } = useTranslation()
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [isAddingAddress, setIsAddingAddress] = useState<undefined | 'IPv4' | 'IPv6'>()
  const [isAllowingAll, setIsAllowingAll] = useState(false)
  const [isDisallowingAll, setIsDisallowingAll] = useState(false)
  const [selectedRestrictionToRemove, setSelectedRestrictionToRemove] = useState<string>()

  const { data, isPending: isLoading } = useNetworkRestrictionsQuery({ projectRef: ref })
  const { can: canUpdateNetworkRestrictions } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'projects',
    {
      resource: {
        project_id: project?.id,
      },
    }
  )

  const hasAccessToRestrictions = data?.entitlement === 'allowed'
  const ipv4Restrictions = data?.config?.dbAllowedCidrs ?? []
  // @ts-ignore [Joshen] API typing issue
  const ipv6Restrictions = data?.config?.dbAllowedCidrsV6 ?? []
  const restrictedIps = ipv4Restrictions.concat(ipv6Restrictions)
  const restrictionStatus = data?.status ?? ''

  const hasApplyError = restrictionStatus === 'stored'
  const isUninitialized = restrictedIps.length === 0 && restrictionStatus.length === 0
  const isAllowedAll = restrictedIps.includes('0.0.0.0/0') && restrictedIps.includes('::/0')
  const isDisallowedAll = restrictedIps.length === 0

  if (!hasAccessToRestrictions) return null

  return (
    <>
      <PageSection id="network-restrictions">
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>{t('network_restrictions.title')}</PageSectionTitle>
          </PageSectionSummary>
          <PageSectionAside className="flex items-center gap-x-2">
            <DocsButton href={`${DOCS_URL}/guides/platform/network-restrictions`} />
            {!canUpdateNetworkRestrictions ? (
              <ButtonTooltip
                disabled
                type="primary"
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: t('network_restrictions.update_permission_error'),
                  },
                }}
              >
                {t('network_restrictions.add_restriction')}
              </ButtonTooltip>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="primary"
                    disabled={!canUpdateNetworkRestrictions}
                    iconRight={<ChevronDown size={14} />}
                  >
                    {t('network_restrictions.add_restriction')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="bottom" className="w-48">
                  <DropdownMenuItem
                    key="IPv4"
                    disabled={isLoading}
                    onClick={() => setIsAddingAddress('IPv4')}
                  >
                    <p className="block text-foreground">{t('network_restrictions.add_ipv4_restriction')}</p>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    key="IPv6"
                    disabled={isLoading}
                    onClick={() => setIsAddingAddress('IPv6')}
                  >
                    <p className="block text-foreground">{t('network_restrictions.add_ipv6_restriction')}</p>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </PageSectionAside>
        </PageSectionMeta>
        <PageSectionContent>
          {isLoading ? (
            <Card>
              <CardContent>
                <div className="space-y-2">
                  <ShimmeringLoader />
                  <ShimmeringLoader className="w-[70%]" />
                  <ShimmeringLoader className="w-[50%]" />
                </div>
              </CardContent>
            </Card>
          ) : hasApplyError ? (
            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <AlertCircle size={20} strokeWidth={1.5} className="text-foreground-light" />
                      <p className="text-sm">
                        {t('network_restrictions.apply_error_title')}
                      </p>
                    </div>
                    <p className="text-sm text-foreground-light">
                      {t('network_restrictions.apply_error_desc')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AllowAllAccessButton
                      disabled={!canUpdateNetworkRestrictions}
                      onClick={setIsAllowingAll}
                    />
                    <DisallowAllAccessButton
                      disabled={!canUpdateNetworkRestrictions}
                      onClick={setIsDisallowingAll}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              {isUninitialized || isAllowedAll ? (
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="space-y-0.5">
                      <p className="text-foreground text-sm">
                        {t('network_restrictions.access_allowed_title')}
                      </p>
                      <p className="text-foreground-light text-sm">
                        {t('network_restrictions.access_allowed_desc')}
                      </p>
                    </div>
                  </div>
                  <div>
                    <DisallowAllAccessButton
                      disabled={!canUpdateNetworkRestrictions}
                      onClick={setIsDisallowingAll}
                    />
                  </div>
                </CardContent>
              ) : isDisallowedAll ? (
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-start space-x-4">
                    <Lock size={20} className="text-foreground-light" strokeWidth={1.5} />
                    <div className="space-y-1">
                      <p className="text-foreground-light text-sm">
                        <span dangerouslySetInnerHTML={{ __html: t('network_restrictions.access_disallowed_title') }} />
                      </p>
                      <p className="text-foreground-light text-sm">
                        {t('network_restrictions.access_disallowed_desc')}
                      </p>
                      <p className="text-foreground-light text-sm">
                        {t('network_restrictions.restrictions_note')}
                      </p>
                    </div>
                  </div>
                  <div>
                    <AllowAllAccessButton
                      disabled={!canUpdateNetworkRestrictions}
                      onClick={setIsAllowingAll}
                    />
                  </div>
                </CardContent>
              ) : (
                <>
                  <CardHeader className="md:flex-row md:items-center justify-between">
                    <CardDescription className="text-foreground-light">
                      <p>{t('network_restrictions.access_restricted_desc_1')}</p>
                      <p>
                        {t('network_restrictions.access_restricted_desc_2')}
                      </p>
                      <p>
                        {t('network_restrictions.restrictions_note')}
                      </p>
                    </CardDescription>
                    <div className="flex items-center space-x-2">
                      <AllowAllAccessButton
                        disabled={!canUpdateNetworkRestrictions}
                        onClick={setIsAllowingAll}
                      />
                      <DisallowAllAccessButton
                        disabled={!canUpdateNetworkRestrictions}
                        onClick={setIsDisallowingAll}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="py-0">
                    <div className="divide-y">
                      {restrictedIps.map((ip) => {
                        return (
                          <div key={ip} className="py-4 flex items-center justify-between">
                            <div className="flex items-center space-x-5">
                              <Globe size={16} className="text-foreground-lighter" />
                              <Badge>{ipv4Restrictions.includes(ip) ? 'IPv4' : 'IPv6'}</Badge>
                              <p className="text-sm font-mono">{ip}</p>
                            </div>
                            <Button
                              type="default"
                              onClick={() => setSelectedRestrictionToRemove(ip)}
                            >
                              {t('network_restrictions.remove')}
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </>
              )}
            </Card>
          )}
        </PageSectionContent>
      </PageSection>

      <AllowAllModal visible={isAllowingAll} onClose={() => setIsAllowingAll(false)} />
      <DisallowAllModal visible={isDisallowingAll} onClose={() => setIsDisallowingAll(false)} />

      <AddRestrictionModal
        type={isAddingAddress}
        hasOverachingRestriction={isAllowedAll || isDisallowedAll}
        onClose={() => setIsAddingAddress(undefined)}
      />
      <RemoveRestrictionModal
        visible={selectedRestrictionToRemove !== undefined}
        selectedRestriction={selectedRestrictionToRemove}
        onClose={() => setSelectedRestrictionToRemove(undefined)}
      />
    </>
  )
}
