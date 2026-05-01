
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
        score: calculateScore(
          profileData?.bestWpm,
          profileData?.bestAccuracy
        ),
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

      
        const rankedUsers = users.map((user, index) => ({
          ...user,
          rank: index + 1,
        }));

        setLeaderboard(rankedUsers);
      },
      (error) => {
        console.error("Leaderboard error:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleProtectedNavigation = (path) => {
    onProtectedNavigate(path);
  };

  return (
    <>
      <ThemeToggle />

      <button
        className="profile-btn"
        type="button"
        aria-label="Open profile"
        onClick={() => handleProtectedNavigation("/profile")}
      >
        <span className="material-symbols-outlined">person</span>
      </button>

      <div className="home-page">
        <h1 className="main-heading">Welcome to TypeArena</h1>
        <p>Your ultimate typing challenge platform!</p>

        <div className="home-card">
          <div className="actions">
            <button
              onClick={() => handleProtectedNavigation("/practice")}
              id="practice-btn"
            >
              Practice
            </button>

            <button
              onClick={() => handleProtectedNavigation("/battle")}
              id="battle-btn"
            >
              Battle
            </button>
          </div>
        </div>

      
        <div className="leaderboard leaderboard-floating">
          <h2>Leaderboard</h2>

          <div className="leaderboard-grid leaderboard-header">
            <span>Username</span>
            <span>WPM</span>
            <span>Accuracy</span>
            <span>Rank</span>
          </div>

          <div className="leaderboard-body">
            {leaderboard.length === 0 ? (
              <div className="leaderboard-empty">No players yet</div>
            ) : (
              leaderboard.slice(0, 25).map((user) => (
                <div key={user.id} className="leaderboard-row leaderboard-grid">
                  <span>{user.username}</span>
                  <span>{user.bestWpm}</span>
                  <span>{user.bestAccuracy}%</span>
                  <span>#{user.rank}</span>
                </div>
              ))
            )}
          </div>
        </div>

       
        <div className="leaderboard status-board status-floating">
          <div className="status-list">
            <div className="status-item">
              🔥 Streaks = {user ? profile.streak : "-"}
            </div>

            <div className="status-item">
              ⚔️ Battles Played = {user ? profile.battlesPlayed : "-"}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;

