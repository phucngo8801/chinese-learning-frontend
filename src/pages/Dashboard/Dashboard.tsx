import "./Dashboard.css";

export default function Dashboard() {
  return (
    <main className="dashboard-main">
      <section className="dashboard-section">
        <div className="card dashboard-study-card">
          <h2>🔥 Hiện nay bạn chưa học?</h2>
          <p>Duy trì chuỗi để không bị mất chuỗi ngày học.</p>

          <button
            className="btn-primary"
            onClick={() => (window.location.href = "/streak")}
          >
            Vào streak
          </button>
        </div>
      </section>
    </main>
  );
}
