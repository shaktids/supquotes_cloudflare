// What the admin page may read/write. Only these tables and columns are ever touched,
// so table/column names below are safe to interpolate into SQL.

export type FieldType = "text" | "longtext" | "int" | "bool" | "date" | "json" | "ref";
export interface Field {
  name: string;
  type: FieldType;
  required?: boolean;
  ref?: string; // table for type "ref"
  hint?: string;
}
export interface Entity {
  table: string;
  label: string;
  pk: string;
  pkAuto: boolean; // auto-increment integer pk
  fields: Field[];
  listCols: string[]; // shown in the table
  search: string[]; // LIKE-searched columns
  order: string;
}

export const ENTITIES: Record<string, Entity> = {
  quotes: {
    table: "quotes", label: "Quotes", pk: "id", pkAuto: true, order: "id DESC",
    fields: [
      { name: "text", type: "longtext", required: true },
      { name: "author_id", type: "ref", ref: "authors" },
      { name: "topic_id", type: "ref", ref: "topics" },
      { name: "lang", type: "text", hint: "en, hi, ..." },
      { name: "is_active", type: "bool" },
    ],
    listCols: ["id", "text", "author_id", "topic_id", "is_active", "source"], search: ["text", "source"],
  },
  wishes: {
    table: "wishes", label: "Wishes", pk: "id", pkAuto: true, order: "id DESC",
    fields: [
      { name: "text", type: "longtext", required: true, hint: "Use {name} where the person's name goes" },
      { name: "occasion", type: "text", required: true, hint: "birthday, good-morning, diwali, ..." },
      { name: "lang", type: "text" },
      { name: "is_active", type: "bool" },
    ],
    listCols: ["id", "text", "occasion", "is_active", "source"], search: ["text", "occasion", "source"],
  },
  authors: {
    table: "authors", label: "Authors", pk: "id", pkAuto: true, order: "name",
    fields: [
      { name: "name", type: "text", required: true },
      { name: "slug", type: "text", required: true },
      { name: "bio", type: "longtext" },
    ],
    listCols: ["id", "name", "slug"], search: ["name", "slug"],
  },
  topics: {
    table: "topics", label: "Topics", pk: "id", pkAuto: true, order: "name",
    fields: [
      { name: "name", type: "text", required: true },
      { name: "slug", type: "text", required: true },
      { name: "emoji", type: "text" },
    ],
    listCols: ["id", "emoji", "name", "slug"], search: ["name", "slug"],
  },
  templates: {
    table: "templates", label: "Templates", pk: "id", pkAuto: true, order: "sort, id",
    fields: [
      { name: "name", type: "text", required: true },
      { name: "kind", type: "text", hint: "quote | wish | any" },
      { name: "occasion", type: "text", hint: "Only for this occasion (blank = all)" },
      { name: "layout_json", type: "json", required: true, hint: "See shared/layout.ts" },
      { name: "bg_key", type: "text", hint: "Internxt object key, e.g. backgrounds/roses.jpg" },
      { name: "sort", type: "int" },
      { name: "is_active", type: "bool" },
    ],
    listCols: ["id", "name", "kind", "occasion", "bg_key", "is_active"], search: ["name", "occasion"],
  },
  festivals: {
    table: "festivals", label: "Festivals", pk: "id", pkAuto: true, order: "starts_on DESC",
    fields: [
      { name: "name", type: "text", required: true },
      { name: "slug", type: "text", required: true, hint: "one row per year, e.g. diwali-2027" },
      { name: "occasion", type: "text", required: true, hint: "Wish occasion, e.g. diwali" },
      { name: "starts_on", type: "date", required: true },
      { name: "ends_on", type: "date", required: true },
      { name: "headline", type: "text" },
      { name: "accent", type: "text", hint: "#hex" },
      { name: "art_key", type: "text", hint: "Internxt object key for hero art" },
      { name: "priority", type: "int" },
      { name: "is_active", type: "bool" },
    ],
    listCols: ["id", "name", "starts_on", "ends_on", "occasion", "is_active"], search: ["name", "slug", "occasion"],
  },
  daily_picks: {
    table: "daily_picks", label: "Daily picks", pk: "day", pkAuto: false, order: "day DESC",
    fields: [
      { name: "day", type: "date", required: true },
      { name: "quote_id", type: "ref", ref: "quotes" },
      { name: "wish_id", type: "ref", ref: "wishes" },
      { name: "template_id", type: "ref", ref: "templates" },
      { name: "festival_id", type: "ref", ref: "festivals" },
    ],
    listCols: ["day", "quote_id", "wish_id", "template_id", "festival_id"], search: ["day"],
  },
};

/** Coerce and validate an incoming JSON body against the entity's fields. */
export function cleanRow(e: Entity, body: Record<string, unknown>, partial: boolean) {
  const out: Record<string, string | number | null> = {};
  for (const f of e.fields) {
    if (!(f.name in body)) {
      if (!partial && f.required) throw new Error(`${f.name} is required`);
      continue;
    }
    let v = body[f.name] as unknown;
    if (v === "" || v === undefined) v = null;
    if (v === null) {
      if (f.required) throw new Error(`${f.name} is required`);
      out[f.name] = null;
      continue;
    }
    switch (f.type) {
      case "int":
      case "ref": {
        const n = Number(v);
        if (!Number.isInteger(n)) throw new Error(`${f.name} must be a whole number`);
        out[f.name] = n;
        break;
      }
      case "bool":
        out[f.name] = v === true || v === 1 || v === "1" || v === "true" ? 1 : 0;
        break;
      case "date":
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(v))) throw new Error(`${f.name} must be YYYY-MM-DD`);
        out[f.name] = String(v);
        break;
      case "json":
        try {
          out[f.name] = JSON.stringify(typeof v === "string" ? JSON.parse(v) : v);
        } catch {
          throw new Error(`${f.name} is not valid JSON`);
        }
        break;
      default:
        out[f.name] = String(v);
    }
  }
  return out;
}
