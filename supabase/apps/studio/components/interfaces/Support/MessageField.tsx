import type { UseFormReturn } from 'react-hook-form'
// End of third-party imports

import { FormControl_Shadcn_, FormField_Shadcn_, TextArea_Shadcn_ } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { IPV4SuggestionAlert } from './IPV4SuggestionAlert'
import { IPV4_MIGRATION_STRINGS } from './Support.constants'
import type { SupportFormValues } from './SupportForm.schema'
import { useTranslation } from 'react-i18next'

interface MessageFieldProps {
  form: UseFormReturn<SupportFormValues>
  originalError: string | null | undefined
}

export function MessageField({ form, originalError }: MessageFieldProps) {
  const { t } = useTranslation()
  return (
    <FormField_Shadcn_
      name="message"
      control={form.control}
      render={({ field }) => (
        <FormItemLayout
          layout="vertical"
          label={t('support.message_label')}
          labelOptional={t('support.character_limit')}
          description={
            IPV4_MIGRATION_STRINGS.some((str) => field.value.includes(str)) && (
              <IPV4SuggestionAlert />
            )
          }
        >
          <FormControl_Shadcn_>
            <TextArea_Shadcn_
              {...field}
              rows={4}
              maxLength={5000}
              placeholder={t('support.message_placeholder')}
            />
          </FormControl_Shadcn_>
          {originalError && (
            <Admonition
              showIcon={false}
              type="default"
              className="mt-2 max-h-[150px] overflow-y-auto"
              title={t('support.error_reference')}
            >
              <div className="flex flex-col gap-1 text-sm">
                <p className="font-mono text-xs whitespace-pre-wrap break-all">
                  {t('support.error_prefix')}: {originalError}
                </p>
              </div>
            </Admonition>
          )}
        </FormItemLayout>
      )}
    />
  )
}
