"use client";

import type { Champion } from "@/lib/types";
import { X } from "lucide-react";
import { getCategoryValues } from "@/lib/champions";

const CATEGORIES: { key: keyof Champion; label: string }[] = [
  { key: "gender", label: "Gender" },
  { key: "positions", label: "Position" },
  { key: "species", label: "Species" },
  { key: "resource", label: "Resource" },
  { key: "rangeType", label: "Range Type" },
  { key: "regions", label: "Region" },
  { key: "releaseYear", label: "Release Year" },
];

interface FilterBarProps {
  filters: Partial<Record<string, string>>;
  onFilterChange: (category: string, value: string) => void;
  onClear: () => void;
}

export default function FilterBar({
  filters,
  onFilterChange,
  onClear,
}: FilterBarProps) {
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="bg-surface border border-border rounded-lg p-4 mb-6">
      <div className="flex flex-wrap gap-3 items-end">
        {CATEGORIES.map(({ key, label }) => {
          const values = getCategoryValues(key);
          return (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-xs text-muted uppercase tracking-wide">{label}</label>
              <select
                value={filters[key] || ""}
                onChange={(e) => onFilterChange(key, e.target.value)}
                className="bg-background border border-border rounded-md px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none cursor-pointer"
              >
                <option value="">All</option>
                {values.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
        {hasFilters && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-muted hover:text-foreground transition-colors"
          >
            <X size={14} />
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}
