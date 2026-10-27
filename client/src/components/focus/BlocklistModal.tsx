import React, { useState } from 'react';
import {
  Shield,
  Plus,
  Trash2,
  Check,
  X,
  Sliders,
  Globe,
  Lock,
  RotateCcw,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Button } from '../ui/Button.js';
import { Badge } from '../ui/Badge.js';
import {
  BlocklistItem,
  ExtensionSettings,
  DEFAULT_BLOCKLIST,
  DEFAULT_SETTINGS,
  validateDomainInput,
} from '../../services/focusExtension.js';

interface BlocklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  blocklist: BlocklistItem[];
  settings: ExtensionSettings;
  isFocusActive: boolean;
  onSaveBlocklist: (updated: BlocklistItem[]) => Promise<void>;
  onSaveSettings: (updated: ExtensionSettings) => Promise<void>;
}

export const BlocklistModal: React.FC<BlocklistModalProps> = ({
  isOpen,
  onClose,
  blocklist,
  settings,
  isFocusActive,
  onSaveBlocklist,
  onSaveSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'sites' | 'settings'>('sites');
  const [items, setItems] = useState<BlocklistItem[]>(blocklist);
  const [currentSettings, setCurrentSettings] = useState<ExtensionSettings>(settings);
  const [newDomain, setNewDomain] = useState('');
  const [domainError, setDomainError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    setDomainError(null);

    const { valid, error, cleanDomain } = validateDomainInput(newDomain);
    if (!valid) {
      setDomainError(error || 'Invalid domain.');
      return;
    }

    if (items.some((i) => i.domain === cleanDomain)) {
      setDomainError(`"${cleanDomain}" is already in your blocklist.`);
      return;
    }

    const newItem: BlocklistItem = {
      id: `bl-custom-${Date.now()}`,
      domain: cleanDomain,
      label: cleanDomain,
      category: 'custom',
      enabled: true,
      isDefault: false,
    };

    setItems((prev) => [newItem, ...prev]);
    setNewDomain('');
  };

  const handleToggle = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    );
  };

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleResetDefaults = () => {
    setItems(DEFAULT_BLOCKLIST);
  };

  const handlePresetSelect = (preset: 'all' | 'none' | 'social' | 'video') => {
    setItems((prev) =>
      prev.map((item) => {
        if (preset === 'all') return { ...item, enabled: true };
        if (preset === 'none') return { ...item, enabled: false };
        if (preset === 'social') return { ...item, enabled: item.category === 'social' };
        if (preset === 'video') return { ...item, enabled: item.category === 'video' || item.category === 'streaming' };
        return item;
      })
    );
  };

  const handleSaveAndApply = async () => {
    setIsSaving(true);
    try {
      await onSaveBlocklist(items);
      await onSaveSettings(currentSettings);
      setSavedNotice(true);
      setTimeout(() => {
        setSavedNotice(false);
        onClose();
      }, 800);
    } catch (err: any) {
      setDomainError(err?.message || 'Failed to sync settings with extension.');
    } finally {
      setIsSaving(false);
    }
  };

  const enabledCount = items.filter((i) => i.enabled).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-card border border-border rounded-3xl shadow-2xl p-6 sm:p-8 relative flex flex-col max-h-[90vh] text-foreground"
        role="dialog"
        aria-modal="true"
        aria-labelledby="blocklist-modal-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-950 dark:text-primary-400 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 id="blocklist-modal-title" className="text-lg font-bold text-foreground">
              Distraction Blocklist & Policies
            </h2>
            <p className="text-xs text-muted-foreground">
              Configure websites that will be blocked during active focus sprints.
            </p>
          </div>
        </div>

        {isFocusActive && (
          <div className="mb-4 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
            <span>
              <strong>Focus Session Active:</strong> Saving changes will immediately update the active blocking rules in your browser.
            </span>
          </div>
        )}

        {/* Tab Toggle */}
        <div className="flex items-center gap-2 mb-4 p-1 bg-muted rounded-xl self-start">
          <button
            type="button"
            onClick={() => setActiveTab('sites')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'sites'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Blocked Websites ({enabledCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Anti-Bypass Policies</span>
          </button>
        </div>

        {/* Tab 1: Sites */}
        {activeTab === 'sites' && (
          <div className="space-y-4 flex-1 overflow-y-auto pr-1">
            {/* Add Custom Domain Form */}
            <form onSubmit={handleAddDomain} className="space-y-2">
              <label className="block text-xs font-semibold text-foreground">
                Add Website to Block
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. reddit.com or twitch.tv"
                  value={newDomain}
                  onChange={(e) => {
                    setNewDomain(e.target.value);
                    setDomainError(null);
                  }}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <Button type="submit" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Add Domain
                </Button>
              </div>
              {domainError && (
                <p className="text-[11px] text-rose-500 font-medium">{domainError}</p>
              )}
            </form>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
              <span className="text-muted-foreground font-medium">Quick presets:</span>
              <button
                type="button"
                onClick={() => handlePresetSelect('all')}
                className="px-2 py-0.5 rounded-md border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                Enable All
              </button>
              <button
                type="button"
                onClick={() => handlePresetSelect('social')}
                className="px-2 py-0.5 rounded-md border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                Social Media
              </button>
              <button
                type="button"
                onClick={() => handlePresetSelect('video')}
                className="px-2 py-0.5 rounded-md border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                Video & Streaming
              </button>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-2 py-0.5 rounded-md border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                title="Reset to default recommended study blocklist"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Defaults
              </button>
            </div>

            {/* Blocklist Table / Items */}
            <div className="space-y-1.5 border border-border/80 rounded-2xl p-2 bg-muted/20 max-h-56 overflow-y-auto">
              {items.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No websites in blocklist. Add a domain above to begin.
                </p>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/60 hover:border-border transition-colors text-xs"
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 select-none">
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={() => handleToggle(item.id)}
                        className="rounded border-border text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                      />
                      <span
                        className={`font-mono text-xs truncate ${
                          item.enabled ? 'text-foreground font-semibold' : 'text-muted-foreground line-through opacity-60'
                        }`}
                      >
                        {item.domain}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-muted text-muted-foreground shrink-0">
                        {item.category}
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      className="p-1 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-2 shrink-0"
                      title="Remove domain"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Settings (Anti-Bypass Policies) */}
        {activeTab === 'settings' && (
          <div className="space-y-5 flex-1 overflow-y-auto pr-1 text-xs">
            {/* Pause Behavior Setting */}
            <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-2.5">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary-600" />
                <h3 className="font-semibold text-foreground text-sm">
                  Pause Anti-Bypass Protection
                </h3>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Choose what happens to distracting websites when you hit the Pause button on the Pomodoro timer:
              </p>

              <div className="space-y-2 pt-1">
                <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-border bg-card cursor-pointer">
                  <input
                    type="radio"
                    name="pauseBehavior"
                    value="keep_blocking"
                    checked={currentSettings.pauseBehavior === 'keep_blocking'}
                    onChange={() =>
                      setCurrentSettings((prev) => ({ ...prev, pauseBehavior: 'keep_blocking' }))
                    }
                    className="mt-0.5 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="font-semibold text-foreground block">
                      Keep blocking active (Recommended)
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Prevents opening distracting tabs on quick study pauses or bathroom breaks.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-border bg-card cursor-pointer">
                  <input
                    type="radio"
                    name="pauseBehavior"
                    value="pause_blocking"
                    checked={currentSettings.pauseBehavior === 'pause_blocking'}
                    onChange={() =>
                      setCurrentSettings((prev) => ({ ...prev, pauseBehavior: 'pause_blocking' }))
                    }
                    className="mt-0.5 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="font-semibold text-foreground block">
                      Temporarily allow websites during pause
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Removes blocking rules while paused; re-engages blocking as soon as timer resumes.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Completion Policy Setting */}
            <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-2.5">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <h3 className="font-semibold text-foreground text-sm">
                  Session Completion Policy
                </h3>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Choose how websites are unblocked when the Pomodoro timer reaches 0:00:
              </p>

              <div className="space-y-2 pt-1">
                <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-border bg-card cursor-pointer">
                  <input
                    type="radio"
                    name="completeBehavior"
                    value="keep_until_end"
                    checked={currentSettings.completeBehavior === 'keep_until_end'}
                    onChange={() =>
                      setCurrentSettings((prev) => ({ ...prev, completeBehavior: 'keep_until_end' }))
                    }
                    className="mt-0.5 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="font-semibold text-foreground block">
                      Keep blocking active until explicitly ended (Recommended)
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Gives you time to review notes or start a break without impulse visits to social media.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-border bg-card cursor-pointer">
                  <input
                    type="radio"
                    name="completeBehavior"
                    value="auto_release"
                    checked={currentSettings.completeBehavior === 'auto_release'}
                    onChange={() =>
                      setCurrentSettings((prev) => ({ ...prev, completeBehavior: 'auto_release' }))
                    }
                    className="mt-0.5 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="font-semibold text-foreground block">
                      Auto-unblock on interval completion
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Automatically restores browsing access as soon as the interval timer chime sounds.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-border mt-4">
          <span className="text-xs text-muted-foreground">
            {savedNotice ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Saved & Synced with Extension!
              </span>
            ) : (
              `${enabledCount} of ${items.length} websites active`
            )}
          </span>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveAndApply}
              isLoading={isSaving}
              leftIcon={<Check className="w-3.5 h-3.5" />}
            >
              Save & Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
