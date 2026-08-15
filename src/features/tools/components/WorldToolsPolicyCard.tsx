import React from 'react';
import {
  ShieldCheck,
  Globe,
  FolderTree,
  Terminal,
  Server,
  Save,
} from 'lucide-react';
import { WorldToolPolicy } from '../../../types/tool';
import { Button } from '../../../components/ui/Button';

export interface WorldToolsPolicyCardProps {
  policy: WorldToolPolicy;
  onChange: (updated: WorldToolPolicy) => void;
  onSave?: () => void;
  isSaving?: boolean;
}

export const WorldToolsPolicyCard: React.FC<WorldToolsPolicyCardProps> = ({
  policy,
  onChange,
  onSave,
  isSaving = false,
}) => {
  const toggle = (field: keyof WorldToolPolicy) => {
    onChange({
      ...policy,
      [field]: !policy[field],
    });
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-[#0D0E1A] border border-white/[0.08] shadow-2xl space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              World Tool Governance Policy
            </h3>
            <p className="text-xs text-text-muted">
              Control what tools are available and what requires owner approval in this World.
            </p>
          </div>
        </div>

        {onSave && (
          <Button
            variant="primary"
            size="sm"
            onClick={onSave}
            isLoading={isSaving}
            leftIcon={Save}
            className="shadow-purple-glow cursor-pointer text-xs"
          >
            Save Policy
          </Button>
        )}
      </div>

      {/* Toggles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-[#141628] border border-white/[0.06] space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold text-white">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>Web Tools & Search</span>
          </div>
          <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.03] cursor-pointer">
            <span className="text-xs text-white">Allow web search & page fetching</span>
            <input
              type="checkbox"
              checked={policy.webToolsEnabled}
              onChange={() => toggle('webToolsEnabled')}
              className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
            />
          </label>
        </div>

        <div className="p-4 rounded-2xl bg-[#141628] border border-white/[0.06] space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold text-white">
            <FolderTree className="w-4 h-4 text-amber-400" />
            <span>File Tools & Workspace</span>
          </div>
          <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.03] cursor-pointer">
            <span className="text-xs text-white">Allow workspace file read & write</span>
            <input
              type="checkbox"
              checked={policy.fileToolsEnabled}
              onChange={() => toggle('fileToolsEnabled')}
              className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
            />
          </label>
        </div>

        <div className="p-4 rounded-2xl bg-[#141628] border border-white/[0.06] space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold text-white">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Code Execution Sandbox</span>
          </div>
          <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.03] cursor-pointer">
            <span className="text-xs text-white">Allow running code & test suites</span>
            <input
              type="checkbox"
              checked={policy.codeExecutionEnabled}
              onChange={() => toggle('codeExecutionEnabled')}
              className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
            />
          </label>
        </div>

        <div className="p-4 rounded-2xl bg-[#141628] border border-white/[0.06] space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold text-white">
            <Server className="w-4 h-4 text-purple-400" />
            <span>External API Requests</span>
          </div>
          <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.03] cursor-pointer">
            <span className="text-xs text-white">Allow outgoing HTTP requests</span>
            <input
              type="checkbox"
              checked={policy.httpToolsEnabled}
              onChange={() => toggle('httpToolsEnabled')}
              className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Safety & Budget Limits */}
      <div className="p-4 rounded-2xl bg-[#141628] border border-white/[0.06] space-y-4">
        <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
          Safety & Resource Budgets
        </h4>

        <div className="space-y-2">
          <label className="flex items-center justify-between p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 cursor-pointer">
            <span className="font-bold">Require owner approval for high-risk actions</span>
            <input
              type="checkbox"
              checked={policy.requireApprovalForHighRisk}
              onChange={() => toggle('requireApprovalForHighRisk')}
              className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 cursor-pointer">
            <span className="font-bold">Require owner approval for code execution</span>
            <input
              type="checkbox"
              checked={policy.requireApprovalForCode}
              onChange={() => toggle('requireApprovalForCode')}
              className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="space-y-1">
            <label className="text-[11px] text-text-muted font-bold block">
              Max Tool Calls / Task
            </label>
            <input
              type="number"
              value={policy.maxToolCallsPerTask}
              onChange={(e) =>
                onChange({ ...policy, maxToolCallsPerTask: parseInt(e.target.value) || 50 })
              }
              className="w-full bg-[#0E0F1A] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-text-muted font-bold block">
              Max Code Runs / Task
            </label>
            <input
              type="number"
              value={policy.maxCodeExecutionsPerTask}
              onChange={(e) =>
                onChange({ ...policy, maxCodeExecutionsPerTask: parseInt(e.target.value) || 10 })
              }
              className="w-full bg-[#0E0F1A] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-text-muted font-bold block">
              Max Timeout (Seconds)
            </label>
            <input
              type="number"
              value={policy.maxExecutionTimeSeconds}
              onChange={(e) =>
                onChange({ ...policy, maxExecutionTimeSeconds: parseInt(e.target.value) || 30 })
              }
              className="w-full bg-[#0E0F1A] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
