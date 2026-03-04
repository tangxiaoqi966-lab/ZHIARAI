import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import type { UseFormReturn } from 'react-hook-form'
// End of third-party imports

import { SupportCategories } from '@supabase/shared-types/out/constants'
import { FormControl_Shadcn_, FormField_Shadcn_, Input_Shadcn_ } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { DocsSuggestions } from './DocsSuggestions'
import type { ExtendedSupportCategories } from './Support.constants'
import type { SupportFormValues } from './SupportForm.schema'
import { useTranslation, Trans } from 'react-i18next'

const INCLUDE_DISCUSSIONS: ExtendedSupportCategories[] = [
  SupportCategories.DATABASE_UNRESPONSIVE,
  SupportCategories.PROBLEM,
]

interface SubjectAndSuggestionsInfoProps {
  form: UseFormReturn<SupportFormValues>
  category: ExtendedSupportCategories
  subject: string
}

export function SubjectAndSuggestionsInfo({
  form,
  category,
  subject,
}: SubjectAndSuggestionsInfoProps) {
  const { t } = useTranslation()
  return (
    <div className={'flex flex-col gap-y-2'}>
      <FormField_Shadcn_
        name="subject"
        control={form.control}
        render={({ field }) => (
          <FormItemLayout layout="vertical" label={t('support.subject')}>
            <FormControl_Shadcn_>
              <Input_Shadcn_ {...field} placeholder={t('support.subject_placeholder')} />
            </FormControl_Shadcn_>
          </FormItemLayout>
        )}
      />
      <DocsSuggestions searchString={subject} />
      {subject && INCLUDE_DISCUSSIONS.includes(category) && (
        <GitHubDiscussionSuggestion subject={subject} />
      )}
    </div>
  )
}

interface GitHubDiscussionSuggestionProps {
  subject: string
}

function GitHubDiscussionSuggestion({ subject }: GitHubDiscussionSuggestionProps) {
  const { t } = useTranslation()
  return (
    <p className="flex items-center gap-x-1 text-foreground-lighter text-sm">
      <Trans
        i18nKey="support.check_github_discussions"
        components={{
          1: (
            <Link
              key="gh-discussions"
              href={`https://github.com/orgs/supabase/discussions?discussions_q=${subject}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-x-1 underline hover:text-foreground transition"
            >
              GitHub discussions
              <ExternalLink size={14} strokeWidth={2} />
            </Link>
          ),
        }}
      />
    </p>
  )
}
