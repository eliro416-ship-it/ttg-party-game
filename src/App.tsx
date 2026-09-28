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
import { getGameSocket, getSessionToken, TurnStartedPayload, RoomStatePayload } from './utils/socket';
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
    return '7742';
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
    const socket = getGameSocket();
    socket.emit('UPDATE_TIMER_DURATION', { pin, duration: newSettings.turnDuration, sessionToken: getSessionToken() });
  }, [pin]);

  const handleChangeTurnDuration = useCallback((duration: number) => {
    setSettings((prev) => {
      const updated = { ...prev, turnDuration: duration };
      if (typeof window !== 'undefined') {
        localStorage.setItem('game_turn_duration', duration.toString());
      }
      return updated;
    });
  }, []);

  // Players: Real connected players only (zero mock data)
  const [players, setPlayers] = useState<Player[]>([]);

  const [myPlayerId, setMyPlayerId] = useState<string>('p-host');
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

  // Real-time WebSocket event listeners
  useEffect(() => {
    const socket = getGameSocket();

    const onConnect = () => {
      setIsLiveServer(true);
    };

    const onDisconnect = () => {
      setIsLiveServer(false);
    };

    const onRoomUpdated = (roomData: {
      pin: string;
      status: string;
      turnDuration: number;
      players: Player[];
    }) => {
      if (roomData.players) {
        setPlayers(roomData.players);
      }
      if (roomData.turnDuration) {
        setSettings((prev) => ({ ...prev, turnDuration: roomData.turnDuration }));
      }
    };

    const onRoomState = (data: RoomStatePayload) => {
      if (data.pin) {
        setPin(data.pin);
      }
      if (data.players && data.players.length > 0) {
        setPlayers(
          data.players.map((p) => ({
            id: p.id,
            name: p.name,
            avatar: p.icon || p.avatar || '🦁',
            score: p.score ?? 0,
            streak: p.streak ?? 0,
            isHost: p.isHost ?? false,
            isOnline: p.isOnline ?? true,
          }))
        );
      }
      if (typeof data.currentHolderIndex === 'number') {
        setActivePlayerIndex(data.currentHolderIndex);
      }
      if (typeof data.cardIndex === 'number') {
        setCurrentCardIndex(data.cardIndex);
      }
      if (data.turnDuration) {
        setSettings((prev) => ({ ...prev, turnDuration: data.turnDuration }));
      }

      setServerTurnData({
        isHolder: data.isHolder,
        roundStatus: data.roundStatus,
        roundEndsAt: data.roundEndsAt || 0,
        turnEndTime: data.roundEndsAt || 0,
        serverTime: data.serverTime || Date.now(),
        turnDuration: data.turnDuration || settings.turnDuration,
        cardIndex: data.cardIndex,
        totalCards: 50,
        holderId: data.holderId,
        holderName: data.holderName,
        holderAvatar: data.holderAvatar,
        cardId: data.currentCard.id,
        image: data.currentCard.imageUrl || data.currentCard.image || null,
        imageUrl: data.currentCard.imageUrl || data.currentCard.image || null,
        fallback: data.currentCard.fallback || null,
        word: data.currentCard.word || null,
        category: data.currentCard.category,
        hint: data.currentCard.hint || null,
        wordLength: data.currentCard.wordLength,
        players: data.players.map((p) => ({
          ...p,
          avatar: p.icon || p.avatar || '🦁',
          isHolder: p.id === data.holderId,
          isOnline: p.isOnline ?? true,
        })),
      });

      // Transition to game screen only when the game is actively IN_PROGRESS
      if (data.status === 'IN_PROGRESS') {
        setJoinedRoom(true);
        setScreen('game');
      }
    };

    const onTurnStarted = (data: TurnStartedPayload) => {
      setServerTurnData(data);
      setCurrentCardIndex(data.cardIndex);
      if (data.players) {
        setPlayers(data.players);
      }
      setJoinedRoom(true);
      setScreen('game');
    };

    const onRoundStarted = (data: {
      roundEndsAt?: number;
      endTime?: number;
      roundEndTime?: number;
      serverTime?: number;
      turnDuration: number;
      cardIndex: number;
      cardId?: string;
      category?: string;
      wordLength?: number;
      holderId: string;
      holderName: string;
    }) => {
      const end = data.roundEndTime || data.endTime || data.roundEndsAt || (Date.now() + data.turnDuration * 1000);
      setServerTurnData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          roundStatus: 'active',
          roundEndsAt: end,
          turnEndTime: end,
          serverTime: data.serverTime || Date.now(),
          turnDuration: data.turnDuration,
          cardIndex: data.cardIndex,
          cardId: data.cardId || prev.cardId,
          category: data.category || prev.category,
          wordLength: data.wordLength || prev.wordLength,
          holderId: data.holderId,
          holderName: data.holderName,
        };
      });
      setJoinedRoom(true);
      setScreen('game');
    };

    const onGameOver = (data: { players: Player[] }) => {
      if (data.players) {
        setPlayers(data.players);
      }
      setIsGameOverModalOpen(true);
    };

    const onRoundWon = (data: {
      winnerId: string;
      winnerName: string;
      points: number;
      scores?: Array<{ id: string; name: string; score: number; streak: number }>;
    }) => {
      if (data.scores && data.scores.length > 0) {
        setPlayers((prev) =>
          prev.map((p) => {
            const found = data.scores!.find((s) => s.id === p.id);
            return found ? { ...p, score: found.score, streak: found.streak } : p;
          })
        );
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('ROOM_UPDATED', onRoomUpdated);
    socket.on('SYNC_ROOM_STATE', onRoomState);
    socket.on('ROOM_STATE', onRoomState);
    socket.on('TURN_STARTED', onTurnStarted);
    socket.on('ROUND_STARTED', onRoundStarted);
    socket.on('ROUND_WON', onRoundWon);
    socket.on('GAME_OVER', onGameOver);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('ROOM_UPDATED', onRoomUpdated);
      socket.off('SYNC_ROOM_STATE', onRoomState);
      socket.off('ROOM_STATE', onRoomState);
      socket.off('TURN_STARTED', onTurnStarted);
      socket.off('ROUND_STARTED', onRoundStarted);
      socket.off('ROUND_WON', onRoundWon);
      socket.off('GAME_OVER', onGameOver);
    };
  }, []);

  const handleToggleMute = () => {
    const updated = sounds.toggleMute();
    setIsMuted(updated);
  };

  // Host generates PIN via Server or local generator with immediate smooth transition to lobby
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

    // 2. Save settings & host info in state
    setSettings((prev) => ({ ...prev, turnDuration: chosenDuration }));
    setHasPurchasedLicense(true);
    setMyPlayerId('p-host');
    setPlayers([
      {
        id: 'p-host',
        name: language === 'en' ? 'Host (Danny)' : 'מארח/ת (דני)',
        avatar: '👑',
        score: 0,
        isHost: true,
        streak: 0,
        isOnline: true,
      },
    ]);

    // 3. Immediately transition to 'lobby' step - guaranteed 0ms UI freeze or blocking
    setHostStep('lobby');

    // 4. Background socket registration
    try {
      const socket = getGameSocket();
      const token = getSessionToken();

      socket.emit(
        'CREATE_ROOM',
        {
          hostName: language === 'en' ? 'Host (Danny)' : 'מארח/ת (דני)',
          avatar: '👑',
          sessionToken: token,
          turnDuration: chosenDuration,
          language,
        },
        (res: { success: boolean; pin?: string; player?: Player; room?: { players: Player[] } }) => {
          if (res?.success && res.pin) {
            setPin(res.pin);
            try {
              localStorage.setItem('ttg_room_pin', res.pin);
            } catch (e) {}
            if (res.player?.id) setMyPlayerId(res.player.id);
            if (res.room?.players && res.room.players.length > 0) {
              setPlayers(res.room.players);
            }
          }
        }
      );
    } catch (err) {
      console.warn('Socket CREATE_ROOM exception:', err);
    }
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
    const hostId = myPlayerId || 'p-host';
    setMyPlayerId(hostId);

    const firstCard = activeDeck[0] || DEFAULT_CARDS[0];
    const firstWord = (language === 'en' ? (firstCard.word_en || firstCard.word) : (firstCard.word_he || firstCard.word)).trim();
    const hostPlayer = players.find((p) => p.isHost) || players[0] || {
      id: hostId,
      name: language === 'en' ? 'Host (Danny)' : 'מארח/ת (דני)',
      avatar: '👑',
    };

    // 3. Immediately prepare serverTurnData so host sees:
    // Selected image, secret word, 4 response buttons ("כן", "לא", "חם", "קר"), and "התחל סיבוב! 🚀"
    // The timer on the picture stands in waiting (roundStatus: 'waiting') until host clicks "התחל סיבוב! 🚀"
    setServerTurnData({
      isHolder: true,
      roundStatus: 'waiting',
      roundEndsAt: 0,
      turnEndTime: 0,
      turnDuration: settings.turnDuration,
      cardIndex: 0,
      totalCards: Math.min(activeDeck.length, 50),
      holderId: hostPlayer.id,
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
      players: players.map((p, idx) => ({ ...p, isHolder: idx === 0, isOnline: true })),
    });

    // 4. Broadcast START_GAME to the socket server with host's deck and selected initial card
    const socket = getGameSocket();
    socket.emit('START_GAME', {
      pin,
      sessionToken: getSessionToken(),
      turnDuration: settings.turnDuration,
      language,
      deck: activeDeck,
      initialCard: {
        cardId: firstCard.id,
        category: language === 'en' ? (firstCard.category_en || firstCard.category) : firstCard.category,
        wordLength: firstWord.length,
        word: firstWord,
        imageUrl: firstCard.imageUrl || firstCard.image,
        image: firstCard.imageUrl || firstCard.image,
        fallback: firstCard.fallback,
        hint: language === 'en' ? (firstCard.hint_en || firstCard.hint) : firstCard.hint,
      },
    });
  };

  const handleQuickStart = useCallback(() => {
    setJoinedRoom(true);
    const soloId = 'p-host';
    setMyPlayerId(soloId);
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
    setScreen('game');
  }, [language]);

  const handleTransitionFromIntroToDashboard = useCallback(() => {
    setIsIntroVideoOpen(false);
    const p = (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('pin') : null) || getPinFromUrl();
    if (!p) {
      setScreen('welcome');
    }
  }, []);

  // Player joins room with immediate transition & guaranteed background sync
  const handleJoinGame = (
    enteredPin: string,
    playerName: string,
    avatar: string,
    _onError?: (err: string) => void
  ) => {
    // 1. Immediately save player profile & room PIN
    try {
      localStorage.setItem('player_name', playerName);
      localStorage.setItem('player_avatar', avatar);
      localStorage.setItem('ttg_room_pin', enteredPin);
    } catch (e) {}

    const newPlayerId = 'p-' + Math.random().toString(36).substring(2, 9);
    setPin(enteredPin);
    setMyPlayerId(newPlayerId);

    // 2. Set joining player locally until room state syncs real connected players
    setPlayers([
      {
        id: newPlayerId,
        name: playerName,
        avatar,
        score: 0,
        streak: 0,
        isHost: false,
        isOnline: true,
      },
    ]);

    // 3. Immediately set initial game state for guesser: mystery card, waiting timer, host holding
    // Guesser NEVER draws an independent local card; waits for authoritative room state from host/server!
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
      wordLength: 0,
      players: [],
    });

    // 4. INSTANT SCREEN TRANSITION: Go directly to game table and remove join form completely
    setJoinedRoom(true);
    setScreen('game');

    // Clean up URL query parameters
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('pin');
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    } catch (e) {}

    // 5. Asynchronous background WebSockets connection (resilient & non-blocking)
    try {
      const socket = getGameSocket();
      const token = getSessionToken();

      socket.emit(
        'JOIN_ROOM',
        {
          pin: enteredPin,
          name: playerName,
          avatar,
          sessionToken: token,
        },
        (res: { success: boolean; pin?: string; player?: Player; room?: { players: Player[]; status: string }; roomState?: RoomStatePayload; error?: string }) => {
          if (res?.player?.id) {
            setMyPlayerId(res.player.id);
            try {
              localStorage.setItem('ttg_player_id', res.player.id);
            } catch (e) {}
          }
          if (res?.success && res.roomState) {
            setPin(res.roomState.pin);
            setPlayers(
              res.roomState.players.map((p) => ({
                id: p.id,
                name: p.name,
                avatar: p.icon || p.avatar || '🦁',
                score: p.score ?? 0,
                streak: p.streak ?? 0,
                isHost: p.isHost ?? false,
                isOnline: p.isOnline ?? true,
              }))
            );
            setActivePlayerIndex(res.roomState.currentHolderIndex);
            setCurrentCardIndex(res.roomState.cardIndex);
            setServerTurnData({
              isHolder: res.roomState.isHolder,
              roundStatus: res.roomState.roundStatus,
              roundEndsAt: res.roomState.roundEndsAt || 0,
              turnEndTime: res.roomState.roundEndsAt || 0,
              turnDuration: res.roomState.turnDuration || settings.turnDuration,
              cardIndex: res.roomState.cardIndex,
              totalCards: 50,
              holderId: res.roomState.holderId,
              holderName: res.roomState.holderName,
              holderAvatar: res.roomState.holderAvatar,
              cardId: res.roomState.currentCard.id,
              image: res.roomState.currentCard.imageUrl || res.roomState.currentCard.image || null,
              imageUrl: res.roomState.currentCard.imageUrl || res.roomState.currentCard.image || null,
              fallback: res.roomState.currentCard.fallback || null,
              word: res.roomState.currentCard.word || null,
              category: res.roomState.currentCard.category,
              hint: res.roomState.currentCard.hint || null,
              wordLength: res.roomState.currentCard.wordLength,
              players: res.roomState.players.map((p) => ({
                ...p,
                avatar: p.icon || p.avatar || '🦁',
                isHolder: p.id === res.roomState!.holderId,
                isOnline: p.isOnline ?? true,
              })),
            });
          } else if (res?.success && res.player && res.room) {
            setPin(res.pin || enteredPin);
            setMyPlayerId(res.player.id);
            if (res.room.players && res.room.players.length > 0) {
              setPlayers(res.room.players);
            }
          }
        }
      );
    } catch (err) {
      console.warn('Background JOIN_ROOM sync notice:', err);
    }
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
  const activePlayer = players[activePlayerIndex] || players[0];

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
            activePlayerId={serverTurnData ? serverTurnData.holderId : activePlayer.id}
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
