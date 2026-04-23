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

  const API = "http://127.0.0.1:8000";

  // -------------------------
  // Load dashboard data
  // -------------------------
  const loadDashboard = async () => {
    try {
      //console.log("ALL TASKS:", t);
      const m = await fetch(`${API}/meetings`).then(r => r.json());
      const t = await fetch(`${API}/tasks`).then(r => r.json());
      const o = await fetch(`${API}/tasks/overdue`).then(r => r.json());

      setMeetings(m);
      setAllTasks(Array.isArray(t) ? t : t.tasks || []);
      setOverdue(Array.isArray(o) ? o : o.tasks || []);
    } catch (err) {
      console.error("Dashboard error:", err);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // -------------------------
  // Load tasks for one meeting
  // -------------------------
  const loadTasks = async (id) => {
    const res = await fetch(`${API}/tasks/${id}`);
    const data = await res.json();
    setTasks(data);
  };

  // -------------------------
  // Analyze flow
  // -------------------------
  const handleAnalyze = async () => {
    setLoading(true);

    try {
      // Upload
      const uploadRes = await fetch(`${API}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const { meeting_id } = await uploadRes.json();
      setMeetingId(meeting_id);

      // Analyze
      await fetch(`${API}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meeting_id }),
      });

      // Get results
      const res = await fetch(`${API}/results/${meeting_id}`);
      const data = await res.json();
      setResult(data);

      // Load tasks (DB = truth)
      await loadTasks(meeting_id);

      // Refresh dashboard
      await loadDashboard();

    } catch (err) {
      console.error("Analyze error:", err);
    }

    setLoading(false);
  };

  // -------------------------
  // Mark task done
  // -------------------------
  const markDone = async (taskId) => {
    await fetch(`${API}/tasks/${taskId}/complete`, {
      method: "POST",
    });

    await loadTasks(meetingId);
    await loadDashboard();
  };

  // -------------------------
  // UI
  // -------------------------
  return (
    <div style={{ padding: 40, maxWidth: 900, margin: "auto" }}>
      <h1>Meeting AI</h1>

      {/* INPUT */}
      <textarea
        rows={8}
        style={{ width: "100%" }}
        placeholder="Paste meeting transcript..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <br /><br />

      <button onClick={handleAnalyze} disabled={loading || !text}>
        {loading ? "Analyzing..." : "Analyze"}
      </button>

      {/* ================= CURRENT RESULT ================= */}
      {result && (
        <div style={{ marginTop: 30 }}>
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

      {/* ================= MEETING TASKS ================= */}
      {tasks.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <h2>Action Items</h2>

          {tasks.map((task) => (
            <div key={task.id} style={cardStyle}>
              <strong>{task.task}</strong> — {task.owner}
              <br />
              <small>
                {task.status} {task.deadline && `| due: ${task.deadline}`}
              </small>

              {task.status === "pending" && (
                <div>
                  <button onClick={() => markDone(task.id)}>
                    Mark Done
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ================= DASHBOARD ================= */}

      {/* Meetings */}
      <div style={{ marginTop: 40 }}>
        <h2>Past Meetings</h2>
        <ul>
          {Object.entries(meetings).map(([id, m]) => (
            <li key={id}>
              {id.slice(0, 8)} — {m.status}
            </li>
          ))}
        </ul>
      </div>

      {/* All Tasks */}
      <div style={{ marginTop: 30 }}>
        <h2>All Tasks</h2>
        <ul>
          {Array.isArray(allTasks) && allTasks.map(t => (
            <li key={t.id}>
              {t.task} — {t.owner} [{t.status}]
            </li>
          ))}
        </ul>
      </div>

      {/* Overdue */}
      <div style={{ marginTop: 30 }}>
        <h2>⚠️ Overdue Tasks</h2>
        {overdue.length === 0 ? (
          <p>No overdue tasks 🎉</p>
        ) : (
          <ul>
            {overdue.map(t => (
              <li key={t.id}>
                🔴 {t.task} — {t.owner} (due: {t.deadline})
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const cardStyle = {
  padding: 10,
  marginBottom: 10,
  border: "1px solid #ddd",
  borderRadius: 6,
};

export default App;