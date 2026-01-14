import { X } from "lucide-react";
import {
	Command,
	CommandEmpty,
	CommandInput,
	CommandList,
} from "@/components/ui/command";

interface WritingSearchProps {
	tags: string[];
	activeTags: string[];
	onTagToggle: (tag: string) => void;
	searchQuery: string;
	onSearchChange: (query: string) => void;
}

export function WritingSearch({
	tags,
	activeTags,
	onTagToggle,
	searchQuery,
	onSearchChange,
}: WritingSearchProps) {
	return (
		<div className="mb-8 space-y-4">
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
					<div className="font-medium text-muted-foreground text-sm">
						Filter by tags:
					</div>
					<div className="flex flex-wrap gap-2">
						{tags.map((tag) => {
							const isActive = activeTags.includes(tag);
							return (
								<button
									type="button"
									key={tag}
									onClick={() => onTagToggle(tag)}
									className={`rounded-md px-3 py-1 font-medium text-sm transition-colors ${
										isActive
											? "bg-primary text-primary-foreground"
											: "bg-muted hover:bg-muted/80"
									}`}
								>
									{tag}
									{isActive && <X className="ml-1 inline-block size-3" />}
								</button>
							);
						})}
						{activeTags.length > 0 && (
							<button
								type="button"
								onClick={() => activeTags.forEach(onTagToggle)}
								className="rounded-md bg-destructive/10 px-3 py-1 font-medium text-destructive text-sm hover:bg-destructive/20"
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
