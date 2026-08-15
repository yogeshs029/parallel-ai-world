import React, { useState } from 'react';
import {
  Palette,
  Tag,
  Layout,
  Save,
  Check,
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { WorldExperience, ThemePreset, BorderRadiusOption, DensityOption } from '../../../types/experience';
import { THEME_PRESETS } from '../../../services/themeEngine';
import { experienceService } from '../../../services/experienceService';
import { useToast } from '../../../hooks/useToast';
import { Tabs } from '../../../components/ui/Tabs';

export interface WorldExperienceCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  experience: WorldExperience;
  onUpdated: (updated: WorldExperience) => void;
}

export const WorldExperienceCustomizerModal: React.FC<WorldExperienceCustomizerModalProps> = ({
  isOpen,
  onClose,
  experience,
  onUpdated,
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('theme');
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState<WorldExperience>(experience);

  const tabs = [
    { id: 'theme', label: 'Theme & Style', icon: Palette },
    { id: 'terminology', label: 'Terminology', icon: Tag },
    { id: 'navigation', label: 'Navigation & Features', icon: Layout },
  ];

  const handleSelectPreset = (presetKey: ThemePreset) => {
    const selectedTheme = THEME_PRESETS[presetKey];
    setDraft({
      ...draft,
      theme: { ...selectedTheme },
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updated = await experienceService.updateExperience(draft.worldId, {
        theme: draft.theme,
        terminology: draft.terminology,
        navigation: draft.navigation,
        headerConfig: draft.headerConfig,
        footerConfig: draft.footerConfig,
      });
      onUpdated(updated);
      toast.success('Experience Saved', 'Living World identity updated.');
      onClose();
    } catch (e) {
      toast.error('Save Failed', 'Could not update experience.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="World Customization Studio"
      description="Tailor the visual theme, typography, navigation, and terminology of this World."
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSaving} className="text-xs">
            Cancel
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            leftIcon={Save}
            className="shadow-purple-glow cursor-pointer text-xs font-bold"
          >
            Save Experience
          </Button>
        </div>
      }
    >
      <div className="space-y-4 font-sans text-xs">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* ── TAB 1: THEME & STYLE ── */}
        {activeTab === 'theme' && (
          <div className="space-y-4 pt-1">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                Visual Style Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {(Object.keys(THEME_PRESETS) as ThemePreset[]).slice(0, 6).map((presetKey) => {
                  const p = THEME_PRESETS[presetKey];
                  const isSelected = draft.theme.preset === presetKey;
                  return (
                    <button
                      key={presetKey}
                      type="button"
                      onClick={() => handleSelectPreset(presetKey)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? 'border-purple-500 bg-purple-600/20 shadow-purple-glow'
                          : 'border-white/[0.08] bg-[#141628] hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-extrabold capitalize text-white text-xs">{presetKey}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-purple-300" />}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: p.primaryColor }} />
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: p.secondaryColor }} />
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: p.accentColor }} />
                        <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: p.backgroundColor }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Radius & Density */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-text-muted block">Corner Radius</label>
                <select
                  value={draft.theme.borderRadius}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      theme: { ...draft.theme, borderRadius: e.target.value as BorderRadiusOption },
                    })
                  }
                  className="w-full bg-[#141628] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                >
                  <option value="none">Square (0px)</option>
                  <option value="sm">Small (8px)</option>
                  <option value="md">Medium (12px)</option>
                  <option value="lg">Large (16px)</option>
                  <option value="xl">Extra Large (24px)</option>
                  <option value="full">Rounded Full</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-text-muted block">Layout Density</label>
                <select
                  value={draft.theme.density}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      theme: { ...draft.theme, density: e.target.value as DensityOption },
                    })
                  }
                  className="w-full bg-[#141628] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                >
                  <option value="compact">Compact</option>
                  <option value="comfortable">Comfortable</option>
                  <option value="spacious">Spacious</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: TERMINOLOGY ── */}
        {activeTab === 'terminology' && (
          <div className="space-y-3 pt-1">
            <p className="text-xs text-text-muted">
              Customize how entities are named throughout the interface in this World.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-text-muted block">People Label</label>
                <input
                  type="text"
                  value={draft.terminology.peopleLabel}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      terminology: { ...draft.terminology, peopleLabel: e.target.value },
                    })
                  }
                  placeholder="e.g. Family, Students, Team"
                  className="w-full bg-[#141628] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-text-muted block">Goals Label</label>
                <input
                  type="text"
                  value={draft.terminology.goalsLabel}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      terminology: { ...draft.terminology, goalsLabel: e.target.value },
                    })
                  }
                  placeholder="e.g. Objectives, Plans, Quests"
                  className="w-full bg-[#141628] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-text-muted block">Tasks Label</label>
                <input
                  type="text"
                  value={draft.terminology.tasksLabel}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      terminology: { ...draft.terminology, tasksLabel: e.target.value },
                    })
                  }
                  placeholder="e.g. Things to do, Assignments"
                  className="w-full bg-[#141628] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-text-muted block">Projects Label</label>
                <input
                  type="text"
                  value={draft.terminology.projectsLabel}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      terminology: { ...draft.terminology, projectsLabel: e.target.value },
                    })
                  }
                  placeholder="e.g. Lessons, Initiatives"
                  className="w-full bg-[#141628] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: NAVIGATION & FEATURES ── */}
        {activeTab === 'navigation' && (
          <div className="space-y-3 pt-1">
            <p className="text-xs text-text-muted">
              Toggle which sections appear in the World navigation menu.
            </p>

            <div className="space-y-2">
              {draft.navigation.map((item, idx) => (
                <label
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#141628] border border-white/[0.06] hover:bg-white/[0.03] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-white text-xs">{item.label}</span>
                    <span className="text-[10px] text-text-muted font-mono">{item.path}</span>
                  </div>

                  <input
                    type="checkbox"
                    checked={item.visible !== false}
                    onChange={() => {
                      const updatedNav = [...draft.navigation];
                      updatedNav[idx].visible = !updatedNav[idx].visible;
                      setDraft({ ...draft, navigation: updatedNav });
                    }}
                    className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
