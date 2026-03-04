import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { AiIconAnimation } from 'ui'

interface CreateTriggerButtonsProps {
  hasTables: boolean
  canCreateTriggers: boolean
  selectedSchema: string
  onCreateTrigger: () => void
  showPlusIcon?: boolean
  buttonType?: 'default'
}

export const CreateTriggerButtons = ({
  hasTables,
  canCreateTriggers,
  selectedSchema,
  onCreateTrigger,
  showPlusIcon = true,
  buttonType,
}: CreateTriggerButtonsProps) => {
  const { t } = useTranslation()
  const aiSnap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()

  return (
    <div className="flex items-center gap-x-2">
      <ButtonTooltip
        type={buttonType}
        disabled={!hasTables || !canCreateTriggers}
        onClick={onCreateTrigger}
        className="flex-grow"
        icon={showPlusIcon ? <Plus /> : undefined}
        tooltip={{
          content: {
            side: 'bottom',
            text: !hasTables
              ? t('triggers.create_table_first')
              : !canCreateTriggers
                ? t('triggers.create_permission_error')
                : undefined,
          },
        }}
      >
        {t('triggers.new_trigger')}
      </ButtonTooltip>

      {hasTables && (
        <ButtonTooltip
          type="default"
          disabled={!hasTables || !canCreateTriggers}
          className="px-1 pointer-events-auto"
          icon={<AiIconAnimation size={16} />}
          onClick={() => {
            openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
            aiSnap.newChat({
              name: t('triggers.create_new_trigger_chat_title'),
              initialInput: t('triggers.create_new_trigger_initial_input', { schema: selectedSchema }),
              suggestions: {
                title: t('triggers.create_new_trigger_suggestions_title'),
                prompts: [
                  {
                    label: t('triggers.prompt_log_changes'),
                    description: t('triggers.prompt_log_changes_desc'),
                  },
                  {
                    label: t('triggers.prompt_update_timestamp'),
                    description: t('triggers.prompt_update_timestamp_desc'),
                  },
                  {
                    label: t('triggers.prompt_validate_email'),
                    description: t('triggers.prompt_validate_email_desc'),
                  },
                ],
              },
            })
          }}
          tooltip={{
            content: {
              side: 'bottom',
              text: !canCreateTriggers
                ? t('triggers.create_permission_error')
                : t('triggers.create_with_assistant_tooltip'),
            },
          }}
        />
      )}
    </div>
  )
}
