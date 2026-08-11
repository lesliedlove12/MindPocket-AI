import React, { useState } from 'react';
import { Search, X, Sparkles } from 'lucide-react';
import { Category, Memory } from '../types';
import { MemoryCard } from './MemoryCard';

interface SearchScreenProps {
  memories: Memory[];
  categories: Category[];
  onSelectMemory: (memory: Memory) => void;
  onEditMemory: (memory: Memory) => void;
  onDeleteMemory: (memoryId: string) => void;
  onTogglePin: (memoryId: string) => void;
}

const QUICK_SEARCH_CHIPS = [
  'key',
  'Christmas',
  'paint',
  'storage',
  'car',
  'shoe size',
  'drawer',
  'passports',
];

export const SearchScreen: React.FC<SearchScreenProps> = ({
  memories,
  categories,
  onSelectMemory,
  onEditMemory,
  onDeleteMemory,
  onTogglePin,
}) => {
  const [query, setQuery] = useState('');

  // Natural language query matching
  const matchingMemories = query.trim()
    ? memories.filter((m) => {
        const q = query.toLowerCase();
        const titleMatch = m.title.toLowerCase().includes(q);
        const descMatch = m.description.toLowerCase().includes(q);
        const catMatch = m.category.toLowerCase().includes(q);
        const locMatch = m.location?.toLowerCase().includes(q);
        const voiceMatch = m.voiceTranscript?.toLowerCase().includes(q);
        const tagMatch = m.tags?.some((t) => t.toLowerCase().includes(q));

        return titleMatch || descMatch || catMatch || locMatch || voiceMatch || tagMatch;
      })
    : [];

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-200">
      {/* Title */}
      <div className="pt-1">
        <h2 className="text-2xl font-serif font-bold text-[#5A5A40] dark:text-stone-100 tracking-tight flex items-center gap-2">
          <Search className="w-6 h-6 text-[#5A5A40]" />
          <span>Search My Memories</span>
        </h2>
        <p className="text-xs text-[#7B8E7E] dark:text-stone-400">
          Find anything in your pocket with natural words or location phrases.
        </p>
      </div>

      {/* Large Input Box */}
      <div className="relative">
        <Search className="w-5 h-5 text-[#5A5A40] absolute left-4 top-4" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by word, place, or category (e.g., 'key', 'paint')..."
          autoFocus
          className="w-full pl-12 pr-10 py-3.5 rounded-2xl border-2 border-[#5A5A40] bg-white dark:bg-stone-800 text-[#3C3C3B] dark:text-stone-100 placeholder:text-[#3C3C3B]/40 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#7B8E7E]/20 shadow-md transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-3.5 p-1 rounded-full text-[#3C3C3B]/40 hover:text-[#3C3C3B] dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Popular Example Chips */}
      <div>
        <p className="text-xs font-bold text-[#7B8E7E] uppercase tracking-wider mb-2">
          Quick Natural Searches:
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_SEARCH_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => setQuery(chip)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                query.toLowerCase() === chip.toLowerCase()
                  ? 'bg-[#5A5A40] text-[#F9F7F2] border-[#5A5A40] shadow-sm'
                  : 'bg-white dark:bg-stone-800 text-[#3C3C3B] dark:text-stone-200 border-[#E5E0D8] dark:border-stone-700 hover:bg-[#F2EDE4]'
              }`}
            >
              🔍 "{chip}"
            </button>
          ))}
        </div>
      </div>

      {/* Search Results */}
      {query.trim() ? (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7B8E7E]">
              Found {matchingMemories.length} matching {matchingMemories.length === 1 ? 'memory' : 'memories'}
            </span>
            {matchingMemories.length > 0 && (
              <span className="text-xs text-[#5A5A40] font-semibold">
                Showing best matches
              </span>
            )}
          </div>

          {matchingMemories.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-stone-800 rounded-3xl border border-dashed border-[#E5E0D8] dark:border-stone-700 space-y-2">
              <p className="font-serif font-bold text-base text-[#3C3C3B] dark:text-stone-200">
                No memories found for "{query}"
              </p>
              <p className="text-xs text-[#7B8E7E] max-w-xs mx-auto">
                Check spelling or try searching a broader word like "home" or "storage".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {matchingMemories.map((mem) => {
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
      ) : (
        /* Zero state suggestions */
        <div className="p-6 bg-[#F2EDE4] dark:bg-stone-800 rounded-3xl border border-[#E5E0D8] dark:border-stone-700 space-y-3">
          <div className="flex items-center gap-2 text-[#5A5A40] dark:text-stone-200 font-serif font-bold text-base">
            <Sparkles className="w-4 h-4 text-[#7B8E7E]" />
            <span>Search Ideas</span>
          </div>
          <p className="text-xs text-[#7B8E7E] dark:text-stone-300 leading-relaxed">
            MindPocket searches across titles, descriptions, locations, voice notes, and photos! Try typing where you put something (e.g. "flower pot", "attic", "row B").
          </p>
        </div>
      )}
    </div>
  );
};
