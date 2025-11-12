import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
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
  const location = useLocation();
  const [theme, setTheme] = useState<Theme>("dark");
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<ActivityType>(null);
  const [activityValue, setActivityValue] = useState("");
  const [tempUnit, setTempUnit] = useState<"F" | "C">("F");
  const [totalPoints, setTotalPoints] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  // ------------------ AUTH CHECK ------------------
  const checkAuthStatus = async () => {
    setIsCheckingAuth(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/auth/status`,
        {
          withCredentials: true,
          headers: {
            "x-api-key": import.meta.env.VITE_API_KEY || "",
          },
        }
      );

      if (response.data.loggedIn) {
        setIsLoggedIn(true);
        setUserId(response.data.user?._id || null);
        console.log("User is logged in:", response.data.user);
      } else {
        setIsLoggedIn(false);
        setUserId(null);
      }
    } catch (error) {
      console.error("Auth status check failed:", error);
      setIsLoggedIn(false);
      setUserId(null);
    } finally {
      setIsCheckingAuth(false);
    }
  };
  // ------------------------------------------------

  useEffect(() => {
    checkAuthStatus();
  }, [location]);

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
  const goLogin = () => navigate("/login");

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

  const mapActivityType = (frontendType: ActivityType): string => {
    switch (frontendType) {
      case "recycling":
        return "RecycleBoxes";
      case "temperature":
        return "RoomTemperature";
      case "transport":
        return "MilesTravelled";
      default:
        return "";
    }
  };

  const fetchDailyScore = async () => {
    if (!userId) return;
    try {
      const today = new Date().toISOString();
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/activities/calculate-daily`,
        {
          params: { userId, date: today },
          headers: { "x-api-key": import.meta.env.VITE_API_KEY || "" },
          withCredentials: true,
        }
      );
      if (res.status === 200) {
        setTotalPoints(res.data.totalPoints ?? 0.0);
      }
    } catch (err) {
      console.error("Error fetching daily score:", err);
    }
  };

  useEffect(() => {
    if (isLoggedIn && userId) {
      fetchDailyScore();
    }
  }, [isLoggedIn, userId]);

  const submitActivity = async () => {
    if (!activityValue || !currentActivity) return;

    const value = parseFloat(activityValue);
    if (isNaN(value) || value <= 0) {
      alert("Please enter a valid positive number");
      return;
    }

    if (userId) {
      const backendActivity = mapActivityType(currentActivity);
      try {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/activities/log-daily`,
          {
            userId,
            activity: backendActivity,
            unit: value,
          },
          {
            withCredentials: true,
            headers: {
              "x-api-key": import.meta.env.VITE_API_KEY || "",
            },
          }
        );

        console.log("Activity logged to backend");
        await fetchDailyScore();
      } catch (err) {
        console.error("Error logging activity:", err);
      }
    }

    closeActivityModal();
  };

  const handleLogout = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/logout`,
        {},
        {
          withCredentials: true,
          headers: {
            "x-api-key": import.meta.env.VITE_API_KEY || "",
          },
        }
      );
      console.log("Logout successful (server)");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUserId(null);
      setIsLoggedIn(false);
      setTotalPoints(0);
      setShowActivityModal(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div
        className="pp-app"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <span className="pp-logo" style={{ fontSize: "3rem" }}>
            🌍
          </span>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pp-app">
      {/* NAVBAR */}
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
                  {totalPoints.toFixed(1)} pts
                </span>
                <button className="pp-btn primary" onClick={handleLogout}>
                  Sign out
                </button>
              </>
            ) : (
              <button className="pp-btn primary" onClick={goLogin}>
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="pp-layout">
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

        <main className="pp-main-content">
          <div className="pp-content-wrapper">
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
                  <button className="pp-btn primary" onClick={goLogin}>
                    Create an account / Login
                  </button>
                </div>
              </div>
            )}

            {/* DASHBOARD */}
            {isLoggedIn && activeTab === "dashboard" && (
              <div className="pp-page">
                <h2 className="pp-h2">Daily Activity Logger</h2>
                <p className="pp-muted">Log your sustainable actions today to earn points</p>
                <div className="pp-cards">
                  <article className="pp-card pp-activity-card" onClick={() => openActivityLog("recycling")}>
                    <h3>♻️ Recycling</h3>
                    <p>Log items recycled today</p>
                    <button className="pp-btn primary pp-activity-btn">Log Activity</button>
                  </article>
                  <article className="pp-card pp-activity-card" onClick={() => openActivityLog("temperature")}>
                    <h3>🌡️ Temperature</h3>
                    <p>Set your home temperature</p>
                    <button className="pp-btn primary pp-activity-btn">Log Activity</button>
                  </article>
                  <article className="pp-card pp-activity-card" onClick={() => openActivityLog("transport")}>
                    <h3>🚶 Eco-Transport</h3>
                    <p>Miles by foot/bus/carpool</p>
                    <button className="pp-btn primary pp-activity-btn">Log Activity</button>
                  </article>
                </div>
              </div>
            )}

            {/* ACCOUNT */}
            {isLoggedIn && activeTab === "account" && (
              <div className="pp-page">
                <h2 className="pp-h2">Account Settings</h2>
                <p className="pp-muted">Manage your profile and preferences</p>
                <div className="pp-cards">
                  <div className="pp-card">
                    <h3>Profile Information</h3>
                    <p>Username: eco_warrior_2025</p>
                    <p>Total Points: {totalPoints.toFixed(1)}</p>
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

            {/* LEADERBOARD */}
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
                      <button className="pp-btn primary" onClick={goLogin}>
                        Login to join
                      </button>
                    </div>
                  </>
                ) : (
                  <p>Your leaderboard component will go here</p>
                )}
              </div>
            )}

            {/* QUIZZES */}
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
                      <button className="pp-btn primary" onClick={goLogin}>
                        Login to start
                      </button>
                    </div>
                  </>
                ) : (
                  <p>Your quizzes component will go here</p>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ACTIVITY MODAL */}
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
