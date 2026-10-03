import { Server, Socket } from 'socket.io';
import { ALL_GAME_CARDS, DEFAULT_CARDS, getPlayableCards, getRandomRoundCard, shuffleDeck } from '../src/data/cards';
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
  roundStatus: 'waiting' | 'active' | 'ended';
  hostId: string;
  players: ServerPlayer[];
  deck: CardItem[];
  unlockedPackIds: string[];
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
    socket.on('CREATE_ROOM', (data: { hostName?: string; avatar?: string; sessionToken: string; turnDuration?: number; language?: 'he' | 'en'; unlockedPackIds?: string[] }, callback) => {
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

      const unlockedPacks = Array.isArray(data.unlockedPackIds) && data.unlockedPackIds.length > 0
        ? data.unlockedPackIds
        : ['starter_free'];
      const playableCards = getPlayableCards(unlockedPacks);
      const shuffledDeck = shuffleDeck(playableCards);

      const newRoom: RoomState = {
        pin,
        status: 'LOBBY',
        roundStatus: 'waiting',
        hostId: playerId,
        players: [hostPlayer],
        deck: shuffledDeck,
        unlockedPackIds: unlockedPacks,
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
        roomState: getPlayerRoomState(newRoom, hostPlayer),
      });

      broadcastLobbyUpdate(io, newRoom);
      syncRoomStateToAll(io, newRoom);
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
        roomState: getPlayerRoomState(room, player),
      });

      broadcastLobbyUpdate(io, room);

      // Instant synchronization: send room state and turn state to all players
      syncRoomStateToAll(io, room);
    });

    // 3. START_GAME / START_ROUND
    socket.on('START_ROUND', (data: {
      pin: string;
      sessionToken: string;
      duration?: number;
      endTime?: number;
      roundEndTime?: number;
      cardId?: string;
      category?: string;
      wordLength?: number;
      word?: string;
      imageUrl?: string;
      image?: string;
      fallback?: string;
      hint?: string;
    }, callback) => {
      const room = rooms.get(data.pin);
      if (!room) return callback?.({ success: false, error: 'Room not found' });

      const player = room.players.find((p) => p.sessionToken === data.sessionToken);
      const currentHolder = room.players[room.currentHolderIndex];

      if (!player || (!player.isHost && player.id !== currentHolder?.id)) {
        return callback?.({ success: false, error: 'Only host or card holder can start the round' });
      }

      if (data.duration && data.duration > 0) {
        room.turnDuration = data.duration;
      }

      // Authoritative card sync from Host:
      if (data.cardId) {
        const found = DEFAULT_CARDS.find((c) => c.id === data.cardId);
        const activeCard: CardItem = found ? { ...found } : {
          id: data.cardId,
          word: data.word || '',
          word_he: data.word || '',
          word_en: data.word || '',
          wordEn: data.word || '',
          category: data.category || 'חיות',
          category_en: data.category || 'Animals',
          categoryEn: data.category || 'Animals',
          image: data.imageUrl || data.image || '',
          imageUrl: data.imageUrl || data.image || '',
          fallback: data.fallback || '',
          hint: data.hint || '',
          hint_en: data.hint || '',
          hintEn: data.hint || '',
        };
        if (data.word) {
          activeCard.word = data.word;
          activeCard.word_he = data.word;
        }
        if (data.category) {
          activeCard.category = data.category;
        }
        room.deck[room.currentCardIndex] = activeCard;
      }

      room.status = 'IN_PROGRESS';
      room.roundStatus = 'active';

      const durationMs = room.turnDuration * 1000;
      const now = Date.now();
      const roundEndsAt = now + durationMs;
      room.turnEndTime = roundEndsAt;
      room.revealedHint = false;

      if (room.turnTimer) {
        clearTimeout(room.turnTimer);
        room.turnTimer = null;
      }

      const card = room.deck[room.currentCardIndex] || DEFAULT_CARDS[0];
      const targetWord = (room.language === 'en' ? (card.word_en || card.wordEn || card.word) : (card.word_he || card.word)).trim();
      const targetCategory = room.language === 'en' ? (card.category_en || card.categoryEn || card.category) : card.category;

      callback?.({ success: true, roundEndsAt, serverTime: now });

      // Synchronize Room State and Turn State across all clients
      syncRoomStateToAll(io, room);

      // Broadcast ROUND_STARTED with exact timestamp and card metadata to all players
      io.to(room.pin).emit('ROUND_STARTED', {
        type: 'ROUND_STARTED',
        roundEndsAt,
        serverTime: now,
        turnDuration: room.turnDuration,
        cardIndex: room.currentCardIndex,
        cardId: card.id,
        category: targetCategory,
        wordLength: targetWord.length,
        holderId: currentHolder?.id,
        holderName: currentHolder?.name,
      });

      const serverTimeoutMs = Math.max(100, roundEndsAt - Date.now());
      room.turnTimer = setTimeout(() => {
        handleServerTurnTimeout(io, room);
      }, serverTimeoutMs);
    });

    // SELECT_CARD (Host picks/sets card for the current round)
    socket.on('SELECT_CARD', (data: {
      pin: string;
      sessionToken: string;
      cardId: string;
      category?: string;
      wordLength?: number;
      word?: string;
      image?: string;
      imageUrl?: string;
      fallback?: string;
      hint?: string;
    }, callback) => {
      const room = rooms.get(data.pin);
      if (!room) return callback?.({ success: false, error: 'Room not found' });
      const player = room.players.find((p) => p.sessionToken === data.sessionToken);
      if (!player || !player.isHost) {
        return callback?.({ success: false, error: 'Only host can select card' });
      }

      const found = DEFAULT_CARDS.find((c) => c.id === data.cardId);
      const cardToSet: CardItem = found ? { ...found } : {
        id: data.cardId,
        word: data.word || '',
        word_he: data.word || '',
        word_en: data.word || '',
        wordEn: data.word || '',
        category: data.category || 'חיות',
        category_en: data.category || 'Animals',
        categoryEn: data.category || 'Animals',
        image: data.imageUrl || data.image || '',
        imageUrl: data.imageUrl || data.image || '',
        fallback: data.fallback || '',
        hint: data.hint || '',
        hint_en: '',
        hintEn: '',
      };
      if (data.word) {
        cardToSet.word = data.word;
        cardToSet.word_he = data.word;
      }
      if (data.category) {
        cardToSet.category = data.category;
      }
      room.deck[room.currentCardIndex] = cardToSet;
      callback?.({ success: true });
      syncRoomStateToAll(io, room);
    });

    // START_GAME (Host enters the game room from HostScreen; starts in waiting status so host can click "התחל סיבוב! 🚀")
    socket.on('START_GAME', (data: {
      pin: string;
      sessionToken: string;
      turnDuration?: number;
      language?: 'he' | 'en';
      deck?: CardItem[];
      initialCard?: {
        cardId: string;
        category: string;
        wordLength: number;
        word?: string;
        image?: string;
        imageUrl?: string;
        fallback?: string;
        hint?: string;
      };
    }, callback) => {
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

      if (data.deck && Array.isArray(data.deck) && data.deck.length > 0) {
        room.deck = [...data.deck];
      } else {
        room.deck = shuffleDeck(DEFAULT_CARDS);
      }

      if (data.initialCard?.cardId) {
        const found = DEFAULT_CARDS.find((c) => c.id === data.initialCard!.cardId);
        if (found) {
          room.deck[0] = { ...found };
        } else if (data.initialCard.word) {
          room.deck[0] = {
            id: data.initialCard.cardId,
            word: data.initialCard.word,
            word_he: data.initialCard.word,
            word_en: data.initialCard.word,
            wordEn: data.initialCard.word,
            category: data.initialCard.category || 'חיות',
            category_en: data.initialCard.category || 'Animals',
            categoryEn: data.initialCard.category || 'Animals',
            image: data.initialCard.imageUrl || data.initialCard.image || '',
            imageUrl: data.initialCard.imageUrl || data.initialCard.image || '',
            fallback: data.initialCard.fallback || '',
            hint: data.initialCard.hint || '',
            hint_en: '',
            hintEn: '',
          };
        }
      }

      room.playedCardIds.clear();
      room.status = 'IN_PROGRESS';
      room.roundStatus = 'waiting';
      room.currentCardIndex = 0;
      room.currentHolderIndex = 0;
      room.turnEndTime = 0;
      room.revealedHint = false;

      if (room.turnTimer) {
        clearTimeout(room.turnTimer);
        room.turnTimer = null;
      }

      callback?.({ success: true, roundStatus: 'waiting' });

      syncRoomStateToAll(io, room);
    });

    // 4. SUBMIT_GUESS (Server-Authoritative Validation)
    socket.on('SUBMIT_GUESS', (data: { pin: string; guess: string; sessionToken: string }, callback) => {
      const room = rooms.get(data.pin);
      if (!room || room.status !== 'IN_PROGRESS' || room.roundStatus !== 'active') {
        return callback?.({ success: false, error: 'Round is not active' });
      }

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
        // Stop timer immediately and set round to ended
        room.roundStatus = 'ended';
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

        // Broadcast ROUND_WON to all clients (safely revealing image + word for celebration)
        io.to(room.pin).emit('ROUND_WON', {
          winnerId: player.id,
          winnerName: player.name,
          winnerAvatar: player.avatar,
          word: correctWord,
          image: card.imageUrl || card.image,
          points: totalPoints,
          scores: room.players.map((p) => ({ id: p.id, name: p.name, score: p.score, streak: p.streak })),
        });

        // Sync room state with 'ended' status and updated scores
        syncRoomStateToAll(io, room);

        // Delay 2.5s for celebration, then cyclically advance turn and wait for next start
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
      syncRoomStateToAll(io, room);
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
      syncRoomStateToAll(io, room);
    });

    // 7. SKIP_TURN (Holder or Host skips)
    socket.on('SKIP_TURN', (data: { pin: string; sessionToken: string }) => {
      const room = rooms.get(data.pin);
      if (!room || room.status !== 'IN_PROGRESS') return;

      const player = room.players.find((p) => p.sessionToken === data.sessionToken);
      const currentHolder = room.players[room.currentHolderIndex];

      if (!player || (!player.isHost && player.id !== currentHolder?.id)) return;

      room.roundStatus = 'ended';
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

      syncRoomStateToAll(io, room);

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
      syncRoomStateToAll(io, room);
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
      roundStatus: room.roundStatus || 'waiting',
      roundEndsAt: room.turnEndTime || 0,
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
      roundStatus: room.roundStatus || 'waiting',
      roundEndsAt: room.turnEndTime || 0,
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

  room.roundStatus = 'ended';
  if (room.turnTimer) {
    clearTimeout(room.turnTimer);
    room.turnTimer = null;
  }

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

  syncRoomStateToAll(io, room);

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
  // Cyclical turn rotation (prefer online players):
  let nextHolderIndex = (room.currentHolderIndex + 1) % room.players.length;
  let attempts = 0;
  while (!room.players[nextHolderIndex]?.isOnline && attempts < room.players.length) {
    nextHolderIndex = (nextHolderIndex + 1) % room.players.length;
    attempts++;
  }
  room.currentHolderIndex = nextHolderIndex;
  room.roundStatus = 'waiting';
  room.turnEndTime = 0;
  room.revealedHint = false;
  if (room.turnTimer) {
    clearTimeout(room.turnTimer);
    room.turnTimer = null;
  }

  // Duplicate prevention check:
  // If all cards in current deck were played or deck index reaches end:
  const playablePool = getPlayableCards(room.unlockedPackIds || ['starter_free']);
  if (room.currentCardIndex >= room.deck.length || room.playedCardIds.size >= playablePool.length) {
    const unplayed = playablePool.filter((c) => !room.playedCardIds.has(c.id));
    if (unplayed.length > 0) {
      room.deck = [...room.deck.slice(0, room.currentCardIndex), ...shuffleDeck(unplayed)];
    } else {
      // All cards exhausted, start a fresh cycle with full Fisher-Yates shuffle
      room.playedCardIds.clear();
      room.deck = shuffleDeck(playablePool);
      room.currentCardIndex = 0;
    }
  }

  // Broadcast updated room state and turn state to all players in 'waiting' status (timer paused until START_ROUND)
  syncRoomStateToAll(io, room);
}

export function getPlayerRoomState(room: RoomState, player: ServerPlayer) {
  const currentHolder = room.players[room.currentHolderIndex] || room.players[0];
  const isHolder = currentHolder ? currentHolder.id === player.id : false;
  const card = room.deck[room.currentCardIndex] || room.deck[0] || DEFAULT_CARDS[0];
  const targetWord = room.language === 'en' ? (card.word_en || card.wordEn || card.word) : (card.word_he || card.word);
  const targetCategory = room.language === 'en' ? (card.category_en || card.categoryEn || card.category) : card.category;

  return {
    pin: room.pin,
    status: room.status,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      icon: p.avatar,
      avatar: p.avatar,
      score: p.score,
      streak: p.streak,
      isHost: p.isHost,
      isOnline: p.isOnline,
      isHolder: currentHolder ? p.id === currentHolder.id : false,
    })),
    currentHolderIndex: room.currentHolderIndex,
    roundStatus: room.roundStatus, // 'waiting' | 'active' | 'ended'
    roundEndsAt: room.roundStatus === 'active' ? (room.turnEndTime || null) : null,
    turnDuration: room.turnDuration,
    currentCard: {
      id: card.id,
      category: targetCategory,
      wordLength: targetWord.length,
      // word and imageUrl sent ONLY if player is the holder!
      word: isHolder ? targetWord : null,
      imageUrl: isHolder ? (card.imageUrl || card.image) : null,
      image: isHolder ? (card.imageUrl || card.image) : null,
      fallback: isHolder ? card.fallback : null,
      hint: (isHolder || room.revealedHint) ? (room.language === 'en' ? (card.hint_en || card.hintEn || card.hint) : card.hint) : null,
    },
    isHolder,
    holderId: currentHolder?.id,
    holderName: currentHolder?.name,
    holderAvatar: currentHolder?.avatar,
    cardIndex: room.currentCardIndex,
    totalCards: Math.min(room.deck.length, 50),
    turnEndTime: room.roundStatus === 'active' ? room.turnEndTime : 0,
  };
}

export function syncRoomStateToAll(io: Server, room: RoomState) {
  for (const player of room.players) {
    if (player.socketId) {
      const roomState = getPlayerRoomState(room, player);
      io.to(player.socketId).emit('SYNC_ROOM_STATE', roomState);
      io.to(player.socketId).emit('ROOM_STATE', roomState);
      if (room.status === 'IN_PROGRESS') {
        sendTurnStateToPlayer(io, room, player);
      }
    }
  }
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
