import type { Champion } from "@/lib/types";

interface ChampionCardProps {
  champion: Champion;
  showToggle?: boolean;
  isKnown?: boolean;
  onToggle?: (id: string) => void;
}

export default function ChampionCard({
  champion,
  showToggle = false,
  isKnown = false,
  onToggle,
}: ChampionCardProps) {
  return (
    <a
      href={`/champions/${encodeURIComponent(champion.id)}`}
      className={`group block bg-surface border rounded-lg overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 ${
        isKnown ? "border-success/30" : "border-border"
      }`}
      onClick={(e) => {
        if (showToggle && onToggle) {
          e.preventDefault();
          onToggle(champion.id);
        }
      }}
    >
      <div className="aspect-square bg-background flex items-center justify-center p-2">
        <img
          src={`/champions/${champion.portraitName}`}
          alt={champion.name}
          className="w-full h-full object-contain rounded"
          loading="lazy"
        />
      </div>
      <div className="p-2 text-center">
        <p className="text-sm text-foreground truncate group-hover:text-primary transition-colors">
          {champion.name}
        </p>
        {showToggle && (
          <div className="mt-1">
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                isKnown ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
              }`}
            >
              {isKnown ? "Known" : "Learning"}
            </span>
          </div>
        )}
      </div>
    </a>
  );
}
