import "./App.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function LoginPage() {
    const navigate = useNavigate();
    
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const goHome = () => navigate('/');
    
    useEffect(() => { 
        document.documentElement.setAttribute("data-theme", "dark"); 
    }, []);


    const handleSubmitLogin = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrorMessage(""); 
        setLoading(true);

        axios
            .post(
                `${import.meta.env.VITE_API_URL}/api/login`,
                { identity: email, password }, //expects 'identity' field (username or email)
                { 
                    withCredentials: true,
                    headers: {
                        "x-api-key": import.meta.env.VITE_API_KEY || "",
                    }
                }
            )
            .then((response) => {
                console.log("Login successful:", response.data);
                //successful login redirect to home page
                navigate("/", { replace: true });
            })
            .catch((error) => {
                console.error(
                    "Login failed:",
                    error.response ? error.response.data : error.message
                );
                //error message from server or fallback message
                setErrorMessage(error.response?.data.message || "Login failed");
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

            {/* Main login form section */}
            <main className="pp-container pp-main">
                <section className="pp-pane" style={{ maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
                    <h2 className="pp-h2">Welcome Back</h2>
                    <p className="pp-muted">Log in to track your progress and earn Planet Points.</p>

                    <form className="pp-card" style={{ display: "grid", gap: 10 }} onSubmit={handleSubmitLogin}>
                        {/* Error message display - only shown when error exists */}
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
                        
                        {/* Username/Email input field */}
                        <label>
                            Username/Email
                            <input 
                                type="text" 
                                className="pp-input" 
                                placeholder="username or email" 
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
                                        transition: "opacity 0.2s"
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                                    onMouseLeave={(e) => e.currentTarget.style.opacity = "0.7"}
                                    disabled={loading}
                                >
                                    {showPassword ? "🔓" : "🔒"}
                                </button>
                            </div>
                        </label>
                        
                        {/* Submit button with loading state */}
                        <button 
                            className="pp-btn primary" 
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? "Logging in..." : "Log In"}
                        </button>
                        
                        {/* Registration link */}
                        <p className="pp-muted">
                            Don't have an account?{" "}
                            <a href="/register" style={{ color: "var(--accent)" }}>
                                Register here
                            </a>
                        </p>
                    </form>
                </section>
            </main>
        </div>
    );
}