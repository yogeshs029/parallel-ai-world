import React from 'react';
import {
  Globe,
  FolderTree,
  Terminal,
  Server,
  Save,
  SlidersHorizontal,
} from 'lucide-react';
import { PersonCapabilities } from '../../../types/tool';
import { Button } from '../../../components/ui/Button';

export interface PersonCapabilitiesCardProps {
  personName: string;
  capabilities: PersonCapabilities;
  onChange: (updated: PersonCapabilities) => void;
  onSave?: () => void;
  isSaving?: boolean;
  readOnly?: boolean;
}

export const PersonCapabilitiesCard: React.FC<PersonCapabilitiesCardProps> = ({
  personName,
  capabilities,
  onChange,
  onSave,
  isSaving = false,
  readOnly = false,
}) => {
  const toggle = (field: keyof PersonCapabilities) => {
    if (readOnly) return;
    onChange({
      ...capabilities,
      [field]: !capabilities[field],
    });
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-[#0D0E1A] border border-white/[0.08] shadow-2xl space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              What {personName} can do
            </h3>
            <p className="text-xs text-text-muted">
              Configure allowed tools and approval requirements for this agent.
            </p>
          </div>
        </div>

        {onSave && !readOnly && (
          <Button
            variant="primary"
            size="sm"
            onClick={onSave}
            isLoading={isSaving}
            leftIcon={Save}
            className="shadow-purple-glow cursor-pointer text-xs"
          >
            Save Capabilities
          </Button>
        )}
      </div>

      {/* Capabilities Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Web Capabilities */}
        <div className="p-4 rounded-2xl bg-[#141628] border border-white/[0.06] space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold text-white">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>Web & Research</span>
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.03] cursor-pointer transition-colors">
              <span className="text-xs text-white">Search the web for info</span>
              <input
                type="checkbox"
                checked={capabilities.webSearch}
                onChange={() => toggle('webSearch')}
                disabled={readOnly}
                className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.03] cursor-pointer transition-colors">
              <span className="text-xs text-white">Read & extract webpage content</span>
              <input
                type="checkbox"
                checked={capabilities.webFetch}
                onChange={() => toggle('webFetch')}
                disabled={readOnly}
                className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* 2. File Capabilities */}
        <div className="p-4 rounded-2xl bg-[#141628] border border-white/[0.06] space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold text-white">
            <FolderTree className="w-4 h-4 text-amber-400" />
            <span>Files & Workspace</span>
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.03] cursor-pointer transition-colors">
              <span className="text-xs text-white">Read project files</span>
              <input
                type="checkbox"
                checked={capabilities.fileRead}
                onChange={() => toggle('fileRead')}
                disabled={readOnly}
                className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.03] cursor-pointer transition-colors">
              <span className="text-xs text-white">Create & edit project files</span>
              <input
                type="checkbox"
                checked={capabilities.fileWrite}
                onChange={() => toggle('fileWrite')}
                disabled={readOnly}
                className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
              />
            </label>

            {capabilities.fileWrite && (
              <label className="flex items-center gap-2 p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={capabilities.askBeforeFileWrite}
                  onChange={() => toggle('askBeforeFileWrite')}
                  disabled={readOnly}
                  className="w-3.5 h-3.5 accent-purple-600 rounded cursor-pointer"
                />
                <span className="font-semibold">Ask before creating or modifying files</span>
              </label>
            )}
          </div>
        </div>

        {/* 3. Development & Code Capabilities */}
        <div className="p-4 rounded-2xl bg-[#141628] border border-white/[0.06] space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold text-white">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Development & Execution</span>
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.03] cursor-pointer transition-colors">
              <span className="text-xs text-white">Run Python & JS in sandbox</span>
              <input
                type="checkbox"
                checked={capabilities.codeExecute}
                onChange={() => toggle('codeExecute')}
                disabled={readOnly}
                className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.03] cursor-pointer transition-colors">
              <span className="text-xs text-white">Run automated test assertions</span>
              <input
                type="checkbox"
                checked={capabilities.codeTest}
                onChange={() => toggle('codeTest')}
                disabled={readOnly}
                className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
              />
            </label>

            {capabilities.codeExecute && (
              <label className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={capabilities.askBeforeCodeExecute}
                  onChange={() => toggle('askBeforeCodeExecute')}
                  disabled={readOnly}
                  className="w-3.5 h-3.5 accent-purple-600 rounded cursor-pointer"
                />
                <span className="font-semibold">Ask before executing code</span>
              </label>
            )}
          </div>
        </div>

        {/* 4. External Services & Utilities */}
        <div className="p-4 rounded-2xl bg-[#141628] border border-white/[0.06] space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold text-white">
            <Server className="w-4 h-4 text-purple-400" />
            <span>Services & World State</span>
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.03] cursor-pointer transition-colors">
              <span className="text-xs text-white">Connect to external APIs</span>
              <input
                type="checkbox"
                checked={capabilities.httpRequest}
                onChange={() => toggle('httpRequest')}
                disabled={readOnly}
                className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.03] cursor-pointer transition-colors">
              <span className="text-xs text-white">Update world goals & tasks</span>
              <input
                type="checkbox"
                checked={capabilities.worldUpdate}
                onChange={() => toggle('worldUpdate')}
                disabled={readOnly}
                className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
