import "./App.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
    const navigate = useNavigate();
    
    // Form state management
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Navigation handler for brand logo
    const goHome = () => navigate('/');
    
    // Set dark theme on component mount
    useEffect(() => { 
        document.documentElement.setAttribute("data-theme", "dark"); 
    }, []);

    /**
     * Handles login form submission
     * Sends credentials to /api/login endpoint with API key authentication
     * On success: redirects to home page with active session
     * On failure: displays error message to user
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); // Clear any previous errors
        setLoading(true);

        try {
            // Send login request with credentials and API key
            const response = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": import.meta.env.VITE_API_KEY || "",
                },
                credentials: "include", 
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            // Handle unsuccessful login attempts
            if (!response.ok) {
                setError(data.message || "Login failed");
                setLoading(false);
                return;
            }

            // Successful login - redirect to home page
            navigate("/");
        } catch (err) {
            setError("An error occurred. Please try again.");
            setLoading(false);
        }
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

                    <form className="pp-card" style={{ display: "grid", gap: 10 }} onSubmit={handleSubmit}>
                        {/* Error message display - only shown when error exists */}
                        {error && (
                            <div style={{ 
                                padding: "10px", 
                                backgroundColor: "rgba(255, 0, 0, 0.1)", 
                                border: "1px solid rgba(255, 0, 0, 0.3)",
                                borderRadius: "4px",
                                color: "#ff6b6b"
                            }}>
                                {error}
                            </div>
                        )}
                        
                        {/* Email input field */}
                        <label>
                            Email
                            <input 
                                type="email" 
                                className="pp-input" 
                                placeholder="you@example.com" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required 
                                disabled={loading} // Disable during submission
                            />
                        </label>
                        
                        {/* Password input field */}
                        <label>
                            Password
                            <input 
                                type="password" 
                                className="pp-input" 
                                placeholder="••••••••" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required 
                                disabled={loading} // Disable during submission
                            />
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