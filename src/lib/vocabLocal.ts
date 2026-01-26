// src/lib/vocabLocal.ts
// Local-only learning stats.
// IMPORTANT: These keys MUST be scoped per-user because localStorage is shared
// across accounts in the same browser.

// Learning mode is used for local-only stats breakdown.
// Keep this union stable because it is persisted in localStorage.
export type Mode = "random" | "selected" | "review";

/**
 * Normalize an arbitrary mode value into a supported Mode.
 * Keeps the app resilient to older clients / unexpected query params.
 */
export function normalizeMode(v: unknown): Mode {
  const s = String(v ?? "").toLowerCase();
  if (s === "selected") return "selected";
  if (s === "review") return "review";
  return "random";
}

export type PronItem = {
  vocabId: number;
  lastScore: number; // lần gần nhất
  bestScore: number; // cao nhất
  avgScore: number; // trung bình
  attempts: number; // số lần nói
  lastText: string; // transcript gần nhất
  lastAt: number; // Date.now()
};

export type PronMap = Record<number, PronItem>;

export type DailyStats = {
  dateKey: string; // YYYY-MM-DD theo local time
  correct: number;
  wrong: number;
  total: number;
  uniqueIds: number[];
  byMode: Record<Mode, { correct: number; wrong: number; total: number }>;
};

/**
 * UID used to scope local storage.
 * - Set at login (email or userId).
 * - Cleared at logout.
 */
export const LV_UID_KEY = "lv_uid";

// Base keys (we will prefix by uid)
const PRON_KEY_BASE = "lv_pron_v1";
const STATS_KEY_BASE = "lv_daily_stats_v1";

// Legacy keys (old versions stored globally)
const PRON_KEY_LEGACY = "lv_pron_v1";
const STATS_KEY_LEGACY = "lv_daily_stats_v1";

function normalizeUid(uid: string) {
  return encodeURIComponent(uid.trim().toLowerCase());
}

export function setLocalUid(uid: string) {
  const v = normalizeUid(uid || "guest");
  localStorage.setItem(LV_UID_KEY, v);
}

export function clearLocalUid() {
  localStorage.removeItem(LV_UID_KEY);
}

export function getLocalUid() {
  const explicit = localStorage.getItem(LV_UID_KEY) || localStorage.getItem("uid");
  if (explicit) return explicit;

  // Fallback: scope by token if user is logged in but hasn't gone through
  // the updated login flow yet (avoid shared "guest").
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("access_token");

  if (token) return normalizeUid(`tok:${token.slice(0, 32)}`);

  return "guest";
}

function scopedKey(base: string) {
  return `${base}::${getLocalUid()}`;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function getLocalDateKey(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function tryMigrateLegacy<T>(scopedK: string, legacyK: string): T | null {
  // One-time migration:
  // If new scoped key is empty, but legacy exists -> copy legacy to scoped.
  const hasScoped = localStorage.getItem(scopedK);
  if (hasScoped) return null;

  const legacy = localStorage.getItem(legacyK);
  if (!legacy) return null;

  localStorage.setItem(scopedK, legacy);
  return safeParse<T>(legacy, null as any);
}

/* ---------------- PRON ---------------- */
export function getPronMap(): PronMap {
  const k = scopedKey(PRON_KEY_BASE);
  tryMigrateLegacy<PronMap>(k, PRON_KEY_LEGACY);
  return safeParse<PronMap>(localStorage.getItem(k), {});
}

export function setPronMap(map: PronMap) {
  const k = scopedKey(PRON_KEY_BASE);
  localStorage.setItem(k, JSON.stringify(map));
}

export function savePronAttempt(args: { vocabId: number; score: number; transcript: string }) {
  const map = getPronMap();
  const prev = map[args.vocabId];

  const attempts = (prev?.attempts ?? 0) + 1;
  const prevAvg = prev?.avgScore ?? 0;
  const avgScore = Math.round((prevAvg * (attempts - 1) + args.score) / attempts);

  const bestScore = Math.max(prev?.bestScore ?? 0, args.score);

  map[args.vocabId] = {
    vocabId: args.vocabId,
    lastScore: args.score,
    bestScore,
    avgScore,
    attempts,
    lastText: args.transcript,
    lastAt: Date.now(),
  };

  setPronMap(map);
}

export function getPronFor(vocabId: number): PronItem | null {
  const map = getPronMap();
  return map[vocabId] ?? null;
}

/* ---------------- DAILY STATS ---------------- */
export function getDailyStats(): DailyStats {
  const today = getLocalDateKey();
  const k = scopedKey(STATS_KEY_BASE);

  tryMigrateLegacy<DailyStats>(k, STATS_KEY_LEGACY);

  const raw = safeParse<DailyStats | null>(localStorage.getItem(k), null);

  if (!raw || raw.dateKey !== today) {
    const fresh: DailyStats = {
      dateKey: today,
      correct: 0,
      wrong: 0,
      total: 0,
      uniqueIds: [],
      byMode: {
        random: { correct: 0, wrong: 0, total: 0 },
        selected: { correct: 0, wrong: 0, total: 0 },
        review: { correct: 0, wrong: 0, total: 0 },
      },
    };
    localStorage.setItem(k, JSON.stringify(fresh));
    return fresh;
  }

  return {
    ...raw,
    byMode: {
      random: raw.byMode?.random ?? { correct: 0, wrong: 0, total: 0 },
      selected: raw.byMode?.selected ?? { correct: 0, wrong: 0, total: 0 },
      review: raw.byMode?.review ?? { correct: 0, wrong: 0, total: 0 },
    },
  };
}

// NOTE: mode is optional/string for backwards compatibility with older callers.
export function bumpDaily(args: {
  vocabId: number;
  correct: boolean;
  mode?: Mode | string;
}) {
  const s = getDailyStats();
  const isCorrect = args.correct;

  const mode = normalizeMode(args.mode);

  s.total += 1;
  if (isCorrect) s.correct += 1;
  else s.wrong += 1;

  s.byMode[mode].total += 1;
  if (isCorrect) s.byMode[mode].correct += 1;
  else s.byMode[mode].wrong += 1;

  if (!s.uniqueIds.includes(args.vocabId)) s.uniqueIds.push(args.vocabId);

  const k = scopedKey(STATS_KEY_BASE);
  localStorage.setItem(k, JSON.stringify(s));
  return s;
}
