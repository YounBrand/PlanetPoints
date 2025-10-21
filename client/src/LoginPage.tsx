import "./App.css";
import { useEffect } from "react";

export default function LoginPage() {

    useEffect(() => { document.documentElement.setAttribute("data-theme", "dark"); }, []);
    
    const goHome = () => (window.location.href = "/");

    return (
        <div className="pp-app">
        <header className="pp-nav">
            <div className="pp-container pp-navbar">
            <div className="pp-brand" onClick={goHome} style={{ cursor: "pointer" }}>
                <span className="pp-logo" aria-hidden>🌍</span>
                <span className="pp-title">Planet Points</span>
            </div>
            </div>
        </header>

        <main className="pp-container pp-main">
            <section className="pp-pane" style={{ maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
            <h2 className="pp-h2">Welcome Back</h2>
            <p className="pp-muted">Log in to track your progress and earn Planet Points.</p>

            <form className="pp-card" style={{ display: "grid", gap: 10 }}>
                <label>
                Email
                <input type="email" className="pp-input" placeholder="you@example.com" required />
                </label>
                <label>
                Password
                <input type="password" className="pp-input" placeholder="••••••••" required />
                </label>
                <button className="pp-btn primary" type="submit">Log In</button>
                <p className="pp-muted">
                Don’t have an account?{" "}
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