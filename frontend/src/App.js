import { useState, useEffect } from "react";

function App() {
  const [text, setText] = useState("");
  const [meetingId, setMeetingId] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState({});
  const [allTasks, setAllTasks] = useState([]);
  const [overdue, setOverdue] = useState([]);

  const [showAllTasks, setShowAllTasks] = useState(false);
  const [showAllOverdue, setShowAllOverdue] = useState(false);

  const API = "http://127.0.0.1:8000";

  const loadDashboard = async () => {
    try {
      const m = await fetch(`${API}/meetings`).then(r => r.json());
      const t = await fetch(`${API}/tasks`).then(r => r.json());
      const o = await fetch(`${API}/tasks/overdue`).then(r => r.json());

      setMeetings(m);
      setAllTasks(Array.isArray(t) ? t : t.tasks || []);
      setOverdue(Array.isArray(o) ? o : o.tasks || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadTasks = async (id) => {
    const res = await fetch(`${API}/tasks/${id}`);
    const data = await res.json();
    setTasks(data);
  };

  const handleAnalyze = async () => {
    setLoading(true);

    try {
      const uploadRes = await fetch(`${API}/upload`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ text }),
      });

      const { meeting_id } = await uploadRes.json();
      setMeetingId(meeting_id);

      await fetch(`${API}/analyze`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ meeting_id }),
      });

      const res = await fetch(`${API}/results/${meeting_id}`);
      const data = await res.json();

      setResult(data);
      await loadTasks(meeting_id);
      await loadDashboard();

    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  const markDone = async (taskId) => {
    await fetch(`${API}/tasks/${taskId}/complete`, { method: "POST" });
    await loadTasks(meetingId);
    await loadDashboard();
  };

  const visibleTasks = showAllTasks ? allTasks : allTasks.slice(0, 5);
  const visibleOverdue = showAllOverdue ? overdue : overdue.slice(0, 5);

  return (
    <div style={styles.page}>

      {/* HERO */}
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>Meeting AI</h1>
        <p style={styles.heroSubtitle}>
          Turn messy meetings into clear summaries, action items, and accountability.
        </p>
      </div>

      {/* INPUT */}
      <div style={styles.inputCard}>
        <textarea
          rows={5}
          style={styles.textarea}
          placeholder="Paste your meeting transcript here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button
          style={styles.primaryBtn}
          onClick={handleAnalyze}
          disabled={loading || !text}
        >
          {loading ? "Analyzing..." : "Analyze Meeting"}
        </button>
      </div>

      <div style={styles.grid}>

        {/* LEFT SIDE */}
        <div>

          {result && (
            <div style={styles.card}>
              <h2>Summary</h2>
              <p>{result.summary}</p>

              <h3>Decisions</h3>
              <ul>
                {result.decisions?.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}

          {tasks.length > 0 && (
            <div style={styles.card}>
              <h2>Action Items</h2>

              {tasks.map((task) => (
                <div key={task.id} style={styles.task}>
                  <div>
                    <strong>{task.task}</strong>
                    <div style={styles.meta}>
                      {task.owner || "Unassigned"} • {task.status}
                      {task.deadline && ` • due ${task.deadline}`}
                    </div>
                  </div>

                  {task.status === "pending" && (
                    <button
                      style={styles.successBtn}
                      onClick={() => markDone(task.id)}
                    >
                      Done
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT SIDE (Dashboard) */}
        <div>

          <div style={styles.card}>
            <h2>Past Meetings</h2>
            {Object.entries(meetings).map(([id, m]) => (
              <div key={id} style={styles.listItem}>
                {id.slice(0, 8)} — {m.status}
              </div>
            ))}
          </div>

          <div style={styles.card}>
            <h2>All Tasks</h2>

            {visibleTasks.map((t) => (
              <div key={t.id} style={styles.listItem}>
                {t.task} — {t.owner} [{t.status}]
              </div>
            ))}

            {allTasks.length > 5 && (
              <button
                style={styles.linkBtn}
                onClick={() => setShowAllTasks(!showAllTasks)}
              >
                {showAllTasks ? "Show less" : "Show more"}
              </button>
              )}
          </div>

          <div style={styles.card}>
            <h2 style={{ color: "#dc2626" }}>Overdue</h2>

            {visibleOverdue.length === 0 ? (
              <p>No overdue tasks 🎉</p>
            ) : (
              <>
              {visibleOverdue.map((t) => (
                <div key={t.id} style={{ ...styles.listItem, color: "#dc2626" }}>
                  {t.task} — {t.owner} (due: {t.deadline || "—"})
                </div>
                ))}

                {overdue.length > 5 && (
                  <button
                    style={styles.linkBtn}
                    onClick={() => setShowAllOverdue(!showAllOverdue)}
                  >
                    {showAllOverdue ? "Show less" : "Show more"}
                  </button>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const styles = {
  page: {
    fontFamily: "Inter, sans-serif",
    background: "linear-gradient(to bottom, #eef2ff, #f8fafc)",
    minHeight: "100vh",
    padding: 30,
  },

  hero: {
    textAlign: "center",
    marginBottom: 30
  },

  heroTitle: {
    fontSize: 42,
    marginBottom: 10
  },

  heroSubtitle: {
    color: "#555",
    fontSize: 16
  },

  inputCard: {
    background: "white",
    padding: 20,
    borderRadius: 12,
    maxWidth: 800,
    margin: "0 auto 30px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
  },

  textarea: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    border: "1px solid #ccc",
    marginBottom: 10
  },

  primaryBtn: {
    padding: "10px 18px",
    borderRadius: 8,
    border: "none",
    background: "#4f46e5",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold"
  },

  successBtn: {
    background: "#22c55e",
    color: "white",
    border: "none",
    padding: "6px 10px",
    borderRadius: 6,
    cursor: "pointer"
  },

  linkBtn: {
    marginTop: 10,
    background: "none",
    border: "none",
    color: "#4f46e5",
    cursor: "pointer",
    fontWeight: "bold"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: 20,
    maxWidth: 1100,
    margin: "auto"
  },

  card: {
    background: "white",
    padding: 20,
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
    marginBottom: 20
  },

  task: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderBottom: "1px solid #eee"
  },

  meta: {
    fontSize: 12,
    color: "#666"
  },

  listItem: {
    padding: "6px 0",
    borderBottom: "1px solid #eee"
  }
};

export default App;