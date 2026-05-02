import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/practice.css";
import ThemeToggle from "../components/ThemeToggle";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { recordPracticeResult } from "../auth/authService";

const wordList = [
  "the","be","to","of","and","a","in","that","have","it","for","not","on","with",
  "as","you","do","at","this","but","his","by","from","they","we","say","her",
  "she","or","an","will","my","one","all","would","there","their","what","so",
  "up","out","if","about","who","get","which","go","me","when","make","can",
  "like","time","no","just","him","know","take","people","into","year","your",
  "good","some","could","them","see","other","than","then","now","look","only",
  "come","over","think","also","back","after","use","two","how","our","work",
  "first","well","way","even","new","want","because","any","these","give","day",
  "most","us","great","between","need","large","often","hand","high","place",
  "turn","same","here","those","both","each","game","play","fast","slow","type",
  "word","key","speed","score","rank","level","best","last","next","home","run",
  "move","live","help","long","much","down","call","try","big","talk","read",
  "such","follow","act","why","ask","change","light","kind","off","house","again",
  "point","world","near","self","earth","head","stand","own","page","should",
  "country","found","answer","school","learn","plant","food","sun","four","state",
  "keep","eye","never","door","seem","open","begin","show","every","together",
  "might","close","stop","face","already","enough","along","road","still","life",
  "letter","press","city","tree","cross","since","hard","start","story","far",
  "sea","draw","left","late","while","wind","real","few","north","walk","carry",
  "book","took","grow","river","cut","young","soon","list","song","leave","family",
  "body","music","color","voice","power","money","serve","market","product","black",
  "short","number","simple","dry","wonder","laugh","drop","miss","heat","snow",
  "bring","warm","free","ready","stay","wrong","round","order","clean","build",
  "mind","water","plain","rest","class","clear","table","heart","check","catch",
  "space","ground","fire","south","piece","pass","top","whole","king","street",
  "write","fill","spend","front","push","quick","brown","jump","lazy","dog","fox",
  "keyboard","practice","accuracy","improve","challenge","battle","compete",
  "track","progress","focus","skill","result","feedback","performance","limit",
  "climb","arena","typing","finger","letter","reach","press","effort","flow",
];

function generateText(wordCount = 80) {
  const result = [];
  for (let i = 0; i < wordCount; i++) {
    result.push(wordList[Math.floor(Math.random() * wordList.length)]);
  }
  return result.join(" ");
}

export default function Practice() {
  const navigate = useNavigate();

  const [text, setText] = useState("");
  const [time, setTime] = useState(60);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [user, setUser] = useState(null);
  const [correct, setCorrect] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  const inputRef = useRef(null);
  const spansRef = useRef([]);
  const indexRef = useRef(0);
  const timerRef = useRef(null);
  const resultSavedRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const finishPractice = () => {
    setFinished(true);
    clearInterval(timerRef.current);
  };

  const startPractice = () => {
    const newText = generateText();
    setText(newText);
    setStarted(true);
    setFinished(false);
    setCorrect(0);
    setMistakes(0);
    resultSavedRef.current = false;
    indexRef.current = 0;
    setTime(60);

    setTimeout(() => {
      spansRef.current = document.querySelectorAll(".char");
      if (spansRef.current.length > 0) {
        spansRef.current[0].classList.add("active");
      }
      inputRef.current?.focus();
    }, 0);
  };

  useEffect(() => {
    if (!started) return;
    timerRef.current = setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          finishPractice();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [started]);

  const handleKeyDown = (e) => {
    if (e.key === "Backspace") e.preventDefault();
  };

  const handleInput = (e) => {
    if (!started || finished) return;
    const value = e.target.value;
    const currentChar = value[indexRef.current];
    const expectedChar = spansRef.current[indexRef.current]?.innerText;

    spansRef.current[indexRef.current]?.classList.remove("active");

    if (currentChar === expectedChar) {
      spansRef.current[indexRef.current]?.classList.add("correct");
      setCorrect((prev) => prev + 1);
    } else {
      spansRef.current[indexRef.current]?.classList.add("wrong");
      setMistakes((prev) => prev + 1);
    }

    indexRef.current++;

    if (indexRef.current < spansRef.current.length) {
      spansRef.current[indexRef.current].classList.add("active");
    } else {
      finishPractice();
    }
  };

  // correct WPM: characters / 5 / elapsed minutes
  const totalTyped = correct + mistakes;
  const elapsed = 60 - time;
  const wpm = started && elapsed > 0 ? Math.round((correct / 5) / (elapsed / 60)) : 0;
  const accuracy = totalTyped === 0 ? 100 : Math.round((correct / totalTyped) * 100);

  useEffect(() => {
    if (!finished || !user || resultSavedRef.current) return;
    resultSavedRef.current = true;
    recordPracticeResult(user.uid, wpm, accuracy).catch(console.error);
  }, [finished, user, wpm, accuracy]);

  return (
    <div className="practice-page">
      <ThemeToggle />

      <button
        className="back-home-btn"
        onClick={() => navigate("/")}
        aria-label="Back to home"
      >
        <span className="material-symbols-outlined">arrow_back</span>
      </button>

      <h1 className="title">TypeArena</h1>

      {!finished && (
        <div className="practice-box">

          <div className="timer-row">
            <span id="timer" className={time <= 10 ? "timer-urgent" : ""}>{time}s</span>

            {started && (
              <div className="live-stats">
                <span className="live-stat">
                  <span className="live-val">{wpm}</span>
                  <span className="live-lbl"> wpm</span>
                </span>
                <span className="live-sep">·</span>
                <span className="live-stat">
                  <span className="live-val">{accuracy}</span>
                  <span className="live-lbl">%</span>
                </span>
                <span className="live-sep">·</span>
                <span className="live-stat">
                  <span className="live-val">{mistakes}</span>
                  <span className="live-lbl"> err</span>
                </span>
              </div>
            )}
          </div>

          <div id="text-display">
            {text.split("").map((char, i) => (
              <span key={i} className="char">{char}</span>
            ))}
          </div>

          <div className="input-row">
            <input
              ref={inputRef}
              id="input"
              type="text"
              disabled={!started}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
            <button
              id="start"
              onClick={startPractice}
              disabled={started && !finished}
            >
              {started && !finished ? "—" : "Start"}
            </button>
          </div>
        </div>
      )}

      {finished && (
        <div className="result">
          <h2>Results</h2>

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
              <span className="result-val">{mistakes}</span>
              <span className="result-lbl">Mistakes</span>
            </div>
          </div>

          <button onClick={startPractice}>Try Again</button>
        </div>
      )}
    </div>
  );
}
