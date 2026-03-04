import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Lock, Mail } from 'lucide-react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'
import { useTranslation } from 'react-i18next'

import { useParams } from 'common'
import { useUserCreateMutation } from 'data/auth/user-create-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  Button,
  Checkbox_Shadcn_,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogSectionSeparator,
  DialogTitle,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
} from 'ui'

export type CreateUserModalProps = {
  visible: boolean
  setVisible: (visible: boolean) => void
}



const CreateUserModal = ({ visible, setVisible }: CreateUserModalProps) => {
  const { t } = useTranslation()
  const { ref: projectRef } = useParams()
  const { can: canCreateUsers } = useAsyncCheckPermissions(
    PermissionAction.AUTH_EXECUTE,
    'create_user'
  )

  const { mutate: createUser, isPending: isCreatingUser } = useUserCreateMutation({
    onSuccess(res) {
      toast.success(t('user_created_successfully') + ': ' + res.email)
      form.reset({ email: '', password: '', autoConfirmUser: true })
      setVisible(false)
    },
  })

  const CreateUserFormSchema = z.object({
    email: z.string().min(1, t('email_required')).email(t('must_be_valid_email')),
    password: z.string().min(1, t('password_required')),
    autoConfirmUser: z.boolean(),
  })

  const onCreateUser: SubmitHandler<z.infer<typeof CreateUserFormSchema>> = async (values) => {
    if (!projectRef) return console.error('Project ref is required')
    createUser({ projectRef, user: values })
  }

  const form = useForm<z.infer<typeof CreateUserFormSchema>>({
    resolver: zodResolver(CreateUserFormSchema),
    defaultValues: { email: '', password: '', autoConfirmUser: true },
  })

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogContent size="small">
        <DialogHeader>
          <DialogTitle>Create a new user</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <Form_Shadcn_ {...form}>
          <form
            id="create-user"
            className="flex flex-col gap-y-4 p-6"
            onSubmit={form.handleSubmit(onCreateUser)}
          >
            <FormField_Shadcn_
              name="email"
              control={form.control}
              render={({ field }: { field: any }) => (
                <FormItem_Shadcn_ className="flex flex-col gap-1">
                  <FormLabel_Shadcn_>{t('email_address')}</FormLabel_Shadcn_>
                  <FormControl_Shadcn_>
                    <div className="items-center relative">
                      <Mail
                        size={18}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2"
                        strokeWidth={1.5}
                      />
                      <Input_Shadcn_
                        autoFocus
                        {...field}
                        autoComplete="off"
                        type="email"
                        name="email"
                        placeholder="user@example.com"
                        disabled={isCreatingUser}
                        className="pl-8"
                      />
                    </div>
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />

            <FormField_Shadcn_
              name="password"
              control={form.control}
              render={({ field }: { field: any }) => (
                <FormItem_Shadcn_ className="flex flex-col gap-1">
                  <FormLabel_Shadcn_>{t('user_password')}</FormLabel_Shadcn_>
                  <FormControl_Shadcn_>
                    <div className="items-center relative">
                      <Lock
                        size={18}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2"
                        strokeWidth={1.5}
                      />
                      <Input_Shadcn_
                        {...field}
                        autoComplete="new-password"
                        type="password"
                        name="password"
                        placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                        disabled={isCreatingUser}
                        className="pl-8"
                      />
                    </div>
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />

            <FormField_Shadcn_
              name="autoConfirmUser"
              control={form.control}
              render={({ field }: { field: any }) => (
                <FormItem_Shadcn_ className="flex items-center gap-x-2">
                  <FormControl_Shadcn_>
                    <Checkbox_Shadcn_
                      checked={field.value}
                      onCheckedChange={(value: boolean) => field.onChange(value)}
                    />
                  </FormControl_Shadcn_>
                  <FormLabel_Shadcn_>{t('auto_confirm_user')}</FormLabel_Shadcn_>
                </FormItem_Shadcn_>
              )}
            />

            <FormLabel_Shadcn_>
              <p className="text-sm text-foreground-lighter">
                {t('no_confirmation_email')}
              </p>
            </FormLabel_Shadcn_>

            <Button
              block
              size="small"
              htmlType="submit"
              loading={isCreatingUser}
              disabled={!canCreateUsers || isCreatingUser}
            >
              {t('create_user')}
            </Button>
          </form>
        </Form_Shadcn_>
      </DialogContent>
    </Dialog>
  )
}

export default CreateUserModal
