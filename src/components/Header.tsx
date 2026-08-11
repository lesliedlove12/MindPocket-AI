import React from 'react';
import { BookmarkCheck, Crown, Bell } from 'lucide-react';
import { AppSettings } from '../types';

interface HeaderProps {
  settings: AppSettings;
  onOpenProModal: () => void;
  pendingRemindersCount: number;
  onGoToReminders?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onOpenProModal,
  pendingRemindersCount,
  onGoToReminders,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#F2EDE4]/95 dark:bg-stone-900/95 backdrop-blur-md text-[#3C3C3B] dark:text-stone-100 border-b border-[#E5E0D8] dark:border-stone-800 px-4 py-3 sm:px-6">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#5A5A40] flex items-center justify-center text-[#F9F7F2] font-bold shadow-sm">
            <BookmarkCheck className="w-5 h-5 text-[#F9F7F2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-serif font-bold text-xl tracking-tight text-[#5A5A40] dark:text-stone-100 leading-none">
                MindPocket
              </h1>
              {settings.isPro && (
                <button
                  type="button"
                  onClick={onOpenProModal}
                  className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold bg-[#7B8E7E] text-white rounded-full uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                  title="MindPocket Pro Details"
                >
                  <Crown className="w-2.5 h-2.5" /> PRO
                </button>
              )}
            </div>
            <p className="text-[11px] text-[#3C3C3B]/70 dark:text-stone-400 font-medium italic leading-none mt-1">
              Keep it in your pocket.
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {pendingRemindersCount > 0 && (
            <button
              type="button"
              onClick={onGoToReminders}
              className="relative p-2 rounded-xl bg-[#EAE3D5] dark:bg-stone-800 hover:bg-[#E5E0D8] text-[#5A5A40] dark:text-amber-200 transition-colors"
              title={`${pendingRemindersCount} pending reminders`}
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#7B8E7E] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {pendingRemindersCount}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenProModal}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#7B8E7E] hover:bg-[#6A7D6D] text-[#F9F7F2] text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer"
            title={settings.isPro ? "MindPocket Pro Active - Click to manage" : "Unlock MindPocket Pro"}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>PRO</span>
          </button>
        </div>
      </div>
    </header>
  );
};
