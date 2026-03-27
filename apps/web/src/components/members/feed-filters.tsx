const FILTERS: { label: string; value: string | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Writing", value: "writing" },
  { label: "Audio", value: "audio" },
  { label: "Photos", value: "photo" },
  { label: "Notes", value: "note" },
];

interface FeedFiltersProps {
  activeFilter: string | undefined;
  onFilterChange: (filter: string | undefined) => void;
}

export function FeedFilters({ activeFilter, onFilterChange }: FeedFiltersProps) {
  return (
    <div className="flex gap-1">
      {FILTERS.map(({ label, value }) => {
        const isActive = activeFilter === value;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onFilterChange(value)}
            className={`rounded-md px-3 py-1.5 font-medium text-sm transition-colors ${
              isActive
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
