import "../styles/style.css";
import ThemeToggle from "../components/ThemeToggle";

function Home({ onProtectedNavigate }) {
  const handleProtectedNavigation = (path) => {
    onProtectedNavigate(path);
  };

  return (
    <>
      <ThemeToggle />

      {/* Profile Button */}
      <button
        className="profile-btn"
        type="button"
        aria-label="Open profile"
        onClick={() => handleProtectedNavigation("/profile")}
      >
        <span className="material-symbols-outlined">person</span>
      </button>

      {/* Home Page */}
      <div className="home-page">
        <div className="home-card">
          <h1>Welcome to TypeArena</h1>
          <p>Your ultimate typing challenge platform!</p>

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
      </div>
    </>
  );
}

export default Home;