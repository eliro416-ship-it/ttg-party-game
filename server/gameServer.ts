import { Server, Socket } from 'socket.io';
import { Express, Request, Response } from 'express';
import { DEFAULT_CARDS } from '../src/data/cards';
import { CardItem } from '../src/types/game';
import { recordLeaderboardScore } from './leaderboardServer';

interface ServerPlayer {
  id: string;
  socketId: string;
  sessionToken: string;
  name: string;
  avatar: string;
  score: number;
  streak: number;
  isHost: boolean;
  isOnline: boolean;
  lastActive: number;
}

interface RoomState {
  pin: string;
  status: 'LOBBY' | 'IN_PROGRESS' | 'GAME_OVER';
  hostId: string;
  players: ServerPlayer[];
  deck: CardItem[];
  currentCardIndex: number;
  currentHolderIndex: number;
  turnDuration: number;
  turnEndTime: number;
  turnTimer: NodeJS.Timeout | null;
  disconnectTimers: Map<string, NodeJS.Timeout>;
  revealedHint: boolean;
  language: 'he' | 'en';
}

const rooms = new Map<string, RoomState>();

function getOrCreateRoom(pin: string, language: 'he' | 'en' = 'he', turnDuration: number = 15): RoomState {
  let room = rooms.get(pin);
  if (!room) {
    const shuffledDeck = [...DEFAULT_CARDS].sort(() => 0.5 - Math.random());
    room = {
      pin,
      status: 'LOBBY',
      hostId: 'p-host-' + pin,
      players: [],
      deck: shuffledDeck,
      currentCardIndex: 0,
      currentHolderIndex: 0,
      turnDuration: turnDuration || 15,
      turnEndTime: 0,
      turnTimer: null,
      disconnectTimers: new Map(),
      revealedHint: false,
      language: language || 'he',
    };
    rooms.set(pin, room);
  }
  return room;
}

// Pre-initialize default room 7742 so it is immediately active and joinable at all times
getOrCreateRoom('7742', 'he', 15);

export function setupRoomRoutes(app: Express) {
  // Query live room metadata & language
  app.get('/api/room/:pin', (req: Request, res: Response) => {
    const cleanPin = String(req.params.pin || '').trim();
    const room = rooms.get(cleanPin);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    return res.json({
      success: true,
      exists: true,
      room: {
        pin: room.pin,
        status: room.status,
        turnDuration: room.turnDuration,
        language: room.language,
        playerCount: room.players.length,
      },
    });
  });
}

export function setupGameSocketServer(io: Server) {
  io.on('connection', (socket: Socket) => {
    // 1. CREATE_ROOM
    socket.on('CREATE_ROOM', (data: { pin?: string; hostName?: string; avatar?: string; sessionToken: string; turnDuration?: number; language?: 'he' | 'en' }, callback) => {
      const cleanPin = (data.pin && /^\d{4,6}$/.test(String(data.pin).trim()))
        ? String(data.pin).trim()
        : null;
      const pin = cleanPin || Math.floor(1000 + Math.random() * 9000).toString();

      let room = rooms.get(pin);
      if (room) {
        // Room already exists (or pre-initialized / reconnected)
        let hostPlayer = room.players.find((p) => p.isHost || p.sessionToken === data.sessionToken);
        if (hostPlayer) {
          hostPlayer.socketId = socket.id;
          hostPlayer.isOnline = true;
          hostPlayer.lastActive = Date.now();
          if (data.hostName) hostPlayer.name = data.hostName;
          if (data.avatar) hostPlayer.avatar = data.avatar;
        } else {
          hostPlayer = {
            id: 'p-' + Math.random().toString(36).substring(2, 9),
            socketId: socket.id,
            sessionToken: data.sessionToken || ('st-' + Math.random().toString(36).substring(2, 9)),
            name: data.hostName || 'מארח/ת / Host',
            avatar: data.avatar || '👑',
            score: 0,
            streak: 0,
            isHost: true,
            isOnline: true,
            lastActive: Date.now(),
          };
          room.players.unshift(hostPlayer);
        }

        room.hostId = hostPlayer.id;
        if (data.turnDuration) room.turnDuration = data.turnDuration;
        if (data.language) room.language = data.language;

        socket.join(pin);

        callback?.({
          success: true,
          pin,
          player: hostPlayer,
          room: sanitizeRoomForClient(room),
        });

        broadcastLobbyUpdate(io, room);
        return;
      }

      const playerId = 'p-' + Math.random().toString(36).substring(2, 9);
      const hostPlayer: ServerPlayer = {
        id: playerId,
        socketId: socket.id,
        sessionToken: data.sessionToken || ('st-' + Math.random().toString(36).substring(2, 9)),
        name: data.hostName || 'מארח/ת / Host',
        avatar: data.avatar || '👑',
        score: 0,
        streak: 0,
        isHost: true,
        isOnline: true,
        lastActive: Date.now(),
      };

      const shuffledDeck = [...DEFAULT_CARDS].sort(() => 0.5 - Math.random());

      const newRoom: RoomState = {
        pin,
        status: 'LOBBY',
        hostId: playerId,
        players: [hostPlayer],
        deck: shuffledDeck,
        currentCardIndex: 0,
        currentHolderIndex: 0,
        turnDuration: data.turnDuration || 15,
        turnEndTime: 0,
        turnTimer: null,
        disconnectTimers: new Map(),
        revealedHint: false,
        language: data.language || 'he',
      };

      rooms.set(pin, newRoom);
      socket.join(pin);

      callback?.({
        success: true,
        pin,
        player: hostPlayer,
        room: sanitizeRoomForClient(newRoom),
      });

      broadcastLobbyUpdate(io, newRoom);
    });

    // 2. JOIN_ROOM
    socket.on('JOIN_ROOM', (data: { pin: string; name: string; avatar: string; sessionToken: string }, callback) => {
      const cleanPin = String(data.pin || '').trim();
      let room = rooms.get(cleanPin);

      // Auto-recover/create room if valid 4-6 digit numeric pin was provided
      if (!room && /^\d{4,6}$/.test(cleanPin)) {
        room = getOrCreateRoom(cleanPin);
      }

      if (!room) {
        return callback?.({
          success: false,
          error: 'חדר לא נמצא! אנא בדוק את קוד ה-PIN עם המארח/ת (Room not found)'
        });
      }

      // Check if player is reconnecting with existing sessionToken
      let player = room.players.find((p) => p.sessionToken === data.sessionToken);
      if (player) {
        player.socketId = socket.id;
        player.isOnline = true;
        player.lastActive = Date.now();
        if (data.name) player.name = data.name;
        if (data.avatar) player.avatar = data.avatar;

        // Clear any disconnect grace timer
        const discTimer = room.disconnectTimers.get(player.id);
        if (discTimer) {
          clearTimeout(discTimer);
          room.disconnectTimers.delete(player.id);
        }
      } else {
        const playerId = 'p-' + Math.random().toString(36).substring(2, 9);
        player = {
          id: playerId,
          socketId: socket.id,
          sessionToken: data.sessionToken || ('st-' + Math.random().toString(36).substring(2, 9)),
          name: data.name || 'שחקן / Player',
          avatar: data.avatar || '🦁',
          score: 0,
          streak: 0,
          isHost: false,
          isOnline: true,
          lastActive: Date.now(),
        };
        room.players.push(player);
      }

      socket.join(room.pin);

      callback?.({
        success: true,
        pin: room.pin,
        player,
        room: sanitizeRoomForClient(room),
      });

      broadcastLobbyUpdate(io, room);

      // If game is already running, send the current turn state to this reconnecting/joining player
      if (room.status === 'IN_PROGRESS') {
        sendTurnStateToPlayer(io, room, player);
      }
    });

    // 3. START_GAME (Host only)
    socket.on('START_GAME', (data: { pin: string; sessionToken: string; turnDuration?: number; language?: 'he' | 'en' }, callback) => {
      const room = rooms.get(data.pin);
      if (!room) return callback?.({ success: false, error: 'Room not found' });

      const player = room.players.find((p) => p.sessionToken === data.sessionToken);
      if (!player || !player.isHost) {
        return callback?.({ success: false, error: 'Only host can start the game' });
      }

      if (data.turnDuration) {
        room.turnDuration = data.turnDuration;
      }
      if (data.language) {
        room.language = data.language;
      }

      room.status = 'IN_PROGRESS';
      room.currentCardIndex = 0;
      room.currentHolderIndex = 0;

      callback?.({ success: true });
      startNewTurn(io, room);
    });

    // 4. SUBMIT_GUESS (Server-Authoritative Validation)
    socket.on('SUBMIT_GUESS', (data: { pin: string; guess: string; sessionToken: string }, callback) => {
      const room = rooms.get(data.pin);
      if (!room || room.status !== 'IN_PROGRESS') return;

      const player = room.players.find((p) => p.sessionToken === data.sessionToken);
      if (!player || !player.isOnline) return;

      const currentHolder = room.players[room.currentHolderIndex];
      // Holder cannot guess their own card!
      if (currentHolder && currentHolder.id === player.id) {
        return callback?.({ success: false, error: 'Holder cannot guess own card' });
      }

      const card = room.deck[room.currentCardIndex];
      if (!card) return;

      const normalizedGuess = data.guess.trim().toLowerCase();
      const targetHe = (card.word_he || card.word).trim().toLowerCase();
      const targetEn = (card.word_en || '').trim().toLowerCase();

      // Normalize letters (support both Hebrew and English variations)
      const isMatch =
        normalizedGuess === targetHe ||
        (targetEn && normalizedGuess === targetEn) ||
        normalizedGuess.replace(/[םןץףך]/g, (c) => ({ ם: 'מ', ן: 'נ', ץ: 'צ', ף: 'פ', ך: 'כ' }[c] || c)) ===
          targetHe.replace(/[םןץףך]/g, (c) => ({ ם: 'מ', ן: 'נ', ץ: 'צ', ף: 'פ', ך: 'כ' }[c] || c));

      const isBonus = (room.currentCardIndex + 1) % 5 === 0;

      if (isMatch) {
        // Clear turn timer
        if (room.turnTimer) {
          clearTimeout(room.turnTimer);
          room.turnTimer = null;
        }

        const msLeft = Math.max(0, room.turnEndTime - Date.now());
        const secLeft = Math.floor(msLeft / 1000);
        const bonus = Math.max(1, Math.floor(secLeft / 3));
        // Bonus question awards 5 points; standard questions award 10 + speed bonus
        const totalPoints = isBonus ? 5 : (10 + bonus);

        player.score += totalPoints;
        player.streak += 1;

        // Persist/update player score in global leaderboard
        try {
          recordLeaderboardScore({
            sessionToken: player.sessionToken,
            name: player.name,
            avatar: player.avatar,
            score: player.score,
            streak: player.streak,
          });
        } catch (lbErr) {
          console.warn('[Leaderboard] Error recording round score:', lbErr);
        }

        const correctWord = room.language === 'en' ? (card.word_en || card.word) : (card.word_he || card.word);

        callback?.({ success: true, correct: true, isBonus });

        // Broadcast ROUND_WON to all clients
        io.to(room.pin).emit('ROUND_WON', {
          winnerId: player.id,
          winnerName: player.name,
          winnerAvatar: player.avatar,
          word: correctWord,
          image: card.image, // Now reveal image to everyone during winner screen
          points: totalPoints,
          isBonus,
          scores: room.players.map((p) => ({ id: p.id, name: p.name, score: p.score, streak: p.streak })),
        });

        // Delay 3.0s for celebration & voice announcement, then advance to next turn
        setTimeout(() => {
          advanceToNextTurn(io, room);
        }, 3000);
      } else {
        callback?.({ success: true, correct: false });
        // Optionally notify room of incorrect guess attempt
        io.to(room.pin).emit('INCORRECT_GUESS', {
          guesserId: player.id,
          guesserName: player.name,
        });
      }
    });

    // 5. SEND_REACTION (Holder responds Yes / No / Hot / Cold)
    socket.on('SEND_REACTION', (data: { pin: string; reaction: 'yes' | 'no' | 'hot' | 'cold'; sessionToken: string }) => {
      const room = rooms.get(data.pin);
      if (!room || room.status !== 'IN_PROGRESS') return;

      const player = room.players.find((p) => p.sessionToken === data.sessionToken);
      const currentHolder = room.players[room.currentHolderIndex];

      if (!player || !currentHolder || player.id !== currentHolder.id) {
        return; // Only current holder can send reactions
      }

      io.to(room.pin).emit('REACTION_RECEIVED', {
        reaction: data.reaction,
        senderName: player.name,
        timestamp: Date.now(),
      });
    });

    // 6. GIVE_HINT (Holder provides hint to guessers)
    socket.on('GIVE_HINT', (data: { pin: string; sessionToken: string }) => {
      const room = rooms.get(data.pin);
      if (!room || room.status !== 'IN_PROGRESS') return;

      const player = room.players.find((p) => p.sessionToken === data.sessionToken);
      const currentHolder = room.players[room.currentHolderIndex];

      if (!player || !currentHolder || player.id !== currentHolder.id) return;

      const card = room.deck[room.currentCardIndex];
      if (!card) return;

      room.revealedHint = true;
      const hint = room.language === 'en' ? (card.hint_en || card.hint) : card.hint;

      io.to(room.pin).emit('HINT_REVEALED', {
        hint,
      });
    });

    // 7. SKIP_TURN (Holder or Host skips)
    socket.on('SKIP_TURN', (data: { pin: string; sessionToken: string }) => {
      const room = rooms.get(data.pin);
      if (!room || room.status !== 'IN_PROGRESS') return;

      const player = room.players.find((p) => p.sessionToken === data.sessionToken);
      const currentHolder = room.players[room.currentHolderIndex];

      if (!player || (!player.isHost && player.id !== currentHolder?.id)) return;

      if (room.turnTimer) {
        clearTimeout(room.turnTimer);
        room.turnTimer = null;
      }

      const card = room.deck[room.currentCardIndex];
      const correctWord = room.language === 'en' ? (card.word_en || card.word) : (card.word_he || card.word);

      io.to(room.pin).emit('TURN_TIMEOUT', {
        word: correctWord,
        image: card.image,
        reason: 'skipped',
      });

      setTimeout(() => {
        advanceToNextTurn(io, room);
      }, 2000);
    });

    // 8. UPDATE_TIMER_DURATION
    socket.on('UPDATE_TIMER_DURATION', (data: { pin: string; duration: number; sessionToken: string }) => {
      const room = rooms.get(data.pin);
      if (!room) return;
      const player = room.players.find((p) => p.sessionToken === data.sessionToken);
      if (!player || !player.isHost) return;

      room.turnDuration = data.duration;
      io.to(room.pin).emit('TIMER_DURATION_UPDATED', { duration: data.duration });
      broadcastLobbyUpdate(io, room);
    });

    // 8.b UPDATE_ROOM_LANGUAGE (Host updates room language in real-time)
    socket.on('UPDATE_ROOM_LANGUAGE', (data: { pin: string; language: 'he' | 'en'; sessionToken: string }) => {
      const room = rooms.get(String(data.pin || '').trim());
      if (!room) return;
      const player = room.players.find((p) => p.sessionToken === data.sessionToken);
      if (!player || !player.isHost) return;

      if (data.language === 'he' || data.language === 'en') {
        room.language = data.language;
        io.to(room.pin).emit('LANGUAGE_UPDATED', { language: data.language });
        broadcastLobbyUpdate(io, room);
      }
    });

    // 9. DISCONNECT & HEARTBEAT HANDLING
    socket.on('disconnect', () => {
      for (const room of rooms.values()) {
        const player = room.players.find((p) => p.socketId === socket.id);
        if (player) {
          player.isOnline = false;
          player.lastActive = Date.now();

          // Broadcast player status
          io.to(room.pin).emit('PLAYER_DISCONNECTED', {
            playerId: player.id,
            playerName: player.name,
          });

          // Check if the disconnected player was the active HOLDER!
          const currentHolder = room.players[room.currentHolderIndex];
          if (room.status === 'IN_PROGRESS' && currentHolder && currentHolder.id === player.id) {
            // Give 3-second grace period for mobile reconnection
            const timer = setTimeout(() => {
              room.disconnectTimers.delete(player.id);
              if (!player.isOnline && room.status === 'IN_PROGRESS') {
                io.to(room.pin).emit('HOLDER_DROPPED', {
                  playerName: player.name,
                  message: 'מחזיק התמונה התנתק. מעבירים תור לשחקן הבא...',
                });
                advanceToNextTurn(io, room);
              }
            }, 3000);
            room.disconnectTimers.set(player.id, timer);
          }
          break;
        }
      }
    });
  });
}

function startNewTurn(io: Server, room: RoomState) {
  if (room.turnTimer) {
    clearTimeout(room.turnTimer);
    room.turnTimer = null;
  }

  // Check if cards finished or max rounds reached
  if (room.currentCardIndex >= room.deck.length || room.currentCardIndex >= 25) {
    room.status = 'GAME_OVER';

    // Record all players' final scores in global leaderboard
    try {
      for (const p of room.players) {
        if (p.score > 0) {
          recordLeaderboardScore({
            sessionToken: p.sessionToken,
            name: p.name,
            avatar: p.avatar,
            score: p.score,
            streak: p.streak,
          });
        }
      }
    } catch (err) {
      console.warn('[Leaderboard] Error recording game over scores:', err);
    }

    io.to(room.pin).emit('GAME_OVER', {
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        score: p.score,
        streak: p.streak,
      })),
      totalRounds: room.currentCardIndex,
    });
    return;
  }

  const activeHolder = room.players[room.currentHolderIndex];
  if (!activeHolder || !activeHolder.isOnline) {
    // If holder is not online, find next online player
    const onlineIndex = room.players.findIndex((p) => p.isOnline);
    if (onlineIndex !== -1) {
      room.currentHolderIndex = onlineIndex;
    }
  }

  const isBonus = (room.currentCardIndex + 1) % 5 === 0;
  // Bonus question sets timer to 10 seconds!
  const effectiveDuration = isBonus ? 10 : room.turnDuration;
  const durationMs = effectiveDuration * 1000;
  room.turnEndTime = Date.now() + durationMs;
  room.revealedHint = false;

  // Send tailored state to each player:
  // SERVER AUTHORITATIVE RULE: Holder gets full image + word. Guessers get ONLY length & category!
  for (const player of room.players) {
    sendTurnStateToPlayer(io, room, player);
  }

  // Set authoritative server timer
  room.turnTimer = setTimeout(() => {
    handleServerTurnTimeout(io, room);
  }, durationMs);
}

function sendTurnStateToPlayer(io: Server, room: RoomState, player: ServerPlayer) {
  const currentHolder = room.players[room.currentHolderIndex];
  const isHolder = currentHolder ? currentHolder.id === player.id : false;
  const card = room.deck[room.currentCardIndex];
  if (!card) return;

  const targetWord = room.language === 'en' ? (card.word_en || card.word) : (card.word_he || card.word);
  const targetCategory = room.language === 'en' ? (card.category_en || card.category) : card.category;
  const isBonus = (room.currentCardIndex + 1) % 5 === 0;
  const effectiveDuration = isBonus ? 10 : room.turnDuration;

  if (isHolder) {
    // HOLDER PAYLOAD: Full image and word
    io.to(player.socketId).emit('TURN_STARTED', {
      isHolder: true,
      cardIndex: room.currentCardIndex,
      totalCards: Math.min(room.deck.length, 25),
      holderId: currentHolder.id,
      holderName: currentHolder.name,
      holderAvatar: currentHolder.avatar,
      // SECRET DATA: Sent ONLY to Holder!
      image: card.image,
      word: targetWord,
      category: targetCategory,
      hint: room.language === 'en' ? (card.hint_en || card.hint) : card.hint,
      wordLength: targetWord.length,
      turnEndTime: room.turnEndTime,
      turnDuration: effectiveDuration,
      isBonus,
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        score: p.score,
        streak: p.streak,
        isOnline: p.isOnline,
        isHolder: p.id === currentHolder.id,
      })),
    });
  } else {
    // GUESSER PAYLOAD: NO image, NO secret word. Inspection in browser will find zero clues!
    io.to(player.socketId).emit('TURN_STARTED', {
      isHolder: false,
      cardIndex: room.currentCardIndex,
      totalCards: Math.min(room.deck.length, 25),
      holderId: currentHolder.id,
      holderName: currentHolder.name,
      holderAvatar: currentHolder.avatar,
      // ZERO SECRETS:
      image: null,
      word: null,
      category: targetCategory,
      hint: room.revealedHint ? (room.language === 'en' ? (card.hint_en || card.hint) : card.hint) : null,
      wordLength: targetWord.length,
      turnEndTime: room.turnEndTime,
      turnDuration: effectiveDuration,
      isBonus,
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        score: p.score,
        streak: p.streak,
        isOnline: p.isOnline,
        isHolder: p.id === currentHolder.id,
      })),
    });
  }
}

function handleServerTurnTimeout(io: Server, room: RoomState) {
  if (room.status !== 'IN_PROGRESS') return;

  const card = room.deck[room.currentCardIndex];
  const correctWord = card
    ? (room.language === 'en' ? (card.word_en || card.word) : (card.word_he || card.word))
    : '';

  // Reset streak of current active holder
  const currentHolder = room.players[room.currentHolderIndex];
  if (currentHolder) {
    currentHolder.streak = 0;
  }

  // Broadcast timeout & reveal what the word was
  io.to(room.pin).emit('TURN_TIMEOUT', {
    word: correctWord,
    image: card ? card.image : null,
    reason: 'time_up',
  });

  setTimeout(() => {
    advanceToNextTurn(io, room);
  }, 2500);
}

function advanceToNextTurn(io: Server, room: RoomState) {
  room.currentCardIndex += 1;
  room.currentHolderIndex = (room.currentHolderIndex + 1) % room.players.length;
  startNewTurn(io, room);
}

function broadcastLobbyUpdate(io: Server, room: RoomState) {
  io.to(room.pin).emit('ROOM_UPDATED', sanitizeRoomForClient(room));
}

function sanitizeRoomForClient(room: RoomState) {
  return {
    pin: room.pin,
    status: room.status,
    hostId: room.hostId,
    turnDuration: room.turnDuration,
    language: room.language,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      score: p.score,
      streak: p.streak,
      isHost: p.isHost,
      isOnline: p.isOnline,
    })),
  };
}
