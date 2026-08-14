import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  BookOpen,
  Globe,
  StickyNote,
  MoreVertical,
  Edit2,
  Trash2,
  Clock,
  ArrowRight,
  User,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { KnowledgeSource, KnowledgeType } from '../../../types/knowledge';
import { formatDateRelative, formatBytes } from '../../../lib/utils';
import { cn } from '../../../lib/utils';

export interface KnowledgeCardProps {
  knowledge: KnowledgeSource;
  worldId: string;
  onEdit?: (knowledge: KnowledgeSource) => void;
  onDelete?: (knowledge: KnowledgeSource) => void;
  showVisibility?: boolean;
}

const TYPE_CONFIG: Record<
  KnowledgeType,
  { label: string; icon: React.FC<{ className?: string }>; color: string }
> = {
  document: { label: 'Document', icon: FileText, color: 'text-brand-purple-light' },
  note: { label: 'Note', icon: StickyNote, color: 'text-brand-amber' },
  url: { label: 'Web Page', icon: Globe, color: 'text-brand-cyan' },
  text: { label: 'Text', icon: BookOpen, color: 'text-emerald-400' },
};

export const KnowledgeCard: React.FC<KnowledgeCardProps> = ({
  knowledge,
  worldId,
  onEdit,
  onDelete,
  showVisibility = true,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const typeConfig = TYPE_CONFIG[knowledge.type] || TYPE_CONFIG.document;
  const TypeIcon = typeConfig.icon;

  const detailUrl = `/world/${worldId}/knowledge/${knowledge.id}`;

  return (
    <Card className="p-5 hover:border-brand-purple/40 relative group font-sans flex flex-col justify-between h-full bg-background-surface transition-all">
      <div className="space-y-3">
        {/* Card Top: Type, Status, Visibility & Menu */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'p-2 rounded-xl bg-background-elevated border border-border flex items-center justify-center',
                typeConfig.color,
              )}
            >
              <TypeIcon className="w-4 h-4" />
            </span>
            <div>
              <span className="text-xs font-bold text-text-primary capitalize block">
                {typeConfig.label}
              </span>
              {knowledge.size ? (
                <span className="text-[10px] text-text-dim">
                  {formatBytes(knowledge.size)}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {knowledge.status === 'processing' && (
              <Badge variant="thinking" size="sm">
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                Processing
              </Badge>
            )}

            {knowledge.status === 'failed' && (
              <Badge variant="high" size="sm">
                <AlertCircle className="w-3 h-3 mr-1" />
                Failed
              </Badge>
            )}

            {showVisibility && (
              <span
                className={cn(
                  'text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 font-medium',
                  knowledge.visibility === 'world'
                    ? 'bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan'
                    : 'bg-brand-purple/10 border-brand-purple/30 text-brand-purple-light',
                )}
              >
                {knowledge.visibility === 'world' ? (
                  <>
                    <Globe className="w-2.5 h-2.5" />
                    <span>Everyone</span>
                  </>
                ) : (
                  <>
                    <User className="w-2.5 h-2.5" />
                    <span>Private</span>
                  </>
                )}
              </span>
            )}

            {/* Menu */}
            {(onEdit || onDelete) && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMenuOpen(!isMenuOpen);
                  }}
                  className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-background-elevated transition-colors cursor-pointer"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>

                {isMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-1 w-36 bg-background-surface border border-border rounded-xl shadow-xl p-1 z-50 animate-slide-down text-xs">
                      {onEdit && (
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            onEdit(knowledge);
                          }}
                          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-background-elevated text-left text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            onDelete(knowledge);
                          }}
                          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-brand-rose/20 text-left text-brand-rose transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-1">
          <Link
            to={detailUrl}
            className="text-sm font-bold text-text-primary hover:text-brand-purple-light transition-colors line-clamp-1 block"
          >
            {knowledge.name}
          </Link>
          <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed font-sans">
            {knowledge.description || knowledge.extractedText || 'No description provided.'}
          </p>
        </div>
      </div>

      {/* Card Footer: Timestamp & Open Link */}
      <div className="pt-3.5 mt-3.5 border-t border-border/60 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-[11px] text-text-dim">
          <Clock className="w-3 h-3" />
          {formatDateRelative(knowledge.updatedAt || knowledge.createdAt)}
        </span>

        <Link
          to={detailUrl}
          className="text-brand-purple-light hover:text-white font-semibold flex items-center gap-1 text-xs transition-colors"
        >
          <span>Open</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </Card>
  );
};
