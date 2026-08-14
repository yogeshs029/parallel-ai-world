import React, { useState, useEffect } from 'react';
import { Cpu, Flame, Globe, Key, Shield, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

export const GeneralSettings: React.FC = () => {
  const [userName, setUserName] = useState('Alex');
  const [email, setEmail] = useState('alex@example.com');
  const [defaultWorld, setDefaultWorld] = useState('world-company');

  // Cloudflare & Multi-Device AI Settings
  const [customApiUrl, setCustomApiUrl] = useState('');
  const [cfApiToken, setCfApiToken] = useState('');
  const [cfAccountId, setCfAccountId] = useState('');
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [preferredModel, setPreferredModel] = useState('@cf/meta/llama-3.1-8b-instruct');
  const [globalExplicitMode, setGlobalExplicitMode] = useState(true);

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    try {
      setCustomApiUrl(localStorage.getItem('parallel_custom_api_url') || '');
      setCfApiToken(localStorage.getItem('parallel_cf_api_token') || '');
      setCfAccountId(localStorage.getItem('parallel_cf_account_id') || '');
      setOpenrouterKey(localStorage.getItem('parallel_openrouter_key') || '');
      setGroqKey(localStorage.getItem('parallel_groq_key') || '');
      setPreferredModel(localStorage.getItem('parallel_llm_model') || '@cf/meta/llama-3.1-8b-instruct');
      const exp = localStorage.getItem('parallel_global_explicit_mode');
      setGlobalExplicitMode(exp !== null ? exp === 'true' : true);
    } catch {}
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('parallel_custom_api_url', customApiUrl.trim());
      localStorage.setItem('parallel_cf_api_token', cfApiToken.trim());
      localStorage.setItem('parallel_cf_account_id', cfAccountId.trim());
      localStorage.setItem('parallel_openrouter_key', openrouterKey.trim());
      localStorage.setItem('parallel_groq_key', groqKey.trim());
      localStorage.setItem('parallel_llm_model', preferredModel);
      localStorage.setItem('parallel_global_explicit_mode', String(globalExplicitMode));
    } catch {}

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={handleSave}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <Sparkles className="w-4 h-4 text-brand-purple-light" />
              Profile & Preferences
            </CardTitle>
            <CardDescription>
              Manage your personal profile and default world configuration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Your Name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">Default Opening World</label>
              <select
                value={defaultWorld}
                onChange={(e) => setDefaultWorld(e.target.value)}
                className="w-full bg-background-elevated text-text-primary text-xs rounded-xl border border-border px-3.5 py-2.5 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple font-sans"
              >
                <option value="world-company">🏢 My Company</option>
                <option value="world-home">🏠 My Home</option>
                <option value="world-study">📚 My Study World</option>
                <option value="world-story">🎮 Elysium Chronicles</option>
                <option value="world-romance">💖 Romantic World</option>
              </select>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <span className="text-xs text-brand-emerald font-medium">
              {isSaved && '✓ Preferences saved successfully'}
            </span>
            <Button variant="primary" size="sm" type="submit">
              Save Preferences
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Cloudflare & Multi-Device AI Engine Config */}
      <Card>
        <form onSubmit={handleSave}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-bold text-brand-cyan">
              <Cpu className="w-4 h-4 text-brand-cyan" />
              Cloudflare AI & Multi-Device LLM Settings
            </CardTitle>
            <CardDescription>
              Configure Cloudflare Workers AI cloud inference and network endpoints for access from all devices.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-brand-purple-light" />
                Custom Worker API Base URL (Optional for Remote Devices)
              </label>
              <Input
                placeholder="e.g. https://parallel-ai-world.user.workers.dev or relative /api"
                value={customApiUrl}
                onChange={(e) => setCustomApiUrl(e.target.value)}
              />
              <p className="text-[11px] text-text-muted">
                Leave empty for relative <code>/api</code>. Set your deployed Cloudflare Worker URL when running from phones or remote devices.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-brand-amber" />
                  Cloudflare API Token (Optional Fallback)
                </label>
                <Input
                  type="password"
                  placeholder="Cloudflare Workers AI API Token"
                  value={cfApiToken}
                  onChange={(e) => setCfApiToken(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary">Cloudflare Account ID</label>
                <Input
                  placeholder="Cloudflare Account ID"
                  value={cfAccountId}
                  onChange={(e) => setCfAccountId(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary">OpenRouter API Key (Alternative)</label>
                <Input
                  type="password"
                  placeholder="sk-or-v1-..."
                  value={openrouterKey}
                  onChange={(e) => setOpenrouterKey(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary">Groq API Key (Alternative)</label>
                <Input
                  type="password"
                  placeholder="gsk_..."
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col space-y-1.5 pt-1">
              <label className="text-xs font-bold text-text-primary">Cloudflare AI Model</label>
              <select
                value={preferredModel}
                onChange={(e) => setPreferredModel(e.target.value)}
                className="w-full bg-background-elevated text-text-primary text-xs rounded-xl border border-border px-3.5 py-2.5 focus:outline-none focus:border-brand-purple"
              >
                <option value="@cf/meta/llama-3.1-8b-instruct">⚡ Llama 3.1 8B Instruct (Fast & Balanced)</option>
                <option value="@cf/meta/llama-3.3-70b-instruct-fp8-fast">🧠 Llama 3.3 70B Instruct (High Reasoning)</option>
                <option value="@cf/deepseek-ai/deepseek-r1-distill-qwen-32b">🔬 DeepSeek R1 Qwen 32B (Deep Reasoning)</option>
                <option value="@cf/mistral/mistral-7b-instruct-v0.2">✨ Mistral 7B Instruct v0.2 (Creative & Expressive)</option>
              </select>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <span className="text-xs text-brand-emerald font-medium">
              {isSaved && '✓ Cloudflare AI parameters saved'}
            </span>
            <Button variant="primary" size="sm" type="submit">
              Save AI Settings
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Explicit Content & Romantic Settings */}
      <Card className="border-brand-rose/40">
        <form onSubmit={handleSave}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-bold text-brand-rose">
              <Flame className="w-4 h-4 text-brand-rose" />
              Romantic & Explicit Conversation Settings
            </CardTitle>
            <CardDescription>
              Configure Girlfriend/Boyfriend intimacy levels and explicit content permissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-brand-rose/10 border border-brand-rose/30">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-brand-rose" />
                  Enable Explicit & Intimate Mode
                </div>
                <div className="text-[11px] text-text-secondary">
                  Allows Girlfriend, Boyfriend, and Romantic companions to engage in uncensored, explicit, passionate conversations.
                </div>
              </div>
              <input
                type="checkbox"
                checked={globalExplicitMode}
                onChange={(e) => setGlobalExplicitMode(e.target.checked)}
                className="w-5 h-5 accent-brand-rose rounded cursor-pointer"
              />
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <span className="text-xs text-brand-emerald font-medium">
              {isSaved && '✓ Romantic settings saved'}
            </span>
            <Button variant="primary" size="sm" type="submit">
              Save Mode
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
