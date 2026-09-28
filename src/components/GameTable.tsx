import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CardItem, Player, Language, VoiceGender } from '../types/game';
import { VirtualKeyboard } from './VirtualKeyboard';
import { normalizeHebrewInput, lettersMatch } from '../utils/hebrewKeyboard';
import { sounds } from '../utils/audio';
import { translations } from '../utils/translations';
import { getGameSocket, getSessionToken, TurnStartedPayload, RoundWonPayload, ReactionPayload } from '../utils/socket';
import { VoiceGenderSelector } from './VoiceGenderSelector';
import { WhatsAppIcon } from './WhatsAppShareButton';
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
}

export const GameTable: React.FC<GameTableProps> = ({
  cards,
  currentCardIndex,
  players,
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

  // In Live Server mode:
  // If the server provided turn data, determine role and content from serverTurnData.
  // SERVER AUTHORITATIVE SECURITY:
  // If guesser: serverTurnData.image is null and serverTurnData.word is null!
  const isServerHolder = serverTurnData ? serverTurnData.isHolder : (myPlayerId === activePlayerId);

  // Active card and words (client fallback or server payload)
  const currentCard = cards[currentCardIndex] || cards[0];
  const localTargetWord = (isEn ? (currentCard.word_en || currentCard.word) : (currentCard.word_he || currentCard.word)).trim();

  // If we are holder and have server data, use it; otherwise fallback
  const targetWord = serverTurnData?.word || localTargetWord;
  const wordLength = serverTurnData?.wordLength || localTargetWord.length;
  const activeCategory = serverTurnData?.category || (isEn ? (currentCard.category_en || currentCard.category) : currentCard.category);
  const activeHint = serverTurnData?.hint || (isEn ? (currentCard.hint_en || currentCard.hint) : currentCard.hint);
  const activeHolderName = serverTurnData?.holderName || players.find(p => p.id === activePlayerId)?.name || 'מחזיק';
  const activeHolderAvatar = serverTurnData?.holderAvatar || players.find(p => p.id === activePlayerId)?.avatar || '👑';

  const [enteredLetters, setEnteredLetters] = useState<string[]>([]);
  const [activeBoxIndex, setActiveBoxIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(turnDuration);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [showHintText, setShowHintText] = useState<boolean>(Boolean(serverTurnData?.hint));
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  const [showTimerPicker, setShowTimerPicker] = useState<boolean>(false);
  const [lastReaction, setLastReaction] = useState<string | null>(null);
  const [floatingReaction, setFloatingReaction] = useState<{ reactionType?: 'yes' | 'no' | 'hot' | 'cold'; emoji: string; text: string; sender: string } | null>(null);
  const [winnerCelebration, setWinnerCelebration] = useState<RoundWonPayload | null>(null);

  // Round status ('waiting' = paused waiting for host/holder to start; 'active' = timer counting down)
  const [roundStatus, setRoundStatus] = useState<'waiting' | 'active'>(() => {
    return serverTurnData?.roundStatus || 'waiting';
  });
  const [roundEndsAt, setRoundEndsAt] = useState<number>(() => {
    return serverTurnData?.roundEndsAt || serverTurnData?.turnEndTime || 0;
  });

  const currentRoundStatus: 'waiting' | 'active' = roundStatus;
  const currentRoundEndsAt: number = roundEndsAt;

  // Sync from incoming serverTurnData updates
  useEffect(() => {
    if (serverTurnData?.roundStatus) {
      setRoundStatus(serverTurnData.roundStatus);
    }
    const end = serverTurnData?.roundEndsAt || serverTurnData?.turnEndTime || 0;
    if (end > 0) {
      setRoundEndsAt(end);
    }
  }, [serverTurnData?.roundStatus, serverTurnData?.roundEndsAt, serverTurnData?.turnEndTime]);

  const isHost = players.find(p => p.id === myPlayerId)?.isHost || myPlayerId === 'p-host';

  // Role Simulation toggle for single-screen / solo demo testing
  const [simulatedRole, setSimulatedRole] = useState<'holder' | 'guesser' | null>(null);

  const isCurrentClientHolder = simulatedRole ? simulatedRole === 'holder' : isServerHolder;

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const isHandledRef = useRef<boolean>(false);

  // Realtime Socket event subscriptions
  useEffect(() => {
    if (!isLiveServer || !roomPin) return;

    const socket = getGameSocket();

    const handleReaction = (data: ReactionPayload) => {
      let emoji = '💬';
      let text = '';
      if (data.reaction === 'yes') {
        emoji = '✅';
        text = t.btnYes;
        sounds.soundClue('yes', language, currentVoiceGender);
      } else if (data.reaction === 'no') {
        emoji = '❌';
        text = t.btnNo;
        sounds.soundClue('no', language, currentVoiceGender);
      } else if (data.reaction === 'hot') {
        emoji = '🔥';
        text = t.btnHot;
        sounds.soundClue('hot', language, currentVoiceGender);
      } else if (data.reaction === 'cold') {
        emoji = '❄️';
        text = t.btnCold;
        sounds.soundClue('cold', language, currentVoiceGender);
      }

      setFloatingReaction({ reactionType: data.reaction, emoji, text, sender: data.senderName });
      setLastReaction(`${emoji} ${text}`);
      setTimeout(() => setFloatingReaction(null), 3000);
    };

    const handleHintRevealed = (data: { hint: string }) => {
      sounds.soundHint();
      setShowHintText(true);
    };

    const handleRoundStarted = (data: { roundEndsAt?: number; endTime?: number; roundEndTime?: number; turnDuration?: number; cardIndex?: number; holderId?: string; holderName?: string }) => {
      sounds.soundSuccess();
      const end = data.roundEndTime || data.endTime || data.roundEndsAt || (Date.now() + (data.turnDuration || turnDuration) * 1000);
      setRoundEndsAt(end);
      setRoundStatus('active');
      setTimeLeft(data.turnDuration || turnDuration);
      isHandledRef.current = false;
    };

    const handleRoundWon = (data: RoundWonPayload) => {
      sounds.soundSuccess();
      setIsSuccess(true);
      setWinnerCelebration(data);
      setRoundStatus('waiting');
      setRoundEndsAt(0);
      isHandledRef.current = true;
      setTimeout(() => {
        setWinnerCelebration(null);
        setIsSuccess(false);
      }, 2500);
    };

    const handleTurnTimeout = (data: { word: string; image: string | null; reason: string }) => {
      sounds.soundError();
      setRoundStatus('waiting');
      setRoundEndsAt(0);
      setWinnerCelebration({
        winnerId: '',
        winnerName: isEn ? 'Time is up!' : 'הזמן נגמר!',
        winnerAvatar: '⏱️',
        word: data.word,
        image: data.image || '',
        points: 0,
        scores: [],
      });
      setTimeout(() => {
        setWinnerCelebration(null);
      }, 2400);
    };

    socket.on('REACTION_RECEIVED', handleReaction);
    socket.on('HINT_REVEALED', handleHintRevealed);
    socket.on('ROUND_STARTED', handleRoundStarted);
    socket.on('ROUND_WON', handleRoundWon);
    socket.on('TURN_TIMEOUT', handleTurnTimeout);

    return () => {
      socket.off('REACTION_RECEIVED', handleReaction);
      socket.off('HINT_REVEALED', handleHintRevealed);
      socket.off('ROUND_STARTED', handleRoundStarted);
      socket.off('ROUND_WON', handleRoundWon);
      socket.off('TURN_TIMEOUT', handleTurnTimeout);
    };
  }, [isLiveServer, roomPin, t, isEn, language, currentVoiceGender]);

  // Reset local state when turn changes or wordLength changes
  useEffect(() => {
    isHandledRef.current = false;
    setEnteredLetters(new Array(wordLength).fill(''));
    setActiveBoxIndex(0);
    setRoundStatus(serverTurnData?.roundStatus || 'waiting');
    setRoundEndsAt(serverTurnData?.roundEndsAt || serverTurnData?.turnEndTime || 0);
    setTimeLeft(serverTurnData?.turnDuration || turnDuration);
    setIsSuccess(false);
    setIsShaking(false);
    setShowHintText(Boolean(serverTurnData?.hint));
    setRevealedIndices([]);
    setLastReaction(null);
    setSimulatedRole(null);

    const focusTimer = setTimeout(() => {
      if (inputRefs.current[0]) {
        inputRefs.current[0]?.focus();
      }
    }, 150);

    return () => clearTimeout(focusTimer);
  }, [currentCardIndex, wordLength, turnDuration, language, serverTurnData?.turnEndTime, serverTurnData?.roundStatus, serverTurnData?.roundEndsAt]);

  // Server-Synchronized Timer Countdown with 200ms interval
  useEffect(() => {
    if (isSuccess || winnerCelebration) return;

    if (roundStatus !== 'active' || !roundEndsAt) {
      // Waiting state: timer stands at the chosen turn duration and DOES NOT RUN!
      setTimeLeft(serverTurnData?.turnDuration || turnDuration);
      return;
    }

    const updateCountdown = () => {
      // Server/Host Timestamp Sync:
      // remainingSeconds = Math.max(0, Math.ceil((roundEndsAt - Date.now()) / 1000))
      const msRemaining = roundEndsAt - Date.now();
      const remainingSeconds = Math.max(0, Math.ceil(msRemaining / 1000));
      setTimeLeft(remainingSeconds);

      if (remainingSeconds <= 4 && remainingSeconds > 0) {
        sounds.soundTick();
      }

      if (remainingSeconds === 0) {
        if (!isHandledRef.current) {
          isHandledRef.current = true;
          setRoundStatus('waiting');
          setRoundEndsAt(0);
          if (!isLiveServer) {
            sounds.soundError();
            setWinnerCelebration({
              winnerId: '',
              winnerName: isEn ? 'Time is up!' : 'הזמן נגמר!',
              winnerAvatar: '⏱️',
              word: targetWord,
              image: currentCard.imageUrl || currentCard.image,
              points: 0,
              scores: [],
            });
            setTimeout(() => {
              setWinnerCelebration(null);
              onCardTimeout();
            }, 2400);
          }
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 200);

    return () => clearInterval(interval);
  }, [isSuccess, winnerCelebration, roundStatus, roundEndsAt, serverTurnData?.turnDuration, turnDuration, isLiveServer, onCardTimeout]);

  // WhatsApp invitation share message & direct link
  const currentPin = roomPin || '';
  const currentLang = language;
  const baseUrl = (typeof window !== 'undefined' && window.location.origin.includes('time-to-guess.netlify.app'))
    ? window.location.origin
    : 'https://time-to-guess.netlify.app';
  const shareUrl = `${baseUrl}/?pin=${currentPin}&lang=${currentLang}`;

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
    sounds.soundSuccess();
    const duration = serverTurnData?.turnDuration || turnDuration;
    const roundEndTime = Date.now() + duration * 1000;

    // 1. Immediately update host/holder local state with 0ms delay:
    setRoundEndsAt(roundEndTime);
    setRoundStatus('active');
    setTimeLeft(duration);
    isHandledRef.current = false;

    // 2. Broadcast across network via WebSockets to all players:
    if (roomPin) {
      const socket = getGameSocket();
      socket.emit('START_ROUND', {
        pin: roomPin,
        sessionToken: getSessionToken(),
        duration,
        endTime: roundEndTime,
        roundEndTime,
      });
    }
  };

  // Handle letter input
  const handleLetterInput = (letter: string, atIndex: number) => {
    if (isSuccess || !letter) return;

    sounds.soundKeypress();

    const charToInsert = isEn ? letter.toUpperCase() : letter;
    const newLetters = [...enteredLetters];
    newLetters[atIndex] = charToInsert;
    setEnteredLetters(newLetters);

    // Advance to next empty box
    let nextIndex = atIndex + 1;
    while (nextIndex < wordLength && newLetters[nextIndex] !== '') {
      nextIndex++;
    }

    if (nextIndex < wordLength) {
      setActiveBoxIndex(nextIndex);
      inputRefs.current[nextIndex]?.focus();
    }

    // If word is completely filled, submit for validation if round is active
    const fullWord = newLetters.join('');
    if (fullWord.length === wordLength && !newLetters.includes('')) {
      if (currentRoundStatus === 'active') {
        submitGuess(fullWord, newLetters);
      }
    }
  };

  const handleBackspace = (atIndex: number) => {
    if (isSuccess) return;

    const newLetters = [...enteredLetters];
    if (newLetters[atIndex]) {
      newLetters[atIndex] = '';
      setEnteredLetters(newLetters);
    } else if (atIndex > 0) {
      newLetters[atIndex - 1] = '';
      setEnteredLetters(newLetters);
      setActiveBoxIndex(atIndex - 1);
      inputRefs.current[atIndex - 1]?.focus();
    }
  };

  // Submit guess to Server (or local fallback)
  const submitGuess = (fullWord: string, currentLetters: string[]) => {
    if (isLiveServer && roomPin) {
      // SERVER-AUTHORITATIVE VALIDATION
      const socket = getGameSocket();
      socket.emit(
        'SUBMIT_GUESS',
        {
          pin: roomPin,
          guess: fullWord,
          sessionToken: getSessionToken(),
        },
        (res: { success: boolean; correct?: boolean; error?: string }) => {
          if (res?.correct) {
            sounds.soundSuccess();
            setIsSuccess(true);
            isHandledRef.current = true;
          } else {
            sounds.soundError();
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
          }
        }
      );
    } else {
      // Local fallback validation
      let isMatch = true;
      if (isEn) {
        isMatch = fullWord.toUpperCase() === targetWord.toUpperCase();
      } else {
        for (let i = 0; i < targetWord.length; i++) {
          if (!lettersMatch(currentLetters[i], targetWord[i])) {
            isMatch = false;
            break;
          }
        }
      }

      if (isMatch) {
        sounds.soundSuccess();
        setIsSuccess(true);
        isHandledRef.current = true;
        setRoundStatus('waiting');
        setRoundEndsAt(0);
        const bonus = Math.max(1, Math.floor(timeLeft / 3));
        const winnerId = !isCurrentClientHolder ? myPlayerId : activePlayerId;
        const winner = players.find((p) => p.id === winnerId);
        setWinnerCelebration({
          winnerId,
          winnerName: winner?.name || (isEn ? 'Winner!' : 'ניצחון!'),
          winnerAvatar: winner?.avatar || '🎉',
          word: targetWord,
          image: currentCard.imageUrl || currentCard.image,
          points: 10 + bonus,
          scores: [],
        });
        setTimeout(() => {
          setWinnerCelebration(null);
          setIsSuccess(false);
          onCardSolved(winnerId, bonus);
        }, 2400);
      } else {
        sounds.soundError();
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      }
    }
  };

  // Physical keyboard listener
  useEffect(() => {
    if (isCurrentClientHolder) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSuccess || winnerCelebration) return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace(activeBoxIndex);
        return;
      }

      if (e.key === 'ArrowRight' && activeBoxIndex < wordLength - 1 && isEn) {
        e.preventDefault();
        setActiveBoxIndex(activeBoxIndex + 1);
        inputRefs.current[activeBoxIndex + 1]?.focus();
        return;
      }

      if (e.key === 'ArrowLeft' && activeBoxIndex > 0 && isEn) {
        e.preventDefault();
        setActiveBoxIndex(activeBoxIndex - 1);
        inputRefs.current[activeBoxIndex - 1]?.focus();
        return;
      }

      if (e.key === 'ArrowRight' && activeBoxIndex > 0 && !isEn) {
        e.preventDefault();
        setActiveBoxIndex(activeBoxIndex - 1);
        inputRefs.current[activeBoxIndex - 1]?.focus();
        return;
      }

      if (e.key === 'ArrowLeft' && activeBoxIndex < wordLength - 1 && !isEn) {
        e.preventDefault();
        setActiveBoxIndex(activeBoxIndex + 1);
        inputRefs.current[activeBoxIndex + 1]?.focus();
        return;
      }

      // Single character input
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (isEn) {
          if (/^[a-zA-Z]$/.test(e.key)) {
            e.preventDefault();
            sounds.soundKeypress();
            handleLetterInput(e.key.toUpperCase(), activeBoxIndex);
          }
        } else {
          const hebrewChar = normalizeHebrewInput(e.key);
          if (hebrewChar) {
            e.preventDefault();
            sounds.soundKeypress();
            handleLetterInput(hebrewChar, activeBoxIndex);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeBoxIndex, enteredLetters, wordLength, isSuccess, winnerCelebration, targetWord, isCurrentClientHolder, isEn]);

  // Holder sends reaction to all devices via server
  const sendHolderReaction = (reaction: 'yes' | 'no' | 'hot' | 'cold', label: string) => {
    // Play sound chime + formant vocalization + speak the word with chosen voice gender
    sounds.soundClue(reaction, language, currentVoiceGender);

    setLastReaction(label);

    if (isLiveServer && roomPin) {
      const socket = getGameSocket();
      socket.emit('SEND_REACTION', {
        pin: roomPin,
        reaction,
        sessionToken: getSessionToken(),
      });
    }
  };

  // Holder gives hint
  const handleGiveHint = () => {
    sounds.soundHint();
    setShowHintText(true);

    if (isLiveServer && roomPin) {
      const socket = getGameSocket();
      socket.emit('GIVE_HINT', { pin: roomPin, sessionToken: getSessionToken() });
    }
  };

  // Skip turn
  const handleSkipTurn = () => {
    sounds.soundWarning();
    if (isLiveServer && roomPin) {
      const socket = getGameSocket();
      socket.emit('SKIP_TURN', { pin: roomPin, sessionToken: getSessionToken() });
    } else {
      onCardTimeout();
    }
  };

  // Change timer
  const handleSelectTimerDuration = (sec: number) => {
    sounds.soundSuccess();
    if (onChangeTurnDuration) onChangeTurnDuration(sec);
    if (isLiveServer && roomPin) {
      const socket = getGameSocket();
      socket.emit('UPDATE_TIMER_DURATION', { pin: roomPin, duration: sec, sessionToken: getSessionToken() });
    }
    setShowTimerPicker(false);
  };

  const timerPercentage = Math.max(0, Math.min(100, (timeLeft / (serverTurnData?.turnDuration || turnDuration)) * 100));

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

      {/* Top action bar: Balanced single row with equal height 38px 3D glass buttons */}
      <div className="w-full flex items-center justify-between gap-1.5 sm:gap-2 mb-2.5">
        {/* 1. Leave Game */}
        <button
          onClick={onLeaveGame}
          className="btn-3d btn-3d-dark h-[38px] px-2.5 sm:px-3 rounded-xl text-xs font-bold text-slate-200 hover:text-rose-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shrink-0"
          title={isEn ? 'Leave Game' : 'צא מהמשחק'}
        >
          <LogOut className={`w-3.5 h-3.5 text-slate-300 ${isEn ? '' : 'rotate-180'}`} strokeWidth={2.2} />
          <span className="hidden xs:inline">{t.leaveGame}</span>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* 2. Room PIN / Solo badge */}
          <div
            className="btn-3d btn-3d-dark h-[38px] px-2.5 sm:px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm shrink-0 select-text"
            title={roomPin ? `Room PIN: ${roomPin}` : 'Solo / Demo'}
          >
            {isLiveServer && roomPin ? (
              <>
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" strokeWidth={2.2} />
                <span className="text-emerald-300 font-mono tracking-wider font-black">PIN: {roomPin}</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shrink-0" />
                <span className="text-indigo-300 font-bold">Solo</span>
              </>
            )}
          </div>

          {/* 3. Language Switcher */}
          {onToggleLanguage && (
            <button
              onClick={() => {
                sounds.soundKeypress();
                onToggleLanguage();
              }}
              className="btn-3d btn-3d-dark h-[38px] px-2.5 sm:px-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shrink-0"
              title={isEn ? 'Switch to Hebrew' : 'עבור לאנגלית'}
            >
              <Globe className="w-3.5 h-3.5 text-pink-300 shrink-0" strokeWidth={2.2} />
              <span>{t.langBtn}</span>
            </button>
          )}

          {/* 4. Share Room Modal */}
          {onOpenShareModal && (
            <button
              onClick={() => {
                sounds.soundKeypress();
                onOpenShareModal();
              }}
              className="btn-3d btn-3d-dark h-[38px] px-2.5 sm:px-3 rounded-xl text-xs font-bold text-pink-200 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shrink-0"
              title={isEn ? 'Share game room' : 'שתף חדר משחק'}
            >
              <Share2 className="w-3.5 h-3.5 text-pink-300 shrink-0" strokeWidth={2.2} />
              <span className="hidden sm:inline">{t.share}</span>
            </button>
          )}

          {/* 5. Sound Toggle */}
          <button
            onClick={onToggleMute}
            className="btn-3d btn-3d-dark h-[38px] w-[38px] rounded-xl flex items-center justify-center text-slate-300 cursor-pointer shadow-sm shrink-0"
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
          {players.map((p) => {
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

      {/* Main Game Display Frame */}
      <div className="w-full relative rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-900 mb-2 group aspect-[4/3] max-h-[220px] sm:max-h-[240px] flex items-center justify-center">
        {/* Floating Overlay Timer Badge inside the image frame */}
        <div
          className={`absolute top-3 ${isEn ? 'right-3' : 'left-3'} z-20 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border shadow-xl transition-all ${
            timeLeft <= 4 ? 'border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.6)]' : 'border-white/20'
          }`}
        >
          <TimerIcon
            className={`w-3.5 h-3.5 ${
              currentRoundStatus === 'waiting'
                ? 'text-amber-400'
                : timeLeft <= 4
                ? 'text-rose-400 animate-pulse'
                : 'text-emerald-400'
            }`}
            strokeWidth={2.4}
          />
          <span
            className={`font-mono font-black text-xs sm:text-sm tracking-tight ${
              currentRoundStatus === 'waiting'
                ? 'text-amber-300'
                : timeLeft <= 4
                ? 'text-rose-400 animate-ping font-extrabold'
                : 'text-white'
            }`}
          >
            {currentRoundStatus === 'waiting' ? (turnDuration === 60 ? '1m' : `${turnDuration}s`) : `${timeLeft}s`}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              sounds.soundKeypress();
              setShowTimerPicker(!showTimerPicker);
            }}
            title={isEn ? 'Change turn timer' : 'שנה זמן טיימר'}
            className="text-slate-400 hover:text-pink-300 transition-colors cursor-pointer"
          >
            <Settings className="w-3 h-3" strokeWidth={2} />
          </button>
        </div>

        {isCurrentClientHolder ? (
          /* Card Holder View: Sees the photo and the word! */
          <>
            <img
              src={serverTurnData?.imageUrl || serverTurnData?.image || currentCard.imageUrl || currentCard.image}
              alt={targetWord}
              className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
                isSuccess ? 'scale-105 brightness-110' : ''
              }`}
              loading="eager"
              crossOrigin="anonymous"
              onError={(e) => {
                const target = e.currentTarget;
                const fallbackUrl = currentCard.fallback || serverTurnData?.fallback;
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
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-5 bg-gradient-to-br from-[#2D1454] via-[#1E1B4B] to-[#0F172A]">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mb-2.5 rounded-2xl bg-pink-500/20 border-2 border-pink-400/40 flex items-center justify-center shadow-[0_0_25px_rgba(253,121,168,0.4)] animate-bounce">
              <HelpCircle className="w-9 h-9 sm:w-10 sm:h-10 text-pink-300" strokeWidth={2.2} />
            </div>
            <div className="font-black text-base sm:text-lg text-white mb-1 flex items-center gap-1.5">
              <span>{t.holdingText}</span>
              <span className="text-amber-300 font-extrabold">{activeHolderName}</span>
              <span>{activeHolderAvatar}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xs leading-relaxed">
              {t.guesserMystery}
            </p>

            {/* Category badge for guesser */}
            <div className={`absolute top-3 ${isEn ? 'left-3' : 'right-3'} bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/20 shadow flex items-center gap-1.5`}>
              <span>{t.categoryLabel}</span>
              <span className="text-pink-300 font-extrabold">{activeCategory}</span>
            </div>

            {/* Live hint if triggered by Holder */}
            {showHintText && activeHint && (
              <div className="absolute bottom-3 inset-x-3 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-xl text-center text-xs text-amber-200 border border-amber-400/40 animate-fadeIn flex items-center justify-center gap-1.5 shadow-lg">
                <div className="w-4 h-4 rounded-md bg-amber-400/20 flex items-center justify-center border border-amber-400/30">
                  <Lightbulb className="w-3 h-3 text-amber-300" strokeWidth={2.2} />
                </div>
                <span className="font-bold">{isEn ? 'Hint:' : 'רמז:'}</span>
                <span>{activeHint}</span>
              </div>
            )}
          </div>
        )}

        {/* Winner celebration overlay */}
        {(isSuccess || winnerCelebration) && (
          <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-md flex flex-col items-center justify-center animate-fadeIn text-center p-4 z-20">
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
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-1 animate-bounce" strokeWidth={2.4} />
            <span className="text-xl sm:text-2xl font-black text-white drop-shadow-md flex items-center gap-2">
              {winnerCelebration?.winnerName ? (
                <>
                  <Trophy className="w-6 h-6 text-amber-300 inline drop-shadow" strokeWidth={2.2} />
                  <span>{winnerCelebration.winnerName}</span>
                </>
              ) : (
                t.correctAlert
              )}
            </span>
            <span className="text-emerald-300 font-bold text-sm sm:text-base mt-0.5">
              {isEn ? 'Word:' : 'המילה הייתה:'} <b className="text-white uppercase">{winnerCelebration?.word || targetWord}</b>
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

      {/* Waiting Status / Start Round Actions */}
      {currentRoundStatus === 'waiting' && (
        isCurrentClientHolder || isHost ? (
          /* Host / Card Holder: prominent "התחל סיבוב! 🚀" button */
          <div className="w-full my-2 p-3 sm:p-4 rounded-3xl bg-gradient-to-r from-purple-900/60 via-pink-900/50 to-indigo-900/60 border-2 border-pink-500/50 shadow-2xl text-center animate-fadeIn">
            <div className="text-xs sm:text-sm font-extrabold text-pink-200 mb-2 flex items-center justify-center gap-2">
              <span className="text-xl">👑</span>
              <span>{isEn ? 'You are holding the secret picture! Ready?' : 'התמונה אצלך! כולם ממתינים שתתחיל/י את הסיבוב'}</span>
            </div>

            {/* Quick 3D WhatsApp Share Button directly above "Start Round!" */}
            {roomPin && (
              <a
                href={whatsappDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleQuickWhatsAppShare}
                className="btn-3d btn-3d-whatsapp relative group w-full py-2.5 px-4 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2.5 cursor-pointer shadow-lg mb-2.5 hover:scale-[1.01] active:scale-[0.98] transition-all"
                title={isEn ? 'Share room via WhatsApp' : 'שיתוף חדר בוואטסאפ'}
              >
                <span className="shimmer-sweep" />
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                  <WhatsAppIcon className="w-4 h-4 fill-white drop-shadow" />
                </div>
                <span className="tracking-wide drop-shadow-sm text-xs sm:text-sm font-black">
                  {isEn ? 'Share Room via WhatsApp' : 'שיתוף חדר בוואטסאפ'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/25 text-emerald-100 font-extrabold shadow-sm">
                  PIN: {roomPin}
                </span>
              </a>
            )}

            <button
              type="button"
              onClick={handleStartRound}
              className="btn-3d btn-3d-purple w-full py-3.5 px-6 text-white font-black text-base sm:text-lg rounded-2xl flex items-center justify-center gap-2.5 cursor-pointer shadow-[0_10px_35px_rgba(168,85,247,0.6)] animate-pulse hover:scale-102 active:scale-98 transition-all"
            >
              <span className="shimmer-sweep" />
              <Rocket className="w-5 h-5 text-amber-300 animate-bounce" />
              <span className="tracking-wide">{isEn ? 'Start Round! 🚀' : 'התחל סיבוב! 🚀'}</span>
            </button>
          </div>
        ) : (
          /* Guesser: Waiting message */
          <div className="w-full my-2 p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 border-2 border-amber-400/40 shadow-xl flex items-center justify-center gap-2.5 text-amber-200 text-xs sm:text-sm font-black animate-pulse text-center">
            <TimerIcon className="w-4 h-4 text-amber-400 shrink-0" strokeWidth={2.4} />
            <span>{isEn ? 'Waiting for host to start the round...' : 'ממתינים לתחילת הסיבוב על ידי המארח...'}</span>
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
              onClick={() => sendHolderReaction('yes', t.btnYes)}
              className="btn-3d btn-3d-clue-yes h-[44px] py-1 px-1 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow-md"
              title={isEn ? 'Yes (Spoken Voice)' : 'כן (השמעת קול)'}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300 drop-shadow shrink-0" strokeWidth={2.4} />
              <span className="font-black text-xs sm:text-sm drop-shadow">{t.btnYes}</span>
            </button>

            <button
              type="button"
              onClick={() => sendHolderReaction('no', t.btnNo)}
              className="btn-3d btn-3d-clue-no h-[44px] py-1 px-1 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow-md"
              title={isEn ? 'No (Spoken Voice)' : 'לא (השמעת קול)'}
            >
              <XCircle className="w-4 h-4 text-rose-300 drop-shadow shrink-0" strokeWidth={2.4} />
              <span className="font-black text-xs sm:text-sm drop-shadow">{t.btnNo}</span>
            </button>

            <button
              type="button"
              onClick={() => sendHolderReaction('hot', t.btnHot)}
              className="btn-3d btn-3d-clue-hot h-[44px] py-1 px-1 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow-md"
              title={isEn ? 'Hot (Spoken Voice)' : 'חם (השמעת קול)'}
            >
              <Flame className="w-4 h-4 text-amber-300 drop-shadow shrink-0" strokeWidth={2.4} />
              <span className="font-black text-xs sm:text-sm drop-shadow">{t.btnHot}</span>
            </button>

            <button
              type="button"
              onClick={() => sendHolderReaction('cold', t.btnCold)}
              className="btn-3d btn-3d-clue-cold h-[44px] py-1 px-1 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow-md"
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
          <p className="text-xs sm:text-sm text-slate-300 font-bold mb-1.5 text-center">
            {t.guessLabel}
          </p>

          {/* Letter Boxes Container */}
          <div
            className={`flex gap-1.5 sm:gap-2 justify-center my-2 transition-transform ${
              isShaking ? 'animate-shake' : ''
            }`}
            dir={isEn ? 'ltr' : 'rtl'}
          >
            {Array.from({ length: wordLength }).map((_, index) => {
              const letter = enteredLetters[index] || '';
              const isRevealedByHint = revealedIndices.includes(index);
              const isCurrentFocus = activeBoxIndex === index;

              return (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  readOnly
                  maxLength={1}
                  value={letter}
                  onClick={() => {
                    setActiveBoxIndex(index);
                    sounds.soundKeypress();
                  }}
                  className={`w-11 sm:w-13 h-13 sm:h-15 rounded-2xl text-center font-black text-2xl sm:text-3xl select-none uppercase transition-all cursor-pointer ${
                    isSuccess
                      ? 'bg-emerald-500/30 border-2 border-emerald-400 text-emerald-100 scale-105 shadow-lg shadow-emerald-500/30'
                      : isCurrentFocus
                      ? 'bg-pink-500/25 border-2 border-pink-400 text-white -translate-y-1 shadow-lg shadow-pink-500/30 ring-2 ring-pink-500/30'
                      : letter
                      ? 'bg-white/15 border-2 border-white/30 text-white'
                      : 'bg-white/5 border-2 border-white/15 text-white/50 hover:bg-white/10'
                  } ${isRevealedByHint ? 'text-amber-300' : ''}`}
                />
              );
            })}
          </div>

          {/* Onscreen Virtual Keyboard */}
          <VirtualKeyboard
            onLetterPress={(letter) => handleLetterInput(letter, activeBoxIndex)}
            onBackspace={() => handleBackspace(activeBoxIndex)}
            onHintClick={handleGiveHint}
            canHint={!isSuccess}
            disabled={isSuccess}
            language={language}
          />
        </div>
      )}

    </div>
  );
};
