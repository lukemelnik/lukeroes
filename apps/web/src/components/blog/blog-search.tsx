import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import { X } from "lucide-react";

interface BlogSearchProps {
  tags: string[];
  activeTags: string[];
  onTagToggle: (tag: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function BlogSearch({
  tags,
  activeTags,
  onTagToggle,
  searchQuery,
  onSearchChange,
}: BlogSearchProps) {
  return (
    <div className="space-y-4 mb-8">
      {/* Search Input */}
      <Command className="rounded-lg border">
        <CommandInput
          placeholder="Search posts..."
          value={searchQuery}
          onValueChange={onSearchChange}
        />
        <CommandList>
          <CommandEmpty>No posts found.</CommandEmpty>
        </CommandList>
      </Command>

      {/* Tag Filters */}
      {tags.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">
            Filter by tags:
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const isActive = activeTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => onTagToggle(tag)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {tag}
                  {isActive && (
                    <X className="inline-block ml-1 size-3" />
                  )}
                </button>
              );
            })}
            {activeTags.length > 0 && (
              <button
                onClick={() => activeTags.forEach(onTagToggle)}
                className="px-3 py-1 rounded-md text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
