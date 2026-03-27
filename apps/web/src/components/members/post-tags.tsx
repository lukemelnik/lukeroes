interface PostTagsProps {
  tags: string[];
  onTagClick?: (tag: string) => void;
  className?: string;
}

export function PostTags({ tags, onTagClick, className = "" }: PostTagsProps) {
  if (tags.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => onTagClick?.(tag)}
          className="rounded-md bg-muted/50 px-2 py-0.5 text-muted-foreground text-xs transition-colors hover:bg-muted hover:text-foreground"
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
