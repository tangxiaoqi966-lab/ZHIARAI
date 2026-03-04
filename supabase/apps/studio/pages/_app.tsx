import 'react-data-grid/lib/styles.css'
import 'styles/code.scss'
import 'styles/contextMenu.scss'
import 'styles/editor.scss'
import 'styles/focus.scss'
import 'styles/graphiql-base.scss'
import 'styles/grid.scss'
import 'styles/main.scss'
import 'styles/markdown-preview.scss'
import 'styles/monaco.scss'
import 'styles/react-data-grid-logs.scss'
import 'styles/reactflow.scss'
import 'styles/storage.scss'
import 'styles/stripe.scss'
import 'styles/toast.scss'
import 'styles/typography.scss'
import 'styles/ui.scss'
import 'ui-patterns/ShimmeringLoader/index.css'
import 'ui/build/css/themes/dark.css'
import 'ui/build/css/themes/light.css'

// i18n 配置 - 必须导入以初始化国际化
import 'lib/i18n/config'

import { loader } from '@monaco-editor/react'
import * as Sentry from '@sentry/nextjs'
import { HydrationBoundary, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import {
  FeatureFlagProvider,
  getFlags,
  TelemetryTagManager,
  ThemeProvider,
  useThemeSandbox,
} from 'common'
import MetaFaviconsPagesRouter from 'common/MetaFavicons/pages-router'
import { StudioCommandMenu } from 'components/interfaces/App/CommandMenu'
import { StudioCommandProvider as CommandProvider } from 'components/interfaces/App/CommandMenu/StudioCommandProvider'
import { FeaturePreviewContextProvider } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { FeaturePreviewModal } from 'components/interfaces/App/FeaturePreview/FeaturePreviewModal'
import { MonacoThemeProvider } from 'components/interfaces/App/MonacoThemeProvider'
import { RouteValidationWrapper } from 'components/interfaces/App/RouteValidationWrapper'
import { MainScrollContainerProvider } from 'components/layouts/MainScrollContainerContext'
import { GlobalErrorBoundaryState } from 'components/ui/ErrorBoundary/GlobalErrorBoundaryState'
import { useRootQueryClient } from 'data/query-client'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { DevToolbar, DevToolbarProvider } from 'dev-tools'
import { customFont, sourceCodePro } from 'fonts'
import { useCustomContent } from 'hooks/custom-content/useCustomContent'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { AuthProvider } from 'lib/auth'
import { API_URL, BASE_PATH, IS_PLATFORM, useDefaultProvider } from 'lib/constants'
import { ProfileProvider } from 'lib/profile'
import { Telemetry } from 'lib/telemetry'
import Head from 'next/head'
import { NuqsAdapter } from 'nuqs/adapters/next/pages'
import { ErrorInfo, useCallback, useEffect, type ComponentProps } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { useTranslation, I18nextProvider } from 'react-i18next'
import { AiAssistantStateContextProvider } from 'state/ai-assistant-state'
import type { AppPropsWithLayout } from 'types'
import { SonnerToaster, TooltipProvider } from 'ui'
import i18nInstance from 'lib/i18n/config'

dayjs.extend(customParseFormat)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)
dayjs.extend(duration)

const FeatureFlagProviderWithOrgContext = ({
  children,
  ...props
}: ComponentProps<typeof FeatureFlagProvider>) => {
  const { data: selectedOrganization } = useSelectedOrganizationQuery({ enabled: IS_PLATFORM })

  return (
    <FeatureFlagProvider {...props} organizationSlug={selectedOrganization?.slug ?? undefined}>
      {children}
    </FeatureFlagProvider>
  )
}

loader.config({
  // [Joshen] Attempt for offline support/bypass ISP issues is to store the assets required for monaco
  // locally. We're however, only storing the assets which we need (based on what the network tab loads
  // while using monaco). If we end up facing more effort trying to maintain this, probably to either
  // use cloudflare or find some way to pull all the files from a CDN via a CLI, rather than tracking individual files
  // The alternative was to import * as monaco from 'monaco-editor' but i couldn't get it working
  paths: {
    vs: IS_PLATFORM
      ? 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs'
      : `${BASE_PATH}/monaco-editor`,
  },
})

// [Joshen TODO] Once we settle on the new nav layout - we'll need a lot of clean up in terms of our layout components
// a lot of them are unnecessary and introduce way too many cluttered CSS especially with the height styles that make
// debugging way too difficult. Ideal scenario is we just have one AppLayout to control the height and scroll areas of
// the dashboard, all other layout components should not be doing that

function CustomApp({ Component, pageProps }: AppPropsWithLayout) {
  const queryClient = useRootQueryClient()
  const { appTitle } = useCustomContent(['app:title'])
  const { i18n } = useTranslation() // 引入 i18n 实例

  // 在客户端挂载时检查 localStorage 中的语言设置
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('supabase-i18next-lng')
      // Simple browser detection if no saved preference
      const browserLang = navigator.language
      const defaultLang = browserLang.startsWith('zh') ? 'zh-CN' : 'en'
      
      const targetLang = savedLanguage || defaultLang

      if (targetLang !== i18n.language) {
        i18n.changeLanguage(targetLang)
      }
      
      // Set dayjs locale
      dayjs.locale(targetLang === 'zh-CN' ? 'zh-cn' : 'en')

      // Ensure language preference is persisted
      const handleLanguageChange = (lng: string) => {
        localStorage.setItem('supabase-i18next-lng', lng)
        dayjs.locale(lng === 'zh-CN' ? 'zh-cn' : 'en')
      }
      i18n.on('languageChanged', handleLanguageChange)

      return () => {
        i18n.off('languageChanged', handleLanguageChange)
      }
    }
  }, [i18n])

  const getLayout = Component.getLayout ?? ((page) => page)

  const errorBoundaryHandler = (error: Error, info: ErrorInfo) => {
    Sentry.withScope(function (scope) {
      scope.setTag('globalErrorBoundary', true)
      const eventId = Sentry.captureException(error)
      // Attach the Sentry event ID to the error object so it can be accessed by the error boundary
      if (eventId && error && typeof error === 'object') {
        ;(error as any).sentryId = eventId
      }
    })

    console.error(error.stack)
  }

  useThemeSandbox()

  const isTestEnv = process.env.NEXT_PUBLIC_NODE_ENV === 'test'

  const cloudProvider = useDefaultProvider()

  const getConfigCatFlags = useCallback(
    (userEmail?: string) => {
      const customAttributes = cloudProvider ? { cloud_provider: cloudProvider } : undefined
      return getFlags(userEmail, customAttributes)
    },
    [cloudProvider]
  )

  return (
    <I18nextProvider i18n={i18nInstance}>
      <ErrorBoundary FallbackComponent={GlobalErrorBoundaryState} onError={errorBoundaryHandler}>
        <QueryClientProvider client={queryClient}>
          <NuqsAdapter>
            <HydrationBoundary state={pageProps.dehydratedState}>
              <AuthProvider>
                <FeatureFlagProviderWithOrgContext
                  API_URL={API_URL}
                  enabled={IS_PLATFORM}
                  getConfigCatFlags={getConfigCatFlags}
                >
                  <ProfileProvider>
                    <Head>
                      <title>{appTitle ?? 'Supabase'}</title>
                      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
                      <meta property="og:image" content={`${BASE_PATH}/img/supabase-logo.png`} />
                      <meta name="googlebot" content="notranslate" />
                      <meta name="google" content="notranslate" />
                      <meta http-equiv="Content-Language" content="en" />
                      {/* [Alaister]: This has to be an inline style tag here and not a separate component due to next/font */}
                      <style
                        dangerouslySetInnerHTML={{
                          __html: `:root{--font-custom:${customFont.style.fontFamily};--font-source-code-pro:${sourceCodePro.style.fontFamily};}`,
                        }}
                      />
                      {/* Speed up initial API loading times by pre-connecting to the API domain */}
                      {IS_PLATFORM && (
                        <link
                          rel="preconnect"
                          href={new URL(API_URL).origin}
                          crossOrigin="use-credentials"
                        />
                      )}
                    </Head>
                    <MetaFaviconsPagesRouter applicationName="Supabase Studio" includeManifest />
                    <TooltipProvider delayDuration={0}>
                      <RouteValidationWrapper>
                        <ThemeProvider
                          defaultTheme="system"
                          themes={['dark', 'light', 'classic-dark']}
                          enableSystem
                          disableTransitionOnChange
                        >
                          <DevToolbarProvider apiUrl={API_URL}>
                            <AiAssistantStateContextProvider>
                              <CommandProvider>
                                <FeaturePreviewContextProvider>
                                  <MainScrollContainerProvider>
                                    {getLayout(<Component {...pageProps} />)}
                                  </MainScrollContainerProvider>
                                  <StudioCommandMenu />
                                  <FeaturePreviewModal />
                                </FeaturePreviewContextProvider>
                                <SonnerToaster position="top-right" />
                                <MonacoThemeProvider />
                              </CommandProvider>
                            </AiAssistantStateContextProvider>
                            <DevToolbar />
                          </DevToolbarProvider>
                        </ThemeProvider>
                      </RouteValidationWrapper>
                    </TooltipProvider>
                    <Telemetry />
                    {!isTestEnv && (
                      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
                    )}
                  </ProfileProvider>
                </FeatureFlagProviderWithOrgContext>
              </AuthProvider>
            </HydrationBoundary>
          </NuqsAdapter>
        </QueryClientProvider>
        <TelemetryTagManager />
      </ErrorBoundary>
    </I18nextProvider>
  )
}

export default CustomApp
