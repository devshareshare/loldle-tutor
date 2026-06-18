# LoLdle Tutor — Handoff

**Date:** 2026-06-18
**Status:** Build passes. Working tree clean. Pushed to `main`.

## Current State

The app is fully functional at `localhost:3000` after `npm install && npm run dev`. No pipeline run needed — `data/champions.json` ships pre-built with all data.

### Tabs
- **Browse** — Champion grid with 7-category filter bar. All categories use compact chip toggles (narrow categories Gender/Position/Range Type packed in one row; wide categories Species/Resource/Region/Release Year each get their own row). AND-logic across all active chips.
- **Study** — Mode picker on entry (All Attributes / Single Attribute). All: full 7-attribute drill with chip inputs, green/red/yellow feedback, score out of 7. Single: pick one category, drill only that attribute, score out of 1. Per-attribute accuracy stats bar persisted in LocalStorage.
- **Test — Classic** — LoLdle-style comparison grid quiz with timer, recap, newest-guess-on-top
- **Test — Quote** — Identify champions from voice lines (157/172 champs, 26k quotes)
- **Test — Ability** — Identify champions from ability icons (3 guesses) with category grid feedback
- **Stats** — Aggregated quiz history dashboard (plays, avg guesses, best time, recent games)
- **Champion Detail** — Horizontal attributes table + abilities tab

### Data
- 172 champions, 860 ability icons, all local assets, zero CDN dependencies
- Quote source: [Gelbpunkt/lol-quotes](https://github.com/Gelbpunkt/lol-quotes) community dataset
- Pipeline: `npm run scrape` → `scripts/scrape.mjs`
- `rangeType` is an array (5 champions have dual Melee/Ranged: Jayce, Kayle, Gnar, Nidalee, Elise)

## Key Architecture

| Layer | Details |
|-------|---------|
| **Pipeline** | `scripts/scrape.mjs` — LoLdle bundle → Data Dragon → Gelbpunkt quotes → `champions.json` + `types.ts` |
| **Data** | `data/champions.json` (source of truth), `data/types.ts` (auto-generated) |
| **State** | Classic Quiz uses `useReducer`. Study drill and quiz history use LocalStorage via `lib/storage.ts` |
| **Scoring** | `lib/study.ts` — pure functions for single/multi-select attribute scoring with partial credit. `computeTotalScore` returns sum (not average). |
| **Theme** | Dark-only, Tailwind v4 in `app/globals.css`. Colors: success `#2ECC71`, danger `#E74C3C`, warning `#F39C12` |

## Files Changed This Session

| File | What |
|------|------|
| `components/FilterBar.tsx` | Rewrote: all categories as chip toggles (was selects), 2-row compact layout |
| `app/page.tsx` | Filter state changed to `Record<string, string[]>` with toggle logic |
| `components/StudyDrill.tsx` | Added mode picker (All/Single), single-attribute dropdown, `resetRound` helper |
| `lib/study.ts` | `computeTotalScore` now sums scores (was averaging), fixed JSDoc |
| `scripts/scrape.mjs` | `rangeType` kept as full array instead of `[0]` |
| `data/types.ts` | `rangeType: RangeType` → `rangeType: RangeType[]` |
| `data/champions.json` | Regenerated with array `rangeType` values |
| `lib/champions.ts` | `compareGuess` treats `rangeType` as multi-value (partial match support) |
| `app/champions/[id]/page.tsx` | `rangeType` joined with `, ` for display |
| `lib/storage.ts` | Removed dead `setStudyToggle`/`getStudyToggles`/`getKnownCount` |
| `app/stats/page.tsx` | Removed always-zero "Champions Known" stat card |

## Remaining Debt

- No `CONTEXT.md` or `docs/adr/` — `AGENTS.md` references them but `docs/agents/domain.md` says to proceed silently if absent.

## Suggested Skills

| Skill | For |
|-------|-----|
| `@fixer` | Data pipeline changes, new quiz modes, LocalStorage schema changes |
| `@explorer` | Finding new data sources or researching LoLdle API changes |
| `@oracle` | Architecture review, code simplification, complex bug diagnosis |
| `@designer` | UI polish, new drill/quiz modes, responsive layout |
| `@librarian` | Next.js / React / Tailwind API questions |
