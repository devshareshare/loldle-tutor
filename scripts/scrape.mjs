// LoLdle Tutor - Data Pipeline
// Extracts champion data from LoLdle bundle, enriches with Data Dragon,
// downloads images, and generates champions.json + types.ts

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import CryptoJS from "crypto-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const PUBLIC_CHAMPIONS = path.join(__dirname, "..", "public", "champions");
const PUBLIC_ABILITIES = path.join(__dirname, "..", "public", "abilities");
const LOLDLE_BUNDLE_URL = "https://loldle.net/js/index.4e3b9f273a641b8b28c5.1781523561630.js";
const DD_VER = "16.12.1";
const DD_BASE = `https://ddragon.leagueoflegends.com/cdn/${DD_VER}`;

// Position name mapping (LoLdle → standard)
const POSITION_MAP = {
  Top: "Top",
  Jungle: "Jungle",
  Middle: "Mid",
  Bottom: "ADC",
  Support: "Support",
};

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": "loldle-tutor/1.0" } });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": "loldle-tutor/1.0" } });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

async function downloadFile(url, destPath) {
  if (fs.existsSync(destPath)) return false;
  const res = await fetch(url, { headers: { "User-Agent": "loldle-tutor/1.0" } });
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buf);
  return true;
}

// Extract champion quotes from external sources
async function extractQuotes() {
  try {
    // Primary source: Gelbpunkt/lol-quotes dataset
    try {
      const data = await fetchJson(
        "https://raw.githubusercontent.com/Gelbpunkt/lol-quotes/main/quotes.json"
      );
      const quotes = {};
      let totalQuotes = 0;

      for (const [champion, entry] of Object.entries(data)) {
        if (entry && Array.isArray(entry.quotes)) {
          const uniqueQuotes = [...new Set(entry.quotes)];
          quotes[champion] = uniqueQuotes;
          totalQuotes += uniqueQuotes.length;
        }
      }

      const championCount = Object.keys(quotes).length;
      console.log(`[Quotes] Using source: Gelbpunkt/lol-quotes`);
      console.log(
        `[Quotes] Extracted quotes for ${championCount} champions (${totalQuotes} total quotes)`
      );
      return quotes;
    } catch (primaryErr) {
      console.log(`[Quotes] Primary source failed: ${primaryErr.message}`);
    }

    // Fallback: LoLdle cache API
    try {
      const cacheUrl = `https://cache.loldle.net/cache.json?_=${Date.now()}`;
      const encryptedCache = await fetchText(cacheUrl);

      // First-level decryption
      const decryptedCache = CryptoJS.AES.decrypt(
        encryptedCache,
        "D5XCtTOObw"
      ).toString(CryptoJS.enc.Utf8);
      const cacheData = JSON.parse(decryptedCache);

      const quotes = {};
      let totalQuotes = 0;

      for (const [key, value] of Object.entries(cacheData)) {
        if (!key.startsWith("quote_answerEncrypted_")) continue;
        if (!key.endsWith("_europe") && !key.endsWith("_america")) continue;

        try {
          // Inner decryption
          const decryptedInner = CryptoJS.AES.decrypt(
            value,
            "QhDZJfngdx"
          ).toString(CryptoJS.enc.Utf8);
          const innerData = JSON.parse(decryptedInner);

          if (innerData.question) {
            // Extract champion name from answer field, fallback to question parsing
            let championName = innerData.answer || "";
            if (!championName && innerData.question) {
              // Best-effort: some entries may embed the champion in the question
              const match = innerData.question.match(/^"?([^"]+)"/);
              if (match) championName = match[1];
            }

            if (championName) {
              if (!quotes[championName]) {
                quotes[championName] = [];
              }
              if (!quotes[championName].includes(innerData.question)) {
                quotes[championName].push(innerData.question);
                totalQuotes++;
              }
            }
          }
        } catch (innerErr) {
          // Skip individual entries that fail decryption or parsing
          continue;
        }
      }

      const championCount = Object.keys(quotes).length;
      console.log(`[Quotes] Using source: LoLdle cache API`);
      console.log(
        `[Quotes] Extracted quotes for ${championCount} champions (${totalQuotes} total quotes)`
      );
      return quotes;
    } catch (fallbackErr) {
      console.log(`[Quotes] Fallback source failed: ${fallbackErr.message}`);
    }

    console.log(`[Quotes] All sources failed, returning empty quotes`);
    return {};
  } catch (err) {
    console.log(`[Quotes] Unexpected error: ${err.message}`);
    return {};
  }
}

// Step 1: Extract champion data from LoLdle bundle
async function extractLoLdleData() {
  console.log("[1/5] Extracting champion data from LoLdle bundle...");
  const bundle = await fetchText(LOLDLE_BUNDLE_URL);

  // Extract champion objects: {championName:"X",gender:"Y",positions:[...]...}
  const pattern = /championName:"([^"]+)"(?:,\w+:"[^"]*")*,(gender):"([^"]+)",positions:(\[[^\]]+\]),species:(\[[^\]]+\]),resource:"([^"]+)",range_type:(\[[^\]]+\]),regions:(\[[^\]]+\]),release_date:"([^"]+)"/g;

  const champions = [];
  let match;
  while ((match = pattern.exec(bundle)) !== null) {
    const name = match[1];
    const gender = match[3];
    const positionsRaw = JSON.parse(match[4]);
    const speciesRaw = JSON.parse(match[5]);
    const resource = match[6];
    const rangeTypeRaw = JSON.parse(match[7]);
    const regionsRaw = JSON.parse(match[8]);
    const releaseDate = match[9];

    champions.push({
      name,
      gender,
      positions: positionsRaw.map((p) => POSITION_MAP[p] || p),
      species: speciesRaw,
      resource,
      rangeType: rangeTypeRaw,
      regions: regionsRaw,
      releaseYear: parseInt(releaseDate.split("-")[0], 10),
      releaseDate,
    });
  }

  // Deduplicate by name
  const seen = new Set();
  const unique = champions.filter((c) => {
    if (seen.has(c.name)) return false;
    seen.add(c.name);
    return true;
  });

  console.log(`  Extracted ${unique.length} champions from LoLdle`);
  return unique;
}

// Step 2: Fetch Data Dragon champion data
async function fetchDataDragonData() {
  console.log("[2/5] Fetching Data Dragon champion data...");
  const list = await fetchJson(`${DD_BASE}/data/en_US/champion.json`);
  const champs = Object.values(list.data);
  console.log(`  Found ${champs.length} champions in Data Dragon`);

  // Fetch individual champion data for abilities
  const details = {};
  for (const c of champs) {
    const detail = await fetchJson(`${DD_BASE}/data/en_US/champion/${c.id}.json`);
    details[c.id] = detail.data[c.id];
  }
  console.log(`  Fetched detailed data for ${Object.keys(details).length} champions`);
  return { list: champs, details };
}

// Step 3: Merge datasets
function mergeData(loldleChamps, ddData, quotesData) {
  console.log("[3/5] Merging datasets...");

  // Build lookup: normalize names for matching
  const ddByName = {};
  for (const c of ddData.list) {
    ddByName[c.name] = c;
    // Handle special cases
    ddByName[c.name.replace(/[^a-zA-Z]/g, "")] = c; // No special chars
    ddByName[c.name.replace(/['\s.]/g, "")] = c; // Normalized
  }

  const merged = [];
  for (const lc of loldleChamps) {
    // Find matching Data Dragon champion
    let ddEntry = ddByName[lc.name];
    if (!ddEntry) {
      // Try normalized match
      const norm = lc.name.replace(/[^a-zA-Z]/g, "");
      ddEntry = ddByName[norm];
    }
    if (!ddEntry) {
      // Handle specific mismatches
      const aliases = {
        "Nunu & Willump": "Nunu",
        "Renata Glasc": "Renata",
        "Kai'Sa": "Kaisa",
        "Bel'Veth": "Belveth",
        "Cho'Gath": "Chogath",
        "Kha'Zix": "Khazix",
        "Rek'Sai": "RekSai",
        "Vel'Koz": "Velkoz",
        "Kog'Maw": "KogMaw",
        "Wukong": "MonkeyKing",
        "Jarvan IV": "JarvanIV",
      };
      const alias = aliases[lc.name];
      if (alias && ddData.details[alias]) {
        ddEntry = { id: alias, name: lc.name, ...ddData.list.find((c) => c.id === alias) };
      }
    }

    // Build abilities array
    const abilities = [];
    if (ddEntry) {
      const detail = ddData.details[ddEntry.id] || ddData.details[ddEntry.name];
      if (detail) {
        if (detail.passive) {
          abilities.push({
            name: detail.passive.name,
            key: "Passive",
            description: detail.passive.description,
            iconName: detail.passive.image.full,
          });
        }
        if (detail.spells) {
          const keys = ["Q", "W", "E", "R"];
          detail.spells.forEach((spell, i) => {
            abilities.push({
              name: spell.name,
              key: keys[i] || "?",
              description: spell.description,
              iconName: spell.image.full,
            });
          });
        }
      }
    }

    const portraitName = ddEntry?.image?.full || (ddEntry ? `${lc.name}.png` : "");

    const champion = {
      id: lc.name,
      name: lc.name,
      title: ddEntry?.title || "",
      portraitName,
      gender: lc.gender,
      positions: lc.positions,
      species: lc.species,
      resource: lc.resource,
      rangeType: lc.rangeType,
      regions: lc.regions,
      releaseYear: lc.releaseYear,
      tags: ddEntry?.tags || [],
      partype: ddEntry?.partype || "",
      attackrange: ddEntry?.stats?.attackrange || 0,
      abilities,
      quotes: quotesData?.[lc.name] || [],
    };

    merged.push(champion);
  }

  // Sort alphabetically
  merged.sort((a, b) => a.name.localeCompare(b.name));
  console.log(`  Merged ${merged.length} champions`);
  return merged;
}

// Step 4: Download images
async function downloadImages(champions) {
  console.log("[4/5] Downloading images...");
  let portraitsDownloaded = 0;
  let iconsDownloaded = 0;

  for (const c of champions) {
    // Champion portrait — use Data Dragon's image name
    const portraitUrl = `${DD_BASE}/img/champion/${c.portraitName}`;
    const portraitPath = path.join(PUBLIC_CHAMPIONS, c.portraitName);
    const downloaded = await downloadFile(portraitUrl, portraitPath);
    if (downloaded) portraitsDownloaded++;

    // Ability icons
    for (const ability of c.abilities) {
      const group = ability.key === "Passive" ? "passive" : "spell";
      const iconUrl = `${DD_BASE}/img/${group}/${ability.iconName}`;
      const iconPath = path.join(PUBLIC_ABILITIES, ability.iconName);
      const iconDownloaded = await downloadFile(iconUrl, iconPath);
      if (iconDownloaded) iconsDownloaded++;
    }
  }

  console.log(`  Downloaded ${portraitsDownloaded} portraits, ${iconsDownloaded} ability icons`);
}

// Step 5: Generate output files
function generateOutput(champions) {
  console.log("[5/5] Generating output files...");

  // champions.json
  const jsonPath = path.join(DATA_DIR, "champions.json");
  fs.writeFileSync(jsonPath, JSON.stringify(champions, null, 2));
  console.log(`  Wrote ${jsonPath} (${champions.length} champions)`);

  // types.ts
  const allSpecies = [...new Set(champions.flatMap((c) => c.species))].sort();
  const allRegions = [...new Set(champions.flatMap((c) => c.regions))].sort();
  const allResources = [...new Set(champions.map((c) => c.resource))].sort();
  const allTags = [...new Set(champions.flatMap((c) => c.tags))].sort();

  const typesPath = path.join(DATA_DIR, "types.ts");
  const typesContent = `// Auto-generated from pipeline — do not edit manually
// Generated from Data Dragon ${DD_VER}

export type Gender = "Male" | "Female" | "Other";

export type Position = "Top" | "Jungle" | "Mid" | "ADC" | "Support";

export type Species = ${allSpecies.map((s) => `"${s}"`).join(" | ")};

export type Resource = ${allResources.map((r) => `"${r}"`).join(" | ")};

export type RangeType = "Melee" | "Ranged";

export type Region = ${allRegions.map((r) => `"${r}"`).join(" | ")};

export type Tag = ${allTags.map((t) => `"${t}"`).join(" | ")};

export interface Ability {
  name: string;
  key: "Q" | "W" | "E" | "R" | "Passive";
  description: string;
  iconName: string;
}

export interface Champion {
  id: string;
  name: string;
  title: string;
  portraitName: string;
  gender: Gender;
  positions: Position[];
  species: Species[];
  resource: Resource;
  rangeType: RangeType[];
  regions: Region[];
  releaseYear: number;
  tags: Tag[];
  partype: string;
  attackrange: number;
  abilities: Ability[];
  quotes: string[];
}
`;
  fs.writeFileSync(typesPath, typesContent);
  console.log(`  Wrote ${typesPath}`);

  // version.txt
  fs.writeFileSync(path.join(DATA_DIR, "version.txt"), DD_VER);
}

async function main() {
  try {
    console.log("LoLdle Tutor — Data Pipeline");
    console.log("============================\n");

    const loldleData = await extractLoLdleData();
    const quotesData = await extractQuotes();
    const ddData = await fetchDataDragonData();
    const champions = mergeData(loldleData, ddData, quotesData);
    await downloadImages(champions);
    generateOutput(champions);

    console.log("\nPipeline complete!");
  } catch (err) {
    console.error("Pipeline failed:", err.message);
    process.exit(1);
  }
}

main();
