import { Helios, spring, interpolate } from '@helios-project/core';

// ─── Config ────────────────────────────────────────────────────────────────
const WIDTH   = 1920;
const HEIGHT  = 1080;
const FPS     = 30;
const DURATION = 10; // seconds
const TOTAL_FRAMES = FPS * DURATION; // 300

// ─── Canvas ─────────────────────────────────────────────────────────────────
const canvas = document.getElementById('canvas');
canvas.width  = WIDTH;
canvas.height = HEIGHT;
const ctx = canvas.getContext('2d');

// ─── Helios ─────────────────────────────────────────────────────────────────
const helios = new Helios({
  duration: DURATION,
  fps: FPS,
  width: WIDTH,
  height: HEIGHT,
  inputProps: {
    productName: 'AuraPhone Pro',
    price: 299,
    tagline: 'Reimagined. Refined. Ready.',
    accentColor: '#7c6ff7',
  },
});

helios.bindToDocumentTimeline();
window.helios = helios;

// ─── Particle System ─────────────────────────────────────────────────────────
const PARTICLE_COUNT = 120;

// Seed a deterministic set of particles so every frame is reproducible.
const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const seed = (i * 2654435761) >>> 0; // Knuth multiplicative hash
  const rand = (n) => ((seed ^ (seed >> n)) % 1000) / 1000;
  return {
    x:      rand(3)  * WIDTH,
    y:      rand(7)  * HEIGHT,
    radius: 1 + rand(11) * 3,
    speed:  0.3 + rand(13) * 0.8,         // px per frame upward drift
    hue:    200 + rand(17) * 100,          // blue–purple range
    alpha:  0.15 + rand(19) * 0.45,
    drift:  (rand(23) - 0.5) * 0.4,       // slight horizontal drift
  };
});

function drawParticles(frame) {
  particles.forEach((p) => {
    // Deterministic position: wrap vertically
    const elapsed = frame;
    const y = ((p.y - p.speed * elapsed) % HEIGHT + HEIGHT) % HEIGHT;
    const x = p.x + p.drift * elapsed;

    const grd = ctx.createRadialGradient(x, y, 0, x, y, p.radius * 2.5);
    grd.addColorStop(0, `hsla(${p.hue},80%,70%,${p.alpha})`);
    grd.addColorStop(1, `hsla(${p.hue},80%,70%,0)`);

    ctx.beginPath();
    ctx.arc(x, y, p.radius * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();
  });
}

// ─── Background ───────────────────────────────────────────────────────────────
function drawBackground(frame) {
  // Deep dark base
  ctx.fillStyle = '#08080f';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Ambient glow that slowly pulses
  const pulse = 0.5 + 0.5 * Math.sin((frame / FPS) * Math.PI * 0.4);
  const glowAlpha = 0.12 + pulse * 0.06;

  const grd = ctx.createRadialGradient(WIDTH * 0.62, HEIGHT * 0.5, 0, WIDTH * 0.62, HEIGHT * 0.5, 700);
  grd.addColorStop(0, `rgba(124,111,247,${glowAlpha})`);
  grd.addColorStop(1, 'rgba(124,111,247,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawParticles(frame);
}

// ─── Product (phone silhouette) ──────────────────────────────────────────────
function drawProduct(ctx, cx, cy, opacity) {
  ctx.save();
  ctx.globalAlpha = opacity;

  const pw = 260; // phone width
  const ph = 520; // phone height
  const pr = 36;  // corner radius

  // Drop shadow
  ctx.shadowColor = 'rgba(124,111,247,0.5)';
  ctx.shadowBlur  = 60;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 20;

  // Phone body
  const bodyGrad = ctx.createLinearGradient(cx - pw / 2, cy - ph / 2, cx + pw / 2, cy + ph / 2);
  bodyGrad.addColorStop(0, '#1e1b3a');
  bodyGrad.addColorStop(1, '#0d0c1e');
  roundRect(ctx, cx - pw / 2, cy - ph / 2, pw, ph, pr);
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // Rim highlight
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, cx - pw / 2, cy - ph / 2, pw, ph, pr);
  ctx.stroke();

  // Screen
  const screenPad = 14;
  const screenGrad = ctx.createLinearGradient(cx - pw / 2 + screenPad, cy - ph / 2 + 60, cx + pw / 2 - screenPad, cy + ph / 2 - screenPad);
  screenGrad.addColorStop(0, '#1a103a');
  screenGrad.addColorStop(0.5, '#120c2e');
  screenGrad.addColorStop(1, '#0a0718');
  roundRect(ctx, cx - pw / 2 + screenPad, cy - ph / 2 + 60, pw - screenPad * 2, ph - 80, 22);
  ctx.fillStyle = screenGrad;
  ctx.fill();

  // Camera notch
  ctx.fillStyle = '#0a0718';
  ctx.beginPath();
  ctx.arc(cx, cy - ph / 2 + 30, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1240';
  ctx.beginPath();
  ctx.arc(cx, cy - ph / 2 + 30, 7, 0, Math.PI * 2);
  ctx.fill();
  // Camera lens glint
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.arc(cx - 2, cy - ph / 2 + 27, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Screen content — abstract glowing UI lines
  const linesY = cy - ph / 2 + 105;
  const linesX = cx - pw / 2 + screenPad + 18;
  const linesW = pw - screenPad * 2 - 36;

  // Top bar (status bar simulation)
  ctx.fillStyle = 'rgba(124,111,247,0.15)';
  ctx.fillRect(linesX, linesY, linesW, 3);

  for (let i = 0; i < 5; i++) {
    const y = linesY + 28 + i * 52;
    const barW = (i === 2 ? 0.6 : i === 4 ? 0.4 : 0.85) * linesW;
    const alpha = 0.07 + (5 - i) * 0.04;
    ctx.fillStyle = `rgba(180,170,255,${alpha})`;
    ctx.beginPath();
    ctx.roundRect(linesX, y, barW, 10, 5);
    ctx.fill();
  }

  // Accent card
  const cardGrad = ctx.createLinearGradient(linesX, linesY + 155, linesX + linesW, linesY + 215);
  cardGrad.addColorStop(0, 'rgba(124,111,247,0.3)');
  cardGrad.addColorStop(1, 'rgba(80,60,200,0.2)');
  ctx.fillStyle = cardGrad;
  ctx.beginPath();
  ctx.roundRect(linesX, linesY + 155, linesW, 58, 10);
  ctx.fill();

  // Home indicator
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.roundRect(cx - 50, cy + ph / 2 - 38, 100, 4, 2);
  ctx.fill();

  ctx.restore();
}

// ─── Price Counter ────────────────────────────────────────────────────────────
function drawPrice(ctx, cx, cy, displayValue, opacity, accentColor) {
  ctx.save();
  ctx.globalAlpha = opacity;

  const priceStr = `$${Math.round(displayValue)}`;

  // Glow
  ctx.shadowColor = accentColor;
  ctx.shadowBlur  = 40;
  ctx.font = 'bold 128px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(priceStr, cx, cy);

  ctx.shadowBlur = 0;
  ctx.restore();
}

// ─── Text Labels ──────────────────────────────────────────────────────────────
function drawLabels(ctx, cx, cy, props, opacity) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.textAlign = 'center';

  // Product name
  ctx.font = 'bold 56px system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(124,111,247,0.6)';
  ctx.shadowBlur  = 20;
  ctx.fillText(props.productName, cx, cy - 50);

  // Tagline
  ctx.font = '28px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(180,170,255,0.75)';
  ctx.shadowBlur = 0;
  ctx.fillText(props.tagline, cx, cy + 10);

  ctx.restore();
}

// ─── CTA Badge ────────────────────────────────────────────────────────────────
function drawBadge(ctx, cx, cy, opacity) {
  ctx.save();
  ctx.globalAlpha = opacity;

  const bw = 220, bh = 54, br = 27;
  const bx = cx - bw / 2, by = cy - bh / 2;

  // Badge fill
  const grd = ctx.createLinearGradient(bx, by, bx + bw, by);
  grd.addColorStop(0, '#7c6ff7');
  grd.addColorStop(1, '#5b4de0');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, br);
  ctx.fill();

  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Buy Now →', cx, cy);

  ctx.restore();
}

// ─── Utility: roundRect polyfill ─────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Divider ─────────────────────────────────────────────────────────────────
function drawDivider(ctx, cx, cy, opacity) {
  ctx.save();
  ctx.globalAlpha = opacity * 0.35;
  const grd = ctx.createLinearGradient(cx - 200, cy, cx + 200, cy);
  grd.addColorStop(0,   'transparent');
  grd.addColorStop(0.5, 'rgba(124,111,247,0.8)');
  grd.addColorStop(1,   'transparent');
  ctx.strokeStyle = grd;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 200, cy);
  ctx.lineTo(cx + 200, cy);
  ctx.stroke();
  ctx.restore();
}

// ─── Main Render ──────────────────────────────────────────────────────────────
function render(frame, props) {
  const t = frame / FPS;

  // Layout centers
  const productCX = WIDTH * 0.28;
  const productCY = HEIGHT * 0.50;
  const infoCX    = WIDTH * 0.65;

  // ── 1. Product slide-in from left (0–2s = frames 0–60)
  const productSlideFrames = 60;
  const productX = interpolate(
    frame,
    [0, productSlideFrames],
    [productCX - 500, productCX],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const productOpacity = interpolate(
    frame,
    [0, productSlideFrames],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // ── 2. Info panel fade-in (0.8s delay = frames 24–72)
  const infoOpacity = interpolate(
    frame,
    [24, 72],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // ── 3. Price spring animation (starts at 1.5s = frame 45)
  const priceFrame = Math.max(0, frame - 45);
  const priceValue = spring({
    frame: priceFrame,
    fps: FPS,
    from: 0,
    to: props.price,
    config: { stiffness: 60, damping: 12, mass: 1 },
  });

  const priceOpacity = interpolate(
    frame,
    [45, 75],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // ── 4. CTA badge slides up (starts at 4s = frame 120)
  const badgeOpacity = interpolate(
    frame,
    [120, 150],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const badgeY = interpolate(
    frame,
    [120, 150],
    [HEIGHT * 0.78 + 30, HEIGHT * 0.78],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // ── Draw
  drawBackground(frame);
  drawProduct(ctx, productX, productCY, productOpacity);
  drawLabels(ctx, infoCX, HEIGHT * 0.40, props, infoOpacity);
  drawDivider(ctx, infoCX, HEIGHT * 0.535, infoOpacity);
  drawPrice(ctx, infoCX, HEIGHT * 0.60, priceValue, priceOpacity, props.accentColor);
  drawBadge(ctx, infoCX, badgeY, badgeOpacity);
}

// ─── Subscribe ───────────────────────────────────────────────────────────────
helios.subscribe((state) => {
  render(state.currentFrame, state.inputProps);
});

// Initial draw at frame 0
render(0, helios.getState().inputProps);
