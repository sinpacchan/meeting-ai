import { useState } from "react";

function App() {
  const [text, setText] = useState("");
  const [meetingId, setMeetingId] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);

  // -------------------------
  // Load tasks from backend
  // -------------------------
  const loadTasks = async (id) => {
    const res = await fetch(`http://127.0.0.1:8000/tasks/${id}`);
    const data = await res.json();
    setTasks(data);
  };

  // -------------------------
  // Analyze flow
  // -------------------------
  const handleAnalyze = async () => {
    setLoading(true);

    try {
      // 1. Upload
      const uploadRes = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const uploadData = await uploadRes.json();
      const id = uploadData.meeting_id;

      setMeetingId(id);

      // 2. Analyze
      await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meeting_id: id }),
      });

      // 3. Get structured results
      const res = await fetch(`http://127.0.0.1:8000/results/${id}`);
      const data = await res.json();

      setResult(data);

      // 4. Load DB tasks (source of truth)
      await loadTasks(id);
    } catch (err) {
      console.error("Error:", err);
    }

    setLoading(false);
  };

  // -------------------------
  // Mark task as done
  // -------------------------
  const markDone = async (taskId) => {
    await fetch(`http://127.0.0.1:8000/tasks/${taskId}/complete`, {
      method: "POST",
    });

    // refresh tasks
    await loadTasks(meetingId);
  };

  // -------------------------
  // UI
  // -------------------------
  return (
    <div style={{ padding: 40, maxWidth: 800, margin: "auto" }}>
      <h1>Meeting AI</h1>

      <textarea
        rows={10}
        style={{ width: "100%" }}
        placeholder="Paste meeting transcript..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <br /><br />

      <button onClick={handleAnalyze} disabled={loading || !text}>
        {loading ? "Analyzing..." : "Analyze"}
      </button>

      {/* ---------------- SUMMARY ---------------- */}
      {result && (
        <div style={{ marginTop: 30 }}>
          <h2>Summary</h2>
          <p>{result.summary}</p>

          {/* ---------------- DECISIONS ---------------- */}
          <h2>Decisions</h2>
          <ul>
            {result.decisions?.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ---------------- TASKS (DB SOURCE OF TRUTH) ---------------- */}
      {tasks.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <h2>Action Items</h2>

          {tasks.map((task) => (
            <div
              key={task.id}
              style={{
                padding: 10,
                marginBottom: 10,
                border: "1px solid #ddd",
                borderRadius: 6,
              }}
            >
              <div>
                <strong>{task.task}</strong> — {task.owner}
              </div>

              <small>
                Status: {task.status}
                {task.deadline ? ` | Due: ${task.deadline}` : ""}
              </small>

              {task.status === "pending" && (
                <div>
                  <button
                    onClick={() => markDone(task.id)}
                    style={{ marginTop: 5 }}
                  >
                    Mark Done
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;