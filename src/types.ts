export type InputMethod = 'type' | 'voice' | 'photo';

export interface Memory {
  id: string;
  title: string;
  description: string;
  category: string;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  inputMethod: InputMethod;
  photoUrl?: string; // base64 or object URL
  voiceTranscript?: string;
  voiceAudioUrl?: string; // base64 audio string or blob url
  reminderDate?: string; // ISO date/time string
  reminderCompleted?: boolean;
  location?: string;
  isFavorite?: boolean;
  isPinned?: boolean;
  tags?: string[];
}

export interface Category {
  id: string;
  name: string;
  iconName: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  iconBg: string;
  isDefault?: boolean;
}

export interface AppSettings {
  isPro: boolean;
  notificationsEnabled: boolean;
  autoSmartTitle: boolean;
  customCategories: Category[];
  lastBackupDate?: string;
}

export type ActiveTab = 'home' | 'memories' | 'save' | 'search' | 'settings';

export interface SmartSuggestionResult {
  title: string;
  category: string;
  description: string;
  suggestedLocation?: string | null;
  keywords?: string[];
}
