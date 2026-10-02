import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { CardItem, Player, Language, VoiceGender } from '../types/game';
import { GAME_CARDS, STATIC_CARDS, getGameCardById } from '../data/cards';
import { VirtualKeyboard } from './VirtualKeyboard';
import { GameTimer } from './GameTimer';
import { normalizeHebrewInput, lettersMatch } from '../utils/hebrewKeyboard';
import { sounds } from '../utils/audio';
import { translations } from '../utils/translations';
import {
  getCurrentSupabaseChannel,
  getActiveRoomPin,
  addSupabaseListener,
  broadcastRoundStart,
  broadcastCorrectGuess,
  broadcastTurnTimeout,
  broadcastReaction,
  broadcastHint,
  broadcastSettingsUpdate,
  broadcastSyncState,
  broadcastRequestSync,
  broadcastSkipTurn,
  trackPlayer,
  TurnStartedPayload,
  RoundWonPayload,
  ReactionPayload,
  RoomStatePayload,
  RoundStartPayload,
  CorrectGuessPayload,
  TurnTimeoutPayload,
  NewTurnPayload,
  HintPayload,
  SettingsUpdatePayload,
  SyncStatePayload,
  RequestSyncPayload,
  encodeWordHash,
  matchesWordHash,
} from '../utils/supabaseGame';
import { getPinFromUrl, getShareUrl } from '../utils/url';
import { VoiceGenderSelector } from './VoiceGenderSelector';
import { WhatsAppShareButton, WhatsAppIcon } from './WhatsAppShareButton';
import {
  Timer as TimerIcon,
  Flame,
  Volume2,
  VolumeX,
  LogOut,
  Trophy,
  CheckCircle2,
  XCircle,
  Share2,
  RefreshCw,
  Lightbulb,
  SkipForward,
  Globe,
  ShieldCheck,
  Radio,
  Image as ImageIcon,
  HelpCircle,
  Settings,
  Mic,
  Snowflake,
  User,
  Lock,
  Rocket
} from 'lucide-react';

interface GameTableProps {
  cards: CardItem[];
  currentCardIndex: number;
  players: Player[];
  currentHolderId?: string;
  activePlayerId: string;
  myPlayerId: string;
  turnDuration: number;
  roomPin?: string;
  isLiveServer?: boolean;
  serverTurnData?: TurnStartedPayload | null;
  onChangeTurnDuration?: (newDuration: number) => void;
  onCardSolved: (winnerPlayerId: string, bonusPoints: number) => void;
  onCardTimeout: () => void;
  onLeaveGame: () => void;
  onOpenShareModal?: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  language?: Language;
  onToggleLanguage?: () => void;
  voiceGender?: VoiceGender;
  onChangeVoiceGender?: (gender: VoiceGender) => void;
  onRoundStart?: (endTime: number, duration: number) => void;
}

export const GameTable: React.FC<GameTableProps> = ({
  cards,
  currentCardIndex,
  players,
  currentHolderId,
  activePlayerId,
  myPlayerId,
  turnDuration = 15,
  roomPin,
  isLiveServer = false,
  serverTurnData,
  onChangeTurnDuration,
  onCardSolved,
  onCardTimeout,
  onLeaveGame,
  onOpenShareModal,
  isMuted,
  onToggleMute,
  language = 'he',
  onToggleLanguage,
  voiceGender,
  onChangeVoiceGender,
  onRoundStart,
}) => {
  const t = translations[language];
  const isEn = language === 'en';

  // Internal voice gender state (fallback if not controlled from parent)
  const [internalVoiceGender, setInternalVoiceGender] = useState<VoiceGender>(() => {
    return voiceGender || sounds.voiceGender;
  });

  const currentVoiceGender = voiceGender || internalVoiceGender;

  const handleVoiceGenderChange = (gender: VoiceGender) => {
    setInternalVoiceGender(gender);
    sounds.setVoiceGender(gender);
    onChangeVoiceGender?.(gender);
  };

  // User Requirement 2: Strict Role Check
  // 1. Stable, unambiguous local player ID
  const activeMyPlayerId = String(
    myPlayerId || (typeof window !== 'undefined' ? localStorage.getItem('ttg_player_id') : '') || 'p-host'
  ).trim();

  // 2. Authoritative currentHolderId tracking across round turns & events
  const [liveHolderId, setLiveHolderId] = useState<string>(() => {
    return String(currentHolderId || serverTurnData?.holderId || 'p-host').trim();
  });

  useEffect(() => {
    const nextHolder = currentHolderId || serverTurnData?.holderId;
    if (nextHolder) {
      setLiveHolderId(String(nextHolder).trim());
    }
  }, [currentHolderId, serverTurnData?.holderId]);

  const effectiveHolderId = String(currentHolderId || liveHolderId || serverTurnData?.holderId || 'p-host').trim();

  // 3. Clean comparison: prioritize explicit serverTurnData.isHolder, fallback to ID match
  const isHolder = serverTurnData?.isHolder !== undefined
    ? Boolean(serverTurnData.isHolder)
    : (activeMyPlayerId === effectiveHolderId);
  const isCurrentClientHolder = isHolder;

  // Active players: Server authoritative list (strictly connected players), ranked by score
  const activePlayers = useMemo(() => {
    const list = (serverTurnData?.players && serverTurnData.players.length > 0)
      ? serverTurnData.players
      : players;
    return [...list].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }, [serverTurnData?.players, players]);

  // Active card: matched authoritatively from GAME_CARDS by cardId, received via NEW_TURN/START_ROUND, or deck
  const [activeTurnCard, setActiveTurnCard] = useState<CardItem | null>(null);
  const activeCard: CardItem = useMemo(() => {
    if (serverTurnData?.cardId) {
      const found = GAME_CARDS.find((c) => c.id === serverTurnData.cardId);
      if (found) return found;
    }
    if (activeTurnCard) return activeTurnCard;
    if (cards && cards[currentCardIndex]) return cards[currentCardIndex];
    return GAME_CARDS[0];
  }, [serverTurnData?.cardId, activeTurnCard, cards, currentCardIndex]);

  const currentCard = activeCard;
  const localTargetWord = (isEn ? (activeCard.word_en || activeCard.word) : (activeCard.word_he || activeCard.word)).trim();

  // If guesser: NEVER draw or guess local card!
  // Rely strictly on synced card received from host/server via network event!
  const [syncedRoundCard, setSyncedRoundCard] = useState<{
    cardId?: string;
    category?: string;
    wordLength?: number;
    wordHash?: string;
  } | null>(() => {
    if (serverTurnData?.wordLength || serverTurnData?.category) {
      return {
        cardId: serverTurnData.cardId,
        category: serverTurnData.category,
        wordLength: serverTurnData.wordLength,
        wordHash: serverTurnData.wordHash,
      };
    }
    return null;
  });

  // Keep syncedRoundCard updated from serverTurnData
  useEffect(() => {
    if (serverTurnData?.wordLength || serverTurnData?.category) {
      setSyncedRoundCard({
        cardId: serverTurnData.cardId,
        category: serverTurnData.category,
        wordLength: serverTurnData.wordLength,
        wordHash: serverTurnData.wordHash,
      });
    }
  }, [serverTurnData?.wordLength, serverTurnData?.category, serverTurnData?.cardId, serverTurnData?.wordHash]);

  // Holder sees the secret word and photo; guesser sees NO secret word and relies strictly on synced network card!
  const targetWord = isCurrentClientHolder ? (serverTurnData?.word || localTargetWord) : '';
  const rawWordLength = isCurrentClientHolder
    ? (serverTurnData?.wordLength || localTargetWord.length)
    : (syncedRoundCard?.wordLength || serverTurnData?.wordLength || 0);

  // Requirement 2: ALWAYS render boxes! If wordLength has not arrived from host yet, default to at least 4 boxes
  const wordLength = rawWordLength > 0 ? rawWordLength : 4;
  const isWaitingForWordLength = !isCurrentClientHolder && rawWordLength === 0;

  const activeCategory = isCurrentClientHolder
    ? (serverTurnData?.category || (isEn ? (currentCard.category_en || currentCard.category) : currentCard.category))
    : (syncedRoundCard?.category || serverTurnData?.category || (isEn ? 'Category' : 'קטגוריה'));

  const activeHint = serverTurnData?.hint || (isCurrentClientHolder ? (isEn ? (currentCard.hint_en || currentCard.hint) : currentCard.hint) : null);
  const activeHolder = activePlayers.find((p) => p.id === effectiveHolderId);
  const activeHolderName = serverTurnData?.holderName || activeHolder?.name || (isEn ? 'Host' : 'מארח/ת');
  const activeHolderAvatar = serverTurnData?.holderAvatar || activeHolder?.avatar || '👑';

  // User's active typed guess: isolated and resilient against timer & sync ticks
  const [currentGuess, setCurrentGuess] = useState<string>('');

  // Guarantee clean guess state on room entry / table mount and whenever room or player changes
  useEffect(() => {
    setCurrentGuess('');
    setIsSuccess(false);
    setIsShaking(false);
    try {
      localStorage.removeItem('ttg_current_guess');
    } catch (e) {}
  }, [myPlayerId, roomPin]);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [showHintText, setShowHintText] = useState<boolean>(Boolean(serverTurnData?.hint));
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  const [showTimerPicker, setShowTimerPicker] = useState<boolean>(false);
  const [lastReaction, setLastReaction] = useState<string | null>(null);
  const [floatingReaction, setFloatingReaction] = useState<{ reactionType?: 'yes' | 'no' | 'hot' | 'cold'; emoji: string; text: string; sender: string } | null>(null);
  const [winnerCelebration, setWinnerCelebration] = useState<RoundWonPayload | null>(null);
  const [streakBanner, setStreakBanner] = useState<{
    winnerName: string;
    winnerAvatar?: string;
    points: number;
    word?: string;
  } | null>(null);

  // User Requirement: isRoundActive & roundEndTime & Unified Game State
  const [isRoundActive, setIsRoundActive] = useState<boolean>(() => {
    return serverTurnData?.roundStatus === 'active';
  });
  const [gameState, setGameState] = useState<'waiting' | 'active' | 'ended'>(() => {
    return serverTurnData?.roundStatus || 'waiting';
  });
  const [roundState, setRoundState] = useState<'waiting' | 'active' | 'ended'>(() => {
    return serverTurnData?.roundStatus || 'waiting';
  });
  const [roundEndTime, setRoundEndTime] = useState<number>(() => {
    return serverTurnData?.roundEndsAt || serverTurnData?.turnEndTime || 0;
  });
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    return Number(serverTurnData?.turnDuration || turnDuration) || 60;
  });

  const isRoundActiveRef = useRef<boolean>(isRoundActive);
  const roundEndTimeRef = useRef<number>(roundEndTime);
  isRoundActiveRef.current = isRoundActive;
  roundEndTimeRef.current = roundEndTime;

  // Round status ('waiting' = paused waiting for host/holder to start; 'active' = timer counting down; 'ended' = round concluded)
  const [roundStatus, setRoundStatus] = useState<'waiting' | 'active' | 'ended'>(() => {
    return serverTurnData?.roundStatus || 'waiting';
  });
  const [roundEndsAt, setRoundEndsAt] = useState<number>(() => {
    return serverTurnData?.roundEndsAt || serverTurnData?.turnEndTime || 0;
  });

  // Master unified active game flag - true if ANY state indicates an active round
  const isGameActive = Boolean(
    isRoundActive ||
    gameState === 'active' ||
    roundStatus === 'active' ||
    roundState === 'active'
  );
  const currentRoundStatus: 'waiting' | 'active' | 'ended' = isGameActive
    ? 'active'
    : (roundStatus === 'ended' || gameState === 'ended' ? 'ended' : 'waiting');
  const currentRoundEndsAt: number = (roundEndTime > 0 && roundEndTime > Date.now())
    ? roundEndTime
    : (roundEndsAt > 0 && roundEndsAt > Date.now() ? roundEndsAt : roundEndTime);

  // Sync from incoming serverTurnData updates (preserves currentGuess!)
  useEffect(() => {
    if (serverTurnData) {
      if (serverTurnData.roundStatus) {
        // If local state is already active and the round hasn't expired, prevent stale waiting state from reverting it
        if (serverTurnData.roundStatus === 'waiting' && isGameActive && roundEndTimeRef.current > Date.now()) {
          // Keep active - do not revert
        } else {
          setRoundStatus(serverTurnData.roundStatus);
          setGameState(serverTurnData.roundStatus);
          setRoundState(serverTurnData.roundStatus);
          const activeNow = serverTurnData.roundStatus === 'active';
          setIsRoundActive(activeNow);
          isRoundActiveRef.current = activeNow;
        }
      }
      const end = serverTurnData.roundEndsAt || serverTurnData.turnEndTime || 0;
      if (end > 0) {
        setRoundEndsAt(end);
        setRoundEndTime(end);
        roundEndTimeRef.current = end;
      }

      if (serverTurnData.roundStatus === 'active') {
        isHandledRef.current = false;
        setIsRoundActive(true);
        setGameState('active');
        setRoundState('active');
        setRoundStatus('active');
        isRoundActiveRef.current = true;
      }

      if (serverTurnData.wordLength || serverTurnData.category) {
        setSyncedRoundCard({
          cardId: serverTurnData.cardId ? String(serverTurnData.cardId) : undefined,
          category: serverTurnData.category,
          wordLength: serverTurnData.wordLength,
          wordHash: serverTurnData.wordHash,
        });
      }
    }
  }, [serverTurnData, isRoundActive, roundEndTime]);

  const isHost = players.find(p => p.id === myPlayerId)?.isHost || myPlayerId === 'p-host';

  // Responsive sizing, spacing and font-sizes for word boxes based on word length
  const boxConfig = useMemo(() => {
    // 1. Short words (up to 5 or 6 letters): comfortable 48px-56px boxes with touch-friendly targets
    if (wordLength <= 5) {
      return {
        gapClass: 'gap-2 sm:gap-2.5',
        boxClass: 'w-12 sm:w-14 h-12 sm:h-14 min-w-[44px] min-h-[44px] aspect-square rounded-2xl text-2xl sm:text-3xl font-black shadow-sm',
        style: { aspectRatio: '1 / 1' } as React.CSSProperties,
      };
    }

    if (wordLength === 6) {
      return {
        gapClass: 'gap-1.5 sm:gap-2',
        boxClass: 'w-11 sm:w-12 h-11 sm:h-12 min-w-[40px] min-h-[40px] aspect-square rounded-xl sm:rounded-2xl text-xl sm:text-2xl font-black shadow-sm',
        style: {
          width: 'calc((100% - 24px) / 6)',
          maxWidth: '48px',
          aspectRatio: '1 / 1',
        } as React.CSSProperties,
      };
    }

    // 2. Elastic auto-shrink for longer words:
    if (wordLength === 7) {
      return {
        gapClass: 'gap-1 sm:gap-1.5',
        boxClass: 'max-w-[44px] min-w-[36px] min-h-[36px] aspect-square rounded-xl text-lg sm:text-xl font-black shadow-sm',
        style: {
          width: 'calc((100% - 24px) / 7)',
          maxWidth: '44px',
          aspectRatio: '1 / 1',
        } as React.CSSProperties,
      };
    }

    if (wordLength === 8) {
      return {
        gapClass: 'gap-1',
        boxClass: 'max-w-[40px] min-w-[32px] min-h-[32px] aspect-square rounded-lg sm:rounded-xl text-base sm:text-lg font-black shadow-sm',
        style: {
          width: 'calc((100% - 28px) / 8)',
          maxWidth: '40px',
          aspectRatio: '1 / 1',
        } as React.CSSProperties,
      };
    }

    // 9+ letters: compact padding, dynamic width calculation and matching font-size
    const totalGaps = (wordLength - 1) * 3;
    const isVeryLong = wordLength >= 11;
    return {
      gapClass: 'gap-0.5 sm:gap-1',
      boxClass: `aspect-square rounded-md sm:rounded-lg font-black ${
        isVeryLong ? 'text-xs sm:text-sm max-w-[30px] min-w-[26px] min-h-[26px]' : 'text-sm sm:text-base max-w-[36px] min-w-[30px] min-h-[30px]'
      }`,
      style: {
        width: `calc((100% - ${totalGaps}px) / ${wordLength})`,
        maxWidth: isVeryLong ? '30px' : '36px',
        aspectRatio: '1 / 1',
      } as React.CSSProperties,
    };
  }, [wordLength]);

  const isHandledRef = useRef<boolean>(false);
  const serverTimeOffsetRef = useRef<number>(0);

  // Sync clock offset whenever serverTurnData provides serverTime
  useEffect(() => {
    if (serverTurnData?.serverTime) {
      serverTimeOffsetRef.current = serverTurnData.serverTime - Date.now();
    }
  }, [serverTurnData?.serverTime]);

  // Realtime Supabase Channel event subscriptions
  useEffect(() => {
    const unsubReaction = addSupabaseListener('reaction', (payload: ReactionPayload) => {
      let emoji = '💬';
      let text = '';
      if (payload.reaction === 'yes') {
        emoji = '✅';
        text = t.btnYes;
        sounds.soundClue('yes', language, currentVoiceGender);
      } else if (payload.reaction === 'no') {
        emoji = '❌';
        text = t.btnNo;
        sounds.soundClue('no', language, currentVoiceGender);
      } else if (payload.reaction === 'hot') {
        emoji = '🔥';
        text = t.btnHot;
        sounds.soundClue('hot', language, currentVoiceGender);
      } else if (payload.reaction === 'cold') {
        emoji = '❄️';
        text = t.btnCold;
        sounds.soundClue('cold', language, currentVoiceGender);
      }

      setFloatingReaction({ reactionType: payload.reaction, emoji, text, sender: payload.senderName });
      setLastReaction(`${emoji} ${text}`);
      setTimeout(() => setFloatingReaction(null), 3000);
    });

    const unsubHint = addSupabaseListener('hint', () => {
      sounds.soundHint();
      setShowHintText(true);
    });

    const onRoundStartPayload = (payload: RoundStartPayload) => {
      console.log('>>> [START_ROUND RECEIVED on client]', payload);
      try {
        sounds?.soundSuccess?.();
      } catch (e) {}

      const duration = Number(payload.turnDuration || payload.duration) || 60;
      const end = Number(payload.endTime || payload.roundEndTime || payload.roundEndsAt) || (Date.now() + duration * 1000);
      isRoundActiveRef.current = true;
      roundEndTimeRef.current = end;
      setIsRoundActive(true);
      setGameState('active');
      setRoundState('active');
      setRoundStatus('active');
      setRoundEndTime(end);
      setRoundEndsAt(end);
      setTimeLeft(duration);
      if (payload.holderId) {
        setLiveHolderId(String(payload.holderId));
      }
      isHandledRef.current = false;
      setCurrentGuess('');
      setIsSuccess(false);
      setIsShaking(false);
      setWinnerCelebration(null);

      // Display celebratory banner for streak winner if present
      if (payload.streakWinner) {
        setStreakBanner({
          winnerName: payload.streakWinner.winnerName,
          winnerAvatar: payload.streakWinner.winnerAvatar || '🎉',
          points: payload.streakWinner.points || 10,
          word: payload.word,
        });
        setTimeout(() => {
          setStreakBanner(null);
        }, 2400);
      }

      // Update card for the holder
      if (payload.card) {
        setActiveTurnCard(payload.card);
      } else if (payload.cardId) {
        const found = getGameCardById(payload.cardId);
        if (found) setActiveTurnCard(found);
      }

      if (payload.wordLength || payload.category || payload.cardId) {
        setSyncedRoundCard({
          cardId: payload.cardId ? String(payload.cardId) : undefined,
          category: payload.category,
          wordLength: payload.wordLength,
          wordHash: payload.wordHash,
        });
      }
    };

    const unsubRoundStart = addSupabaseListener('round_start', onRoundStartPayload);
    const unsubRoundStarted = addSupabaseListener('ROUND_STARTED', onRoundStartPayload);
    const unsubStartRound = addSupabaseListener('START_ROUND', onRoundStartPayload);

    // Non-blocking correct guess handling in Combo/Streak mode
    const unsubCorrectGuess = addSupabaseListener('correct_guess', (payload: CorrectGuessPayload) => {
      sounds.soundSuccess();
      setIsSuccess(true);
      setStreakBanner({
        winnerName: payload.winnerName,
        winnerAvatar: payload.winnerAvatar || '🎉',
        points: payload.points || 10,
        word: payload.word,
      });
      setTimeout(() => {
        setIsSuccess(false);
      }, 700);
      setTimeout(() => {
        setStreakBanner(null);
      }, 2400);
    });

    // Timeout handling: When clock reaches 0:00 without a guess
    const unsubTurnTimeout = addSupabaseListener('turn_timeout', (payload: TurnTimeoutPayload) => {
      try {
        sounds.soundError();
      } catch (e) {}

      const missed = payload.missedWord || payload.word || '';

      // 1. עצירת הסיבוב
      setIsRoundActive(false);
      setGameState('waiting');
      setRoundState('waiting');
      setRoundStatus('waiting');
      setRoundEndTime(0);
      setRoundEndsAt(0);
      setTimeLeft(Number(turnDuration || serverTurnData?.turnDuration) || 60);
      isRoundActiveRef.current = false;
      roundEndTimeRef.current = 0;
      isHandledRef.current = false;
      setCurrentGuess('');
      setIsSuccess(false);
      setIsShaking(false);

      // 2. הצגת באנר הודעה למשך 3 שניות: "⏰ הזמן נגמר! המילה הייתה: {missedWord}"
      setWinnerCelebration({
        winnerId: '',
        winnerName: isEn ? '⏰ Time is up!' : '⏰ הזמן נגמר!',
        winnerAvatar: '⏱️',
        word: missed,
        image: payload.imageUrl || payload.nextCard?.imageUrl || '',
        points: 0,
        scores: [],
      });

      // 3. עדכון מחזיק התמונה הבא וקלף הבא (במידה והתקבל בשידור)
      if (payload.nextHolderId) {
        setLiveHolderId(String(payload.nextHolderId));
      }
      if (payload.nextCard) {
        setActiveTurnCard(payload.nextCard);
        setSyncedRoundCard({
          cardId: payload.nextCard.id,
          category: payload.nextCard.category,
          wordLength: payload.nextCard.word ? payload.nextCard.word.trim().length : 4,
          wordHash: payload.nextCard.word ? encodeWordHash(payload.nextCard.word.trim()) : undefined,
        });
      }

      setTimeout(() => {
        setWinnerCelebration(null);
      }, 3000);
    });

    // Authoritative NEW_TURN broadcast from Host (when time runs out and turn rotates to next player)
    const unsubNewTurn = addSupabaseListener('new_turn', (payload: NewTurnPayload) => {
      if (payload.holderId) {
        setLiveHolderId(String(payload.holderId));
      }
      setIsRoundActive(false);
      setGameState('waiting');
      setRoundState('waiting');
      setRoundStatus('waiting');
      setRoundEndTime(0);
      setRoundEndsAt(0);
      isRoundActiveRef.current = false;
      roundEndTimeRef.current = 0;
      isHandledRef.current = false;
      setCurrentGuess('');
      setIsSuccess(false);
      setIsShaking(false);
      setWinnerCelebration(null);
      setStreakBanner(null);

      if (payload.card) {
        setActiveTurnCard(payload.card);
      }
      setSyncedRoundCard({
        cardId: payload.card?.id,
        category: payload.category,
        wordLength: payload.wordLength,
        wordHash: payload.wordHash || (payload.card ? encodeWordHash(isEn ? (payload.card.word_en || payload.card.word) : (payload.card.word_he || payload.card.word)) : undefined),
      });
    });

    const unsubSyncState = addSupabaseListener('sync_state', (payload: SyncStatePayload) => {
      if (payload.holderId) {
        setLiveHolderId(String(payload.holderId));
      }
      if (payload.wordLength || payload.category || payload.cardId) {
        setSyncedRoundCard((prev) => {
          if (prev?.cardId === payload.cardId && prev?.wordLength === payload.wordLength) {
            return prev;
          }
          return {
            cardId: payload.cardId,
            category: payload.category,
            wordLength: payload.wordLength,
            wordHash: payload.wordHash,
          };
        });
      }
      if (payload.roundStatus === 'active') {
        setIsRoundActive(true);
        setGameState('active');
        setRoundState('active');
        setRoundStatus('active');
        isRoundActiveRef.current = true;
        if (payload.roundEndsAt) {
          setRoundEndsAt(payload.roundEndsAt);
          setRoundEndTime(payload.roundEndsAt);
          roundEndTimeRef.current = payload.roundEndsAt;
        }
        isHandledRef.current = false;
      } else if (payload.roundStatus === 'waiting') {
        if (!isGameActive || roundEndTimeRef.current <= Date.now()) {
          setIsRoundActive(false);
          setGameState('waiting');
          setRoundState('waiting');
          setRoundStatus('waiting');
          isRoundActiveRef.current = false;
        }
      }
    });

    // Request initial sync if joining as guesser (with quick retry)
    let retryTimer: NodeJS.Timeout | null = null;
    if (!isCurrentClientHolder) {
      broadcastRequestSync(myPlayerId);
      retryTimer = setTimeout(() => {
        broadcastRequestSync(myPlayerId);
      }, 500);
    }

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      unsubReaction();
      unsubHint();
      unsubRoundStart();
      unsubRoundStarted();
      unsubStartRound();
      unsubCorrectGuess();
      unsubTurnTimeout();
      unsubNewTurn();
      unsubSyncState();
    };
  }, [t, isEn, language, currentVoiceGender, isCurrentClientHolder, activeCategory, localTargetWord, currentRoundEndsAt, myPlayerId, activeHolderName, activeHolderAvatar, currentRoundStatus, currentCardIndex, currentCard.id, serverTurnData?.turnDuration, turnDuration]);

  // Reset local guess state ONLY when card/round actually changes
  const lastCardIdRef = useRef<string>('');
  useEffect(() => {
    const activeCardId = serverTurnData?.cardId || currentCard.id || String(currentCardIndex);
    if (lastCardIdRef.current !== activeCardId) {
      lastCardIdRef.current = activeCardId;
      isHandledRef.current = false;
      setCurrentGuess('');
      setIsSuccess(false);
      setIsShaking(false);
      setShowHintText(Boolean(serverTurnData?.hint));
      setRevealedIndices([]);
      setLastReaction(null);
    }
  }, [serverTurnData?.cardId, currentCard.id, currentCardIndex, serverTurnData?.hint]);

  // Isolated time-up handler invoked when GameTimer reaches 0s (timeLeft <= 0)
  const handleTimeUp = useCallback(() => {
    if (isHandledRef.current) return;
    isHandledRef.current = true;

    // 1. עצירת הסיבוב הנוכחי
    setIsRoundActive(false);
    setGameState('ended');
    setRoundState('ended');
    setRoundStatus('ended');
    setRoundEndTime(0);
    setRoundEndsAt(0);
    isRoundActiveRef.current = false;
    roundEndTimeRef.current = 0;

    try {
      sounds.soundError();
    } catch (e) {}

    // Only host or current card holder triggers the turn timeout broadcast to avoid duplication
    if (!isHost && !isCurrentClientHolder) {
      return;
    }

    // 2. איתור האינדקס הנוכחי והעברה לשחקן הבא ברשימה (מעגלית)
    const playerList = (serverTurnData?.players && serverTurnData.players.length > 0)
      ? serverTurnData.players
      : players;
    const playerIds = playerList.map((p) => p.id);
    const currentIndex = playerIds.indexOf(effectiveHolderId);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % playerIds.length : 0;
    const nextHolderId = playerIds[nextIndex] || playerIds[0] || 'p-host';

    // 3. בחירת קלף חדש לתור הבא מתוך STATIC_CARDS
    const nextCard = STATIC_CARDS[Math.floor(Math.random() * STATIC_CARDS.length)];
    const missed = targetWord || localTargetWord || (activeCard ? (isEn ? (activeCard.word_en || activeCard.word) : (activeCard.word_he || activeCard.word)) : '');

    // 4. שידור לכל החדר
    const timeoutPayload: TurnTimeoutPayload = {
      missedWord: missed,
      word: missed,
      imageUrl: activeCard?.imageUrl || activeCard?.image,
      reason: 'time_up',
      nextHolderId: nextHolderId,
      nextCard: nextCard,
      nextIndex: nextIndex,
    };

    broadcastTurnTimeout(timeoutPayload);

    const channel = getCurrentSupabaseChannel();
    if (channel && typeof channel.send === 'function') {
      channel.send({
        type: 'broadcast',
        event: 'TURN_TIMEOUT',
        payload: {
          missedWord: missed,
          word: missed,
          nextHolderId: nextHolderId,
          nextCard: nextCard,
        },
      }).catch((err: any) => console.error('Error broadcasting TURN_TIMEOUT:', err));
    }
  }, [
    isHost,
    isCurrentClientHolder,
    serverTurnData?.players,
    players,
    effectiveHolderId,
    targetWord,
    localTargetWord,
    activeCard,
    isEn,
  ]);

  const handleToggleTimerPicker = useCallback(() => {
    setShowTimerPicker((prev) => !prev);
  }, []);

  // Room PIN resolution: strictly network room PIN, zero Solo mode
  const effectivePin = useMemo(() => {
    if (roomPin && roomPin.trim()) return roomPin.trim();
    if (typeof window !== 'undefined') {
      const urlPin = getPinFromUrl();
      if (urlPin && urlPin.trim()) return urlPin.trim();
      const saved = localStorage.getItem('ttg_room_pin');
      if (saved && saved.trim()) return saved.trim();
    }
    const channelPin = getActiveRoomPin();
    if (channelPin && channelPin.trim()) return channelPin.trim();
    return '7742';
  }, [roomPin]);
  const currentPin = effectivePin;
  const currentLang = language;
  const shareUrl = getShareUrl(currentPin, currentLang);

  const shareMessage = isEn
    ? `🎮 Invitation to "Time to Guess" (Time to Guess)! ⏱️\n\nHey! I'm holding the secret picture in a cool live network room.\n🔑 Room PIN code: ${currentPin}\n\n👇 Click here to join instantly:\n${shareUrl}`
    : `🎮 הזמנה למשחק "הזמן לנחש" (Time to Guess)! ⏱️\n\nהיי! אני מחזיק/ה בתמונה הסודית בחדר רשת חי ומגניב.\n🔑 קוד ה-PIN של החדר: ${currentPin}\n\n👇 להצטרפות מהירה בלחיצה אחת:\n${shareUrl}`;

  const whatsappDirectUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;

  const handleQuickWhatsAppShare = async (e: React.MouseEvent) => {
    sounds.soundSuccess();
    if (typeof navigator !== 'undefined' && navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      e.preventDefault();
      try {
        await navigator.share({
          title: isEn ? 'Time to Guess 🃏' : 'הזמן לנחש 🃏',
          text: shareMessage,
        });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }
  };

  // Start round handler (Host or current holder clicks "התחל סיבוב! 🚀")
  const handleStartRound = () => {
    console.log('>>> [START_ROUND CLICKED]');

    // 1. משוב קולי ורטט
    try {
      if (typeof sounds !== 'undefined' && sounds) {
        if (typeof (sounds as any).soundStartRound === 'function') {
          (sounds as any).soundStartRound();
        } else if (typeof sounds.soundSuccess === 'function') {
          sounds.soundSuccess();
        }
      }
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (e) {
      console.warn('Audio/Vibration error:', e);
    }

    const duration = Number(turnDuration || serverTurnData?.turnDuration) || 60;
    const endsAt = Date.now() + duration * 1000;

    // 2. עדכון כל משתני ה-State האפשריים המגדירים משחק פעיל (סנכרון מלא):
    if (typeof setIsRoundActive === 'function') setIsRoundActive(true);
    if (typeof setGameState === 'function') setGameState('active');
    if (typeof setRoundState === 'function') setRoundState('active');
    if (typeof setRoundStatus === 'function') setRoundStatus('active');
    if (typeof setRoundEndTime === 'function') setRoundEndTime(endsAt);
    if (typeof setRoundEndsAt === 'function') setRoundEndsAt(endsAt);
    if (typeof setTimeLeft === 'function') setTimeLeft(duration);
    isRoundActiveRef.current = true;
    roundEndTimeRef.current = endsAt;
    isHandledRef.current = false;
    setCurrentGuess('');

    onRoundStart?.(endsAt, duration);

    // 3. Resolve active card, word length and categories safely without throwing
    const currentActiveCard = activeTurnCard || (cards && cards[currentCardIndex]) || (cards && cards[0]) || null;
    let cleanWord = '';
    let categoryName = '';
    if (currentActiveCard) {
      const rawWord = isEn ? (currentActiveCard.word_en || currentActiveCard.word) : (currentActiveCard.word_he || currentActiveCard.word);
      if (typeof rawWord === 'string') {
        cleanWord = rawWord.trim();
      }
      categoryName = isEn ? (currentActiveCard.category_en || currentActiveCard.category) : currentActiveCard.category;
    }
    const cleanWordLength = cleanWord.length > 0 ? cleanWord.length : 3;
    const resolvedHolderId = currentHolderId || myPlayerId || effectiveHolderId || 'p-host';

    let hashedWord: string | undefined = undefined;
    if (cleanWord) {
      try {
        hashedWord = encodeWordHash(cleanWord);
      } catch (e) {
        console.warn('Error encoding word hash:', e);
      }
    }

    // 4. שידור בטוח לכל המשתתפים בחדר
    try {
      const payload: RoundStartPayload = {
        category: categoryName || activeCategory || '',
        wordLength: cleanWordLength,
        endTime: endsAt,
        roundEndsAt: endsAt,
        roundEndTime: endsAt,
        duration: duration,
        turnDuration: duration,
        holderId: resolvedHolderId,
        holderName: activeHolderName || '',
        holderAvatar: activeHolderAvatar || '👑',
        cardIndex: currentCardIndex,
        cardId: currentActiveCard ? String(currentActiveCard.id) : undefined,
        card: currentActiveCard || undefined,
        wordHash: hashedWord,
      };

      broadcastRoundStart(payload);

      const channel = getCurrentSupabaseChannel();
      if (channel && typeof channel.send === 'function') {
        channel.send({
          type: 'broadcast',
          event: 'START_ROUND',
          payload: {
            roundEndTime: endsAt,
            duration: duration,
            endTime: endsAt,
            roundEndsAt: endsAt,
            holderId: resolvedHolderId,
            cardId: currentActiveCard ? String(currentActiveCard.id) : undefined,
            category: categoryName || activeCategory || '',
            wordLength: cleanWordLength,
            cardIndex: currentCardIndex,
          },
        }).then(() => {
          console.log('>>> Broadcast START_ROUND sent successfully');
        }).catch((err: any) => console.error('Broadcast error:', err));
      }
    } catch (err) {
      console.error('Network send error:', err);
    }
  };

  // Submit guess with Supabase Realtime validation & turn rotation
  const submitGuess = useCallback((guessWord: string) => {
    if (isSuccess || isHandledRef.current) return;

    let isMatch = false;
    if (syncedRoundCard?.wordHash) {
      isMatch = matchesWordHash(guessWord, syncedRoundCard.wordHash);
    } else if (targetWord) {
      if (isEn) {
        isMatch = guessWord.toUpperCase() === targetWord.toUpperCase();
      } else {
        isMatch = guessWord.length === targetWord.length;
        if (isMatch) {
          for (let i = 0; i < targetWord.length; i++) {
            if (!lettersMatch(guessWord[i], targetWord[i])) {
              isMatch = false;
              break;
            }
          }
        }
      }
    }

    if (isMatch) {
      sounds.soundSuccess();
      const points = 10;
      const winnerId = myPlayerId;
      const winner = activePlayers.find((p) => p.id === winnerId);

      setIsSuccess(true);
      isHandledRef.current = true;
      setTimeout(() => {
        setIsSuccess(false);
        setCurrentGuess('');
      }, 600);

      broadcastCorrectGuess({
        winnerId,
        winnerName: winner?.name || (isEn ? 'Winner!' : 'מנחש/ת!'),
        winnerAvatar: winner?.avatar || '🎉',
        word: guessWord,
        imageUrl: currentCard.imageUrl || currentCard.image,
        points,
        nextHolderId: '',
        nextIndex: 0,
        nextCardIndex: 0,
      });
    } else {
      sounds.soundError();
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
        setCurrentGuess('');
      }, 500);
    }
  }, [
    isSuccess,
    syncedRoundCard?.wordHash,
    targetWord,
    isEn,
    currentRoundEndsAt,
    myPlayerId,
    activePlayers,
    serverTurnData?.holderId,
    activePlayerId,
    currentCardIndex,
    cards.length,
    currentCard.imageUrl,
    currentCard.image,
  ]);

  // Handle letter typing from virtual keyboard or physical keyboard
  const handleKeyPress = useCallback((letter: string) => {
    if (isSuccess || winnerCelebration) return;
    if (isCurrentClientHolder) return;
    if (!isGameActive) return;

    const char = isEn ? letter.toUpperCase() : (normalizeHebrewInput(letter) || letter);
    if (!char) return;

    setCurrentGuess((prev) => {
      if (prev.length >= wordLength) return prev;
      const nextGuess = prev + char;
      if (nextGuess.length === wordLength) {
        setTimeout(() => {
          submitGuess(nextGuess);
        }, 40);
      }
      return nextGuess;
    });
  }, [isSuccess, winnerCelebration, isCurrentClientHolder, isGameActive, isEn, wordLength, submitGuess]);

  // Handle backspace
  const handleBackspace = useCallback(() => {
    if (isSuccess || winnerCelebration) return;
    setCurrentGuess((prev) => prev.slice(0, -1));
  }, [isSuccess, winnerCelebration]);

  // Physical keyboard listener
  useEffect(() => {
    if (isCurrentClientHolder) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSuccess || winnerCelebration) return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
        return;
      }

      // Single character input
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (isEn) {
          if (/^[a-zA-Z]$/.test(e.key)) {
            e.preventDefault();
            sounds.soundKeypress();
            handleKeyPress(e.key.toUpperCase());
          }
        } else {
          const hebrewChar = normalizeHebrewInput(e.key);
          if (hebrewChar) {
            e.preventDefault();
            sounds.soundKeypress();
            handleKeyPress(hebrewChar);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress, handleBackspace, isSuccess, winnerCelebration, isCurrentClientHolder, isEn]);

  // Holder sends reaction to all devices via Supabase Realtime broadcast
  const sendHolderReaction = (reaction: 'yes' | 'no' | 'hot' | 'cold', label: string) => {
    // Play sound chime + formant vocalization + speak the word with chosen voice gender
    sounds.soundClue(reaction, language, currentVoiceGender);
    setLastReaction(label);

    broadcastReaction({
      reaction,
      senderName: activeHolderName,
      timestamp: Date.now(),
    });
  };

  // Holder gives hint
  const handleGiveHint = () => {
    sounds.soundHint();
    setShowHintText(true);

    broadcastHint({
      hint: activeHint || currentCard.hint || '',
    });
  };

  // Skip turn: Host advances turn; guest requests skip from Host
  const handleSkipTurn = () => {
    sounds.soundWarning();
    if (myPlayerId === 'p-host') {
      onCardTimeout();
    } else {
      broadcastSkipTurn(myPlayerId);
    }
  };

  // Change timer
  const handleSelectTimerDuration = (sec: number) => {
    sounds.soundSuccess();
    if (onChangeTurnDuration) onChangeTurnDuration(sec);
    broadcastSettingsUpdate({
      turnDuration: sec,
    });
    setShowTimerPicker(false);
  };

  return (
    <div className="w-full flex flex-col items-center animate-fadeIn select-none relative" dir={isEn ? 'ltr' : 'rtl'}>
      {/* Real-time Floating Reaction Toast */}
      {floatingReaction && (
        <div className="fixed top-6 inset-x-0 mx-auto max-w-xs z-50 flex items-center justify-center pointer-events-none animate-bounce">
          <div className="bg-black/90 border-2 border-amber-400/80 text-white px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
              {floatingReaction.reactionType === 'yes' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400" strokeWidth={2.4} />
              ) : floatingReaction.reactionType === 'no' ? (
                <XCircle className="w-6 h-6 text-rose-400" strokeWidth={2.4} />
              ) : floatingReaction.reactionType === 'hot' ? (
                <Flame className="w-6 h-6 text-amber-400" strokeWidth={2.4} />
              ) : floatingReaction.reactionType === 'cold' ? (
                <Snowflake className="w-6 h-6 text-cyan-400" strokeWidth={2.4} />
              ) : (
                <Volume2 className="w-6 h-6 text-pink-400" strokeWidth={2.2} />
              )}
            </div>
            <div>
              <div className="text-[11px] text-amber-300 font-bold">{t.reactionReceived}</div>
              <div className="text-sm font-black text-white">{floatingReaction.text}</div>
            </div>
          </div>
        </div>
      )}

      {/* Top action bar: Controlled layout with padding, overflow safety, and strict compact dimensions */}
      <div className="w-full px-2 box-border overflow-hidden flex items-center justify-between gap-1 sm:gap-1.5 mb-2.5">
        {/* 1. Leave Game */}
        <button
          onClick={onLeaveGame}
          className="btn-3d btn-3d-dark h-9 px-2 sm:px-2.5 rounded-xl text-xs font-bold text-slate-200 hover:text-rose-300 flex items-center justify-center gap-1 cursor-pointer shadow-sm shrink-0"
          title={isEn ? 'Leave Game' : 'צא מהמשחק'}
        >
          <LogOut className={`w-3.5 h-3.5 text-slate-300 ${isEn ? '' : 'rotate-180'}`} strokeWidth={2.2} />
          <span className="hidden xs:inline">{t.leaveGame}</span>
        </button>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* 2. Room PIN badge - ALWAYS displayed in network room */}
          <div
            className="btn-3d btn-3d-dark h-9 px-2 sm:px-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 shadow-sm shrink-0 select-text"
            title={`Room PIN: ${effectivePin}`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" strokeWidth={2.2} />
            <span className="text-emerald-300 font-mono tracking-wider font-black text-[11px] sm:text-xs">PIN: {effectivePin}</span>
          </div>

          {/* 3. Language Switcher */}
          {onToggleLanguage && (
            <button
              onClick={() => {
                sounds.soundKeypress();
                onToggleLanguage();
              }}
              className="btn-3d btn-3d-dark h-9 w-9 min-w-[36px] rounded-xl text-xs font-bold text-white flex items-center justify-center cursor-pointer shadow-sm shrink-0"
              title={isEn ? 'Switch to Hebrew' : 'עבור לאנגלית'}
            >
              <Globe className="w-3.5 h-3.5 text-pink-300 shrink-0" strokeWidth={2.2} />
            </button>
          )}

          {/* 4. WhatsApp Share Room Button */}
          <WhatsAppShareButton
            pin={currentPin}
            language={language}
            variant="icon"
            className="!h-9 !w-9 !min-w-[36px]"
          />

          {/* 5. Sound Toggle - Fixed compact w-9 h-9 size (36px x 36px) prevents any overflow */}
          <button
            onClick={onToggleMute}
            className="btn-3d btn-3d-dark h-9 w-9 min-w-[36px] rounded-xl flex items-center justify-center text-slate-300 cursor-pointer shadow-sm shrink-0"
            title={isMuted ? (isEn ? 'Unmute' : 'הפעל צלילים') : (isEn ? 'Mute' : 'השתק')}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" strokeWidth={2.2} />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" strokeWidth={2.2} />
            )}
          </button>
        </div>
      </div>

      {/* Compact Scoreboard (טבלת התוצאות) positioned directly above the photo frame */}
      <div className={`w-full mb-2 bg-black/40 backdrop-blur-md border border-white/15 rounded-2xl p-2 sm:p-2.5 shadow-lg ${isEn ? 'text-left' : 'text-right'}`}>
        <div className="flex items-center justify-between mb-1.5 px-1">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.boardTitle}</span>
          </div>
          <div className="text-[11px] font-bold text-pink-300 flex items-center gap-1">
            <span className="text-slate-400">{t.holdingText}</span>
            <span className="text-white font-extrabold">{activeHolderName}</span>
            <span>{activeHolderAvatar}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {activePlayers.map((p) => {
            const isHolding = p.id === activePlayerId || (serverTurnData && serverTurnData.holderId === p.id);
            const isMe = p.id === myPlayerId;
            return (
              <div
                key={p.id}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border transition-all text-xs ${
                  isHolding
                    ? 'bg-purple-600/30 border-purple-400/50 text-purple-100 shadow-sm'
                    : 'bg-white/5 border-white/10 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm shrink-0">{p.avatar}</span>
                  <span className="font-bold truncate max-w-[65px] sm:max-w-[85px] text-white">
                    {p.name}
                  </span>
                  {isMe && <span className="text-[9px] text-pink-300 font-extrabold shrink-0">({t.you})</span>}
                  {isHolding && <span className="text-[10px] shrink-0" title={t.holdingBadge}>👑</span>}
                  {p.streak > 1 && (
                    <span className="text-[9px] text-orange-400 font-black shrink-0 flex items-center">
                      🔥{p.streak}
                    </span>
                  )}
                </div>
                <span className="font-black text-emerald-400 text-xs ml-1 shrink-0 font-mono">
                  {p.score} {t.pts}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Streak / Combo Celebratory Notification Banner */}
      {streakBanner && (
        <div className="w-full mb-2 p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-[0_8px_25px_rgba(16,185,129,0.5)] border-2 border-emerald-300 flex items-center justify-between gap-2 animate-bounce z-30">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl sm:text-2xl animate-spin shrink-0">🌟</span>
            <div className="min-w-0 text-right">
              <div className="text-xs sm:text-sm font-black flex items-center gap-1.5 truncate">
                <span>{streakBanner.winnerAvatar || '🎉'}</span>
                <span className="truncate">{streakBanner.winnerName} {isEn ? 'guessed correctly!' : 'ניחש/ה נכון!'}</span>
                <span className="bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full text-xs font-black shrink-0">+{streakBanner.points}</span>
              </div>
              <div className="text-[10px] sm:text-xs text-emerald-100 font-bold truncate">
                {streakBanner.word ? <span>{isEn ? `"${streakBanner.word}"` : `המילה: "${streakBanner.word}"`} • </span> : null}
                <span>{isEn ? '⏱️ Clock reset — Keep the streak going!' : '⏱️ השעון אופס לזמן מלא — ממשיכים ברצף!'} 🔥</span>
              </div>
            </div>
          </div>
          <span className="text-[11px] font-black bg-white/20 px-2.5 py-1 rounded-xl shrink-0 tracking-wider">
            COMBO! 🚀
          </span>
        </div>
      )}

      {/* Main Game Display Frame */}
      <div className="w-full relative rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-900 mb-2 group aspect-[4/3] max-h-[220px] sm:max-h-[240px] flex items-center justify-center">
        {/* Floating Overlay Timer Badge inside the image frame (Isolated component - zero screen re-renders) */}
        <div className={`absolute top-3 ${isEn ? 'right-3' : 'left-3'} z-20`}>
          <GameTimer
            roundStatus={currentRoundStatus}
            roundEndsAt={currentRoundEndsAt}
            turnDuration={serverTurnData?.turnDuration || turnDuration}
            isEn={isEn}
            onTimeUp={handleTimeUp}
            showTimerPicker={showTimerPicker}
            onToggleTimerPicker={handleToggleTimerPicker}
          />
        </div>

        {isCurrentClientHolder ? (
          /* Card Holder View: Sees the photo and the word! */
          <>
            <img
              src={activeCard.imageUrl || activeCard.image || undefined}
              alt={targetWord}
              className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
                isSuccess ? 'scale-105 brightness-110' : ''
              }`}
              loading="eager"
              crossOrigin="anonymous"
              onError={(e) => {
                const target = e.currentTarget;
                const fallbackUrl = activeCard.fallback || '';
                if (fallbackUrl && target.src !== fallbackUrl) {
                  target.src = fallbackUrl;
                }
              }}
            />

            {/* Category badge */}
            <div className={`absolute top-3 ${isEn ? 'left-3' : 'right-3'} bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/20 shadow flex items-center gap-1.5`}>
              <span>{t.categoryLabel}</span>
              <span className="text-pink-300 font-extrabold">{activeCategory}</span>
            </div>

            {/* Secret word badge */}
            <div className="absolute bottom-3 inset-x-4 mx-auto max-w-fit bg-black/85 backdrop-blur-md px-4 py-1.5 rounded-full text-center text-sm font-black text-white border border-pink-500/40 shadow-xl flex items-center gap-2">
              <span className="text-amber-300">{t.wordLabel}</span>
              <span className="text-pink-300 text-base uppercase font-extrabold">{targetWord}</span>
            </div>
          </>
        ) : (
          /* Guesser View: Server NEVER sends image or word. Absolutely 0 leaks! */
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 sm:p-5 bg-gradient-to-br from-[#2D1454] via-[#1E1B4B] to-[#0F172A] relative">
            <div className="w-13 h-13 sm:w-16 sm:h-16 mb-2 rounded-2xl bg-pink-500/20 border-2 border-pink-400/40 flex items-center justify-center shadow-[0_0_25px_rgba(253,121,168,0.4)] animate-bounce">
              <HelpCircle className="w-8 h-8 sm:w-10 sm:h-10 text-pink-300" strokeWidth={2.2} />
            </div>
            <div className="font-black text-sm sm:text-base text-white mb-1 flex items-center gap-1.5">
              <span>{t.holdingText}</span>
              <span className="text-amber-300 font-extrabold">{activeHolderName}</span>
              <span>{activeHolderAvatar}</span>
            </div>

            {/* Waiting status overlay badge directly inside the picture frame */}
            {!isGameActive ? (
              <div className="mt-1.5 bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-amber-400/50 shadow-xl flex items-center justify-center gap-2 text-amber-200 text-xs sm:text-sm font-black animate-pulse max-w-[92%]">
                <TimerIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" strokeWidth={2.4} />
                <span className="truncate">
                  {isEn
                    ? `Waiting for ${activeHolderName} to start the round...`
                    : `ממתינים לתחילת הסיבוב על ידי ${activeHolderName}...`}
                </span>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-slate-300 max-w-xs leading-relaxed">
                {t.guesserMystery}
              </p>
            )}

            {/* Category badge for guesser */}
            <div className={`absolute top-3 ${isEn ? 'left-3' : 'right-3'} bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/20 shadow flex items-center gap-1.5`}>
              <span>{t.categoryLabel}</span>
              <span className="text-pink-300 font-extrabold">{activeCategory}</span>
            </div>

            {/* Live hint if triggered by Holder */}
            {showHintText && activeHint && (
              <div className="absolute bottom-2.5 inset-x-3 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-xl text-center text-xs text-amber-200 border border-amber-400/40 animate-fadeIn flex items-center justify-center gap-1.5 shadow-lg">
                <div className="w-4 h-4 rounded-md bg-amber-400/20 flex items-center justify-center border border-amber-400/30">
                  <Lightbulb className="w-3 h-3 text-amber-300" strokeWidth={2.2} />
                </div>
                <span className="font-bold">{isEn ? 'Hint:' : 'רמז:'}</span>
                <span>{activeHint}</span>
              </div>
            )}
          </div>
        )}

        {/* Winner celebration / Timeout word reveal overlay */}
        {Boolean(winnerCelebration) && (
          <div className="absolute inset-0 bg-emerald-950/95 backdrop-blur-md flex flex-col items-center justify-center animate-fadeIn text-center p-4 z-20">
            {winnerCelebration?.image && (
              <img
                src={winnerCelebration.image}
                alt={winnerCelebration.word || targetWord}
                className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl border-2 border-emerald-400/50 shadow-lg mb-1.5"
                loading="eager"
                crossOrigin="anonymous"
                onError={(e) => {
                  const target = e.currentTarget;
                  const fallbackUrl = currentCard.fallback || '';
                  if (fallbackUrl && target.src !== fallbackUrl) {
                    target.src = fallbackUrl;
                  }
                }}
              />
            )}
            {winnerCelebration?.winnerName?.includes('⏰') || winnerCelebration?.winnerName?.includes('נגמר') ? (
              <TimerIcon className="w-8 h-8 text-amber-400 mb-1 animate-pulse" strokeWidth={2.4} />
            ) : (
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-1 animate-bounce" strokeWidth={2.4} />
            )}
            <span className="text-xl sm:text-2xl font-black text-white drop-shadow-md flex items-center gap-2">
              {winnerCelebration?.winnerName ? (
                <>
                  {winnerCelebration.winnerName.includes('⏰') ? null : (
                    <Trophy className="w-6 h-6 text-amber-300 inline drop-shadow" strokeWidth={2.2} />
                  )}
                  <span>{winnerCelebration.winnerName}</span>
                </>
              ) : (
                t.correctAlert
              )}
            </span>
            <span className="text-emerald-300 font-bold text-sm sm:text-base mt-0.5">
              {isEn ? 'The word was:' : 'המילה הייתה:'} <b className="text-white uppercase tracking-wider">{winnerCelebration?.word || targetWord}</b>
            </span>
            {winnerCelebration?.points ? (
              <span className="text-xs text-amber-300 font-extrabold mt-1">
                +{winnerCelebration.points} {t.pts}!
              </span>
            ) : null}
          </div>
        )}
      </div>

      {/* Mid-game Timer Picker Dropdown */}
      {showTimerPicker && (
        <div className="w-full mb-2 bg-black/80 backdrop-blur-md border border-pink-500/40 rounded-2xl p-2.5 flex items-center justify-between gap-2 animate-fadeIn shadow-2xl">
          <span className="text-xs font-bold text-slate-200 whitespace-nowrap pr-1 flex items-center gap-1">
            <TimerIcon className="w-3.5 h-3.5 text-pink-400" strokeWidth={2.2} />
            <span>{t.changeTimer}</span>
          </span>
          <div className="flex-1 grid grid-cols-4 gap-1.5">
            {[
              { sec: 15, label: t.sec15 },
              { sec: 30, label: t.sec30 },
              { sec: 45, label: t.sec45 },
              { sec: 60, label: t.sec60 },
            ].map(({ sec, label }) => (
              <button
                key={sec}
                type="button"
                onClick={() => handleSelectTimerDuration(sec)}
                className={`btn-3d py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  turnDuration === sec
                    ? 'btn-3d-timer-active text-white'
                    : 'btn-3d-timer-inactive text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Waiting Status / Start Round Actions: for holder (shows Start Round button when waiting, and active notice when round is active) */}
      {isCurrentClientHolder && (
        isGameActive ? (
          <div className="w-full my-2 p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-emerald-900/80 via-teal-900/70 to-emerald-950/80 border-2 border-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.3)] text-center animate-fadeIn flex items-center justify-center gap-2.5">
            <span className="text-base sm:text-lg animate-bounce">⏱️</span>
            <span className="text-xs sm:text-sm font-black text-emerald-200 tracking-wide">
              {isEn ? '⏱️ Round is underway! Answer guessers (Yes / No / Warm / Cold)' : '⏱️ הסיבוב בעיצומו! ענה למנחשים (כן / לא / חם / קר)'}
            </span>
          </div>
        ) : (
          <div className="w-full my-2 p-3 sm:p-4 rounded-3xl bg-gradient-to-r from-purple-900/60 via-pink-900/50 to-indigo-900/60 border-2 border-pink-500/50 shadow-2xl text-center animate-fadeIn">
            <div className="text-xs sm:text-sm font-extrabold text-pink-200 mb-3 flex items-center justify-center gap-2">
              <span className="text-xl">👑</span>
              <span>{isEn ? 'You are holding the secret picture! Ready?' : 'התמונה אצלך! כולם ממתינים שתתחיל/י את הסיבוב'}</span>
            </div>

            <button
              type="button"
              onClick={handleStartRound}
              className="btn-3d btn-3d-purple w-full py-3.5 px-6 text-white font-black text-base sm:text-lg rounded-2xl flex items-center justify-center gap-2.5 cursor-pointer shadow-[0_10px_35px_rgba(168,85,247,0.6)] animate-pulse hover:scale-102 active:scale-98 transition-all pointer-events-auto select-none"
            >
              <span className="shimmer-sweep" />
              <Rocket className="w-5 h-5 text-amber-300 animate-bounce" />
              <span className="tracking-wide">{isEn ? 'Start Round! 🚀' : 'התחל סיבוב! 🚀'}</span>
            </button>
          </div>
        )
      )}

      {/* Role-Specific Interactive Area */}
      {isCurrentClientHolder ? (
        /* HOLDER INTERACTION AREA: 4 Compact 3D Clue Response Buttons right under the image */
        <div className="w-full flex flex-col items-center animate-fadeIn">
          {/* 4 Compact 3D Buttons: כן, לא, חם, קר */}
          <div className="w-full grid grid-cols-4 gap-1.5 sm:gap-2 my-2">
            <button
              type="button"
              disabled={!isGameActive}
              onClick={() => sendHolderReaction('yes', t.btnYes)}
              className={`btn-3d btn-3d-clue-yes h-[44px] py-1 px-1 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all shadow-md ${
                isGameActive ? 'cursor-pointer active:scale-95' : 'opacity-50 cursor-not-allowed pointer-events-none'
              }`}
              title={isEn ? 'Yes (Spoken Voice)' : 'כן (השמעת קול)'}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300 drop-shadow shrink-0" strokeWidth={2.4} />
              <span className="font-black text-xs sm:text-sm drop-shadow">{t.btnYes}</span>
            </button>

            <button
              type="button"
              disabled={!isGameActive}
              onClick={() => sendHolderReaction('no', t.btnNo)}
              className={`btn-3d btn-3d-clue-no h-[44px] py-1 px-1 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all shadow-md ${
                isGameActive ? 'cursor-pointer active:scale-95' : 'opacity-50 cursor-not-allowed pointer-events-none'
              }`}
              title={isEn ? 'No (Spoken Voice)' : 'לא (השמעת קול)'}
            >
              <XCircle className="w-4 h-4 text-rose-300 drop-shadow shrink-0" strokeWidth={2.4} />
              <span className="font-black text-xs sm:text-sm drop-shadow">{t.btnNo}</span>
            </button>

            <button
              type="button"
              disabled={!isGameActive}
              onClick={() => sendHolderReaction('hot', t.btnHot)}
              className={`btn-3d btn-3d-clue-hot h-[44px] py-1 px-1 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all shadow-md ${
                isGameActive ? 'cursor-pointer active:scale-95' : 'opacity-50 cursor-not-allowed pointer-events-none'
              }`}
              title={isEn ? 'Hot (Spoken Voice)' : 'חם (השמעת קול)'}
            >
              <Flame className="w-4 h-4 text-amber-300 drop-shadow shrink-0" strokeWidth={2.4} />
              <span className="font-black text-xs sm:text-sm drop-shadow">{t.btnHot}</span>
            </button>

            <button
              type="button"
              disabled={!isGameActive}
              onClick={() => sendHolderReaction('cold', t.btnCold)}
              className={`btn-3d btn-3d-clue-cold h-[44px] py-1 px-1 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all shadow-md ${
                isGameActive ? 'cursor-pointer active:scale-95' : 'opacity-50 cursor-not-allowed pointer-events-none'
              }`}
              title={isEn ? 'Cold (Spoken Voice)' : 'קר (השמעת קול)'}
            >
              <Snowflake className="w-4 h-4 text-cyan-300 drop-shadow shrink-0" strokeWidth={2.4} />
              <span className="font-black text-xs sm:text-sm drop-shadow">{t.btnCold}</span>
            </button>
          </div>

          {/* Compact Voice Gender Selector + Holder Controls Bar */}
          <div className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 bg-black/40 rounded-xl border border-white/10 text-xs">
            <div className="flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-pink-400 shrink-0" strokeWidth={2.2} />
              <span className="text-[11px] font-bold text-slate-300 hidden sm:inline">{isEn ? 'Voice:' : 'קול:'}</span>
              <VoiceGenderSelector
                voiceGender={currentVoiceGender}
                onChangeVoiceGender={handleVoiceGenderChange}
                language={language}
                variant="segmented"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {activeHint && (
                <button
                  type="button"
                  onClick={handleGiveHint}
                  className="btn-3d btn-3d-dark flex items-center gap-1 px-2.5 py-1 text-amber-300 rounded-lg text-xs font-bold cursor-pointer"
                  title={t.giveHint}
                >
                  <Lightbulb className="w-3 h-3 text-amber-300" strokeWidth={2.2} />
                  <span className="hidden xs:inline">{t.giveHint}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSkipTurn}
                className="btn-3d btn-3d-dark flex items-center gap-1 px-2.5 py-1 text-slate-300 hover:text-rose-200 rounded-lg text-xs font-bold cursor-pointer"
                title={t.skipTurn}
              >
                <SkipForward className="w-3 h-3 text-slate-300" strokeWidth={2.2} />
                <span className="hidden xs:inline">{t.skipTurn}</span>
              </button>
            </div>
          </div>

          {lastReaction && (
            <div className="w-full mt-1.5 text-xs font-bold text-amber-300 bg-amber-400/10 py-1 px-3 rounded-xl border border-amber-400/20 text-center animate-fadeIn">
              {t.holderReaction} <b>{lastReaction}</b>
            </div>
          )}
        </div>
      ) : (
        /* GUESSER INTERACTION AREA */
        <div className="w-full flex flex-col items-center animate-fadeIn">
          <p className="text-xs sm:text-sm font-bold mb-1.5 text-center flex items-center justify-center gap-1.5">
            {!isGameActive ? (
              <span className="text-amber-300 animate-pulse">
                {isEn ? '⏳ Waiting for round to start...' : '⏳ ממתינים לתחילת הסיבוב...'}
              </span>
            ) : (
              <span className="text-slate-300">
                {t.guessLabel}
              </span>
            )}
          </p>

          {/* Responsive & Elastic Letter Boxes Container */}
          <div
            className={`w-full max-w-full flex justify-center items-center py-3 px-2 transition-transform ${
              boxConfig.gapClass
            } ${isShaking ? 'animate-shake' : ''}`}
            dir={isEn ? 'ltr' : 'rtl'}
          >
            {Array.from({ length: wordLength }).map((_, index) => {
              const letter = currentGuess[index] || '';
              const isRevealedByHint = revealedIndices.includes(index);
              const isCurrentFocus = currentGuess.length === index && isGameActive;

              return (
                <div
                  key={index}
                  style={boxConfig.style}
                  className={`min-w-0 shrink-0 p-0 text-center font-black select-none uppercase transition-all leading-none flex items-center justify-center ${
                    boxConfig.boxClass
                  } ${
                    isSuccess
                      ? 'bg-emerald-500/30 border-2 border-emerald-400 text-emerald-100 scale-105 shadow-lg shadow-emerald-500/30 z-10'
                      : isCurrentFocus
                      ? 'bg-pink-500/25 border-2 border-pink-400 text-white -translate-y-1 shadow-[0_0_15px_rgba(244,114,182,0.5)] ring-2 ring-pink-400/80 z-10 animate-pulse'
                      : letter
                      ? 'bg-white/15 border-2 border-white/40 text-white shadow-sm'
                      : isWaitingForWordLength
                      ? 'bg-white/5 border-2 border-white/20 text-white/30 animate-pulse'
                      : 'bg-white/5 border-2 border-white/15 text-white/50'
                  } ${isRevealedByHint ? 'text-amber-300' : ''}`}
                >
                  {letter || (isWaitingForWordLength ? '•' : '')}
                </div>
              );
            })}
          </div>

          {/* Onscreen Virtual Keyboard */}
          <VirtualKeyboard
            onLetterPress={handleKeyPress}
            onBackspace={handleBackspace}
            onHintClick={handleGiveHint}
            canHint={!isSuccess}
            disabled={isSuccess || isShaking || !isGameActive}
            language={language}
          />
        </div>
      )}

    </div>
  );
};
