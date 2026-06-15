"use client";

import { useState, useMemo } from "react";
import { getAllChampions, filterChampions } from "@/lib/champions";
import ChampionGrid from "@/components/ChampionGrid";
import FilterBar from "@/components/FilterBar";

export default function HomePage() {
  const allChampions = useMemo(() => getAllChampions(), []);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const filtered = useMemo(() => filterChampions(filters), [allChampions, filters]);

  const handleFilterChange = (category: string, value: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (value) {
        next[category] = value;
      } else {
        delete next[category];
      }
      return next;
    });
  };

  const handleClear = () => setFilters({});

  return (
    <div className="max-w-7xl mx-auto">
      <FilterBar filters={filters} onFilterChange={handleFilterChange} onClear={handleClear} />
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">
          Showing {filtered.length} of {allChampions.length} champions
        </p>
      </div>
      <ChampionGrid champions={filtered} />
    </div>
  );
}
