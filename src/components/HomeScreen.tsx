import React from 'react';
import {
  Plus,
  Search,
  BookmarkCheck,
  ArrowRight,
  Folder,
  Clock,
  Mic,
  Camera,
  Keyboard,
  Heart,
  ChevronRight,
  Crown,
} from 'lucide-react';
import { Category, Memory, AppSettings } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { MemoryCard } from './MemoryCard';

interface HomeScreenProps {
  memories: Memory[];
  categories: Category[];
  settings: AppSettings;
  onOpenSaveModal: () => void;
  onSelectMemory: (memory: Memory) => void;
  onEditMemory: (memory: Memory) => void;
  onDeleteMemory: (memoryId: string) => void;
  onTogglePin: (memoryId: string) => void;
  onSelectCategory: (categoryName: string) => void;
  onGoToTab: (tab: any) => void;
  onOpenProModal: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  memories,
  categories,
  settings,
  onOpenSaveModal,
  onSelectMemory,
  onEditMemory,
  onDeleteMemory,
  onTogglePin,
  onSelectCategory,
  onGoToTab,
  onOpenProModal,
}) => {
  // Get pinned memories first, then recent
  const pinnedMemories = memories.filter((m) => m.isPinned);
  const recentMemories = [...memories]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const pendingReminders = memories.filter(
    (m) => m.reminderDate && new Date(m.reminderDate).getTime() > Date.now()
  );

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-200">
      {/* Hero Save Pocket Section - Styled after Natural Tones theme */}
      <section className="relative overflow-hidden rounded-[28px] bg-[#5A5A40] text-[#F9F7F2] p-6 sm:p-8 shadow-md border border-[#4A4A33]">
        <div className="relative z-10 space-y-4 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAE3D5]/20 text-[#F9F7F2] text-xs font-semibold">
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>Digital Memory Pocket</span>
          </div>

          <div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#F9F7F2] leading-tight">
              MindPocket
            </h2>
            <p className="text-[#D9C5B2] font-serif text-sm sm:text-base mt-1 italic opacity-90">
              “Keep it in your pocket. Find it when you need it.”
            </p>
          </div>

          <p className="text-[#F9F7F2]/80 text-xs sm:text-sm max-w-sm leading-relaxed">
            Your private vault for keys, paint colors, parking spots, or box numbers.
          </p>

          {/* LARGE OBVIOUS SAVE BUTTON */}
          <div className="pt-2 w-full max-w-xs">
            <button
              onClick={onOpenSaveModal}
              className="w-full py-4 px-6 rounded-2xl bg-[#F9F7F2] text-[#5A5A40] font-bold text-base shadow-lg hover:bg-white active:scale-98 transition-all flex items-center justify-center gap-3 border border-[#E5E0D8]"
            >
              <span className="text-2xl font-black leading-none">+</span>
              <span className="font-serif font-medium text-lg">Save to MindPocket</span>
            </button>
          </div>

          {/* Quick Input choices hints */}
          <div className="pt-2 flex items-center justify-center gap-4 text-xs font-semibold text-[#F9F7F2]/75 border-t border-[#F9F7F2]/20 w-full">
            <span className="flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5" /> Type
            </span>
            <span className="flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5" /> Say
            </span>
            <span className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" /> Snap
            </span>
          </div>
        </div>
      </section>

      {/* 🔍 SEARCH MY MEMORIES BAR */}
      <section>
        <button
          onClick={() => onGoToTab('search')}
          className="w-full p-4 rounded-2xl bg-white dark:bg-stone-800 border border-[#E5E0D8] dark:border-stone-700 shadow-sm hover:shadow-md hover:border-[#7B8E7E] transition-all flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAE3D5] dark:bg-stone-700 text-[#5A5A40] dark:text-stone-200 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif font-bold text-base text-[#3C3C3B] dark:text-stone-100 block">
                🔍 Search My Memories
              </span>
              <span className="text-xs text-[#7B8E7E] dark:text-stone-400">
                Search "key", "Christmas", "paint", "car"...
              </span>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-[#7B8E7E] group-hover:text-[#5A5A40] group-hover:translate-x-1 transition-all" />
        </button>
      </section>

      {/* Pending Reminders Banner if any */}
      {pendingReminders.length > 0 && (
        <section className="p-4 rounded-2xl bg-[#EAE3D5]/80 dark:bg-stone-800 border border-[#D9C5B2] dark:border-stone-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#5A5A40] text-[#F9F7F2] flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif font-bold text-sm text-[#3C3C3B] dark:text-stone-100 block">
                {pendingReminders.length} Upcoming Reminder{pendingReminders.length > 1 ? 's' : ''}
              </span>
              <span className="text-xs text-[#7B8E7E] dark:text-stone-400">
                Next: {pendingReminders[0].title} (
                {new Date(pendingReminders[0].reminderDate!).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                )
              </span>
            </div>
          </div>
          <button
            onClick={() => onGoToTab('memories')}
            className="px-3 py-1.5 bg-[#5A5A40] text-[#F9F7F2] text-xs font-bold rounded-xl hover:bg-[#4A4A33] transition-colors"
          >
            View
          </button>
        </section>
      )}

      {/* Pinned Memories Section */}
      {pinnedMemories.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg text-[#5A5A40] dark:text-stone-200 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#7B8E7E]" /> Pinned Memories
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pinnedMemories.map((mem) => {
              const catObj = categories.find(
                (c) => c.name.toLowerCase() === mem.category.toLowerCase()
              );
              return (
                <MemoryCard
                  key={mem.id}
                  memory={mem}
                  categoryObj={catObj}
                  onSelect={onSelectMemory}
                  onEdit={onEditMemory}
                  onDelete={onDeleteMemory}
                  onTogglePin={onTogglePin}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* ❤️ RECENT MEMORIES */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-xl text-[#5A5A40] dark:text-stone-100 tracking-tight flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#B87D65] fill-[#B87D65]" />
            <span>Recent Memories</span>
            <span className="text-xs font-sans font-semibold text-[#7B8E7E]">({memories.length})</span>
          </h3>

          <button
            onClick={() => onGoToTab('memories')}
            className="text-xs font-bold text-[#7B8E7E] hover:text-[#5A5A40] hover:underline flex items-center gap-1"
          >
            View All ({memories.length}) <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentMemories.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-stone-800 rounded-3xl border border-dashed border-[#E5E0D8] dark:border-stone-700 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EAE3D5] text-[#5A5A40] flex items-center justify-center mx-auto font-bold">
              <BookmarkCheck className="w-6 h-6" />
            </div>
            <p className="font-serif font-bold text-base text-[#3C3C3B] dark:text-stone-100">
              Your MindPocket is empty
            </p>
            <p className="text-xs text-[#7B8E7E] max-w-xs mx-auto">
              Save your first memory so you can easily find it whenever you need it.
            </p>
            <button
              onClick={onOpenSaveModal}
              className="px-5 py-2.5 bg-[#5A5A40] text-[#F9F7F2] rounded-xl text-xs font-bold shadow-sm hover:bg-[#4A4A33] transition-colors inline-flex items-center gap-1.5 mx-auto"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Save to MindPocket</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentMemories.map((mem) => {
              const catObj = categories.find(
                (c) => c.name.toLowerCase() === mem.category.toLowerCase()
              );
              return (
                <MemoryCard
                  key={mem.id}
                  memory={mem}
                  categoryObj={catObj}
                  onSelect={onSelectMemory}
                  onEdit={onEditMemory}
                  onDelete={onDeleteMemory}
                  onTogglePin={onTogglePin}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* 📂 CATEGORIES GRID */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-xl text-[#5A5A40] dark:text-stone-100 tracking-tight flex items-center gap-2">
            <Folder className="w-4 h-4 text-[#7B8E7E]" />
            <span>Categories</span>
          </h3>
          <span className="text-xs text-[#7B8E7E] dark:text-stone-400">{categories.length} folders</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {categories.map((cat) => {
            const count = memories.filter(
              (m) => m.category.toLowerCase() === cat.name.toLowerCase()
            ).length;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.name);
                  onGoToTab('memories');
                }}
                className="p-3.5 rounded-2xl bg-white dark:bg-stone-800 border border-[#E5E0D8] dark:border-stone-700 hover:border-[#7B8E7E] hover:shadow-md transition-all text-left flex items-center gap-3 group"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${cat.iconBg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                >
                  <CategoryIcon name={cat.iconName} className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="font-serif font-bold text-sm text-[#3C3C3B] dark:text-stone-100 block truncate">
                    {cat.name}
                  </span>
                  <span className="text-[11px] text-[#7B8E7E] font-medium">
                    {count} {count === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* PRO Upgrade teaser if not Pro */}
      {!settings.isPro && (
        <section className="p-5 rounded-3xl bg-[#7B8E7E] text-[#F9F7F2] flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-bold font-serif text-base">
              <Crown className="w-4 h-4 fill-[#F9F7F2]" />
              <span>MindPocket Pro</span>
            </div>
            <p className="text-xs font-semibold text-[#F9F7F2]/90 max-w-xs">
              Unlimited photo & voice memories, cloud sync, and smart reminders.
            </p>
          </div>
          <button
            onClick={onOpenProModal}
            className="px-4 py-2 bg-[#F9F7F2] text-[#5A5A40] text-xs font-bold rounded-xl hover:bg-white transition-colors shadow-sm shrink-0"
          >
            Upgrade
          </button>
        </section>
      )}
    </div>
  );
};
