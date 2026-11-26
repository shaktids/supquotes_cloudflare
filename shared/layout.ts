// Template layout format, stored in templates.layout_json.
// Shared by the browser canvas renderer (src/lib/render.ts) and the OG worker (workers/edge).
// All positions/sizes are fractions of the canvas WIDTH so one layout fits square, story and OG sizes.

export type Background =
  | { type: "solid"; color: string }
  | { type: "gradient"; colors: string[]; angle?: number };

export interface TextStyle {
  font: string; // Google Font family name, e.g. "Playfair Display"
  weight?: number;
  italic?: boolean;
  color: string;
  size: number; // fraction of width (0.06 = 6% of width)
  shadow?: string; // CSS colour for a soft text shadow
}

export interface Layout {
  bg: Background;
  overlay?: string; // colour drawn over a bg image, e.g. "rgba(0,0,0,0.35)"
  align?: "left" | "center";
  padding?: number; // fraction of width
  quoteMark?: string | null; // colour of the big decorative quote mark, null = none
  text: TextStyle & { lineHeight?: number };
  author?: TextStyle;
  brandColor?: string;
}

export const FORMATS = {
  square: { w: 1080, h: 1080, label: "Post" },
  story: { w: 1080, h: 1920, label: "Status / Story" },
  og: { w: 1200, h: 630, label: "Link preview" },
} as const;
export type FormatKey = keyof typeof FORMATS;

export const DEFAULT_LAYOUT: Layout = {
  bg: { type: "gradient", colors: ["#1f1c2c", "#928dab"], angle: 135 },
  align: "center",
  padding: 0.09,
  quoteMark: "rgba(255,255,255,0.18)",
  text: { font: "Playfair Display", weight: 700, color: "#ffffff", size: 0.062, lineHeight: 1.3 },
  author: { font: "Poppins", weight: 500, color: "rgba(255,255,255,0.85)", size: 0.032 },
  brandColor: "rgba(255,255,255,0.7)",
};

export function parseLayout(json: string | null | undefined): Layout {
  if (!json) return DEFAULT_LAYOUT;
  try {
    const l = JSON.parse(json) as Partial<Layout>;
    return {
      ...DEFAULT_LAYOUT,
      ...l,
      text: { ...DEFAULT_LAYOUT.text, ...(l.text ?? {}) },
      author: { ...DEFAULT_LAYOUT.author!, ...(l.author ?? {}) },
    };
  } catch {
    return DEFAULT_LAYOUT;
  }
}

export function cssBackground(bg: Background): string {
  if (bg.type === "solid") return bg.color;
  return `linear-gradient(${bg.angle ?? 135}deg, ${bg.colors.join(", ")})`;
}

/** Fill the {name} placeholder in a wish. */
export function fillName(text: string, name: string | null | undefined): string {
  const n = (name ?? "").trim().slice(0, 40);
  return text.replace(/\{name\}/g, n || "you").replace(/\s+,/g, ",");
}

/** Fonts every layout may use; loaded by the site and the OG worker. */
export const FONT_FAMILIES = ["Playfair Display", "Poppins", "Dancing Script", "Lora", "Montserrat"];
