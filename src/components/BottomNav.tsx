import React from 'react';
import { Home, Layers, Plus, Search, Settings } from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenSaveModal: () => void;
  totalMemoriesCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenSaveModal,
  totalMemoriesCount,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#F2EDE4]/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-[#E5E0D8] dark:border-stone-800 px-3 py-2">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {/* Home Tab */}
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'home'
              ? 'text-[#5A5A40] dark:text-stone-100 font-bold bg-[#EAE3D5] dark:bg-stone-800'
              : 'text-[#3C3C3B]/60 dark:text-stone-400 hover:text-[#5A5A40]'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[11px] leading-none">Home</span>
        </button>

        {/* Memories Tab */}
        <button
          onClick={() => onSelectTab('memories')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all relative ${
            activeTab === 'memories'
              ? 'text-[#5A5A40] dark:text-stone-100 font-bold bg-[#EAE3D5] dark:bg-stone-800'
              : 'text-[#3C3C3B]/60 dark:text-stone-400 hover:text-[#5A5A40]'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[11px] leading-none">Memories</span>
          {totalMemoriesCount > 0 && (
            <span className="absolute top-0 right-2 w-2 h-2 bg-[#7B8E7E] rounded-full" />
          )}
        </button>

        {/* Center Prominent + Save Button */}
        <div className="flex justify-center -mt-5">
          <button
            onClick={onOpenSaveModal}
            className="w-14 h-14 rounded-2xl bg-[#5A5A40] hover:bg-[#4A4A33] text-[#F9F7F2] font-bold shadow-md flex flex-col items-center justify-center border-4 border-[#F9F7F2] dark:border-stone-900 transition-all hover:scale-105 active:scale-95"
            title="Save to MindPocket"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
            <span className="sr-only">+ Save</span>
          </button>
        </div>

        {/* Search Tab */}
        <button
          onClick={() => onSelectTab('search')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'search'
              ? 'text-[#5A5A40] dark:text-stone-100 font-bold bg-[#EAE3D5] dark:bg-stone-800'
              : 'text-[#3C3C3B]/60 dark:text-stone-400 hover:text-[#5A5A40]'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[11px] leading-none">Search</span>
        </button>

        {/* Settings Tab */}
        <button
          onClick={() => onSelectTab('settings')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'settings'
              ? 'text-[#5A5A40] dark:text-stone-100 font-bold bg-[#EAE3D5] dark:bg-stone-800'
              : 'text-[#3C3C3B]/60 dark:text-stone-400 hover:text-[#5A5A40]'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[11px] leading-none">Settings</span>
        </button>
      </div>
    </nav>
  );
};
