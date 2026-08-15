import React, { useState, useEffect } from 'react';
import {
  Brain,
  Zap,
  Key,
  Globe,
  Check,
  AlertCircle,
  Cpu,
  Sparkles,
  ShieldCheck,
  Radio,
  Server,
  Laptop,
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../hooks/useToast';
import { conversationService } from '../../../services/conversationService';

export interface LLMConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: () => void;
}

export type LLMProviderType =
  | 'ollama'
  | 'lmstudio'
  | 'groq'
  | 'gemini'
  | 'openrouter'
  | 'openai'
  | 'cloudflare'
  | 'backend';

interface ProviderOption {
  id: LLMProviderType;
  name: string;
  badge: string;
  badgeColor: string;
  defaultModel: string;
  models: string[];
  keyPlaceholder: string;
  keyStorageKey: string;
  docUrl?: string;
  note: string;
  icon: React.FC<{ className?: string }>;
}

const PROVIDERS: ProviderOption[] = [
  {
    id: 'ollama',
    name: 'Local Ollama',
    badge: 'Detected Local GPU/CPU',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    defaultModel: 'mistral:latest',
    models: ['mistral:latest', 'myassistant:latest', 'llama3', 'deepseek-r1', 'phi3', 'qwen2.5'],
    keyPlaceholder: 'http://127.0.0.1:11434',
    keyStorageKey: 'parallel_ollama_endpoint',
    docUrl: 'https://ollama.ai',
    note: 'Active on your computer. Streams real tokens from your local models with 0 API keys.',
    icon: Cpu,
  },
  {
    id: 'lmstudio',
    name: 'LM Studio / Jan',
    badge: 'Local Server',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    defaultModel: 'local-model',
    models: ['local-model', 'default'],
    keyPlaceholder: 'http://localhost:1234/v1',
    keyStorageKey: 'parallel_lmstudio_endpoint',
    docUrl: 'https://lmstudio.ai',
    note: 'Connect to LM Studio Local Server at port 1234 or Jan at 1337.',
    icon: Laptop,
  },
  {
    id: 'groq',
    name: 'Groq (High Speed)',
    badge: 'Ultra Fast',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    defaultModel: 'llama-3.3-70b-versatile',
    models: [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
      'deepseek-r1-distill-llama-70b',
    ],
    keyPlaceholder: 'gsk_...',
    keyStorageKey: 'parallel_groq_key',
    docUrl: 'https://console.groq.com/keys',
    note: 'Free & fast inference with generous rate limits.',
    icon: Zap,
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    badge: 'Google AI',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    defaultModel: 'gemini-1.5-flash',
    models: ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'],
    keyPlaceholder: 'AIzaSy...',
    keyStorageKey: 'parallel_gemini_key',
    docUrl: 'https://aistudio.google.com/app/apikey',
    note: 'Free tier available in Google AI Studio.',
    icon: Brain,
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    badge: '100+ Models',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    defaultModel: 'meta-llama/llama-3.1-8b-instruct:free',
    models: [
      'meta-llama/llama-3.1-8b-instruct:free',
      'mistralai/mistral-7b-instruct:free',
      'deepseek/deepseek-chat',
      'anthropic/claude-3.5-sonnet',
    ],
    keyPlaceholder: 'sk-or-v1-...',
    keyStorageKey: 'parallel_openrouter_key',
    docUrl: 'https://openrouter.ai/keys',
    note: 'Access to free and paid models.',
    icon: Globe,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    badge: 'ChatGPT',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
    keyPlaceholder: 'sk-...',
    keyStorageKey: 'parallel_openai_key',
    docUrl: 'https://platform.openai.com/api-keys',
    note: 'Official OpenAI GPT models.',
    icon: Key,
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare AI',
    badge: 'Serverless Edge',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    defaultModel: '@cf/meta/llama-3.1-8b-instruct',
    models: ['@cf/meta/llama-3.1-8b-instruct', '@cf/meta/llama-3-8b-instruct'],
    keyPlaceholder: 'Cloudflare API Token',
    keyStorageKey: 'parallel_cf_api_token',
    docUrl: 'https://dash.cloudflare.com/profile/api-tokens',
    note: 'Cloudflare Workers AI edge inference.',
    icon: Server,
  },
];

export const LLMConfigModal: React.FC<LLMConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const toast = useToast();

  const [selectedProvider, setSelectedProvider] = useState<LLMProviderType>('ollama');
  const [apiKey, setApiKey] = useState('');
  const [secondaryKey, setSecondaryKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('mistral:latest');
  const [customModelInput, setCustomModelInput] = useState('');
  const [availableOllamaModels, setAvailableOllamaModels] = useState<string[]>(['mistral:latest', 'myassistant:latest']);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);

  const activeProviderConfig = PROVIDERS.find((p) => p.id === selectedProvider) || PROVIDERS[0];

  useEffect(() => {
    if (isOpen) {
      const savedProvider = (localStorage.getItem('parallel_active_llm_provider') as LLMProviderType) || 'ollama';
      setSelectedProvider(savedProvider);
      loadProviderValues(savedProvider);
      setTestResult(null);

      // Auto-query local Ollama models
      conversationService.getLocalOllamaModels().then((models) => {
        if (models && models.length > 0) {
          setAvailableOllamaModels(models);
          const current = localStorage.getItem('parallel_model_ollama');
          if (!current || !models.includes(current)) {
            setSelectedModel(models[0]);
          }
        }
      });
    }
  }, [isOpen]);

  const loadProviderValues = (provId: LLMProviderType) => {
    const prov = PROVIDERS.find((p) => p.id === provId) || PROVIDERS[0];
    const key = localStorage.getItem(prov.keyStorageKey) || '';
    setApiKey(key);

    if (provId === 'cloudflare') {
      setSecondaryKey(localStorage.getItem('parallel_cf_account_id') || '');
    } else if (provId === 'ollama') {
      setSecondaryKey(localStorage.getItem('parallel_ollama_endpoint') || 'http://127.0.0.1:11434');
    } else if (provId === 'lmstudio') {
      setSecondaryKey(localStorage.getItem('parallel_lmstudio_endpoint') || 'http://localhost:1234/v1');
    } else {
      setSecondaryKey('');
    }

    const savedModel = localStorage.getItem(`parallel_model_${provId}`) || prov.defaultModel;
    setSelectedModel(savedModel);
  };

  const handleProviderChange = (provId: LLMProviderType) => {
    setSelectedProvider(provId);
    loadProviderValues(provId);
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const startTime = Date.now();

    try {
      const modelToUse = customModelInput.trim() || selectedModel;
      const res = await conversationService.testProviderConnection(
        selectedProvider,
        apiKey.trim(),
        secondaryKey.trim(),
        modelToUse,
      );

      const latencyMs = Date.now() - startTime;
      if (res.success) {
        setTestResult({
          success: true,
          message: `Connected successfully! Response in ${latencyMs}ms.`,
          latencyMs,
        });
        toast.success('LLM Connected', `Verified ${activeProviderConfig.name}`);
      } else {
        setTestResult({
          success: false,
          message: res.error || 'Connection test failed. Please check endpoint or key.',
        });
        toast.error('Connection Failed', res.error || 'Please check your settings');
      }
    } catch (e: unknown) {
      setTestResult({
        success: false,
        message: e instanceof Error ? e.message : 'Connection test failed.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    const modelToUse = customModelInput.trim() || selectedModel;

    localStorage.setItem('parallel_active_llm_provider', selectedProvider);
    localStorage.setItem(activeProviderConfig.keyStorageKey, apiKey.trim());
    localStorage.setItem(`parallel_model_${selectedProvider}`, modelToUse);
    localStorage.setItem('parallel_llm_model', modelToUse);

    if (selectedProvider === 'cloudflare') {
      localStorage.setItem('parallel_cf_account_id', secondaryKey.trim());
    } else if (selectedProvider === 'ollama') {
      localStorage.setItem('parallel_ollama_endpoint', secondaryKey.trim() || 'http://127.0.0.1:11434');
    } else if (selectedProvider === 'lmstudio') {
      localStorage.setItem('parallel_lmstudio_endpoint', secondaryKey.trim() || 'http://localhost:1234/v1');
    }

    toast.success('LLM Connected', `Active Provider: ${activeProviderConfig.name} (${modelToUse})`);
    if (onConfigSaved) onConfigSaved();
    onClose();
  };

  const currentModels =
    selectedProvider === 'ollama' && availableOllamaModels.length > 0
      ? availableOllamaModels
      : activeProviderConfig.models;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Connect AI Intelligence (LLM)"
      description="Connect to your local Ollama instance or your preferred cloud AI provider."
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            isLoading={isTesting}
            leftIcon={Radio}
            className="cursor-pointer text-xs"
          >
            Test Connection
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              leftIcon={Check}
              className="shadow-purple-glow cursor-pointer"
            >
              Save & Connect
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 font-sans">
        {/* Provider Selection Chips */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-white flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-purple-400" />
            Select LLM Provider
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PROVIDERS.map((prov) => {
              const isSelected = selectedProvider === prov.id;
              const Icon = prov.icon;
              return (
                <button
                  type="button"
                  key={prov.id}
                  onClick={() => handleProviderChange(prov.id)}
                  className={`p-2.5 sm:p-3 rounded-2xl text-left border transition-all cursor-pointer space-y-1 ${
                    isSelected
                      ? 'bg-purple-600/20 border-purple-500 shadow-purple-glow ring-1 ring-purple-500/50'
                      : 'bg-[#141628] border-white/[0.08] hover:border-white/[0.16] hover:bg-[#181A30]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className="w-4 h-4 text-purple-300 shrink-0" />
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold border ${prov.badgeColor}`}>
                      {prov.badge.split(' ')[0]}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-white truncate">{prov.name}</div>
                  <p className="text-[10px] text-text-muted line-clamp-1">{prov.note}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Provider Info Card */}
        <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              {activeProviderConfig.name}
            </span>
            {activeProviderConfig.docUrl && (
              <a
                href={activeProviderConfig.docUrl}
                target="_blank"
                rel="noreferrer"
                className="text-purple-300 hover:underline text-[11px] font-semibold flex items-center gap-1"
              >
                Documentation ↗
              </a>
            )}
          </div>
          <p className="text-[11px] text-text-secondary">{activeProviderConfig.note}</p>
        </div>

        {/* Ollama Setup Notice */}
        {selectedProvider === 'ollama' && (
          <div className="space-y-2">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Local Ollama Detected
              </div>
              <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                Found {availableOllamaModels.length} models installed on your machine ({availableOllamaModels.join(', ')}). All chat will be processed locally on your GPU/CPU with 100% privacy and zero rate limits.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-amber-400" />
                Ollama Local Server URL
              </label>
              <input
                type="text"
                placeholder="http://127.0.0.1:11434"
                value={secondaryKey}
                onChange={(e) => setSecondaryKey(e.target.value)}
                className="w-full bg-[#141628] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-purple-500/50 font-mono"
              />
            </div>
          </div>
        )}

        {/* LM Studio Setup Notice */}
        {selectedProvider === 'lmstudio' && (
          <div className="space-y-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-cyan-400" />
                LM Studio / LocalAI Server URL
              </label>
              <input
                type="text"
                placeholder="http://localhost:1234/v1"
                value={secondaryKey}
                onChange={(e) => setSecondaryKey(e.target.value)}
                className="w-full bg-[#141628] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-purple-500/50 font-mono"
              />
            </div>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-200">
              💡 In LM Studio, click the <strong>Local Server</strong> icon on the left sidebar and click <strong>Start Server</strong>.
            </div>
          </div>
        )}

        {/* API Key Input for Cloud Providers */}
        {selectedProvider !== 'ollama' && selectedProvider !== 'lmstudio' && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-purple-400" />
                API Key
              </span>
              <span className="text-[10px] text-text-muted">Stored locally in your browser</span>
            </label>
            <input
              type="password"
              placeholder={activeProviderConfig.keyPlaceholder}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-[#141628] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-purple-500/50 font-mono"
            />
          </div>
        )}

        {/* Cloudflare Account ID */}
        {selectedProvider === 'cloudflare' && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              Cloudflare Account ID
            </label>
            <input
              type="text"
              placeholder="e.g. 8f2a1b3c4d5e6f7a8b9c0d1e2f3a4b5c"
              value={secondaryKey}
              onChange={(e) => setSecondaryKey(e.target.value)}
              className="w-full bg-[#141628] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-purple-500/50 font-mono"
            />
          </div>
        )}

        {/* Model Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Model Selection {selectedProvider === 'ollama' ? '(Installed in Ollama)' : ''}
          </label>

          <div className="flex flex-wrap gap-1.5">
            {currentModels.map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => {
                  setSelectedModel(m);
                  setCustomModelInput('');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedModel === m && !customModelInput
                    ? 'bg-purple-600 text-white shadow-purple-glow'
                    : 'bg-[#141628] border border-white/[0.08] text-text-secondary hover:text-white hover:bg-[#181A30]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="pt-1">
            <input
              type="text"
              placeholder="Or enter custom model name..."
              value={customModelInput}
              onChange={(e) => setCustomModelInput(e.target.value)}
              className="w-full bg-[#141628] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-purple-500/50 font-mono"
            />
          </div>
        </div>

        {/* Test Result Banner */}
        {testResult && (
          <div
            className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs ${
              testResult.success
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}
          >
            {testResult.success ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <span className="font-bold">{testResult.success ? 'Success' : 'Connection Failed'}</span>
              <p className="text-[11px] leading-relaxed opacity-90">{testResult.message}</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default LLMConfigModal;
