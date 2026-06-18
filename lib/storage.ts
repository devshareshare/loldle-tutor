const STORAGE_PREFIX = "loldle-tutor:";

interface QuizResult {
  date: string;
  championId: string;
  championName: string;
  guesses: number;
  time: number;
  mode: "classic" | "quote" | "ability";
}

function getStorageKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(getStorageKey(key));
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(key), JSON.stringify(value));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

// --- Quiz History ---

export function saveQuizResult(result: QuizResult): void {
  const history = getQuizHistory();
  history.push(result);
  write("quizHistory", history);
}

export function getQuizHistory(): QuizResult[] {
  return read<QuizResult[]>("quizHistory", []);
}

export function getQuizStats() {
  const history = getQuizHistory();
  const classicResults = history.filter((r) => r.mode === "classic");

  return {
    totalPlays: history.length,
    totalClassic: classicResults.length,
    totalQuote: history.filter((r) => r.mode === "quote").length,
    totalAbility: history.filter((r) => r.mode === "ability").length,
    avgGuesses:
      classicResults.length > 0
        ? Math.round((classicResults.reduce((s, r) => s + r.guesses, 0) / classicResults.length) * 10) / 10
        : 0,
    bestTime:
      classicResults.length > 0
        ? Math.min(...classicResults.map((r) => r.time))
        : null,
    worstTime:
      classicResults.length > 0
        ? Math.max(...classicResults.map((r) => r.time))
        : null,
    recentGames: history.slice(-10).reverse(),
  };
}

// --- Study Drill Stats ---

export interface StudyStats {
  attributeStats: Record<string, { correct: number; total: number }>;
  roundsPlayed: number;
}

export function getStudyStats(): StudyStats {
  return read<StudyStats>("studyStats", { attributeStats: {}, roundsPlayed: 0 });
}

export function saveStudyRound(scores: Record<string, number>): void {
  const stats = getStudyStats();
  for (const [key, score] of Object.entries(scores)) {
    if (!stats.attributeStats[key]) {
      stats.attributeStats[key] = { correct: 0, total: 0 };
    }
    stats.attributeStats[key].correct += score;
    stats.attributeStats[key].total += 1;
  }
  stats.roundsPlayed += 1;
  write("studyStats", stats);
}

// --- UI Preferences ---

export function getLastTestTab(): string {
  return read<string>("lastTestTab", "classic");
}

export function setLastTestTab(tab: string): void {
  write("lastTestTab", tab);
}
