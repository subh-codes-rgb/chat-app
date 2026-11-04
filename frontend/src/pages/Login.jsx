import { useState } from "react";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/useAuth";

function Login() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(formData.username.trim(), formData.password);
      navigate(location.state?.from?.pathname || "/home", { replace: true });
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "We couldn't sign you in. Check your username and password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-story">
        <Link className="brand brand-light" to="/">
          <span className="brand-mark"><MessageCircle size={19} /></span>
          <span>gather</span>
        </Link>
        <div className="story-copy">
          <span className="eyebrow">A little closer, every day</span>
          <h1>Good conversations make good days.</h1>
          <p>
            A calmer space for the people you care about. Pick up where you left
            off and make room for what matters.
          </p>
          <div className="story-note">
            <span className="story-note-icon"><MessageCircle size={16} /></span>
            <span>Thoughtful chats. Real connection.</span>
          </div>
        </div>
        <span className="story-orbit story-orbit-one" />
        <span className="story-orbit story-orbit-two" />
        <div className="story-footer">Your people are just a message away.</div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-mobile-brand brand">
          <span className="brand-mark"><MessageCircle size={19} /></span>
          <span>gather</span>
        </div>
        <div className="auth-form-wrap">
          <span className="eyebrow">Welcome back</span>
          <h2>Sign in to your space</h2>
          <p className="auth-subtitle">Your conversations are waiting for you.</p>
          {location.state?.message && (
            <p className="form-message form-success" role="status">
              {location.state.message}
            </p>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              <span>Username</span>
              <input
                autoComplete="username"
                name="username"
                onChange={(event) =>
                  setFormData({ ...formData, username: event.target.value })
                }
                placeholder="Your username"
                required
                value={formData.username}
              />
            </label>
            <label>
              <span>Password</span>
              <input
                autoComplete="current-password"
                name="password"
                onChange={(event) =>
                  setFormData({ ...formData, password: event.target.value })
                }
                placeholder="Your password"
                required
                type="password"
                value={formData.password}
              />
            </label>
            {error && <p className="form-message form-error" role="alert">{error}</p>}
            <button className="button button-primary auth-submit" disabled={loading}>
              {loading ? "Signing you in…" : "Sign in"}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          <p className="auth-switch">
            New to gather? <Link state={location.state} to="/register">Create an account</Link>
          </p>
        </div>
        <div className="auth-legal">A quieter corner of the internet.</div>
      </section>
    </main>
  );
}

export default Login;
