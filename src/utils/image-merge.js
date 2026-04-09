import sharp from 'sharp';

const IMAGE_SIZE = 256;
const GAP = 16;

// Fetch an image from a URL and return it as a resized sharp buffer
async function fetchImage(url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  return sharp(buf).resize(IMAGE_SIZE, IMAGE_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
}

// Merge two image URLs side by side into a single PNG buffer
// Returns { buffer, filename } or null if no images available
export async function mergeImages(leftUrl, rightUrl) {
  const [leftBuf, rightBuf] = await Promise.all([
    leftUrl ? fetchImage(leftUrl) : null,
    rightUrl ? fetchImage(rightUrl) : null,
  ]);

  // If neither resolved, nothing to show
  if (!leftBuf && !rightBuf) return null;

  // Always use the same canvas width so Discord renders embeds consistently
  const FULL_WIDTH = IMAGE_SIZE * 2 + GAP;

  // If only one image, center it on the full-width canvas
  if (!leftBuf || !rightBuf) {
    const img = leftBuf || rightBuf;
    const buffer = await sharp({
      create: { width: FULL_WIDTH, height: IMAGE_SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite([
        { input: img, left: Math.round((FULL_WIDTH - IMAGE_SIZE) / 2), top: 0 },
      ])
      .png()
      .toBuffer();
    return { buffer, filename: 'reward.png' };
  }

  // Composite side by side with a small gap
  const buffer = await sharp({
    create: { width: FULL_WIDTH, height: IMAGE_SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      { input: leftBuf, left: 0, top: 0 },
      { input: rightBuf, left: IMAGE_SIZE + GAP, top: 0 },
    ])
    .png()
    .toBuffer();

  return { buffer, filename: 'rewards.png' };
}
