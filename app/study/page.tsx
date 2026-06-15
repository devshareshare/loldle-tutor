"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { getAllChampions, filterChampions } from "@/lib/champions";
import { getStudyToggles, setStudyToggle, getKnownCount } from "@/lib/storage";
import ChampionGrid from "@/components/ChampionGrid";
import FilterBar from "@/components/FilterBar";

export default function StudyPage() {
  const allChampions = useMemo(() => getAllChampions(), []);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [knownChampions, setKnownChampions] = useState<Record<string, boolean>>({});
  const [knownFilter, setKnownFilter] = useState<"all" | "known" | "unknown">("all");
  const [mounted, setMounted] = useState(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    setKnownChampions(getStudyToggles());
    setMounted(true);
  }, []);

  const categoryFiltered = useMemo(() => filterChampions(filters), [allChampions, filters]);

  const filtered = useMemo(() => {
    if (knownFilter === "known") return categoryFiltered.filter((c) => knownChampions[c.id]);
    if (knownFilter === "unknown") return categoryFiltered.filter((c) => !knownChampions[c.id]);
    return categoryFiltered;
  }, [categoryFiltered, knownFilter, knownChampions]);

  const knownCount = mounted ? getKnownCount() : 0;

  const handleToggle = useCallback((id: string) => {
    setKnownChampions((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      setStudyToggle(id, !!next[id]);
      return next;
    });
  }, []);

  const handleFilterChange = (category: string, value: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (value) next[category] = value;
      else delete next[category];
      return next;
    });
  };

  const handleClear = () => setFilters({});

  if (!mounted) return null;

  return (
    <div className="max-w-7xl mx-auto">
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onClear={handleClear}
        knownFilter={knownFilter}
        onKnownFilterChange={setKnownFilter}
      />
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">
          Showing {filtered.length} of {allChampions.length} champions
        </p>
        <p className="text-sm text-success font-medium">
          Known: {knownCount}/{allChampions.length}
        </p>
      </div>
      <ChampionGrid
        champions={filtered}
        showToggles
        knownChampions={knownChampions}
        onToggle={handleToggle}
      />
    </div>
  );
}
