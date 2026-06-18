"use client";

import { useState, useMemo } from "react";
import { getAllChampions, filterChampions } from "@/lib/champions";
import ChampionGrid from "@/components/ChampionGrid";
import FilterBar from "@/components/FilterBar";

export default function HomePage() {
  const allChampions = useMemo(() => getAllChampions(), []);
  const [filters, setFilters] = useState<Record<string, string[]>>({});

  const filtered = useMemo(() => filterChampions(filters), [allChampions, filters]);

  const handleFilterToggle = (category: string, value: string) => {
    setFilters((prev) => {
      const current = prev[category] || [];
      // If clearing (empty value from select), remove the category entirely
      if (!value) {
        const next = { ...prev };
        delete next[category];
        return next;
      }
      // Toggle: remove if already selected, add if not
      const nextValues = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      // Remove empty arrays to keep state clean
      if (nextValues.length === 0) {
        const next = { ...prev };
        delete next[category];
        return next;
      }
      return { ...prev, [category]: nextValues };
    });
  };

  const handleClear = () => setFilters({});

  return (
    <div className="max-w-7xl mx-auto">
      <FilterBar filters={filters} onFilterToggle={handleFilterToggle} onClear={handleClear} />
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">
          Showing {filtered.length} of {allChampions.length} champions
        </p>
      </div>
      <ChampionGrid champions={filtered} />
    </div>
  );
}
