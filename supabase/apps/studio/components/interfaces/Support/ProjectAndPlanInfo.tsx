// End of third-party imports

import { useParams } from 'common'
import CopyButton from 'components/ui/CopyButton'
import { OrganizationProjectSelector } from 'components/ui/OrganizationProjectSelector'
import { AnimatePresence, motion } from 'framer-motion'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { Check, ChevronsUpDown, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import type { UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  cn,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'

import type { ExtendedSupportCategories } from './Support.constants'
import type { SupportFormValues } from './SupportForm.schema'
import { NO_ORG_MARKER, NO_PROJECT_MARKER } from './SupportForm.utils'
import { useTranslation, Trans } from 'react-i18next'

interface ProjectAndPlanProps {
  form: UseFormReturn<SupportFormValues>
  orgSlug: string | null
  projectRef: string | null
  category: ExtendedSupportCategories
  subscriptionPlanId: string | undefined
  showPlanExpectationInfo?: boolean
}

export function ProjectAndPlanInfo({
  form,
  orgSlug,
  projectRef,
  category,
  subscriptionPlanId,
  showPlanExpectationInfo = true,
}: ProjectAndPlanProps) {
  const { t } = useTranslation()
  const hasProjectSelected = projectRef && projectRef !== NO_PROJECT_MARKER

  return (
    <div className="flex flex-col gap-y-2">
      <ProjectSelector form={form} orgSlug={orgSlug} projectRef={projectRef} />
      <ProjectRefHighlighted projectRef={projectRef} />

      {!hasProjectSelected && <Admonition type="default" title={t('support.no_project_selected')} />}

      {showPlanExpectationInfo &&
        orgSlug &&
        subscriptionPlanId !== 'enterprise' &&
        subscriptionPlanId !== 'platform' &&
        category !== 'Login_issues' && (
          <PlanExpectationInfoBox orgSlug={orgSlug} planId={subscriptionPlanId} />
        )}
    </div>
  )
}

interface ProjectSelectorProps {
  form: UseFormReturn<SupportFormValues>
  orgSlug: string | null
  projectRef: string | null
}

function ProjectSelector({ form, orgSlug, projectRef }: ProjectSelectorProps) {
  const { t } = useTranslation()
  const { projectRef: urlProjectRef } = useParams()

  return (
    <FormField_Shadcn_
      name="projectRef"
      control={form.control}
      render={({ field }) => (
        <FormItemLayout hideMessage layout="vertical" label={t('support.which_project_affected')}>
          <FormControl_Shadcn_>
            <OrganizationProjectSelector
              key={orgSlug}
              sameWidthAsTrigger
              fetchOnMount
              checkPosition="left"
              slug={!orgSlug || orgSlug === NO_ORG_MARKER ? undefined : orgSlug}
              selectedRef={field.value}
              onInitialLoad={(projects) => {
                if (!urlProjectRef && (!projectRef || projectRef === NO_PROJECT_MARKER))
                  field.onChange(projects[0]?.ref ?? NO_PROJECT_MARKER)
              }}
              onSelect={(project) => field.onChange(project.ref)}
              renderTrigger={({ isLoading, project, listboxId, open }) => {
                return (
                  <Button
                    block
                    type="default"
                    role="combobox"
                    aria-label={t('support.select_project')}
                    aria-expanded={open}
                    aria-controls={listboxId}
                    size="small"
                    className="justify-between"
                    iconRight={<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                  >
                    {!!orgSlug && isLoading ? (
                      <ShimmeringLoader className="w-44 py-2" />
                    ) : !field.value || field.value === NO_PROJECT_MARKER ? (
                      t('support.no_specific_project')
                    ) : (
                      project?.name ?? t('support.unknown_project')
                    )}
                  </Button>
                )
              }}
              renderActions={(setOpen) => (
                <CommandGroup_Shadcn_>
                  <CommandItem_Shadcn_
                    className="w-full gap-x-2"
                    onSelect={() => {
                      field.onChange(NO_PROJECT_MARKER)
                      setOpen(false)
                    }}
                  >
                    {field.value === NO_PROJECT_MARKER && <Check size={16} />}
                    <p className={cn(field.value !== NO_PROJECT_MARKER && 'ml-6')}>
                      {t('support.no_specific_project')}
                    </p>
                  </CommandItem_Shadcn_>
                </CommandGroup_Shadcn_>
              )}
            />
          </FormControl_Shadcn_>
        </FormItemLayout>
      )}
    />
  )
}

interface ProjectRefHighlightedProps {
  projectRef: string | null
}

function ProjectRefHighlighted({ projectRef }: ProjectRefHighlightedProps) {
  const { t } = useTranslation()
  const isVisible = !!projectRef && projectRef !== NO_PROJECT_MARKER

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-x-1"
        >
          <p className="text-sm transition text-foreground-lighter">
            {t('support.project_id')}:{' '}
            <code className="text-code-inline !text-foreground-light">{projectRef}</code>
          </p>
          <CopyButton
            iconOnly
            type="text"
            text={projectRef}
            onClick={() => toast.success(t('support.copied_project_id'))}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface PlanExpectationInfoBoxProps {
  orgSlug: string
  planId?: string
}

const PlanExpectationInfoBox = ({ orgSlug, planId }: PlanExpectationInfoBoxProps) => {
  const { t } = useTranslation()
  const { billingAll } = useIsFeatureEnabled(['billing:all'])
  const shouldShowUpgradeActions = billingAll && planId !== 'enterprise'

  return (
    <Admonition
      type="default"
      title={t('support.plan_expectations_title')}
      description={
        <>
          {planId === 'free' && (
            <p>
              {t('support.plan_expectations_free')}
            </p>
          )}

          {planId === 'pro' && (
            <p>
              {t('support.plan_expectations_pro')}
            </p>
          )}

          {planId === 'team' && (
            <p>
              {t('support.plan_expectations_team')}
            </p>
          )}
        </>
      }
      actions={
        shouldShowUpgradeActions && (
          <>
            <Button asChild>
              <Link
                href={`/org/${orgSlug}/billing?panel=subscriptionPlan&source=planSupportExpectationInfoBox`}
              >
                {t('support.upgrade_plan')}
              </Link>
            </Button>
            <Button asChild type="default" icon={<ExternalLink />}>
              <Link href="https://supabase.com/contact/enterprise" target="_blank" rel="noreferrer">
                {t('support.enquire_enterprise')}
              </Link>
            </Button>
          </>
        )
      }
    />
  )
}
