// Browser-side card renderer. Cards are drawn on <canvas> and never uploaded or stored.
import { FORMATS, type FormatKey, type Layout } from "../../shared/layout";

export interface CardInput {
  layout: Layout;
  bgUrl?: string | null;
  text: string;
  author?: string | null;
  format: FormatKey;
  brand?: string;
}

const imageCache = new Map<string, Promise<HTMLImageElement | null>>();

function loadImage(url: string): Promise<HTMLImageElement | null> {
  if (!imageCache.has(url)) {
    imageCache.set(
      url,
      new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous"; // gateway must send Access-Control-Allow-Origin, else canvas export fails
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
      }),
    );
  }
  return imageCache.get(url)!;
}

async function ensureFonts(layout: Layout) {
  const specs = [layout.text, layout.author].filter(Boolean).map((t) => `${t!.italic ? "italic " : ""}${t!.weight ?? 400} 40px "${t!.font}"`);
  specs.push(`600 40px "Poppins"`);
  await Promise.all(specs.map((s) => document.fonts.load(s).catch(() => null)));
}

function fontStr(t: { font: string; weight?: number; italic?: boolean }, px: number) {
  return `${t.italic ? "italic " : ""}${t.weight ?? 400} ${px}px "${t.font}", Georgia, serif`;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const lines: string[] = [];
  for (const para of text.split(/\n/)) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    lines.push(line);
  }
  return lines;
}

function paintBackground(ctx: CanvasRenderingContext2D, layout: Layout, W: number, H: number) {
  const bg = layout.bg;
  if (bg.type === "solid") {
    ctx.fillStyle = bg.color;
  } else {
    // CSS-like angle: 0deg = to top, 90deg = to right.
    const a = (((bg.angle ?? 135) - 90) * Math.PI) / 180;
    const len = Math.abs(W * Math.cos(a)) + Math.abs(H * Math.sin(a));
    const cx = W / 2, cy = H / 2, dx = (Math.cos(a) * len) / 2, dy = (Math.sin(a) * len) / 2;
    const g = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
    bg.colors.forEach((c, i) => g.addColorStop(bg.colors.length === 1 ? 0 : i / (bg.colors.length - 1), c));
    ctx.fillStyle = g;
  }
  ctx.fillRect(0, 0, W, H);
}

export async function drawCard(canvas: HTMLCanvasElement, input: CardInput) {
  const { layout } = input;
  const { w: W, h: H } = FORMATS[input.format];
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const [img] = await Promise.all([input.bgUrl ? loadImage(input.bgUrl) : null, ensureFonts(layout)]);

  paintBackground(ctx, layout, W, H);
  if (img) {
    const s = Math.max(W / img.width, H / img.height);
    ctx.drawImage(img, (W - img.width * s) / 2, (H - img.height * s) / 2, img.width * s, img.height * s);
    ctx.fillStyle = layout.overlay ?? "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, W, H);
  }

  const pad = (layout.padding ?? 0.09) * W;
  const maxW = W - pad * 2;
  const align = layout.align ?? "center";
  const x = align === "center" ? W / 2 : pad;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";

  // Auto-shrink the main text until the whole block fits.
  const lh = layout.text.lineHeight ?? 1.3;
  const brandH = W * 0.08;
  const maxBlockH = H - pad * 2 - brandH;
  // Start larger than the template size so short texts fill the card, then shrink to fit.
  let size = layout.text.size * W * 1.4;
  let lines: string[] = [];
  const authorSize = (layout.author?.size ?? 0.032) * W;
  const markSize = layout.quoteMark ? W * 0.16 : 0;
  const blockH = () => markSize * 0.55 + lines.length * size * lh + (input.author ? authorSize * 2.4 : 0);
  for (;;) {
    ctx.font = fontStr(layout.text, size);
    lines = wrap(ctx, input.text, maxW);
    if (blockH() <= maxBlockH || size < W * 0.026) break;
    size *= 0.93;
  }

  let y = (H - brandH - blockH()) / 2 + pad * 0.3;

  if (layout.quoteMark) {
    ctx.font = `700 ${markSize}px "Playfair Display", Georgia, serif`;
    ctx.fillStyle = layout.quoteMark;
    ctx.fillText("“", x, y + markSize * 0.75);
    y += markSize * 0.55;
  }

  ctx.font = fontStr(layout.text, size);
  ctx.fillStyle = layout.text.color;
  if (layout.text.shadow) {
    ctx.shadowColor = layout.text.shadow;
    ctx.shadowBlur = size * 0.25;
    ctx.shadowOffsetY = size * 0.05;
  }
  for (const line of lines) {
    y += size * lh;
    ctx.fillText(line, x, y - size * (lh - 1) * 0.5);
  }
  ctx.shadowColor = "transparent";

  if (input.author && layout.author) {
    y += authorSize * 1.9;
    ctx.font = fontStr(layout.author, authorSize);
    ctx.fillStyle = layout.author.color;
    ctx.fillText(`— ${input.author}`, x, y);
  }

  // Brand footer: small mark + domain.
  const bSize = W * 0.024;
  ctx.font = `600 ${bSize}px "Poppins", sans-serif`;
  ctx.fillStyle = layout.brandColor ?? "rgba(255,255,255,0.7)";
  ctx.textAlign = "center";
  ctx.fillText(input.brand ?? "supquotes.com", W / 2, H - pad * 0.6);
}

export function canvasToFile(canvas: HTMLCanvasElement, name: string): Promise<File> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(new File([b], name, { type: "image/png" })) : reject(new Error("export failed"))), "image/png"),
  );
}
