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
import { sounds } from './utils/audio';
import { getGameSocket, getSessionToken, TurnStartedPayload } from './utils/socket';

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('welcome');
  const [pin, setPin] = useState<string>('7742');
  const [hasPurchasedLicense, setHasPurchasedLicense] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(sounds.isMuted);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isLiveServer, setIsLiveServer] = useState<boolean>(false);
  const [serverTurnData, setServerTurnData] = useState<TurnStartedPayload | null>(null);

  // Intro video modal state (opens on entry unless opted out)
  const [introVideoUrl, setIntroVideoUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ttg_intro_video_url');
      if (saved) return saved;
    }
    return 'https://www.youtube.com/watch?v=lYah5-xEeck';
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
    { id: 'p-1', name: 'מיכל / Michal', avatar: '🦁', score: 0, isHost: false, streak: 0 },
    { id: 'p-2', name: 'יוסי / Yossi', avatar: '🦊', score: 0, isHost: false, streak: 0 },
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
      }
      setIsGameOverModalOpen(true);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('ROOM_UPDATED', onRoomUpdated);
    socket.on('TURN_STARTED', onTurnStarted);
    socket.on('GAME_OVER', onGameOver);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('ROOM_UPDATED', onRoomUpdated);
      socket.off('TURN_STARTED', onTurnStarted);
      socket.off('GAME_OVER', onGameOver);
    };
  }, []);

  // Auto-detect invitation link with ?pin=XXXX
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlPin = params.get('pin');
      if (urlPin) {
        setPin(urlPin);
        setScreen('player-join');
      }
    }
  }, []);

  const handleToggleMute = () => {
    const updated = sounds.toggleMute();
    setIsMuted(updated);
  };

  // Host generates PIN via Server
  const handleGeneratePin = () => {
    const socket = getGameSocket();
    const token = getSessionToken();

    socket.emit(
      'CREATE_ROOM',
      {
        hostName: language === 'en' ? 'Host (Danny)' : 'מארח (דני)',
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
        } else {
          // Fallback
          const newPin = Math.floor(1000 + Math.random() * 9000).toString();
          setPin(newPin);
          setHasPurchasedLicense(true);
        }
      }
    );
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

    socket.emit(
      'JOIN_ROOM',
      {
        pin: enteredPin,
        name: playerName,
        avatar,
        sessionToken: token,
      },
      (res: { success: boolean; pin?: string; player?: Player; room?: { players: Player[]; status: string }; error?: string }) => {
        if (res?.success && res.player && res.room) {
          setPin(res.pin || enteredPin);
          setMyPlayerId(res.player.id);
          setPlayers(res.room.players);
          if (res.room.status === 'IN_PROGRESS') {
            setScreen('game');
          } else {
            setScreen('player-lobby');
          }
        } else {
          onError?.(res?.error || (language === 'en' ? 'Room not found! Check PIN with host.' : 'חדר לא נמצא! בדוק את קוד ה-PIN עם המארח.'));
        }
      }
    );
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
    <div className="min-h-screen w-full flex items-center justify-center p-3 sm:p-5 bg-gradient-to-br from-[#120E2E] via-[#2A1045] to-[#0A0D1A] text-white">
      {/* Background ambient blurs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-10 left-10 w-72 h-72 bg-purple-600/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-pink-600/15 rounded-full blur-[120px]" />
      </div>

      {/* Main glassmorphic card container */}
      <div className="relative z-10 w-full max-w-[460px] bg-white/[0.07] backdrop-blur-2xl border border-white/20 rounded-[32px] p-5 sm:p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] transition-all">
        {screen === 'welcome' && (
          <RoleSelectScreen
            onOpenHost={() => setScreen('host')}
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

        {screen === 'host' && (
          <HostScreen
            pin={pin}
            hasPurchasedLicense={hasPurchasedLicense}
            onPurchaseLicense={handleGeneratePin}
            onStartGame={handleStartHostGame}
            onBack={() => setScreen('welcome')}
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

        {screen === 'player-join' && (
          <PlayerJoinScreen
            onJoin={handleJoinGame}
            onBack={() => setScreen('welcome')}
            defaultPin={pin}
            language={language}
            onToggleLanguage={handleToggleLanguage}
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
            onOpenShareModal={() => setIsShareModalOpen(true)}
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
        language={language}
      />

      <IntroVideoModal
        isOpen={isIntroVideoOpen}
        onClose={() => setIsIntroVideoOpen(false)}
        videoUrl={introVideoUrl}
        onUpdateVideoUrl={handleUpdateVideoUrl}
        language={language}
      />
    </div>
  );
}
