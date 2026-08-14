import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MoreVertical, Copy, Edit, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/Card';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Person } from '../../../types';

export interface PersonCardProps {
  person: Person;
  onEdit?: (person: Person) => void;
  onDuplicate?: (person: Person) => void;
  onDelete?: (person: Person) => void;
}

export const PersonCard: React.FC<PersonCardProps> = ({
  person,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const emoji = person.avatar?.emoji || person.avatarEmoji || '👤';
  const primaryResponsibility =
    person.responsibilities && person.responsibilities.length > 0
      ? person.responsibilities[0]
      : null;

  const statusVariant =
    person.status === 'available'
      ? 'available'
      : person.status === 'busy'
        ? 'working'
        : person.status === 'away'
          ? 'thinking'
          : 'offline';

  const statusLabel =
    person.status === 'available'
      ? '🟢 Available'
      : person.status === 'busy'
        ? '🟡 Busy'
        : person.status === 'away'
          ? '🟠 Away'
          : '⚪ Offline';

  return (
    <Card className="h-full flex flex-col justify-between hover:border-brand-purple/40 relative group font-sans transition-all">
      <div>
        <CardHeader className="p-5 pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar
                name={person.name}
                emoji={emoji}
                size="lg"
                status={person.status === 'busy' ? 'working' : person.status === 'away' ? 'thinking' : person.status}
              />
              <div className="space-y-0.5">
                <CardTitle className="text-base font-bold text-text-primary group-hover:text-brand-purple-light transition-colors">
                  {person.name}
                </CardTitle>
                <div className="text-xs font-semibold text-brand-purple-light">
                  {person.role}
                </div>
              </div>
            </div>

            {/* Actions Menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-background-elevated transition-colors cursor-pointer"
                aria-label="Person options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                    }}
                  />
                  <div
                    className="absolute right-0 mt-1 w-44 bg-background-surface border border-border rounded-xl shadow-xl p-1.5 z-50 animate-slide-down text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {onEdit && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onEdit(person);
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-background-elevated text-left text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit Person
                      </button>
                    )}
                    {onDuplicate && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onDuplicate(person);
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-background-elevated text-left text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" /> Duplicate
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onDelete(person);
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-brand-rose/20 text-left text-brand-rose transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove Person
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <CardDescription className="line-clamp-2 mt-2.5 text-xs text-text-secondary leading-relaxed">
            {person.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 pt-0 pb-3 space-y-3">
          {/* Primary Responsibility */}
          {primaryResponsibility && (
            <div className="p-2.5 rounded-xl bg-background-elevated/70 border border-border text-xs text-text-secondary space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-brand-emerald" /> Primary Responsibility:
              </span>
              <p className="line-clamp-2 leading-snug">{primaryResponsibility}</p>
            </div>
          )}

          {/* Personality Communication Styles */}
          {person.personality?.communicationStyle && person.personality.communicationStyle.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {person.personality.communicationStyle.slice(0, 3).map((st, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-background-deep text-text-muted border border-border font-medium"
                >
                  {st}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </div>

      <CardFooter className="p-5 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
        <Badge variant={statusVariant} size="sm" dot>
          {statusLabel}
        </Badge>

        <Link
          to={`/world/${person.worldId}/people/${person.id}`}
          className="text-brand-purple-light hover:text-white font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
        >
          View Person <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </CardFooter>
    </Card>
  );
};
