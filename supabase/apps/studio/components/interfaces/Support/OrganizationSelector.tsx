import type { UseFormReturn } from 'react-hook-form'
// End of third-party imports

import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import {
  Badge,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import type { SupportFormValues } from './SupportForm.schema'
import { getOrgSubscriptionPlan, NO_ORG_MARKER, NO_PROJECT_MARKER } from './SupportForm.utils'

import { useTranslation } from 'react-i18next'

interface OrganizationSelectorProps {
  form: UseFormReturn<SupportFormValues>
  orgSlug: string | null
}

export function OrganizationSelector({ form, orgSlug }: OrganizationSelectorProps) {
  const { t } = useTranslation()
  const { data: organizations, isSuccess: isSuccessOrganizations } = useOrganizationsQuery()
  const subscriptionPlanId = getOrgSubscriptionPlan(organizations, orgSlug)

  return (
    <FormField_Shadcn_
      name="organizationSlug"
      control={form.control}
      render={({ field }) => {
        const { ref: _ref, ...fieldWithoutRef } = field
        return (
          <FormItemLayout hideMessage layout="vertical" label={t('support.which_org_affected')}>
            <FormControl_Shadcn_>
              <Select_Shadcn_
                {...fieldWithoutRef}
                disabled={!isSuccessOrganizations}
                defaultValue={field.value}
                onValueChange={(value) => {
                  const previousOrgSlug = form.getValues('organizationSlug')
                  field.onChange(value)
                  if (previousOrgSlug !== value) {
                    form.resetField('projectRef', { defaultValue: NO_PROJECT_MARKER })
                  }
                }}
              >
                <SelectTrigger_Shadcn_ className="w-full" aria-label={t('support.select_organization')}>
                  <SelectValue_Shadcn_ asChild placeholder={t('support.select_organization')}>
                    <div className="flex items-center gap-x-2">
                      {orgSlug === NO_ORG_MARKER ? (
                        <span>{t('support.no_specific_org')}</span>
                      ) : (
                        (organizations ?? []).find((o) => o.slug === field.value)?.name
                      )}
                      {subscriptionPlanId && <Badge variant="default">{subscriptionPlanId}</Badge>}
                    </div>
                  </SelectValue_Shadcn_>
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  <SelectGroup_Shadcn_>
                    {organizations?.map((org) => (
                      <SelectItem_Shadcn_ key={org.slug} value={org.slug}>
                        {org.name}
                      </SelectItem_Shadcn_>
                    ))}
                    {isSuccessOrganizations && (organizations ?? []).length === 0 && (
                      <SelectItem_Shadcn_ value={NO_ORG_MARKER}>
                        {t('support.no_specific_org')}
                      </SelectItem_Shadcn_>
                    )}
                  </SelectGroup_Shadcn_>
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
            </FormControl_Shadcn_>
          </FormItemLayout>
        )
      }}
    />
  )
}
