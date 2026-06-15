# loldle-tutor

Learn League of Legends champions for the LoLdle guessing game. Browse champions by category, study with confidence tracking, and test your knowledge through simulated quiz modes.

## Quick Start

```bash
git clone https://github.com/devshareshare/loldle-tutor
cd loldle-tutor
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- **Browse** — Grid of all champions with 7-category filter bar (Gender, Position, Species, Resource, Range, Region, Year)
- **Study** — Mark champions as Known/Unknown, filter to drill weak spots
- **Test — Classic** — LoLdle Classic mode simulation with comparison grid and recap
- **Test — Quote** — Identify champions from voice lines
- **Test — Ability** — Identify champions from ability icons (3 guesses)
- **Stats** — Track quiz results and study progress

## Update Champion Data

When League of Legends patches, refresh the data:

```bash
npm run scrape
```

## Credits

Champion data from Riot Games via Data Dragon. Category mappings from LoLdle. Inspired by the LoLdle daily guessing game. This is an unofficial fan project not affiliated with Riot Games.
