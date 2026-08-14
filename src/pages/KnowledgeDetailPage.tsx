import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  StickyNote,
  Globe,
  BookOpen,
  Trash2,
  RefreshCw,
  Edit2,
  Save,
  Layers,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { LoadingState } from '../components/layout/LoadingState';
import { DeleteKnowledgeModal } from '../features/knowledge/components/DeleteKnowledgeModal';
import { useDisclosure } from '../hooks/useDisclosure';
import { useToast } from '../hooks/useToast';
import { worldService } from '../services/worldService';
import { knowledgeService } from '../services/knowledgeService';
import { World } from '../types';
import { KnowledgeSource, KnowledgeType } from '../types/knowledge';
import { formatDateRelative, formatBytes, cn } from '../lib/utils';

const TYPE_CONFIG: Record<
  KnowledgeType,
  { label: string; icon: React.FC<{ className?: string }>; color: string }
> = {
  document: { label: 'Document', icon: FileText, color: 'text-brand-purple-light' },
  note: { label: 'Note', icon: StickyNote, color: 'text-brand-amber' },
  url: { label: 'Web Page', icon: Globe, color: 'text-brand-cyan' },
  text: { label: 'Text', icon: BookOpen, color: 'text-emerald-400' },
};

export const KnowledgeDetailPage: React.FC = () => {
  const { worldId, knowledgeId } = useParams<{ worldId: string; knowledgeId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [world, setWorld] = useState<World | null>(null);
  const [knowledge, setKnowledge] = useState<KnowledgeSource | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Note State
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editableText, setEditableText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const deleteDisclosure = useDisclosure(false);

  const loadData = useCallback(async () => {
    if (!worldId || !knowledgeId) return;
    try {
      setIsLoading(true);
      const [w, k] = await Promise.all([
        worldService.getWorldById(worldId),
        knowledgeService.getKnowledge(worldId, knowledgeId),
      ]);
      setWorld(w);
      setKnowledge(k);
      if (k?.extractedText) {
        setEditableText(k.extractedText);
      }
    } catch (err) {
      console.error('Failed to load knowledge detail:', err);
    } finally {
      setIsLoading(false);
    }
  }, [worldId, knowledgeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveNote = async () => {
    if (!knowledge || !worldId) return;
    try {
      setIsSaving(true);
      const updated = await knowledgeService.updateKnowledge(worldId, knowledge.id, {
        content: editableText.trim(),
      });
      if (updated) {
        setKnowledge(updated);
        setIsEditingNote(false);
        toast.success('Note updated', 'Changes have been saved and re-chunked.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Save failed', 'Could not save note updates.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefreshUrl = async () => {
    if (!knowledge || !worldId) return;
    try {
      setIsRefreshing(true);
      const updated = await knowledgeService.refreshUrl(worldId, knowledge.id);
      if (updated) {
        setKnowledge(updated);
        setEditableText(updated.extractedText || '');
        toast.success('Web page refreshed', 'Updated latest page content.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Refresh failed', 'Could not fetch web page.');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading knowledge document..." />;
  }

  if (!world || !knowledge) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 space-y-4 font-sans">
        <h2 className="text-xl font-bold">Knowledge Not Found</h2>
        <Link to={worldId ? `/world/${worldId}/knowledge` : '/worlds'}>
          <Button variant="primary" size="md" leftIcon={ArrowLeft}>
            Back to Knowledge Library
          </Button>
        </Link>
      </div>
    );
  }

  const worldIcon = world.icon || world.emoji || '✨';
  const typeConfig = TYPE_CONFIG[knowledge.type] || TYPE_CONFIG.document;
  const TypeIcon = typeConfig.icon;

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12 max-w-5xl mx-auto">
      {/* Breadcrumbs */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
        <Link to="/worlds" className="hover:text-text-primary transition-colors font-medium">
          My Worlds
        </Link>
        <span>/</span>
        <Link
          to={`/world/${world.id}`}
          className="hover:text-text-primary transition-colors font-semibold flex items-center gap-1"
        >
          <span>{worldIcon}</span>
          <span>{world.name}</span>
        </Link>
        <span>/</span>
        <Link
          to={`/world/${world.id}/knowledge`}
          className="hover:text-text-primary transition-colors font-medium"
        >
          Knowledge
        </Link>
        <span>/</span>
        <span className="text-text-primary font-bold line-clamp-1">{knowledge.name}</span>
      </div>

      {/* Header Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-background-surface border border-border shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'w-12 h-12 rounded-2xl bg-background-elevated border border-border flex items-center justify-center shrink-0 mt-0.5',
                typeConfig.color,
              )}
            >
              <TypeIcon className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary">
                  {knowledge.name}
                </h1>
                <Badge variant="available" size="sm" dot>
                  Ready
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                <span className="capitalize font-semibold text-brand-purple-light">
                  {typeConfig.label}
                </span>
                <span>•</span>
                <span>
                  {knowledge.visibility === 'world' ? '🌍 Available to everyone' : '👤 Private knowledge'}
                </span>
                {knowledge.size ? (
                  <>
                    <span>•</span>
                    <span>{formatBytes(knowledge.size)}</span>
                  </>
                ) : null}
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  {knowledge.chunkCount} {knowledge.chunkCount === 1 ? 'chunk' : 'chunks'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
            {knowledge.type === 'url' && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={RefreshCw}
                onClick={handleRefreshUrl}
                isLoading={isRefreshing}
              >
                Refresh Web Page
              </Button>
            )}

            {knowledge.type === 'note' && !isEditingNote && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={Edit2}
                onClick={() => setIsEditingNote(true)}
              >
                Edit Note
              </Button>
            )}

            {knowledge.type === 'note' && isEditingNote && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={Save}
                onClick={handleSaveNote}
                isLoading={isSaving}
              >
                Save Changes
              </Button>
            )}

            <Button
              variant="danger"
              size="sm"
              leftIcon={Trash2}
              onClick={deleteDisclosure.onOpen}
            >
              Remove
            </Button>
          </div>
        </div>

        {knowledge.description && (
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed pt-1 border-t border-border/60">
            {knowledge.description}
          </p>
        )}
      </div>

      {/* Extracted Text Reading View */}
      <Card className="p-6 sm:p-7 space-y-4">
        <CardHeader className="p-0 flex flex-row items-center justify-between pb-3 border-b border-border/80">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brand-purple-light" />
            <CardTitle className="text-sm font-bold text-text-primary">
              {isEditingNote ? 'Editing Note Content' : 'Extracted Text & Reference Data'}
            </CardTitle>
          </div>

          <span className="text-xs text-text-dim">
            Updated {formatDateRelative(knowledge.updatedAt || knowledge.createdAt)}
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {isEditingNote ? (
            <div className="space-y-3 pt-2">
              <textarea
                rows={12}
                value={editableText}
                onChange={(e) => setEditableText(e.target.value)}
                className="w-full bg-background-elevated text-text-primary text-xs sm:text-sm rounded-2xl border border-border p-4 placeholder:text-text-dim focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple resize-none font-mono leading-relaxed"
                placeholder="Write reference content here..."
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditableText(knowledge.extractedText || '');
                    setIsEditingNote(false);
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={Save}
                  onClick={handleSaveNote}
                  isLoading={isSaving}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-6 rounded-2xl bg-background-elevated/70 border border-border text-xs sm:text-sm text-text-primary font-sans leading-relaxed whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
              {knowledge.extractedText || 'No text extracted for this document.'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Modal */}
      <DeleteKnowledgeModal
        isOpen={deleteDisclosure.isOpen}
        onClose={deleteDisclosure.onClose}
        knowledge={knowledge}
        worldId={world.id}
        onDeleted={() => navigate(`/world/${world.id}/knowledge`)}
      />
    </div>
  );
};
