import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GameScreen, Player, RoomSettings, CardItem, Language, VoiceGender, HostStep } from './types/game';
import { DEFAULT_CARDS, shuffleDeck } from './data/cards';
import { RoleSelectScreen } from './components/RoleSelectScreen';
import { HostScreen } from './components/HostScreen';
import { PlayerJoinScreen } from './components/PlayerJoinScreen';
import { PlayerLobbyScreen } from './components/PlayerLobbyScreen';
import { GameTable } from './components/GameTable';
import { GameOverModal } from './components/GameOverModal';
import { CustomCardModal } from './components/CustomCardModal';
import { ShareModal } from './components/ShareModal';
import { IntroVideoModal } from './components/IntroVideoModal';
import { AnimatedQuestionMarksBackground } from './components/AnimatedQuestionMarksBackground';
import { sounds } from './utils/audio';
import {
  getSupabaseRoomChannel,
  getCurrentSupabaseChannel,
  leaveSupabaseRoomChannel,
  extractPlayersFromPresence,
  addSupabaseListener,
  trackPlayer,
  broadcastGameStart,
  broadcastSettingsUpdate,
  broadcastSyncState,
  encodeWordHash,
  TurnStartedPayload,
  RoomStatePayload,
  RoundStartPayload,
  CorrectGuessPayload,
  TurnTimeoutPayload,
  GameStartPayload,
  SettingsUpdatePayload,
  SyncStatePayload,
} from './utils/supabaseGame';
import { getPinFromUrl, getLangFromUrl } from './utils/url';

export default function App() {
  // Read URL parameters immediately with instant fallback
  const initialParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialPinParam = initialParams?.get('pin') || getPinFromUrl();
  const initialLangParam = initialParams?.get('lang') || getLangFromUrl();

  const [screen, setScreen] = useState<GameScreen>(() => {
    if (initialPinParam && initialPinParam.trim()) {
      return 'player-join';
    }
    return 'welcome';
  });

  const [pin, setPin] = useState<string>(() => {
    if (initialPinParam && initialPinParam.trim()) {
      return initialPinParam.trim();
    }
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ttg_room_pin');
      if (saved && saved.trim()) return saved.trim();
    }
    return '';
  });

  const [hasPurchasedLicense, setHasPurchasedLicense] = useState<boolean>(false);
  const [hostStep, setHostStep] = useState<HostStep>('create');
  const [isGeneratingPin, setIsGeneratingPin] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(sounds.isMuted);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isLiveServer, setIsLiveServer] = useState<boolean>(false);
  const [serverTurnData, setServerTurnData] = useState<TurnStartedPayload | null>(null);
  const [joinedRoom, setJoinedRoom] = useState<boolean>(false);

  // Intro video modal state (direct mp4 for mobile-optimized native HTML5 video autoplay)
  const CLOUDINARY_DEFAULT_INTRO = 'https://res.cloudinary.com/afjcyngg/video/upload/gemini_generated_video_6c8f0e40.mp4';

  const [introVideoUrl, setIntroVideoUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ttg_intro_video_url');
      if (saved && !saved.includes('youtube.com/watch?v=lYah5-xEeck')) {
        return saved;
      }
    }
    return CLOUDINARY_DEFAULT_INTRO;
  });

  // Regular entry (no PIN) -> always show full intro video with Skip option.
  // Direct PIN entry (?pin=XXXX) -> skip video directly to participant join screen.
  const [isIntroVideoOpen, setIsIntroVideoOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const pinInUrl = getPinFromUrl();
    return !pinInUrl;
  });

  // Priority 1: Instant URL parameter detection on initial mount (Direct Join by PIN vs Regular entry)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const pinParam = params.get('pin') || getPinFromUrl();
    const langParam = params.get('lang') || getLangFromUrl();

    if (pinParam) {
      const cleanPin = pinParam.trim();
      setPin(cleanPin); // שמירת ה-PIN
      if (langParam === 'he' || langParam === 'en') {
        setLanguage(langParam);
        localStorage.setItem('ttg_lang', langParam);
        document.documentElement.lang = langParam;
        document.documentElement.dir = langParam === 'he' ? 'rtl' : 'ltr';
      }
      setScreen('player-join'); // חובה: העברה ישירה למסך "כניסת משתתף/ת" במקום 'home'!
      setIsIntroVideoOpen(false); // דילוג על הסרטון בכניסה עם PIN
    } else {
      // כניסה רגילה לאתר – הצגת סרטון הפתיחה המלא עם אפשרות דילוג
      setIsIntroVideoOpen(true);
    }
  }, []);

  const handleUpdateVideoUrl = (newUrl: string) => {
    setIntroVideoUrl(newUrl);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ttg_intro_video_url', newUrl);
    }
  };

  // Language management (Hebrew / English)
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlLang = params.get('lang');
      if (urlLang === 'he' || urlLang === 'en') {
        localStorage.setItem('ttg_lang', urlLang);
        return urlLang;
      }
      const saved = localStorage.getItem('ttg_lang');
      if (saved === 'en' || saved === 'he') return saved;
    }
    return 'he';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    }
  }, [language]);

  const handleToggleLanguage = useCallback(() => {
    setLanguage((prev) => {
      const next = prev === 'he' ? 'en' : 'he';
      if (typeof window !== 'undefined') {
        localStorage.setItem('ttg_lang', next);
      }
      return next;
    });
  }, []);

  // Voice Gender preference (Male / Female)
  const [voiceGender, setVoiceGender] = useState<VoiceGender>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('game_voice_gender');
      if (saved === 'male' || saved === 'female') return saved;
    }
    return sounds.voiceGender;
  });

  const handleChangeVoiceGender = useCallback((gender: VoiceGender) => {
    sounds.setVoiceGender(gender);
    setVoiceGender(gender);
  }, []);

  // Settings
  const [settings, setSettings] = useState<RoomSettings>(() => {
    const savedDuration = typeof window !== 'undefined' ? localStorage.getItem('game_turn_duration') : null;
    return {
      turnDuration: savedDuration ? parseInt(savedDuration, 10) : 15,
      selectedCategories: ['הכל'],
      maxRounds: 10,
    };
  });

  const handleUpdateSettings = useCallback((newSettings: RoomSettings) => {
    setSettings(newSettings);
    if (typeof window !== 'undefined') {
      localStorage.setItem('game_turn_duration', newSettings.turnDuration.toString());
    }
    const channel = getCurrentSupabaseChannel();
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'update_settings',
        payload: { turnDuration: newSettings.turnDuration },
      });
    }
  }, []);

  const handleChangeTurnDuration = useCallback((duration: number) => {
    setSettings((prev) => {
      const updated = { ...prev, turnDuration: duration };
      if (typeof window !== 'undefined') {
        localStorage.setItem('game_turn_duration', duration.toString());
      }
      return updated;
    });
    const channel = getCurrentSupabaseChannel();
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'update_settings',
        payload: { turnDuration: duration },
      });
    }
  }, []);

  // Players: Real connected players only (zero mock data)
  const [players, setPlayers] = useState<Player[]>([]);

  // Persistent, stable myPlayerId & authoritative currentHolderId
  const [myPlayerId, setMyPlayerId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ttg_player_id');
      if (saved && saved.trim()) return saved.trim();
    }
    return 'p-host';
  });
  const [currentHolderId, setCurrentHolderId] = useState<string>('p-host');
  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [totalCardsSolved, setTotalCardsSolved] = useState<number>(0);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState<boolean>(false);

  // Custom cards
  const [customCards, setCustomCards] = useState<CardItem[]>(() => {
    const saved = localStorage.getItem('game_custom_cards');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [isCustomCardModalOpen, setIsCustomCardModalOpen] = useState(false);
  const [playedCardIds, setPlayedCardIds] = useState<Set<string>>(() => new Set());

  // Shuffled deck using Fisher-Yates algorithm
  const [shuffledDeck, setShuffledDeck] = useState<CardItem[]>(() => {
    return shuffleDeck([...DEFAULT_CARDS]);
  });

  const activeDeck = useMemo(() => {
    const all = [...shuffledDeck, ...customCards];
    if (settings.selectedCategories.includes('הכל')) {
      return all;
    }
    return all.filter((c) => settings.selectedCategories.includes(c.category));
  }, [shuffledDeck, customCards, settings.selectedCategories]);

  // Supabase Realtime Channel, Presence, and Broadcast Engine
  useEffect(() => {
    const isRoomActive = joinedRoom || hostStep === 'lobby' || hostStep === 'game' || screen === 'player-lobby' || screen === 'game' || Boolean(pin);
    if (!isRoomActive || !pin || !pin.trim()) return;

    // Connect to room channel (singleton will reuse or establish)
    getSupabaseRoomChannel(pin.trim(), myPlayerId);

    // 1. Connection status listener
    const unsubStatus = addSupabaseListener('status', async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsLiveServer(true);
        const myPlayer = players.find((p) => p.id === myPlayerId);
        const isHost = myPlayerId === 'p-host' || myPlayer?.isHost || false;
        const myName = myPlayer?.name || (isHost ? (language === 'en' ? 'Host' : 'מארח/ת') : (language === 'en' ? 'Player' : 'שחקן'));
        const myAvatar = myPlayer?.avatar || (isHost ? '👑' : '🦁');

        await trackPlayer({
          id: myPlayerId,
          name: myName,
          icon: myAvatar,
          score: myPlayer?.score || 0,
          streak: myPlayer?.streak || 0,
          isHost,
        });
      }
    });

    // 2. Presence tracking: update leaderboard strictly with connected players (zero mock data)
    const unsubPresence = addSupabaseListener('presence', (presencePlayers) => {
      if (presencePlayers && presencePlayers.length > 0) {
        setPlayers((prev) => {
          return presencePlayers.map((p) => {
            const existing = prev.find((x) => x.id === p.id);
            return {
              ...p,
              score: Math.max(p.score, existing?.score || 0),
              streak: Math.max(p.streak || 0, existing?.streak || 0),
            };
          });
        });
      }
    });

    // 3. Game start broadcast
    const unsubGameStart = addSupabaseListener('game_start', (payload) => {
      setJoinedRoom(true);
      setScreen('game');
      if (payload.holderId) {
        setCurrentHolderId(String(payload.holderId));
      }
      if (payload.turnDuration) {
        setSettings((prev) => ({ ...prev, turnDuration: payload.turnDuration }));
      }
      const isHolder = String(myPlayerId) === String(payload.holderId);
      if (!isHolder) {
        setServerTurnData({
          isHolder: false,
          roundStatus: 'waiting',
          roundEndsAt: 0,
          turnEndTime: 0,
          turnDuration: payload.turnDuration || settings.turnDuration,
          cardIndex: payload.cardIndex || 0,
          totalCards: 50,
          holderId: payload.holderId,
          holderName: payload.holderName,
          holderAvatar: payload.holderAvatar,
          image: null,
          imageUrl: null,
          fallback: null,
          word: null,
          category: '',
          hint: null,
          wordLength: 4,
          players: [],
        });
      }
    });

    // 4. Round start broadcast: synchronizes category, wordLength, and exact roundEndsAt timestamp
    const unsubRoundStart = addSupabaseListener('round_start', (payload) => {
      setJoinedRoom(true);
      setScreen('game');
      if (payload.holderId) {
        setCurrentHolderId(String(payload.holderId));
      }
      const isHolder = String(myPlayerId) === String(payload.holderId);
      setServerTurnData((prev) => ({
        isHolder,
        roundStatus: 'active',
        roundEndsAt: payload.roundEndsAt,
        turnEndTime: payload.roundEndsAt,
        turnDuration: payload.turnDuration || settings.turnDuration,
        cardIndex: payload.cardIndex ?? 0,
        totalCards: 50,
        holderId: payload.holderId,
        holderName: payload.holderName || '',
        holderAvatar: payload.holderAvatar || '👑',
        cardId: payload.cardId,
        image: isHolder ? prev?.image || null : null,
        imageUrl: isHolder ? prev?.imageUrl || null : null,
        fallback: null,
        word: isHolder ? prev?.word || null : null,
        wordHash: payload.wordHash,
        category: payload.category,
        hint: payload.hint || null,
        wordLength: payload.wordLength > 0 ? payload.wordLength : 4,
        players: [],
      }));
    });

    // 5. Correct guess broadcast: turn rotation cyclically across participants
    const unsubCorrectGuess = addSupabaseListener('correct_guess', (payload) => {
      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id === payload.winnerId) {
            return {
              ...p,
              score: p.score + payload.points,
              streak: (p.streak || 0) + 1,
            };
          }
          return p;
        })
      );

      if (payload.nextHolderId) {
        setCurrentHolderId(String(payload.nextHolderId));
      }
      const isMeNewHolder = String(myPlayerId) === String(payload.nextHolderId);
      const nextCard = activeDeck[payload.nextCardIndex] || DEFAULT_CARDS[0];
      const nextWord = (language === 'en' ? (nextCard.word_en || nextCard.word) : (nextCard.word_he || nextCard.word)).trim();

      setCurrentCardIndex(payload.nextCardIndex);
      setServerTurnData({
        isHolder: isMeNewHolder,
        roundStatus: 'waiting',
        roundEndsAt: 0,
        turnEndTime: 0,
        turnDuration: settings.turnDuration,
        cardIndex: payload.nextCardIndex,
        totalCards: Math.min(activeDeck.length, 50),
        holderId: payload.nextHolderId,
        holderName: payload.nextHolderId === myPlayerId ? (players.find((p) => p.id === myPlayerId)?.name || 'מחזיק') : '',
        holderAvatar: '👑',
        cardId: nextCard.id,
        image: isMeNewHolder ? (nextCard.imageUrl || nextCard.image) : null,
        imageUrl: isMeNewHolder ? (nextCard.imageUrl || nextCard.image) : null,
        fallback: isMeNewHolder ? nextCard.fallback : null,
        word: isMeNewHolder ? nextWord : null,
        wordHash: undefined,
        category: language === 'en' ? (nextCard.category_en || nextCard.category) : nextCard.category,
        hint: null,
        wordLength: nextWord.length,
        players: [],
      });
    });

    // 6. Turn timeout broadcast: advance holder cyclically
    const unsubTurnTimeout = addSupabaseListener('turn_timeout', (payload) => {
      if (payload.nextHolderId) {
        setCurrentHolderId(String(payload.nextHolderId));
      }
      const isMeNewHolder = String(myPlayerId) === String(payload.nextHolderId);
      const nextCard = activeDeck[payload.nextCardIndex] || DEFAULT_CARDS[0];
      const nextWord = (language === 'en' ? (nextCard.word_en || nextCard.word) : (nextCard.word_he || nextCard.word)).trim();

      setCurrentCardIndex(payload.nextCardIndex);
      setServerTurnData({
        isHolder: isMeNewHolder,
        roundStatus: 'waiting',
        roundEndsAt: 0,
        turnEndTime: 0,
        turnDuration: settings.turnDuration,
        cardIndex: payload.nextCardIndex,
        totalCards: Math.min(activeDeck.length, 50),
        holderId: payload.nextHolderId,
        holderName: payload.nextHolderId === myPlayerId ? (players.find((p) => p.id === myPlayerId)?.name || 'מחזיק') : '',
        holderAvatar: '👑',
        cardId: nextCard.id,
        image: isMeNewHolder ? (nextCard.imageUrl || nextCard.image) : null,
        imageUrl: isMeNewHolder ? (nextCard.imageUrl || nextCard.image) : null,
        fallback: isMeNewHolder ? nextCard.fallback : null,
        word: isMeNewHolder ? nextWord : null,
        wordHash: undefined,
        category: language === 'en' ? (nextCard.category_en || nextCard.category) : nextCard.category,
        hint: null,
        wordLength: nextWord.length,
        players: [],
      });
    });

    // 7. Settings update
    const unsubSettings = addSupabaseListener('update_settings', (payload) => {
      if (payload.turnDuration) {
        setSettings((prev) => ({ ...prev, turnDuration: payload.turnDuration }));
      }
    });

    // 8. Initial Room State Sync: when a participant enters an active round, sync state immediately
    const unsubSyncState = addSupabaseListener('sync_state', (payload: SyncStatePayload) => {
      setJoinedRoom(true);
      setScreen('game');
      if (payload.holderId) {
        setCurrentHolderId(String(payload.holderId));
      }
      const isHolder = String(myPlayerId) === String(payload.holderId);
      setServerTurnData((prev) => ({
        isHolder,
        roundStatus: payload.roundStatus,
        roundEndsAt: payload.roundEndsAt,
        turnEndTime: payload.roundEndsAt,
        turnDuration: payload.turnDuration || settings.turnDuration,
        cardIndex: payload.cardIndex ?? prev?.cardIndex ?? 0,
        totalCards: 50,
        holderId: payload.holderId,
        holderName: payload.holderName || prev?.holderName || '',
        holderAvatar: payload.holderAvatar || prev?.holderAvatar || '👑',
        cardId: payload.cardId,
        image: isHolder ? prev?.image || null : null,
        imageUrl: isHolder ? prev?.imageUrl || null : null,
        fallback: null,
        word: isHolder ? prev?.word || null : null,
        wordHash: payload.wordHash,
        category: payload.category,
        hint: null,
        wordLength: payload.wordLength > 0 ? payload.wordLength : 4,
        players: [],
      }));
    });

    // 9. Host/Holder responds to request_sync from newly joined guessers
    const unsubRequestSync = addSupabaseListener('request_sync', () => {
      if (myPlayerId === 'p-host' || serverTurnData?.isHolder) {
        const currentCard = activeDeck[currentCardIndex] || DEFAULT_CARDS[0];
        const currentWord = (language === 'en' ? (currentCard.word_en || currentCard.word) : (currentCard.word_he || currentCard.word)).trim();
        broadcastSyncState({
          category: language === 'en' ? (currentCard.category_en || currentCard.category) : currentCard.category,
          wordLength: currentWord.length,
          roundEndsAt: serverTurnData?.roundEndsAt || 0,
          holderId: serverTurnData?.holderId || myPlayerId,
          holderName: serverTurnData?.holderName || (language === 'en' ? 'Host' : 'מארח/ת'),
          holderAvatar: serverTurnData?.holderAvatar || '👑',
          roundStatus: serverTurnData?.roundStatus || 'waiting',
          cardIndex: currentCardIndex,
          cardId: currentCard.id,
          wordHash: encodeWordHash(currentWord),
          turnDuration: settings.turnDuration,
        });
      }
    });

    return () => {
      unsubStatus();
      unsubPresence();
      unsubGameStart();
      unsubRoundStart();
      unsubCorrectGuess();
      unsubTurnTimeout();
      unsubSettings();
      unsubSyncState();
      unsubRequestSync();
    };
  }, [pin, joinedRoom, hostStep, screen, myPlayerId, activeDeck, language, settings.turnDuration]);

  const handleToggleMute = () => {
    const updated = sounds.toggleMute();
    setIsMuted(updated);
  };

  // Host generates PIN via Supabase Realtime Channel
  const handleGenerateRoom = useCallback((customTurnDuration?: number) => {
    setIsGeneratingPin(false);
    const chosenDuration = customTurnDuration || settings.turnDuration;

    // 1. Immediately generate a 4-digit room PIN (e.g. 2350)
    const new4DigitPin = Math.floor(1000 + Math.random() * 9000).toString();
    setPin(new4DigitPin);
    try {
      localStorage.setItem('ttg_room_pin', new4DigitPin);
      localStorage.setItem('game_turn_duration', chosenDuration.toString());
    } catch (e) {}

    // 2. Save settings & host info in state (Strictly no mock players Danny/דני)
    const hostName = language === 'en' ? 'Host' : 'מארח/ת';
    setSettings((prev) => ({ ...prev, turnDuration: chosenDuration }));
    setHasPurchasedLicense(true);
    setMyPlayerId('p-host');
    setCurrentHolderId('p-host');
    try {
      localStorage.setItem('ttg_player_id', 'p-host');
    } catch (e) {}
    setPlayers([
      {
        id: 'p-host',
        name: hostName,
        avatar: '👑',
        score: 0,
        isHost: true,
        streak: 0,
        isOnline: true,
      },
    ]);

    // 3. Immediately transition to 'lobby' step
    setHostStep('lobby');
  }, [language, settings.turnDuration]);

  const handleGeneratePin = useCallback(() => {
    handleGenerateRoom(settings.turnDuration);
  }, [handleGenerateRoom, settings.turnDuration]);

  const handleAddCustomCard = (card: CardItem) => {
    const updated = [...customCards, card];
    setCustomCards(updated);
    localStorage.setItem('game_custom_cards', JSON.stringify(updated));
  };

  // Host starts the game: immediately moves to game board with Host configured as first image holder
  const handleStartHostGame = () => {
    // 1. Explicit state transition to 'game'
    setHostStep('game');
    setJoinedRoom(true);
    setScreen('game');

    // 2. Host is configured as first image holder
    setActivePlayerIndex(0);
    setCurrentCardIndex(0);
    setPlayedCardIds(new Set());
    const hostId = 'p-host';
    setMyPlayerId(hostId);
    setCurrentHolderId(hostId);
    try {
      localStorage.setItem('ttg_player_id', hostId);
    } catch (e) {}

    const firstCard = activeDeck[0] || DEFAULT_CARDS[0];
    const firstWord = (language === 'en' ? (firstCard.word_en || firstCard.word) : (firstCard.word_he || firstCard.word)).trim();
    const hostPlayer = {
      id: hostId,
      name: language === 'en' ? 'Host' : 'מארח/ת',
      avatar: '👑',
    };

    // 3. Immediately prepare serverTurnData so host sees:
    // Selected image, secret word, response buttons ("כן", "לא", "חם", "קר"), and "התחל סיבוב! 🚀"
    // The timer on the picture stands in waiting (roundStatus: 'waiting') until host clicks "התחל סיבוב! 🚀"
    setServerTurnData({
      isHolder: true,
      roundStatus: 'waiting',
      roundEndsAt: 0,
      turnEndTime: 0,
      turnDuration: settings.turnDuration,
      cardIndex: 0,
      totalCards: Math.min(activeDeck.length, 50),
      holderId: hostId,
      holderName: hostPlayer.name,
      holderAvatar: hostPlayer.avatar || '👑',
      cardId: firstCard.id,
      image: firstCard.imageUrl || firstCard.image,
      imageUrl: firstCard.imageUrl || firstCard.image,
      fallback: firstCard.fallback || null,
      word: firstWord,
      category: language === 'en' ? (firstCard.category_en || firstCard.category) : firstCard.category,
      hint: null,
      wordLength: firstWord.length,
      players: players.map((p) => ({ ...p, isHolder: p.id === hostId, isOnline: true })),
    });

    // 4. Broadcast game_start via Supabase Realtime channel
    const channel = getCurrentSupabaseChannel();
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'game_start',
        payload: {
          holderId: hostId,
          holderName: hostPlayer.name,
          holderAvatar: hostPlayer.avatar || '👑',
          turnDuration: settings.turnDuration,
          cardIndex: 0,
        },
      });
    }
  };

  const handleQuickStart = useCallback(() => {
    setJoinedRoom(true);
    const soloId = 'p-host';
    setMyPlayerId(soloId);
    setCurrentHolderId(soloId);
    try {
      localStorage.setItem('ttg_player_id', soloId);
    } catch (e) {}

    const firstCard = activeDeck[0] || DEFAULT_CARDS[0];
    const firstWord = (language === 'en' ? (firstCard.word_en || firstCard.word) : (firstCard.word_he || firstCard.word)).trim();

    setPlayers([
      {
        id: soloId,
        name: language === 'en' ? 'Player 1' : 'שחקן 1',
        avatar: '🦁',
        score: 0,
        isHost: true,
        streak: 0,
        isOnline: true,
      },
    ]);
    setActivePlayerIndex(0);
    setCurrentCardIndex(0);
    setTotalCardsSolved(0);
    setPlayedCardIds(new Set());
    setShuffledDeck(shuffleDeck([...DEFAULT_CARDS]));

    setServerTurnData({
      isHolder: true,
      roundStatus: 'waiting',
      roundEndsAt: 0,
      turnEndTime: 0,
      turnDuration: settings.turnDuration,
      cardIndex: 0,
      totalCards: Math.min(activeDeck.length, 50),
      holderId: soloId,
      holderName: language === 'en' ? 'Player 1' : 'שחקן 1',
      holderAvatar: '🦁',
      cardId: firstCard.id,
      image: firstCard.imageUrl || firstCard.image,
      imageUrl: firstCard.imageUrl || firstCard.image,
      fallback: firstCard.fallback || null,
      word: firstWord,
      category: language === 'en' ? (firstCard.category_en || firstCard.category) : firstCard.category,
      hint: null,
      wordLength: firstWord.length,
      players: [],
    });

    setScreen('game');
  }, [language, activeDeck, settings.turnDuration]);

  const handleTransitionFromIntroToDashboard = useCallback(() => {
    setIsIntroVideoOpen(false);
    const p = (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('pin') : null) || getPinFromUrl();
    if (!p) {
      setScreen('welcome');
    }
  }, []);

  // Player joins room with immediate transition & Supabase Realtime presence connection
  const handleJoinGame = (
    enteredPin: string,
    playerName: string,
    avatar: string,
    _onError?: (err: string) => void
  ) => {
    const cleanPin = enteredPin.trim();

    // 1. Immediately save player profile & room PIN
    try {
      localStorage.setItem('player_name', playerName.trim());
      localStorage.setItem('player_avatar', avatar);
      localStorage.setItem('ttg_room_pin', cleanPin);
    } catch (e) {}

    const newPlayerId = 'p-' + Math.random().toString(36).substring(2, 9);
    setPin(cleanPin);
    setMyPlayerId(newPlayerId);
    setCurrentHolderId('p-host');
    try {
      localStorage.setItem('ttg_player_id', newPlayerId);
    } catch (e) {}

    // 2. Set joining player locally until room state syncs real connected players
    setPlayers([
      {
        id: newPlayerId,
        name: playerName.trim(),
        avatar,
        score: 0,
        streak: 0,
        isHost: false,
        isOnline: true,
      },
    ]);

    // 3. Immediately set initial game state for guesser: mystery card, waiting timer, host holding
    // Default wordLength: 4 ensures boxes are ALWAYS visible from the very first frame!
    setServerTurnData({
      cardIndex: 0,
      totalCards: 50,
      roundStatus: 'waiting',
      roundEndsAt: 0,
      turnEndTime: 0,
      turnDuration: settings.turnDuration,
      holderId: 'p-host',
      holderName: language === 'en' ? 'Host' : 'מארח/ת',
      holderAvatar: '👑',
      isHolder: false,
      image: null,
      imageUrl: null,
      fallback: null,
      word: null,
      category: '',
      hint: null,
      wordLength: 4,
      players: [],
    });

    // 4. INSTANT SCREEN TRANSITION: Go directly to game table and remove join form completely
    setJoinedRoom(true);
    setScreen('game');

    // Keep URL query parameter synchronized with active room PIN
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('pin', cleanPin);
      window.history.replaceState({}, '', url.toString());
    } catch (e) {}
  };

  const handleCardSolved = useCallback((winnerPlayerId: string, bonusPoints: number) => {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === winnerPlayerId) {
          return {
            ...p,
            score: p.score + 10 + bonusPoints,
            streak: p.streak + 1,
          };
        }
        return p;
      })
    );

    const currentCard = activeDeck[currentCardIndex];
    if (currentCard) {
      setPlayedCardIds((prev) => new Set(prev).add(currentCard.id));
    }

    setTotalCardsSolved((prev) => prev + 1);

    if (currentCardIndex + 1 >= activeDeck.length || totalCardsSolved + 1 >= 25) {
      setIsGameOverModalOpen(true);
    } else {
      const nextCardIndex = (currentCardIndex + 1) % activeDeck.length;
      const nextPlayerIndex = (activePlayerIndex + 1) % players.length;
      setCurrentCardIndex(nextCardIndex);
      setActivePlayerIndex(nextPlayerIndex);

      // Local cyclic turn rotation:
      const nextHolder = players[nextPlayerIndex];
      const nextCard = activeDeck[nextCardIndex];
      const nextWord = (language === 'en' ? (nextCard.word_en || nextCard.word) : (nextCard.word_he || nextCard.word)).trim();
      const isHolder = myPlayerId === nextHolder?.id;

      setServerTurnData({
        isHolder,
        roundStatus: 'waiting',
        roundEndsAt: 0,
        turnEndTime: 0,
        turnDuration: settings.turnDuration,
        cardIndex: nextCardIndex,
        totalCards: Math.min(activeDeck.length, 50),
        holderId: nextHolder?.id || 'p-host',
        holderName: nextHolder?.name || 'מחזיק',
        holderAvatar: nextHolder?.avatar || '👑',
        cardId: nextCard.id,
        image: isHolder ? (nextCard.imageUrl || nextCard.image) : null,
        imageUrl: isHolder ? (nextCard.imageUrl || nextCard.image) : null,
        fallback: isHolder ? nextCard.fallback : null,
        word: isHolder ? nextWord : null,
        category: language === 'en' ? (nextCard.category_en || nextCard.category) : nextCard.category,
        hint: null,
        wordLength: nextWord.length,
        players: players.map((p) => ({ ...p, isHolder: p.id === nextHolder?.id, isOnline: true })),
      });
    }
  }, [activeDeck, currentCardIndex, players, totalCardsSolved, activePlayerIndex, myPlayerId, language, settings.turnDuration]);

  const handleCardTimeout = useCallback(() => {
    setPlayers((prev) =>
      prev.map((p, idx) => (idx === activePlayerIndex ? { ...p, streak: 0 } : p))
    );
    const currentCard = activeDeck[currentCardIndex];
    if (currentCard) {
      setPlayedCardIds((prev) => new Set(prev).add(currentCard.id));
    }
    const nextCardIndex = (currentCardIndex + 1) % activeDeck.length;
    const nextPlayerIndex = (activePlayerIndex + 1) % players.length;
    setCurrentCardIndex(nextCardIndex);
    setActivePlayerIndex(nextPlayerIndex);

    const nextHolder = players[nextPlayerIndex];
    const nextCard = activeDeck[nextCardIndex];
    const nextWord = (language === 'en' ? (nextCard.word_en || nextCard.word) : (nextCard.word_he || nextCard.word)).trim();
    const isHolder = myPlayerId === nextHolder?.id;

    setServerTurnData({
      isHolder,
      roundStatus: 'waiting',
      roundEndsAt: 0,
      turnEndTime: 0,
      turnDuration: settings.turnDuration,
      cardIndex: nextCardIndex,
      totalCards: Math.min(activeDeck.length, 50),
      holderId: nextHolder?.id || 'p-host',
      holderName: nextHolder?.name || 'מחזיק',
      holderAvatar: nextHolder?.avatar || '👑',
      cardId: nextCard.id,
      image: isHolder ? (nextCard.imageUrl || nextCard.image) : null,
      imageUrl: isHolder ? (nextCard.imageUrl || nextCard.image) : null,
      fallback: isHolder ? nextCard.fallback : null,
      word: isHolder ? nextWord : null,
      category: language === 'en' ? (nextCard.category_en || nextCard.category) : nextCard.category,
      hint: null,
      wordLength: nextWord.length,
      players: players.map((p) => ({ ...p, isHolder: p.id === nextHolder?.id, isOnline: true })),
    });
  }, [activeDeck, activePlayerIndex, currentCardIndex, players, myPlayerId, language, settings.turnDuration]);

  const handleRestartGame = useCallback(() => {
    setIsGameOverModalOpen(false);
    setCurrentCardIndex(0);
    setTotalCardsSolved(0);
    setActivePlayerIndex(0);
    setPlayedCardIds(new Set());
    setShuffledDeck(shuffleDeck([...DEFAULT_CARDS]));
    setPlayers((prev) => prev.map((p) => ({ ...p, score: 0, streak: 0 })));
    setHostStep('game');
    setScreen('game');
  }, []);

  const handleLeaveGame = useCallback(() => {
    setJoinedRoom(false);
    setHostStep('create');
    setScreen('welcome');
    setIsGameOverModalOpen(false);
    setServerTurnData(null);
    try {
      window.history.replaceState({}, '', window.location.pathname);
    } catch (e) {}
  }, []);

  const currentPinFromUrl = (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('pin') : null) || initialPinParam || getPinFromUrl();
  const activePlayer = players[activePlayerIndex] || players[0] || { id: 'p-host', name: 'מארח', avatar: '👑', score: 0, streak: 0, isHost: true, isOnline: true };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-3 sm:p-5 bg-gradient-to-br from-[#120E2E] via-[#2A1045] to-[#0A0D1A] text-white relative overflow-hidden">
      {/* Colorful Animated Question Marks Background */}
      <AnimatedQuestionMarksBackground />

      {/* Main glassmorphic card container */}
      <div className={`relative z-10 w-full ${joinedRoom && screen === 'game' ? 'max-w-[500px]' : 'max-w-[460px]'} ${screen === 'host' ? 'p-3 sm:p-5 max-h-[98dvh] sm:max-h-none flex flex-col justify-between overflow-hidden' : 'p-4 sm:p-6'} bg-white/[0.07] backdrop-blur-2xl border border-white/20 rounded-[28px] sm:rounded-[32px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] transition-all`}>
        {/* Welcome / Role Select screen - NEVER rendered if pin exists in URL or if already joined */}
        {screen === 'welcome' && !currentPinFromUrl && !joinedRoom && (
          <RoleSelectScreen
            onOpenHost={() => {
              setMyPlayerId('p-host');
              setCurrentHolderId('p-host');
              try {
                localStorage.setItem('ttg_player_id', 'p-host');
              } catch (e) {}
              setHostStep('create');
              setScreen('host');
            }}
            onOpenPlayer={() => setScreen('player-join')}
            onQuickStart={handleQuickStart}
            onOpenVideo={() => setIsIntroVideoOpen(true)}
            turnDuration={settings.turnDuration}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            language={language}
            onToggleLanguage={handleToggleLanguage}
          />
        )}

        {screen === 'host' && !joinedRoom && (
          <HostScreen
            hostStep={hostStep}
            setHostStep={setHostStep}
            pin={pin}
            hasPurchasedLicense={hasPurchasedLicense}
            isGeneratingPin={isGeneratingPin}
            onPurchaseLicense={handleGeneratePin}
            onGenerateRoom={handleGenerateRoom}
            onStartGame={handleStartHostGame}
            onBack={() => {
              if (hostStep === 'lobby') {
                setHostStep('create');
              } else {
                setScreen('welcome');
              }
            }}
            players={players}
            onOpenCustomCardModal={() => setIsCustomCardModalOpen(true)}
            onOpenShareModal={() => setIsShareModalOpen(true)}
            customCardsCount={customCards.length}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            language={language}
            onToggleLanguage={handleToggleLanguage}
          />
        )}

        {/* Player Join Screen - shown ONLY when participant is not yet connected */}
        {!joinedRoom && (screen === 'player-join' || screen === 'join' || Boolean(currentPinFromUrl)) && (
          <PlayerJoinScreen
            onJoin={handleJoinGame}
            onBack={() => {
              try {
                window.history.replaceState({}, '', window.location.pathname);
              } catch (e) {}
              setScreen('welcome');
            }}
            defaultPin={pin || currentPinFromUrl || ''}
            language={language}
            onToggleLanguage={handleToggleLanguage}
          />
        )}

        {screen === 'player-lobby' && !joinedRoom && (
          <PlayerLobbyScreen
            pin={pin}
            players={players}
            myPlayerId={myPlayerId}
            turnDuration={settings.turnDuration}
            onLeave={() => {
              setScreen('welcome');
              setServerTurnData(null);
            }}
            onOpenShareModal={() => setIsShareModalOpen(true)}
            language={language}
            onToggleLanguage={handleToggleLanguage}
          />
        )}

        {/* Game Screen - shown in full clean display upon successful join or host start */}
        {joinedRoom && screen === 'game' && activeDeck.length > 0 && (
          <GameTable
            cards={activeDeck}
            currentCardIndex={currentCardIndex}
            players={players}
            currentHolderId={currentHolderId}
            activePlayerId={currentHolderId}
            myPlayerId={myPlayerId}
            turnDuration={settings.turnDuration}
            roomPin={pin}
            isLiveServer={isLiveServer}
            serverTurnData={serverTurnData}
            onChangeTurnDuration={handleChangeTurnDuration}
            onCardSolved={handleCardSolved}
            onCardTimeout={handleCardTimeout}
            onLeaveGame={handleLeaveGame}
            onOpenShareModal={() => setIsShareModalOpen(true)}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            language={language}
            onToggleLanguage={handleToggleLanguage}
            voiceGender={voiceGender}
            onChangeVoiceGender={handleChangeVoiceGender}
          />
        )}
      </div>

      {/* Modals */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        pin={pin}
        language={language}
      />

      <CustomCardModal
        isOpen={isCustomCardModalOpen}
        onClose={() => setIsCustomCardModalOpen(false)}
        onAddCard={handleAddCustomCard}
        language={language}
      />

      <GameOverModal
        isOpen={isGameOverModalOpen}
        players={players}
        totalCardsPlayed={totalCardsSolved}
        onRestart={handleRestartGame}
        onHome={handleLeaveGame}
        language={language}
      />

      <IntroVideoModal
        isOpen={isIntroVideoOpen}
        onClose={handleTransitionFromIntroToDashboard}
        onTransitionToDashboard={handleTransitionFromIntroToDashboard}
        onTransitionToGame={handleTransitionFromIntroToDashboard}
        videoUrl={introVideoUrl}
        onUpdateVideoUrl={handleUpdateVideoUrl}
        language={language}
      />
    </div>
  );
}
