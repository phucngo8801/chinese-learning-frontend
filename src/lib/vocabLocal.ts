// src/lib/vocabLocal.ts
// Local-only learning stats.
// IMPORTANT: These keys MUST be scoped per-user because localStorage is shared
// across accounts in the same browser.

import { getAuthToken } from "./authToken";

export type Mode = "random" | "selected";

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

export type PronAttempt = {
  vocabId: number;
  score: number;
  transcript?: string; // ✅ accept
  lastText?: string; // ✅ accept
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
  const token = getAuthToken();
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
  localStorage.setItem(k, JSON.stringify(map || {}));
}

/**
 * ✅ Backward compatible:
 * - savePronAttempt(vocabId, score, lastText?)
 * - savePronAttempt({ vocabId, score, transcript? / lastText? })
 */
export function savePronAttempt(vocabIdOrArgs: number | PronAttempt, score?: number, lastText?: string): void {
  const args: PronAttempt =
    typeof vocabIdOrArgs === "number"
      ? { vocabId: vocabIdOrArgs, score: Number(score ?? 0), lastText: lastText ?? "" }
      : vocabIdOrArgs;

  const vocabId = Number(args.vocabId);
  const s = Number.isFinite(args.score) ? args.score : 0;

  // ✅ accept both transcript + lastText
  const txt = (args.transcript ?? args.lastText ?? "").toString();

  if (!Number.isFinite(vocabId)) return;

  const map = getPronMap();
  const now = Date.now();

  const prev = map[vocabId];
  if (!prev) {
    map[vocabId] = {
      vocabId,
      lastScore: s,
      bestScore: s,
      avgScore: s,
      attempts: 1,
      lastText: txt,
      lastAt: now,
    };
    setPronMap(map);
    return;
  }

  const attempts = (prev.attempts ?? 0) + 1;
  const bestScore = Math.max(prev.bestScore ?? 0, s);

  // moving average
  const prevAvg = Number(prev.avgScore ?? 0);
  const avgScore = (prevAvg * (attempts - 1) + s) / attempts;

  map[vocabId] = {
    ...prev,
    lastScore: s,
    bestScore,
    avgScore,
    attempts,
    lastText: txt,
    lastAt: now,
  };

  setPronMap(map);
}

/* ---------------- DAILY STATS ---------------- */
export function getDailyStats(): DailyStats {
  const k = scopedKey(STATS_KEY_BASE);
  tryMigrateLegacy<DailyStats>(k, STATS_KEY_LEGACY);

  const today = getLocalDateKey();
  const st = safeParse<DailyStats>(localStorage.getItem(k), {
    dateKey: today,
    correct: 0,
    wrong: 0,
    total: 0,
    uniqueIds: [],
    byMode: {
      random: { correct: 0, wrong: 0, total: 0 },
      selected: { correct: 0, wrong: 0, total: 0 },
    },
  });

  // reset if date changed
  if (st.dateKey !== today) {
    return {
      dateKey: today,
      correct: 0,
      wrong: 0,
      total: 0,
      uniqueIds: [],
      byMode: {
        random: { correct: 0, wrong: 0, total: 0 },
        selected: { correct: 0, wrong: 0, total: 0 },
      },
    };
  }

  return st;
}

export function setDailyStats(stats: DailyStats) {
  const k = scopedKey(STATS_KEY_BASE);
  localStorage.setItem(k, JSON.stringify(stats));
}

/**
 * bumpDailyStats: always returns updated stats (NOT void)
 */
export function bumpDailyStats(args: { correct?: boolean; vocabId?: number; mode?: Mode }): DailyStats {
  const st = getDailyStats();

  const mode: Mode = args.mode || "random";
  if (!st.byMode[mode]) st.byMode[mode] = { correct: 0, wrong: 0, total: 0 };

  st.total += 1;
  st.byMode[mode].total += 1;

  if (args.correct) {
    st.correct += 1;
    st.byMode[mode].correct += 1;
  } else {
    st.wrong += 1;
    st.byMode[mode].wrong += 1;
  }

  if (typeof args.vocabId === "number") {
    if (!st.uniqueIds.includes(args.vocabId)) st.uniqueIds.push(args.vocabId);
  }

  setDailyStats(st);
  return st;
}

/**
 * ✅ Backward compatible:
 * - bumpDaily(true/false, vocabId?, mode?)
 * - bumpDaily({ correct, vocabId, mode })
 *
 * RETURNS DailyStats (NOT void)
 */
export function bumpDaily(
  correctOrArgs: boolean | { correct?: boolean; vocabId?: number; mode?: Mode },
  vocabId?: number,
  mode?: Mode
): DailyStats {
  if (typeof correctOrArgs === "boolean") {
    return bumpDailyStats({ correct: correctOrArgs, vocabId, mode });
  }
  return bumpDailyStats(correctOrArgs || {});
}

/* ---------------- RESET ---------------- */
export function resetLocalLearning() {
  // Clear all scoped keys for current uid
  const uid = getLocalUid();
  const suffix = `::${uid}`;

  for (const k of Object.keys(localStorage)) {
    if (k.endsWith(suffix)) localStorage.removeItem(k);
  }
}
