// Same glyph as the brand mark in Header.tsx, redrawn on a canvas so the
// favicon can be regenerated at runtime with an unread badge — no static
// icon asset exists in this project to swap between.
const MAIL_ICON_PATH =
  'M3 4.5A1.5 1.5 0 0 1 4.5 3h15A1.5 1.5 0 0 1 21 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5v-15ZM5 6v12h14V6L12 11.5 5 6Zm1.8 1.5 5.2 4.083L17.2 7.5H6.8Z';

const SIZE = 64;

function drawBaseIcon(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, SIZE, SIZE);

  const radius = 14;
  ctx.fillStyle = '#0f172a'; // slate-900, matches the header brand square
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.arcTo(SIZE, 0, SIZE, SIZE, radius);
  ctx.arcTo(SIZE, SIZE, 0, SIZE, radius);
  ctx.arcTo(0, SIZE, 0, 0, radius);
  ctx.arcTo(0, 0, SIZE, 0, radius);
  ctx.closePath();
  ctx.fill();

  const scale = (SIZE * 0.62) / 24;
  const offset = (SIZE - 24 * scale) / 2;
  ctx.save();
  ctx.translate(offset, offset);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#ffffff';
  ctx.fill(new Path2D(MAIL_ICON_PATH));
  ctx.restore();
}

let sharedCanvas: HTMLCanvasElement | null = null;

/** Regenerates the favicon, drawing a red unread dot in the top-right corner when `hasUnread` is true. */
export function applyFavicon(hasUnread: boolean): void {
  if (typeof document === 'undefined') return;

  if (!sharedCanvas) {
    sharedCanvas = document.createElement('canvas');
    sharedCanvas.width = SIZE;
    sharedCanvas.height = SIZE;
  }
  const ctx = sharedCanvas.getContext('2d');
  if (!ctx) return;

  drawBaseIcon(ctx);

  if (hasUnread) {
    // White ring so the dot reads clearly against the dark icon background at favicon size.
    ctx.beginPath();
    ctx.arc(SIZE - 11, 11, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(SIZE - 11, 11, 7.5, 0, Math.PI * 2);
    ctx.fillStyle = '#e11d48'; // rose-600
    ctx.fill();
  }

  const dataUrl = sharedCanvas.toDataURL('image/png');

  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.type = 'image/png';
  link.href = dataUrl;
}
