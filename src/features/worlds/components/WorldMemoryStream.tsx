import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { KnowledgeNote } from '../../../types';
import { formatDateRelative } from '../../../lib/utils';

export interface WorldMemoryStreamProps {
  memories?: unknown[];
  notes?: KnowledgeNote[];
  onAddNoteClick?: () => void;
}

export const WorldMemoryStream: React.FC<WorldMemoryStreamProps> = ({
  notes = [],
}) => {
  const [query, setQuery] = useState('');

  const defaultNotes: KnowledgeNote[] = [
    {
      id: 'kn-1',
      worldId: 'world-company',
      title: 'Company Mission & Core Values',
      content: 'We build durable, sustainable handcrafted furniture with lifetime warranties. Focus on customer delight, transparent pricing, and fast local delivery.',
      category: 'guideline',
      authorName: 'Rahul',
      tags: ['Mission', 'Values'],
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'kn-2',
      worldId: 'world-company',
      title: 'Brand Voice Guidelines',
      content: 'Warm, approachable, craftsmanship-focused, and straightforward. Never use high-pressure sales tactics.',
      category: 'guideline',
      authorName: 'Priya',
      tags: ['Brand', 'Marketing'],
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
  ];

  const currentNotes = notes.length > 0 ? notes : defaultNotes;

  const filteredNotes = currentNotes.filter(
    (n) =>
      n.title.toLowerCase().includes(query.toLowerCase()) ||
      n.content.toLowerCase().includes(query.toLowerCase()) ||
      n.authorName.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand-purple-light" />
          <h3 className="text-sm font-bold text-text-primary font-sans">
            Shared Knowledge & Guidelines ({filteredNotes.length})
          </h3>
        </div>
        <div className="w-full sm:w-64">
          <Input
            isSearch
            placeholder="Search notes & guidelines..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClear={() => setQuery('')}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredNotes.map((note) => (
          <Card
            key={note.id}
            className="p-5 hover:border-brand-purple/40 transition-all space-y-2.5 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-bold text-text-primary font-sans">
                  {note.title}
                </h4>
                <Badge variant="primary" size="sm" className="capitalize">
                  {note.category}
                </Badge>
              </div>

              <p className="text-xs text-text-secondary leading-relaxed font-sans">
                {note.content}
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] text-text-muted pt-2 border-t border-border/60">
              <span>By {note.authorName}</span>
              <span>Updated {formatDateRelative(note.updatedAt)}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
