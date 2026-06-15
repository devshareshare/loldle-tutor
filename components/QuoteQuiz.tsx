"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { getAllChampions } from "@/lib/champions";
import { saveQuizResult } from "@/lib/storage";
import { Search, RotateCcw } from "lucide-react";
import type { Champion } from "@/lib/types";

function QuoteInput({
  onGuess,
  disabled,
}: {
  onGuess: (name: string) => void;
  disabled: boolean;
}) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const allChamps = getAllChampions();

  const suggestions = allChamps
    .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 10);

  const handleSubmit = () => {
    if (query && suggestions.length > 0) {
      onGuess(suggestions[0].name);
      setQuery("");
      setShowDropdown(false);
    }
  };

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
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
          placeholder="Which champion says this?"
          className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none disabled:opacity-50"
          autoComplete="off"
        />
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
      <button
        onClick={handleSubmit}
        disabled={disabled || !query}
        className="px-4 py-2.5 bg-primary text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        Guess
      </button>
    </div>
  );
}

function getRandomQuote(): { quote: string; champion: Champion } | null {
  const champs = getAllChampions();
  const withQuotes = champs.filter((c) => (c as any).quotes && (c as any).quotes.length > 0);
  if (withQuotes.length === 0) return null;
  const champ = withQuotes[Math.floor(Math.random() * withQuotes.length)];
  const quotes = (champ as any).quotes as string[];
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  return { quote, champion: champ };
}

export default function QuoteQuiz() {
  const [state, setState] = useState(() => {
    const q = getRandomQuote();
    return {
      quote: q?.quote || "",
      champion: q?.champion || null,
      status: "idle" as "idle" | "correct" | "wrong",
      guess: "",
    };
  });

  const handleGuess = useCallback(
    (name: string) => {
      if (!state.champion) return;
      const isCorrect = name === state.champion.name;
      setState((prev) => ({ ...prev, status: isCorrect ? "correct" : "wrong", guess: name }));
    },
    [state.champion]
  );

  // Save result on answer
  const prevStatusRef = useRef(state.status);
  useEffect(() => {
    if ((state.status === "correct" || state.status === "wrong") && prevStatusRef.current === "idle" && state.champion) {
      saveQuizResult({
        date: new Date().toISOString().split("T")[0],
        championId: state.champion.id,
        championName: state.champion.name,
        guesses: state.status === "correct" ? 1 : 1,
        time: 0,
        mode: "quote",
      });
    }
    prevStatusRef.current = state.status;
  }, [state.status, state.champion]);

  const handleNext = () => {
    const q = getRandomQuote();
    setState({
      quote: q?.quote || "",
      champion: q?.champion || null,
      status: "idle",
      guess: "",
    });
  };

  if (!state.champion) {
    return (
      <div className="text-center py-16 text-muted">
        <p>No quotes available. Run the pipeline to scrape quote data.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Quote display */}
      <div className="bg-surface border border-border rounded-xl p-8 text-center">
        <p className="text-lg text-foreground italic leading-relaxed">
          &ldquo;{state.quote}&rdquo;
        </p>
      </div>

      {/* Input */}
      {state.status === "idle" && (
        <QuoteInput onGuess={handleGuess} disabled={false} />
      )}

      {/* Result */}
      {state.status !== "idle" && (
        <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-4">
            <img
              src={`/champions/${state.champion.portraitName}`}
              alt={state.champion.name}
              className="w-16 h-16 rounded-lg border border-border"
            />
            <div>
              <p className={`text-lg font-bold ${state.status === "correct" ? "text-success" : "text-danger"}`}>
                {state.status === "correct" ? "Correct!" : `Wrong! It's ${state.champion.name}`}
              </p>
              <p className="text-muted text-sm">{state.champion.title}</p>
              {state.status === "wrong" && state.guess && (
                <p className="text-muted text-xs mt-1">You guessed: {state.guess}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <RotateCcw size={16} />
            Next Quote
          </button>
        </div>
      )}
    </div>
  );
}
