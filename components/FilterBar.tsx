"use client";

import type { Champion } from "@/lib/types";
import { X } from "lucide-react";
import { getCategoryValues } from "@/lib/champions";

const CATEGORIES: ({ key: keyof Champion; label: string; wide?: boolean })[] = [
  { key: "gender", label: "Gender" },
  { key: "positions", label: "Position" },
  { key: "rangeType", label: "Range Type" },
  { key: "species", label: "Species", wide: true },
  { key: "resource", label: "Resource", wide: true },
  { key: "regions", label: "Region", wide: true },
  { key: "releaseYear", label: "Release Year", wide: true },
];

interface FilterBarProps {
  filters: Partial<Record<string, string[]>>;
  onFilterToggle: (category: string, value: string) => void;
  onClear: () => void;
}

function CategoryChips({
  catKey,
  label,
  filters,
  onFilterToggle,
}: {
  catKey: string;
  label: string;
  filters: Partial<Record<string, string[]>>;
  onFilterToggle: (category: string, value: string) => void;
}) {
  const values = getCategoryValues(catKey as keyof Champion);
  const selected = filters[catKey] || [];

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-muted uppercase tracking-wide">{label}</label>
      <div className="flex flex-wrap gap-1">
        {values.map((v) => {
          const active = selected.includes(v);
          return (
            <button
              key={v}
              type="button"
              onClick={() => onFilterToggle(catKey, v)}
              className={`px-3 py-1 rounded-md text-sm font-medium border transition-colors ${
                active
                  ? "bg-primary/20 border-primary text-primary"
                  : "bg-background border-border text-muted hover:text-foreground hover:border-primary"
              }`}
            >
              {v}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function FilterBar({
  filters,
  onFilterToggle,
  onClear,
}: FilterBarProps) {
  const hasFilters = Object.values(filters).some(
    (v) => Array.isArray(v) && v.length > 0,
  );

  return (
    <div className="bg-surface border border-border rounded-lg p-4 mb-6">
      {/* Row 1: narrow categories packed together */}
      <div className="flex flex-wrap gap-x-6 gap-y-3 mb-3">
        {CATEGORIES.filter((c) => !c.wide).map(({ key, label }) => (
          <CategoryChips
            key={key}
            catKey={key}
            label={label}
            filters={filters}
            onFilterToggle={onFilterToggle}
          />
        ))}
      </div>

      {/* Wide categories — each gets a full row */}
      <div className="flex flex-col gap-y-3">
        {CATEGORIES.filter((c) => c.wide).map(({ key, label }) => (
          <CategoryChips
            key={key}
            catKey={key}
            label={label}
            filters={filters}
            onFilterToggle={onFilterToggle}
          />
        ))}
      </div>

      {hasFilters && (
        <button
          onClick={onClear}
          className="flex items-center gap-1 px-3 py-1.5 mt-3 text-sm text-muted hover:text-foreground transition-colors"
        >
          <X size={14} />
          Clear Filters
        </button>
      )}
    </div>
  );
}
