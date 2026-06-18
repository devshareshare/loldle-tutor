"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getChampionById } from "@/lib/champions";
import type { Champion } from "@/lib/types";

function AttributesTab({ champion }: { champion: Champion }) {
  const columns = [
    { label: "Gender", value: champion.gender },
    { label: "Position", value: champion.positions.join(", ") },
    { label: "Species", value: champion.species.join(", ") },
    { label: "Resource", value: champion.resource },
    { label: "Range", value: champion.rangeType.join(", ") },
    { label: "Region", value: champion.regions.join(", ") },
    { label: "Year", value: String(champion.releaseYear) },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map(({ label }) => (
              <th key={label} className="text-center py-2 px-3 text-muted font-medium">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border/50">
            {columns.map(({ label, value }) => (
              <td key={label} className="text-center py-2 px-3">
                <span className="text-foreground text-sm font-medium">{value}</span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      {champion.tags.length > 0 && (
        <div className="mt-4 text-center">
          <span className="text-xs text-muted mr-2">Tags:</span>
          {champion.tags.map((t) => (
            <span key={t} className="inline-block bg-surface border border-border rounded px-2 py-0.5 text-xs text-muted mx-0.5">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AbilitiesTab({ champion }: { champion: Champion }) {
  return (
    <div className="space-y-3">
      {champion.abilities.map((ability) => (
        <div key={ability.key} className="flex gap-4 bg-background rounded-lg p-3 border border-border">
          <img
            src={`/abilities/${ability.iconName}`}
            alt={ability.name}
            className="w-12 h-12 rounded border border-border shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded font-mono">
                [{ability.key}]
              </span>
              <span className="text-foreground font-medium text-sm">{ability.name}</span>
            </div>
            <p className="text-muted text-xs leading-relaxed line-clamp-3">{ability.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ChampionDetailPage() {
  const params = useParams();
  const id = decodeURIComponent(params.id as string);
  const champion = getChampionById(id);
  const [tab, setTab] = useState<"attributes" | "abilities">("attributes");

  if (!champion) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <p className="text-lg text-muted mb-4">Champion not found</p>
        <Link href="/" className="text-primary hover:underline text-sm">
          Back to champions
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground mb-6 transition-colors">
        <ArrowLeft size={16} />
        Back to champions
      </Link>

      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <img
            src={`/champions/${champion.portraitName}`}
            alt={champion.name}
            className="w-20 h-20 rounded-lg border border-border"
          />
          <div>
            <h1 className="text-2xl font-bold text-foreground">{champion.name}</h1>
            <p className="text-muted text-sm">{champion.title}</p>
          </div>
        </div>

        <div className="flex gap-1 mb-6 border-b border-border">
          {(["attributes", "abilities"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
                tab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "attributes" ? (
          <AttributesTab champion={champion} />
        ) : (
          <AbilitiesTab champion={champion} />
        )}
      </div>
    </div>
  );
}
