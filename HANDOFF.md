# LoLdle Tutor — Handoff

**Date:** 2026-06-15
**Status:** All 17 issues closed. Repo pushed to `main`. Build passes. Working tree clean.

## Current State

The app is fully functional at `localhost:3000` after `npm install && npm run dev`. No pipeline run needed — `data/champions.json` ships pre-built with all data.

### Tabs
- **Browse** — Champion grid with 7-category AND-logic filter bar
- **Study** — Attribute Drill: random champion → chip inputs for all 7 attributes → Check → green/red/yellow feedback + score → Next/Retry. Per-attribute accuracy stats bar persisted in LocalStorage.
- **Test — Classic** — LoLdle-style comparison grid quiz with timer, recap, newest-guess-on-top
- **Test — Quote** — 3-guess icon identification champion quotes (155/172 champs, 26k quotes)
- **Test — Ability** — 3-guess icon identification with category grid feedback
- **Stats** — Aggregated quiz history dashboard
- **Champion Detail** — Horizontal attributes table + abilities tab

### Data
- 172 champions, 860 ability icons, all local assets, zero CDN dependencies
- Quote source: [Gelbpunkt/lol-quotes](https://github.com/Gelbpunkt/lol-quotes) community dataset
- Pipeline: `npm run scrape` → `scripts/scrape.mjs`

## Key Architecture

| Layer | Details |
|-------|---------|
| **Pipeline** | `scripts/scrape.mjs` — LoLdle bundle → Data Dragon → Gelbpunkt quotes → `champions.json` + `types.ts` |
| **Data** | `data/champions.json` (source of truth), `data/types.ts` (auto-generated) |
| **State** | Classic Quiz uses `useReducer`. Study drill and quiz history use LocalStorage via `lib/storage.ts` |
| **Scoring** | `lib/study.ts` — pure functions for single/multi-select attribute scoring with partial credit |
| **Theme** | Dark-only, Tailwind v4 in `app/globals.css`. Colors: success `#2ECC71`, danger `#E74C3C`, warning `#F39C12` |

## Files Changed This Session

| File | What |
|------|------|
| `scripts/scrape.mjs` | Added `extractQuotes()` (Gelbpunkt primary, LoLdle API fallback), wired into pipeline |
| `data/champions.json` | Regenerated with `quotes: string[]` on all 172 champions |
| `data/types.ts` | Regenerated with `quotes: string[]` in Champion interface |
| `lib/study.ts` | **New** — `scoreAttribute()`, `computeTotalScore()` for attribute drill |
| `lib/storage.ts` | Added `getStudyStats()`, `saveStudyRound()` |
| `components/StudyDrill.tsx` | **New** — chip inputs, colored feedback, stats bar |
| `components/FilterBar.tsx` | Removed `knownFilter`/`onKnownFilterChange` props (dead code) |
| `app/study/page.tsx` | Replaced old FilterBar+ChampionGrid with StudyDrill |
| `README.md` | Added Data Sources section, champion count (172), latest champion (Zaahen) |
| `package.json` | Added `crypto-js` dependency |

## Remaining Debt

- No `CONTEXT.md` or `docs/adr/` — `AGENTS.md` references them but `docs/agents/domain.md` says to proceed silently if absent.
- `lib/storage.ts` still has `getStudyToggles`/`setStudyToggle` (old Known/Unknown functions) — kept because `getKnownCount` uses them in Stats page. Could be migrated later.
- FilterBar's `knownFilter` prop was removed but the `getKnownCount` import in Stats page still works independently.

## Suggested Skills

| Skill | For |
|-------|-----|
| `@fixer` | Data pipeline changes, new quiz modes, LocalStorage schema changes |
| `@explorer` | Finding new data sources or researching LoLdle API changes |
| `@oracle` | Architecture review, code simplification, complex bug diagnosis |
| `@designer` | UI polish, new drill/quiz modes, responsive layout |
| `@librarian` | Next.js / React / Tailwind API questions |
