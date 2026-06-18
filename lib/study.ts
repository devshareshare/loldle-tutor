// Scoring functions for Study Attribute Drill
// Pure functions — no DOM, no React, no side effects

export type AttributeResultStatus = "match" | "miss" | "partial";

export interface AttributeResult {
  score: number;
  maxScore: number;
  result: AttributeResultStatus;
  /** Values the user picked correctly (green) */
  correctPicks: string[];
  /** Values the user picked but are wrong (red) */
  wrongPicks: string[];
  /** Values the user missed — correct but not picked (yellow outline) */
  missedPicks: string[];
}

/**
 * Score a single attribute against the correct answer.
 * @param correct - correct value(s) from champion data (array of strings)
 * @param guess - user's selected value(s) (array of strings)
 * @param multi - whether this attribute supports multiple values
 */
export function scoreAttribute(
  correct: string[],
  guess: string[],
  multi: boolean,
): AttributeResult {
  if (!multi) {
    const g = guess[0] || "";
    const c = correct[0] || "";
    if (g === c) {
      return {
        score: 1,
        maxScore: 1,
        result: "match",
        correctPicks: [g],
        wrongPicks: [],
        missedPicks: [],
      };
    }
    return {
      score: 0,
      maxScore: 1,
      result: "miss",
      correctPicks: [],
      wrongPicks: g ? [g] : [],
      missedPicks: c ? [c] : [],
    };
  }

  // Multi-select scoring
  const correctPicks = guess.filter((g) => correct.includes(g));
  const wrongPicks = guess.filter((g) => !correct.includes(g));
  const missedPicks = correct.filter((c) => !guess.includes(c));

  const denominator = correctPicks.length + wrongPicks.length + missedPicks.length;
  const score = denominator > 0 ? correctPicks.length / denominator : 1;

  let result: AttributeResultStatus;
  if (score === 1) result = "match";
  else if (score === 0) result = "miss";
  else result = "partial";

  return {
    score,
    maxScore: denominator,
    result,
    correctPicks,
    wrongPicks,
    missedPicks,
  };
}

/**
 * Compute overall score from per-attribute results.
 * Returns sum of per-attribute scores (0.0 to number of attributes).
 */
export function computeTotalScore(
  results: Record<string, AttributeResult>,
): number {
  const entries = Object.values(results);
  if (entries.length === 0) return 0;
  return entries.reduce((sum, r) => sum + r.score, 0);
}
