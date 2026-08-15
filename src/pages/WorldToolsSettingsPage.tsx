import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, History } from 'lucide-react';
import { LoadingState } from '../components/layout/LoadingState';
import { WorldToolsPolicyCard } from '../features/tools/components/WorldToolsPolicyCard';
import { toolService } from '../services/toolService';
import { worldService } from '../services/worldService';
import { useToast } from '../hooks/useToast';
import { World } from '../types';
import { WorldToolPolicy, ToolAuditLog } from '../types/tool';

export const WorldToolsSettingsPage: React.FC = () => {
  const { worldId = '' } = useParams<{ worldId: string }>();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [world, setWorld] = useState<World | null>(null);
  const [policy, setPolicy] = useState<WorldToolPolicy | null>(null);
  const [auditLogs, setAuditLogs] = useState<ToolAuditLog[]>([]);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const [w, pol, logs] = await Promise.all([
          worldService.getWorldById(worldId),
          toolService.getWorldToolPolicy(worldId),
          toolService.listAuditLogs(worldId),
        ]);
        setWorld(w);
        setPolicy(pol);
        setAuditLogs(logs);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    if (worldId) {
      load();
    }
  }, [worldId]);

  const handleSave = async () => {
    if (!policy || !worldId) return;
    try {
      setIsSaving(true);
      await toolService.updateWorldToolPolicy(worldId, policy);
      toast.success('Policy Saved', `Updated tool governance for ${world?.name || worldId}.`);
    } catch (e) {
      toast.error('Save Failed', 'Could not save policy.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <LoadingState message="Loading world tool settings..." />;
  if (!world || !policy) {
    return (
      <div className="p-8 text-center text-text-muted">
        World not found.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to={`/world/${worldId}`}
            className="p-2 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-text-muted hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>{world.name} • Tool Settings</span>
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </h1>
            <p className="text-xs text-text-muted">
              Configure allowed tools, approval requirements, and sandbox limits.
            </p>
          </div>
        </div>
      </div>

      {/* Main World Policy Editor Card */}
      <WorldToolsPolicyCard
        policy={policy}
        onChange={setPolicy}
        onSave={handleSave}
        isSaving={isSaving}
      />

      {/* Tool Audit Log Section */}
      {auditLogs.length > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-[#0D0E1A] border border-white/[0.08] shadow-2xl space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/[0.06]">
            <History className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-extrabold text-white">Recent Tool Invocations</h3>
          </div>

          <div className="space-y-2">
            {auditLogs.slice(0, 10).map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-2xl bg-[#141628] border border-white/[0.06] flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>{log.toolId}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      log.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : log.status === 'rejected'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted font-mono truncate max-w-md">
                    {log.inputSummary}
                  </p>
                </div>

                <div className="text-right text-[11px] text-text-muted">
                  <span>{log.durationMs}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorldToolsSettingsPage;
