import React, { useState, useEffect } from 'react';
import {
  ActiveTab,
  AppSettings,
  Category,
  Memory,
} from './types';
import { DEFAULT_CATEGORIES, INITIAL_MEMORIES } from './data/initialData';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { MemoriesScreen } from './components/MemoriesScreen';
import { SearchScreen } from './components/SearchScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { SaveMemoryModal } from './components/SaveMemoryModal';
import { MemoryDetailModal } from './components/MemoryDetailModal';
import { ProUpgradeModal } from './components/ProUpgradeModal';
import { SubscriptionService } from './services/subscriptionService';

export default function App() {
  // Load initial memories from localStorage or default
  const [memories, setMemories] = useState<Memory[]>(() => {
    try {
      const savedV2 = localStorage.getItem('mindpocket_memories_v2');
      if (savedV2) return JSON.parse(savedV2);

      const savedV1 = localStorage.getItem('mindpocket_memories_v1');
      if (savedV1) {
        const parsed: Memory[] = JSON.parse(savedV1);
        // Filter out legacy hardcoded sample memories if needed
        const seedIds = ['mem-1', 'mem-2', 'mem-3', 'mem-4', 'mem-5', 'mem-6'];
        return parsed.filter((m) => !seedIds.includes(m.id));
      }
    } catch (e) {
      console.warn('Failed to load saved memories:', e);
    }
    return INITIAL_MEMORIES;
  });

  // Load custom categories from localStorage or default
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('mindpocket_categories_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load categories:', e);
    }
    return DEFAULT_CATEGORIES;
  });

  // Load app settings synced with SubscriptionService
  const [settings, setSettings] = useState<AppSettings>(() => {
    const subInfo = SubscriptionService.getSubscriptionInfo();
    let initialSettings: AppSettings = {
      isPro: subInfo.isPro,
      notificationsEnabled: true,
      autoSmartTitle: true,
      customCategories: [],
    };
    try {
      const saved = localStorage.getItem('mindpocket_settings_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        initialSettings = { ...parsed, isPro: subInfo.isPro || parsed.isPro };
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
    return initialSettings;
  });

  // Active view tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');

  // Filter state for Memories screen
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Modal states
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [viewingMemory, setViewingMemory] = useState<Memory | null>(null);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [proRationale, setProRationale] = useState<string | null>(null);
  const [checkoutNotice, setCheckoutNotice] = useState<string | null>(null);

  const handleOpenProModal = (rationale?: string) => {
    setProRationale(rationale || null);
    setIsProModalOpen(true);
  };

  // Verify Stripe Checkout return parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const checkoutStatus = urlParams.get('checkout_status');

    if (sessionId) {
      SubscriptionService.verifySession(sessionId).then((result) => {
        if (result.verified && result.info.isPro) {
          setSettings((prev) => ({ ...prev, isPro: true }));
          setCheckoutNotice('🎉 Welcome to MindPocket Pro! Your subscription was verified with Stripe.');
        } else {
          setCheckoutNotice('⚠️ Subscription verification pending or payment incomplete.');
        }
        // Clean URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    } else if (checkoutStatus === 'canceled') {
      setCheckoutNotice('Checkout was canceled. You can upgrade to Pro anytime!');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mindpocket_memories_v2', JSON.stringify(memories));
    } catch (e) {}
  }, [memories]);

  useEffect(() => {
    try {
      localStorage.setItem('mindpocket_categories_v1', JSON.stringify(categories));
    } catch (e) {}
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem('mindpocket_settings_v1', JSON.stringify(settings));
    } catch (e) {}
  }, [settings]);

  // Handle Save or Update memory
  const handleSaveMemory = (memoryData: Partial<Memory>) => {
    if (editingMemory) {
      // Update existing
      setMemories((prev) =>
        prev.map((m) =>
          m.id === editingMemory.id
            ? {
                ...m,
                ...memoryData,
                updatedAt: new Date().toISOString(),
              }
            : m
        )
      );
      setEditingMemory(null);
    } else {
      // Create new
      const newMem: Memory = {
        id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title: memoryData.title || 'Saved Memory',
        description: memoryData.description || '',
        category: memoryData.category || 'Home',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        inputMethod: memoryData.inputMethod || 'type',
        photoUrl: memoryData.photoUrl,
        voiceTranscript: memoryData.voiceTranscript,
        reminderDate: memoryData.reminderDate,
        location: memoryData.location,
        isPinned: false,
        isFavorite: false,
      };

      setMemories((prev) => [newMem, ...prev]);
    }
  };

  // Delete memory
  const handleDeleteMemory = (memoryId: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== memoryId));
  };

  // Toggle Pin
  const handleTogglePin = (memoryId: string) => {
    setMemories((prev) =>
      prev.map((m) => (m.id === memoryId ? { ...m, isPinned: !m.isPinned } : m))
    );
  };

  // Add Custom Category
  const handleAddCategory = (categoryName: string) => {
    const exists = categories.some(
      (c) => c.name.toLowerCase() === categoryName.toLowerCase()
    );
    if (!exists) {
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        name: categoryName,
        iconName: 'Tag',
        badgeBg: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
        badgeText: 'text-amber-800 dark:text-amber-200',
        borderColor: 'border-amber-200',
        iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-300',
        isDefault: false,
      };
      setCategories((prev) => [...prev, newCat]);
    }
  };

  // Backup Export
  const handleExportBackup = () => {
    const exportData = {
      app: 'MindPocket',
      exportedAt: new Date().toISOString(),
      memories,
      categories,
      settings,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MindPocket_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Backup Import
  const handleImportBackup = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.memories)) {
        setMemories(data.memories);
      }
      if (Array.isArray(data.categories)) {
        setCategories(data.categories);
      }
    } catch (e) {
      console.error('Import failed:', e);
    }
  };

  // Delete All Memories
  const handleDeleteAllMemories = () => {
    setMemories([]);
  };

  // Count pending reminders
  const pendingRemindersCount = memories.filter(
    (m) => m.reminderDate && new Date(m.reminderDate).getTime() > Date.now()
  ).length;

  const viewingCategoryObj = viewingMemory
    ? categories.find(
        (c) => c.name.toLowerCase() === viewingMemory.category.toLowerCase()
      )
    : undefined;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-amber-500 selection:text-slate-950 flex flex-col">
      {/* Container wrapper focused on mobile ergonomics */}
      <div className="w-full max-w-md mx-auto min-h-screen bg-slate-50 dark:bg-slate-900 shadow-2xl relative flex flex-col border-x border-slate-200/60 dark:border-slate-800">
        {/* App Header */}
        <Header
          settings={settings}
          onOpenProModal={() => handleOpenProModal()}
          pendingRemindersCount={pendingRemindersCount}
          onGoToReminders={() => {
            setSelectedCategoryFilter('all');
            setActiveTab('memories');
          }}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-5 overflow-y-auto">
          {checkoutNotice && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between gap-2 shadow-sm">
              <span>{checkoutNotice}</span>
              <button
                onClick={() => setCheckoutNotice(null)}
                className="text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded hover:bg-amber-500/20"
              >
                ✕
              </button>
            </div>
          )}

          {activeTab === 'home' && (
            <HomeScreen
              memories={memories}
              categories={categories}
              settings={settings}
              onOpenSaveModal={() => {
                setEditingMemory(null);
                setIsSaveModalOpen(true);
              }}
              onSelectMemory={(mem) => setViewingMemory(mem)}
              onEditMemory={(mem) => {
                setEditingMemory(mem);
                setIsSaveModalOpen(true);
              }}
              onDeleteMemory={handleDeleteMemory}
              onTogglePin={handleTogglePin}
              onSelectCategory={(catName) => {
                setSelectedCategoryFilter(catName);
                setActiveTab('memories');
              }}
              onGoToTab={(tab) => setActiveTab(tab)}
              onOpenProModal={(rat) => handleOpenProModal(rat)}
            />
          )}

          {activeTab === 'memories' && (
            <MemoriesScreen
              memories={memories}
              categories={categories}
              selectedCategoryFilter={selectedCategoryFilter}
              onSelectCategoryFilter={setSelectedCategoryFilter}
              onOpenSaveModal={() => {
                setEditingMemory(null);
                setIsSaveModalOpen(true);
              }}
              onSelectMemory={(mem) => setViewingMemory(mem)}
              onEditMemory={(mem) => {
                setEditingMemory(mem);
                setIsSaveModalOpen(true);
              }}
              onDeleteMemory={handleDeleteMemory}
              onTogglePin={handleTogglePin}
            />
          )}

          {activeTab === 'search' && (
            <SearchScreen
              memories={memories}
              categories={categories}
              onSelectMemory={(mem) => setViewingMemory(mem)}
              onEditMemory={(mem) => {
                setEditingMemory(mem);
                setIsSaveModalOpen(true);
              }}
              onDeleteMemory={handleDeleteMemory}
              onTogglePin={handleTogglePin}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsScreen
              settings={settings}
              categories={categories}
              totalMemoriesCount={memories.length}
              onUpdateSettings={(newSet) =>
                setSettings((prev) => ({ ...prev, ...newSet }))
              }
              onAddCategory={handleAddCategory}
              onOpenProModal={(rat) => handleOpenProModal(rat)}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              onDeleteAllMemories={handleDeleteAllMemories}
            />
          )}
        </main>

        {/* Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenSaveModal={() => {
            setEditingMemory(null);
            setIsSaveModalOpen(true);
          }}
          totalMemoriesCount={memories.length}
        />

        {/* Modals */}
        <SaveMemoryModal
          isOpen={isSaveModalOpen}
          onClose={() => {
            setIsSaveModalOpen(false);
            setEditingMemory(null);
          }}
          onSave={handleSaveMemory}
          categories={categories}
          initialMemory={editingMemory}
          isPro={settings.isPro}
          onOpenProModal={(rat) => handleOpenProModal(rat)}
        />

        <MemoryDetailModal
          memory={viewingMemory}
          categoryObj={viewingCategoryObj}
          onClose={() => setViewingMemory(null)}
          onEdit={(mem) => {
            setViewingMemory(null);
            setEditingMemory(mem);
            setIsSaveModalOpen(true);
          }}
          onDelete={(id) => {
            setViewingMemory(null);
            handleDeleteMemory(id);
          }}
          onTogglePin={handleTogglePin}
        />

        <ProUpgradeModal
          isOpen={isProModalOpen}
          onClose={() => {
            setIsProModalOpen(false);
            setProRationale(null);
          }}
          settings={settings}
          rationale={proRationale}
          onUpgrade={() => setSettings((prev) => ({ ...prev, isPro: true }))}
        />
      </div>
    </div>
  );
}
