import React, { useState, useRef } from 'react';
import {
  FileText,
  StickyNote,
  Globe,
  UploadCloud,
  File,
  X,
  Save,
  AlertCircle,
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useToast } from '../../../hooks/useToast';
import { knowledgeService } from '../../../services/knowledgeService';
import { KnowledgeVisibility } from '../../../types/knowledge';
import { formatBytes, cn } from '../../../lib/utils';

export interface AddKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  worldId: string;
  worldName?: string;
  personId?: string | null;
  personName?: string;
  onKnowledgeCreated?: () => void;
}

type TabType = 'upload' | 'note' | 'url';

export const AddKnowledgeModal: React.FC<AddKnowledgeModalProps> = ({
  isOpen,
  onClose,
  worldId,
  worldName = 'this world',
  personId,
  personName,
  onKnowledgeCreated,
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [visibility, setVisibility] = useState<KnowledgeVisibility>(personId ? 'person' : 'world');

  // Document Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docName, setDocName] = useState('');
  const [docDescription, setDocDescription] = useState('');

  // Note State
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteDescription, setNoteDescription] = useState('');

  // URL State
  const [webUrl, setWebUrl] = useState('');
  const [urlName, setUrlName] = useState('');
  const [urlDescription, setUrlDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setSelectedFile(null);
    setDocName('');
    setDocDescription('');
    setNoteTitle('');
    setNoteContent('');
    setNoteDescription('');
    setWebUrl('');
    setUrlName('');
    setUrlDescription('');
    setError(null);
    setVisibility(personId ? 'person' : 'world');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setDocName(file.name.replace(/\.[^/.]+$/, ''));
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setDocName(file.name.replace(/\.[^/.]+$/, ''));
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setIsSubmitting(true);

      if (activeTab === 'upload') {
        if (!selectedFile) {
          setError('Please select a document to upload (PDF, DOCX, TXT, or MD).');
          setIsSubmitting(false);
          return;
        }

        await knowledgeService.uploadDocument(worldId, selectedFile, {
          name: docName.trim() || selectedFile.name,
          description: docDescription.trim() || undefined,
          visibility,
          personId: visibility === 'person' ? personId : null,
        });

        toast.success('Document uploaded', `"${docName || selectedFile.name}" has been added and parsed into knowledge.`);
      } else if (activeTab === 'note') {
        if (!noteTitle.trim() || !noteContent.trim()) {
          setError('Please enter both a title and content for your note.');
          setIsSubmitting(false);
          return;
        }

        await knowledgeService.createNote(worldId, {
          worldId,
          personId: visibility === 'person' ? personId : null,
          title: noteTitle.trim(),
          content: noteContent.trim(),
          description: noteDescription.trim() || undefined,
          visibility,
        });

        toast.success('Note saved', `"${noteTitle}" has been added to knowledge.`);
      } else if (activeTab === 'url') {
        if (!webUrl.trim()) {
          setError('Please enter a valid web page URL.');
          setIsSubmitting(false);
          return;
        }

        await knowledgeService.createUrl(worldId, {
          worldId,
          personId: visibility === 'person' ? personId : null,
          url: webUrl.trim(),
          name: urlName.trim() || undefined,
          description: urlDescription.trim() || undefined,
          visibility,
        });

        toast.success('Web page saved', 'Extracted readable content from the web page.');
      }

      resetForm();
      onClose();
      if (onKnowledgeCreated) onKnowledgeCreated();
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Could not process knowledge source. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="What would you like your world to know?"
      description="Add reference documents, notes, or web pages for intelligent lookup."
      size="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            leftIcon={Save}
          >
            {activeTab === 'upload' ? 'Upload & Learn' : 'Save to Knowledge'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-sans max-h-[70vh] overflow-y-auto pr-1">
        {error && (
          <div className="p-3.5 bg-brand-rose-subtle border border-brand-rose/30 rounded-xl text-xs text-brand-rose flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-2 bg-background-elevated p-1 rounded-2xl border border-border">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={cn(
              'p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2',
              activeTab === 'upload'
                ? 'bg-background-surface text-text-primary shadow-xs border border-border/50'
                : 'text-text-muted hover:text-text-primary',
            )}
          >
            <FileText className="w-4 h-4 text-brand-purple-light" />
            <span>Upload Document</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('note')}
            className={cn(
              'p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2',
              activeTab === 'note'
                ? 'bg-background-surface text-text-primary shadow-xs border border-border/50'
                : 'text-text-muted hover:text-text-primary',
            )}
          >
            <StickyNote className="w-4 h-4 text-brand-amber" />
            <span>Write a Note</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={cn(
              'p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2',
              activeTab === 'url'
                ? 'bg-background-surface text-text-primary shadow-xs border border-border/50'
                : 'text-text-muted hover:text-text-primary',
            )}
          >
            <Globe className="w-4 h-4 text-brand-cyan" />
            <span>Web Page</span>
          </button>
        </div>

        {/* Tab 1: Upload Document */}
        {activeTab === 'upload' && (
          <div className="space-y-3.5 animate-fade-in">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              className="hidden"
              onChange={handleFileChange}
            />

            {!selectedFile ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-border hover:border-brand-purple/50 rounded-2xl bg-background-elevated/40 hover:bg-background-elevated/80 text-center cursor-pointer transition-all space-y-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple-light mx-auto">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-text-primary">
                    Drag and drop your document here, or <span className="text-brand-purple-light underline">choose a file</span>
                  </p>
                  <p className="text-[11px] text-text-muted pt-0.5">
                    Supports PDF, DOCX, TXT, and Markdown
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-background-elevated border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-purple/20 border border-brand-purple/30 flex items-center justify-center text-brand-purple-light">
                    <File className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text-primary line-clamp-1">
                      {selectedFile.name}
                    </h4>
                    <p className="text-[11px] text-text-muted">
                      {formatBytes(selectedFile.size)} • {selectedFile.type || 'Document'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="p-1.5 rounded-lg hover:bg-background-surface text-text-muted hover:text-brand-rose transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <Input
              label="Knowledge Title"
              placeholder="e.g. 2026 Product Catalog & Pricing"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
            />

            <Input
              label="Short Description (Optional)"
              placeholder="e.g. Catalog of solid wood furniture items, dimensions, and prices"
              value={docDescription}
              onChange={(e) => setDocDescription(e.target.value)}
            />
          </div>
        )}

        {/* Tab 2: Write Note */}
        {activeTab === 'note' && (
          <div className="space-y-3.5 animate-fade-in">
            <Input
              label="Note Title"
              placeholder="e.g. Company Mission & Sustainability Promise"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              required
              autoFocus
            />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">Note Content</label>
              <textarea
                rows={5}
                placeholder="Write or paste reference knowledge here..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full bg-background-elevated text-text-primary text-xs rounded-xl border border-border px-3.5 py-2.5 placeholder:text-text-dim focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple resize-none font-sans leading-relaxed"
                required
              />
            </div>

            <Input
              label="Short Description (Optional)"
              placeholder="e.g. Core mission statement"
              value={noteDescription}
              onChange={(e) => setNoteDescription(e.target.value)}
            />
          </div>
        )}

        {/* Tab 3: Web Page URL */}
        {activeTab === 'url' && (
          <div className="space-y-3.5 animate-fade-in">
            <Input
              label="Web Page URL"
              placeholder="https://example.com/about"
              value={webUrl}
              onChange={(e) => setWebUrl(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="Custom Title (Optional)"
              placeholder="e.g. About Our Furniture Company"
              value={urlName}
              onChange={(e) => setUrlName(e.target.value)}
            />

            <Input
              label="Short Description (Optional)"
              placeholder="e.g. Public about page details"
              value={urlDescription}
              onChange={(e) => setUrlDescription(e.target.value)}
            />
          </div>
        )}

        {/* Visibility Selector */}
        <div className="space-y-2 pt-2 border-t border-border/60">
          <label className="text-xs font-semibold text-text-secondary">
            Who can reference this knowledge?
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setVisibility('world')}
              className={cn(
                'p-2.5 rounded-xl border text-xs font-medium transition-all text-left cursor-pointer space-y-0.5',
                visibility === 'world'
                  ? 'bg-brand-purple/20 border-brand-purple text-white'
                  : 'bg-background-elevated border-border text-text-secondary hover:border-brand-purple/30',
              )}
            >
              <div className="font-bold text-text-primary">🌍 Everyone in {worldName}</div>
              <div className="text-[11px] text-text-muted">Shared world library</div>
            </button>

            {personId && personName && (
              <button
                type="button"
                onClick={() => setVisibility('person')}
                className={cn(
                  'p-2.5 rounded-xl border text-xs font-medium transition-all text-left cursor-pointer space-y-0.5',
                  visibility === 'person'
                    ? 'bg-brand-purple/20 border-brand-purple text-white'
                    : 'bg-background-elevated border-border text-text-secondary hover:border-brand-purple/30',
                )}
              >
                <div className="font-bold text-text-primary">👤 {personName} only</div>
                <div className="text-[11px] text-text-muted">Private character knowledge</div>
              </button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};
