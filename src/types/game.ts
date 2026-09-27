export type Language = 'he' | 'en';
export type VoiceGender = 'female' | 'male';

export interface CardItem {
  id: string;
  word: string;
  word_he?: string;
  word_en?: string;
  wordEn?: string;
  category: string;
  category_en?: string;
  categoryEn?: string;
  image: string;
  imageUrl?: string;
  fallback?: string;
  hint?: string;
  hint_en?: string;
  hintEn?: string;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  isHost: boolean;
  streak: number;
  isOnline?: boolean;
}

export type GameScreen = 'welcome' | 'host' | 'player-join' | 'join' | 'player-lobby' | 'game' | 'game-over';

export interface RoomSettings {
  turnDuration: number; // in seconds, e.g. 15
  selectedCategories: string[];
  maxRounds: number;
}
