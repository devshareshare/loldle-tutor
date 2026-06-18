import championsData from "@/data/champions.json";
import type { Champion } from "@/lib/types";

export function getAllChampions(): Champion[] {
  return championsData as Champion[];
}

export function getChampionById(id: string): Champion | undefined {
  return (championsData as Champion[]).find((c) => c.id === id);
}

export function getCategoryValues(category: keyof Champion): string[] {
  const values = new Set<string>();
  for (const c of championsData as Champion[]) {
    const val = c[category];
    if (Array.isArray(val)) {
      val.forEach((v) => values.add(String(v)));
    } else if (val !== undefined && val !== null) {
      values.add(String(val));
    }
  }
  return [...values].sort();
}

export function filterChampions(filters: Partial<Record<string, string | string[]>>): Champion[] {
  return (championsData as Champion[]).filter((c) => {
    for (const [key, val] of Object.entries(filters)) {
      if (!val || (Array.isArray(val) && val.length === 0)) continue;
      const champVal = c[key as keyof Champion];
      if (Array.isArray(champVal)) {
        const filterVals = Array.isArray(val) ? val : [val];
        if (!filterVals.every((fv) => champVal.map(String).includes(fv))) return false;
      } else if (String(champVal) !== String(val)) {
        return false;
      }
    }
    return true;
  });
}

export type ComparisonResult = "match" | "miss" | "partial" | "higher" | "lower";

export function compareGuess(
  champion: Champion,
  guess: Champion
): Record<string, { value: string; result: ComparisonResult }> {
  const cmp = (a: unknown, b: unknown, isArray: boolean): ComparisonResult => {
    if (isArray) {
      const arrA = (a as string[]) || [];
      const arrB = (b as string[]) || [];
      if (arrA.length === arrB.length && arrA.every((v) => arrB.includes(v))) return "match";
      if (arrA.some((v) => arrB.includes(v))) return "partial";
      return "miss";
    }
    return String(a) === String(b) ? "match" : "miss";
  };

  return {
    gender: {
      value: guess.gender,
      result: cmp(champion.gender, guess.gender, false),
    },
    positions: {
      value: guess.positions.join(", "),
      result: cmp(champion.positions, guess.positions, true),
    },
    species: {
      value: guess.species.join(", "),
      result: cmp(champion.species, guess.species, true),
    },
    resource: {
      value: guess.resource,
      result: cmp(champion.resource, guess.resource, false),
    },
    rangeType: {
      value: guess.rangeType.join(", "),
      result: cmp(champion.rangeType, guess.rangeType, true),
    },
    regions: {
      value: guess.regions.join(", "),
      result: cmp(champion.regions, guess.regions, true),
    },
    releaseYear: {
      value: String(guess.releaseYear),
      result:
        champion.releaseYear === guess.releaseYear
          ? "match"
          : champion.releaseYear > guess.releaseYear
            ? "higher"
            : "lower",
    },
  };
}
