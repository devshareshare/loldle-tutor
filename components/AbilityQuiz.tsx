"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { getAllChampions, compareGuess } from "@/lib/champions";
import { saveQuizResult } from "@/lib/storage";
import { Search, RotateCcw } from "lucide-react";
import type { Champion, Ability } from "@/lib/types";

interface AbilityQuizState {
  ability: (Ability & { champion: Champion }) | null;
  guesses: { champion: Champion; comparison: ReturnType<typeof compareGuess> }[];
  status: "idle" | "correct" | "wrong";
  guessName: string;
}

function getRandomAbility(): (Ability & { champion: Champion }) | null {
  const champs = getAllChampions();
  const withAbilities = champs.filter((c) => c.abilities.length > 0);
  if (withAbilities.length === 0) return null;
  const champ = withAbilities[Math.floor(Math.random() * withAbilities.length)];
  const ability = champ.abilities[Math.floor(Math.random() * champ.abilities.length)];
  return { ...ability, champion: champ };
}

const CATEGORY_LABELS = ["Gender", "Position", "Species", "Resource", "Range", "Region", "Year"];
const CATEGORY_KEYS = ["gender", "positions", "species", "resource", "rangeType", "regions", "releaseYear"];
const COMPARISON_COLORS: Record<string, string> = {
  match: "bg-success/20 text-success border-success/30",
  miss: "bg-danger/20 text-danger border-danger/30",
  partial: "bg-warning/20 text-warning border-warning/30",
  higher: "bg-warning/20 text-warning border-warning/30",
  lower: "bg-warning/20 text-warning border-warning/30",
};

function AbilityInput({
  onGuess,
  usedIds,
  disabled,
}: {
  onGuess: (name: string) => void;
  usedIds: Set<string>;
  disabled: boolean;
}) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const allChamps = getAllChampions();

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
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          disabled={disabled}
          placeholder="Which champion has this ability?"
          className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none disabled:opacity-50"
          autoComplete="off"
        />
        {showDropdown && query && suggestions.length > 0 && (
          <div className="absolute top-full mt-1 w-full bg-surface border border-border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
            {suggestions.map((c) => (
              <button
                key={c.id}
                className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-surface-hover flex items-center gap-2"
                onMouseDown={() => { onGuess(c.name); setQuery(""); setShowDropdown(false); }}
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
        className="px-4 py-2.5 bg-primary text-background rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        Guess ({3 - (usedIds.size)} left)
      </button>
    </div>
  );
}

export default function AbilityQuiz() {
  const [state, setState] = useState<AbilityQuizState>(() => {
    const data = getRandomAbility();
    return { ability: data, guesses: [], status: "idle", guessName: "" };
  });

  const maxGuesses = 3;

  const handleGuess = useCallback(
    (name: string) => {
      if (!state.ability) return;
      const all = getAllChampions();
      const champ = all.find((c) => c.name === name);
      if (!champ) return;

      const isCorrect = champ.id === state.ability.champion.id;
      const comparison = compareGuess(state.ability.champion, champ);
      const newGuesses = [...state.guesses, { champion: champ, comparison }];

      if (isCorrect) {
        setState((prev) => ({ ...prev, guesses: newGuesses, status: "correct", guessName: name }));
      } else if (newGuesses.length >= maxGuesses) {
        setState((prev) => ({ ...prev, guesses: newGuesses, status: "wrong", guessName: name }));
      } else {
        setState((prev) => ({ ...prev, guesses: newGuesses }));
      }
    },
    [state.ability, state.guesses]
  );

  const handleNext = () => {
    const data = getRandomAbility();
    setState({ ability: data, guesses: [], status: "idle", guessName: "" });
  };

  const isDone = state.status !== "idle";
  const remaining = maxGuesses - state.guesses.length;

  // Save result on answer
  const prevStatusRef = useRef(state.status);
  useEffect(() => {
    if (isDone && prevStatusRef.current === "idle" && state.ability) {
      saveQuizResult({
        date: new Date().toISOString().split("T")[0],
        championId: state.ability.champion.id,
        championName: state.ability.champion.name,
        guesses: state.guesses.length,
        time: 0,
        mode: "ability",
      });
    }
    prevStatusRef.current = state.status;
  }, [state.status, state.ability, state.guesses.length, isDone]);

  if (!state.ability) {
    return <div className="text-center py-16 text-muted"><p>No abilities found.</p></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-surface border border-border rounded-xl p-8 flex flex-col items-center gap-4">
        <img
          src={`/abilities/${state.ability.iconName}`}
          alt={state.ability.name}
          className="w-20 h-20 rounded-lg border border-border"
        />
        <div className="text-center">
          <p className="text-muted text-xs mb-1">Which champion has this ability?</p>
          {!isDone && (
            <p className="text-sm text-muted">
              {remaining} guess{remaining !== 1 ? "es" : ""} remaining
            </p>
          )}
        </div>
      </div>

      {!isDone && (
        <AbilityInput onGuess={handleGuess} usedIds={new Set(state.guesses.map((g) => g.champion.id))} disabled={false} />
      )}

      {/* Comparison grid for wrong guesses */}
      {state.guesses.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-muted font-medium">Champion</th>
                {CATEGORY_LABELS.map((l) => (
                  <th key={l} className="text-center py-2 px-3 text-muted font-medium">{l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.guesses.map((g, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <img src={`/champions/${g.champion.portraitName}`} alt="" className="w-7 h-7 rounded" />
                      <span className="font-medium text-foreground">{g.champion.name}</span>
                    </div>
                  </td>
                  {CATEGORY_KEYS.map((key) => {
                    const cell = g.comparison[key];
                    const colorClass = COMPARISON_COLORS[cell.result] || "";
                    let display = cell.value;
                    if (cell.result === "higher") display = `↑ ${display}`;
                    if (cell.result === "lower") display = `↓ ${display}`;
                    return (
                      <td key={key} className="text-center py-2 px-2">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs border ${colorClass}`}>{display}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Result */}
      {isDone && (
        <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-4">
            <img src={`/champions/${state.ability.champion.portraitName}`} alt="" className="w-16 h-16 rounded-lg border border-border" />
            <div>
              <p className={`text-lg font-bold ${state.status === "correct" ? "text-success" : "text-danger"}`}>
                {state.status === "correct"
                  ? "Correct!"
                  : `It's ${state.ability.champion.name}`}
              </p>
              <p className="text-muted text-sm">
                {state.ability.name} [{state.ability.key}]
              </p>
              {state.status === "wrong" && (
                <p className="text-muted text-xs mt-1">
                  {state.guesses.length} guess{state.guesses.length !== 1 ? "es" : ""} used
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-background rounded-lg text-sm font-medium hover:opacity-90"
          >
            <RotateCcw size={16} />
            Next Ability
          </button>
        </div>
      )}
    </div>
  );
}
