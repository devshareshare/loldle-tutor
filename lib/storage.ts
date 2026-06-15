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

// --- Study Toggles ---

export function setStudyToggle(championId: string, known: boolean): void {
  const toggles = getStudyToggles();
  toggles[championId] = known;
  write("studyToggles", toggles);
}

export function getStudyToggles(): Record<string, boolean> {
  return read<Record<string, boolean>>("studyToggles", {});
}

export function getKnownCount(): number {
  return Object.values(getStudyToggles()).filter(Boolean).length;
}

// --- UI Preferences ---

export function getLastTestTab(): string {
  return read<string>("lastTestTab", "classic");
}

export function setLastTestTab(tab: string): void {
  write("lastTestTab", tab);
}
