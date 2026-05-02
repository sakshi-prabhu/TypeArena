
import "../styles/style.css";
import ThemeToggle from "../components/ThemeToggle";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { subscribeToUserProfile } from "../auth/authService";
import { collection, onSnapshot } from "firebase/firestore";

function calculateScore(wpm, accuracy) {
  return Number(wpm || 0) * (Number(accuracy || 0) / 100);
}

function Home({ onProtectedNavigate }) {
  const [user, setUser] = useState(null);

  const [profile, setProfile] = useState({
    username: "",
    bestWpm: 0,
    bestAccuracy: 0,
    score: 0,
    streak: 0,
    battlesPlayed: 0,
  });

  const [leaderboard, setLeaderboard] = useState([]);
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToUserProfile(user.uid, (profileData) => {
      setProfile({
        username: profileData?.username || user.displayName || "Player",
        bestWpm: Number(profileData?.bestWpm || 0),
        bestAccuracy: Number(profileData?.bestAccuracy || 0),
        score: calculateScore(profileData?.bestWpm, profileData?.bestAccuracy),
        streak: Number(profileData?.streak || 0),
        battlesPlayed: Number(profileData?.battlesPlayed || 0),
      });
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const users = snapshot.docs.map((doc) => {
          const data = doc.data();
          const bestWpm = Number(data.bestWpm || 0);
          const bestAccuracy = Number(data.bestAccuracy || 0);
          return {
            id: doc.id,
            username: data.username || "Player",
            bestWpm,
            bestAccuracy,
            score: calculateScore(bestWpm, bestAccuracy),
          };
        });
        users.sort((a, b) => b.score - a.score);
        setLeaderboard(users.map((u, index) => ({ ...u, rank: index + 1 })));
      },
      (error) => {
        console.error("Leaderboard error:", error);
      }
    );
    return () => unsubscribe();
  }, []);

  const top3 = leaderboard.slice(0, 3);

  return (
    <>
      <ThemeToggle />
      <button
        className="profile-btn"
        type="button"
        aria-label="Open profile"
        onClick={() => onProtectedNavigate("/profile")}
      >
        <span className="material-symbols-outlined">person</span>
      </button>

      <div className="home-page">

        {/* ── Left column ── */}
        <div className="home-left">
          <div className="hero">
            <h1 className="main-heading">Welcome to TypeArena</h1>
            <p className="hero-sub">Type fast. Battle friends. Climb the ranks.</p>
            <div className="actions">
              <button
                onClick={() => onProtectedNavigate("/practice")}
                id="practice-btn"
              >
                Practice
              </button>
              <button
                onClick={() => onProtectedNavigate("/battle")}
                id="battle-btn"
              >
                Battle
              </button>
            </div>
          </div>

          <div className="stat-cards">
            <div className="stat-card">
              <span className="stat-icon">🔥</span>
              <span className="stat-value">{user ? profile.streak : "—"}</span>
              <span className="stat-label">Day Streak</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon">⚔️</span>
              <span className="stat-value">{user ? profile.battlesPlayed : "—"}</span>
              <span className="stat-label">Battles</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon">⚡</span>
              <span className="stat-value">{user ? profile.bestWpm : "—"}</span>
              <span className="stat-label">Best WPM</span>
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="home-right">
          <div className="lb-panel">
            <div className="lb-panel-header">
              <span className="lb-trophy-icon">🏆</span>
              <h2 className="lb-heading">Leaderboard</h2>
            </div>

            {leaderboard.length === 0 ? (
              <div className="lb-empty-state">No players yet</div>
            ) : (
              <>
                <div className="podium">

                  {/* Silver — 2nd */}
                  {top3[1] ? (
                    <div className="podium-slot">
                      <div className="podium-info silver-info">
                        <span className="podium-medal">🥈</span>
                        <span className="podium-username">{top3[1].username}</span>
                        <span className="podium-wpm">
                          {top3[1].bestWpm}
                          <span className="wpm-unit"> wpm</span>
                        </span>
                      </div>
                      <div className="podium-stand stand-2">2nd</div>
                    </div>
                  ) : (
                    <div className="podium-slot podium-slot-empty" />
                  )}

                  {/* Gold — 1st */}
                  {top3[0] && (
                    <div className="podium-slot">
                      <span className="podium-crown">👑</span>
                      <div className="podium-info gold-info">
                        <span className="podium-medal">🥇</span>
                        <span className="podium-username">{top3[0].username}</span>
                        <span className="podium-wpm">
                          {top3[0].bestWpm}
                          <span className="wpm-unit"> wpm</span>
                        </span>
                      </div>
                      <div className="podium-stand stand-1">1st</div>
                    </div>
                  )}

                  {/* Bronze — 3rd */}
                  {top3[2] ? (
                    <div className="podium-slot">
                      <div className="podium-info bronze-info">
                        <span className="podium-medal">🥉</span>
                        <span className="podium-username">{top3[2].username}</span>
                        <span className="podium-wpm">
                          {top3[2].bestWpm}
                          <span className="wpm-unit"> wpm</span>
                        </span>
                      </div>
                      <div className="podium-stand stand-3">3rd</div>
                    </div>
                  ) : (
                    <div className="podium-slot podium-slot-empty" />
                  )}

                </div>

                <button
                  className="view-all-btn"
                  onClick={() => setShowFullLeaderboard(true)}
                >
                  View Full Leaderboard ↗
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Full Leaderboard Modal */}
      {showFullLeaderboard && (
        <div
          className="lb-overlay"
          onClick={() => setShowFullLeaderboard(false)}
        >
          <div className="lb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lb-modal-top">
              <h2 className="lb-modal-title">🏆 Full Leaderboard</h2>
              <button
                className="lb-close-btn"
                onClick={() => setShowFullLeaderboard(false)}
                aria-label="Close leaderboard"
              >
                ✕
              </button>
            </div>

            <div className="lb-col-headers">
              <span>Rank</span>
              <span>Username</span>
              <span>WPM</span>
              <span>Accuracy</span>
            </div>

            <div className="lb-rows">
              {leaderboard.slice(0, 250).map((entry) => (
                <div
                  key={entry.id}
                  className={`lb-row${entry.rank === 1 ? " row-gold" : entry.rank === 2 ? " row-silver" : entry.rank === 3 ? " row-bronze" : ""}`}
                >
                  <span className="row-rank">#{entry.rank}</span>
                  <span className="row-name">{entry.username}</span>
                  <span>{entry.bestWpm}</span>
                  <span>{entry.bestAccuracy}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Home;
