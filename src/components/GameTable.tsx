import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CardItem, Player, Language, VoiceGender } from '../types/game';
import { VirtualKeyboard } from './VirtualKeyboard';
import { normalizeHebrewInput, lettersMatch } from '../utils/hebrewKeyboard';
import { sounds } from '../utils/audio';
import { translations } from '../utils/translations';
import { getGameSocket, getSessionToken, TurnStartedPayload, RoundWonPayload, ReactionPayload } from '../utils/socket';
import { VoiceGenderSelector } from './VoiceGenderSelector';
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
  Lock
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

    const handleRoundWon = (data: RoundWonPayload) => {
      sounds.soundSuccess();
      setIsSuccess(true);
      setWinnerCelebration(data);
      isHandledRef.current = true;
      setTimeout(() => {
        setWinnerCelebration(null);
        setIsSuccess(false);
      }, 2500);
    };

    const handleTurnTimeout = (data: { word: string; image: string | null; reason: string }) => {
      sounds.soundError();
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
    socket.on('ROUND_WON', handleRoundWon);
    socket.on('TURN_TIMEOUT', handleTurnTimeout);

    return () => {
      socket.off('REACTION_RECEIVED', handleReaction);
      socket.off('HINT_REVEALED', handleHintRevealed);
      socket.off('ROUND_WON', handleRoundWon);
      socket.off('TURN_TIMEOUT', handleTurnTimeout);
    };
  }, [isLiveServer, roomPin, t, isEn]);

  // Reset local state when turn changes or wordLength changes
  useEffect(() => {
    isHandledRef.current = false;
    setEnteredLetters(new Array(wordLength).fill(''));
    setActiveBoxIndex(0);
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
  }, [currentCardIndex, wordLength, turnDuration, language, serverTurnData?.turnEndTime]);

  // Server-Synchronized Timer Countdown
  useEffect(() => {
    if (isSuccess || winnerCelebration) return;

    const interval = setInterval(() => {
      if (isLiveServer && serverTurnData?.turnEndTime) {
        // SERVER AUTHORITATIVE TIMESTAMP
        const msRemaining = serverTurnData.turnEndTime - Date.now();
        const secondsRemaining = Math.max(0, Math.ceil(msRemaining / 1000));
        setTimeLeft(secondsRemaining);

        if (secondsRemaining <= 4 && secondsRemaining > 0) {
          sounds.soundTick();
        }
      } else {
        // Local Client Timer (Fallback / Solo)
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (!isHandledRef.current) {
              isHandledRef.current = true;
              setTimeout(() => {
                sounds.soundError();
                onCardTimeout();
              }, 0);
            }
            return 0;
          }
          if (prev <= 4) {
            sounds.soundTick();
          }
          return prev - 1;
        });
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isSuccess, winnerCelebration, isLiveServer, serverTurnData?.turnEndTime, onCardTimeout]);

  // Handle letter input
  const handleLetterInput = (letter: string, atIndex: number) => {
    if (isSuccess || !letter) return;

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

    // If word is completely filled, submit for validation!
    const fullWord = newLetters.join('');
    if (fullWord.length === wordLength && !newLetters.includes('')) {
      submitGuess(fullWord, newLetters);
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
        const bonus = Math.max(1, Math.floor(timeLeft / 3));
        const winnerId = !isCurrentClientHolder ? myPlayerId : activePlayerId;
        setTimeout(() => {
          onCardSolved(winnerId, bonus);
        }, 1000);
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

      {/* Top action bar */}
      <div className="w-full flex justify-between items-center mb-2.5">
        <button
          onClick={onLeaveGame}
          className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-rose-300 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/20 border border-white/10 transition-all cursor-pointer group shadow-sm"
          title={isEn ? 'Leave Game' : 'צא מהמשחק'}
        >
          <div className="w-5 h-5 rounded-lg bg-white/10 group-hover:bg-rose-500/30 flex items-center justify-center transition-colors">
            <LogOut className={`w-3.5 h-3.5 text-slate-300 group-hover:text-rose-300 ${isEn ? '' : 'rotate-180'}`} strokeWidth={2.2} />
          </div>
          <span>{t.leaveGame}</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Live indicator badge */}
          {isLiveServer ? (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30 shadow-sm">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" strokeWidth={2.2} />
              <span>PIN: {roomPin}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-300 bg-indigo-500/20 px-2.5 py-1 rounded-full border border-indigo-500/30 shadow-sm">
              <span>Solo/Demo</span>
            </span>
          )}

          {/* Language Switcher */}
          {onToggleLanguage && (
            <button
              onClick={() => {
                sounds.soundKeypress();
                onToggleLanguage();
              }}
              className="bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 text-white px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <div className="w-5 h-5 rounded-lg bg-pink-500/20 flex items-center justify-center border border-pink-400/30">
                <Globe className="w-3.5 h-3.5 text-pink-300" strokeWidth={2.2} />
              </div>
              <span>{t.langBtn}</span>
            </button>
          )}

          {/* Share Room Button */}
          {onOpenShareModal && (
            <button
              onClick={() => {
                sounds.soundKeypress();
                onOpenShareModal();
              }}
              className="flex items-center gap-1.5 text-xs text-pink-200 hover:text-white px-2.5 py-1 rounded-xl bg-pink-500/15 hover:bg-pink-500/30 border border-pink-400/30 transition-all cursor-pointer shadow-sm"
              title={isEn ? 'Share game room' : 'שתף חדר משחק'}
            >
              <div className="w-5 h-5 rounded-lg bg-pink-500/30 flex items-center justify-center border border-pink-300/40">
                <Share2 className="w-3.5 h-3.5 text-pink-200" strokeWidth={2.2} />
              </div>
              <span className="hidden sm:inline">{t.share}</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={onToggleMute}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-slate-300 cursor-pointer shadow-sm transition-all"
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

      {/* Role status pill & single-device simulation switch */}
      <div className="w-full flex justify-between items-center px-1 mb-2.5">
        <div>
          {isCurrentClientHolder ? (
            <span className="text-xs font-black px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white border border-purple-400/40 shadow-md flex items-center gap-2 animate-fadeIn">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30">
                <ImageIcon className="w-3.5 h-3.5 text-purple-200" strokeWidth={2.2} />
              </div>
              <span>{t.holderRole}</span>
            </span>
          ) : (
            <span className="text-xs font-black px-3.5 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white border border-pink-400/40 shadow-md flex items-center gap-2 animate-fadeIn">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30">
                <HelpCircle className="w-3.5 h-3.5 text-pink-200" strokeWidth={2.2} />
              </div>
              <span>{t.guesserRole}</span>
            </span>
          )}
        </div>

        {/* Demo role switch (for local testing) */}
        <button
          type="button"
          onClick={() => {
            sounds.soundKeypress();
            setSimulatedRole(isCurrentClientHolder ? 'guesser' : 'holder');
          }}
          className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-slate-200 border border-white/15 transition-all cursor-pointer shadow-sm"
          title={isEn ? 'Toggle perspective between holder and guesser' : 'מאפשר להדגים את נקודת המבט השנייה או לבדוק לבד'}
        >
          <RefreshCw className="w-3 h-3 text-pink-400" strokeWidth={2.2} />
          <span>{t.demoBtn}</span>
        </button>
      </div>

      {/* Security badge: server-authoritative indicator */}
      <div className="w-full flex justify-between items-center px-3 py-1.5 mb-2.5 text-[11px] text-slate-300 bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 shadow-sm">
        <span className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-md bg-emerald-500/20 flex items-center justify-center border border-emerald-400/40">
            <Lock className="w-2.5 h-2.5 text-emerald-400" strokeWidth={2.2} />
          </div>
          <span className="font-semibold">{t.serverAuthoritative}</span>
        </span>
        <span className="font-mono font-bold text-slate-400">
          {currentCardIndex + 1} / {cards.length}
        </span>
      </div>

      {/* Main Game Display Frame */}
      <div className="w-full relative rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-900 mb-3 group aspect-[4/3] max-h-[220px] sm:max-h-[240px] flex items-center justify-center">
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

      {/* Timer Bar & Server Countdown */}
      <div className="w-full mb-3 flex items-center justify-between bg-white/5 border border-white/10 px-3.5 py-2 rounded-2xl">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
          <TimerIcon
            className={`w-4 h-4 ${
              timeLeft <= 4 ? 'text-rose-400 animate-pulse' : 'text-amber-400'
            }`}
            strokeWidth={2.2}
          />
          <span>{t.timeLabel}</span>
        </div>

        {/* Progress track */}
        <div className="flex-1 mx-3 h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-linear ${
              timeLeft <= 4
                ? 'bg-rose-500'
                : timeLeft <= 8
                ? 'bg-amber-400'
                : 'bg-gradient-to-r from-emerald-400 to-teal-400'
            }`}
            style={{ width: `${timerPercentage}%` }}
          />
        </div>

        <div className="flex items-center gap-1.5">
          <div
            className={`font-black text-lg min-w-[28px] text-center font-mono ${
              timeLeft <= 4 ? 'text-rose-400 animate-ping' : 'text-pink-300'
            }`}
          >
            {timeLeft}
          </div>

          <button
            onClick={() => {
              sounds.soundKeypress();
              setShowTimerPicker(!showTimerPicker);
            }}
            title={isEn ? 'Change turn timer' : 'שנה זמן טיימר'}
            className="btn-3d btn-3d-dark px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-pink-400" strokeWidth={2.2} />
            <span className="text-[10px] text-pink-300 font-extrabold">{turnDuration === 60 ? (isEn ? '1m' : 'דקה') : `${turnDuration}s`}</span>
          </button>
        </div>
      </div>

      {/* Mid-game Timer Picker Dropdown */}
      {showTimerPicker && (
        <div className="w-full mb-3 bg-black/80 backdrop-blur-md border border-pink-500/40 rounded-2xl p-2.5 flex items-center justify-between gap-2 animate-fadeIn shadow-2xl">
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

      {/* Role-Specific Interactive Area */}
      {isCurrentClientHolder ? (
        /* HOLDER INTERACTION AREA */
        <div className="w-full my-1 bg-gradient-to-b from-purple-900/30 to-black/40 border border-purple-500/30 rounded-2xl p-3.5 text-center animate-fadeIn shadow-lg">
          <div className="flex items-center justify-center gap-2 mb-1 text-emerald-400 font-extrabold text-sm">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <Mic className="w-3.5 h-3.5 text-emerald-300" strokeWidth={2.2} />
            </div>
            <span>{t.holderMsg}</span>
          </div>
          <p className="text-xs text-slate-300 mb-2.5">
            {t.holderSub}
          </p>

          {/* Voice Gender Selection Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-3 py-2 bg-black/40 rounded-2xl border border-white/10 shadow-inner">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <div className="w-5 h-5 rounded-md bg-pink-500/20 border border-pink-400/30 flex items-center justify-center">
                <Volume2 className="w-3.5 h-3.5 text-pink-400" strokeWidth={2.2} />
              </div>
              <span>{isEn ? 'Spoken Voice:' : 'קול המענה:'}</span>
              <span className="inline-flex items-center gap-1 text-[11px] text-pink-300 font-extrabold bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
                <User className="w-3 h-3 text-pink-300" strokeWidth={2.2} />
                <span>{currentVoiceGender === 'female' ? (isEn ? 'Female' : 'נקבה') : (isEn ? 'Male' : 'זכר')}</span>
              </span>
            </div>
            <VoiceGenderSelector
              voiceGender={currentVoiceGender}
              onChangeVoiceGender={handleVoiceGenderChange}
              language={language}
              variant="segmented"
            />
          </div>

          {/* Quick Sound & Voice Clue response buttons for the holder */}
          <div className="grid grid-cols-4 gap-2 mb-2.5">
            <button
              type="button"
              onClick={() => sendHolderReaction('yes', t.btnYes)}
              className="btn-3d btn-3d-clue-yes py-3.5 px-1 text-white rounded-2xl text-xs font-black flex flex-col items-center justify-center gap-1.5 cursor-pointer group"
              title={isEn ? 'Yes (Spoken Voice)' : 'כן (השמעת קול)'}
            >
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/25 shadow-sm group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-6 h-6 text-emerald-300 drop-shadow" strokeWidth={2.4} />
              </div>
              <span className="font-black tracking-wide drop-shadow text-xs">{t.btnYes}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/30 text-emerald-100 font-bold flex items-center gap-1">
                <Volume2 className="w-2.5 h-2.5 text-emerald-300" strokeWidth={2.2} />
                <span>{currentVoiceGender === 'female' ? (isEn ? 'Female' : 'נקבה') : (isEn ? 'Male' : 'זכר')}</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => sendHolderReaction('no', t.btnNo)}
              className="btn-3d btn-3d-clue-no py-3.5 px-1 text-white rounded-2xl text-xs font-black flex flex-col items-center justify-center gap-1.5 cursor-pointer group"
              title={isEn ? 'No (Spoken Voice)' : 'לא (השמעת קול)'}
            >
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/25 shadow-sm group-hover:scale-110 transition-transform">
                <XCircle className="w-6 h-6 text-rose-300 drop-shadow" strokeWidth={2.4} />
              </div>
              <span className="font-black tracking-wide drop-shadow text-xs">{t.btnNo}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/30 text-rose-100 font-bold flex items-center gap-1">
                <Volume2 className="w-2.5 h-2.5 text-rose-300" strokeWidth={2.2} />
                <span>{currentVoiceGender === 'female' ? (isEn ? 'Female' : 'נקבה') : (isEn ? 'Male' : 'זכר')}</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => sendHolderReaction('hot', t.btnHot)}
              className="btn-3d btn-3d-clue-hot py-3.5 px-1 text-white rounded-2xl text-xs font-black flex flex-col items-center justify-center gap-1.5 cursor-pointer group"
              title={isEn ? 'Hot (Spoken Voice)' : 'חם (השמעת קול)'}
            >
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/25 shadow-sm group-hover:scale-110 transition-transform">
                <Flame className="w-6 h-6 text-amber-300 drop-shadow" strokeWidth={2.4} />
              </div>
              <span className="font-black tracking-wide drop-shadow text-xs">{t.btnHot}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/30 text-amber-100 font-bold flex items-center gap-1">
                <Volume2 className="w-2.5 h-2.5 text-amber-300" strokeWidth={2.2} />
                <span>{currentVoiceGender === 'female' ? (isEn ? 'Female' : 'נקבה') : (isEn ? 'Male' : 'זכר')}</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => sendHolderReaction('cold', t.btnCold)}
              className="btn-3d btn-3d-clue-cold py-3.5 px-1 text-white rounded-2xl text-xs font-black flex flex-col items-center justify-center gap-1.5 cursor-pointer group"
              title={isEn ? 'Cold (Spoken Voice)' : 'קר (השמעת קול)'}
            >
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/25 shadow-sm group-hover:scale-110 transition-transform">
                <Snowflake className="w-6 h-6 text-cyan-300 drop-shadow" strokeWidth={2.4} />
              </div>
              <span className="font-black tracking-wide drop-shadow text-xs">{t.btnCold}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/30 text-cyan-100 font-bold flex items-center gap-1">
                <Volume2 className="w-2.5 h-2.5 text-cyan-300" strokeWidth={2.2} />
                <span>{currentVoiceGender === 'female' ? (isEn ? 'Female' : 'נקבה') : (isEn ? 'Male' : 'זכר')}</span>
              </span>
            </button>
          </div>

          {lastReaction && (
            <div className="mb-2 text-xs font-bold text-amber-300 bg-amber-400/10 py-1.5 px-3 rounded-xl border border-amber-400/20 animate-fadeIn">
              {t.holderReaction} <b>{lastReaction}</b>
            </div>
          )}

          {/* Holder action helpers */}
          <div className="flex gap-2 justify-center pt-2 border-t border-white/10">
            {activeHint && (
              <button
                type="button"
                onClick={handleGiveHint}
                className="btn-3d btn-3d-dark flex items-center gap-2 px-4 py-2.5 text-amber-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                <div className="w-5 h-5 rounded-md bg-amber-400/20 flex items-center justify-center border border-amber-400/40">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-300" strokeWidth={2.2} />
                </div>
                <span>{t.giveHint}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSkipTurn}
              className="btn-3d btn-3d-dark flex items-center gap-2 px-4 py-2.5 text-slate-300 hover:text-rose-200 rounded-xl text-xs font-bold cursor-pointer"
            >
              <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center border border-white/20">
                <SkipForward className="w-3.5 h-3.5 text-slate-300" strokeWidth={2.2} />
              </div>
              <span>{t.skipTurn}</span>
            </button>
          </div>
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

      {/* Live Leaderboard */}
      <div className={`w-full mt-3.5 bg-black/30 border border-white/10 rounded-2xl p-3.5 text-xs shadow-lg ${isEn ? 'text-left' : 'text-right'}`}>
        <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/10 font-bold">
          <span className="text-amber-300 flex items-center gap-1.5 text-sm">
            <Trophy className="w-4 h-4 text-amber-400" />
            {t.boardTitle}
          </span>
          <span className="text-pink-300 font-bold">
            {t.holdingText} {activeHolderName} {activeHolderAvatar}
          </span>
        </div>

        <div className="space-y-1.5">
          {players.map((p) => {
            const isHolding = p.id === activePlayerId || (serverTurnData && serverTurnData.holderId === p.id);
            const isMe = p.id === myPlayerId;
            return (
              <div
                key={p.id}
                className={`flex justify-between items-center px-3 py-1.5 rounded-xl border transition-all ${
                  isHolding
                    ? 'bg-purple-600/25 border-purple-500/40 text-purple-200 font-bold'
                    : 'bg-white/5 border-white/5 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{p.avatar}</span>
                  <span className="text-white font-medium">{p.name}</span>
                  {isMe && <span className="text-[10px] text-pink-300 font-bold">{t.you}</span>}
                  {isHolding && (
                    <span className="text-[10px] bg-purple-500/30 text-purple-200 px-1.5 py-0.5 rounded-md font-bold">
                      {t.holdingBadge}
                    </span>
                  )}
                  {p.streak > 1 && (
                    <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5">
                      <Flame className="w-3 h-3 fill-orange-400 inline" /> {p.streak}
                    </span>
                  )}
                </div>
                <span className="font-extrabold text-emerald-400 text-sm">{p.score} {t.pts}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
