import React, { useState } from 'react';
import {
  Globe,
  FolderTree,
  Terminal,
  Server,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { ToolResult } from '../../../types/tool';

export interface ChatToolIndicatorProps {
  toolId: string;
  toolName?: string;
  status: 'running' | 'completed' | 'failed';
  result?: ToolResult | null;
  citations?: { title: string; url: string }[];
}

export const ChatToolIndicator: React.FC<ChatToolIndicatorProps> = ({
  toolId,
  toolName,
  status,
  result,
  citations = [],
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getToolMeta = () => {
    if (toolId.includes('web') || toolId.includes('search')) {
      return { icon: Globe, label: 'Searching the web', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' };
    }
    if (toolId.includes('file')) {
      return { icon: FolderTree, label: 'Reading & managing files', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' };
    }
    if (toolId.includes('code') || toolId.includes('test')) {
      return { icon: Terminal, label: 'Executing in sandbox', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' };
    }
    return { icon: Server, label: 'Connecting to service', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' };
  };

  const meta = getToolMeta();
  const Icon = meta.icon;

  return (
    <div className="my-2 max-w-md font-sans text-xs">
      <div className={`p-2.5 px-3.5 rounded-2xl border ${meta.bg} flex items-center justify-between gap-3 transition-all`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon className={`w-4 h-4 shrink-0 ${meta.color} ${status === 'running' ? 'animate-spin-slow' : ''}`} />
          <span className="text-white font-bold truncate">
            {toolName || meta.label}
          </span>
          {status === 'running' && (
            <span className="inline-flex items-center gap-1 text-[10px] text-purple-300">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              Working...
            </span>
          )}
          {status === 'completed' && (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          )}
        </div>

        {(citations.length > 0 || result) && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-text-muted hover:text-white p-1 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Expanded Citations & Output */}
      {isExpanded && (
        <div className="mt-1.5 p-3 rounded-2xl bg-[#141628] border border-white/[0.06] space-y-2 text-[11px] animate-fade-in">
          {citations.length > 0 && (
            <div className="space-y-1.5">
              <span className="font-bold text-text-muted uppercase text-[9px] tracking-wider block">
                Sources & Citations
              </span>
              <div className="space-y-1">
                {citations.map((c, i) => (
                  <a
                    key={i}
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-1.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] text-purple-300 transition-colors"
                  >
                    <span className="truncate pr-2">{c.title}</span>
                    <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {result && result.durationMs > 0 && (
            <div className="flex items-center justify-between text-[10px] text-text-muted pt-1 border-t border-white/[0.04]">
              <span>Completed in {result.durationMs}ms</span>
              <span className="text-emerald-400 font-semibold">Verified Sandbox</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
