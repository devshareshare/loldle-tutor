import type { Champion } from "@/lib/types";
import ChampionCard from "./ChampionCard";

interface ChampionGridProps {
  champions: Champion[];
  showToggles?: boolean;
  knownChampions?: Record<string, boolean>;
  onToggle?: (id: string) => void;
}

export default function ChampionGrid({
  champions,
  showToggles = false,
  knownChampions = {},
  onToggle,
}: ChampionGridProps) {
  if (champions.length === 0) {
    return (
      <div className="text-center py-16 text-muted">
        <p className="text-lg mb-2">No champions match your filters</p>
        <p className="text-sm">Try removing some filters to see more results</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {champions.map((champ) => (
        <ChampionCard
          key={champ.id}
          champion={champ}
          showToggle={showToggles}
          isKnown={knownChampions[champ.id] || false}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}
