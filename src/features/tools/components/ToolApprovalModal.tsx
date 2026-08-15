import React, { useState } from 'react';
import {
  Check,
  X,
  ChevronDown,
  ChevronUp,
  FileCode,
  Globe,
  Terminal,
  Server,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { ToolRequest, ApprovalScope } from '../../../types/tool';

export interface ToolApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ToolRequest | null;
  requesterName?: string;
  requesterRole?: string;
  onApprove: (scope: ApprovalScope) => Promise<void>;
  onDeny: () => Promise<void>;
}

export const ToolApprovalModal: React.FC<ToolApprovalModalProps> = ({
  isOpen,
  onClose,
  request,
  requesterName = 'Agent',
  requesterRole = 'Assistant',
  onApprove,
  onDeny,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!request) return null;

  const handleAction = async (scope?: ApprovalScope) => {
    try {
      setIsSubmitting(true);
      if (scope) {
        await onApprove(scope);
      } else {
        await onDeny();
      }
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getToolIcon = (toolId: string) => {
    if (toolId.includes('file')) return FileCode;
    if (toolId.includes('code') || toolId.includes('test')) return Terminal;
    if (toolId.includes('web') || toolId.includes('http')) return Globe;
    return Server;
  };

  const getFriendlyDescription = (toolId: string, input: Record<string, unknown>) => {
    if (toolId === 'file_write') {
      return {
        action: 'Create & write to file',
        target: String(input.path || 'workspace file'),
        summary: `Wants permission to save content to '${input.path}'.`,
      };
    }
    if (toolId === 'code_execute') {
      return {
        action: 'Execute sandbox code',
        target: `${String(input.language || 'script').toUpperCase()} script`,
        summary: `Wants to run code in the secure world execution sandbox.`,
      };
    }
    if (toolId === 'code_test') {
      return {
        action: 'Run test command',
        target: String(input.command || 'test runner'),
        summary: `Wants to run automated test assertions on the project.`,
      };
    }
    if (toolId === 'http_request') {
      return {
        action: 'Connect to external API',
        target: String(input.url || 'Web API endpoint'),
        summary: `Wants to send an HTTP ${input.method || 'GET'} request to '${input.url}'.`,
      };
    }
    if (toolId === 'world_update') {
      return {
        action: 'Update world state',
        target: String(input.entityType || 'World'),
        summary: `Wants to update ${input.entityType} data in this World.`,
      };
    }
    return {
      action: `Use tool: ${toolId}`,
      target: 'World workspace',
      summary: `Wants permission to invoke '${toolId}'.`,
    };
  };

  const Icon = getToolIcon(request.toolId);
  const friendly = getFriendlyDescription(request.toolId, request.input);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Permission Approval Required"
      description={`${requesterName} is requesting authorization to perform an action in this World.`}
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAction(undefined)}
            disabled={isSubmitting}
            leftIcon={X}
            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer text-xs"
          >
            Deny
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction('task')}
              disabled={isSubmitting}
              className="cursor-pointer text-xs"
            >
              Allow for this task
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleAction('once')}
              isLoading={isSubmitting}
              leftIcon={Check}
              className="shadow-purple-glow cursor-pointer text-xs"
            >
              Allow once
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 font-sans text-xs">
        {/* Requester Profile Card */}
        <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-white">{requesterName}</div>
              <div className="text-[11px] text-purple-300">{requesterRole}</div>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {request.riskLevel} Risk
          </span>
        </div>

        {/* Action Summary */}
        <div className="p-4 rounded-2xl bg-[#141628] border border-white/[0.08] space-y-2.5">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
              Requested Action
            </span>
            <h4 className="text-sm font-black text-white">{friendly.action}</h4>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
              Target
            </span>
            <p className="text-xs font-mono text-purple-300 break-all bg-black/30 p-2 rounded-xl border border-white/[0.06]">
              {friendly.target}
            </p>
          </div>

          <p className="text-text-secondary leading-relaxed pt-1">{friendly.summary}</p>
        </div>

        {/* Collapsible Technical Details */}
        <div className="border border-white/[0.08] rounded-2xl overflow-hidden bg-[#0F101F]">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full p-3 flex items-center justify-between text-xs text-text-muted hover:text-white transition-colors cursor-pointer"
          >
            <span className="font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Technical Payload Details
            </span>
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showDetails && (
            <div className="p-3 pt-0 border-t border-white/[0.06] text-[11px] font-mono text-purple-200/90 overflow-x-auto max-h-48 custom-scrollbar">
              <pre className="p-2.5 bg-black/40 rounded-xl whitespace-pre-wrap break-all">
                {JSON.stringify(request.input, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
