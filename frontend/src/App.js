import { useState } from "react";

function App() {
  const [text, setText] = useState("");
  const [meetingId, setMeetingId] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);

    // 1. Upload
    const uploadRes = await fetch("http://127.0.0.1:8000/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    const uploadData = await uploadRes.json();
    const id = uploadData.meeting_id;
    setMeetingId(id);

    // 2. Analyze
    await fetch("http://127.0.0.1:8000/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ meeting_id: id }),
    });

    // 3. Get results
    const res = await fetch(`http://127.0.0.1:8000/results/${id}`);
    const data = await res.json();

    setResult(data);
    setLoading(false);
  };

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

      <button onClick={handleAnalyze} disabled={loading}>
        {loading ? "Analyzing..." : "Analyze"}
      </button>

      {result && (
        <div style={{ marginTop: 30 }}>
          <h2>Summary</h2>
          <p>{result.summary}</p>

          <h2>Action Items</h2>
          <ul>
            {result.action_items?.map((item, i) => (
              <li key={i}>
                <strong>{item.task}</strong>
                {item.owner ? ` — ${item.owner}` : ""}
                {item.deadline ? ` (due: ${item.deadline})` : ""}
              </li>
            ))}
          </ul>

          <h2>Decisions</h2>
          <ul>
            {result.decisions?.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;