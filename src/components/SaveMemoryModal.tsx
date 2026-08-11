import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Keyboard,
  Mic,
  Camera,
  Sparkles,
  MapPin,
  Clock,
  Check,
  Upload,
  Square,
} from 'lucide-react';
import { Category, InputMethod, Memory } from '../types';
import { CategoryIcon } from './CategoryIcon';

interface SaveMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (memory: Partial<Memory>) => void;
  categories: Category[];
  initialMemory?: Memory | null; // If editing
  isPro?: boolean;
  onOpenProModal?: (rationale?: string) => void;
}

export const SaveMemoryModal: React.FC<SaveMemoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  initialMemory,
  isPro = false,
  onOpenProModal,
}) => {
  const [inputMethod, setInputMethod] = useState<InputMethod>('type');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Home');
  const [location, setLocation] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recognitionRef = useRef<any>(null);
  const recordingTimerRef = useRef<any>(null);

  // AI & loading states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial memory if editing
  useEffect(() => {
    if (initialMemory) {
      setTitle(initialMemory.title);
      setDescription(initialMemory.description);
      setCategory(initialMemory.category);
      setLocation(initialMemory.location || '');
      setReminderDate(initialMemory.reminderDate || '');
      setPhotoUrl(initialMemory.photoUrl);
      setInputMethod(initialMemory.inputMethod);
      setVoiceTranscript(initialMemory.voiceTranscript || '');
    } else {
      resetForm();
    }
  }, [initialMemory, isOpen]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('Home');
    setLocation('');
    setReminderDate('');
    setPhotoUrl(undefined);
    setVoiceTranscript('');
    setInputMethod('type');
    setIsRecording(false);
    setRecordingSeconds(0);
    setAiMessage(null);
  };

  if (!isOpen) return null;

  // Voice recording handler
  const startRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    setVoiceTranscript('');
    setAiMessage('Listening... speak what you want to remember.');

    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          setVoiceTranscript(currentTranscript);
          setDescription(currentTranscript);
        };

        recognition.onerror = (err: any) => {
          console.warn('Speech recognition error:', err);
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('Speech recognition not available:', e);
      }
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    // Auto trigger smart suggest for voice note
    if (description || voiceTranscript) {
      triggerSmartSuggest(description || voiceTranscript);
    }
  };

  // Photo Upload Handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setPhotoUrl(base64);
        setIsAnalyzing(true);
        setAiMessage('Analyzing photo to auto-fill title & category...');

        try {
          const res = await fetch('/api/analyze-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: base64,
              mimeType: file.type || 'image/jpeg',
            }),
          });
          const data = await res.json();
          if (data.suggestion) {
            setTitle(data.suggestion.title || 'Photo Memory');
            setCategory(data.suggestion.category || 'Storage');
            if (data.suggestion.description) {
              setDescription(data.suggestion.description);
            }
            if (data.suggestion.suggestedLocation) {
              setLocation(data.suggestion.suggestedLocation);
            }
            setAiMessage('✨ Smart title and category populated from photo!');
          }
        } catch (err) {
          console.error(err);
          setAiMessage('Photo attached!');
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // AI Smart Suggest Trigger
  const triggerSmartSuggest = async (textToSuggest?: string) => {
    const query = textToSuggest || description || title;
    if (!query.trim()) {
      setAiMessage('Type or speak something first to get smart suggestions.');
      return;
    }

    setIsAnalyzing(true);
    setAiMessage('Suggesting title and category...');

    try {
      const res = await fetch('/api/smart-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: query,
          voiceTranscript: voiceTranscript,
        }),
      });
      const data = await res.json();
      if (data.suggestion) {
        if (data.suggestion.title) setTitle(data.suggestion.title);
        if (data.suggestion.category) {
          // match existing category name or fallback
          const matched = categories.find(
            (c) => c.name.toLowerCase() === data.suggestion.category.toLowerCase()
          );
          setCategory(matched ? matched.name : data.suggestion.category);
        }
        if (data.suggestion.suggestedLocation && !location) {
          setLocation(data.suggestion.suggestedLocation);
        }
        setAiMessage(`✨ Suggested: "${data.suggestion.title}" under ${data.suggestion.category}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() && !title.trim() && !photoUrl) {
      alert('Please enter a description or attach a photo to save this memory.');
      return;
    }

    const finalTitle = title.trim() || description.trim().slice(0, 30) || 'Saved Memory';

    onSave({
      title: finalTitle,
      description: description.trim() || 'Photo memory',
      category: category,
      location: location.trim() || undefined,
      reminderDate: reminderDate || undefined,
      inputMethod,
      photoUrl,
      voiceTranscript: voiceTranscript || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#3C3C3B]/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-[#E5E0D8] dark:border-stone-800 shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md px-5 py-4 border-b border-[#E5E0D8] dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[#EAE3D5] text-[#5A5A40] flex items-center justify-center font-bold">
              +
            </span>
            <div>
              <h2 className="text-lg font-serif font-bold text-[#5A5A40] dark:text-stone-100">
                {initialMemory ? 'Edit Memory' : 'Save to MindPocket'}
              </h2>
              <p className="text-xs text-[#7B8E7E] dark:text-stone-400">Put it here. Find it when you need it.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#3C3C3B]/40 hover:text-[#3C3C3B] hover:bg-[#F2EDE4] dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Input Method Selector Choices */}
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#F2EDE4] dark:bg-stone-800/80 rounded-2xl">
            <button
              type="button"
              onClick={() => setInputMethod('type')}
              className={`flex items-center justify-center gap-2 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                inputMethod === 'type'
                  ? 'bg-white dark:bg-stone-700 text-[#5A5A40] dark:text-stone-100 shadow-sm'
                  : 'text-[#3C3C3B]/60 hover:text-[#3C3C3B]'
              }`}
            >
              <Keyboard className="w-4 h-4 text-[#5A5A40]" />
              <span>⌨️ Type It</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!isPro) {
                  onOpenProModal?.('Voice & Say memories require MindPocket Pro ($6.99/month or $69.99/year).');
                  return;
                }
                setInputMethod('voice');
                if (!isRecording && !voiceTranscript) startRecording();
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                inputMethod === 'voice'
                  ? 'bg-white dark:bg-stone-700 text-[#5A5A40] dark:text-stone-100 shadow-sm'
                  : 'text-[#3C3C3B]/60 hover:text-[#3C3C3B]'
              }`}
            >
              <Mic className="w-4 h-4 text-[#5A5A40]" />
              <span>🎤 Say It</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!isPro) {
                  onOpenProModal?.('Photo & Snap memories require MindPocket Pro ($6.99/month or $69.99/year).');
                  return;
                }
                setInputMethod('photo');
                if (!photoUrl) fileInputRef.current?.click();
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                inputMethod === 'photo'
                  ? 'bg-white dark:bg-stone-700 text-[#5A5A40] dark:text-stone-100 shadow-sm'
                  : 'text-[#3C3C3B]/60 hover:text-[#3C3C3B]'
              }`}
            >
              <Camera className="w-4 h-4 text-[#7B8E7E]" />
              <span>📷 Snap It</span>
            </button>
          </div>

          {/* Voice Input Section */}
          {inputMethod === 'voice' && (
            <div className="p-4 bg-[#F2EDE4] dark:bg-stone-800/80 border border-[#E5E0D8] dark:border-stone-700 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse shadow-lg'
                    : 'bg-[#5A5A40] text-[#F9F7F2] shadow-md'
                }`}
              >
                <Mic className="w-8 h-8" />
              </div>

              <div>
                <p className="font-serif font-bold text-sm text-[#3C3C3B] dark:text-stone-100">
                  {isRecording ? `Recording... (${recordingSeconds}s)` : 'Tap to Record Voice Note'}
                </p>
                <p className="text-xs text-[#7B8E7E]">
                  Speak naturally, e.g. “Living room paint is Behr Swiss Coffee”
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isRecording ? (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <Square className="w-4 h-4 fill-white" /> Stop & Convert
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="px-4 py-2 bg-[#5A5A40] hover:bg-[#4A4A33] text-[#F9F7F2] rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <Mic className="w-4 h-4" /> Start Recording
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Photo Input Section */}
          {inputMethod === 'photo' && (
            <div className="space-y-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              {photoUrl ? (
                <div className="relative rounded-2xl overflow-hidden border border-[#E5E0D8] dark:border-stone-700 bg-[#EAE3D5] group">
                  <img src={photoUrl} alt="Attached" className="w-full h-44 object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl(undefined)}
                    className="absolute top-2 right-2 p-1.5 bg-[#3C3C3B]/80 text-white rounded-full hover:bg-rose-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 px-4 border-2 border-dashed border-[#E5E0D8] dark:border-stone-700 hover:border-[#7B8E7E] rounded-2xl flex flex-col items-center justify-center text-[#7B8E7E] hover:text-[#5A5A40] transition-all bg-[#F2EDE4]/60 dark:bg-stone-800/40"
                >
                  <Upload className="w-8 h-8 text-[#7B8E7E] mb-2" />
                  <span className="font-bold text-xs text-[#3C3C3B] dark:text-stone-200">
                    Upload or Take Photo
                  </span>
                  <span className="text-[11px] text-[#7B8E7E] mt-1">
                    Snap storage boxes, paint cans, or receipts
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Description / Memory Input Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#5A5A40] dark:text-stone-300 uppercase tracking-wider">
                What do you want to remember?
              </label>
              <button
                type="button"
                onClick={() => triggerSmartSuggest()}
                disabled={isAnalyzing || !description.trim()}
                className="text-xs font-bold text-[#7B8E7E] hover:underline flex items-center gap-1 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" /> Auto-Suggest Title
              </button>
            </div>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. I put the spare key inside the blue flower pot by the porch..."
              className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E5E0D8] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#3C3C3B] dark:text-stone-100 placeholder:text-[#3C3C3B]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B8E7E] resize-none"
              required={!photoUrl}
            />
          </div>

          {/* Quick Example Chips for quick testing */}
          {!initialMemory && !description && (
            <div>
              <p className="text-[11px] font-semibold text-[#7B8E7E] uppercase tracking-wider mb-1.5">
                Quick Examples (Tap to test):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Spare key in blue flower pot',
                  'Living room paint is Behr Swiss Coffee',
                  'Parked on Level 3, Row B',
                  'Son’s shoe size is 8',
                ].map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => {
                      setDescription(ex);
                      triggerSmartSuggest(ex);
                    }}
                    className="px-2.5 py-1 bg-[#F2EDE4] hover:bg-[#EAE3D5] dark:bg-stone-800 text-[#5A5A40] dark:text-stone-300 rounded-lg text-xs font-medium transition-colors border border-[#E5E0D8] dark:border-stone-700"
                  >
                    “{ex}”
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI Banner Message */}
          {aiMessage && (
            <div className="p-2.5 rounded-xl bg-[#F2EDE4] dark:bg-stone-800 border border-[#E5E0D8] text-[#5A5A40] dark:text-stone-200 text-xs font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#7B8E7E] shrink-0 animate-spin" />
              <span>{aiMessage}</span>
            </div>
          )}

          {/* Title Field */}
          <div>
            <label className="block text-xs font-bold text-[#5A5A40] dark:text-stone-300 uppercase tracking-wider mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Spare Key, Parking Spot, Paint Color"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#3C3C3B] dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B8E7E]"
            />
          </div>

          {/* Category Picker */}
          <div>
            <label className="block text-xs font-bold text-[#5A5A40] dark:text-stone-300 uppercase tracking-wider mb-2">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isSelected = category.toLowerCase() === cat.name.toLowerCase();
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-[#5A5A40] text-[#F9F7F2] border-[#5A5A40] font-bold shadow-sm'
                        : 'bg-white dark:bg-stone-800 text-[#3C3C3B] dark:text-stone-300 border-[#E5E0D8] dark:border-stone-700 hover:bg-[#F2EDE4]'
                    }`}
                  >
                    <CategoryIcon name={cat.iconName} className="w-3.5 h-3.5" />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location Field */}
          <div>
            <label className="block text-xs font-bold text-[#5A5A40] dark:text-stone-300 uppercase tracking-wider mb-1">
              Location / Position (Optional)
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#7B8E7E] absolute left-3 top-3" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Blue flower pot, Level 3 Row B, Storage Box 4"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#E5E0D8] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#3C3C3B] dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B8E7E]"
              />
            </div>
          </div>

          {/* Reminder Date Field */}
          <div>
            <label className="block text-xs font-bold text-[#5A5A40] dark:text-stone-300 uppercase tracking-wider mb-1">
              Set Reminder (Optional)
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-[#5A5A40] absolute left-3 top-3" />
              <input
                type="datetime-local"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#E5E0D8] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#3C3C3B] dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B8E7E]"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-[#E5E0D8] dark:border-stone-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-[#7B8E7E] hover:text-[#3C3C3B] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A33] text-[#F9F7F2] font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{initialMemory ? 'Update Memory' : 'Save to MindPocket'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
