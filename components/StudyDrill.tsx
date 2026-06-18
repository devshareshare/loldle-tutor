"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { getAllChampions, getCategoryValues } from "@/lib/champions";
import { scoreAttribute, computeTotalScore } from "@/lib/study";
import type { AttributeResult } from "@/lib/study";
import type { Champion } from "@/lib/types";
import { type StudyStats, getStudyStats, saveStudyRound } from "@/lib/storage";
import { Check, RotateCcw, ArrowRight } from "lucide-react";

const ATTRIBUTES: { key: keyof Champion; label: string; multi: boolean }[] = [
  { key: "gender", label: "Gender", multi: false },
  { key: "positions", label: "Position", multi: true },
  { key: "species", label: "Species", multi: true },
  { key: "resource", label: "Resource", multi: false },
  { key: "rangeType", label: "Range Type", multi: true },
  { key: "regions", label: "Region", multi: true },
  { key: "releaseYear", label: "Release Year", multi: false },
];

function pickRandom(champs: Champion[], exclude?: Champion): Champion {
  const pool = exclude ? champs.filter((c) => c.id !== exclude.id) : champs;
  return pool[Math.floor(Math.random() * pool.length)];
}

function championAttrToArray(c: Champion, key: keyof Champion): string[] {
  const val = c[key];
  if (Array.isArray(val)) return val.map(String);
  return val !== undefined && val !== null ? [String(val)] : [];
}

function initSeeds(): Record<string, string[]> {
  const s: Record<string, string[]> = {};
  for (const attr of ATTRIBUTES) {
    s[attr.key] = attr.multi ? [] : [""];
  }
  return s;
}

// ── Chip button ──────────────────────────────────────────

function Chip({
  value,
  selected,
  status,
  onClick,
  disabled,
}: {
  value: string;
  selected: boolean;
  status: "idle" | "correct" | "wrong" | "missed";
  onClick: () => void;
  disabled: boolean;
}) {
  let cls = "px-3 py-1.5 rounded-md text-sm font-medium border transition-colors select-none";

  if (disabled) {
    if (status === "correct") cls += " bg-success/20 text-success border-success/30";
    else if (status === "wrong") cls += " bg-danger/20 text-danger border-danger/30";
    else if (status === "missed") cls += " bg-transparent text-warning/70 border-warning";
    else cls += " bg-background border-border text-muted/40";
  } else {
    if (selected) cls += " bg-primary/20 border-primary text-primary cursor-pointer";
    else cls += " bg-background border-border text-foreground hover:border-primary cursor-pointer";
  }

  return (
    <button onClick={onClick} disabled={disabled} className={cls} type="button">
      {value}
    </button>
  );
}

// ── Chip group (single or multi) ─────────────────────────

function ChipGroup({
  label,
  values,
  selected,
  multi,
  statuses,
  onToggle,
  disabled,
}: {
  label: string;
  values: string[];
  selected: string[];
  multi: boolean;
  statuses: Record<string, "idle" | "correct" | "wrong" | "missed">;
  onToggle: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <div>
      <label className="text-xs text-muted uppercase tracking-wide mb-1.5 block">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <Chip
            key={v}
            value={v}
            selected={selected.includes(v)}
            status={disabled ? (statuses[v] || "idle") : "idle"}
            onClick={() => onToggle(v)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────

export default function StudyDrill() {
  const allChampions = useMemo(() => getAllChampions(), []);

  const [mode, setMode] = useState<"all" | "single" | null>(null);
  const [singleKey, setSingleKey] = useState<keyof Champion>("releaseYear");
  const [champion, setChampion] = useState<Champion | null>(null);
  const [seeds, setSeeds] = useState<Record<string, string[]>>(() => initSeeds());
  const [graded, setGraded] = useState(false);
  const [results, setResults] = useState<Record<string, AttributeResult> | null>(null);
  const [stats, setStats] = useState<StudyStats>({ attributeStats: {}, roundsPlayed: 0 });

  // Load stats from LocalStorage on mount
  useEffect(() => {
    setStats(getStudyStats());
  }, []);

  const startDrill = useCallback(
    (m: "all" | "single", key?: keyof Champion) => {
      if (key) setSingleKey(key);
      setMode(m);
      setChampion(pickRandom(allChampions));
    },
    [allChampions],
  );

  const resetRound = useCallback(() => {
    setSeeds(initSeeds());
    setGraded(false);
    setResults(null);
  }, []);

  const visibleAttrs = useMemo(
    () => (mode === "all" ? ATTRIBUTES : ATTRIBUTES.filter((a) => a.key === singleKey)),
    [mode, singleKey],
  );

  // Build chip values for each attribute (memoized per champion)
  const chipValues = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const attr of ATTRIBUTES) {
      const vals = getCategoryValues(attr.key);
      if (attr.key === "releaseYear") {
        vals.sort((a, b) => Number(a) - Number(b));
      }
      map[attr.key] = vals;
    }
    return map;
  }, []);

  const handleToggle = useCallback(
    (key: string, multi: boolean, value: string) => {
      if (graded) return;
      setSeeds((prev) => {
        const current = prev[key] || [];
        if (multi) {
          const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
          return { ...prev, [key]: next };
        }
        const next = current[0] === value ? [""] : [value];
        return { ...prev, [key]: next };
      });
    },
    [graded],
  );

  const handleCheck = useCallback(() => {
    if (!champion) return;
    const attrResults: Record<string, AttributeResult> = {};
    for (const attr of visibleAttrs) {
      const correct = championAttrToArray(champion, attr.key);
      const guess = seeds[attr.key] || [];
      const cleanGuess = attr.multi ? guess : guess.filter((g) => g !== "");
      attrResults[attr.key] = scoreAttribute(correct, cleanGuess, attr.multi);
    }
    setResults(attrResults);
    setGraded(true);
  }, [champion, seeds, visibleAttrs]);

  const handleNext = useCallback(() => {
    if (!champion) return;
    const next = pickRandom(allChampions, champion);
    setChampion(next);
    setSeeds(initSeeds());
    setGraded(false);
    setResults(null);
  }, [allChampions, champion]);

  const handleRetry = useCallback(() => {
    resetRound();
  }, [resetRound]);

  const handleChangeMode = useCallback(() => {
    setMode(null);
    setChampion(null);
    setSeeds(initSeeds());
    setGraded(false);
    setResults(null);
  }, []);

  const handleSwitchAttr = useCallback(
    (key: keyof Champion) => {
      setSingleKey(key);
      resetRound();
    },
    [resetRound],
  );

  // Save stats after grading
  useEffect(() => {
    if (!results) return;
    const scores: Record<string, number> = {};
    for (const [key, r] of Object.entries(results)) {
      scores[key] = r.score;
    }
    saveStudyRound(scores);
    setStats(getStudyStats());
  }, [results]);

  const getChipStatuses = useCallback(
    (key: string): Record<string, "idle" | "correct" | "wrong" | "missed"> => {
      if (!results) return {};
      const r = results[key];
      if (!r) return {};
      const m: Record<string, "idle" | "correct" | "wrong" | "missed"> = {};
      for (const v of r.correctPicks) m[v] = "correct";
      for (const v of r.wrongPicks) m[v] = "wrong";
      for (const v of r.missedPicks) m[v] = "missed";
      return m;
    },
    [results],
  );

  const totalScore = results ? computeTotalScore(results) : null;
  const anySelected = visibleAttrs.some((attr) => {
    const s = seeds[attr.key] || [];
    return attr.multi ? s.length > 0 : s[0] !== "";
  });

  // ── Mode picker internal state (only relevant when mode === null) ──
  const [pickerChoice, setPickerChoice] = useState<"all" | "single" | null>(null);
  const [pickerAttr, setPickerAttr] = useState<keyof Champion>("releaseYear");

  // ── Mode picker screen ──────────────────────────────────

  if (mode === null) {
    return (
      <div className="max-w-md mx-auto mt-16 space-y-6">
        <h1 className="text-2xl font-bold text-foreground text-center">Study Mode</h1>
        <p className="text-sm text-muted text-center">
          Drill champion attributes to improve your LoLdle game.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => startDrill("all")}
            className="bg-surface border border-border rounded-xl p-6 text-center hover:border-primary transition-colors space-y-2"
          >
            <span className="block text-lg font-semibold text-foreground">All Attributes</span>
            <span className="block text-xs text-muted">Practice all 7 categories at once</span>
          </button>
          <button
            onClick={() => setPickerChoice("single")}
            className={`rounded-xl p-6 text-center transition-colors space-y-2 ${
              pickerChoice === "single"
                ? "bg-primary/10 border border-primary"
                : "bg-surface border border-border hover:border-primary"
            }`}
          >
            <span className="block text-lg font-semibold text-foreground">Single Attribute</span>
            <span className="block text-xs text-muted">Focus on one category at a time</span>
          </button>
        </div>

        {pickerChoice === "single" && (
          <div className="bg-surface border border-border rounded-xl p-4 space-y-4">
            <label className="text-xs text-muted uppercase tracking-wide block">
              Pick attribute to practice
            </label>
            <select
              value={pickerAttr}
              onChange={(e) => setPickerAttr(e.target.value as keyof Champion)}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            >
              {ATTRIBUTES.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => startDrill("single", pickerAttr)}
              className="w-full px-4 py-2.5 bg-primary text-background rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Start
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Drill screen ────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top bar: change mode + (in single) attribute switcher */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleChangeMode}
              className="text-xs text-muted hover:text-foreground transition-colors"
            >
              ← Change mode
            </button>
            {mode === "single" && (
              <select
                value={singleKey}
                onChange={(e) => handleSwitchAttr(e.target.value as keyof Champion)}
                className="bg-surface border border-border rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary"
              >
                {ATTRIBUTES.map((a) => (
                  <option key={a.key} value={a.key}>
                    {a.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Champion header */}
          <div className="flex items-center gap-4 bg-surface border border-border rounded-xl p-4">
            <img
              src={`/champions/${champion!.portraitName}`}
              alt={champion!.name}
              className="w-16 h-16 rounded-lg border border-border"
            />
            <div>
              <h2 className="text-xl font-bold text-foreground">{champion!.name}</h2>
              <p className="text-sm text-muted">{champion!.title}</p>
            </div>
          </div>

          {/* Attribute inputs */}
          <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
            {visibleAttrs.map((attr) => {
              const statuses = getChipStatuses(attr.key);
              const selected = seeds[attr.key] || [];
              return (
                <ChipGroup
                  key={attr.key}
                  label={attr.label}
                  values={chipValues[attr.key]}
                  selected={attr.multi ? selected : selected.filter((s) => s !== "")}
                  multi={attr.multi}
                  statuses={statuses}
                  onToggle={(v) => handleToggle(attr.key, attr.multi, v)}
                  disabled={graded}
                />
              );
            })}
          </div>

          {/* Action buttons */}
          {!graded && (
            <button
              onClick={handleCheck}
              disabled={!anySelected}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-background rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              <Check size={18} />
              Check Answers
            </button>
          )}

          {/* Score + Next/Retry after grading */}
          {graded && totalScore !== null && (
            <div className="bg-surface border border-border rounded-xl p-5 space-y-4 text-center">
              <p className="text-2xl font-bold text-foreground">
                {totalScore.toFixed(1)} / {visibleAttrs.length}
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-2 px-5 py-2.5 bg-background border border-border rounded-lg text-sm font-medium text-foreground hover:bg-surface-hover transition-colors"
                >
                  <RotateCcw size={16} />
                  Retry
                </button>
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Next Champion
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Stats bar */}
          {stats.roundsPlayed > 0 && (
            <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Accuracy by Attribute</h3>
              {ATTRIBUTES.map((attr) => {
                const s = stats.attributeStats[attr.key];
                const pct = s && s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
                const barColor =
                  pct >= 80 ? "bg-success" : pct >= 50 ? "bg-warning" : "bg-danger";
                return (
                  <div key={attr.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">{attr.label}</span>
                      <span
                        className={`font-medium ${
                          pct >= 80 ? "text-success" : pct >= 50 ? "text-warning" : "text-danger"
                        }`}
                      >
                        {pct}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-muted pt-1">
                {stats.roundsPlayed} round{stats.roundsPlayed !== 1 ? "s" : ""} played
              </p>
            </div>
          )}
    </div>
  );
}
