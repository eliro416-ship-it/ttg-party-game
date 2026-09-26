# 🃏 הזמן לנחש | Time to Guess

A full-stack, real-time multiplayer card guessing game built with **React 19**, **TypeScript**, **Node.js (Express)**, and **WebSockets (Socket.io)**.

---

## 🚀 Features

- **Multi-Device Live Sync**: Instant real-time synchronization between host and unlimited player phones via WebSockets.
- **Server-Authoritative Security**: The secret word and image are only transmitted to the "Holder" player—guessers' devices never receive secrets, eliminating any client-side cheating.
- **Global Leaderboard System**: Persistent storage with daily (24h), weekly (7d), and all-time rankings, plus head-to-head player comparison.
- **Bilingual (Hebrew & English)**: Complete RTL/LTR support, voice feedback (Carmit 👩 / David 👨), and automatic room language synchronization.
- **Progressive Web App (PWA)**: Installable directly on iOS and Android with offline caching.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti, Motion
- **Backend**: Node.js, Express, Socket.io
- **Build Tool**: Vite, TSX

---

## 📦 How to Run Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run in development mode**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

3. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

---

## 🚢 Deploy to Production

You can deploy this full-stack app directly to any Node.js hosting platform:

### 1. Render / Railway / Fly.io / Heroku
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Environment**: Node.js (PORT is automatically detected)

---

## 📂 Project Structure

```
├── server.ts                 # Express & Socket.io server entry point
├── server/
│   ├── gameServer.ts         # Real-time room management & WebSocket logic
│   ├── leaderboardServer.ts  # Leaderboard storage & REST API
│   └── paymentServer.ts      # Host license & payment verification
├── src/
│   ├── App.tsx               # Main application controller
│   ├── components/           # UI screens & modals
│   ├── data/                 # Game cards & default decks
│   ├── utils/                # Audio synthesizer, WebSockets, translations
│   └── types/                # TypeScript game types
├── public/                   # Icons, sounds, videos, PWA manifest
└── package.json              # Dependencies and scripts
```
