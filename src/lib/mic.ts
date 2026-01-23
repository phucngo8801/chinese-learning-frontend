const LS_KEY = "mic:preferredDeviceId";

/**
 * Persist user's preferred microphone deviceId (optional).
 * This helps when a laptop has multiple inputs (built‑in mic vs headset, etc.).
 */
export function getPreferredMicId(): string {
  try {
    return localStorage.getItem(LS_KEY) || "";
  } catch {
    return "";
  }
}

export function setPreferredMicId(deviceId: string) {
  try {
    if (deviceId) localStorage.setItem(LS_KEY, deviceId);
    else localStorage.removeItem(LS_KEY);
    window.dispatchEvent(new Event("mic:device"));
  } catch {
    // ignore
  }
}

/**
 * Build audio constraints tuned for speech recognition / practice.
 * Notes:
 * - Some constraints are "ideal" and may be ignored by the browser.
 * - We keep it permissive but help reduce choppiness/noise.
 */
export function buildAudioConstraints() {
  const deviceId = getPreferredMicId();

  const c: any = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    channelCount: 1,
    sampleRate: 48000,
    sampleSize: 16,
  };

  if (deviceId) c.deviceId = { exact: deviceId };

  return c as MediaTrackConstraints;
}

/**
 * Request mic permission (so device labels are available and SR is less likely to fail instantly).
 * Immediately stops tracks after permission is granted.
 */
export async function ensureMicPermission(): Promise<void> {
  if (!navigator.mediaDevices?.getUserMedia) return;
  const stream = await navigator.mediaDevices.getUserMedia({ audio: buildAudioConstraints() as any });
  try {
    stream.getTracks().forEach((t) => t.stop());
  } catch {
    // ignore
  }
}

/**
 * Enumerate available audio input devices (best effort).
 * If permission hasn't been granted, labels may be empty.
 */
export async function listAudioInputs(): Promise<MediaDeviceInfo[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((d) => d.kind === "audioinput");
}
