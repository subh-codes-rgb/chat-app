import { useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  LockKeyhole,
  Monitor,
  Moon,
  Save,
  Share2,
  Sun,
  UserRound,
} from "lucide-react";

import api from "../api/axios";
import { useAuth } from "../context/useAuth";

function getErrorMessage(error) {
  const data = error.response?.data;
  if (data?.detail) return data.detail;
  if (data && typeof data === "object") {
    const firstError = Object.values(data).flat()[0];
    if (typeof firstError === "string") return firstError;
  }
  return "We couldn’t save your changes. Please try again.";
}

function Settings({ user, onProfileUpdated, onBack }) {
  const { themePreference, updateThemePreference } = useAuth();
  const [profile, setProfile] = useState({
    email: user?.email || "",
    display_name: user?.display_name || "",
    bio: user?.bio || "",
    avatar: user?.avatar || "",
  });
  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [linkMessage, setLinkMessage] = useState("");
  const [linkError, setLinkError] = useState("");
  const connectLink = `${window.location.origin}/connect/${encodeURIComponent(user?.username || "")}`;

  const changeProfile = (event) => {
    setProfile((current) => ({ ...current, [event.target.name]: event.target.value }));
    setProfileMessage("");
    setProfileError("");
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setProfileMessage("");
    setProfileError("");
    try {
      const { data } = await api.patch("accounts/me/", profile);
      onProfileUpdated(data);
      setProfileMessage("Your profile has been saved.");
    } catch (error) {
      setProfileError(getErrorMessage(error));
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = (event) => {
    setPasswords((current) => ({ ...current, [event.target.name]: event.target.value }));
    setPasswordMessage("");
    setPasswordError("");
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setSavingPassword(true);
    setPasswordMessage("");
    setPasswordError("");
    try {
      await api.post("accounts/password/", passwords);
      setPasswords({ current_password: "", new_password: "" });
      setPasswordMessage("Your password has been updated.");
    } catch (error) {
      setPasswordError(getErrorMessage(error));
    } finally {
      setSavingPassword(false);
    }
  };

  const copyConnectLink = async () => {
    setLinkMessage("");
    setLinkError("");
    try {
      await navigator.clipboard.writeText(connectLink);
      setLinkMessage("Connection link copied.");
    } catch {
      setLinkError("Couldn’t copy automatically. Select the link above and copy it.");
    }
  };

  const shareConnectLink = async () => {
    setLinkMessage("");
    setLinkError("");
    try {
      await navigator.share({
        title: `Connect with ${user?.display_name || user?.username} on Gather`,
        text: "Let’s chat on Gather.",
        url: connectLink,
      });
    } catch (error) {
      if (error.name !== "AbortError") {
        setLinkError("Couldn’t open the share sheet. You can copy the link instead.");
      }
    }
  };

  return (
    <section className="settings-page">
      <header className="settings-header">
        <button
          aria-label="Back to messages"
          className="icon-button settings-back"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <span className="eyebrow">YOUR SPACE</span>
          <h1>Settings</h1>
          <p>Manage your profile and account security.</p>
        </div>
      </header>

      <div className="settings-content">
        <section className="settings-card settings-card-wide">
          <div className="settings-card-heading">
            <span className="settings-icon"><Sun size={18} /></span>
            <div>
              <h2>Appearance</h2>
              <p>Choose how Gather looks on this device.</p>
            </div>
          </div>
          <div aria-label="Color theme" className="theme-options" role="group">
            {[
              { value: "light", label: "Light", Icon: Sun },
              { value: "dark", label: "Dark", Icon: Moon },
              { value: "system", label: "System", Icon: Monitor },
            ].map(({ value, label, Icon }) => (
              <button
                aria-pressed={themePreference === value}
                className={`theme-option${themePreference === value ? " selected" : ""}`}
                key={value}
                onClick={() => updateThemePreference(value)}
                type="button"
              >
                <Icon size={17} />
                <span>{label}</span>
                {themePreference === value && <Check size={15} />}
              </button>
            ))}
          </div>
        </section>

        <section className="settings-card settings-card-wide">
          <div className="settings-card-heading">
            <span className="settings-icon"><Share2 size={18} /></span>
            <div>
              <h2>Connect by link</h2>
              <p>Share your link so someone can start a chat with you.</p>
            </div>
          </div>
          <label className="settings-field">
            Your personal connection link
            <input aria-label="Your personal connection link" readOnly value={connectLink} />
            <small>Anyone who opens it and signs in will start a direct conversation with you.</small>
          </label>
          <div className="connect-link-actions">
            <button className="settings-submit" onClick={copyConnectLink} type="button">
              <Copy size={16} /> Copy link
            </button>
            {typeof navigator.share === "function" && (
              <button
                className="settings-submit secondary"
                onClick={shareConnectLink}
                type="button"
              >
                <Share2 size={16} /> Share…
              </button>
            )}
          </div>
          {linkError && <p className="settings-error" role="alert">{linkError}</p>}
          {linkMessage && (
            <p className="settings-success" role="status">
              <Check size={15} /> {linkMessage}
            </p>
          )}
        </section>

        <form className="settings-card" onSubmit={saveProfile}>
          <div className="settings-card-heading">
            <span className="settings-icon"><UserRound size={18} /></span>
            <div>
              <h2>Profile</h2>
              <p>Help people recognize you when they find you.</p>
            </div>
          </div>

          <label className="settings-field">
            Username
            <input disabled value={`@${user?.username || ""}`} />
            <small>Your username is how people can search for you.</small>
          </label>
          <label className="settings-field">
            Display name
            <input
              maxLength={100}
              name="display_name"
              onChange={changeProfile}
              placeholder="What should people call you?"
              value={profile.display_name}
            />
          </label>
          <label className="settings-field">
            Email address
            <input
              autoComplete="email"
              name="email"
              onChange={changeProfile}
              required
              type="email"
              value={profile.email}
            />
          </label>
          <label className="settings-field">
            About you
            <textarea
              maxLength={500}
              name="bio"
              onChange={changeProfile}
              placeholder="A little about yourself…"
              rows={3}
              value={profile.bio}
            />
          </label>
          <label className="settings-field">
            Profile photo URL
            <input
              name="avatar"
              onChange={changeProfile}
              placeholder="https://example.com/photo.jpg"
              type="url"
              value={profile.avatar}
            />
          </label>
          <p className="settings-privacy-note">
            Your display name, username, bio, and photo are visible to signed-in people
            who discover you.
          </p>
          {profileError && <p className="settings-error" role="alert">{profileError}</p>}
          {profileMessage && (
            <p className="settings-success" role="status">
              <Check size={15} /> {profileMessage}
            </p>
          )}
          <button className="settings-submit" disabled={savingProfile} type="submit">
            <Save size={16} />
            {savingProfile ? "Saving…" : "Save profile"}
          </button>
        </form>

        <form className="settings-card" onSubmit={savePassword}>
          <div className="settings-card-heading">
            <span className="settings-icon"><LockKeyhole size={18} /></span>
            <div>
              <h2>Password &amp; security</h2>
              <p>Choose a strong password you don’t use elsewhere.</p>
            </div>
          </div>
          <label className="settings-field">
            Current password
            <input
              autoComplete="current-password"
              minLength={1}
              name="current_password"
              onChange={changePassword}
              required
              type="password"
              value={passwords.current_password}
            />
          </label>
          <label className="settings-field">
            New password
            <input
              autoComplete="new-password"
              minLength={8}
              name="new_password"
              onChange={changePassword}
              required
              type="password"
              value={passwords.new_password}
            />
            <small>We’ll check your new password against the account security rules.</small>
          </label>
          {passwordError && <p className="settings-error" role="alert">{passwordError}</p>}
          {passwordMessage && (
            <p className="settings-success" role="status">
              <Check size={15} /> {passwordMessage}
            </p>
          )}
          <button className="settings-submit secondary" disabled={savingPassword} type="submit">
            <LockKeyhole size={16} />
            {savingPassword ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default Settings;
