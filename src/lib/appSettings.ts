import { getLocalUid } from "./vocabLocal";

export type QuietHours = {
  enabled: boolean;
  from: string; // "HH:MM"
  to: string; // "HH:MM"
};

export type AppSettings = {
  // Notifications
  soundEnabled: boolean;
  toastEnabled: boolean;
  quietHours: QuietHours;

  // Chat
  allowStrangers: boolean;
  friendsOnly: boolean;

  // Learning
  autoNext: boolean;
  passPronMin: number; // 0-100
};

const KEY_BASE = "app_settings_v1";

function scopedKey() {
  return `${KEY_BASE}::${getLocalUid()}`;
}

const DEFAULTS: AppSettings = {
  soundEnabled: true,
  toastEnabled: true,
  quietHours: { enabled: false, from: "22:00", to: "07:00" },
  allowStrangers: false,
  friendsOnly: true,
  autoNext: true,
  passPronMin: 75,
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getAppSettings(): AppSettings {
  const k = scopedKey();
  const raw = safeParse<Partial<AppSettings> | null>(localStorage.getItem(k), null);
  if (!raw) {
    localStorage.setItem(k, JSON.stringify(DEFAULTS));
    return { ...DEFAULTS };
  }

  const merged: AppSettings = {
    ...DEFAULTS,
    ...raw,
    quietHours: { ...DEFAULTS.quietHours, ...(raw.quietHours || {}) },
  };
  localStorage.setItem(k, JSON.stringify(merged));
  return merged;
}

export function setAppSettings(next: AppSettings) {
  const k = scopedKey();
  localStorage.setItem(k, JSON.stringify(next));
}

export function updateAppSettings(patch: Partial<AppSettings>) {
  const cur = getAppSettings();
  const next: AppSettings = {
    ...cur,
    ...patch,
    quietHours: { ...cur.quietHours, ...(patch.quietHours || {}) },
  };
  setAppSettings(next);
  return next;
}

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map((x) => Number(x));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return Math.max(0, Math.min(23, h)) * 60 + Math.max(0, Math.min(59, m));
}

/**
 * Returns true if we are inside quiet hours.
 * - Supports ranges that cross midnight (e.g. 22:00 -> 07:00).
 */
export function isInQuietHours(settings?: AppSettings, now = new Date()) {
  const s = settings || getAppSettings();
  if (!s.quietHours.enabled) return false;

  const from = toMinutes(s.quietHours.from);
  const to = toMinutes(s.quietHours.to);
  const cur = now.getHours() * 60 + now.getMinutes();

  if (from === to) return true; // whole day
  if (from < to) return cur >= from && cur < to;

  // crosses midnight
  return cur >= from || cur < to;
}
