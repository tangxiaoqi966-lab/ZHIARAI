export type ProviderName = 'bedrock' | 'openai' | 'anthropic' | 'custom'

export type BedrockModel = 'anthropic.claude-3-7-sonnet-20250219-v1:0' | 'openai.gpt-oss-120b-1:0'

export type OpenAIModel = 'gpt-5' | 'gpt-5-mini'

export type AnthropicModel = 'claude-sonnet-4-20250514' | 'claude-3-5-haiku-20241022'

export type CustomModel = string // Custom model IDs are user-defined strings

export type Model = BedrockModel | OpenAIModel | AnthropicModel | CustomModel

export type ProviderModelConfig = {
  /** Optional providerOptions to attach to the system message for this model */
  promptProviderOptions?: Record<string, any>
  /** The default model for this provider (used when limited or no preferred specified) */
  default: boolean
}

export type ProviderRegistry = {
  bedrock: {
    models: Record<BedrockModel, ProviderModelConfig>
    providerOptions?: Record<string, any>
  }
  openai: {
    models: Record<OpenAIModel, ProviderModelConfig>
    providerOptions?: Record<string, any>
  }
  anthropic: {
    models: Record<AnthropicModel, ProviderModelConfig>
    providerOptions?: Record<string, any>
  },
  custom?: {
    models: Record<CustomModel, ProviderModelConfig>
    providerOptions?: Record<string, any>
  }
}

// Custom model configuration for user-defined models
export interface CustomModelConfig {
  /** Unique identifier for the custom model */
  id: string
  /** Display name for the model */
  name: string
  /** Provider type (custom or one of the existing providers) */
  provider: ProviderName
  /** API endpoint URL (required for custom provider) */
  endpoint?: string
  /** API key (optional, stored encrypted) */
  apiKey?: string
  /** Model configuration options */
  config: {
    /** Temperature parameter (0-2) */
    temperature?: number
    /** Maximum tokens to generate */
    maxTokens?: number
    /** Top-p sampling parameter */
    topP?: number
    /** Other provider-specific options */
    [key: string]: any
  }
  /** Whether this model is the default for its provider */
  isDefault: boolean
  /** Creation timestamp */
  createdAt: string
  /** Last updated timestamp */
  updatedAt: string
}

// Local storage key for custom models
export const CUSTOM_MODELS_STORAGE_KEY = 'supabase_ai_custom_models'

export const PROVIDERS: ProviderRegistry = {
  bedrock: {
    models: {
      'anthropic.claude-3-7-sonnet-20250219-v1:0': {
        promptProviderOptions: {
          bedrock: {
            // Always cache the system prompt (must not contain dynamic content)
            cachePoint: { type: 'default' },
          },
        },
        default: false,
      },
      'openai.gpt-oss-120b-1:0': {
        default: true,
      },
    },
  },
  openai: {
    models: {
      'gpt-5': { default: false },
      'gpt-5-mini': { default: true },
    },
    providerOptions: {
      openai: {
        reasoningEffort: 'minimal',
      },
    },
  },
  anthropic: {
    models: {
      'claude-sonnet-4-20250514': { default: false },
      'claude-3-5-haiku-20241022': { default: true },
    },
  },
  custom: {
    models: {},
  },
}

export function getDefaultModelForProvider(provider: ProviderName): Model | undefined {
  const models = PROVIDERS[provider]?.models as Record<Model, ProviderModelConfig>
  if (!models) return undefined

  return Object.keys(models).find((id) => models[id as Model]?.default) as Model | undefined
}

// Custom model management functions
export function getCustomModels(): CustomModelConfig[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = window.localStorage.getItem(CUSTOM_MODELS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Failed to load custom models:', error)
    return []
  }
}

export function saveCustomModel(model: Omit<CustomModelConfig, 'createdAt' | 'updatedAt'>): CustomModelConfig {
  const customModels = getCustomModels()
  const now = new Date().toISOString()
  const existingIndex = customModels.findIndex(m => m.id === model.id)
  
  const modelToSave: CustomModelConfig = {
    ...model,
    createdAt: existingIndex >= 0 ? customModels[existingIndex].createdAt : now,
    updatedAt: now
  }
  
  const updatedModels = existingIndex >= 0 
    ? [...customModels.slice(0, existingIndex), modelToSave, ...customModels.slice(existingIndex + 1)]
    : [...customModels, modelToSave]
  
  window.localStorage.setItem(CUSTOM_MODELS_STORAGE_KEY, JSON.stringify(updatedModels))
  return modelToSave
}

export function deleteCustomModel(modelId: string): boolean {
  const customModels = getCustomModels()
  const updatedModels = customModels.filter(m => m.id !== modelId)
  
  if (updatedModels.length !== customModels.length) {
    window.localStorage.setItem(CUSTOM_MODELS_STORAGE_KEY, JSON.stringify(updatedModels))
    return true
  }
  
  return false
}

export function getAllModels(): Array<{
  id: Model
  provider: ProviderName
  isDefault: boolean
  isCustom: boolean
  config?: CustomModelConfig
}> {
  const customModels = getCustomModels()
  const allModels: Array<{
    id: Model
    provider: ProviderName
    isDefault: boolean
    isCustom: boolean
    config?: CustomModelConfig
  }> = []
  
  // Add predefined models
  Object.entries(PROVIDERS).forEach(([providerName, provider]) => {
    const providerKey = providerName as ProviderName
    if (provider.models) {
      Object.entries(provider.models).forEach(([modelId, config]) => {
        allModels.push({
          id: modelId as Model,
          provider: providerKey,
          isDefault: config.default,
          isCustom: false
        })
      })
    }
  })
  
  // Add custom models
  customModels.forEach(customModel => {
    allModels.push({
      id: customModel.id as Model,
      provider: customModel.provider,
      isDefault: customModel.isDefault,
      isCustom: true,
      config: customModel
    })
  })
  
  return allModels
}

export function getModelProvider(modelId: Model): ProviderName | undefined {
  // Check predefined models first
  for (const [providerName, provider] of Object.entries(PROVIDERS)) {
    if (provider.models && modelId in provider.models) {
      return providerName as ProviderName
    }
  }
  
  // Check custom models
  const customModels = getCustomModels()
  const customModel = customModels.find(m => m.id === modelId)
  if (customModel) {
    return customModel.provider
  }
  
  return undefined
}

export function getMergedProviders(): ProviderRegistry & { custom?: { models: Record<string, ProviderModelConfig> } } {
  const customModels = getCustomModels()
  const customModelsRecord: Record<string, ProviderModelConfig> = {}
  
  customModels.forEach(model => {
    customModelsRecord[model.id] = {
      promptProviderOptions: model.provider === 'custom' ? { 
        custom: { endpoint: model.endpoint, apiKey: model.apiKey, ...model.config }
      } : undefined,
      default: model.isDefault
    }
  })
  
  return {
    ...PROVIDERS,
    custom: customModels.length > 0 ? {
      models: customModelsRecord,
      providerOptions: {}
    } : undefined
  }
}
