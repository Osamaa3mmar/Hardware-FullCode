import { useState, useRef, useEffect } from "react";
import "./DrawButton.css";

function DrawButton({ gcode, disabled }) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [currentProgress, setCurrentProgress] = useState({
    current: 0,
    total: 0,
  });
  const logsEndRef = useRef(null);
  const eventSourceRef = useRef(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleDraw = async () => {
    if (!gcode) {
      setError("No G-code available");
      return;
    }

    setIsDrawing(true);
    setError(null);
    setLogs([]);
    setCurrentProgress({ current: 0, total: 0 });
    setProgress("Connecting to Arduino...");

    // Close any existing EventSource
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      // Use EventSource for real-time updates
      const url = new URL("http://localhost:5000/api/serial/send");

      // We need to send POST data, so we'll use fetch with SSE
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gcode: gcode,
          port: "COM4",
          baudRate: 115200,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to connect to Arduino");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // Read stream
      const readStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              setIsDrawing(false);
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.trim()) {
                processSSEMessage(line);
              }
            }
          }
        } catch (err) {
          console.error("Stream error:", err);
          setError(err.message);
          setIsDrawing(false);
        }
      };

      readStream();
    } catch (err) {
      setError(err.message);
      setProgress(null);
      setIsDrawing(false);
    }
  };

  const processSSEMessage = (message) => {
    const lines = message.split("\n");
    let eventType = "message";
    let data = null;

    for (const line of lines) {
      if (line.startsWith("event:")) {
        eventType = line.substring(6).trim();
      } else if (line.startsWith("data:")) {
        try {
          data = JSON.parse(line.substring(5).trim());
        } catch (e) {
          console.error("Failed to parse SSE data:", e);
        }
      }
    }

    if (!data) return;

    switch (eventType) {
      case "status":
        setProgress(data.message);
        addLog(data.timestamp, data.message, "status");
        break;

      case "progress":
        setCurrentProgress({ current: data.current, total: data.total });
        setProgress(
          `Sending line ${data.current}/${data.total}: ${data.line.substring(
            0,
            30
          )}...`
        );
        break;

      case "log":
        addLog(data.timestamp, data.message, "arduino");
        break;

      case "complete":
        setProgress(`✅ Drawing complete in ${data.totalTime}!`);
        addLog(
          data.timestamp,
          `Completed! Total lines: ${data.totalLines}, Time: ${data.totalTime}`,
          "complete"
        );
        setIsDrawing(false);
        break;

      case "error":
        setError(data.message);
        addLog(data.timestamp, `Error: ${data.message}`, "error");
        setIsDrawing(false);
        break;
    }
  };

  const addLog = (timestamp, message, type = "info") => {
    setLogs((prev) => [
      ...prev,
      {
        timestamp,
        message,
        type,
      },
    ]);
  };

  return (
    <div className="draw-button-container">
      <button
        className="draw-button"
        onClick={handleDraw}
        disabled={disabled || isDrawing || !gcode}
      >
        {isDrawing ? "🔄 Drawing..." : "🖊️ Draw on CNC"}
      </button>

      {isDrawing && currentProgress.total > 0 && (
        <div className="progress-bar-container">
          <div
            className="progress-bar"
            style={{
              width: `${
                (currentProgress.current / currentProgress.total) * 100
              }%`,
            }}
          />
          <span className="progress-text">
            {currentProgress.current}/{currentProgress.total} lines
          </span>
        </div>
      )}

      {progress && (
        <div className="draw-progress">
          <p className="progress-message">{progress}</p>
        </div>
      )}

      {error && (
        <div className="draw-error">
          <p>❌ Error: {error}</p>
          <small>Make sure Arduino is connected to COM4</small>
        </div>
      )}

      {logs.length > 0 && (
        <div className="draw-logs">
          <h4>Arduino Response Log (Real-time):</h4>
          <div className="logs-container">
            {logs.map((log, index) => (
              <div key={index} className={`log-entry log-${log.type}`}>
                <span className="log-time">
                  [{(log.timestamp / 1000).toFixed(2)}s]
                </span>
                <span className="log-message">{log.message}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}

export default DrawButton;
