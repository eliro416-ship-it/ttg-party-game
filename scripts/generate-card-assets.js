import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '..', 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Generate 1080x1080 Square App Card (Perfect for WhatsApp image share)
const squareCardSvg = `
<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradients -->
    <radialGradient id="bgGrad" cx="50%" cy="45%" r="70%">
      <stop offset="0%" stop-color="#2D1254" />
      <stop offset="50%" stop-color="#14092A" />
      <stop offset="100%" stop-color="#080414" />
    </radialGradient>

    <!-- Neon Glows -->
    <radialGradient id="topCyanGlow" cx="20%" cy="20%" r="50%">
      <stop offset="0%" stop-color="#00F0FF" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#00F0FF" stop-opacity="0" />
    </radialGradient>

    <radialGradient id="pinkGlow" cx="80%" cy="30%" r="55%">
      <stop offset="0%" stop-color="#FF007A" stop-opacity="0.45" />
      <stop offset="100%" stop-color="#FF007A" stop-opacity="0" />
    </radialGradient>

    <radialGradient id="goldGlow" cx="50%" cy="85%" r="45%">
      <stop offset="0%" stop-color="#FFD700" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#FFD700" stop-opacity="0" />
    </radialGradient>

    <!-- App Icon Gradients -->
    <linearGradient id="iconBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F0FF" />
      <stop offset="35%" stop-color="#A855F7" />
      <stop offset="70%" stop-color="#FF007A" />
      <stop offset="100%" stop-color="#FFD700" />
    </linearGradient>

    <linearGradient id="iconInnerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2B1550" />
      <stop offset="100%" stop-color="#0E0520" />
    </linearGradient>

    <linearGradient id="ttgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="50%" stop-color="#FF76B8" />
      <stop offset="100%" stop-color="#00F0FF" />
    </linearGradient>

    <linearGradient id="goldText" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFF2A3" />
      <stop offset="100%" stop-color="#FFC107" />
    </linearGradient>

    <!-- Card Gradients -->
    <linearGradient id="cardGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B1869" />
      <stop offset="100%" stop-color="#1B0B33" />
    </linearGradient>

    <filter id="badgeShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="24" stdDeviation="30" flood-color="#FF007A" flood-opacity="0.45" />
      <feDropShadow dx="0" dy="8" stdDeviation="15" flood-color="#00F0FF" flood-opacity="0.35" />
    </filter>

    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.6" />
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="1080" height="1080" fill="url(#bgGrad)" />
  <rect width="1080" height="1080" fill="url(#topCyanGlow)" />
  <rect width="1080" height="1080" fill="url(#pinkGlow)" />
  <rect width="1080" height="1080" fill="url(#goldGlow)" />

  <!-- Outer Neon Border Frame -->
  <rect x="30" y="30" width="1020" height="1020" rx="48" fill="none" stroke="url(#iconBorderGrad)" stroke-width="4" stroke-opacity="0.4" />

  <!-- Floating Background Question Marks -->
  <g font-family="system-ui, -apple-system, sans-serif" font-weight="900" opacity="0.3">
    <text x="140" y="200" font-size="110" fill="#00F0FF" filter="url(#softGlow)" transform="rotate(-18 140 200)">?</text>
    <text x="940" y="220" font-size="120" fill="#FF007A" filter="url(#softGlow)" transform="rotate(22 940 220)">?</text>
    <text x="110" y="820" font-size="100" fill="#A855F7" filter="url(#softGlow)" transform="rotate(15 110 820)">?</text>
    <text x="960" y="800" font-size="105" fill="#FFD700" filter="url(#softGlow)" transform="rotate(-15 960 800)">?</text>
  </g>

  <!-- Left Floating Mini Game Card -->
  <g transform="translate(130, 440) rotate(-14)" filter="url(#cardShadow)">
    <rect x="-65" y="-95" width="130" height="190" rx="18" fill="url(#cardGrad1)" stroke="#00F0FF" stroke-width="3" stroke-opacity="0.7" />
    <text x="0" y="-30" font-size="36" text-anchor="middle">🦁</text>
    <text x="0" y="15" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="16" fill="#FFFFFF" text-anchor="middle">אריה</text>
    <text x="0" y="45" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="11" fill="#00F0FF" text-anchor="middle">חיות</text>
    <rect x="-45" y="60" width="90" height="16" rx="8" fill="#00F0FF" fill-opacity="0.2" />
    <text x="0" y="72" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="10" fill="#00F0FF" text-anchor="middle">10 נקודות</text>
  </g>

  <!-- Right Floating Mini Game Card -->
  <g transform="translate(950, 440) rotate(14)" filter="url(#cardShadow)">
    <rect x="-65" y="-95" width="130" height="190" rx="18" fill="url(#cardGrad1)" stroke="#FF007A" stroke-width="3" stroke-opacity="0.7" />
    <text x="0" y="-30" font-size="36" text-anchor="middle">🚀</text>
    <text x="0" y="15" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="16" fill="#FFFFFF" text-anchor="middle">חללית</text>
    <text x="0" y="45" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="11" fill="#FF007A" text-anchor="middle">חלל</text>
    <rect x="-45" y="60" width="90" height="16" rx="8" fill="#FF007A" fill-opacity="0.2" />
    <text x="0" y="72" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="10" fill="#FF007A" text-anchor="middle">15 נקודות</text>
  </g>

  <!-- ============================================== -->
  <!-- CENTRAL PROMINENT APP ICON (3D SQUIRCLE BADGE) -->
  <!-- ============================================== -->
  <g transform="translate(540, 390)" filter="url(#badgeShadow)">
    <!-- Outer Glowing Gradient Border -->
    <rect x="-190" y="-190" width="380" height="380" rx="95" fill="url(#iconBorderGrad)" />
    
    <!-- Inner Dark Glass Body -->
    <rect x="-172" y="-172" width="344" height="344" rx="82" fill="url(#iconInnerGrad)" />

    <!-- Glossy Diagonal Glass Highlight -->
    <path d="M -172,-90 Q 0,-172 172,-172 L 172,-90 Q -20,10 -172,130 Z" fill="#FFFFFF" opacity="0.08" />

    <!-- Crown Icon on top of logo -->
    <text x="0" y="-55" font-size="58" text-anchor="middle" filter="url(#softGlow)">👑</text>

    <!-- TTG Logo Monogram -->
    <text x="0" y="55" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="110" letter-spacing="-4" fill="url(#ttgGrad)" text-anchor="middle" filter="url(#softGlow)">TTG</text>

    <!-- Subtitle Under TTG -->
    <text x="0" y="115" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="20" letter-spacing="5" fill="url(#goldText)" text-anchor="middle">TIME TO GUESS</text>

    <!-- Subtle Sparkles -->
    <circle cx="-120" cy="-110" r="4" fill="#00F0FF" />
    <circle cx="125" cy="-85" r="5" fill="#FF007A" />
    <circle cx="-135" cy="95" r="3.5" fill="#FFD700" />
    <circle cx="120" cy="110" r="4" fill="#00F0FF" />
  </g>

  <!-- ============================================== -->
  <!-- TYPOGRAPHY SECTION BELOW ICON -->
  <!-- ============================================== -->
  
  <!-- Main Hebrew Title -->
  <text x="540" y="690" font-family="system-ui, -apple-system, 'Rubik', sans-serif" font-weight="900" font-size="76" fill="#FFFFFF" text-anchor="middle" letter-spacing="-1" filter="url(#softGlow)">
    הזמן לנחש
  </text>

  <!-- English Subtitle -->
  <text x="540" y="750" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="30" fill="#00F0FF" text-anchor="middle" letter-spacing="3">
    TIME TO GUESS • LIVE GAME
  </text>

  <!-- Descriptive Tagline in Hebrew -->
  <text x="540" y="820" font-family="system-ui, -apple-system, 'Rubik', sans-serif" font-weight="700" font-size="32" fill="#FF76B8" text-anchor="middle">
    משחק ניחוש קלפי תמונות חברתי בזמן אמת! 🃏⏱️
  </text>

  <!-- Call to action badge pill -->
  <g transform="translate(540, 925)">
    <!-- Pill background with gradient stroke -->
    <rect x="-330" y="-36" width="660" height="72" rx="36" fill="#1A0D36" stroke="url(#iconBorderGrad)" stroke-width="3" />
    <text x="0" y="12" font-family="system-ui, -apple-system, 'Rubik', sans-serif" font-weight="900" font-size="26" fill="#FFFFFF" text-anchor="middle">
      🚀 חדר משחק חי • לחצו על הקישור להצטרפות!
    </text>
  </g>
</svg>
`;

async function run() {
  console.log('Generating high-resolution game preview assets...');

  // 1. Generate 1080x1080 Square Card (public/card-preview.png)
  await sharp(Buffer.from(squareCardSvg))
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'card-preview.png'));
  console.log('✅ Generated public/card-preview.png (1080x1080)');

  // 2. Also save as og-image.png (1080x1080 works universally on WhatsApp and OpenGraph)
  await sharp(Buffer.from(squareCardSvg))
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'og-image.png'));
  console.log('✅ Updated public/og-image.png (1080x1080)');

  // 3. Generate square 512x512 app-icon.png
  await sharp(Buffer.from(squareCardSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'app-icon.png'));
  console.log('✅ Generated public/app-icon.png (512x512)');

  console.log('All image assets created successfully!');
}

run().catch((err) => {
  console.error('Asset generation failed:', err);
  process.exit(1);
});
