import React, { useState } from 'react';
import {
  Search,
  Plus,
  Layers,
  ArrowUpDown,
  X,
} from 'lucide-react';
import { Category, Memory } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { MemoryCard } from './MemoryCard';

interface MemoriesScreenProps {
  memories: Memory[];
  categories: Category[];
  selectedCategoryFilter: string;
  onSelectCategoryFilter: (catName: string) => void;
  onOpenSaveModal: () => void;
  onSelectMemory: (memory: Memory) => void;
  onEditMemory: (memory: Memory) => void;
  onDeleteMemory: (memoryId: string) => void;
  onTogglePin: (memoryId: string) => void;
}

export const MemoriesScreen: React.FC<MemoriesScreenProps> = ({
  memories,
  categories,
  selectedCategoryFilter,
  onSelectCategoryFilter,
  onOpenSaveModal,
  onSelectMemory,
  onEditMemory,
  onDeleteMemory,
  onTogglePin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title' | 'reminders'>('newest');
  const [filterType, setFilterType] = useState<'all' | 'reminders' | 'pinned' | 'photos' | 'voice'>(
    'all'
  );

  // Filter memories
  const filteredMemories = memories
    .filter((m) => {
      // Category filter
      if (
        selectedCategoryFilter !== 'all' &&
        m.category.toLowerCase() !== selectedCategoryFilter.toLowerCase()
      ) {
        return false;
      }

      // Filter type
      if (filterType === 'reminders' && !m.reminderDate) return false;
      if (filterType === 'pinned' && !m.isPinned) return false;
      if (filterType === 'photos' && !m.photoUrl) return false;
      if (filterType === 'voice' && m.inputMethod !== 'voice') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = m.title.toLowerCase().includes(q);
        const inDesc = m.description.toLowerCase().includes(q);
        const inCategory = m.category.toLowerCase().includes(q);
        const inLocation = m.location?.toLowerCase().includes(q);
        const inTags = m.tags?.some((t) => t.toLowerCase().includes(q));
        return inTitle || inDesc || inCategory || inLocation || inTags;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'reminders') {
        if (!a.reminderDate) return 1;
        if (!b.reminderDate) return -1;
        return new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime();
      }
      return 0;
    });

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Title & Add Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#5A5A40] dark:text-stone-100 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-[#5A5A40]" />
            <span>My Memories</span>
          </h2>
          <p className="text-xs text-[#7B8E7E] dark:text-stone-400">
            {filteredMemories.length} {filteredMemories.length === 1 ? 'memory' : 'memories'} saved
          </p>
        </div>

        <button
          onClick={onOpenSaveModal}
          className="px-4 py-2 bg-[#5A5A40] hover:bg-[#4A4A33] text-[#F9F7F2] font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Save</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#7B8E7E] absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter memories..."
          className="w-full pl-10 pr-9 py-2.5 rounded-2xl border border-[#E5E0D8] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#3C3C3B] dark:text-stone-100 placeholder:text-[#3C3C3B]/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#7B8E7E] shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-3 text-[#3C3C3B]/40 hover:text-[#3C3C3B]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Categories Horizontal Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => onSelectCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all border ${
            selectedCategoryFilter === 'all'
              ? 'bg-[#5A5A40] text-[#F9F7F2] border-[#5A5A40] shadow-sm'
              : 'bg-white dark:bg-stone-800 text-[#3C3C3B] dark:text-stone-300 border-[#E5E0D8] dark:border-stone-700 hover:bg-[#F2EDE4]'
          }`}
        >
          All ({memories.length})
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategoryFilter.toLowerCase() === cat.name.toLowerCase();
          const count = memories.filter(
            (m) => m.category.toLowerCase() === cat.name.toLowerCase()
          ).length;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategoryFilter(cat.name)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all border ${
                isSelected
                  ? 'bg-[#5A5A40] text-[#F9F7F2] border-[#5A5A40] shadow-sm'
                  : 'bg-white dark:bg-stone-800 text-[#3C3C3B] dark:text-stone-300 border-[#E5E0D8] dark:border-stone-700 hover:bg-[#F2EDE4]'
              }`}
            >
              <CategoryIcon name={cat.iconName} className="w-3.5 h-3.5" />
              <span>{cat.name}</span>
              <span className="text-[10px] opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Sub Filter Chips & Sort Dropdown */}
      <div className="flex items-center justify-between gap-2 flex-wrap pt-1 text-xs">
        <div className="flex items-center gap-1 flex-wrap">
          {[
            { id: 'all', label: 'All' },
            { id: 'reminders', label: '⏰ Reminders' },
            { id: 'pinned', label: '📌 Pinned' },
            { id: 'photos', label: '📷 Photos' },
            { id: 'voice', label: '🎤 Voice' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as any)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                filterType === f.id
                  ? 'bg-[#EAE3D5] text-[#5A5A40] dark:bg-stone-700 dark:text-amber-200 font-bold'
                  : 'text-[#3C3C3B]/60 hover:text-[#3C3C3B] dark:hover:text-stone-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-1 text-[#7B8E7E] ml-auto">
          <ArrowUpDown className="w-3.5 h-3.5" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent text-xs font-semibold text-[#3C3C3B] dark:text-stone-300 focus:outline-none cursor-pointer"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title">By title</option>
            <option value="reminders">By reminder date</option>
          </select>
        </div>
      </div>

      {/* Memories List / Grid */}
      {filteredMemories.length === 0 ? (
        <div className="p-10 text-center bg-white dark:bg-stone-800 rounded-3xl border border-dashed border-[#E5E0D8] dark:border-stone-700 space-y-3">
          {memories.length === 0 ? (
            <>
              <p className="font-serif font-bold text-base text-[#3C3C3B] dark:text-stone-200">
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
            </>
          ) : (
            <>
              <p className="font-serif font-bold text-base text-[#3C3C3B] dark:text-stone-200">
                No memories match your filter.
              </p>
              <p className="text-xs text-[#7B8E7E]">
                Try clearing search keywords or category filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  onSelectCategoryFilter('all');
                  setFilterType('all');
                }}
                className="px-4 py-2 bg-[#F2EDE4] dark:bg-stone-700 text-[#5A5A40] dark:text-stone-200 text-xs font-bold rounded-xl"
              >
                Reset Filters
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {filteredMemories.map((mem) => {
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
    </div>
  );
};
