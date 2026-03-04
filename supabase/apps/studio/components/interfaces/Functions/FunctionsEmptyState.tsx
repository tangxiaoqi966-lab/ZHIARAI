import { Trans, useTranslation } from 'react-i18next'
import { useParams } from 'common'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import { DocsButton } from 'components/ui/DocsButton'
import { ResourceItem } from 'components/ui/Resource/ResourceItem'
import { ResourceList } from 'components/ui/Resource/ResourceList'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { DOCS_URL } from 'lib/constants'
import { Code, Github, Lock, Play, Server, Terminal } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { parseAsString, useQueryState } from 'nuqs'
import { useMemo } from 'react'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import {
  AiIconAnimation,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  CodeBlock,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogSection,
  DialogTitle,
  DialogTrigger,
  Separator,
} from 'ui'

import { getEdgeFunctionTemplates } from './Functions.templates'

export const FunctionsEmptyState = () => {
  const { t } = useTranslation()
  const { ref } = useParams()
  const router = useRouter()
  const aiSnap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()

  const { mutate: sendEvent } = useSendEventMutation()
  const { data: org } = useSelectedOrganizationQuery()
  const [, setCreateMethod] = useQueryState('create', parseAsString)

  const showStripeExample = useIsFeatureEnabled('edge_functions:show_stripe_example')
  const templates = useMemo(() => {
    const EDGE_FUNCTION_TEMPLATES = getEdgeFunctionTemplates(t)
    if (showStripeExample) {
      return EDGE_FUNCTION_TEMPLATES
    }

    // Filter out Stripe template
    return EDGE_FUNCTION_TEMPLATES.filter((template) => template.value !== 'stripe-webhook')
  }, [showStripeExample, t])

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('functions.deploy_first_function')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] divide-y md:divide-y-0 md:divide-x divide-default items-stretch">
          {/* Editor Option */}
          <div className="p-8">
            <div className="flex items-center gap-2">
              <Code strokeWidth={1.5} size={20} />
              <h4 className="text-base text-foreground">{t('functions.create_via_editor')}</h4>
            </div>
            <p className="text-sm text-foreground-light mb-4 mt-1">
              {t('functions.create_via_editor_description')}
            </p>
            <Button
              type="default"
              onClick={() => {
                router.push(`/project/${ref}/functions/new`)
                sendEvent({
                  action: 'edge_function_via_editor_button_clicked',
                  properties: { origin: 'no_functions_block' },
                  groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
                })
              }}
            >
              {t('functions.open_editor')}
            </Button>
          </div>

          {/* AI Assistant Option */}
          <div className="p-8">
            <div className="flex items-center gap-2">
              <AiIconAnimation size={20} />
              <h4 className="text-base text-foreground">{t('functions.create_via_assistant')}</h4>
            </div>
            <p className="text-sm text-foreground-light mb-4 mt-1">
              {t('functions.create_via_assistant_description')}
            </p>
            <Button
              type="default"
              onClick={() => {
                openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
                aiSnap.newChat({
                  name: 'Create new edge function',
                  initialInput: 'Create a new edge function that ...',
                  suggestions: {
                    title:
                      'I can help you create a new edge function. Here are a few example prompts to get you started:',
                    prompts: [
                      {
                        label: 'Stripe Payments',
                        description:
                          'Create a new edge function that processes payments with Stripe',
                      },
                      {
                        label: 'Email with Resend',
                        description: 'Create a new edge function that sends emails with Resend',
                      },
                      {
                        label: 'PDF Generator',
                        description:
                          'Create a new edge function that generates PDFs from HTML templates',
                      },
                    ],
                  },
                })
                sendEvent({
                  action: 'edge_function_ai_assistant_button_clicked',
                  properties: { origin: 'no_functions_block' },
                  groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
                })
              }}
            >
              {t('functions.open_assistant')}
            </Button>
          </div>

          {/* CLI Option */}
          <div className="p-8">
            <div className="flex items-center gap-2">
              <Terminal strokeWidth={1.5} size={20} />
              <h4 className="text-base text-foreground">{t('functions.create_via_cli')}</h4>
            </div>
            <p className="text-sm text-foreground-light mb-4 mt-1">
              {t('functions.create_via_cli_description')}
            </p>

            <Button
              type="default"
              onClick={() => {
                setCreateMethod('cli')
                sendEvent({
                  action: 'edge_function_via_cli_button_clicked',
                  properties: { origin: 'no_functions_block' },
                  groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
                })
              }}
            >
              {t('functions.view_cli_instructions')}
            </Button>
          </div>
        </CardContent>
      </Card>
      <ScaffoldSectionTitle className="text-xl mb-4 mt-12">
        {t('functions.start_with_template')}
      </ScaffoldSectionTitle>
      <ResourceList>
        {templates.map((template) => (
          <ResourceItem
            key={template.name}
            media={<Code strokeWidth={1.5} size={16} className="-translate-y-[9px]" />}
            onClick={() => {
              sendEvent({
                action: 'edge_function_template_clicked',
                properties: { templateName: template.name, origin: 'functions_page' },
                groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
              })
            }}
          >
            <Link href={`/project/${ref}/functions/new?template=${template.value}`}>
              <p>{template.name}</p>
              <p className="text-sm text-foreground-lighter">{template.description}</p>
            </Link>
          </ResourceItem>
        ))}
      </ResourceList>
    </>
  )
}

export const FunctionsInstructionsLocal = () => {
  const { t } = useTranslation()
  const showStripeExample = useIsFeatureEnabled('edge_functions:show_stripe_example')
  const templates = useMemo(() => {
    const EDGE_FUNCTION_TEMPLATES = getEdgeFunctionTemplates(t)
    if (showStripeExample) {
      return EDGE_FUNCTION_TEMPLATES
    }

    // Filter out Stripe template
    return EDGE_FUNCTION_TEMPLATES.filter((template) => template.value !== 'stripe-webhook')
  }, [showStripeExample, t])

  return (
    <>
      <div className="flex flex-col gap-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('functions.developing_locally')}</CardTitle>
          </CardHeader>
          <CardContent
            className={cn(
              'p-0 flex flex-col',
              '2xl:grid 2xl:grid-cols-[repeat(auto-fit,minmax(240px,1fr))] 2xl:divide-y-0 2xl:divide-x',
              'divide-y divide-default items-stretch'
            )}
          >
            <div className="p-8">
              <div className="flex items-center gap-2">
                <Code size={20} />
                <h4 className="text-base text-foreground">{t('functions.create_function')}</h4>
              </div>
              <p className="text-sm text-foreground-light mt-1 mb-4 prose [&>code]:text-xs text-sm max-w-full">
                <Trans i18nKey="functions.local_instructions.create_new_function">
                  Create a new edge function called <code>hello-world</code> in your project via the
                  Supabase CLI.
                </Trans>
              </p>
              <div className="mb-4">
                <CodeBlock
                  language="bash"
                  hideLineNumbers={true}
                  className={cn(
                    'px-3.5 max-w-full prose dark:prose-dark [&>code]:m-0 2xl:min-h-28'
                  )}
                  value="supabase functions new hello-world"
                />
              </div>
              <DocsButton
                href={`${DOCS_URL}/guides/functions/local-quickstart#create-an-edge-function`}
              />
            </div>

            <div className="p-8">
              <div className="flex items-center gap-2">
                <Play size={20} />
                <h4 className="text-base text-foreground">{t('functions.run_locally')}</h4>
              </div>
              <p className="text-sm text-foreground-light mt-1 mb-4 prose [&>code]:text-xs text-sm max-w-full">
                <Trans i18nKey="functions.local_instructions.run_locally_description">
                  You can run your Edge Function locally using <code>supabase functions serve</code>.
                </Trans>
              </p>
              <div className="mb-4">
                <CodeBlock
                  language="bash"
                  hideLineNumbers={true}
                  className={cn(
                    'px-3.5 max-w-full prose dark:prose-dark [&>code]:m-0 2xl:min-h-28'
                  )}
                  value={`
supabase start # start the supabase stack
supabase functions serve # start the Functions watcher`.trim()}
                />
              </div>
              <DocsButton
                href={`${DOCS_URL}/guides/functions/local-quickstart#running-edge-functions-locally`}
              />
            </div>

            <div className="p-8">
              <div className="flex items-center gap-2">
                <Terminal strokeWidth={1.5} size={20} />
                <h4 className="text-base text-foreground">{t('functions.invoke_locally')}</h4>
              </div>
              <p className="text-sm text-foreground-light mt-1 mb-4">
                {t('functions.local_instructions.invoke_locally_description')}
              </p>
              <div className="mb-4">
                <CodeBlock
                  language="bash"
                  hideLineNumbers={true}
                  className={cn(
                    'px-3.5 max-w-full prose dark:prose-dark [&>code]:m-0 2xl:min-h-28'
                  )}
                  value={`
curl --request POST 'http://localhost:54321/functions/v1/hello-world' \\
  --header 'Authorization: Bearer SUPABASE_ANON_KEY' \\
  --header 'Content-Type: application/json' \\
  --data '{ "name":"Functions" }'`.trim()}
                />
              </div>
              <DocsButton
                href={`${DOCS_URL}/guides/functions/local-quickstart#invoking-edge-functions-locally`}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('functions.self_hosting')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] divide-y md:divide-y-0 md:divide-x divide-default items-stretch">
            <div className="p-8">
              <div className="flex items-center gap-2">
                <Server size={20} />
                <h4 className="text-base text-foreground">{t('functions.self_hosting')}</h4>
              </div>
              <p className="text-sm text-foreground-light mt-1 mb-4 max-w-3xl">
                {t('functions.local_instructions.self_hosting_description')}
              </p>
              <div className="flex items-center gap-x-2">
                <DocsButton href={`${DOCS_URL}/reference/self-hosting-functions/introduction`} />
                <Button asChild type="default" icon={<Github />}>
                  <a href="https://github.com/supabase/edge-runtime/">GitHub</a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <ScaffoldSectionTitle className="text-xl mt-12">{t('functions.explore_templates')}</ScaffoldSectionTitle>
        <ResourceList>
          {templates.map((template) => (
            <Dialog key={template.name}>
              <DialogTrigger asChild>
                <ResourceItem
                  key={template.name}
                  media={<Code strokeWidth={1.5} size={16} className="-translate-y-[9px]" />}
                >
                  <div>
                    <p>{template.name}</p>
                    <p className="text-sm text-foreground-lighter">{template.description}</p>
                  </div>
                </ResourceItem>
              </DialogTrigger>
              <DialogContent size="large">
                <DialogHeader>
                  <DialogTitle>{template.name}</DialogTitle>
                  <DialogDescription>{template.description}</DialogDescription>
                </DialogHeader>
                <Separator />
                <DialogSection className="!p-0">
                  <CodeBlock
                    language="ts"
                    hideLineNumbers={true}
                    className={cn(
                      'border-0 rounded-none px-3.5 max-w-full prose dark:prose-dark [&>code]:m-0 max-h-[420px]'
                    )}
                    value={template.content}
                  />
                </DialogSection>
              </DialogContent>
            </Dialog>
          ))}
        </ResourceList>
      </div>
    </>
  )
}

export const FunctionsSecretsEmptyStateLocal = () => {
  const { t } = useTranslation()

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          {t('functions.secrets.local_dev_cli')}
          <div className="flex items-center gap-x-2">
            <DocsButton href={`${DOCS_URL}/guides/functions/secrets#using-the-cli`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-foreground-light mt-1 mb-4 max-w-3xl">
            <p>
              {t('functions.secrets.local_secrets_description')}
            </p>
            <ul className="list-disc pl-6">
              <li className="prose [&>code]:text-xs text-sm max-w-full">
                <Trans i18nKey="functions.secrets.env_file_method">
                  Through an <code>.env</code> file placed at <code>supabase/functions/.env</code>,
                  which is automatically loaded on <code>supabase start</code>
                </Trans>
              </li>
              <li className="prose [&>code]:text-xs text-sm max-w-full">
                <Trans i18nKey="functions.secrets.env_flag_method">
                  Through the <code>--env-file</code> option for <code>supabase functions serve</code>
                  , for example: <code>supabase functions serve --env-file ./path/to/.env-file</code>
                </Trans>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          {t('functions.secrets.self_hosted')}
          <div className="flex items-center gap-x-2">
            <DocsButton href={`${DOCS_URL}/guides/self-hosting/docker#configuring-services`} />
          </div>
        </CardHeader>
        <CardContent>
          <p className="prose [&>code]:text-xs space-x-1 text-sm max-w-full">
            <span>{t('functions.secrets.change_settings')}</span>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/supabase/supabase/blob/master/docker/.env.example"
            >
              .env file
            </a>
            <span>{t('functions.secrets.and')}</span>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/supabase/supabase/blob/master/docker/docker-compose.yml"
            >
              docker-compose.yml
            </a>
            <span>{t('functions.secrets.at')}</span>
            <code>functions</code>
            <span>{t('functions.secrets.service')}</span>
          </p>
          <p className="prose [&>code]:text-xs space-x-1 text-sm max-w-full">
            <span>{t('functions.secrets.secrets_runtime_injection')}</span>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/supabase/supabase/blob/8bb82bb3a5aee631e8e6e6e0c8a5f6e97fb8f898/docker/volumes/functions/main/index.ts#L74"
            >
              main/index.ts file
            </a>
          </p>
        </CardContent>
      </Card>
    </>
  )
}
