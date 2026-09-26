import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, isMaskable = false) {
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);
  ihdr.writeUInt8(6, 9);
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const scanlineLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * scanlineLength);

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.44;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0;

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const gradT = (x + y) / (width + height);
      let r = Math.round(30 + gradT * 80);
      let g = Math.round(16 + gradT * 20);
      let b = Math.round(53 + gradT * 120);
      let a = 255;

      if (dist < radius * 0.75) {
        r = 17;
        g = 11;
        b = 41;

        if (dy < 0) {
          r += Math.round((1 - Math.abs(dy) / (radius * 0.75)) * 40);
          b += Math.round((1 - Math.abs(dy) / (radius * 0.75)) * 60);
        }
      } else if (dist < radius * 0.85) {
        const rimAngle = Math.atan2(dy, dx);
        const rimT = (rimAngle + Math.PI) / (2 * Math.PI);
        r = Math.round(253 * rimT + 0 * (1 - rimT));
        g = Math.round(121 * rimT + 206 * (1 - rimT));
        b = Math.round(168 * rimT + 201 * (1 - rimT));
      }

      if (!isMaskable) {
        const cornerR = Math.min(width, height) * 0.22;
        const inCornerX = x < cornerR ? cornerR - x : x > width - cornerR ? x - (width - cornerR) : 0;
        const inCornerY = y < cornerR ? cornerR - y : y > height - cornerR ? y - (height - cornerR) : 0;
        if (inCornerX > 0 && inCornerY > 0) {
          const cornerDist = Math.sqrt(inCornerX * inCornerX + inCornerY * inCornerY);
          if (cornerDist > cornerR) {
            a = 0;
          }
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const idatData = zlib.deflateSync(rawData);
  const ihdrChunk = chunk('IHDR', ihdr);
  const idatChunk = chunk('IDAT', idatData);
  const iendChunk = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate files
fs.writeFileSync('public/pwa-192x192.png', createPNG(192, 192, false));
fs.writeFileSync('public/pwa-512x512.png', createPNG(512, 512, false));
fs.writeFileSync('public/pwa-maskable-512x512.png', createPNG(512, 512, true));
fs.writeFileSync('public/apple-touch-icon.png', createPNG(180, 180, false));
fs.writeFileSync('public/favicon.ico', createPNG(64, 64, false));
fs.writeFileSync('public/og-image.png', createPNG(600, 315, false));

console.log('All icons and OG card generated successfully!');
