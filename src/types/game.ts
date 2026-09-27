export type Language = 'he' | 'en';

export interface CardItem {
  id: string;
  word: string;
  word_he?: string;
  word_en?: string;
  category: string;
  category_en?: string;
  image: string;
  hint?: string;
  hint_en?: string;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  isHost: boolean;
  streak: number;
}

export type GameScreen = 'welcome' | 'host' | 'player-join' | 'player-lobby' | 'game' | 'game-over';

export interface RoomSettings {
  turnDuration: number; // in seconds, e.g. 15
  selectedCategories: string[];
  maxRounds: number;
}
