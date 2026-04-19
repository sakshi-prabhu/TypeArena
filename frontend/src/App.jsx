import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import Home from "./pages/Home";
import Practice from "./pages/Practice";
import Battle from "./pages/Battle";
import Profile from "./pages/Profile";
import Auth from "./auth/Auth";
import { auth } from "./firebase";
import { ensureUserProfile } from "./auth/authService";

function AppContent() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [pendingRoute, setPendingRoute] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        await ensureUserProfile(currentUser);
      }
    });

    return () => unsubscribe();
  }, []);

  const requestProtectedRoute = (path) => {
    if (user) {
      navigate(path);
      return;
    }

    setPendingRoute(path);
    setShowAuth(true);
  };

  const closeAuth = () => {
    setShowAuth(false);
    setPendingRoute("");
  };

  const handleAuthSuccess = (authedUser) => {
    setUser(authedUser);
    setShowAuth(false);

    if (pendingRoute) {
      navigate(pendingRoute);
      setPendingRoute("");
    }
  };

  return (
    <>
      {showAuth && (
        <Auth onClose={closeAuth} onSuccess={handleAuthSuccess} />
      )}

      <Routes>
        <Route
          path="/"
          element={<Home onProtectedNavigate={requestProtectedRoute} />}
        />

        <Route path="/practice" element={<Practice />} />
        <Route path="/battle" element={<Battle />} />
        <Route path="/battle/:roomId" element={<Battle />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;