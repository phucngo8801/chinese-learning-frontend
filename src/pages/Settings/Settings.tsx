import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Settings.css";
import { getAppSettings, updateAppSettings } from "../../lib/appSettings";
import { playTing } from "../../lib/ting";
import { ensureMicPermission, getPreferredMicId, listAudioInputs, setPreferredMicId } from "../../lib/mic";

export default function Settings() {
  const nav = useNavigate();
  const [s, setS] = useState(() => getAppSettings());
  const [micId, setMicId] = useState(() => getPreferredMicId());
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    setS(getAppSettings());
  }, []);

  const refreshMics = async () => {
    try {
      await ensureMicPermission();
      const list = await listAudioInputs();
      // If device labels are empty, user likely denied permission.
      setMicDevices(list);
    } catch {
      setMicDevices([]);
    }
  };

  useEffect(() => {
    refreshMics();

    const onDevice = () => setMicId(getPreferredMicId());
    window.addEventListener("mic:device", onDevice);
    return () => window.removeEventListener("mic:device", onDevice);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="st-page">
      <div className="st-shell">
        <div className="st-hero">
          <div className="st-heroIcon">⚙️</div>
          <div>
            <h1 className="st-title">Cài đặt</h1>
            <p className="st-sub">Bật/tắt ting, toast, giờ im lặng…</p>
          </div>
        </div>

        <div className="st-grid">
          {/* Quick links */}
          <section className="st-card">
            <div className="st-cardTitle">🚀 Mở nhanh</div>
            <div className="st-row">
              <div className="st-rowText">
                <div className="st-rowLabel">🔤 Pinyin Lab</div>
                <div className="st-rowHint">Âm đầu • vần • thanh điệu • cặp dễ nhầm • bài luyện (cố định)</div>
              </div>
              <button className="st-btn primary" onClick={() => nav("/pinyin-lab")}>Mở</button>
            </div>
          </section>

          {/* Notifications */}
          <section className="st-card">
            <div className="st-cardTitle">🔔 Thông báo</div>

            <div className="st-row">
              <div className="st-rowText">
                <div className="st-rowLabel">Âm thanh “ting”</div>
                <div className="st-rowHint">Có tin nhắn mới sẽ kêu dù bạn ở trang nào.</div>
              </div>
              <button
                className={s.soundEnabled ? "st-switch on" : "st-switch"}
                onClick={() => {
                  const next = updateAppSettings({ soundEnabled: !s.soundEnabled });
                  setS(next);
                }}
              >
                <span />
              </button>
            </div>

            <div className="st-row">
              <div className="st-rowText">
                <div className="st-rowLabel">Toast popup</div>
                <div className="st-rowHint">Hiện thông báo nhỏ ở góc màn hình.</div>
              </div>
              <button
                className={s.toastEnabled ? "st-switch on" : "st-switch"}
                onClick={() => {
                  const next = updateAppSettings({ toastEnabled: !s.toastEnabled });
                  setS(next);
                }}
              >
                <span />
              </button>
            </div>

            <div className="st-row">
              <div className="st-rowText">
                <div className="st-rowLabel">Giờ im lặng</div>
                <div className="st-rowHint">Trong khoảng này sẽ không ting/toast.</div>
              </div>
              <button
                className={s.quietHours.enabled ? "st-switch on" : "st-switch"}
                onClick={() => {
                  const next = updateAppSettings({
                    quietHours: { ...s.quietHours, enabled: !s.quietHours.enabled },
                  });
                  setS(next);
                }}
              >
                <span />
              </button>
            </div>

            {s.quietHours.enabled && (
              <div className="st-quiet">
                <div className="st-quietRow">
                  <div className="st-quietLabel">Từ</div>
                  <input
                    type="time"
                    value={s.quietHours.from}
                    onChange={(e) => {
                      const next = updateAppSettings({
                        quietHours: { ...s.quietHours, from: e.target.value },
                      });
                      setS(next);
                    }}
                  />
                </div>
                <div className="st-quietRow">
                  <div className="st-quietLabel">Đến</div>
                  <input
                    type="time"
                    value={s.quietHours.to}
                    onChange={(e) => {
                      const next = updateAppSettings({
                        quietHours: { ...s.quietHours, to: e.target.value },
                      });
                      setS(next);
                    }}
                  />
                </div>
              </div>
            )}

            <div className="st-actions">
              <button
                className="st-btn primary"
                onClick={() => playTing()}
                title="Thử tiếng ting"
              >
                🔊 Thử ting
              </button>
            </div>
          </section>

          {/* Learning */}
          <section className="st-card">
            <div className="st-cardTitle">📚 Học tập</div>

            <div className="st-row">
              <div className="st-rowText">
                <div className="st-rowLabel">Auto-next</div>
                <div className="st-rowHint">Đúng sẽ tự qua câu tiếp theo.</div>
              </div>
              <button
                className={s.autoNext ? "st-switch on" : "st-switch"}
                onClick={() => {
                  const next = updateAppSettings({ autoNext: !s.autoNext });
                  setS(next);
                }}
              >
                <span />
              </button>
            </div>

            <div className="st-row">
              <div className="st-rowText">
                <div className="st-rowLabel">Ngưỡng qua câu khi chấm nói</div>
                <div className="st-rowHint">Ví dụ: 75% trở lên mới cho “✅ Đúng”.</div>
              </div>
            </div>

            <div className="st-sliderRow">
              <input
                type="range"
                min={0}
                max={100}
                value={s.passPronMin}
                onChange={(e) => {
                  const next = updateAppSettings({ passPronMin: Number(e.target.value) });
                  setS(next);
                }}
              />
              <div className="st-sliderValue">{s.passPronMin}%</div>
            </div>
          </section>

          {/* Chat */}
          <section className="st-card">
            <div className="st-cardTitle">💬 Chat</div>

            <div className="st-row">
              <div className="st-rowText">
                <div className="st-rowLabel">Chỉ bạn bè được nhắn</div>
                <div className="st-rowHint">Mặc định bật (an toàn).</div>
              </div>
              <button
                className={s.friendsOnly ? "st-switch on" : "st-switch"}
                onClick={() => {
                  const next = updateAppSettings({ friendsOnly: !s.friendsOnly });
                  setS(next);
                }}
              >
                <span />
              </button>
            </div>

            <div className="st-row">
              <div className="st-rowText">
                <div className="st-rowLabel">Nhận tin nhắn từ người lạ</div>
                <div className="st-rowHint">Nếu tắt thì chỉ chat với bạn bè.</div>
              </div>
              <button
                className={s.allowStrangers ? "st-switch on" : "st-switch"}
                onClick={() => {
                  const next = updateAppSettings({ allowStrangers: !s.allowStrangers });
                  setS(next);
                }}
              >
                <span />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}