import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { PasswordStrengthBar } from 'components/ui/PasswordStrengthBar'
import { useDatabasePasswordResetMutation } from 'data/database/database-password-reset-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsProjectActive, useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DEFAULT_MINIMUM_PASSWORD_STRENGTH } from 'lib/constants'
import { passwordStrength, PasswordStrengthScore } from 'lib/password-strength'
import { generateStrongPassword } from 'lib/project'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from 'ui'
const Modal = require('ui').Modal as any
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionDescription,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

const ResetDbPassword = ({ disabled = false }) => {
  const { t } = useTranslation()
  const { ref } = useParams()
  const isProjectActive = useIsProjectActive()
  const { data: project } = useSelectedProjectQuery()

  const { can: canResetDbPassword } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'projects',
    {
      resource: {
        project_id: project?.id,
      },
    }
  )

  const [showResetDbPass, setShowResetDbPass] = useState<boolean>(false)

  const [password, setPassword] = useState<string>('')
  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState<string>('')
  const [passwordStrengthWarning, setPasswordStrengthWarning] = useState<string>('')
  const [passwordStrengthScore, setPasswordStrengthScore] = useState(0)

  const { mutate: resetDatabasePassword, isPending: isUpdatingPassword } =
    useDatabasePasswordResetMutation({
      onSuccess: async () => {
        toast.success(t('settings.database.password.reset_success'))
        setShowResetDbPass(false)
      },
    })

  useEffect(() => {
    if (showResetDbPass) {
      setPassword('')
      setPasswordStrengthMessage('')
      setPasswordStrengthWarning('')
      setPasswordStrengthScore(0)
    }
  }, [showResetDbPass])

  async function checkPasswordStrength(value: any) {
    const { message, warning, strength } = await passwordStrength(value)
    setPasswordStrengthScore(strength)
    setPasswordStrengthWarning(warning)
    setPasswordStrengthMessage(message)
  }

  const onDbPassChange = (e: any) => {
    const value = e.target.value
    setPassword(value)
    if (value == '') {
      setPasswordStrengthScore(-1)
      setPasswordStrengthMessage('')
    } else checkPasswordStrength(value)
  }

  const confirmResetDbPass = async () => {
    if (!ref) return console.error('Project ref is required')

    if (passwordStrengthScore >= DEFAULT_MINIMUM_PASSWORD_STRENGTH) {
      resetDatabasePassword({ ref, password })
    }
  }

  function generatePassword() {
    const password = generateStrongPassword()
    setPassword(password)
    checkPasswordStrength(password)
  }

  return (
    <>
      <PageSection id="database-password">
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>{t('settings.database.password.title')}</PageSectionTitle>

            <PageSectionDescription>{t('settings.database.password.description')}</PageSectionDescription>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <Card>
            <CardContent className="flex flex-row items-center gap-x-2 justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm text-foreground">{t('settings.database.password.reset_title')}</h3>
                <p className="text-sm text-foreground-light text-balance">
                  {t('settings.database.password.reset_description')}
                </p>
              </div>

              <ButtonTooltip
                type="default"
                disabled={!canResetDbPassword || !isProjectActive || disabled}
                onClick={() => setShowResetDbPass(true)}
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: !canResetDbPassword
                      ? t('settings.database.password.permission_error')
                      : !isProjectActive
                        ? t('settings.database.password.project_not_active')
                        : undefined,
                  },
                }}
              >
                {t('settings.database.password.reset_button')}
              </ButtonTooltip>
            </CardContent>
          </Card>
        </PageSectionContent>
      </PageSection>
      <Modal
        hideFooter
        header={t('settings.database.password.reset_title')}
        confirmText={t('settings.database.password.reset_button')}
        size="medium"
        visible={showResetDbPass}
        loading={isUpdatingPassword}
        onCancel={() => setShowResetDbPass(false)}
      >
        <Modal.Content className="w-full space-y-8">
          <Input
            type="password"
            value={password}
            copy={password.length > 0}
            onChange={onDbPassChange}
            error={passwordStrengthWarning}
            // @ts-ignore
            descriptionText={
              <PasswordStrengthBar
                passwordStrengthScore={passwordStrengthScore as PasswordStrengthScore}
                passwordStrengthMessage={passwordStrengthMessage}
                password={password}
                generateStrongPassword={generatePassword}
              />
            }
          />
        </Modal.Content>
        <Modal.Separator />
        <Modal.Content className="flex items-center justify-end space-x-2">
          <Button
            type="default"
            disabled={isUpdatingPassword}
            onClick={() => setShowResetDbPass(false)}
          >
            {t('actions.cancel')}
          </Button>
          <Button
            type="primary"
            loading={isUpdatingPassword}
            disabled={isUpdatingPassword}
            onClick={() => confirmResetDbPass()}
          >
            {t('settings.database.password.reset_button')}
          </Button>
        </Modal.Content>
      </Modal>
    </>
  )
}

export default ResetDbPassword
