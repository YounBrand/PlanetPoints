import "./App.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function RegisterPage() {
  const navigate = useNavigate();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const goHome = () => navigate('/');
  const goLogin = () => navigate('/login');

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  const handleSubmitRegister = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    axios
      .post(
        `${import.meta.env.VITE_API_URL}/api/register`,
        {
          username,
          password,
          email,
          name: `${firstName} ${lastName}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { 
          withCredentials: true,
        }
      )
      .then((response) => {
        console.log("Registration successful:", response.data);
        navigate("/login", { replace: true });
      })
      .catch((error) => {
        console.error(
          "Registration failed:",
          error.response ? error.response.data : error.message
        );
        setErrorMessage(error.response?.data.message || "Registration failed");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="pp-app">
      {/* Navigation header */}
      <header className="pp-nav">
        <div className="pp-container pp-navbar">
          <div className="pp-brand" onClick={goHome} style={{ cursor: "pointer" }}>
            <span className="pp-logo" aria-hidden>🌍</span>
            <span className="pp-title">Planet Points</span>
          </div>
        </div>
      </header>

      {/* Main registration form section */}
      <main className="pp-container pp-main">
        <section className="pp-pane" style={{ maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
          <h2 className="pp-h2">Create Your Account</h2>
          <p className="pp-muted">Join Planet Points to start earning rewards for sustainability!</p>

          <form className="pp-card" style={{ display: "grid", gap: 10 }} onSubmit={handleSubmitRegister}>
            {errorMessage && (
              <div style={{ 
                padding: "10px", 
                backgroundColor: "rgba(255, 0, 0, 0.1)", 
                border: "1px solid rgba(255, 0, 0, 0.3)",
                borderRadius: "4px",
                color: "#ff6b6b"
              }}>
                {errorMessage}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <label style={{ flex: 1 }}>
                First Name
                <input 
                  type="text" 
                  className="pp-input" 
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required 
                  disabled={loading}
                />
              </label>
              <label style={{ flex: 1 }}>
                Last Name
                <input 
                  type="text" 
                  className="pp-input" 
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required 
                  disabled={loading}
                />
              </label>
            </div>

            <label>
              Username
              <input 
                type="text" 
                className="pp-input" 
                placeholder="Enter a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required 
                disabled={loading}
              />
            </label>

            <label>
              Email
              <input 
                type="email" 
                className="pp-input" 
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                disabled={loading}
              />
            </label>

            <label>
              Password
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className="pp-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  style={{ paddingRight: "40px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px 8px",
                    fontSize: "18px",
                    opacity: 0.7,
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
                  disabled={loading}
                >
                  {showPassword ? "🔓" : "🔒"}
                </button>
              </div>
            </label>

            <label>
              Confirm Password
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className="pp-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  style={{ paddingRight: "40px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px 8px",
                    fontSize: "18px",
                    opacity: 0.7,
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
                  disabled={loading}
                >
                  {showPassword ? "🔓" : "🔒"}
                </button>
              </div>
            </label>

            <button 
              className="pp-btn primary" 
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>

            <p className="pp-muted">
              Already have an account?{" "}
              <a onClick={goLogin} style={{ color: "var(--accent)", cursor: "pointer" }}>
                Log in here
              </a>
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}