import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import "../styles/profile.css";
import ThemeToggle from "../components/ThemeToggle";
import { auth } from "../firebase";
import { subscribeToUserProfile, updateUserProfile } from "../auth/authService";

const defaultProfile = {
  username: "Guest",
  bestWpm: 0,
  bestAccuracy: 0,
  battlesPlayed: 0,
  streak: 0,
};

function normalizeProfile(profileData, user) {
  return {
    username:
      profileData?.username ||
      user?.displayName ||
      user?.email?.split("@")[0] ||
      "User",
    bestWpm:      Number(profileData?.bestWpm      || 0),
    bestAccuracy: Number(profileData?.bestAccuracy || 0),
    battlesPlayed: Number(profileData?.battlesPlayed || 0),
    streak:        Number(profileData?.streak        || 0),
  };
}

export default function Profile() {
  const navigate = useNavigate();

  const [user, setUser]           = useState(null);
  const [profile, setProfile]     = useState(defaultProfile);
  const [draftProfile, setDraftProfile] = useState(defaultProfile);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToUserProfile(user.uid, (profileData) => {
      const next = normalizeProfile(profileData, user);
      setProfile(next);
      setDraftProfile((curr) => (isEditing ? curr : next));
    });
    return () => unsubscribe();
  }, [user, isEditing]);

  const display      = user ? profile      : defaultProfile;
  const displayDraft = user ? draftProfile : defaultProfile;

  const saveProfile = async () => {
    if (!user) return;
    const nextUsername = draftProfile.username.trim() || "User";
    await updateUserProfile(user.uid, { username: nextUsername });
    setProfile((p) => ({ ...p, username: nextUsername }));
    setDraftProfile((p) => ({ ...p, username: nextUsername }));
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setDraftProfile(profile);
    setIsEditing(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const avatarLetter = display.username.charAt(0).toUpperCase();

  return (
    <div className="profile-page">
      <ThemeToggle />

      <div className="profile-card">

        {/* ── Identity ── */}
        <div className="profile-identity">
          <div className="profile-avatar">{avatarLetter}</div>

          {isEditing ? (
            <div className="identity-edit">
              <input
                type="text"
                value={displayDraft.username}
                onChange={(e) =>
                  setDraftProfile((p) => ({ ...p, username: e.target.value }))
                }
                className="profile-input profile-name-input"
                maxLength={24}
                autoFocus
              />
              <div className="identity-edit-actions">
                <button type="button" className="mini-btn" onClick={saveProfile}>
                  Save
                </button>
                <button
                  type="button"
                  className="mini-btn mini-btn-secondary"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="identity-display">
              <span className="profile-name">{display.username}</span>
              <button
                type="button"
                className="edit-link"
                onClick={() => user && setIsEditing(true)}
              >
                Edit username
              </button>
            </div>
          )}
        </div>

        {/* ── Stats ── */}
        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-val">{display.bestWpm}</span>
            <span className="stat-key">Best WPM</span>
          </div>
          <div className="stat-item">
            <span className="stat-val">
              {display.bestAccuracy > 0 ? `${display.bestAccuracy}%` : "—"}
            </span>
            <span className="stat-key">Best Accuracy</span>
          </div>
          <div className="stat-item">
            <span className="stat-val">{display.battlesPlayed}</span>
            <span className="stat-key">Battles</span>
          </div>
          <div className="stat-item">
            <span className="stat-val">{display.streak || "—"}</span>
            <span className="stat-key">Day Streak</span>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="profile-footer">
          <button type="button" className="back-btn" onClick={() => navigate("/")}>
            ← Back to Home
          </button>
          {user && (
            <button type="button" className="sign-out-btn" onClick={handleSignOut}>
              Sign Out
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
