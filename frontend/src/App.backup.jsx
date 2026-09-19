import { useEffect, useState } from "react";
import "./App.css";
import { calculateSiteScore } from "./api";

function App() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function testBackend() {
      try {
        const data = await calculateSiteScore({
          population: 92,
          accessibility: 96,
          competition: 68,
          land_use: 91,
          risk: 89,
        });

        setResult(data);
      } catch (err) {
        console.error(err);
        setError("Could not connect to FastAPI backend.");
      }
    }

    testBackend();
  }, []);

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>GeoReadiness AI</h1>

      <h2>Backend Connection Test</h2>

      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}

      {result && (
        <div>
          <h2>Site Readiness Score: {result.score}</h2>

          <pre>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {!result && !error && <p>Connecting to backend...</p>}
    </div>
  );
}

export default App;
