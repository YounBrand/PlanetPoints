import { useEffect, useState } from "react";
import "./App.css";

type Theme = "light" | "dark";
type TabKey = "overview" | "leaderboard" | "quizzes";

function App() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  // Wire this to your auth later
  const [isLoggedIn] = useState(false);

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

  const goLogin = () => {
    // swap with your router navigate('/login') when ready
    window.location.href = "/login";
  };

  return (
    <div className="pp-app">
      {/* Top Bar / Nav */}
      <header className="pp-nav">
        <div className="pp-container pp-navbar">
          {/* Left: Brand */}
          <div className="pp-brand">
            <span className="pp-logo" aria-hidden>🌍</span>
            <span className="pp-title">Planet Points</span>
          </div>

          {/* Right: Actions */}
          <div className="pp-actions">
            <button className="pp-btn ghost" onClick={toggleTheme}>
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
            <button className="pp-btn primary" onClick={goLogin}>Login</button>
          </div>
        </div>
      </header>

      {/* Main content with centered Tabs */}
      <main className="pp-container pp-main">
        <section className="pp-tabs">
          <div role="tablist" aria-label="Explore Planet Points" className="pp-tablist">
            <button
              role="tab"
              aria-selected={activeTab === "overview"}
              className="pp-tab"
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "leaderboard"}
              className="pp-tab"
              onClick={() => setActiveTab("leaderboard")}
            >
              Leaderboard
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "quizzes"}
              className="pp-tab"
              onClick={() => setActiveTab("quizzes")}
            >
              Quizzes
            </button>
          </div>

          <div className="pp-tabpanes">
            {activeTab === "overview" && (
              <div role="tabpanel" className="pp-pane">
                <h2 className="pp-h2">What you can do</h2>
                <p className="pp-muted">
                  Track daily sustainable actions, compete on the leaderboard, and test your eco-knowledge with quick quizzes.
                </p>
                <div className="pp-cards">
                  <article className="pp-card">
                    <h3>Track Activities</h3>
                    <p>Log biking, recycling, reduced energy use, and more to earn points.</p>
                  </article>
                  <article className="pp-card">
                    <h3>Compete</h3>
                    <p>Climb the leaderboard with friends, clubs, and classes.</p>
                  </article>
                  <article className="pp-card">
                    <h3>Learn</h3>
                    <p>Take bite-sized quizzes to improve your sustainability score.</p>
                  </article>
                </div>
                {!isLoggedIn && (
                  <div className="pp-cta">
                    <button className="pp-btn primary" onClick={goLogin}>Create an account / Login</button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "leaderboard" && (
              <div role="tabpanel" className="pp-pane">
                <h2 className="pp-h2">Leaderboard</h2>
                {!isLoggedIn ? (
                  <>
                    <p className="pp-muted">See who’s leading the charge. Log in to view and join your groups.</p>
                    <div className="pp-cta-row">
                      <button className="pp-btn" onClick={() => alert("Navigate to public leaderboard preview")}>
                        View public preview
                      </button>
                      <button className="pp-btn primary" onClick={goLogin}>Login to join</button>
                    </div>
                  </>
                ) : (
                  <p>/* your leaderboard component here */</p>
                )}
              </div>
            )}

            {activeTab === "quizzes" && (
              <div role="tabpanel" className="pp-pane">
                <h2 className="pp-h2">Quizzes</h2>
                {!isLoggedIn ? (
                  <>
                    <p className="pp-muted">Test your eco-IQ. Log in to save progress and earn points.</p>
                    <div className="pp-cta-row">
                      <button className="pp-btn" onClick={() => alert("Navigate to quiz sample")}>
                        Try a sample quiz
                      </button>
                      <button className="pp-btn primary" onClick={goLogin}>Login to start</button>
                    </div>
                  </>
                ) : (
                  <p>/* your quizzes component here */</p>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
