import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { Player, CardItem } from '../types/game';

export const SUPABASE_URL = 'https://mjvglamfcaaanuoxlgau.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_I1TvNYw5RSrAb-qe6YgFyg_zsUb8kd1';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 25,
    },
  },
});

export interface SupabasePresencePlayer {
  id: string;
  name: string;
  icon?: string;
  avatar?: string;
  score: number;
  streak?: number;
  isHost?: boolean;
}

export interface NewTurnPayload {
  holderId: string;
  holderName: string;
  holderAvatar?: string;
  category: string;
  wordLength: number;
  card: CardItem;
  cardIndex?: number;
  wordHash?: string;
}

export interface ScoreUpdatePayload {
  scores: Record<string, number>;
}

export interface RoundStartPayload {
  category: string;
  wordLength: number;
  roundEndsAt: number;
  roundEndTime?: number;
  endTime?: number;
  duration?: number;
  holderId: string;
  holderName?: string;
  holderAvatar?: string;
  cardIndex?: number;
  cardId?: string;
  card?: CardItem;
  word?: string;
  wordHash?: string;
  hint?: string | null;
  turnDuration?: number;
  streakWinner?: {
    winnerId: string;
    winnerName: string;
    winnerAvatar?: string;
    points: number;
  };
}

export interface CorrectGuessPayload {
  winnerId: string;
  winnerName: string;
  winnerAvatar: string;
  word: string;
  imageUrl?: string | null;
  points: number;
  nextHolderId: string;
  nextIndex: number;
  nextCardIndex: number;
}

export interface TurnTimeoutPayload {
  missedWord?: string;
  word?: string;
  imageUrl?: string | null;
  reason?: 'time_up' | 'skipped';
  nextHolderId: string;
  nextCard?: any;
  nextIndex?: number;
  nextCardIndex?: number;
}

export interface ReactionPayload {
  reaction: 'yes' | 'no' | 'hot' | 'cold';
  senderName: string;
  timestamp: number;
}

export interface HintPayload {
  hint: string;
}

export interface SyncStatePayload {
  category: string;
  wordLength: number;
  roundEndsAt: number;
  holderId: string;
  holderName: string;
  holderAvatar: string;
  roundStatus: 'waiting' | 'active' | 'ended';
  cardIndex?: number;
  cardId?: string;
  wordHash?: string;
  turnDuration?: number;
}

export interface RequestSyncPayload {
  playerId: string;
}

export interface SettingsUpdatePayload {
  turnDuration: number;
}

export interface GameStartPayload {
  holderId: string;
  holderName: string;
  holderAvatar: string;
  turnDuration: number;
  cardIndex: number;
}

export interface TurnStartedPayload {
  isHolder: boolean;
  roundStatus?: 'waiting' | 'active' | 'ended';
  roundEndsAt?: number;
  serverTime?: number;
  cardId?: string;
  cardIndex: number;
  totalCards: number;
  holderId: string;
  holderName: string;
  holderAvatar: string;
  image: string | null;
  imageUrl?: string | null;
  fallback?: string | null;
  word: string | null;
  wordHash?: string;
  category: string;
  hint: string | null;
  wordLength: number;
  turnEndTime: number;
  turnDuration: number;
  players: (Player & { isHolder?: boolean; isOnline?: boolean })[];
}

export interface RoundWonPayload {
  winnerId: string;
  winnerName: string;
  winnerAvatar: string;
  word: string;
  image?: string;
  points: number;
  scores?: { id: string; name: string; score: number; streak: number }[];
}

export interface RoomStatePayload {
  pin: string;
  status?: string;
  players: Player[];
  currentHolderIndex: number;
  roundStatus: 'waiting' | 'active' | 'ended';
  roundEndsAt: number | null;
  turnDuration: number;
  isHolder: boolean;
  holderId: string;
  holderName: string;
  holderAvatar: string;
  cardIndex: number;
}

// Global active channel and listener sets
// Local tab-to-tab BroadcastChannel for 0-latency instant sync between tabs on same origin
let localTabChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    localTabChannel = new BroadcastChannel('ttg_tab_sync');
  } catch (e) {}
}

let activeChannel: RealtimeChannel | null = null;
let activeRoomPin: string | null = null;
let activePlayerId: string | null = null;
let isChannelSubscribedState: boolean = false;

// Event listener registries for clean dispatching without socket thrashing
const presenceListeners = new Set<(players: Player[]) => void>();
const gameStartListeners = new Set<(payload: GameStartPayload) => void>();
const newTurnListeners = new Set<(payload: NewTurnPayload) => void>();
const scoreUpdateListeners = new Set<(payload: ScoreUpdatePayload) => void>();
const roundStartListeners = new Set<(payload: RoundStartPayload) => void>();
const correctGuessListeners = new Set<(payload: CorrectGuessPayload) => void>();
const turnTimeoutListeners = new Set<(payload: TurnTimeoutPayload) => void>();
const skipTurnListeners = new Set<(payload: { holderId: string }) => void>();
const reactionListeners = new Set<(payload: ReactionPayload) => void>();
const hintListeners = new Set<(payload: HintPayload) => void>();
const settingsListeners = new Set<(payload: SettingsUpdatePayload) => void>();
const syncStateListeners = new Set<(payload: SyncStatePayload) => void>();
const requestSyncListeners = new Set<(payload: RequestSyncPayload) => void>();
const statusListeners = new Set<(status: string) => void>();

/**
 * Initializes and joins a dedicated Supabase Realtime room channel.
 * Sets up all presence and broadcast listeners BEFORE subscribing.
 */
export function getSupabaseRoomChannel(pin: string, playerId: string): RealtimeChannel {
  const cleanPin = pin.trim();
  if (activeChannel && activeRoomPin === cleanPin && activePlayerId === playerId) {
    return activeChannel;
  }

  if (activeChannel) {
    try {
      supabase.removeChannel(activeChannel);
    } catch (e) {}
    activeChannel = null;
    isChannelSubscribedState = false;
  }

  activeRoomPin = cleanPin;
  activePlayerId = playerId;

  const channel = supabase.channel(`room_${cleanPin}`, {
    config: {
      broadcast: { self: false },
      presence: { key: playerId },
    },
  });

  // 1. Presence tracking: sync, join, leave
  const handlePresenceChange = () => {
    const state = channel.presenceState();
    const players = extractPlayersFromPresence(state);
    presenceListeners.forEach((listener) => {
      try {
        listener(players);
      } catch (err) {
        console.error('Error in presence listener:', err);
      }
    });
  };

  channel.on('presence', { event: 'sync' }, handlePresenceChange);
  channel.on('presence', { event: 'join' }, handlePresenceChange);
  channel.on('presence', { event: 'leave' }, handlePresenceChange);

  // 2. Broadcast events
  channel.on('broadcast', { event: 'game_start' }, ({ payload }) => {
    gameStartListeners.forEach((fn) => fn(payload as GameStartPayload));
  });

  channel.on('broadcast', { event: 'NEW_TURN' }, ({ payload }) => {
    newTurnListeners.forEach((fn) => fn(payload as NewTurnPayload));
  });
  channel.on('broadcast', { event: 'new_turn' }, ({ payload }) => {
    newTurnListeners.forEach((fn) => fn(payload as NewTurnPayload));
  });

  channel.on('broadcast', { event: 'SCORE_UPDATE' }, ({ payload }) => {
    scoreUpdateListeners.forEach((fn) => fn(payload as ScoreUpdatePayload));
  });
  channel.on('broadcast', { event: 'score_update' }, ({ payload }) => {
    scoreUpdateListeners.forEach((fn) => fn(payload as ScoreUpdatePayload));
  });

  const handleRoundStartBroadcast = ({ payload }: { payload: any }) => {
    if (!payload) return;
    const duration = Number(payload.turnDuration || payload.duration) || 60;
    const endsAt = Number(payload.endTime || payload.roundEndTime || payload.roundEndsAt) || (Date.now() + duration * 1000);
    const normalized: RoundStartPayload = {
      category: payload.category || '',
      wordLength: Number(payload.wordLength) || (payload.word ? String(payload.word).trim().length : 4),
      endTime: endsAt,
      roundEndsAt: endsAt,
      roundEndTime: endsAt,
      duration: duration,
      holderId: String(payload.holderId || 'p-host'),
      holderName: payload.holderName,
      holderAvatar: payload.holderAvatar,
      cardIndex: payload.cardIndex,
      cardId: payload.cardId,
      card: payload.card,
      word: payload.word,
      wordHash: payload.wordHash,
      hint: payload.hint,
      turnDuration: duration,
      streakWinner: payload.streakWinner,
    };
    roundStartListeners.forEach((fn) => {
      try {
        fn(normalized);
      } catch (err) {
        console.error('Error in roundStart listener:', err);
      }
    });
  };

  channel.on('broadcast', { event: 'ROUND_STARTED' }, handleRoundStartBroadcast);
  channel.on('broadcast', { event: 'round_started' }, handleRoundStartBroadcast);
  channel.on('broadcast', { event: 'START_ROUND' }, handleRoundStartBroadcast);
  channel.on('broadcast', { event: 'round_start' }, handleRoundStartBroadcast);

  if (localTabChannel) {
    localTabChannel.onmessage = (event) => {
      if (event.data?.type === 'START_ROUND' && event.data.payload) {
        handleRoundStartBroadcast({ payload: event.data.payload });
      }
    };
  }

  channel.on('broadcast', { event: 'correct_guess' }, ({ payload }) => {
    correctGuessListeners.forEach((fn) => fn(payload as CorrectGuessPayload));
  });

  const handleTurnTimeoutBroadcast = ({ payload }: { payload: any }) => {
    if (!payload) return;
    const normalized: TurnTimeoutPayload = {
      missedWord: payload.missedWord || payload.word || '',
      word: payload.word || payload.missedWord || '',
      imageUrl: payload.imageUrl || payload.nextCard?.imageUrl,
      reason: payload.reason || 'time_up',
      nextHolderId: String(payload.nextHolderId || ''),
      nextCard: payload.nextCard,
      nextIndex: payload.nextIndex,
      nextCardIndex: payload.nextCardIndex,
    };
    turnTimeoutListeners.forEach((fn) => {
      try {
        fn(normalized);
      } catch (err) {
        console.error('Error in turnTimeout listener:', err);
      }
    });
  };

  channel.on('broadcast', { event: 'turn_timeout' }, handleTurnTimeoutBroadcast);
  channel.on('broadcast', { event: 'TURN_TIMEOUT' }, handleTurnTimeoutBroadcast);

  if (localTabChannel) {
    const existingOnMessage = localTabChannel.onmessage;
    localTabChannel.onmessage = (event) => {
      if (existingOnMessage) existingOnMessage.call(localTabChannel, event);
      if ((event.data?.type === 'TURN_TIMEOUT' || event.data?.type === 'turn_timeout') && event.data.payload) {
        handleTurnTimeoutBroadcast({ payload: event.data.payload });
      }
    };
  }

  channel.on('broadcast', { event: 'skip_turn' }, ({ payload }) => {
    skipTurnListeners.forEach((fn) => fn(payload as { holderId: string }));
  });

  channel.on('broadcast', { event: 'reaction' }, ({ payload }) => {
    reactionListeners.forEach((fn) => fn(payload as ReactionPayload));
  });

  channel.on('broadcast', { event: 'hint' }, ({ payload }) => {
    hintListeners.forEach((fn) => fn(payload as HintPayload));
  });

  channel.on('broadcast', { event: 'update_settings' }, ({ payload }) => {
    settingsListeners.forEach((fn) => fn(payload as SettingsUpdatePayload));
  });

  channel.on('broadcast', { event: 'sync_state' }, ({ payload }) => {
    syncStateListeners.forEach((fn) => fn(payload as SyncStatePayload));
  });

  channel.on('broadcast', { event: 'request_sync' }, ({ payload }) => {
    requestSyncListeners.forEach((fn) => fn(payload as RequestSyncPayload));
  });

  // 3. Subscribe once all listeners are mounted
  channel.subscribe((status) => {
    isChannelSubscribedState = status === 'SUBSCRIBED';
    statusListeners.forEach((fn) => fn(status));
  });

  activeChannel = channel;
  return channel;
}

export function getCurrentSupabaseChannel(): RealtimeChannel | null {
  return activeChannel;
}

export function getActiveRoomPin(): string | null {
  return activeRoomPin;
}

export function isChannelSubscribed(): boolean {
  return isChannelSubscribedState;
}

export function leaveSupabaseRoomChannel(): void {
  if (activeChannel) {
    try {
      supabase.removeChannel(activeChannel);
    } catch (e) {}
    activeChannel = null;
    activeRoomPin = null;
    activePlayerId = null;
    isChannelSubscribedState = false;
  }
}

// Clean listener attachment helpers (safe to call anywhere, anytime)
export function addSupabaseListener(event: 'presence', fn: (players: Player[]) => void): () => void;
export function addSupabaseListener(event: 'game_start', fn: (payload: GameStartPayload) => void): () => void;
export function addSupabaseListener(event: 'new_turn', fn: (payload: NewTurnPayload) => void): () => void;
export function addSupabaseListener(event: 'score_update', fn: (payload: ScoreUpdatePayload) => void): () => void;
export function addSupabaseListener(event: 'round_start' | 'START_ROUND' | 'ROUND_STARTED' | 'round_started', fn: (payload: RoundStartPayload) => void): () => void;
export function addSupabaseListener(event: 'correct_guess', fn: (payload: CorrectGuessPayload) => void): () => void;
export function addSupabaseListener(event: 'turn_timeout', fn: (payload: TurnTimeoutPayload) => void): () => void;
export function addSupabaseListener(event: 'skip_turn', fn: (payload: { holderId: string }) => void): () => void;
export function addSupabaseListener(event: 'reaction', fn: (payload: ReactionPayload) => void): () => void;
export function addSupabaseListener(event: 'hint', fn: (payload: HintPayload) => void): () => void;
export function addSupabaseListener(event: 'update_settings', fn: (payload: SettingsUpdatePayload) => void): () => void;
export function addSupabaseListener(event: 'sync_state', fn: (payload: SyncStatePayload) => void): () => void;
export function addSupabaseListener(event: 'request_sync', fn: (payload: RequestSyncPayload) => void): () => void;
export function addSupabaseListener(event: 'status', fn: (status: string) => void): () => void;
export function addSupabaseListener(event: string, fn: any): () => void {
  if (event === 'presence') presenceListeners.add(fn);
  else if (event === 'game_start') gameStartListeners.add(fn);
  else if (event === 'new_turn') newTurnListeners.add(fn);
  else if (event === 'score_update') scoreUpdateListeners.add(fn);
  else if (event === 'round_start' || event === 'START_ROUND' || event === 'ROUND_STARTED' || event === 'round_started') roundStartListeners.add(fn);
  else if (event === 'correct_guess') correctGuessListeners.add(fn);
  else if (event === 'turn_timeout') turnTimeoutListeners.add(fn);
  else if (event === 'skip_turn') skipTurnListeners.add(fn);
  else if (event === 'reaction') reactionListeners.add(fn);
  else if (event === 'hint') hintListeners.add(fn);
  else if (event === 'update_settings') settingsListeners.add(fn);
  else if (event === 'sync_state') syncStateListeners.add(fn);
  else if (event === 'request_sync') requestSyncListeners.add(fn);
  else if (event === 'status') statusListeners.add(fn);

  return () => {
    if (event === 'presence') presenceListeners.delete(fn);
    else if (event === 'game_start') gameStartListeners.delete(fn);
    else if (event === 'new_turn') newTurnListeners.delete(fn);
    else if (event === 'score_update') scoreUpdateListeners.delete(fn);
    else if (event === 'round_start' || event === 'START_ROUND' || event === 'ROUND_STARTED' || event === 'round_started') roundStartListeners.delete(fn);
    else if (event === 'correct_guess') correctGuessListeners.delete(fn);
    else if (event === 'turn_timeout') turnTimeoutListeners.delete(fn);
    else if (event === 'skip_turn') skipTurnListeners.delete(fn);
    else if (event === 'reaction') reactionListeners.delete(fn);
    else if (event === 'hint') hintListeners.delete(fn);
    else if (event === 'update_settings') settingsListeners.delete(fn);
    else if (event === 'sync_state') syncStateListeners.delete(fn);
    else if (event === 'request_sync') requestSyncListeners.delete(fn);
    else if (event === 'status') statusListeners.delete(fn);
  };
}

export function broadcastNewTurn(payload: NewTurnPayload): void {
  newTurnListeners.forEach((fn) => {
    try {
      fn(payload);
    } catch (e) {
      console.error('Error dispatching new_turn locally:', e);
    }
  });

  if (activeChannel) {
    activeChannel.send({
      type: 'broadcast',
      event: 'NEW_TURN',
      payload,
    });
  }
}

export function broadcastScoreUpdate(payload: ScoreUpdatePayload): void {
  scoreUpdateListeners.forEach((fn) => {
    try {
      fn(payload);
    } catch (e) {
      console.error('Error dispatching score_update locally:', e);
    }
  });

  if (activeChannel) {
    activeChannel.send({
      type: 'broadcast',
      event: 'SCORE_UPDATE',
      payload,
    });
  }
}

export function broadcastSkipTurn(holderId: string): void {
  skipTurnListeners.forEach((fn) => {
    try {
      fn({ holderId });
    } catch (e) {}
  });

  if (activeChannel) {
    activeChannel.send({
      type: 'broadcast',
      event: 'skip_turn',
      payload: { holderId },
    });
  }
}

// Broadcasting Helper Functions
export async function trackPlayer(player: {
  id: string;
  name: string;
  icon?: string;
  avatar?: string;
  score: number;
  streak?: number;
  isHost?: boolean;
}): Promise<void> {
  if (activeChannel) {
    await activeChannel.track({
      id: player.id,
      name: player.name,
      icon: player.icon || player.avatar || '🦁',
      score: player.score || 0,
      streak: player.streak || 0,
      isHost: Boolean(player.isHost),
    });
  }
}

export function broadcastGameStart(payload: GameStartPayload): void {
  gameStartListeners.forEach((fn) => {
    try {
      fn(payload);
    } catch (e) {}
  });

  if (activeChannel) {
    activeChannel.send({
      type: 'broadcast',
      event: 'game_start',
      payload,
    });
  }
}

export function broadcastRoundStart(payload: RoundStartPayload): void {
  const duration = Number(payload.turnDuration || payload.duration) || 60;
  const endsAt = Number(payload.endTime || payload.roundEndsAt || payload.roundEndTime) || (Date.now() + duration * 1000);
  const normalized: RoundStartPayload = {
    ...payload,
    endTime: endsAt,
    roundEndsAt: endsAt,
    roundEndTime: endsAt,
    duration,
    turnDuration: duration,
  };

  // 1. Notify local listeners first with try/catch
  roundStartListeners.forEach((fn) => {
    try {
      fn(normalized);
    } catch (e) {
      console.warn('Local listener error in broadcastRoundStart:', e);
    }
  });

  // 1b. Post to localTabChannel for immediate cross-tab synchronization
  if (localTabChannel) {
    try {
      localTabChannel.postMessage({
        type: 'START_ROUND',
        payload: normalized,
      });
    } catch (e) {}
  }

  // 2. Safe Broadcast across Supabase channel
  if (activeChannel && typeof activeChannel.send === 'function') {
    try {
      activeChannel.send({
        type: 'broadcast',
        event: 'START_ROUND',
        payload: {
          endTime: endsAt,
          duration: duration,
          roundEndTime: endsAt,
          roundEndsAt: endsAt,
          holderId: payload.holderId,
          category: payload.category,
          wordLength: payload.wordLength,
          cardId: payload.cardId,
          cardIndex: payload.cardIndex,
        },
      }).catch((err: any) => console.error('Broadcast catch error (START_ROUND):', err));
    } catch (networkError) {
      console.error('Network broadcast failed (START_ROUND):', networkError);
    }

    try {
      activeChannel.send({
        type: 'broadcast',
        event: 'ROUND_STARTED',
        payload: normalized,
      }).catch((err: any) => console.error('Broadcast catch error (ROUND_STARTED):', err));
    } catch (networkError) {
      console.error('Network broadcast failed (ROUND_STARTED):', networkError);
    }

    try {
      activeChannel.send({
        type: 'broadcast',
        event: 'round_start',
        payload: normalized,
      }).catch((err: any) => console.error('Broadcast catch error (round_start):', err));
    } catch (networkError) {
      console.error('Network broadcast failed (round_start):', networkError);
    }
  }
}

export function broadcastCorrectGuess(payload: CorrectGuessPayload): void {
  correctGuessListeners.forEach((fn) => {
    try {
      fn(payload);
    } catch (e) {}
  });

  if (activeChannel) {
    activeChannel.send({
      type: 'broadcast',
      event: 'correct_guess',
      payload,
    });
  }
}

export function broadcastTurnTimeout(payload: TurnTimeoutPayload): void {
  turnTimeoutListeners.forEach((fn) => {
    try {
      fn(payload);
    } catch (e) {}
  });

  if (activeChannel) {
    activeChannel.send({
      type: 'broadcast',
      event: 'turn_timeout',
      payload,
    });
  }
}

export function broadcastReaction(payload: ReactionPayload): void {
  if (activeChannel) {
    activeChannel.send({
      type: 'broadcast',
      event: 'reaction',
      payload,
    });
  }
}

export function broadcastHint(payload: HintPayload): void {
  if (activeChannel) {
    activeChannel.send({
      type: 'broadcast',
      event: 'hint',
      payload,
    });
  }
}

export function broadcastSettingsUpdate(payload: SettingsUpdatePayload): void {
  if (activeChannel) {
    activeChannel.send({
      type: 'broadcast',
      event: 'update_settings',
      payload,
    });
  }
}

export function broadcastSyncState(payload: SyncStatePayload): void {
  if (activeChannel) {
    activeChannel.send({
      type: 'broadcast',
      event: 'sync_state',
      payload,
    });
  }
}

export function broadcastRequestSync(playerId: string): void {
  if (activeChannel) {
    activeChannel.send({
      type: 'broadcast',
      event: 'request_sync',
      payload: { playerId },
    });
  }
}

/**
 * Converts Supabase presenceState dictionary into a clean, deduplicated Player array.
 * Strictly connected players only (zero mock data).
 */
export function extractPlayersFromPresence(presenceState: Record<string, any[]>): Player[] {
  const map = new Map<string, Player>();

  for (const presences of Object.values(presenceState)) {
    if (!Array.isArray(presences)) continue;
    for (const p of presences) {
      if (p && p.id) {
        map.set(p.id, {
          id: p.id,
          name: p.name || 'שחקן',
          avatar: p.icon || p.avatar || '🦁',
          score: typeof p.score === 'number' ? p.score : 0,
          streak: typeof p.streak === 'number' ? p.streak : 0,
          isHost: Boolean(p.isHost),
          isOnline: true,
        });
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Helper to encode word for verification
 */
export function encodeWordHash(word: string): string {
  try {
    return btoa(encodeURIComponent(word.trim().toLowerCase()));
  } catch {
    return word.trim().toLowerCase();
  }
}

export function matchesWordHash(guess: string, wordHash: string): boolean {
  if (!guess || !wordHash) return false;
  return encodeWordHash(guess) === wordHash;
}
