import { Server, Socket } from 'socket.io';
import { DEFAULT_CARDS, shuffleDeck } from '../src/data/cards';
import { CardItem } from '../src/types/game';

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
  playedCardIds: Set<string>;
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

export function setupGameSocketServer(io: Server) {
  io.on('connection', (socket: Socket) => {
    // 1. CREATE_ROOM
    socket.on('CREATE_ROOM', (data: { hostName?: string; avatar?: string; sessionToken: string; turnDuration?: number; language?: 'he' | 'en' }, callback) => {
      const pin = Math.floor(1000 + Math.random() * 9000).toString();
      const playerId = 'p-' + Math.random().toString(36).substring(2, 9);
      const hostPlayer: ServerPlayer = {
        id: playerId,
        socketId: socket.id,
        sessionToken: data.sessionToken || ('st-' + Math.random().toString(36).substring(2, 9)),
        name: data.hostName || 'מארח / Host',
        avatar: data.avatar || '👑',
        score: 0,
        streak: 0,
        isHost: true,
        isOnline: true,
        lastActive: Date.now(),
      };

      // Fisher-Yates shuffle cards for this room
      const shuffledDeck = shuffleDeck(DEFAULT_CARDS);

      const newRoom: RoomState = {
        pin,
        status: 'LOBBY',
        hostId: playerId,
        players: [hostPlayer],
        deck: shuffledDeck,
        playedCardIds: new Set<string>(),
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
      const room = rooms.get(data.pin);
      if (!room) {
        return callback?.({ success: false, error: 'Room not found. Invalid PIN!' });
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

      // Shuffle entire deck with Fisher-Yates and reset played history
      room.deck = shuffleDeck(DEFAULT_CARDS);
      room.playedCardIds.clear();
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

      const normalize = (str: string) => {
        return (str || '')
          .trim()
          .toLowerCase()
          .replace(/[ם]/g, 'מ')
          .replace(/[ן]/g, 'נ')
          .replace(/[ץ]/g, 'צ')
          .replace(/[ף]/g, 'פ')
          .replace(/[ך]/g, 'כ')
          .replace(/[-_'"\s]/g, '');
      };

      const normalizedGuess = normalize(data.guess);
      const targetHe = normalize(card.word_he || card.word);
      const targetEn = normalize(card.word_en || card.wordEn || '');

      const isMatch =
        normalizedGuess.length > 0 &&
        (normalizedGuess === targetHe || (targetEn.length > 0 && normalizedGuess === targetEn));

      if (isMatch) {
        // Clear turn timer
        if (room.turnTimer) {
          clearTimeout(room.turnTimer);
          room.turnTimer = null;
        }

        const msLeft = Math.max(0, room.turnEndTime - Date.now());
        const secLeft = Math.floor(msLeft / 1000);
        const bonus = Math.max(1, Math.floor(secLeft / 3));
        const totalPoints = 10 + bonus;

        player.score += totalPoints;
        player.streak += 1;

        const correctWord = room.language === 'en' ? (card.word_en || card.wordEn || card.word) : (card.word_he || card.word);

        callback?.({ success: true, correct: true });

        // Broadcast ROUND_WON to all clients (now safely revealing image + word for celebration)
        io.to(room.pin).emit('ROUND_WON', {
          winnerId: player.id,
          winnerName: player.name,
          winnerAvatar: player.avatar,
          word: correctWord,
          image: card.imageUrl || card.image,
          points: totalPoints,
          scores: room.players.map((p) => ({ id: p.id, name: p.name, score: p.score, streak: p.streak })),
        });

        // Delay 2.5s for celebration, then start next turn
        setTimeout(() => {
          advanceToNextTurn(io, room);
        }, 2500);
      } else {
        callback?.({ success: true, correct: false });
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
      const hint = room.language === 'en' ? (card.hint_en || card.hintEn || card.hint) : card.hint;

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
      const correctWord = room.language === 'en' ? (card.word_en || card.wordEn || card.word) : (card.word_he || card.word);

      io.to(room.pin).emit('TURN_TIMEOUT', {
        word: correctWord,
        image: card ? (card.imageUrl || card.image) : null,
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

  // Check if max rounds reached (e.g. 50 rounds)
  if (room.currentCardIndex >= 50) {
    room.status = 'GAME_OVER';
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

  const durationMs = room.turnDuration * 1000;
  room.turnEndTime = Date.now() + durationMs;
  room.revealedHint = false;

  // Send tailored state to each player:
  // SERVER AUTHORITATIVE RULE: Holder gets full image + word. Guessers get ONLY id, category, wordLength!
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

  const targetWord = room.language === 'en' ? (card.word_en || card.wordEn || card.word) : (card.word_he || card.word);
  const targetCategory = room.language === 'en' ? (card.category_en || card.categoryEn || card.category) : card.category;

  if (isHolder) {
    // HOLDER PAYLOAD: Full image and word
    io.to(player.socketId).emit('TURN_STARTED', {
      isHolder: true,
      cardId: card.id,
      cardIndex: room.currentCardIndex,
      totalCards: Math.min(room.deck.length, 50),
      holderId: currentHolder.id,
      holderName: currentHolder.name,
      holderAvatar: currentHolder.avatar,
      // SECRET DATA: Sent ONLY to Holder!
      image: card.imageUrl || card.image,
      imageUrl: card.imageUrl || card.image,
      fallback: card.fallback,
      word: targetWord,
      category: targetCategory,
      hint: room.language === 'en' ? (card.hint_en || card.hintEn || card.hint) : card.hint,
      wordLength: targetWord.length,
      turnEndTime: room.turnEndTime,
      turnDuration: room.turnDuration,
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
      cardId: card.id,
      cardIndex: room.currentCardIndex,
      totalCards: Math.min(room.deck.length, 50),
      holderId: currentHolder.id,
      holderName: currentHolder.name,
      holderAvatar: currentHolder.avatar,
      // ZERO SECRETS (prevents DevTools cheating):
      image: null,
      imageUrl: null,
      fallback: null,
      word: null,
      category: targetCategory,
      hint: room.revealedHint ? (room.language === 'en' ? (card.hint_en || card.hintEn || card.hint) : card.hint) : null,
      wordLength: targetWord.length,
      turnEndTime: room.turnEndTime,
      turnDuration: room.turnDuration,
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
    ? (room.language === 'en' ? (card.word_en || card.wordEn || card.word) : (card.word_he || card.word))
    : '';

  // Reset streak of current active holder
  const currentHolder = room.players[room.currentHolderIndex];
  if (currentHolder) {
    currentHolder.streak = 0;
  }

  // Broadcast timeout & reveal what the word and image were
  io.to(room.pin).emit('TURN_TIMEOUT', {
    word: correctWord,
    image: card ? (card.imageUrl || card.image) : null,
    reason: 'time_up',
  });

  setTimeout(() => {
    advanceToNextTurn(io, room);
  }, 2500);
}

function advanceToNextTurn(io: Server, room: RoomState) {
  const currentCard = room.deck[room.currentCardIndex];
  if (currentCard) {
    room.playedCardIds.add(currentCard.id);
  }

  room.currentCardIndex += 1;
  room.currentHolderIndex = (room.currentHolderIndex + 1) % room.players.length;

  // Duplicate prevention check:
  // If all cards in current deck were played or deck index reaches end:
  if (room.currentCardIndex >= room.deck.length || room.playedCardIds.size >= DEFAULT_CARDS.length) {
    const unplayed = DEFAULT_CARDS.filter((c) => !room.playedCardIds.has(c.id));
    if (unplayed.length > 0) {
      room.deck = [...room.deck.slice(0, room.currentCardIndex), ...shuffleDeck(unplayed)];
    } else {
      // All cards exhausted, start a fresh cycle with full Fisher-Yates shuffle
      room.playedCardIds.clear();
      room.deck = shuffleDeck(DEFAULT_CARDS);
      room.currentCardIndex = 0;
    }
  }

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
