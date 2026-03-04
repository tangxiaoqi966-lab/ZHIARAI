// End of third-party imports

import { SupportCategories } from '@supabase/shared-types/out/constants'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { UseFormReturn } from 'react-hook-form'
import {
  Badge,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Collapsible_Shadcn_,
  FormField_Shadcn_,
  Switch,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import type { ExtendedSupportCategories } from './Support.constants'
import type { SupportFormValues } from './SupportForm.schema'
import { useTranslation, Trans } from 'react-i18next'

export const DISABLE_SUPPORT_ACCESS_CATEGORIES: ExtendedSupportCategories[] = [
  SupportCategories.ACCOUNT_DELETION,
  SupportCategories.SALES_ENQUIRY,
  SupportCategories.REFUND,
]

interface SupportAccessToggleProps {
  form: UseFormReturn<SupportFormValues>
}

export function SupportAccessToggle({ form }: SupportAccessToggleProps) {
  const { t } = useTranslation()
  return (
    <FormField_Shadcn_
      name="allowSupportAccess"
      control={form.control}
      render={({ field }) => {
        return (
          <FormItemLayout
            hideMessage
            name="allowSupportAccess"
            className="px-6"
            layout="flex"
            label={
              <div className="flex items-center gap-x-2">
                <span className="text-foreground">{t('support.support_access_allow')}</span>
                <Badge className="bg-opacity-100">{t('support.support_access_recommended')}</Badge>
              </div>
            }
            description={
              <div className="flex flex-col">
                <span className="text-foreground-light">
                  {t('support.support_access_description')}
                </span>
                <Collapsible_Shadcn_ className="mt-2">
                  <CollapsibleTrigger_Shadcn_
                    className={
                      'group flex items-center gap-x-1 group-data-[state=open]:text-foreground hover:text-foreground transition'
                    }
                  >
                    <ChevronRight
                      size={14}
                      className="transition-all group-data-[state=open]:rotate-90 text-foreground-muted -ml-1"
                    />
                    <span className="text-sm">{t('support.support_access_more_info')}</span>
                  </CollapsibleTrigger_Shadcn_>
                  <CollapsibleContent_Shadcn_ className="text-sm text-foreground-light mt-2 space-y-2">
                    <p>
                      {t('support.support_access_details_1')}
                    </p>
                    <p>
                      <Trans
                        i18nKey="support.support_access_details_2"
                        components={{
                          1: (
                            <Link
                              href="https://supabase.com/privacy"
                              target="_blank"
                              rel="noreferrer"
                              className="text-foreground-light underline hover:text-foreground transition"
                            >
                              Privacy Policy
                            </Link>
                          ),
                        }}
                      />
                    </p>
                  </CollapsibleContent_Shadcn_>
                </Collapsible_Shadcn_>
              </div>
            }
          >
            <Switch
              size="large"
              id="allowSupportAccess"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormItemLayout>
        )
      }}
    />
  )
}
