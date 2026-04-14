import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [animating, setAnimating] = useState(false);
  const [displayIcon, setDisplayIcon] = useState(theme);

  useEffect(() => {
    setDisplayIcon(theme);
  }, [theme]);

  const handleClick = () => {
    setAnimating(true);

    // After the old icon sets (slides down), swap and rise
    setTimeout(() => {
      toggleTheme();
      setAnimating(false);
    }, 300);
  };

  const icon = displayIcon === "dark" ? "light_mode" : "dark_mode";

  return (
    <button
      className="theme-toggle"
      onClick={handleClick}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <span className="theme-toggle-horizon" />
      <span
        className={`theme-toggle-icon material-symbols-outlined ${animating ? "setting" : "rising"}`}
      >
        {icon}
      </span>
    </button>
  );
}
