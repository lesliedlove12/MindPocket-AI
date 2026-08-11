import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Mic,
  Camera,
  Keyboard,
  Pin,
  MoreVertical,
  Trash2,
  Edit2,
  Play,
  Pause,
} from 'lucide-react';
import { Category, Memory } from '../types';
import { CategoryIcon } from './CategoryIcon';

interface MemoryCardProps {
  memory: Memory;
  categoryObj?: Category;
  onSelect: (memory: Memory) => void;
  onEdit: (memory: Memory) => void;
  onDelete: (memoryId: string) => void;
  onTogglePin?: (memoryId: string) => void;
}

export const MemoryCard: React.FC<MemoryCardProps> = ({
  memory,
  categoryObj,
  onSelect,
  onEdit,
  onDelete,
  onTogglePin,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Formatting date
  const dateFormatted = new Date(memory.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Reminder formatting
  const hasReminder = Boolean(memory.reminderDate);
  const reminderFormatted = memory.reminderDate
    ? new Date(memory.reminderDate).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  // Handle audio play simulation
  const handleToggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlayingAudio(!isPlayingAudio);
    if (!isPlayingAudio) {
      setTimeout(() => setIsPlayingAudio(false), 4000);
    }
  };

  return (
    <div
      onClick={() => onSelect(memory)}
      className="group relative bg-white dark:bg-stone-800 rounded-2xl p-5 border border-[#E5E0D8] dark:border-stone-700 shadow-sm hover:shadow-md hover:border-[#D9C5B2] transition-all cursor-pointer overflow-hidden flex flex-col justify-between"
    >
      <div>
        {/* Top Bar: Category badge, Pin, Input Method Icon, Menu */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Category Badge */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                categoryObj?.badgeBg || 'bg-[#F2EDE4] text-[#5A5A40] dark:bg-stone-700 dark:text-stone-200'
              }`}
            >
              <CategoryIcon name={categoryObj?.iconName || 'Tag'} className="w-3 h-3" />
              <span>{memory.category}</span>
            </span>

            {/* Input Method Badge */}
            <span className="inline-flex items-center gap-1 text-[11px] text-[#7B8E7E] dark:text-stone-400 font-medium">
              {memory.inputMethod === 'voice' && <Mic className="w-3 h-3 text-[#5A5A40]" />}
              {memory.inputMethod === 'photo' && <Camera className="w-3 h-3 text-[#7B8E7E]" />}
              {memory.inputMethod === 'type' && <Keyboard className="w-3 h-3 text-[#3C3C3B]/60" />}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Pin Button */}
            {onTogglePin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(memory.id);
                }}
                className={`p-1.5 rounded-lg transition-colors ${
                  memory.isPinned
                    ? 'text-[#5A5A40] bg-[#EAE3D5] dark:bg-stone-700'
                    : 'text-[#3C3C3B]/30 dark:text-stone-600 hover:text-[#5A5A40]'
                }`}
                title={memory.isPinned ? 'Unpin' : 'Pin to top'}
              >
                <Pin className={`w-3.5 h-3.5 ${memory.isPinned ? 'fill-[#5A5A40]' : ''}`} />
              </button>
            )}

            {/* Menu dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1.5 rounded-lg text-[#3C3C3B]/50 hover:text-[#3C3C3B] hover:bg-[#F2EDE4] dark:hover:bg-stone-700 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-7 w-32 bg-white dark:bg-stone-800 rounded-xl shadow-xl border border-[#E5E0D8] dark:border-stone-700 py-1.5 z-20"
                >
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(memory);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs font-medium text-[#3C3C3B] dark:text-stone-200 hover:bg-[#F2EDE4] dark:hover:bg-stone-700 flex items-center gap-2"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#5A5A40]" /> Edit
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(memory.id);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Title & Description */}
        <h3 className="font-serif font-bold text-[#3C3C3B] dark:text-stone-100 text-base tracking-tight mb-1 group-hover:text-[#5A5A40] dark:group-hover:text-amber-200 transition-colors">
          {memory.title}
        </h3>
        <p className="text-[#7B8E7E] dark:text-stone-300 text-sm leading-snug line-clamp-2 mb-3 font-normal">
          {memory.description}
        </p>

        {/* Photo Preview if attached */}
        {memory.photoUrl && (
          <div className="my-2.5 rounded-xl overflow-hidden border border-[#E5E0D8] dark:border-stone-700 max-h-48 bg-[#EAE3D5] flex items-center justify-center relative group/img">
            <img
              src={memory.photoUrl}
              alt={memory.title}
              className="w-full h-36 object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* Voice Audio Player if attached */}
        {memory.inputMethod === 'voice' && (
          <div
            onClick={handleToggleAudio}
            className="my-2 p-2.5 bg-[#F2EDE4] dark:bg-stone-700/60 border border-[#E5E0D8] dark:border-stone-600 rounded-xl flex items-center gap-2.5 text-[#5A5A40] dark:text-stone-200 text-xs font-medium hover:bg-[#EAE3D5] transition-colors"
          >
            <button
              className="w-7 h-7 rounded-full bg-[#5A5A40] text-[#F9F7F2] flex items-center justify-center shrink-0 shadow-sm"
            >
              {isPlayingAudio ? (
                <Pause className="w-3.5 h-3.5 fill-[#F9F7F2]" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-[#F9F7F2] ml-0.5" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate text-[11px]">
                {isPlayingAudio ? 'Playing voice note...' : 'Voice Note Recorded'}
              </p>
              <div className="w-full bg-[#E5E0D8] dark:bg-stone-600 h-1 rounded-full mt-1 overflow-hidden">
                <div
                  className={`h-full bg-[#7B8E7E] transition-all duration-300 ${
                    isPlayingAudio ? 'w-3/4 animate-pulse' : 'w-0'
                  }`}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Meta Footer: Location tag, Reminder tag, Date */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#F9F7F2] dark:border-stone-700/60 text-xs text-[#3C3C3B]/50 dark:text-stone-500 mt-2">
        <div className="flex items-center gap-2 flex-wrap">
          {memory.location && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#5A5A40] dark:text-stone-300 bg-[#F2EDE4] dark:bg-stone-700 px-2 py-0.5 rounded-md">
              <MapPin className="w-3 h-3 text-[#7B8E7E]" />
              <span className="truncate max-w-[140px]">{memory.location}</span>
            </span>
          )}

          {hasReminder && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                memory.reminderCompleted
                  ? 'bg-[#F2EDE4] text-[#3C3C3B]/50 dark:bg-stone-700'
                  : 'bg-[#EAE3D5] text-[#5A5A40] dark:bg-stone-700 dark:text-amber-200'
              }`}
            >
              <Clock className="w-3 h-3 text-[#5A5A40] dark:text-amber-200" />
              <span>{reminderFormatted}</span>
            </span>
          )}
        </div>

        <span className="text-[11px] text-[#3C3C3B]/50 dark:text-stone-400 ml-auto flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {dateFormatted}
        </span>
      </div>
    </div>
  );
};
