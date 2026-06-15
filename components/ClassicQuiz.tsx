"use client";

import { useReducer, useCallback, useEffect, useRef } from "react";
import type { Champion } from "@/lib/types";
import { getAllChampions, compareGuess } from "@/lib/champions";
import { saveQuizResult } from "@/lib/storage";
import { Search, RotateCcw, Eye } from "lucide-react";

// --- Types ---

interface Guess {
  champion: Champion;
  comparison: ReturnType<typeof compareGuess>;
}

interface QuizState {
  status: "idle" | "playing" | "won" | "revealed";
  mysteryChampion: Champion | null;
  guesses: Guess[];
  elapsed: number;
}

type QuizAction =
  | { type: "START_QUIZ"; mysteryChampion: Champion }
  | { type: "SUBMIT_GUESS"; guess: Guess }
  | { type: "REVEAL" }
  | { type: "TICK" };

function pickRandomChampion(): Champion {
  const champs = getAllChampions();
  return champs[Math.floor(Math.random() * champs.length)];
}

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "START_QUIZ":
      return { status: "idle", mysteryChampion: action.mysteryChampion, guesses: [], elapsed: 0 };
    case "SUBMIT_GUESS": {
      const isCorrect = action.guess.champion.id === state.mysteryChampion?.id;
      const newStatus = state.status === "idle" ? "playing" : state.status;
      return {
        ...state,
        status: isCorrect ? "won" : newStatus,
        guesses: [...state.guesses, action.guess],
      };
    }
    case "REVEAL":
      return { ...state, status: "revealed" };
    case "TICK":
      if (state.status === "playing") return { ...state, elapsed: state.elapsed + 1 };
      return state;
    default:
      return state;
  }
}

// --- Timer ---

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// --- Comparison Cell ---

const COMPARISON_COLORS: Record<string, string> = {
  match: "bg-success/20 text-success border-success/30",
  miss: "bg-danger/20 text-danger border-danger/30",
  partial: "bg-warning/20 text-warning border-warning/30",
  higher: "bg-warning/20 text-warning border-warning/30",
  lower: "bg-warning/20 text-warning border-warning/30",
};

const CATEGORY_LABELS = [
  "Gender",
  "Position",
  "Species",
  "Resource",
  "Range",
  "Region",
  "Year",
];

const CATEGORY_KEYS = [
  "gender",
  "positions",
  "species",
  "resource",
  "rangeType",
  "regions",
  "releaseYear",
];

// --- Autocomplete ---

function GuessInput({
  onGuess,
  usedIds,
  disabled,
}: {
  onGuess: (name: string) => void;
  usedIds: Set<string>;
  disabled: boolean;
}) {
  const allChamps = getAllChampions();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const suggestions = allChamps
    .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()) && !usedIds.has(c.id))
    .slice(0, 10);

  const handleSubmit = () => {
    if (query && suggestions.length > 0) {
      onGuess(suggestions[0].name);
      setQuery("");
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            disabled={disabled}
            placeholder="Type a champion name..."
            className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none disabled:opacity-50"
            autoComplete="off"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={disabled || !query}
          className="px-4 py-2.5 bg-primary text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Guess
        </button>
      </div>
      {showDropdown && query && suggestions.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-surface border border-border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
          {suggestions.map((c) => (
            <button
              key={c.id}
              className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-surface-hover transition-colors flex items-center gap-2"
              onMouseDown={() => {
                onGuess(c.name);
                setQuery("");
                setShowDropdown(false);
              }}
            >
              <img src={`/champions/${c.portraitName}`} alt="" className="w-6 h-6 rounded" />
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// needed for useState in GuessInput
import { useState } from "react";

// --- Comparison Grid ---

function ComparisonGrid({ guesses }: { guesses: Guess[] }) {
  if (guesses.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-3 text-muted font-medium">Champion</th>
            {CATEGORY_LABELS.map((label) => (
              <th key={label} className="text-center py-2 px-3 text-muted font-medium">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...guesses].reverse().map((guess, i) => (
            <tr key={i} className="border-b border-border/50">
              <td className="py-2 px-3">
                <div className="flex items-center gap-2">
                  <img
                    src={`/champions/${guess.champion.portraitName}`}
                    alt=""
                    className="w-7 h-7 rounded"
                  />
                  <span className="font-medium text-foreground">{guess.champion.name}</span>
                </div>
              </td>
              {CATEGORY_KEYS.map((key) => {
                const cell = guess.comparison[key];
                const colorClass = COMPARISON_COLORS[cell.result] || "";
                let display = cell.value;
                if (cell.result === "higher") display = `↑ ${display}`;
                if (cell.result === "lower") display = `↓ ${display}`;
                return (
                  <td key={key} className="text-center py-2 px-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs border ${colorClass}`}>
                      {display}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- Recap ---

function Recap({ state, onPlayAgain }: { state: QuizState; onPlayAgain: () => void }) {
  const mystery = state.mysteryChampion;
  if (!mystery) return null;

  return (
    <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-4">
        <img
          src={`/champions/${mystery.portraitName}`}
          alt={mystery.name}
          className="w-16 h-16 rounded-lg border border-border"
        />
        <div>
          <h2 className="text-xl font-bold text-success">{mystery.name}</h2>
          <p className="text-muted text-sm">{mystery.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-background rounded-lg p-3">
          <span className="text-muted">Guesses:</span>{" "}
          <span className="text-foreground font-bold">{state.guesses.length}</span>
        </div>
        <div className="bg-background rounded-lg p-3">
          <span className="text-muted">Time:</span>{" "}
          <span className="text-foreground font-bold">{formatTime(state.elapsed)}</span>
        </div>
      </div>

      <div className="mt-2">
        <h3 className="text-sm text-muted mb-2 uppercase tracking-wide">Guess Path</h3>
        <div className="space-y-1">
          {[...state.guesses].reverse().map((g, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="text-muted w-6 text-right">#{state.guesses.length - i}</span>
              <img src={`/champions/${g.champion.portraitName}`} alt="" className="w-5 h-5 rounded" />
              <span className="text-foreground">{g.champion.name}</span>
              <span className="text-muted">
                — {CATEGORY_KEYS.filter((k) => g.comparison[k].result === "match").length}/7 matches
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onPlayAgain}
        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <RotateCcw size={16} />
        Play Again
      </button>
    </div>
  );
}

// --- Main Component ---

export default function ClassicQuiz() {
  const [quiz, dispatch] = useReducer(quizReducer, {
    status: "idle",
    mysteryChampion: null,
    guesses: [],
    elapsed: 0,
  });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const initQuiz = useCallback(() => {
    dispatch({ type: "START_QUIZ", mysteryChampion: pickRandomChampion() });
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (!quiz.mysteryChampion) initQuiz();
  }, [quiz.mysteryChampion, initQuiz]);

  // Timer effect
  useEffect(() => {
    if (quiz.status === "playing") {
      timerRef.current = setInterval(() => dispatch({ type: "TICK" }), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quiz.status]);

  // Save result on win/reveal
  useEffect(() => {
    if ((quiz.status === "won" || quiz.status === "revealed") && quiz.mysteryChampion && quiz.guesses.length > 0) {
      const isWin = quiz.status === "won";
      saveQuizResult({
        date: new Date().toISOString().split("T")[0],
        championId: quiz.mysteryChampion.id,
        championName: quiz.mysteryChampion.name,
        guesses: isWin ? quiz.guesses.length : quiz.guesses.length,
        time: quiz.elapsed,
        mode: "classic",
      });
    }
  }, [quiz.status, quiz.mysteryChampion, quiz.guesses.length, quiz.elapsed]);

  const handleGuess = useCallback(
    (name: string) => {
      const all = getAllChampions();
      const champ = all.find((c) => c.name === name);
      if (!champ || !quiz.mysteryChampion) return;
      const comparison = compareGuess(quiz.mysteryChampion, champ);
      dispatch({ type: "SUBMIT_GUESS", guess: { champion: champ, comparison } });
    },
    [quiz.mysteryChampion]
  );

  const handleReveal = () => dispatch({ type: "REVEAL" });
  const handlePlayAgain = () => initQuiz();

  const usedIds = new Set(quiz.guesses.map((g) => g.champion.id));
  const isDone = quiz.status === "won" || quiz.status === "revealed";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">
            {quiz.status === "idle" && "Make your first guess"}
            {quiz.status === "playing" && `Guess #${quiz.guesses.length + 1}`}
            {quiz.status === "won" && "Correct!"}
            {quiz.status === "revealed" && "Revealed"}
          </span>
          <span className="text-sm font-mono text-primary">{formatTime(quiz.elapsed)}</span>
        </div>
        {!isDone && quiz.mysteryChampion && (
          <button
            onClick={handleReveal}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-muted hover:text-foreground transition-colors"
          >
            <Eye size={14} />
            Reveal
          </button>
        )}
      </div>

      {!isDone && <GuessInput onGuess={handleGuess} usedIds={usedIds} disabled={!quiz.mysteryChampion} />}

      <div className="mt-4">
        <ComparisonGrid guesses={quiz.guesses} />
      </div>

      {isDone && (
        <div className="mt-6">
          <Recap state={quiz} onPlayAgain={handlePlayAgain} />
        </div>
      )}
    </div>
  );
}
