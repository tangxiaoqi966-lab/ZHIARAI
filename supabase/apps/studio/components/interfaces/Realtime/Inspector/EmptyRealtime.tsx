import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { DOCS_URL } from 'lib/constants'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { AiIconAnimation, Button, Card, cn } from 'ui'

import { AnimatedCursors } from './AnimatedCursors'

/**
 * Acts as a container component for the entire log display
 */
export const EmptyRealtime = ({ projectRef }: { projectRef: string }) => {
  const { t } = useTranslation()
  const aiSnap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()

  const handleCreateTriggerWithAssistant = () => {
    openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
    aiSnap.newChat({
      name: `Realtime`,
      initialInput: `Help me set up a realtime experience for my project`,
    })
  }

  return (
    <div className="flex grow items-center justify-center p-12 @container">
      <div className="w-full max-w-4xl flex flex-col items-center gap-0">
        <div className="text-center mb-12">
          <AnimatedCursors />
          <h2 className="heading-section mb-1">{t('realtime.create_realtime_experiences')}</h2>
          <p className="text-foreground-light mb-6">
            {t('realtime.create_realtime_experiences_description')}
          </p>
          <Button
            type="default"
            icon={<AiIconAnimation />}
            onClick={handleCreateTriggerWithAssistant}
          >
            {t('realtime.set_up_realtime')}
          </Button>
        </div>

        <Card className="grid grid-cols-1 @xl:grid-cols-3 bg divide-x mb-8">
          <div className="flex flex-col h-full p-6">
            <div className="flex items-center gap-3 mb-2">
              <span
                className={cn(
                  'text-xs shrink-0 font-mono text-foreground-light w-7 h-7 bg border flex items-center justify-center rounded-md'
                )}
              >
                1
              </span>
              <h3 className="heading-default">{t('realtime.broadcast_messages')}</h3>
            </div>
            <p className="text-foreground-light text-sm mb-4 flex-1">
              {t('realtime.broadcast_messages_description')}
            </p>
            <Button type="default" className="w-full">
              <Link href={`/project/${projectRef}/database/triggers`}>{t('realtime.create_a_trigger')}</Link>
            </Button>
          </div>

          <div className="flex flex-col h-full p-6">
            <div className="flex items-center gap-3 mb-2">
              <span
                className={cn(
                  'text-xs shrink-0 font-mono text-foreground-light w-7 h-7 bg border flex items-center justify-center rounded-md'
                )}
              >
                2
              </span>
              <h3 className="heading-default">{t('realtime.write_policies')}</h3>
            </div>
            <p className="text-foreground-light text-sm mb-4 flex-1">
              {t('realtime.write_policies_description')}
            </p>
            <Button type="default">
              <Link href={`/project/${projectRef}/realtime/policies`}>{t('realtime.write_a_policy')}</Link>
            </Button>
          </div>

          <div className="flex flex-col h-full p-6">
            <div className="flex items-center gap-3 mb-2">
              <span
                className={cn(
                  'text-xs shrink-0 font-mono text-foreground-light w-7 h-7 bg border flex items-center justify-center rounded-md'
                )}
              >
                3
              </span>
              <h3 className="heading-default">{t('realtime.subscribe_to_channel')}</h3>
            </div>
            <p className="text-foreground-light text-sm mb-4 flex-1">
              {t('realtime.subscribe_to_channel_description')}
            </p>
            <Button type="default" asChild>
              <Link
                href={`${DOCS_URL}/guides/realtime/subscribing-to-database-changes#listening-on-client-side`}
              >
                {t('realtime.read_the_guide')}
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
