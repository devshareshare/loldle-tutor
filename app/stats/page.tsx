"use client";

import { useEffect, useState } from "react";
import { BarChart3, Clock, Target, Zap } from "lucide-react";
import { getQuizStats, getKnownCount } from "@/lib/storage";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function StatsPage() {
  const [stats, setStats] = useState<ReturnType<typeof getQuizStats> | null>(null);
  const [knownCount, setKnownCountState] = useState(0);

  useEffect(() => {
    setStats(getQuizStats());
    setKnownCountState(getKnownCount());
  }, []);

  if (!stats) {
    return <div className="text-center py-16 text-muted"><p>Loading stats...</p></div>;
  }

  const statCards = [
    { label: "Total Plays", value: stats.totalPlays, icon: Zap },
    { label: "Classic Games", value: stats.totalClassic, icon: Target },
    { label: "Quote Games", value: stats.totalQuote, icon: Target },
    { label: "Ability Games", value: stats.totalAbility, icon: Target },
    { label: "Avg Guesses", value: stats.avgGuesses || "-", icon: BarChart3 },
    { label: "Best Time", value: stats.bestTime ? formatTime(stats.bestTime) : "-", icon: Clock },
    { label: "Champions Known", value: `${knownCount}/172`, icon: Target },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Your Stats</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={16} className="text-primary" />
              <span className="text-xs text-muted uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{String(value)}</p>
          </div>
        ))}
      </div>

      {stats.totalPlays === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <BarChart3 size={48} className="text-muted mx-auto mb-4" />
          <p className="text-lg text-muted mb-2">No stats yet</p>
          <p className="text-sm text-muted">Play some quiz modes to see your progress</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-sm text-muted uppercase tracking-wide mb-4">Recent Games</h2>
          <div className="space-y-2">
            {stats.recentGames.map((game, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded capitalize">
                    {game.mode}
                  </span>
                  <span className="text-sm text-foreground font-medium">{game.championName}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted">
                  <span>{game.guesses} guess{game.guesses !== 1 ? "es" : ""}</span>
                  <span>{formatTime(game.time)}</span>
                  <span className="text-xs">{game.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
