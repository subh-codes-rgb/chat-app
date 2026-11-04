import { useState } from "react";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/useAuth";

function getErrorMessage(error) {
  const data = error.response?.data;
  if (!data) return "Unable to connect to the server. Please try again.";
  return Object.entries(data)
    .map(([field, messages]) => {
      const value = Array.isArray(messages) ? messages.join(" ") : messages;
      return `${field === "non_field_errors" ? "Details" : field}: ${value}`;
    })
    .join(" ");
}

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    display_name: "",
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register({
        ...formData,
        display_name: formData.display_name.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
      });
      navigate("/login", {
        replace: true,
        state: { message: "Your account is ready. Sign in to start chatting." },
      });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
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
          <span className="eyebrow">Make space for your people</span>
          <h1>Every great friendship has a thousand little moments.</h1>
          <p>
            Start a new chapter with the people who make the ordinary feel
            special.
          </p>
          <div className="story-note">
            <span className="story-note-icon"><MessageCircle size={16} /></span>
            <span>Your conversations, all in one place.</span>
          </div>
        </div>
        <span className="story-orbit story-orbit-one" />
        <span className="story-orbit story-orbit-two" />
        <div className="story-footer">Thoughtful chats. Real connection.</div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-mobile-brand brand">
          <span className="brand-mark"><MessageCircle size={19} /></span>
          <span>gather</span>
        </div>
        <div className="auth-form-wrap">
          <span className="eyebrow">A good place to begin</span>
          <h2>Create your account</h2>
          <p className="auth-subtitle">It only takes a moment to get started.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              <span>Display name <small>Optional</small></span>
              <input
                autoComplete="name"
                maxLength={100}
                onChange={(event) =>
                  setFormData({ ...formData, display_name: event.target.value })
                }
                placeholder="How should we call you?"
                value={formData.display_name}
              />
            </label>
            <label>
              <span>Username</span>
              <input
                autoComplete="username"
                maxLength={150}
                onChange={(event) =>
                  setFormData({ ...formData, username: event.target.value })
                }
                placeholder="Choose a username"
                required
                value={formData.username}
              />
            </label>
            <label>
              <span>Email address</span>
              <input
                autoComplete="email"
                onChange={(event) =>
                  setFormData({ ...formData, email: event.target.value })
                }
                placeholder="you@example.com"
                required
                type="email"
                value={formData.email}
              />
            </label>
            <label>
              <span>Password</span>
              <input
                autoComplete="new-password"
                onChange={(event) =>
                  setFormData({ ...formData, password: event.target.value })
                }
                placeholder="At least 8 characters"
                required
                type="password"
                value={formData.password}
              />
            </label>
            {error && <p className="form-message form-error" role="alert">{error}</p>}
            <button className="button button-primary auth-submit" disabled={loading}>
              {loading ? "Creating your account…" : "Create account"}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
        <div className="auth-legal">A quieter corner of the internet.</div>
      </section>
    </main>
  );
}

export default Register;
