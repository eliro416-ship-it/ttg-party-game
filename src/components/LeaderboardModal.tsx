import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Trophy,
  X,
  Medal,
  Flame,
  Crown,
  Search,
  RotateCw,
  TrendingUp,
  User,
  Sparkles,
  Calendar,
  Clock,
  Swords,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Layers,
  ArrowUpRight,
  Percent
} from 'lucide-react';
import { sounds } from '../utils/audio';
import { Language } from '../types/game';
import { getSessionToken } from '../utils/socket';

export interface LeaderboardItem {
  id: string;
  rank: number;
  sessionToken: string;
  name: string;
  avatar: string;
  score: number;
  streak: number;
  solvedCards: number;
  timestamp: number;
}

export type LeaderboardPeriod = 'daily' | 'weekly' | 'all-time';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
  currentUserScore?: number;
  currentUserName?: string;
  currentUserAvatar?: string;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  language = 'he',
  currentUserScore,
  currentUserName,
  currentUserAvatar,
}) => {
  const isEn = language === 'en';
  const [period, setPeriod] = useState<LeaderboardPeriod>('all-time');
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myEntry, setMyEntry] = useState<LeaderboardItem | null>(null);
  const [topPercentile, setTopPercentile] = useState<number | null>(null);
  const [totalPlayers, setTotalPlayers] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [comparedPlayer, setComparedPlayer] = useState<LeaderboardItem | null>(null);

  const sessionToken = typeof window !== 'undefined' ? getSessionToken() : '';
  const effectiveName =
    currentUserName ||
    (typeof window !== 'undefined' ? localStorage.getItem('player_name') : '') ||
    (isEn ? 'You' : 'אתה/את');
  const effectiveAvatar =
    currentUserAvatar ||
    (typeof window !== 'undefined' ? localStorage.getItem('player_avatar') : '') ||
    '🦁';
  const effectiveScore = myEntry ? myEntry.score : (currentUserScore || 0);

  const fetchLeaderboard = useCallback(async (selectedPeriod: LeaderboardPeriod) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/leaderboard?period=${selectedPeriod}&sessionToken=${encodeURIComponent(sessionToken)}&limit=50`
      );
      const data = await res.json();
      if (data?.success) {
        setLeaderboard(data.leaderboard || []);
        setMyRank(data.myRank ?? null);
        setMyEntry(data.myEntry ?? null);
        setTopPercentile(data.topPercentile ?? null);
        setTotalPlayers(data.totalPlayers || (data.leaderboard || []).length);
      }
    } catch (err) {
      console.warn('Failed to fetch leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, [sessionToken]);

  useEffect(() => {
    if (isOpen) {
      sounds.soundKeypress();
      fetchLeaderboard(period);
    }
  }, [isOpen, period, fetchLeaderboard]);

  const handlePeriodChange = (newPeriod: LeaderboardPeriod) => {
    sounds.soundKeypress();
    setPeriod(newPeriod);
    setComparedPlayer(null);
    fetchLeaderboard(newPeriod);
  };

  const handleRefresh = () => {
    sounds.soundKeypress();
    fetchLeaderboard(period);
  };

  const handleToggleCompare = (player: LeaderboardItem) => {
    sounds.soundKeypress();
    if (comparedPlayer?.id === player.id) {
      setComparedPlayer(null);
    } else {
      setComparedPlayer(player);
    }
  };

  // Top 3 Podium
  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  // Filtered list based on search
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return leaderboard;
    const q = searchQuery.trim().toLowerCase();
    return leaderboard.filter((item) => item.name.toLowerCase().includes(q));
  }, [leaderboard, searchQuery]);

  // Points needed to overtake player directly above user
  const pointsToNextRank = useMemo(() => {
    if (!myRank || myRank <= 1 || !myEntry) return null;
    const playerAbove = leaderboard.find((p) => p.rank === myRank - 1);
    if (!playerAbove) return null;
    return Math.max(1, playerAbove.score - myEntry.score + 1);
  }, [myRank, myEntry, leaderboard]);

  // Comparison metrics between user and compared player
  const comparisonData = useMemo(() => {
    if (!comparedPlayer) return null;
    const userScore = effectiveScore;
    const userStreak = myEntry ? myEntry.streak : 0;
    const userSolved = myEntry ? myEntry.solvedCards : (userScore > 0 ? Math.ceil(userScore / 10) : 0);

    const rivalScore = comparedPlayer.score;
    const rivalStreak = comparedPlayer.streak;
    const rivalSolved = comparedPlayer.solvedCards;

    const diff = userScore - rivalScore;
    const isAhead = diff > 0;
    const isTied = diff === 0;
    const pointsBehind = Math.abs(diff);
    const cardsNeeded = Math.ceil(pointsBehind / 10);

    const totalScorePool = Math.max(1, userScore + rivalScore);
    const userPercent = Math.round((userScore / totalScorePool) * 100);
    const rivalPercent = 100 - userPercent;

    return {
      userScore,
      userStreak,
      userSolved,
      rivalScore,
      rivalStreak,
      rivalSolved,
      diff,
      isAhead,
      isTied,
      pointsBehind,
      cardsNeeded,
      userPercent,
      rivalPercent,
    };
  }, [comparedPlayer, effectiveScore, myEntry]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      dir={isEn ? 'ltr' : 'rtl'}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-gradient-to-b from-[#241242]/95 via-[#1a0f30]/95 to-[#0e071e]/98 backdrop-blur-2xl border border-white/20 rounded-[32px] shadow-[0_25px_70px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.3)] overflow-hidden text-white"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 px-5 pt-5 pb-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-lg shadow-amber-500/30 flex items-center justify-center">
              <div className="w-full h-full bg-[#1e1035] rounded-[14px] flex items-center justify-center">
                <Trophy className="w-6 h-6 text-amber-300 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300">
                  {isEn ? 'Global Leaderboard' : 'טבלת האלופים והשיאים'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black border border-amber-400/30">
                  LIVE
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                {isEn ? 'Top players, high scores & rank comparison' : 'דירוג שחקנים, שיאים והשוואת דירוגים'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              title={isEn ? 'Refresh' : 'רענן'}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-300' : ''}`} />
            </button>
            <button
              onClick={() => {
                sounds.soundKeypress();
                onClose();
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-200 transition-all cursor-pointer active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Period Selector Tabs (Daily, Weekly, All-Time) */}
        <div className="px-5 pt-3 pb-2">
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/10">
            <button
              onClick={() => handlePeriodChange('daily')}
              className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                period === 'daily'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-900/40 ring-1 ring-amber-300/40'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{isEn ? 'Daily (24h)' : 'יומי (24 שעות)'}</span>
            </button>

            <button
              onClick={() => handlePeriodChange('weekly')}
              className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                period === 'weekly'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-pink-900/40 ring-1 ring-pink-300/40'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{isEn ? 'Weekly (7d)' : 'שבועי (7 ימים)'}</span>
            </button>

            <button
              onClick={() => handlePeriodChange('all-time')}
              className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                period === 'all-time'
                  ? 'bg-gradient-to-r from-yellow-500 via-amber-500 to-amber-600 text-white shadow-md shadow-amber-900/40 ring-1 ring-yellow-300/40'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-yellow-200" />
              <span>{isEn ? 'All-Time' : 'כל הזמנים'}</span>
            </button>
          </div>
        </div>

        {/* Content Body: Scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-3.5 custom-scrollbar">
          {/* USER HEAD-TO-HEAD COMPARISON DRAWER */}
          {comparedPlayer && comparisonData && (
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950/90 via-purple-950/90 to-pink-950/90 border-2 border-amber-400/80 rounded-2xl p-4 shadow-2xl animate-fadeIn">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/15">
                <div className="flex items-center gap-2 text-xs font-black text-amber-300">
                  <Swords className="w-4 h-4 text-amber-400 animate-bounce" />
                  <span>{isEn ? 'Head-to-Head Comparison' : 'השוואת ראש-בראש מול שחקן'}</span>
                </div>
                <button
                  onClick={() => setComparedPlayer(null)}
                  className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-xs transition-all cursor-pointer flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  <span>{isEn ? 'Close' : 'סגור השוואה'}</span>
                </button>
              </div>

              {/* Side by side cards */}
              <div className="grid grid-cols-2 gap-2.5 items-center text-center">
                {/* User column */}
                <div className="bg-pink-500/15 border border-pink-400/40 rounded-xl p-2.5 flex flex-col items-center">
                  <span className="text-2xl mb-1">{myEntry?.avatar || effectiveAvatar}</span>
                  <div className="text-xs font-black text-pink-200 truncate max-w-full">
                    {myEntry?.name || effectiveName}
                  </div>
                  <span className="text-[10px] text-pink-300 font-bold mb-1">
                    {myRank ? (isEn ? `Rank #${myRank}` : `מקום #${myRank}`) : (isEn ? 'Unranked' : 'טרם דורג')}
                  </span>
                  <div className="text-lg font-black text-amber-300 font-mono">
                    {comparisonData.userScore} <span className="text-[10px] font-sans">{isEn ? 'pts' : "נק'"}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-300">
                    <span>🔥 {comparisonData.userStreak}</span>
                    <span>🃏 {comparisonData.userSolved}</span>
                  </div>
                </div>

                {/* Rival column */}
                <div className="bg-white/10 border border-white/20 rounded-xl p-2.5 flex flex-col items-center">
                  <span className="text-2xl mb-1">{comparedPlayer.avatar}</span>
                  <div className="text-xs font-black text-white truncate max-w-full">
                    {comparedPlayer.name}
                  </div>
                  <span className="text-[10px] text-amber-300 font-bold mb-1">
                    {isEn ? `Rank #${comparedPlayer.rank}` : `מקום #${comparedPlayer.rank}`}
                  </span>
                  <div className="text-lg font-black text-yellow-300 font-mono">
                    {comparisonData.rivalScore} <span className="text-[10px] font-sans">{isEn ? 'pts' : "נק'"}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-300">
                    <span>🔥 {comparisonData.rivalStreak}</span>
                    <span>🃏 {comparisonData.rivalSolved}</span>
                  </div>
                </div>
              </div>

              {/* Score visual comparison bar */}
              <div className="mt-3">
                <div className="flex justify-between text-[10px] font-bold mb-1 text-slate-300">
                  <span className="text-pink-300">{comparisonData.userPercent}% {isEn ? 'You' : 'אתה'}</span>
                  <span className="text-yellow-300">{comparedPlayer.name} {comparisonData.rivalPercent}%</span>
                </div>
                <div className="h-2.5 w-full bg-black/50 rounded-full overflow-hidden flex border border-white/10">
                  <div
                    style={{ width: `${Math.max(5, comparisonData.userPercent)}%` }}
                    className="h-full bg-gradient-to-r from-pink-500 to-rose-400 transition-all duration-500"
                  />
                  <div
                    style={{ width: `${Math.max(5, comparisonData.rivalPercent)}%` }}
                    className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-500"
                  />
                </div>
              </div>

              {/* Head-to-Head Strategic verdict */}
              <div className="mt-3 p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs">
                {comparisonData.isAhead ? (
                  <div className="text-emerald-300 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-none" />
                    <span>
                      {isEn
                        ? `You lead by ${comparisonData.diff} points! Keep answering correctly to hold your rank.`
                        : `אתה מוביל ב-${comparisonData.diff} נקודות! המשך לנחש נכון כדי לשמור על הפער.`}
                    </span>
                  </div>
                ) : comparisonData.isTied ? (
                  <div className="text-amber-300 font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 flex-none" />
                    <span>
                      {isEn
                        ? `Dead tie! Solve just 1 more card correctly to pull ahead.`
                        : `תיקו מוחלט בניקוד! כרטיס אחד נכון ואתה עוקף אותו.`}
                    </span>
                  </div>
                ) : (
                  <div className="text-pink-200 font-bold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-pink-400 flex-none" />
                    <span>
                      {isEn
                        ? `You need ${comparisonData.pointsBehind} more pts (~${comparisonData.cardsNeeded} cards) to overtake ${comparedPlayer.name}!`
                        : `חסרות לך עוד ${comparisonData.pointsBehind} נק' (כ-${comparisonData.cardsNeeded} כרטיסים נכונים) כדי לעקוף את ${comparedPlayer.name}!`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Top 3 Podium Cards (only when not searching) */}
          {!searchQuery && leaderboard.length >= 3 && (
            <div className="pt-2 pb-1">
              <div className="grid grid-cols-3 gap-2 items-end">
                {/* 2nd Place (Silver) */}
                {top2 && (
                  <div
                    onClick={() => handleToggleCompare(top2)}
                    className="relative flex flex-col items-center bg-white/[0.06] hover:bg-white/[0.12] border border-slate-400/30 rounded-2xl p-2.5 text-center shadow-lg transition-all cursor-pointer active:scale-95 group"
                    title={isEn ? 'Click to compare' : 'לחץ להשוואה מול מקום 2'}
                  >
                    <span className="absolute -top-3 px-2 py-0.5 rounded-full bg-slate-300 text-slate-900 text-[10px] font-black shadow flex items-center gap-1">
                      🥈 2
                    </span>
                    <span className="text-3xl mt-2 mb-1 filter drop-shadow">{top2.avatar}</span>
                    <span className="text-xs font-black text-slate-100 truncate w-full">{top2.name}</span>
                    <div className="mt-1 px-2 py-0.5 rounded-lg bg-slate-400/20 text-slate-200 text-xs font-black">
                      {top2.score} {isEn ? 'pts' : "נק'"}
                    </div>
                    <span className="mt-1 text-[9px] text-slate-400 group-hover:text-amber-300 font-bold flex items-center gap-0.5">
                      <Swords className="w-2.5 h-2.5" /> {isEn ? 'Compare' : 'השווה'}
                    </span>
                  </div>
                )}

                {/* 1st Place (Gold Champion) */}
                {top1 && (
                  <div
                    onClick={() => handleToggleCompare(top1)}
                    className="relative flex flex-col items-center bg-gradient-to-b from-amber-500/25 to-yellow-500/10 hover:from-amber-500/35 hover:to-yellow-500/20 border-2 border-amber-400/70 rounded-2xl p-3 text-center shadow-xl shadow-amber-500/15 -translate-y-2 scale-105 transition-all cursor-pointer active:scale-95 group"
                    title={isEn ? 'Click to compare with Champion' : 'לחץ להשוואה מול האלוף/ה'}
                  >
                    <div className="absolute -top-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 text-[11px] font-black shadow-md flex items-center gap-1">
                      <Crown className="w-3 h-3 fill-amber-950" /> 1
                    </div>
                    <span className="text-4xl mt-2 mb-1 filter drop-shadow-lg animate-bounce">{top1.avatar}</span>
                    <span className="text-xs font-black text-amber-100 truncate w-full">{top1.name}</span>
                    <div className="mt-1 px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-950 text-xs font-black shadow-sm">
                      {top1.score} {isEn ? 'pts' : "נק'"}
                    </div>
                    <span className="mt-1 text-[9px] text-amber-300 group-hover:text-yellow-200 font-bold flex items-center gap-0.5">
                      <Swords className="w-2.5 h-2.5" /> {isEn ? 'Compare' : 'השווה לאלוף/ה'}
                    </span>
                  </div>
                )}

                {/* 3rd Place (Bronze) */}
                {top3 && (
                  <div
                    onClick={() => handleToggleCompare(top3)}
                    className="relative flex flex-col items-center bg-white/[0.06] hover:bg-white/[0.12] border border-amber-700/40 rounded-2xl p-2.5 text-center shadow-lg transition-all cursor-pointer active:scale-95 group"
                    title={isEn ? 'Click to compare' : 'לחץ להשוואה מול מקום 3'}
                  >
                    <span className="absolute -top-3 px-2 py-0.5 rounded-full bg-amber-700 text-amber-100 text-[10px] font-black shadow flex items-center gap-1">
                      🥉 3
                    </span>
                    <span className="text-3xl mt-2 mb-1 filter drop-shadow">{top3.avatar}</span>
                    <span className="text-xs font-black text-slate-100 truncate w-full">{top3.name}</span>
                    <div className="mt-1 px-2 py-0.5 rounded-lg bg-amber-800/30 text-amber-200 text-xs font-black">
                      {top3.score} {isEn ? 'pts' : "נק'"}
                    </div>
                    <span className="mt-1 text-[9px] text-slate-400 group-hover:text-amber-300 font-bold flex items-center gap-0.5">
                      <Swords className="w-2.5 h-2.5" /> {isEn ? 'Compare' : 'השווה'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Search bar */}
          <div className="relative">
            <Search
              className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 ${
                isEn ? 'left-3' : 'right-3'
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isEn ? 'Search player by name...' : 'חפש שחקן/ית לפי שם להשוואה...'}
              className={`w-full py-2 bg-white/5 border border-white/15 focus:border-amber-400 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all ${
                isEn ? 'pl-9 pr-3' : 'pr-9 pl-3'
              }`}
            />
          </div>

          {/* User's Own Rank Spotlight Card */}
          <div className="relative overflow-hidden bg-gradient-to-r from-pink-900/40 via-purple-900/40 to-pink-900/40 border-2 border-pink-400/50 rounded-2xl p-3.5 shadow-lg shadow-pink-900/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-pink-500/25 border border-pink-300/40 text-2xl shadow-inner">
                  {myEntry ? myEntry.avatar : effectiveAvatar}
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md bg-pink-500 text-white text-[9px] font-black">
                    {isEn ? 'YOU' : 'אתה/את'}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-white">{myEntry ? myEntry.name : effectiveName}</span>
                    {myRank && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-black border border-amber-400/30">
                        {isEn ? `Rank #${myRank}` : `מקום #${myRank}`}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-pink-200/90 font-medium">
                    {myRank
                      ? isEn
                        ? `You are ranked #${myRank} out of ${totalPlayers} players`
                        : `אתה/את במקום #${myRank} מתוך ${totalPlayers} שחקנים`
                      : isEn
                      ? 'Play a round to record your official high score!'
                      : 'שחק/י סיבוב כדי להיכנס לטבלת השיאים הרשמית!'}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-base sm:text-lg font-black text-amber-300 font-mono">
                  {effectiveScore} <span className="text-xs">{isEn ? 'pts' : "נק'"}</span>
                </div>
                {myEntry && myEntry.streak > 0 && (
                  <div className="flex items-center justify-end gap-1 text-[11px] text-pink-300 font-bold">
                    <Flame className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />
                    <span>{myEntry.streak} {isEn ? 'streak' : 'רצף'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Percentile and gap indicator */}
            <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-1 text-[11px]">
              {topPercentile && (
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  {isEn ? `Top ${topPercentile}% of all players` : `בעשירון העליון (טופ ${topPercentile}%)`}
                </span>
              )}

              {pointsToNextRank !== null && pointsToNextRank > 0 && (
                <span className="text-amber-200 font-medium flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-300" />
                  {isEn
                    ? `Only ${pointsToNextRank} more pts to climb to Rank #${myRank! - 1}!`
                    : `רק עוד ${pointsToNextRank} נק' לעלייה למקום #${myRank! - 1}!`}
                </span>
              )}
            </div>
          </div>

          {/* Ranked List Section */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-2 font-bold uppercase">
              <span>{isEn ? 'Rank & Player' : 'דירוג ושחקן/ית'}</span>
              <span>{isEn ? 'Score, Streak & Compare' : 'ניקוד, רצף והשוואה'}</span>
            </div>

            {isLoading && (
              <div className="py-8 text-center text-slate-400 text-xs">
                <RotateCw className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
                <span>{isEn ? 'Loading champions...' : 'טוען את טבלת האלופים...'}</span>
              </div>
            )}

            {!isLoading && filteredList.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-xs italic">
                {isEn ? 'No players found for this period' : 'לא נמצאו שחקנים בתקופה זו'}
              </div>
            )}

            {!isLoading &&
              filteredList.map((player) => {
                const isMe = player.sessionToken === sessionToken || player.id === myEntry?.id;
                const isTop3 = player.rank <= 3;
                const isCurrentlyCompared = comparedPlayer?.id === player.id;

                return (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                      isCurrentlyCompared
                        ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50 shadow-lg'
                        : isMe
                        ? 'bg-pink-500/20 border-pink-400/60 ring-1 ring-pink-400/40 shadow-md'
                        : isTop3
                        ? 'bg-white/[0.07] border-white/15 hover:bg-white/[0.1]'
                        : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08]'
                    }`}
                  >
                    {/* Left side: Rank, Avatar, Name */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 flex items-center justify-center font-black text-xs font-mono">
                        {player.rank === 1 && <span className="text-amber-300 text-base">🥇</span>}
                        {player.rank === 2 && <span className="text-slate-300 text-base">🥈</span>}
                        {player.rank === 3 && <span className="text-amber-700 text-base">🥉</span>}
                        {player.rank > 3 && <span className="text-slate-400">#{player.rank}</span>}
                      </div>

                      <div className="text-xl flex-none">{player.avatar}</div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs sm:text-sm font-extrabold truncate ${
                              isMe ? 'text-pink-200' : 'text-white'
                            }`}
                          >
                            {player.name}
                          </span>
                          {isMe && (
                            <span className="px-1.5 py-0.2 rounded bg-pink-500 text-white text-[9px] font-black">
                              {isEn ? 'You' : 'אתה/את'}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {formatTimeAgo(player.timestamp, isEn)} • {player.solvedCards}{' '}
                          {isEn ? 'cards' : 'כרטיסים'}
                        </div>
                      </div>
                    </div>

                    {/* Right side: Score, Streak & Compare Button */}
                    <div className="flex items-center gap-2 text-right flex-none">
                      {player.streak > 1 && (
                        <div className="hidden sm:flex items-center gap-0.5 text-[11px] font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-400/20">
                          <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{player.streak}</span>
                        </div>
                      )}

                      <div className="font-mono font-black text-sm sm:text-base text-amber-300 min-w-[50px] text-right">
                        {player.score} <span className="text-[10px] text-slate-400 font-sans">{isEn ? 'pts' : "נק'"}</span>
                      </div>

                      {/* Head-to-Head Compare Button */}
                      {!isMe && (
                        <button
                          onClick={() => handleToggleCompare(player)}
                          className={`p-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-90 ${
                            isCurrentlyCompared
                              ? 'bg-amber-400 text-black border-amber-300 shadow-md shadow-amber-400/30'
                              : 'bg-white/10 hover:bg-amber-400/20 text-slate-300 hover:text-amber-200 border-white/15'
                          }`}
                          title={isEn ? 'Compare head-to-head' : 'השווה ראש-בראש'}
                        >
                          <Swords className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{isEn ? 'Compare' : 'השווה'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-black/30 flex items-center justify-between text-xs">
          <div className="text-slate-400 text-[11px]">
            <span>👥 {isEn ? 'Ranked Players:' : 'סה"כ מדורגים:'} </span>
            <strong className="text-amber-300 font-mono">{totalPlayers}</strong>
          </div>

          <button
            onClick={() => {
              sounds.soundKeypress();
              onClose();
            }}
            className="py-1.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-xs font-bold text-white transition-all cursor-pointer"
          >
            {isEn ? 'Close' : 'סגור'}
          </button>
        </div>
      </div>
    </div>
  );
};

function formatTimeAgo(timestamp: number, isEn: boolean): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / (60 * 1000));
  if (mins < 1) return isEn ? 'Just now' : 'עכשיו';
  if (mins < 60) return isEn ? `${mins}m ago` : `לפני ${mins} דק'`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return isEn ? `${hours}h ago` : `לפני ${hours} שעות`;
  const days = Math.floor(hours / 24);
  return isEn ? `${days}d ago` : `לפני ${days} ימים`;
}
