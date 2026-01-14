import { Calendar, ExternalLink, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	getPastDates,
	getUpcomingDates,
	type TourDate,
	tourDates,
} from "@/lib/tour-config";

function TourDateCard({ show }: { show: TourDate }) {
	return (
		<Card className="transition-shadow hover:shadow-md">
			<CardContent className="p-4 md:p-6">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center">
						<div className="flex min-w-[120px] items-center gap-2 font-medium text-sm">
							<Calendar className="h-4 w-4 text-muted-foreground" />
							<span>{show.displayDate}</span>
						</div>

						<div className="flex-1 space-y-1">
							<h3 className="font-semibold text-lg">
								{show.venue}
								{show.notes && (
									<span className="ml-2 font-normal text-muted-foreground text-sm">
										({show.notes})
									</span>
								)}
							</h3>
							<div className="flex items-center gap-2 text-muted-foreground text-sm">
								<MapPin className="h-4 w-4" />
								<span>
									{show.city}, {show.region}
									{show.country !== "USA" && `, ${show.country}`}
								</span>
							</div>
						</div>
					</div>

					<div className="flex items-center gap-2">
						{show.soldOut ? (
							<Button variant="secondary" disabled className="w-full md:w-auto">
								Sold Out
							</Button>
						) : show.ticketUrl ? (
							<Button asChild className="w-full md:w-auto">
								<a
									href={show.ticketUrl}
									target="_blank"
									rel="noopener noreferrer"
								>
									Get Tickets
									<ExternalLink className="ml-2 h-4 w-4" />
								</a>
							</Button>
						) : (
							<Button variant="outline" disabled className="w-full md:w-auto">
								TBA
							</Button>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

interface TourSectionProps {
	/** Show past dates section (for full tour page) */
	showPastDates?: boolean;
	/** Limit number of upcoming dates shown (for homepage preview) */
	limit?: number;
}

export default function TourSection({
	showPastDates = false,
	limit,
}: TourSectionProps) {
	const upcomingDates = getUpcomingDates(tourDates);
	const pastDates = getPastDates(tourDates);

	const displayedUpcoming = limit
		? upcomingDates.slice(0, limit)
		: upcomingDates;

	return (
		<section className="w-full px-4 py-16 md:px-6">
			<div className="container mx-auto max-w-4xl">
				<div className="mb-8 text-center">
					<h2 className="mb-2 font-bold text-3xl tracking-tight">Tour Dates</h2>
					<p className="text-muted-foreground">
						Catch a live performance near you
					</p>
				</div>

				{/* Upcoming dates */}
				{displayedUpcoming.length > 0 ? (
					<div className="space-y-3">
						{displayedUpcoming.map((show) => (
							<TourDateCard key={show.id} show={show} />
						))}
					</div>
				) : (
					<div className="rounded-lg border border-dashed py-12 text-center">
						<p className="text-muted-foreground">
							No upcoming tour dates at the moment. Check back soon!
						</p>
					</div>
				)}

				{/* Past dates (optional) */}
				{showPastDates && pastDates.length > 0 && (
					<div className="mt-12">
						<h3 className="mb-4 font-semibold text-muted-foreground text-xl">
							Past Shows
						</h3>
						<div className="space-y-3 opacity-60">
							{pastDates.map((show) => (
								<TourDateCard key={show.id} show={show} />
							))}
						</div>
					</div>
				)}
			</div>
		</section>
	);
}
