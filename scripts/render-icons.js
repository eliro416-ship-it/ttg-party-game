import sharp from 'sharp';
import fs from 'fs';

// 512x512 App Icon SVG with explicit vector shapes and text
const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E1035"/>
      <stop offset="50%" stop-color="#2D124D"/>
      <stop offset="100%" stop-color="#0E0720"/>
    </linearGradient>

    <!-- Outer Border Gradient -->
    <linearGradient id="badgeBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF7675"/>
      <stop offset="50%" stop-color="#6C5CE7"/>
      <stop offset="100%" stop-color="#00CEC9"/>
    </linearGradient>

    <!-- Inner Glow Gradient -->
    <linearGradient id="innerGlow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2A1654" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#110B29" stop-opacity="1"/>
    </linearGradient>

    <!-- Text Gradient for TTG -->
    <linearGradient id="ttgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="50%" stop-color="#FFF0F5"/>
      <stop offset="100%" stop-color="#FD79A8"/>
    </linearGradient>

    <!-- Gold Accent Gradient -->
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFEAA7"/>
      <stop offset="50%" stop-color="#FDCB6E"/>
      <stop offset="100%" stop-color="#E17055"/>
    </linearGradient>

    <!-- Card Background Gradient -->
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6C5CE7"/>
      <stop offset="100%" stop-color="#a29bfe"/>
    </linearGradient>
  </defs>

  <!-- Deep Cosmic Background with rounded corners -->
  <rect width="512" height="512" rx="100" fill="url(#bgGrad)"/>

  <!-- Subtle ambient decorative glow circles in background -->
  <circle cx="90" cy="90" r="140" fill="#FF7675" opacity="0.15"/>
  <circle cx="430" cy="430" r="150" fill="#00CEC9" opacity="0.15"/>

  <!-- Outer Glowing Gradient Border for Badge -->
  <rect x="44" y="44" width="424" height="424" rx="84" fill="none" stroke="url(#badgeBorder)" stroke-width="14"/>

  <!-- Inner Badge Container -->
  <rect x="58" y="58" width="396" height="396" rx="72" fill="url(#innerGlow)"/>

  <!-- Top Center Mini Card & Dice Icons (Decorations) -->
  <g transform="translate(256, 125)">
    <!-- Small Card Left -->
    <rect x="-38" y="-32" width="34" height="46" rx="6" fill="#FD79A8" transform="rotate(-14 -21 -9)" opacity="0.85"/>
    <text x="-21" y="-4" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="20" fill="#FFFFFF" text-anchor="middle" transform="rotate(-14 -21 -9)">?</text>

    <!-- Small Card Right -->
    <rect x="4" y="-32" width="34" height="46" rx="6" fill="#00CEC9" transform="rotate(14 21 -9)" opacity="0.85"/>
    <text x="21" y="-4" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="20" fill="#FFFFFF" text-anchor="middle" transform="rotate(14 21 -9)">★</text>
  </g>

  <!-- Main Big Bold "TTG" Text -->
  <text x="256" y="260" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="124" fill="url(#ttgGrad)" text-anchor="middle" letter-spacing="-3">TTG</text>

  <!-- Golden Divider Line with diamond center -->
  <line x1="120" y1="285" x2="392" y2="285" stroke="url(#goldGrad)" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
  <polygon points="256,278 263,285 256,292 249,285" fill="#FFEAA7"/>

  <!-- Subtitle: TIME TO GUESS -->
  <text x="256" y="328" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="30" fill="url(#goldGrad)" text-anchor="middle" letter-spacing="3.5">TIME TO GUESS</text>

  <!-- Hebrew Subtitle: הזמן לנחש -->
  <text x="256" y="368" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="22" fill="#E2E8F0" text-anchor="middle" opacity="0.9" letter-spacing="1">הזמן לנחש</text>

  <!-- Sparkling Stars Accents -->
  <!-- Top Left Sparkle -->
  <path d="M 120 120 Q 120 135 105 135 Q 120 135 120 150 Q 120 135 135 135 Q 120 135 120 120 Z" fill="#FFEAA7"/>
  <!-- Bottom Right Sparkle -->
  <path d="M 390 380 Q 390 395 375 395 Q 390 395 390 410 Q 390 395 405 395 Q 390 395 390 380 Z" fill="#00CEC9"/>
</svg>
`;

// 1200x630 Rich Social Share Card (for OpenGraph / WhatsApp / Twitter)
const ogCardSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="ogBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#190C30"/>
      <stop offset="50%" stop-color="#2A114A"/>
      <stop offset="100%" stop-color="#0B061A"/>
    </linearGradient>

    <!-- Badge Border Gradient -->
    <linearGradient id="ogBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF7675"/>
      <stop offset="50%" stop-color="#6C5CE7"/>
      <stop offset="100%" stop-color="#00CEC9"/>
    </linearGradient>

    <!-- TTG Text Gradient -->
    <linearGradient id="ogTtg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="60%" stop-color="#FFF0F5"/>
      <stop offset="100%" stop-color="#FD79A8"/>
    </linearGradient>

    <!-- Gold Gradient -->
    <linearGradient id="ogGold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFEAA7"/>
      <stop offset="50%" stop-color="#FDCB6E"/>
      <stop offset="100%" stop-color="#E17055"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#ogBg)"/>

  <!-- Ambient lighting glows -->
  <circle cx="200" cy="180" r="300" fill="#FF7675" opacity="0.18"/>
  <circle cx="1000" cy="450" r="350" fill="#00CEC9" opacity="0.18"/>
  <circle cx="600" cy="315" r="280" fill="#6C5CE7" opacity="0.12"/>

  <!-- LEFT SIDE: Big Branded App Icon Badge -->
  <g transform="translate(140, 115)">
    <!-- Glowing Outer Border -->
    <rect x="0" y="0" width="400" height="400" rx="80" fill="none" stroke="url(#ogBorder)" stroke-width="14"/>
    <!-- Inner Badge -->
    <rect x="14" y="14" width="372" height="372" rx="68" fill="#110B29"/>

    <!-- Mini Cards on Badge -->
    <rect x="150" y="55" width="32" height="44" rx="6" fill="#FD79A8" transform="rotate(-12 166 77)" opacity="0.9"/>
    <text x="166" y="82" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="19" fill="#FFFFFF" text-anchor="middle" transform="rotate(-12 166 77)">?</text>
    <rect x="200" y="55" width="32" height="44" rx="6" fill="#00CEC9" transform="rotate(12 216 77)" opacity="0.9"/>
    <text x="216" y="82" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="19" fill="#FFFFFF" text-anchor="middle" transform="rotate(12 216 77)">★</text>

    <!-- TTG -->
    <text x="200" y="240" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="122" fill="url(#ogTtg)" text-anchor="middle" letter-spacing="-3">TTG</text>

    <!-- Gold Line -->
    <line x1="70" y1="265" x2="330" y2="265" stroke="url(#ogGold)" stroke-width="3" stroke-linecap="round" opacity="0.7"/>

    <!-- TIME TO GUESS -->
    <text x="200" y="306" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="28" fill="url(#ogGold)" text-anchor="middle" letter-spacing="3">TIME TO GUESS</text>

    <!-- Subtitle -->
    <text x="200" y="345" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="20" fill="#E2E8F0" text-anchor="middle" opacity="0.9">הזמן לנחש</text>
  </g>

  <!-- RIGHT SIDE: Game Titles, Call To Action, Room Invite -->
  <g transform="translate(600, 150)">
    <!-- Pill Badge: LIVE MULTIPLAYER -->
    <rect x="0" y="0" width="230" height="38" rx="19" fill="#FD79A8" fill-opacity="0.2" stroke="#FD79A8" stroke-width="2"/>
    <text x="115" y="25" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="15" fill="#FD79A8" text-anchor="middle" letter-spacing="2">🎮 LIVE PARTY GAME</text>

    <!-- Title English -->
    <text x="0" y="90" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="52" fill="#FFFFFF" letter-spacing="-1">Time to Guess</text>

    <!-- Title Hebrew -->
    <text x="0" y="150" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="44" fill="url(#ogGold)">הזמן לנחש! 🎯</text>

    <!-- Description -->
    <text x="0" y="210" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="23" fill="#CBD5E1">משחק ניחוש תמונות חברתי מרובה משתתפים</text>
    <text x="0" y="245" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="21" fill="#94A3B8">הצטרפו עכשיו ישירות לחדר המשחק בשניות!</text>

    <!-- Call to action button box -->
    <rect x="0" y="285" width="280" height="60" rx="20" fill="#25D366"/>
    <text x="140" y="323" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="20" fill="#FFFFFF" text-anchor="middle">הצטרפו עכשיו בחינם 🚀</text>
  </g>

  <!-- Sparkles -->
  <path d="M 100 80 Q 100 100 80 100 Q 100 100 100 120 Q 100 100 120 100 Q 100 100 100 80 Z" fill="#FFEAA7"/>
  <path d="M 1120 520 Q 1120 540 1100 540 Q 1120 540 1120 560 Q 1120 540 1140 540 Q 1120 540 1120 520 Z" fill="#00CEC9"/>
</svg>
`;

async function generateAll() {
  console.log('Rendering high quality icons with sharp...');

  // Save icon.svg
  fs.writeFileSync('public/icon.svg', iconSvg.trim());

  // Render 512x512 PNG
  await sharp(Buffer.from(iconSvg))
    .resize(512, 512)
    .png()
    .toFile('public/pwa-512x512.png');
  console.log('Generated public/pwa-512x512.png');

  // Render 192x192 PNG
  await sharp(Buffer.from(iconSvg))
    .resize(192, 192)
    .png()
    .toFile('public/pwa-192x192.png');
  console.log('Generated public/pwa-192x192.png');

  // Render Maskable 512x512 (with slightly larger padding so it fits circle crop safely)
  await sharp(Buffer.from(iconSvg))
    .resize(430, 430)
    .extend({
      top: 41,
      bottom: 41,
      left: 41,
      right: 41,
      background: '#1E1035'
    })
    .png()
    .toFile('public/pwa-maskable-512x512.png');
  console.log('Generated public/pwa-maskable-512x512.png');

  // Apple touch icon 180x180
  await sharp(Buffer.from(iconSvg))
    .resize(180, 180)
    .png()
    .toFile('public/apple-touch-icon.png');
  console.log('Generated public/apple-touch-icon.png');

  // Favicon 64x64
  await sharp(Buffer.from(iconSvg))
    .resize(64, 64)
    .png()
    .toFile('public/favicon.ico');
  console.log('Generated public/favicon.ico');

  // Render 1200x630 OG Image for WhatsApp, Facebook, Twitter, Telegram
  await sharp(Buffer.from(ogCardSvg))
    .resize(1200, 630)
    .png()
    .toFile('public/og-image.png');
  console.log('Generated public/og-image.png');

  console.log('ALL ICONS AND CARDS GENERATED SUCCESSFULLY!');
}

generateAll().catch(console.error);
