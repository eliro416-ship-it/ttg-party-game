import { io, Socket } from 'socket.io-client';
import { Player, Language } from '../types/game';

let socket: Socket | null = null;

export function getSessionToken(): string {
  if (typeof window === 'undefined') return 'token-ssr';
  let token = sessionStorage.getItem('ttg_session_token');
  if (!token) {
    token = 'st-' + Math.random().toString(36).substring(2, 12) + '-' + Date.now();
    sessionStorage.setItem('ttg_session_token', token);
  }
  return token;
}

export function getGameSocket(): Socket {
  if (!socket) {
    socket = io(typeof window !== 'undefined' ? window.location.origin : '', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 4000,
    });
  }
  return socket;
}

export interface TurnStartedPayload {
  isHolder: boolean;
  cardIndex: number;
  totalCards: number;
  holderId: string;
  holderName: string;
  holderAvatar: string;
  // Provided only to holder!
  image: string | null;
  word: string | null;
  category: string;
  hint: string | null;
  wordLength: number;
  turnEndTime: number;
  turnDuration: number;
  isBonus?: boolean;
  players: (Player & { isHolder: boolean; isOnline: boolean })[];
}

export interface RoundWonPayload {
  winnerId: string;
  winnerName: string;
  winnerAvatar: string;
  word: string;
  image: string;
  points: number;
  isBonus?: boolean;
  scores: { id: string; name: string; score: number; streak: number }[];
}

export interface TurnTimeoutPayload {
  word: string;
  image: string | null;
  reason: 'time_up' | 'skipped';
}

export interface ReactionPayload {
  reaction: 'yes' | 'no' | 'hot' | 'cold';
  senderName: string;
  timestamp: number;
}
