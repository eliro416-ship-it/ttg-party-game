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

// 1. Generate 1200x630 OpenGraph Banner with the App Icon prominently featured
const ogSvg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradients -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F0C20" />
      <stop offset="50%" stop-color="#181335" />
      <stop offset="100%" stop-color="#0A0614" />
    </linearGradient>

    <radialGradient id="cyanGlow" cx="20%" cy="20%" r="50%">
      <stop offset="0%" stop-color="#00CEC9" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#00CEC9" stop-opacity="0" />
    </radialGradient>

    <radialGradient id="pinkGlow" cx="80%" cy="80%" r="50%">
      <stop offset="0%" stop-color="#FD79A8" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#FD79A8" stop-opacity="0" />
    </radialGradient>

    <radialGradient id="purpleGlow" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#6C5CE7" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#6C5CE7" stop-opacity="0" />
    </radialGradient>

    <!-- Icon Badge Border Gradient -->
    <linearGradient id="iconBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF7675" />
      <stop offset="50%" stop-color="#6C5CE7" />
      <stop offset="100%" stop-color="#00CEC9" />
    </linearGradient>

    <!-- TTG Text Gradient -->
    <linearGradient id="ttgTextGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#FD79A8" />
    </linearGradient>

    <!-- Filter for glowing elements -->
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#6C5CE7" flood-opacity="0.6" />
    </filter>
  </defs>

  <!-- Background base -->
  <rect width="1200" height="630" fill="url(#bgGrad)" />
  <rect width="1200" height="630" fill="url(#cyanGlow)" />
  <rect width="1200" height="630" fill="url(#pinkGlow)" />
  <rect width="1200" height="630" fill="url(#purpleGlow)" />

  <!-- Floating Question Marks in Background -->
  <g font-family="system-ui, -apple-system, sans-serif" font-weight="900" opacity="0.4">
    <!-- Top Left -->
    <text x="120" y="160" font-size="82" fill="#00F0FF" filter="url(#glow)" transform="rotate(-15 120 160)">?</text>
    <text x="240" y="240" font-size="54" fill="#FFD200" filter="url(#glow)" transform="rotate(12 240 240)">?</text>
    <!-- Top Right -->
    <text x="1020" y="150" font-size="94" fill="#FD79A8" filter="url(#glow)" transform="rotate(18 1020 150)">?</text>
    <text x="920" y="260" font-size="60" fill="#00FF85" filter="url(#glow)" transform="rotate(-12 920 260)">?</text>
    <!-- Bottom Left -->
    <text x="160" y="520" font-size="90" fill="#A855F7" filter="url(#glow)" transform="rotate(14 160 520)">?</text>
    <text x="280" y="440" font-size="58" fill="#FF5722" filter="url(#glow)" transform="rotate(-10 280 440)">?</text>
    <!-- Bottom Right -->
    <text x="1040" y="510" font-size="86" fill="#38BDF8" filter="url(#glow)" transform="rotate(-16 1040 510)">?</text>
    <text x="890" y="460" font-size="64" fill="#FFE600" filter="url(#glow)" transform="rotate(15 890 460)">?</text>
  </g>

  <!-- Central Prominent App Icon Badge -->
  <g transform="translate(600, 230)" filter="url(#badgeShadow)">
    <!-- Outer Gradient Border -->
    <rect x="-110" y="-110" width="220" height="220" rx="60" fill="url(#iconBorderGrad)" />
    <!-- Inner Dark Badge -->
    <rect x="-98" y="-98" width="196" height="196" rx="50" fill="#110B29" />
    
    <!-- TTG Logo Text -->
    <text x="0" y="16" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="76" letter-spacing="-3" fill="url(#ttgTextGrad)" text-anchor="middle">TTG</text>
    <!-- Subtitle below TTG -->
    <text x="0" y="54" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="16" letter-spacing="4" fill="#FDCB6E" text-anchor="middle">TIME TO GUESS</text>
  </g>

  <!-- Titles Below App Icon -->
  <!-- Hebrew Title -->
  <text x="600" y="420" font-family="system-ui, -apple-system, 'Rubik', sans-serif" font-weight="900" font-size="56" fill="#FFFFFF" text-anchor="middle" letter-spacing="-1">
    הזמן לנחש
  </text>

  <!-- Subtitle Tagline in Hebrew & English -->
  <text x="600" y="475" font-family="system-ui, -apple-system, 'Rubik', sans-serif" font-weight="700" font-size="26" fill="#FD79A8" text-anchor="middle">
    משחק ניחוש קלפי תמונות אינטראקטיבי בזמן אמת!
  </text>

  <!-- Feature Chips / Pills -->
  <g transform="translate(600, 545)" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="20" text-anchor="middle" fill="#E2E8F0">
    <rect x="-290" y="-22" width="580" height="44" rx="22" fill="#FFFFFF" fill-opacity="0.08" stroke="#FFFFFF" stroke-opacity="0.15" />
    <text x="0" y="7">👑 חדר מארח/ת • 👥 הצטרפות משתתפים/ות • ⏱️ שעון עצר מסונכרן</text>
  </g>
</svg>
`;

// 2. Generate Square App Icon SVG (512x512)
const iconSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgG" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F0C20" />
      <stop offset="100%" stop-color="#1A1238" />
    </linearGradient>
    <linearGradient id="iconBrd" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF7675" />
      <stop offset="50%" stop-color="#6C5CE7" />
      <stop offset="100%" stop-color="#00CEC9" />
    </linearGradient>
    <linearGradient id="txtG" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#FD79A8" />
    </linearGradient>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#6C5CE7" flood-opacity="0.5" />
    </filter>
  </defs>

  <rect width="512" height="512" rx="115" fill="url(#bgG)" />
  
  <g transform="translate(256, 256)" filter="url(#sh)">
    <!-- Outer border -->
    <rect x="-190" y="-190" width="380" height="380" rx="100" fill="url(#iconBrd)" />
    <!-- Inner fill -->
    <rect x="-170" y="-170" width="340" height="340" rx="84" fill="#110B29" />
    
    <!-- TTG letters -->
    <text x="0" y="30" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="130" letter-spacing="-5" fill="url(#txtG)" text-anchor="middle">TTG</text>
    <text x="0" y="95" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="26" letter-spacing="6" fill="#FDCB6E" text-anchor="middle">TIME TO GUESS</text>
  </g>
</svg>
`;

async function run() {
  console.log('Generating images with sharp...');
  
  // Save icon.svg
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), iconSvg.trim());
  console.log('Wrote public/icon.svg');

  // Generate public/og-image.png (1200x630)
  await sharp(Buffer.from(ogSvg))
    .png({ quality: 95, compressionLevel: 8 })
    .toFile(path.join(publicDir, 'og-image.png'));
  console.log('Wrote public/og-image.png (1200x630)');

  // Generate apple-touch-icon.png (180x180)
  await sharp(Buffer.from(iconSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Wrote public/apple-touch-icon.png (180x180)');

  // Generate favicon.png (64x64) and favicon.ico
  await sharp(Buffer.from(iconSvg))
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));

  await sharp(Buffer.from(iconSvg))
    .resize(64, 64)
    .toFormat('png')
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('Wrote public/favicon.png and public/favicon.ico');

  console.log('All image assets generated successfully!');
}

run().catch((err) => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
