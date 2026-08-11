import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Pin,
  Edit2,
  Trash2,
  Share2,
  Play,
  Pause,
} from 'lucide-react';
import { Category, Memory } from '../types';
import { CategoryIcon } from './CategoryIcon';

interface MemoryDetailModalProps {
  memory: Memory | null;
  categoryObj?: Category;
  onClose: () => void;
  onEdit: (memory: Memory) => void;
  onDelete: (memoryId: string) => void;
  onTogglePin?: (memoryId: string) => void;
}

export const MemoryDetailModal: React.FC<MemoryDetailModalProps> = ({
  memory,
  categoryObj,
  onClose,
  onEdit,
  onDelete,
  onTogglePin,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  if (!memory) return null;

  const dateFormatted = new Date(memory.createdAt).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const reminderFormatted = memory.reminderDate
    ? new Date(memory.reminderDate).toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  const handleShare = () => {
    const textToShare = `${memory.title}\n${memory.description}${
      memory.location ? `\n📍 Location: ${memory.location}` : ''
    }\n— Saved in MindPocket`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToShare);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2500);
    }
  };

  const handleToggleAudio = () => {
    setIsPlayingAudio(!isPlayingAudio);
    if (!isPlayingAudio) {
      setTimeout(() => setIsPlayingAudio(false), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#3C3C3B]/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-[#E5E0D8] dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="p-4 bg-[#F2EDE4]/60 dark:bg-stone-800/60 border-b border-[#E5E0D8] dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EAE3D5] text-[#5A5A40]">
              <CategoryIcon name={categoryObj?.iconName || 'Tag'} className="w-3.5 h-3.5" />
              <span>{memory.category}</span>
            </span>

            {memory.isPinned && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5A5A40] bg-[#EAE3D5] px-2 py-0.5 rounded-full">
                <Pin className="w-3 h-3 fill-[#5A5A40]" /> Pinned
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {onTogglePin && (
              <button
                onClick={() => onTogglePin(memory.id)}
                className={`p-2 rounded-xl transition-colors ${
                  memory.isPinned
                    ? 'text-[#5A5A40] bg-[#EAE3D5]'
                    : 'text-[#3C3C3B]/40 hover:text-[#3C3C3B]'
                }`}
                title={memory.isPinned ? 'Unpin' : 'Pin to top'}
              >
                <Pin className={`w-4 h-4 ${memory.isPinned ? 'fill-[#5A5A40]' : ''}`} />
              </button>
            )}

            <button
              onClick={handleShare}
              className="p-2 rounded-xl text-[#3C3C3B]/40 hover:text-[#3C3C3B] hover:bg-[#F2EDE4] transition-colors"
              title="Copy / Share memory"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#3C3C3B]/40 hover:text-[#3C3C3B] hover:bg-[#F2EDE4] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div>
            <h2 className="text-xl font-serif font-bold text-[#5A5A40] dark:text-stone-100 tracking-tight mb-2">
              {memory.title}
            </h2>
            <p className="text-[#3C3C3B] dark:text-stone-200 text-base leading-relaxed whitespace-pre-wrap">
              {memory.description}
            </p>
          </div>

          {/* Photo if attached */}
          {memory.photoUrl && (
            <div className="rounded-2xl overflow-hidden border border-[#E5E0D8] dark:border-stone-700 bg-[#EAE3D5]">
              <img
                src={memory.photoUrl}
                alt={memory.title}
                className="w-full max-h-80 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {/* Voice Player */}
          {memory.inputMethod === 'voice' && (
            <div className="p-3 bg-[#F2EDE4] dark:bg-stone-800 border border-[#E5E0D8] rounded-2xl flex items-center gap-3">
              <button
                onClick={handleToggleAudio}
                className="w-10 h-10 rounded-full bg-[#5A5A40] text-[#F9F7F2] flex items-center justify-center shrink-0 shadow-md font-bold"
              >
                {isPlayingAudio ? (
                  <Pause className="w-5 h-5 fill-[#F9F7F2]" />
                ) : (
                  <Play className="w-5 h-5 fill-[#F9F7F2] ml-0.5" />
                )}
              </button>
              <div className="flex-1">
                <p className="text-xs font-serif font-bold text-[#5A5A40] dark:text-stone-200">
                  {isPlayingAudio ? 'Playing Recorded Voice Note...' : 'Recorded Voice Note'}
                </p>
                {memory.voiceTranscript && (
                  <p className="text-[11px] text-[#7B8E7E] italic mt-0.5">
                    "{memory.voiceTranscript}"
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Meta Information Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs">
            {memory.location && (
              <div className="p-3 bg-[#F2EDE4]/60 dark:bg-stone-800/60 rounded-xl border border-[#E5E0D8] dark:border-stone-700 flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#7B8E7E] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#7B8E7E] dark:text-stone-400 block uppercase text-[10px]">
                    Location / Position
                  </span>
                  <span className="font-semibold text-[#3C3C3B] dark:text-stone-200">
                    {memory.location}
                  </span>
                </div>
              </div>
            )}

            {reminderFormatted && (
              <div className="p-3 bg-[#F2EDE4]/60 dark:bg-stone-800/60 rounded-xl border border-[#E5E0D8] dark:border-stone-700 flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#5A5A40] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#7B8E7E] block uppercase text-[10px]">
                    Reminder Time
                  </span>
                  <span className="font-semibold text-[#3C3C3B] dark:text-stone-100">
                    {reminderFormatted}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-[#7B8E7E]">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Saved {dateFormatted}
            </span>
            <span className="capitalize">Input: {memory.inputMethod}</span>
          </div>

          {copiedMessage && (
            <div className="p-2.5 rounded-xl bg-[#F2EDE4] dark:bg-stone-800 text-[#5A5A40] dark:text-stone-200 text-xs font-bold text-center border border-[#E5E0D8]">
              Copied memory text to clipboard!
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-[#F2EDE4]/60 dark:bg-stone-800/60 border-t border-[#E5E0D8] dark:border-stone-800 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onDelete(memory.id);
            }}
            className="px-3.5 py-2 rounded-xl text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>

          <button
            onClick={() => {
              onClose();
              onEdit(memory);
            }}
            className="px-5 py-2 rounded-xl bg-[#5A5A40] text-[#F9F7F2] font-bold text-xs shadow-sm hover:bg-[#4A4A33] transition-all flex items-center gap-1.5"
          >
            <Edit2 className="w-4 h-4" /> Edit Memory
          </button>
        </div>
      </div>
    </div>
  );
};
