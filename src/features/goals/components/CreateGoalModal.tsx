import React, { useState } from 'react';
import { Sparkles, Target, User, CalendarDays, ArrowRight, ChevronLeft, Loader2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Goal, GoalPriority, GoalType } from '../../../types/goal';
import { Person } from '../../../types/person';
import { goalService } from '../../../services/goalService';
import { planningService, NaturalGoalExtraction } from '../../../services/planningService';
import { useToast } from '../../../hooks/useToast';

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  worldId: string;
  worldName: string;
  availablePeople: Person[];
  onGoalCreated: (goal: Goal) => void;
}

type Step = 'input' | 'preview';
type InputMode = 'natural' | 'structured';

const GOAL_TYPES: GoalType[] = ['Project', 'Personal', 'Business', 'Research', 'Learning', 'Maintenance', 'Custom'];
const PRIORITIES: { value: GoalPriority; label: string; color: string }[] = [
  { value: 'low',      label: 'Low',      color: 'border-slate-200 text-slate-500 bg-slate-50' },
  { value: 'normal',   label: 'Normal',   color: 'border-blue-200 text-blue-600 bg-blue-50' },
  { value: 'high',     label: 'High',     color: 'border-amber-200 text-amber-600 bg-amber-50' },
  { value: 'critical', label: 'Critical', color: 'border-rose-200 text-rose-600 bg-rose-50' },
];

export const CreateGoalModal: React.FC<CreateGoalModalProps> = ({
  isOpen,
  onClose,
  worldId,
  worldName,
  availablePeople,
  onGoalCreated,
}) => {
  const toast = useToast();

  // Step
  const [step, setStep] = useState<Step>('input');
  const [inputMode, setInputMode] = useState<InputMode>('natural');
  const [isProcessing, setIsProcessing] = useState(false);

  // Natural language input
  const [naturalText, setNaturalText] = useState('');

  // Extracted / structured form
  const [extracted, setExtracted] = useState<NaturalGoalExtraction | null>(null);
  const _isAIExtracted = !!extracted;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ownerPersonId, setOwnerPersonId] = useState(availablePeople[0]?.id || '');
  const [priority, setPriority] = useState<GoalPriority>('high');
  const [goalType, setGoalType] = useState<GoalType>('Project');
  const [targetDate, setTargetDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReset = () => {
    setStep('input');
    setNaturalText('');
    setExtracted(null);
    setTitle('');
    setDescription('');
    setOwnerPersonId(availablePeople[0]?.id || '');
    setPriority('high');
    setGoalType('Project');
    setTargetDate('');
    setIsProcessing(false);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleNaturalExtract = async () => {
    if (!naturalText.trim()) {
      toast.error('Describe your goal', 'Please type what you want to accomplish.');
      return;
    }
    setIsProcessing(true);
    try {
      const result = await planningService.parseNaturalGoal(naturalText, availablePeople);
      setExtracted(result);
      setTitle(result.title);
      setDescription(result.description);
      setOwnerPersonId(result.ownerPersonId || availablePeople[0]?.id || '');
      setPriority(result.priority);
      setGoalType(result.type);
      setTargetDate(result.targetDate || '');
      setStep('preview');
    } catch (err) {
      toast.error('Extraction failed', 'Could not interpret your goal. Please try the structured form.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStructuredNext = () => {
    if (!title.trim()) {
      toast.error('Missing title', 'Please enter a goal title.');
      return;
    }
    setStep('preview');
  };

  const handleActivateGoal = async (activate: boolean) => {
    if (!title.trim()) {
      toast.error('Missing title', 'Please enter a goal title.');
      return;
    }
    setIsSubmitting(true);
    try {
      const owner = availablePeople.find((p) => p.id === ownerPersonId);
      const newGoal = await goalService.createGoal(worldId, {
        title: title.trim(),
        description: description.trim(),
        ownerPersonId,
        ownerPersonName: owner?.name,
        ownerPersonEmoji: owner?.avatar?.emoji || owner?.avatarEmoji || '👤',
        priority,
        type: goalType,
        targetDate: targetDate || undefined,
        status: activate ? 'active' : 'draft',
        createdBy: 'user',
      });
      toast.success('Goal created!', activate ? `"${newGoal.title}" is now active.` : `"${newGoal.title}" saved as draft.`);
      onGoalCreated(newGoal);
      handleClose();
    } catch (err) {
      toast.error('Goal creation failed', 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ownerPerson = availablePeople.find((p) => p.id === ownerPersonId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 'input' ? '+ Create Goal' : 'Review Goal'}
      size="lg"
    >
      <div className="space-y-5 min-h-[300px]">

        {/* ── STEP 1: INPUT ── */}
        {step === 'input' && (
          <>
            {/* Mode tabs */}
            <div className="flex rounded-2xl bg-slate-100 p-1 gap-1">
              {(['natural', 'structured'] as InputMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setInputMode(m)}
                  className={`flex-1 text-xs font-semibold py-1.5 rounded-xl transition-all capitalize ${
                    inputMode === m
                      ? 'bg-white shadow-sm text-[#007aff]'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {m === 'natural' ? '✨ Natural Language' : '📋 Structured Form'}
                </button>
              ))}
            </div>

            {/* Natural Language */}
            {inputMode === 'natural' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">Describe your goal naturally — who should do it, what needs to happen, and by when.</p>
                <textarea
                  className="w-full min-h-[120px] text-sm bg-slate-50 border border-slate-200 rounded-2xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff] placeholder-slate-400 text-slate-800"
                  placeholder={`e.g. "I want ${availablePeople[0]?.name || 'Maya'} to prepare our company website for launch by September 15."`}
                  value={naturalText}
                  onChange={(e) => setNaturalText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleNaturalExtract(); }}
                />
                <Button
                  variant="primary"
                  size="lg"
                  leftIcon={isProcessing ? Loader2 : Sparkles}
                  onClick={handleNaturalExtract}
                  disabled={isProcessing || !naturalText.trim()}
                  className="w-full"
                >
                  {isProcessing ? 'Interpreting...' : 'Interpret Goal'}
                </Button>
              </div>
            )}

            {/* Structured Form */}
            {inputMode === 'structured' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Goal Title *</label>
                  <input
                    type="text"
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff] placeholder-slate-400 text-slate-800"
                    placeholder='e.g. "Prepare company website for launch"'
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label>
                  <textarea
                    className="w-full min-h-[80px] text-sm bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff] placeholder-slate-400 text-slate-800"
                    placeholder="What does success look like?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Owner *</label>
                    <select
                      value={ownerPersonId}
                      onChange={(e) => setOwnerPersonId(e.target.value)}
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff] text-slate-800"
                    >
                      {availablePeople.map((p) => (
                        <option key={p.id} value={p.id}>{p.avatar?.emoji || p.avatarEmoji || '👤'} {p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Type</label>
                    <select
                      value={goalType}
                      onChange={(e) => setGoalType(e.target.value as GoalType)}
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff] text-slate-800"
                    >
                      {GOAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Priority</label>
                  <div className="flex gap-2">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => setPriority(p.value)}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          priority === p.value ? p.color + ' ring-2 ring-offset-1 ring-[#007aff]/40' : 'border-slate-200 text-slate-400 bg-white hover:border-slate-300'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Target Date (optional)</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff] text-slate-800"
                  />
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  rightIcon={ArrowRight}
                  onClick={handleStructuredNext}
                  className="w-full"
                >
                  Preview Goal
                </Button>
              </div>
            )}
          </>
        )}

        {/* ── STEP 2: PREVIEW ── */}
        {step === 'preview' && (
          <>
            <button
              onClick={() => setStep('input')}
              className="flex items-center gap-1.5 text-xs text-[#007aff] font-semibold hover:underline mb-2"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Back to edit
            </button>

            {/* Preview Card */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200/70 rounded-3xl p-5 space-y-4">
              {/* Title */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#007aff]/10 flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5 text-[#007aff]" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                    {_isAIExtracted ? '✨ AI Extracted Goal' : 'Goal'}
                  </p>
                  <h2 className="text-base font-bold text-slate-900 leading-snug">{title}</h2>
                  {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
                </div>
              </div>

              <div className="h-px bg-slate-200/70" />

              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Owner */}
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <div>
                    <p className="text-slate-400 font-medium">Owner</p>
                    <p className="text-slate-800 font-bold">
                      {ownerPerson?.avatar?.emoji || ownerPerson?.avatarEmoji || '👤'} {ownerPerson?.name || 'Unassigned'}
                    </p>
                  </div>
                </div>
                {/* Target Date */}
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                  <div>
                    <p className="text-slate-400 font-medium">Target</p>
                    <p className="text-slate-800 font-bold">
                      {targetDate
                        ? new Date(targetDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
                        : 'No deadline'}
                    </p>
                  </div>
                </div>
                {/* Priority */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-medium text-xs">Priority</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${PRIORITIES.find((p) => p.value === priority)?.color}`}>
                    {priority}
                  </span>
                </div>
                {/* Type */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-medium text-xs">Type</span>
                  <span className="text-slate-800 font-semibold">{goalType}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 text-center">
              {worldName} will generate a structured plan once the goal is activated.
            </p>

            {/* CTA Buttons */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={() => handleActivateGoal(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Save as Draft
              </Button>
              <Button
                variant="primary"
                size="md"
                leftIcon={isSubmitting ? Loader2 : Target}
                onClick={() => handleActivateGoal(true)}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Activating...' : 'Activate Goal'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
