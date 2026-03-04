import { Check, ChevronsUpDown, Plus, Trash2, Settings } from 'lucide-react'
import { useState, useMemo, ChangeEvent, MouseEvent } from 'react'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useRouter } from 'next/router'
import {
  Badge,
  Button,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  TooltipContent,
  TooltipTrigger,
  Tooltip,
  Separator,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Input_Shadcn_,
  Label_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  Switch,
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
} from 'ui'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { type Model, getAllModels, getCustomModels, saveCustomModel, deleteCustomModel, type CustomModelConfig, type ProviderName } from 'lib/ai/model.utils'

interface ModelSelectorProps {
  selectedModel: Model
  onSelectModel: (model: Model) => void
}

export const ModelSelector = ({ selectedModel, onSelectModel }: ModelSelectorProps) => {
  const router = useRouter()
  const { data: organization } = useSelectedOrganizationQuery()
  const { hasAccess: hasAccessToAdvanceModel, isLoading: isLoadingEntitlements } =
    useCheckEntitlements('assistant.advance_model')

  const [open, setOpen] = useState(false)

  const slug = organization?.slug ?? '_'

  const upgradeHref = `/org/${slug ?? '_'}/billing?panel=subscriptionPlan&source=ai-assistant-model`

  // State for custom model management
  const [showAddModelDialog, setShowAddModelDialog] = useState(false)
  const [editingModel, setEditingModel] = useState<CustomModelConfig | null>(null)
  const [customModelForm, setCustomModelForm] = useState({
    id: '',
    name: '',
    provider: 'custom' as ProviderName,
    endpoint: '',
    apiKey: '',
    temperature: 0.7,
    maxTokens: 2048,
    isDefault: false,
  })

  // Get all available models (predefined + custom)
  const allModels = useMemo(() => {
    return getAllModels()
  }, [])

  const handleSelectModel = (model: Model) => {
    // TODO: Check if model requires upgrade (currently only checks for gpt-5)
    // This should be expanded to check entitlements for different models
    if (model === 'gpt-5' && !hasAccessToAdvanceModel) {
      setOpen(false)
      void router.push(upgradeHref)
      return
    }

    onSelectModel(model)
    setOpen(false)
  }

  const handleSaveCustomModel = () => {
    const modelConfig: Omit<CustomModelConfig, 'createdAt' | 'updatedAt'> = {
      id: customModelForm.id || customModelForm.name.toLowerCase().replace(/\s+/g, '-'),
      name: customModelForm.name,
      provider: customModelForm.provider,
      endpoint: customModelForm.endpoint || undefined,
      apiKey: customModelForm.apiKey || undefined,
      config: {
        temperature: customModelForm.temperature,
        maxTokens: customModelForm.maxTokens,
      },
      isDefault: customModelForm.isDefault,
    }

    saveCustomModel(modelConfig)
    setShowAddModelDialog(false)
    setCustomModelForm({
      id: '',
      name: '',
      provider: 'custom',
      endpoint: '',
      apiKey: '',
      temperature: 0.7,
      maxTokens: 2048,
      isDefault: false,
    })
    setEditingModel(null)
  }

  const handleDeleteCustomModel = (modelId: string) => {
    if (confirm('Are you sure you want to delete this custom model?')) {
      deleteCustomModel(modelId)
      // If the deleted model was selected, switch to a default model
      if (selectedModel === modelId) {
        const defaultModel = allModels.find(m => m.isDefault && !m.isCustom)
        if (defaultModel) {
          onSelectModel(defaultModel.id)
        }
      }
    }
  }

  const handleEditCustomModel = (model: CustomModelConfig) => {
    setEditingModel(model)
    setCustomModelForm({
      id: model.id,
      name: model.name,
      provider: model.provider,
      endpoint: model.endpoint || '',
      apiKey: model.apiKey || '',
      temperature: model.config.temperature || 0.7,
      maxTokens: model.config.maxTokens || 2048,
      isDefault: model.isDefault,
    })
    setShowAddModelDialog(true)
  }

  const handleAddCustomModel = () => {
    setEditingModel(null)
    setCustomModelForm({
      id: '',
      name: '',
      provider: 'custom',
      endpoint: '',
      apiKey: '',
      temperature: 0.7,
      maxTokens: 2048,
      isDefault: false,
    })
    setShowAddModelDialog(true)
    setOpen(false)
  }

  // Group models by provider
  const predefinedModels = allModels.filter(m => !m.isCustom)
  const customModels = allModels.filter(m => m.isCustom)

  return (
    <>
      <Popover_Shadcn_ open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          type="default"
          className="text-foreground-light"
          iconRight={<ChevronsUpDown strokeWidth={1} size={12} />}
        >
          {selectedModel}
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0 w-60" align="start" side="top">
        <Command_Shadcn_>
          <CommandList_Shadcn_>
            {/* Predefined models */}
            <CommandGroup_Shadcn_ heading="Predefined Models">
              {predefinedModels.map((model) => (
                <CommandItem_Shadcn_
                  key={model.id}
                  value={model.id}
                  onSelect={() => handleSelectModel(model.id)}
                  className="flex justify-between"
                >
                  <div className="flex flex-col">
                    <span>{model.id}</span>
                    <span className="text-xs text-foreground-muted">{model.provider}</span>
                  </div>
                  {selectedModel === model.id && <Check className="h-3.5 w-3.5" />}
                </CommandItem_Shadcn_>
              ))}
            </CommandGroup_Shadcn_>

            {/* Custom models */}
            {customModels.length > 0 && (
              <>
                <Separator />
                <CommandGroup_Shadcn_ heading="Custom Models">
                  {customModels.map((model) => (
                    <CommandItem_Shadcn_
                      key={model.id}
                      value={model.id}
                      onSelect={() => handleSelectModel(model.id)}
                      className="flex justify-between group"
                    >
                      <div className="flex flex-col">
                        <span>{model.config?.name || model.id}</span>
                        <span className="text-xs text-foreground-muted">
                          {model.provider} • Custom
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          type="text"
                          size="tiny"
                          icon={<Settings size={12} />}
                          onClick={(e: MouseEvent) => {
                            e.stopPropagation()
                            if (model.config) {
                              handleEditCustomModel(model.config)
                            }
                          }}
                          className="h-5 w-5 p-0"
                        />
                        <Button
                          type="text"
                          size="tiny"
                          icon={<Trash2 size={12} />}
                          onClick={(e: MouseEvent) => {
                            e.stopPropagation()
                            handleDeleteCustomModel(model.id)
                          }}
                          className="h-5 w-5 p-0 text-red-500"
                        />
                        {selectedModel === model.id && <Check className="h-3.5 w-3.5 ml-1" />}
                      </div>
                    </CommandItem_Shadcn_>
                  ))}
                </CommandGroup_Shadcn_>
              </>
            )}

            {/* Add custom model button */}
            <Separator />
            <CommandGroup_Shadcn_>
              <CommandItem_Shadcn_
                value="add-custom-model"
                onSelect={handleAddCustomModel}
                className="flex items-center justify-center text-foreground-muted hover:text-foreground"
              >
                <Plus size={14} className="mr-2" />
                Add Custom Model
              </CommandItem_Shadcn_>
            </CommandGroup_Shadcn_>
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>

    {/* Custom Model Management Dialog */}
    <Dialog open={showAddModelDialog} onOpenChange={setShowAddModelDialog}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingModel ? 'Edit Custom Model' : 'Add Custom Model'}</DialogTitle>
          <DialogDescription>
            Configure a custom AI model for use in the AI Assistant.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label_Shadcn_ htmlFor="model-name">Model Name *</Label_Shadcn_>
            <Input_Shadcn_
              id="model-name"
              placeholder="My Custom Model"
              value={customModelForm.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomModelForm({ ...customModelForm, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label_Shadcn_ htmlFor="model-id">Model ID (Optional)</Label_Shadcn_>
            <Input_Shadcn_
              id="model-id"
              placeholder="my-custom-model"
              value={customModelForm.id}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomModelForm({ ...customModelForm, id: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label_Shadcn_ htmlFor="model-provider">Provider *</Label_Shadcn_>
            <Select_Shadcn_
              value={customModelForm.provider}
              onValueChange={(value: ProviderName) =>
                setCustomModelForm({ ...customModelForm, provider: value })
              }
            >
              <SelectTrigger_Shadcn_>
                <SelectValue_Shadcn_ placeholder="Select provider" />
              </SelectTrigger_Shadcn_>
              <SelectContent_Shadcn_>
                <SelectItem_Shadcn_ value="custom">Custom API</SelectItem_Shadcn_>
                <SelectItem_Shadcn_ value="openai">OpenAI</SelectItem_Shadcn_>
                <SelectItem_Shadcn_ value="anthropic">Anthropic</SelectItem_Shadcn_>
                <SelectItem_Shadcn_ value="bedrock">Amazon Bedrock</SelectItem_Shadcn_>
              </SelectContent_Shadcn_>
            </Select_Shadcn_>
          </div>

          {customModelForm.provider === 'custom' && (
            <>
              <div className="space-y-2">
                <Label_Shadcn_ htmlFor="model-endpoint">API Endpoint *</Label_Shadcn_>
                <Input_Shadcn_
                  id="model-endpoint"
                  placeholder="https://api.example.com/v1/chat/completions"
                  value={customModelForm.endpoint}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomModelForm({ ...customModelForm, endpoint: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label_Shadcn_ htmlFor="model-apikey">API Key (Optional)</Label_Shadcn_>
                <Input_Shadcn_
                  id="model-apikey"
                  type="password"
                  placeholder="sk-..."
                  value={customModelForm.apiKey}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomModelForm({ ...customModelForm, apiKey: e.target.value })}
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label_Shadcn_ htmlFor="model-temperature">Temperature</Label_Shadcn_>
              <Input_Shadcn_
                id="model-temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={customModelForm.temperature}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setCustomModelForm({ ...customModelForm, temperature: parseFloat(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label_Shadcn_ htmlFor="model-maxTokens">Max Tokens</Label_Shadcn_>
              <Input_Shadcn_
                id="model-maxTokens"
                type="number"
                min="1"
                max="100000"
                value={customModelForm.maxTokens}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setCustomModelForm({ ...customModelForm, maxTokens: parseInt(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="model-default"
              checked={customModelForm.isDefault}
              onCheckedChange={(checked) =>
                setCustomModelForm({ ...customModelForm, isDefault: checked })
              }
            />
            <Label_Shadcn_ htmlFor="model-default">Set as default model for this provider</Label_Shadcn_>
          </div>

          {customModelForm.provider === 'custom' && (
            <Alert_Shadcn_ variant="warning">
              <AlertDescription_Shadcn_>
                Custom models require an OpenAI-compatible API endpoint. Ensure your endpoint supports the same request/response format as OpenAI's Chat Completions API.
              </AlertDescription_Shadcn_>
            </Alert_Shadcn_>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="default" onClick={() => setShowAddModelDialog(false)}>
            Cancel
          </Button>
          <Button type="primary" onClick={handleSaveCustomModel}>
            {editingModel ? 'Update Model' : 'Add Model'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
