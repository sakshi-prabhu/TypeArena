import { useEffect, useState } from "react";
import "../styles/auth.css";
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from "./authService";

const initialErrors = {
  email: "",
  password: "",
  general: "",
};

export default function Auth({ onClose, onSuccess }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState(initialErrors);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const close = () => {
    setErrors(initialErrors);
    onClose();
  };

  const runAuth = async (action) => {
    setLoading(true);
    setErrors(initialErrors);

    try {
      const user = await action();

      if (user) {
        onSuccess?.(user);
        close();
      }
    } catch (error) {
      const message = error?.message || "Authentication failed";
      setErrors((prev) => ({
        ...prev,
        general: message,
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      setErrors((prev) => ({
        ...prev,
        email: "Email is required",
      }));
      return;
    }

    if (password.length < 6) {
      setErrors((prev) => ({
        ...prev,
        password: "Password must be at least 6 characters",
      }));
      return;
    }

    if (mode === "login") {
      await runAuth(() => signInWithEmail(email, password));
      return;
    }

    await runAuth(() => signUpWithEmail(email, password));
  };

  if (!mode) return null;

  return (
    <div className="auth-overlay" onClick={close}>
      <div className="auth-modal" onClick={(event) => event.stopPropagation()}>
        <div className="auth-header">
          <div>
            <p className="auth-kicker">TypeArena</p>
            <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
          </div>

          <button type="button" className="auth-close" onClick={close} aria-label="Close authentication popup">
            ×
          </button>
        </div>

        <p className="auth-copy">
          {mode === "login"
            ? "Sign in to keep your typing progress in sync."
            : "Create an account to save your profile and battle stats."}
        </p>

        <button
          type="button"
          className="auth-google-btn"
          disabled={loading}
          onClick={() => runAuth(signInWithGoogle)}
        >
          Continue with Google
        </button>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="name@example.com"
            />
            {errors.email && <small>{errors.email}</small>}
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="Enter your password"
            />
            {errors.password && <small>{errors.password}</small>}
          </label>

          {errors.general && <p className="auth-error">{errors.general}</p>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
          </button>
        </form>

        <button
          type="button"
          className="auth-switch"
          onClick={() => {
            setMode((current) => (current === "login" ? "signup" : "login"));
            setErrors(initialErrors);
          }}
        >
          {mode === "login"
            ? "Need an account? Sign up"
            : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
}