import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import "../styles/battle.css";
import { socket } from "../socket/socket";
import ThemeToggle from "../components/ThemeToggle";
import { auth } from "../firebase";
import { recordBattleResult } from "../auth/authService";

function Battle() {
  const navigate = useNavigate();
  const hasCountedBattleRef = useRef(false);

  const [roomId, setRoomId] = useState("");
  const [role, setRole] = useState("");
  const [roomData, setRoomData] = useState(null);
  const [copied, setCopied] = useState(false);

  const [battleStarted, setBattleStarted] = useState(false);
  const [countdown, setCountdown] = useState(null);

  const [input, setInput] = useState("");
  const [myProgress, setMyProgress] = useState(0);
  const [opponentProgress, setOpponentProgress] = useState(0);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [spans, setSpans] = useState([]);

  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [winner, setWinner] = useState(null);
  const [correctChars, setCorrectChars] = useState(0);
  const [totalCharsTyped, setTotalCharsTyped] = useState(0);
  const [user, setUser] = useState(null);

  const [timeLeft, setTimeLeft] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);

  const { roomId: urlRoomId = "" } = useParams();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // ── Countdown ──
  const startCountdown = useCallback((serverText) => {
    let time = 3;
    setCountdown(time);

    const interval = setInterval(() => {
      time--;
      if (time > 0) {
        setCountdown(time);
      } else {
        setCountdown("GO!");
        setTimeout(() => {
          setCountdown(null);
          renderText(serverText);
        }, 800);
        clearInterval(interval);
      }
    }, 1000);
  }, []);

  // ── Socket events ──
  useEffect(() => {
    socket.on("connect", () => console.log("Connected:", socket.id));
    socket.on("room-created", (id) => { setRoomId(id); setRole("host"); });
    socket.on("room-update", (data) => setRoomData(data));
    socket.on("battle-start", (serverText) => {
      hasCountedBattleRef.current = false;
      setBattleStarted(true);
      startCountdown(serverText);
    });
    socket.on("opponent-progress", (progress) => setOpponentProgress(progress));
    socket.on("opponent-finished", () => {
      setWinner("Opponent");
      setTimerRunning(false);
    });

    if (urlRoomId) {
      setRoomId(urlRoomId);
      setRole("guest");
      socket.emit("join-room", urlRoomId);
    }

    return () => {
      socket.off("connect");
      socket.off("room-created");
      socket.off("room-update");
      socket.off("battle-start");
      socket.off("opponent-progress");
      socket.off("opponent-finished");
    };
  }, [startCountdown, urlRoomId]);

  // ── Save battle result ──
  useEffect(() => {
    if (!winner || !user || hasCountedBattleRef.current) return;
    hasCountedBattleRef.current = true;
    recordBattleResult(user.uid, wpm).catch(console.error);
  }, [winner, user, wpm]);

  // ── Timer ──
  useEffect(() => {
    if (!timerRunning) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimerRunning(false);
          if (!winner) setWinner("Time Up");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timerRunning, winner]);

  // ── Actions ──
  function createRoom() { socket.emit("create-room"); }
  function ready() { socket.emit("ready", { roomId, role }); }
  function startBattle() { socket.emit("start", roomId); }

  function handleCopy() {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Reset takes user back to the initial "Generate Invite" screen
  function resetBattle() {
    hasCountedBattleRef.current = false;
    setBattleStarted(false);
    setCountdown(null);
    setInput("");
    setSpans([]);
    setCurrentIndex(0);
    setStartTime(null);
    setWpm(0);
    setAccuracy(0);
    setWinner(null);
    setCorrectChars(0);
    setTotalCharsTyped(0);
    setTimeLeft(60);
    setTimerRunning(false);
    setMyProgress(0);
    setOpponentProgress(0);
    setRoomId("");
    setRole("");
    setRoomData(null);
    setCopied(false);
  }

  // ── Render battle text (direct DOM — spans are tracked in state) ──
  function renderText(text) {
    const container = document.getElementById("battle-text");
    if (!container) return;
    container.innerHTML = "";

    const newSpans = text.split("").map((char) => {
      const span = document.createElement("span");
      span.classList.add("char");
      span.innerText = char;
      container.appendChild(span);
      return span;
    });

    if (newSpans.length > 0) newSpans[0].classList.add("active");

    setSpans(newSpans);
    setCurrentIndex(0);
    setInput("");
    setWpm(0);
    setAccuracy(0);
    setCorrectChars(0);
    setTotalCharsTyped(0);
    setWinner(null);
    setStartTime(Date.now());
    setTimeLeft(60);
    setTimerRunning(true);
  }

  // ── Typing handler ──
  function handleTyping(e) {
    if (!timerRunning) return;
    const value = e.target.value;
    setInput(value);
    if (!spans.length) return;

    const typedChar = value[currentIndex];
    const expectedChar = spans[currentIndex]?.innerText;
    if (!typedChar) return;

    spans[currentIndex].classList.remove("active");

    let isCorrect = false;
    if (typedChar === expectedChar) {
      spans[currentIndex].classList.add("correct");
      isCorrect = true;
    } else {
      spans[currentIndex].classList.add("wrong");
    }

    const nextIndex = currentIndex + 1;
    if (spans[nextIndex]) spans[nextIndex].classList.add("active");
    setCurrentIndex(nextIndex);

    const newCorrect = isCorrect ? correctChars + 1 : correctChars;
    const newTotal = totalCharsTyped + 1;
    const currentAccuracy = Math.round((newCorrect / newTotal) * 100);
    setCorrectChars(newCorrect);
    setTotalCharsTyped(newTotal);
    setAccuracy(currentAccuracy);

    const progress = Math.floor((nextIndex / spans.length) * 100);
    setMyProgress(progress);
    socket.emit("progress", { roomId, progress });

    const elapsed = (Date.now() - startTime) / 1000;
    const currentWpm = Math.round(((nextIndex / 5) / elapsed) * 60);
    setWpm(currentWpm);

    if (nextIndex === spans.length) {
      socket.emit("finish", { roomId, wpm: currentWpm, accuracy: currentAccuracy });
      setWinner("You");
      setTimerRunning(false);
    }
  }

  const inviteLink = roomId ? `${window.location.origin}/battle/${roomId}` : "";

  return (
    <div className={`battle-container${roomId && !battleStarted ? " lobby-view" : ""}`}>
      <ThemeToggle />

      <button
        className="back-home-btn"
        onClick={() => navigate("/")}
        aria-label="Back to home"
      >
        <span className="material-symbols-outlined">arrow_back</span>
      </button>

      <h1>TypeArena</h1>

      {/* ── Create room ── */}
      {!roomId && (
        <div className="create-area">
          <p className="create-desc">Challenge a friend to a live typing battle.</p>
          <button className="btn-primary" onClick={createRoom}>
            Generate Invite
          </button>
        </div>
      )}

      {/* ── Lobby ── */}
      {roomId && !battleStarted && (
        <div className="lobby">
          <div className="lobby-card">
            <h2>Battle Lobby</h2>

            <div className="invite-row">
              <input className="invite-input" value={inviteLink} readOnly />
              <button
                className={`btn-copy${copied ? " btn-copied" : ""}`}
                onClick={handleCopy}
              >
                {copied ? "✓ Copied" : "Copy Link"}
              </button>
            </div>

            {roomData && (
              <div className="players-status">
                <div className={`player-badge${roomData.hostReady ? " badge-ready" : ""}`}>
                  <span className="badge-role">Host</span>
                  <span className="badge-icon">{roomData.hostReady ? "✓" : "—"}</span>
                </div>
                <div className={`player-badge${roomData.guestReady ? " badge-ready" : ""}`}>
                  <span className="badge-role">Guest</span>
                  <span className="badge-icon">{roomData.guestReady ? "✓" : "—"}</span>
                </div>
              </div>
            )}

            <div className="lobby-actions">
              <button className="btn-primary" onClick={ready}>Ready</button>
              {role === "host" && (
                <button
                  className="btn-primary"
                  disabled={!roomData || !roomData.hostReady || !roomData.guestReady}
                  onClick={startBattle}
                >
                  Start Battle
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Race ── */}
      {battleStarted && !winner && (
        <div className="race-area">
          <div className="race-header">
            <span className={`race-timer${timeLeft <= 10 ? " timer-urgent" : ""}`}>
              {timeLeft}s
            </span>
            <span className="race-wpm">
              {wpm}<span className="wpm-unit"> wpm</span>
            </span>
          </div>

          {countdown && <div className="countdown">{countdown}</div>}

          <div className="progress-section">
            <div className="progress-row">
              <span className="progress-name">You</span>
              <div className="progress-bar">
                <div className="progress self" style={{ width: `${myProgress}%` }} />
              </div>
              <span className="progress-pct">{myProgress}%</span>
            </div>
            <div className="progress-row">
              <span className="progress-name">Opponent</span>
              <div className="progress-bar">
                <div className="progress opponent" style={{ width: `${opponentProgress}%` }} />
              </div>
              <span className="progress-pct">{opponentProgress}%</span>
            </div>
          </div>

          <div id="battle-text" className="battle-text" />

          <input
            className="battle-input"
            value={input}
            onChange={handleTyping}
            onKeyDown={(e) => { if (e.key === "Backspace") e.preventDefault(); }}
            placeholder="Start typing..."
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </div>
      )}

      {/* ── Result ── */}
      {battleStarted && winner && (
        <div className="result">
          <div className="result-header">
            {winner === "You" && (
              <><span className="result-icon">🏆</span><h2>You Won!</h2></>
            )}
            {winner === "Opponent" && (
              <><span className="result-icon">😤</span><h2>Opponent Wins</h2></>
            )}
            {winner === "Time Up" && (
              <><span className="result-icon">⏱️</span><h2>Time's Up</h2></>
            )}
          </div>

          <div className="result-stats">
            <div className="result-stat">
              <span className="result-val">{wpm}</span>
              <span className="result-lbl">WPM</span>
            </div>
            <div className="result-stat">
              <span className="result-val">{accuracy}%</span>
              <span className="result-lbl">Accuracy</span>
            </div>
            <div className="result-stat">
              <span className="result-val">{totalCharsTyped - correctChars}</span>
              <span className="result-lbl">Mistakes</span>
            </div>
          </div>

          <button className="btn-primary" onClick={resetBattle}>Play Again</button>
        </div>
      )}
    </div>
  );
}

export default Battle;
