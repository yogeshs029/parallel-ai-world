import React, { useState } from 'react';
import { ShieldAlert, Check, X, Clock } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useToast } from '../../../hooks/useToast';
import { approvalService } from '../../../services/approvalService';
import { ApprovalRequest } from '../../../types/runtime';
import { formatDateRelative } from '../../../lib/utils';

export interface ApprovalCardProps {
  approval: ApprovalRequest;
  worldId: string;
  onResolved?: () => void;
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({
  approval,
  worldId,
  onResolved,
}) => {
  const toast = useToast();
  const [isApproving, setIsApproving] = useState(false);
  const [isDenying, setIsDenying] = useState(false);

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      await approvalService.approveRequest(worldId, approval.id);
      toast.success('Action approved', `Approved request from ${approval.requesterName}.`);
      if (onResolved) onResolved();
    } catch (e) {
      console.error(e);
      toast.error('Approval failed', 'Could not process approval.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleDeny = async () => {
    try {
      setIsDenying(true);
      await approvalService.denyRequest(worldId, approval.id);
      toast.info('Action declined', `Declined request from ${approval.requesterName}.`);
      if (onResolved) onResolved();
    } catch (e) {
      console.error(e);
      toast.error('Decline failed', 'Could not process request.');
    } finally {
      setIsDenying(false);
    }
  };

  return (
    <Card className="p-4 sm:p-5 border-brand-amber/40 bg-gradient-to-r from-brand-amber/5 via-background-surface to-background-surface space-y-3 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-amber/20 border border-brand-amber/30 flex items-center justify-center text-brand-amber shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text-primary">
                {approval.requesterEmoji} {approval.requesterName}
              </span>
              <Badge variant="thinking" size="sm">
                Approval Needed
              </Badge>
            </div>
            <h4 className="text-xs font-semibold text-text-secondary pt-0.5">
              {approval.title}
            </h4>
          </div>
        </div>

        <span className="text-[11px] text-text-dim flex items-center gap-1 self-start sm:self-auto">
          <Clock className="w-3 h-3" />
          {formatDateRelative(approval.createdAt)}
        </span>
      </div>

      <div className="p-3 rounded-xl bg-background-elevated border border-border text-xs text-text-primary leading-relaxed">
        <span className="text-text-muted font-medium block text-[11px] mb-0.5">Reason:</span>
        "{approval.reason}"
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          leftIcon={X}
          onClick={handleDeny}
          isLoading={isDenying}
          disabled={isApproving}
        >
          Decline
        </Button>
        <Button
          variant="primary"
          size="sm"
          leftIcon={Check}
          onClick={handleApprove}
          isLoading={isApproving}
          disabled={isDenying}
          className="bg-brand-emerald hover:bg-emerald-600 border-emerald-500"
        >
          Approve Action
        </Button>
      </div>
    </Card>
  );
};
