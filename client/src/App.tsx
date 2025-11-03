import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import "./App.css";

type Theme = "light" | "dark";
type TabKey = "overview" | "dashboard" | "leaderboard" | "quizzes" | "account";
type ActivityType = "recycling" | "temperature" | "transport" | null;

interface ActivityLog {
  type: string;
  value: number;
  unit: string;
  timestamp: Date;
  points: number;
}

function App() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<Theme>("dark");
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<ActivityType>(null);
  const [activityValue, setActivityValue] = useState("");
  const [tempUnit, setTempUnit] = useState<"F" | "C">("F");
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (isLoggedIn) {
      setActiveTab("dashboard");
    } else {
      setActiveTab("overview");
    }
  }, [isLoggedIn]);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const goLogin = () => navigate('/login');

  const openActivityLog = (type: ActivityType) => {
    setCurrentActivity(type);
    setActivityValue("");
    setShowActivityModal(true);
  };

  const closeActivityModal = () => {
    setShowActivityModal(false);
    setCurrentActivity(null);
    setActivityValue("");
  };

  const calculatePoints = (type: ActivityType, value: number): number => {
    switch (type) {
      case "recycling":
        return value * 5;
      case "temperature":
        { const tempF = tempUnit === "F" ? value : ((value * 9) / 5) + 32;
        if (tempF >= 65 && tempF <= 72) return 20;
        if (tempF >= 60 && tempF <= 75) return 10;
        return 5;}
      case "transport":
        return value * 10;
      default:
        return 0;
    }
  };

  const submitActivity = () => {
    if (!activityValue || !currentActivity) return;

    const value = parseFloat(activityValue);
    if (isNaN(value) || value <= 0) {
      alert("Please enter a valid positive number");
      return;
    }

    const points = calculatePoints(currentActivity, value);
    
    let unit = "";
    let displayType = "";
    
    switch (currentActivity) {
      case "recycling":
        unit = value === 1 ? "unit" : "units";
        displayType = "Recycling";
        break;
      case "temperature":
        unit = `°${tempUnit}`;
        displayType = "Temperature Set";
        break;
      case "transport":
        unit = value === 1 ? "mile" : "miles";
        displayType = "Eco-Transport";
        break;
    }

    const newLog: ActivityLog = {
      type: displayType,
      value,
      unit,
      timestamp: new Date(),
      points
    };

    setActivityLogs([newLog, ...activityLogs]);
    setTotalPoints(totalPoints + points);
    closeActivityModal();
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActivityLogs([]);
    setTotalPoints(0);
  };

  return (
    <div className="pp-app">
      {/* Dev Toggle */}
      <div className="pp-dev-toggle" onClick={() => setIsLoggedIn(!isLoggedIn)}>
        DEV: {isLoggedIn ? "Logged In" : "Logged Out"}
      </div>

      {/* Top Bar / Nav */}
      <header className="pp-nav">
        <div className="pp-container pp-navbar">
          <div className="pp-brand">
            <span className="pp-logo" aria-hidden>🌍</span>
            <span className="pp-title">Planet Points</span>
          </div>

          <div className="pp-actions">
            <button className="pp-btn ghost" onClick={toggleTheme}>
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            {isLoggedIn ? (
              <>
                <span className="pp-points-badge">
                  {totalPoints} pts
                </span>
                <button className="pp-btn primary" onClick={handleLogout}>Sign out</button>
              </>
            ) : (
              <button className="pp-btn primary" onClick={goLogin}>Login</button>
            )}
          </div>
        </div>
      </header>

      {/* Layout with Sidebar */}
      <div className="pp-layout">
        {/* Left Sidebar Navigation */}
        {isLoggedIn && (
          <aside className="pp-sidebar">
            <nav className="pp-sidebar-nav">
              <button
                className={`pp-sidebar-item ${activeTab === "dashboard" ? "active" : ""}`}
                onClick={() => setActiveTab("dashboard")}
              >
                <span className="pp-sidebar-icon">📊</span>
                <span>Dashboard</span>
              </button>
              <button
                className={`pp-sidebar-item ${activeTab === "leaderboard" ? "active" : ""}`}
                onClick={() => setActiveTab("leaderboard")}
              >
                <span className="pp-sidebar-icon">🏆</span>
                <span>Leaderboard</span>
              </button>
              <button
                className={`pp-sidebar-item ${activeTab === "quizzes" ? "active" : ""}`}
                onClick={() => setActiveTab("quizzes")}
              >
                <span className="pp-sidebar-icon">📝</span>
                <span>Quizzes</span>
              </button>
              <button
                className={`pp-sidebar-item ${activeTab === "account" ? "active" : ""}`}
                onClick={() => setActiveTab("account")}
              >
                <span className="pp-sidebar-icon">⚙️</span>
                <span>Account</span>
              </button>
            </nav>
          </aside>
        )}

        {/* Main Content Area */}
        <main className="pp-main-content">
          <div className="pp-content-wrapper">
            {/* LOGGED OUT: Overview */}
            {!isLoggedIn && activeTab === "overview" && (
              <div className="pp-page">
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
                <div className="pp-cta">
                  <button className="pp-btn primary" onClick={goLogin}>Create an account / Login</button>
                </div>
              </div>
            )}

            {/* LOGGED IN: Dashboard */}
            {isLoggedIn && activeTab === "dashboard" && (
              <div className="pp-page">
                <h2 className="pp-h2">Daily Activity Logger</h2>
                <p className="pp-muted">Log your sustainable actions today to earn points</p>
                
                <div className="pp-cards">
                  <article className="pp-card pp-activity-card" onClick={() => openActivityLog("recycling")}>
                    <h3>♻️ Recycling</h3>
                    <p>Log items recycled today</p>
                    <button className="pp-btn primary pp-activity-btn">
                      Log Activity
                    </button>
                  </article>
                  
                  <article className="pp-card pp-activity-card" onClick={() => openActivityLog("temperature")}>
                    <h3>🌡️ Temperature</h3>
                    <p>Set your home temperature</p>
                    <button className="pp-btn primary pp-activity-btn">
                      Log Activity
                    </button>
                  </article>
                  
                  <article className="pp-card pp-activity-card" onClick={() => openActivityLog("transport")}>
                    <h3>🚶 Eco-Transport</h3>
                    <p>Miles by foot/bus/carpool</p>
                    <button className="pp-btn primary pp-activity-btn">
                      Log Activity
                    </button>
                  </article>
                </div>
              </div>
            )}

            {/* LOGGED IN: Account */}
            {isLoggedIn && activeTab === "account" && (
              <div className="pp-page">
                <h2 className="pp-h2">Account Settings</h2>
                <p className="pp-muted">Manage your profile and preferences</p>
                <div className="pp-cards">
                  <div className="pp-card">
                    <h3>Profile Information</h3>
                    <p>Username: eco_warrior_2025</p>
                    <p>Total Points: {totalPoints}</p>
                    <p>Member since: October 2025</p>
                  </div>
                  <div className="pp-card">
                    <h3>Preferences</h3>
                    <p>Email notifications: Enabled</p>
                    <p>Theme: {theme === "dark" ? "Dark" : "Light"}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Leaderboard Tab */}
            {activeTab === "leaderboard" && (
              <div className="pp-page">
                <h2 className="pp-h2">Leaderboard</h2>
                {!isLoggedIn ? (
                  <>
                    <p className="pp-muted">See who's leading the charge. Log in to view and join your groups.</p>
                    <div className="pp-cta-row">
                      <button className="pp-btn" onClick={() => alert("Navigate to public leaderboard preview")}>
                        View public preview
                      </button>
                      <button className="pp-btn primary" onClick={goLogin}>Login to join</button>
                    </div>
                  </>
                ) : (
                  <p>Your leaderboard component will go here</p>
                )}
              </div>
            )}

            {/* Quizzes Tab */}
            {activeTab === "quizzes" && (
              <div className="pp-page">
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
                  <p>Your quizzes component will go here</p>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar - Activity Feed */}
        {isLoggedIn && (
          <aside className="pp-activity-feed">
            <h3 className="pp-feed-title">Recent Activities</h3>
            {activityLogs.length > 0 ? (
              <div className="pp-activity-list">
                {activityLogs.map((log, idx) => (
                  <div key={idx} className="pp-activity-item">
                    <div className="pp-activity-content">
                      <div>
                        <strong>{log.type}</strong>
                        <div className="pp-activity-value">
                          {log.value} {log.unit}
                        </div>
                        <div className="pp-activity-timestamp">
                          {log.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="pp-activity-points">
                        +{log.points}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="pp-muted pp-feed-empty">No activities logged yet. Start tracking your sustainable actions!</p>
            )}
          </aside>
        )}
      </div>

      {/* Activity Submission Modal */}
      {showActivityModal && (
        <div className="pp-modal-overlay" onClick={closeActivityModal}>
          <div className="pp-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="pp-modal-title">
              {currentActivity === "recycling" && "♻️ Log Recycling"}
              {currentActivity === "temperature" && "🌡️ Log Temperature"}
              {currentActivity === "transport" && "🚶 Log Eco-Transport"}
            </h3>
            
            <div className="pp-modal-field">
              <label className="pp-modal-label">
                {currentActivity === "recycling" && "Number of units recycled:"}
                {currentActivity === "temperature" && "Temperature set in your home:"}
                {currentActivity === "transport" && "Miles travelled (foot/bus/carpool):"}
              </label>
              <input
                type="number"
                value={activityValue}
                onChange={(e) => setActivityValue(e.target.value)}
                placeholder="Enter value"
                className="pp-modal-input"
                autoFocus
              />
            </div>

            {currentActivity === "temperature" && (
              <div className="pp-modal-field">
                <label className="pp-modal-label">Unit:</label>
                <div className="pp-unit-toggle">
                  <button
                    className={`pp-btn ${tempUnit === "F" ? "primary" : ""}`}
                    onClick={() => setTempUnit("F")}
                  >
                    Fahrenheit
                  </button>
                  <button
                    className={`pp-btn ${tempUnit === "C" ? "primary" : ""}`}
                    onClick={() => setTempUnit("C")}
                  >
                    Celsius
                  </button>
                </div>
              </div>
            )}

            <div className="pp-modal-actions">
              <button className="pp-btn" onClick={closeActivityModal}>
                Cancel
              </button>
              <button className="pp-btn primary" onClick={submitActivity}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;