import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon, HomeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";

export default function NotFound() {
	return (
		<div className="flex min-h-[60vh] items-center justify-center p-4">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="size-6"
						>
							<circle cx="12" cy="12" r="10" />
							<line x1="12" y1="8" x2="12" y2="12" />
							<line x1="12" y1="16" x2="12.01" y2="16" />
						</svg>
					</EmptyMedia>
					<EmptyTitle>404 - Page Not Found</EmptyTitle>
					<EmptyDescription>
						The page you're looking for doesn't exist or has been moved.
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
						<Button asChild variant="default">
							<Link to="/">
								<HomeIcon />
								Go Home
							</Link>
						</Button>
						<Button
							asChild
							variant="outline"
							onClick={() => window.history.back()}
						>
							<span>
								<ArrowLeftIcon />
								Go Back
							</span>
						</Button>
					</div>
				</EmptyContent>
			</Empty>
		</div>
	);
}
