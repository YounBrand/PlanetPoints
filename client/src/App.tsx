import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

type Theme = "light" | "dark";

function App() {
  const [message, setMessage] = useState("");
  const [theme, setTheme] = useState<Theme>("dark");

  // Respect system preference on first load, then use saved choice
  useEffect(() => {
    const saved = localStorage.getItem("pp-theme") as Theme | null;
    if (saved) {
      setTheme(saved);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("pp-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const testClick = async () => {
    try {
      const res = await axios.get("/api/login/test");
      setMessage(res.data.message ?? "OK");
    } catch {
      setMessage("Backend not reachable");
    }
  };

  return (
    <div className="pp-app">
      {/* Top Bar / Nav */}
      <header className="pp-nav">
        <div className="pp-container">
          <div className="pp-brand">
            <span className="pp-logo" aria-hidden>🌍</span>
            <span className="pp-title">Planet Points</span>
          </div>

          <nav className="pp-links">
            <a href="#concept">Concept</a>
            <a href="#features">Focus areas</a>
          </nav>

          <div className="pp-actions">
            <button className="pp-btn ghost" onClick={toggleTheme}>
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
            <button className="pp-btn outline" onClick={testClick}>
              Test backend
            </button>
            <span className="dev-msg">{message && `→ ${message}`}</span>
          </div>
        </div>
      </header>

      {/* Hero (concept-only) */}
      <section id="concept" className="pp-hero">
        <div className="pp-container hero-grid">
          <div className="hero-copy">
            <h1>
              Track small wins, <br />
              <span className="accent">grow your Planet Points.</span>
            </h1>
            <p className="hero-sub">
              Concept: log simple eco-actions (bike, bus, plant-based meal, recycle) and earn points.
              Weekly goal + friendly leaderboards. Keep it fun, low-friction.
            </p>

            <div className="cta-row">
              <button className="pp-btn primary">Prototype: Start</button>
              <button className="pp-btn ghost">See leaderboard (mock)</button>
            </div>
          </div>

          {/* Minimal preview card */}
          <div className="hero-card">
            <div className="score-card">
              <div className="score-top">
                <span>Your week</span>
                <strong>+ 180 pts</strong>
              </div>
              <ul className="score-list">
                <li><span>🚲 Biked</span><strong>+40</strong></li>
                <li><span>🥗 Plant meal</span><strong>+25</strong></li>
                <li><span>🚌 Bus ride</span><strong>+30</strong></li>
              </ul>
              <div className="score-progress">
                <div className="bar"><div className="fill" style={{ width: "45%" }} /></div>
                <div className="bar-caption"><span>Goal</span><strong>45%</strong></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Very light “focus areas” strip */}
      <section id="features" className="pp-section">
        <div className="pp-container feature-row">
          <div className="feature-pill">📊 Track</div>
          <div className="feature-pill">🎯 Weekly goal</div>
          <div className="feature-pill">🏆 Leaderboard</div>
          <div className="feature-pill">🐣 Pet (later)</div>
          <div className="feature-pill">� barcode scan (later)</div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pp-footer">
        <div className="pp-container footer-grid">
          <div className="foot-brand">
            <span className="pp-logo" aria-hidden>🌍</span>
            <strong>Planet Points</strong>
          </div>
          <span className="muted">Concept preview</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
