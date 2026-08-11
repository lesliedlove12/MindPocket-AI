import React, { useState, useEffect } from 'react';
import {
  Bell,
  FolderPlus,
  Cloud,
  Download,
  Upload,
  Crown,
  Info,
  Trash2,
  Plus,
  X,
  Lock,
  RefreshCw,
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { AppSettings, Category } from '../types';
import { SubscriptionService, SubscriptionInfo } from '../services/subscriptionService';

interface SettingsScreenProps {
  settings: AppSettings;
  categories: Category[];
  totalMemoriesCount: number;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onAddCategory: (categoryName: string) => void;
  onOpenProModal: (rationale?: string) => void;
  onExportBackup: () => void;
  onImportBackup: (jsonString: string) => void;
  onDeleteAllMemories: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  categories,
  totalMemoriesCount,
  onUpdateSettings,
  onAddCategory,
  onOpenProModal,
  onExportBackup,
  onImportBackup,
  onDeleteAllMemories,
}) => {
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [showManageSubModal, setShowManageSubModal] = useState(false);
  
  const [subInfo, setSubInfo] = useState<SubscriptionInfo>(() => SubscriptionService.getSubscriptionInfo());
  const [subStatusMessage, setSubStatusMessage] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Sync subscription state when modal or settings change
  useEffect(() => {
    const updated = SubscriptionService.getSubscriptionInfo();
    setSubInfo(updated);
  }, [settings.isPro, showManageSubModal]);

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    // Free users can add up to 2 custom categories
    const customCatsCount = categories.filter((c) => !c.isDefault).length;
    if (!settings.isPro && customCatsCount >= 2) {
      setShowAddCategoryModal(false);
      onOpenProModal('Unlimited custom categories require MindPocket Pro ($6.99/month or $69.99/year).');
      return;
    }

    onAddCategory(newCategoryName.trim());
    setNewCategoryName('');
    setShowAddCategoryModal(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          onImportBackup(content);
          setImportStatus('Backup restored successfully!');
          setTimeout(() => setImportStatus(null), 3500);
        } catch (err) {
          setImportStatus('Failed to parse backup file.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleRestorePurchases = async () => {
    setSubStatusMessage('Checking subscription records...');
    const res = await SubscriptionService.restorePurchases();
    setSubStatusMessage(res.message);
    if (res.restored) {
      onUpdateSettings({ isPro: true });
      setSubInfo(res.info);
    }
    setTimeout(() => setSubStatusMessage(null), 4000);
  };

  const handleCancelSub = async () => {
    const res = await SubscriptionService.cancelSubscription();
    setSubStatusMessage(res.message);
    setSubInfo(res.info);
  };

  const handleReactivateSub = async () => {
    const res = await SubscriptionService.reactivateSubscription();
    setSubStatusMessage(res.message);
    setSubInfo(res.info);
    onUpdateSettings({ isPro: true });
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-200">
      {/* Title Header */}
      <div className="pt-1">
        <h2 className="text-2xl font-serif font-bold text-[#5A5A40] dark:text-stone-100 tracking-tight">
          Settings & Preferences
        </h2>
        <p className="text-xs text-[#7B8E7E] dark:text-stone-400">
          Manage notifications, custom categories, backups, and subscription.
        </p>
      </div>

      {/* PRO SUBSCRIPTION BANNER & MANAGEMENT */}
      <div className="p-5 rounded-3xl bg-[#7B8E7E] text-[#F9F7F2] shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-serif font-bold text-base">
              <Crown className="w-5 h-5 fill-[#F9F7F2]" />
              <span>MindPocket Pro</span>
              {settings.isPro && (
                <span className="px-2 py-0.5 bg-[#5A5A40] text-white text-[10px] rounded-full uppercase font-bold tracking-wider">
                  ACTIVE
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-[#F9F7F2]/90">
              {settings.isPro
                ? `Plan: ${subInfo.plan === 'yearly' ? '$69.99/year' : '$6.99/month'} • All features unlocked!`
                : 'Unlock unlimited photo/voice memories, cloud sync, and smart reminders for $6.99/month or $69.99/year.'}
            </p>
          </div>

          {!settings.isPro ? (
            <button
              onClick={() => onOpenProModal()}
              className="px-4 py-2 bg-[#F9F7F2] text-[#5A5A40] text-xs font-bold rounded-xl hover:bg-white transition-colors shrink-0 shadow-sm"
            >
              Upgrade to Pro
            </button>
          ) : (
            <button
              onClick={() => setShowManageSubModal(true)}
              className="px-3 py-1.5 bg-[#5A5A40] text-white text-xs font-bold rounded-xl hover:bg-[#4A4A33] transition-colors shrink-0 shadow-sm"
            >
              Manage
            </button>
          )}
        </div>

        {/* Subscription details footer bar in setting */}
        <div className="pt-2 border-t border-white/20 flex items-center justify-between text-xs text-[#F9F7F2]/90">
          <button
            onClick={handleRestorePurchases}
            className="hover:underline font-semibold flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Restore Purchases
          </button>

          {settings.isPro && subInfo.renewsAt && (
            <span className="text-[11px] font-medium opacity-90">
              {subInfo.cancelAtPeriodEnd ? 'Expires' : 'Renews'}:{' '}
              {new Date(subInfo.renewsAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          )}
        </div>

        {subStatusMessage && (
          <div className="p-2.5 bg-white/10 rounded-xl text-xs font-semibold text-center text-white">
            {subStatusMessage}
          </div>
        )}
      </div>

      {/* 1. NOTIFICATIONS */}
      <section className="bg-white dark:bg-stone-800 rounded-3xl border border-[#E5E0D8] dark:border-stone-700 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EAE3D5] dark:bg-stone-700 text-[#5A5A40] dark:text-stone-200 flex items-center justify-center font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif font-bold text-base text-[#3C3C3B] dark:text-stone-100 block">
                Notifications & Reminders
              </span>
              <span className="text-xs text-[#7B8E7E] dark:text-stone-400">
                Send alerts when memory reminders arrive
              </span>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={(e) =>
                onUpdateSettings({ notificationsEnabled: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#E5E0D8] peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E5E0D8] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5A5A40]"></div>
          </label>
        </div>
      </section>

      {/* 2. CATEGORIES MANAGEMENT */}
      <section className="bg-white dark:bg-stone-800 rounded-3xl border border-[#E5E0D8] dark:border-stone-700 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EAE3D5] dark:bg-stone-700 text-[#5A5A40] dark:text-stone-200 flex items-center justify-center font-bold">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif font-bold text-base text-[#3C3C3B] dark:text-stone-100 block">
                Categories
              </span>
              <span className="text-xs text-[#7B8E7E] dark:text-stone-400">
                {categories.length} total categories
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowAddCategoryModal(true)}
            className="px-3 py-1.5 bg-[#F2EDE4] dark:bg-stone-700 hover:bg-[#EAE3D5] text-[#5A5A40] dark:text-stone-200 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Custom Category
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {categories.map((c) => (
            <span
              key={c.id}
              className="px-3 py-1 rounded-xl bg-[#F2EDE4] dark:bg-stone-700 text-[#5A5A40] dark:text-stone-200 text-xs font-medium"
            >
              {c.name}
            </span>
          ))}
        </div>
      </section>

      {/* 3. PRIVACY */}
      <section className="bg-white dark:bg-stone-800 rounded-3xl border border-[#E5E0D8] dark:border-stone-700 p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#EAE3D5] dark:bg-stone-700 text-[#5A5A40] dark:text-stone-200 flex items-center justify-center font-bold">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <span className="font-serif font-bold text-base text-[#3C3C3B] dark:text-stone-100 block">
              100% Private Digital Pocket
            </span>
            <span className="text-xs text-[#7B8E7E] dark:text-stone-400">
              Your memories stay privately on your device.
            </span>
          </div>
        </div>

        <p className="text-xs text-[#7B8E7E] dark:text-stone-300 leading-relaxed pt-1">
          MindPocket does not track followers, public profiles, feeds, or advertising data. It is purely your personal digital vault for private memories.
        </p>
      </section>

      {/* 4. BACKUP / SYNC */}
      <section className="bg-white dark:bg-stone-800 rounded-3xl border border-[#E5E0D8] dark:border-stone-700 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#EAE3D5] dark:bg-stone-700 text-[#5A5A40] dark:text-stone-200 flex items-center justify-center font-bold">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <span className="font-serif font-bold text-base text-[#3C3C3B] dark:text-stone-100 block">
              Backup & Sync
            </span>
            <span className="text-xs text-[#7B8E7E] dark:text-stone-400">
              Export or import your saved pocket data
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => {
              if (!settings.isPro) {
                onOpenProModal('Cloud Sync & encrypted backups require MindPocket Pro ($6.99/month or $69.99/year).');
                return;
              }
              onExportBackup();
            }}
            className="p-3 bg-[#F2EDE4] dark:bg-stone-700 hover:bg-[#EAE3D5] rounded-2xl border border-[#E5E0D8] dark:border-stone-600 text-xs font-bold text-[#5A5A40] dark:text-stone-200 flex flex-col items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-[#5A5A40]" />
            <span>Export Backup</span>
          </button>

          <label className="p-3 bg-[#F2EDE4] dark:bg-stone-700 hover:bg-[#EAE3D5] rounded-2xl border border-[#E5E0D8] dark:border-stone-600 text-xs font-bold text-[#5A5A40] dark:text-stone-200 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-[#7B8E7E]" />
            <span>Import Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={(e) => {
                if (!settings.isPro) {
                  onOpenProModal('Cloud Sync & encrypted backups require MindPocket Pro ($6.99/month or $69.99/year).');
                  return;
                }
                handleFileUpload(e);
              }}
              className="hidden"
            />
          </label>
        </div>

        {importStatus && (
          <p className="text-xs font-bold text-[#7B8E7E] text-center">
            {importStatus}
          </p>
        )}
      </section>

      {/* 5. ABOUT MINDPOCKET */}
      <section className="bg-white dark:bg-stone-800 rounded-3xl border border-[#E5E0D8] dark:border-stone-700 p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F2EDE4] dark:bg-stone-700 text-[#5A5A40] dark:text-stone-200 flex items-center justify-center font-bold">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <span className="font-serif font-bold text-base text-[#3C3C3B] dark:text-stone-100 block">
              About MindPocket
            </span>
            <span className="text-xs text-[#7B8E7E] dark:text-stone-400">Version 1.0.0</span>
          </div>
        </div>

        <p className="text-xs text-[#7B8E7E] dark:text-stone-300 leading-relaxed">
          MindPocket was built to be simple, clean, and reliable.
          <br />
          <span className="italic font-serif font-bold text-[#5A5A40] dark:text-amber-200">
            “Keep it in your pocket. Find it when you need it.”
          </span>
        </p>
      </section>

      {/* 6. DELETE ALL MEMORIES */}
      <section className="pt-2">
        <button
          onClick={() => setShowDeleteAllModal(true)}
          className="w-full py-3 px-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors"
        >
          <Trash2 className="w-4 h-4" /> Delete All Memories ({totalMemoriesCount})
        </button>
      </section>

      {/* MANAGE SUBSCRIPTION MODAL */}
      {showManageSubModal && (
        <div className="fixed inset-0 z-50 bg-[#3C3C3B]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-[#E5E0D8] dark:border-stone-800 shadow-2xl max-w-md w-full space-y-5">
            <div className="flex items-center justify-between border-b border-[#E5E0D8] dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 fill-[#5A5A40] text-[#5A5A40]" />
                <h3 className="font-serif font-bold text-[#3C3C3B] dark:text-stone-100 text-lg">
                  Manage Subscription
                </h3>
              </div>
              <button
                onClick={() => setShowManageSubModal(false)}
                className="p-1.5 rounded-full text-[#3C3C3B]/40 hover:text-[#3C3C3B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#F2EDE4] dark:bg-stone-800 rounded-2xl border border-[#E5E0D8] dark:border-stone-700 flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#7B8E7E] block text-[10px] uppercase">Plan</span>
                  <span className="font-serif font-bold text-sm text-[#3C3C3B] dark:text-stone-100">
                    {subInfo.plan === 'yearly' ? '$69.99/year' : '$6.99/month'}
                  </span>
                </div>
                <span className="px-2.5 py-1 bg-[#5A5A40] text-white rounded-full font-bold text-[10px] uppercase">
                  {subInfo.status}
                </span>
              </div>

              {subInfo.subscriptionId && (
                <div className="p-3 bg-[#F2EDE4] dark:bg-stone-800 rounded-2xl border border-[#E5E0D8] dark:border-stone-700">
                  <span className="font-bold text-[#7B8E7E] block text-[10px] uppercase">Subscription Ref</span>
                  <span className="font-mono text-xs text-[#3C3C3B] dark:text-stone-200">
                    {subInfo.subscriptionId}
                  </span>
                </div>
              )}

              {subInfo.renewsAt && (
                <div className="p-3 bg-[#F2EDE4] dark:bg-stone-800 rounded-2xl border border-[#E5E0D8] dark:border-stone-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#5A5A40]" />
                  <div>
                    <span className="font-bold text-[#7B8E7E] block text-[10px] uppercase">
                      {subInfo.cancelAtPeriodEnd ? 'Expires On' : 'Next Billing Date'}
                    </span>
                    <span className="font-semibold text-[#3C3C3B] dark:text-stone-100">
                      {new Date(subInfo.renewsAt).toLocaleDateString(undefined, {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              )}

              {subInfo.cancelAtPeriodEnd ? (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-2">
                  <p className="font-medium">
                    Your subscription is canceled and will end on{' '}
                    {subInfo.renewsAt ? new Date(subInfo.renewsAt).toLocaleDateString() : 'period end'}.
                  </p>
                  <button
                    onClick={handleReactivateSub}
                    className="w-full py-2 bg-[#5A5A40] text-white rounded-xl font-bold text-xs shadow-sm hover:bg-[#4A4A33]"
                  >
                    Reactivate Auto-Renewal
                  </button>
                </div>
              ) : (
                <div className="pt-2">
                  <button
                    onClick={handleCancelSub}
                    className="w-full py-2.5 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-rose-700 dark:text-rose-400 rounded-xl font-bold text-xs hover:bg-stone-200 transition-colors"
                  >
                    Cancel Subscription
                  </button>
                  <p className="text-[10px] text-[#7B8E7E] text-center mt-1.5">
                    Canceling takes effect at the end of your current billing period.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowManageSubModal(false)}
                className="w-full py-2.5 bg-[#5A5A40] text-white font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 bg-[#3C3C3B]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-[#E5E0D8] dark:border-stone-800 shadow-2xl max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-[#3C3C3B] dark:text-stone-100 text-base">
                Create Custom Category
              </h3>
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="p-1 rounded-full text-[#3C3C3B]/40 hover:text-[#3C3C3B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category Name (e.g. Work, Garden)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] dark:border-stone-700 bg-[#F2EDE4] dark:bg-stone-800 text-[#3C3C3B] dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B8E7E]"
                autoFocus
                required
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#7B8E7E]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#5A5A40] text-[#F9F7F2] font-bold text-xs shadow-sm hover:bg-[#4A4A33]"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 bg-[#3C3C3B]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-[#E5E0D8] dark:border-stone-800 shadow-2xl max-w-sm w-full space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-serif font-bold text-[#3C3C3B] dark:text-stone-100 text-lg">
                Delete All Memories?
              </h3>
              <p className="text-xs text-[#7B8E7E] mt-1">
                Are you sure you want to delete all {totalMemoriesCount} memories? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowDeleteAllModal(false)}
                className="px-4 py-2 bg-[#F2EDE4] dark:bg-stone-800 text-[#5A5A40] dark:text-stone-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteAllMemories();
                  setShowDeleteAllModal(false);
                }}
                className="px-5 py-2 bg-rose-600 text-white rounded-xl text-xs font-extrabold hover:bg-rose-700"
              >
                Yes, Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
