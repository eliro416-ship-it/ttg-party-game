import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GameScreen, Player, RoomSettings, CardItem, Language } from './types/game';
import { DEFAULT_CARDS } from './data/cards';
import { RoleSelectScreen } from './components/RoleSelectScreen';
import { HostScreen } from './components/HostScreen';
import { PlayerJoinScreen } from './components/PlayerJoinScreen';
import { PlayerLobbyScreen } from './components/PlayerLobbyScreen';
import { GameTable } from './components/GameTable';
import { GameOverModal } from './components/GameOverModal';
import { CustomCardModal } from './components/CustomCardModal';
import { ShareModal } from './components/ShareModal';
import { IntroVideoModal } from './components/IntroVideoModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { QuestionMarksBackground } from './components/QuestionMarksBackground';
import { sounds } from './utils/audio';
import { getGameSocket, getSessionToken, TurnStartedPayload } from './utils/socket';

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('welcome');
  const [pin, setPin] = useState<string>('7742');
  const [hasPurchasedLicense, setHasPurchasedLicense] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ttg_host_active') === 'true';
    }
    return false;
  });
  const [returnedPaymentContact, setReturnedPaymentContact] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(sounds.isMuted);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isLiveServer, setIsLiveServer] = useState<boolean>(false);
  const [serverTurnData, setServerTurnData] = useState<TurnStartedPayload | null>(null);

  const recordScoreToLeaderboard = useCallback(
    (name: string, avatar: string, score: number, streak: number, solvedCards: number) => {
      if (score <= 0) return;
      fetch('/api/leaderboard/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken: getSessionToken(),
          name,
          avatar,
          score,
          streak,
          solvedCards,
        }),
      }).catch((err) => console.warn('[Leaderboard] Score record failed:', err));
    },
    []
  );

  // Intro video modal state (opens on entry unless opted out)
  const DEFAULT_VIDEO_URL = 'https://res.cloudinary.com/afjcyngg/video/upload/gemini_generated_video_6c8f0e40.mp4';
  const [introVideoUrl, setIntroVideoUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ttg_intro_video_url');
      if (saved && !saved.includes('lYah5-xEeck')) return saved;
    }
    return DEFAULT_VIDEO_URL;
  });

  const [isIntroVideoOpen, setIsIntroVideoOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const hide = localStorage.getItem('ttg_hide_intro_video');
      return hide !== 'true';
    }
    return true;
  });

  const handleUpdateVideoUrl = (newUrl: string) => {
    setIntroVideoUrl(newUrl);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ttg_intro_video_url', newUrl);
    }
  };

  // Language management (Hebrew / English)
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlLang = urlParams.get('lang');
      if (urlLang === 'en' || urlLang === 'he') {
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

  // Check if returning from payment (Stripe checkout callback)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment_success') === 'true') {
      const contact = urlParams.get('contact') || localStorage.getItem('temp_host_contact') || '';
      window.history.replaceState({}, document.title, window.location.pathname);
      setScreen('host');
      setReturnedPaymentContact(contact);
    }
  }, []);

  const handleToggleLanguage = useCallback(() => {
    setLanguage((prev) => {
      const next = prev === 'he' ? 'en' : 'he';
      if (typeof window !== 'undefined') {
        localStorage.setItem('ttg_lang', next);
      }
      // Broadcast language change to room if host has active room
      const socket = getGameSocket();
      socket.emit('UPDATE_ROOM_LANGUAGE', {
        pin,
        language: next,
        sessionToken: getSessionToken(),
      });
      return next;
    });
  }, [pin]);

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

  // Players
  const [players, setPlayers] = useState<Player[]>([
    { id: 'p-host', name: 'דני / Danny', avatar: '👑', score: 0, isHost: true, streak: 0 },
  ]);

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

  const activeDeck = useMemo(() => {
    const all = [...DEFAULT_CARDS, ...customCards];
    if (settings.selectedCategories.includes('הכל')) {
      return all;
    }
    return all.filter((c) => settings.selectedCategories.includes(c.category));
  }, [customCards, settings.selectedCategories]);

  // Ensure Host Room is registered and alive on the server
  const handleEnsureHostRoom = useCallback((targetPin?: string) => {
    const socket = getGameSocket();
    const token = getSessionToken();
    const currentPin = targetPin || pin || '7742';

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit(
      'CREATE_ROOM',
      {
        pin: currentPin,
        hostName: language === 'en' ? 'Host (Danny)' : 'מארח/ת (דני)',
        avatar: '👑',
        sessionToken: token,
        turnDuration: settings.turnDuration,
        language,
      },
      (res: { success: boolean; pin: string; player: Player; room: { players: Player[] } }) => {
        if (res?.success && res.pin) {
          setPin(res.pin);
          if (res.player) setMyPlayerId(res.player.id);
          if (res.room?.players) setPlayers(res.room.players);
          setIsLiveServer(true);
        }
      }
    );
  }, [pin, language, settings.turnDuration]);

  // Host generates PIN via Server
  const handleGeneratePin = useCallback((customPin?: string) => {
    const socket = getGameSocket();
    const token = getSessionToken();

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit(
      'CREATE_ROOM',
      {
        pin: customPin,
        hostName: language === 'en' ? 'Host (Danny)' : 'מארח/ת (דני)',
        avatar: '👑',
        sessionToken: token,
        turnDuration: settings.turnDuration,
        language,
      },
      (res: { success: boolean; pin: string; player: Player; room: { players: Player[] } }) => {
        if (res?.success) {
          setPin(res.pin);
          setMyPlayerId(res.player.id);
          setPlayers(res.room.players);
          setHasPurchasedLicense(true);
          setIsLiveServer(true);
        } else {
          // Fallback
          const newPin = Math.floor(1000 + Math.random() * 9000).toString();
          setPin(newPin);
          setHasPurchasedLicense(true);
        }
      }
    );
  }, [language, settings.turnDuration]);

  // Real-time WebSocket event listeners
  useEffect(() => {
    const socket = getGameSocket();

    const onConnect = () => {
      setIsLiveServer(true);
      if (screen === 'host') {
        handleEnsureHostRoom(pin);
      }
    };

    const onDisconnect = () => {
      setIsLiveServer(false);
    };

    const onRoomUpdated = (roomData: {
      pin: string;
      status: string;
      turnDuration: number;
      players: Player[];
      language?: Language;
    }) => {
      if (roomData.players) {
        setPlayers(roomData.players);
      }
      if (roomData.turnDuration) {
        setSettings((prev) => ({ ...prev, turnDuration: roomData.turnDuration }));
      }
      if (roomData.language === 'en' || roomData.language === 'he') {
        setLanguage(roomData.language);
        localStorage.setItem('ttg_lang', roomData.language);
      }
    };

    const onLanguageUpdated = (data: { language: Language }) => {
      if (data?.language === 'en' || data?.language === 'he') {
        setLanguage(data.language);
        localStorage.setItem('ttg_lang', data.language);
      }
    };

    const onTurnStarted = (data: TurnStartedPayload) => {
      setServerTurnData(data);
      setCurrentCardIndex(data.cardIndex);
      if (data.players) {
        setPlayers(data.players);
      }
      setScreen('game');
    };

    const onGameOver = (data: { players: Player[] }) => {
      if (data.players) {
        setPlayers(data.players);
        const me = data.players.find((p) => p.id === myPlayerId);
        if (me && me.score > 0) {
          recordScoreToLeaderboard(me.name, me.avatar, me.score, me.streak, totalCardsSolved);
        }
      }
      setIsGameOverModalOpen(true);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('ROOM_UPDATED', onRoomUpdated);
    socket.on('LANGUAGE_UPDATED', onLanguageUpdated);
    socket.on('TURN_STARTED', onTurnStarted);
    socket.on('GAME_OVER', onGameOver);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('ROOM_UPDATED', onRoomUpdated);
      socket.off('LANGUAGE_UPDATED', onLanguageUpdated);
      socket.off('TURN_STARTED', onTurnStarted);
      socket.off('GAME_OVER', onGameOver);
    };
  }, [screen, pin, handleEnsureHostRoom, myPlayerId, recordScoreToLeaderboard, totalCardsSolved]);

  // Auto-detect invitation link with ?pin=XXXX and ?lang=en|he
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlPin = params.get('pin');
      const urlLang = params.get('lang');

      if (urlLang === 'en' || urlLang === 'he') {
        setLanguage(urlLang);
        localStorage.setItem('ttg_lang', urlLang);
      }

      if (urlPin) {
        const cleanPin = urlPin.trim();
        setPin(cleanPin);
        setScreen('player-join');

        // Fetch room info from server to ensure 100% language alignment with host
        fetch(`/api/room/${cleanPin}`)
          .then((res) => res.json())
          .then((data) => {
            if (data?.success && data.room?.language) {
              setLanguage(data.room.language);
              localStorage.setItem('ttg_lang', data.room.language);
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  // When on host screen with active license, ensure room is live on server
  useEffect(() => {
    if (screen === 'host' && hasPurchasedLicense) {
      handleEnsureHostRoom(pin);
    }
  }, [screen, hasPurchasedLicense, handleEnsureHostRoom, pin]);

  const handleToggleMute = () => {
    const updated = sounds.toggleMute();
    setIsMuted(updated);
  };

  const handleAddCustomCard = (card: CardItem) => {
    const updated = [...customCards, card];
    setCustomCards(updated);
    localStorage.setItem('game_custom_cards', JSON.stringify(updated));
  };

  // Host starts the game for all connected devices
  const handleStartHostGame = () => {
    const socket = getGameSocket();
    socket.emit('START_GAME', {
      pin,
      sessionToken: getSessionToken(),
      turnDuration: settings.turnDuration,
      language,
    });
    setScreen('game');
  };

  const handleQuickStart = () => {
    setMyPlayerId('p-host');
    setPlayers([
      { id: 'p-host', name: language === 'en' ? 'Danny' : 'דני', avatar: '👑', score: 0, isHost: true, streak: 0 },
      { id: 'p-1', name: language === 'en' ? 'Michal' : 'מיכל', avatar: '🦁', score: 0, isHost: false, streak: 0 },
      { id: 'p-2', name: language === 'en' ? 'Yossi' : 'יוסי', avatar: '🦊', score: 0, isHost: false, streak: 0 },
    ]);
    setActivePlayerIndex(0);
    setCurrentCardIndex(0);
    setTotalCardsSolved(0);
    setScreen('game');
  };

  // Player joins room via Server
  const handleJoinGame = (
    enteredPin: string,
    playerName: string,
    avatar: string,
    onError?: (err: string) => void
  ) => {
    const socket = getGameSocket();
    const token = getSessionToken();
    const cleanPin = enteredPin.trim();

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit(
      'JOIN_ROOM',
      {
        pin: cleanPin,
        name: playerName.trim(),
        avatar,
        sessionToken: token,
      },
      (res: { success: boolean; pin?: string; player?: Player; room?: { players: Player[]; status: string; language?: Language }; error?: string }) => {
        if (res?.success && res.player && res.room) {
          setPin(res.pin || cleanPin);
          setMyPlayerId(res.player.id);
          setPlayers(res.room.players);
          if (res.room.language === 'en' || res.room.language === 'he') {
            setLanguage(res.room.language);
            localStorage.setItem('ttg_lang', res.room.language);
          }
          if (res.room.status === 'IN_PROGRESS') {
            setScreen('game');
          } else {
            setScreen('player-lobby');
          }
        } else {
          onError?.(res?.error || (language === 'en' ? 'Room not found! Check PIN with host.' : 'חדר לא נמצא! בדוק את קוד ה-PIN עם המארח/ת.'));
        }
      }
    );
  };

  const handleCardSolved = useCallback((winnerPlayerId: string, bonusPoints: number) => {
    const isBonus = (currentCardIndex + 1) % 5 === 0;
    const pointsAwarded = isBonus ? 5 : 10 + bonusPoints;

    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === winnerPlayerId) {
          const newScore = p.score + pointsAwarded;
          const newStreak = p.streak + 1;
          recordScoreToLeaderboard(p.name, p.avatar, newScore, newStreak, totalCardsSolved + 1);
          return {
            ...p,
            score: newScore,
            streak: newStreak,
          };
        }
        return p;
      })
    );

    setTotalCardsSolved((prev) => prev + 1);

    if (currentCardIndex + 1 >= activeDeck.length || totalCardsSolved + 1 >= 25) {
      setIsGameOverModalOpen(true);
    } else {
      setCurrentCardIndex((prev) => (prev + 1) % activeDeck.length);
      setActivePlayerIndex((prev) => (prev + 1) % players.length);
    }
  }, [activeDeck.length, currentCardIndex, players.length, totalCardsSolved]);

  const handleCardTimeout = useCallback(() => {
    setPlayers((prev) =>
      prev.map((p, idx) => (idx === activePlayerIndex ? { ...p, streak: 0 } : p))
    );
    setCurrentCardIndex((prev) => (prev + 1) % activeDeck.length);
    setActivePlayerIndex((prev) => (prev + 1) % players.length);
  }, [activeDeck.length, activePlayerIndex, players.length]);

  const handleRestartGame = useCallback(() => {
    setIsGameOverModalOpen(false);
    setCurrentCardIndex(0);
    setTotalCardsSolved(0);
    setActivePlayerIndex(0);
    setPlayers((prev) => prev.map((p) => ({ ...p, score: 0, streak: 0 })));
    setScreen('game');
  }, []);

  const handleLeaveGame = useCallback(() => {
    setScreen('welcome');
    setIsGameOverModalOpen(false);
    setServerTurnData(null);
  }, []);

  const activePlayer = players[activePlayerIndex] || players[0];

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-3 sm:p-5 bg-gradient-to-br from-[#120E2E] via-[#2A1045] to-[#0A0D1A] text-white relative overflow-x-hidden">
      {/* Dynamic Animated Question Marks Background */}
      <QuestionMarksBackground />

      {/* Main glassmorphic card container - Crystal clear transparent glass */}
      <div className="relative z-10 w-full max-w-[460px] bg-white/[0.03] bg-gradient-to-b from-white/[0.07] via-white/[0.02] to-transparent backdrop-blur-[3px] border border-white/25 rounded-[32px] p-5 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.3)] transition-all">
        {screen === 'welcome' && (
          <RoleSelectScreen
            onOpenHost={() => setScreen('host')}
            onOpenPlayer={() => setScreen('player-join')}
            onOpenVideo={() => setIsIntroVideoOpen(true)}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
            turnDuration={settings.turnDuration}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            language={language}
            onToggleLanguage={handleToggleLanguage}
          />
        )}

        {screen === 'host' && (
          <HostScreen
            pin={pin}
            hasPurchasedLicense={hasPurchasedLicense}
            onPurchaseLicense={(contact?: string) => {
              if (typeof window !== 'undefined') {
                localStorage.setItem('ttg_host_active', 'true');
                if (contact) {
                  localStorage.setItem('ttg_host_contact', contact);
                }
              }
              handleGeneratePin();
            }}
            onStartGame={handleStartHostGame}
            onBack={() => setScreen('welcome')}
            players={players}
            onOpenCustomCardModal={() => setIsCustomCardModalOpen(true)}
            onOpenShareModal={() => setIsShareModalOpen(true)}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
            customCardsCount={customCards.length}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            language={language}
            onToggleLanguage={handleToggleLanguage}
            returnedPaymentContact={returnedPaymentContact}
            onGenerateNewPin={() => handleGeneratePin()}
          />
        )}

        {screen === 'player-join' && (
          <PlayerJoinScreen
            onJoin={handleJoinGame}
            onBack={() => setScreen('welcome')}
            defaultPin={pin}
            language={language}
            onToggleLanguage={handleToggleLanguage}
            onSetLanguage={(newLang) => {
              setLanguage(newLang);
              localStorage.setItem('ttg_lang', newLang);
            }}
          />
        )}

        {screen === 'player-lobby' && (
          <PlayerLobbyScreen
            pin={pin}
            players={players}
            myPlayerId={myPlayerId}
            turnDuration={settings.turnDuration}
            onLeave={() => {
              setScreen('welcome');
              setServerTurnData(null);
            }}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
            language={language}
            onToggleLanguage={handleToggleLanguage}
          />
        )}

        {screen === 'game' && activeDeck.length > 0 && (
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
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            language={language}
            onToggleLanguage={handleToggleLanguage}
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
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        language={language}
      />

      <IntroVideoModal
        isOpen={isIntroVideoOpen}
        onClose={() => setIsIntroVideoOpen(false)}
        videoUrl={introVideoUrl}
        onUpdateVideoUrl={handleUpdateVideoUrl}
        language={language}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        language={language}
        currentUserScore={players.find((p) => p.id === myPlayerId)?.score || 0}
        currentUserName={players.find((p) => p.id === myPlayerId)?.name}
        currentUserAvatar={players.find((p) => p.id === myPlayerId)?.avatar}
      />
    </div>
  );
}
