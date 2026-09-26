import { Express, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const LEADERBOARD_FILE = path.resolve(DATA_DIR, 'leaderboard.json');

export interface LeaderboardEntry {
  id: string;
  sessionToken: string;
  name: string;
  avatar: string;
  score: number;
  streak: number;
  solvedCards: number;
  timestamp: number;
}

export type LeaderboardPeriod = 'daily' | 'weekly' | 'all-time';

// Pre-seeded champions to provide an immediate competitive atmosphere
const SEED_CHAMPIONS: LeaderboardEntry[] = [
  {
    id: 'seed-1',
    sessionToken: 'seed-token-1',
    name: 'מאיה (Maya)',
    avatar: '🌟',
    score: 245,
    streak: 8,
    solvedCards: 18,
    timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago (Daily, Weekly, All-Time)
  },
  {
    id: 'seed-2',
    sessionToken: 'seed-token-2',
    name: 'נועם (Noam)',
    avatar: '⚡',
    score: 210,
    streak: 6,
    solvedCards: 15,
    timestamp: Date.now() - 5 * 60 * 60 * 1000, // 5 hours ago (Daily, Weekly, All-Time)
  },
  {
    id: 'seed-3',
    sessionToken: 'seed-token-3',
    name: 'שירה (Shira)',
    avatar: '🦄',
    score: 185,
    streak: 5,
    solvedCards: 14,
    timestamp: Date.now() - 14 * 60 * 60 * 1000, // 14 hours ago (Daily, Weekly, All-Time)
  },
  {
    id: 'seed-4',
    sessionToken: 'seed-token-4',
    name: 'דניאל (Daniel)',
    avatar: '👑',
    score: 160,
    streak: 5,
    solvedCards: 12,
    timestamp: Date.now() - 26 * 60 * 60 * 1000, // Yesterday (Weekly, All-Time)
  },
  {
    id: 'seed-5',
    sessionToken: 'seed-token-5',
    name: 'תומר (Tomer)',
    avatar: '🦁',
    score: 145,
    streak: 4,
    solvedCards: 11,
    timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago (Weekly, All-Time)
  },
  {
    id: 'seed-6',
    sessionToken: 'seed-token-6',
    name: 'רוני (Roni)',
    avatar: '🍕',
    score: 130,
    streak: 4,
    solvedCards: 10,
    timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000, // 4 days ago (Weekly, All-Time)
  },
  {
    id: 'seed-7',
    sessionToken: 'seed-token-7',
    name: 'ליאור (Lior)',
    avatar: '🦊',
    score: 115,
    streak: 3,
    solvedCards: 9,
    timestamp: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8 days ago (All-Time)
  },
  {
    id: 'seed-8',
    sessionToken: 'seed-token-8',
    name: 'איתי (Itai)',
    avatar: '🎸',
    score: 100,
    streak: 3,
    solvedCards: 8,
    timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago (All-Time)
  },
  {
    id: 'seed-9',
    sessionToken: 'seed-token-9',
    name: 'גל (Gal)',
    avatar: '🚀',
    score: 90,
    streak: 2,
    solvedCards: 7,
    timestamp: Date.now() - 12 * 24 * 60 * 60 * 1000, // 12 days ago (All-Time)
  },
];

let leaderboardScores: LeaderboardEntry[] = loadLeaderboardFromDisk();

function loadLeaderboardFromDisk(): LeaderboardEntry[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(LEADERBOARD_FILE)) {
      const data = fs.readFileSync(LEADERBOARD_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Leaderboard] Could not load from disk, using seed champions:', err);
  }
  return [...SEED_CHAMPIONS];
}

function saveLeaderboardToDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(leaderboardScores, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Leaderboard] Could not save to disk:', err);
  }
}

/**
 * Record or update a player score in the leaderboard.
 * Consolidates duplicate records for the same sessionToken within the day/all-time
 * to always retain their highest recorded score.
 */
export function recordLeaderboardScore(entry: {
  sessionToken: string;
  name: string;
  avatar: string;
  score: number;
  streak?: number;
  solvedCards?: number;
}): LeaderboardEntry {
  const token = entry.sessionToken || ('st-' + Math.random().toString(36).substring(2, 9));
  const cleanName = (entry.name || 'שחקן').trim();
  const cleanAvatar = entry.avatar || '🦁';
  const cleanScore = Math.max(0, entry.score || 0);
  const cleanStreak = Math.max(0, entry.streak || 0);
  const cleanSolved = Math.max(0, entry.solvedCards || 1);

  // Look for existing entry for this session token or identical name within today
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const existingIndex = leaderboardScores.findIndex(
    (e) => e.sessionToken === token || (e.name === cleanName && e.timestamp > oneDayAgo)
  );

  let resultEntry: LeaderboardEntry;

  if (existingIndex !== -1) {
    const existing = leaderboardScores[existingIndex];
    // Update if score is higher or add points
    existing.score = Math.max(existing.score, cleanScore);
    existing.streak = Math.max(existing.streak, cleanStreak);
    existing.solvedCards = Math.max(existing.solvedCards, cleanSolved);
    existing.name = cleanName;
    existing.avatar = cleanAvatar;
    existing.timestamp = Date.now();
    resultEntry = existing;
  } else {
    resultEntry = {
      id: 'lb-' + Math.random().toString(36).substring(2, 9),
      sessionToken: token,
      name: cleanName,
      avatar: cleanAvatar,
      score: cleanScore,
      streak: cleanStreak,
      solvedCards: cleanSolved,
      timestamp: Date.now(),
    };
    leaderboardScores.push(resultEntry);
  }

  saveLeaderboardToDisk();
  return resultEntry;
}

/**
 * Get sorted leaderboard ranked list for given period, with user's rank info
 */
export function getLeaderboardData(
  period: LeaderboardPeriod = 'all-time',
  sessionToken?: string,
  limit: number = 50
) {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const oneWeekMs = 7 * oneDayMs;

  let filtered = leaderboardScores.filter((item) => {
    if (period === 'daily') {
      return item.timestamp >= now - oneDayMs;
    }
    if (period === 'weekly') {
      return item.timestamp >= now - oneWeekMs;
    }
    return true; // all-time
  });

  // If daily has few entries, ensure top champions are visible with fresh timestamps
  if (period === 'daily' && filtered.length < 3) {
    const topSeed = SEED_CHAMPIONS.slice(0, 4).map((s) => ({
      ...s,
      timestamp: now - (s.score % 10 + 1) * 60 * 60 * 1000,
    }));
    // Merge without duplicates
    for (const seed of topSeed) {
      if (!filtered.some((f) => f.name === seed.name)) {
        filtered.push(seed);
      }
    }
  }

  // Deduplicate by name/sessionToken keeping highest score
  const uniqueMap = new Map<string, LeaderboardEntry>();
  for (const item of filtered) {
    const key = item.sessionToken || item.name;
    const current = uniqueMap.get(key);
    if (!current || item.score > current.score) {
      uniqueMap.set(key, item);
    }
  }

  // Sort descending by score, then streak
  const sorted = Array.from(uniqueMap.values()).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.streak - a.streak;
  });

  // Assign ranks
  const ranked = sorted.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));

  // Find user's own rank
  let myRank: number | null = null;
  let myEntry: (LeaderboardEntry & { rank: number }) | null = null;

  if (sessionToken) {
    const found = ranked.find((e) => e.sessionToken === sessionToken);
    if (found) {
      myRank = found.rank;
      myEntry = found;
    }
  }

  const topPercentile = myRank && ranked.length > 0
    ? Math.max(1, Math.round((myRank / ranked.length) * 100))
    : null;

  return {
    period,
    totalPlayers: ranked.length,
    myRank,
    myEntry,
    topPercentile,
    leaderboard: ranked.slice(0, limit),
  };
}

export function setupLeaderboardRoutes(app: Express) {
  // GET /api/leaderboard?period=daily|weekly|all-time&sessionToken=...&limit=50
  app.get('/api/leaderboard', (req: Request, res: Response) => {
    const period = (req.query.period as LeaderboardPeriod) || 'all-time';
    const sessionToken = (req.query.sessionToken as string) || '';
    const limit = Math.min(100, Math.max(10, Number(req.query.limit) || 50));

    const data = getLeaderboardData(period, sessionToken, limit);
    res.json({
      success: true,
      ...data,
    });
  });

  // POST /api/leaderboard/record
  app.post('/api/leaderboard/record', (req: Request, res: Response) => {
    const { sessionToken, name, avatar, score, streak, solvedCards } = req.body || {};

    if (!score || score <= 0) {
      return res.json({ success: true, message: 'Score must be greater than 0' });
    }

    const recorded = recordLeaderboardScore({
      sessionToken,
      name,
      avatar,
      score,
      streak,
      solvedCards,
    });

    res.json({
      success: true,
      entry: recorded,
    });
  });
}
