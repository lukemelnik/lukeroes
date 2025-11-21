import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, ExternalLink } from "lucide-react";
import {
	type TourDate,
	tourDates,
	getUpcomingDates,
	getPastDates,
} from "@/lib/tour-config";

function TourDateCard({ show }: { show: TourDate }) {
	return (
		<Card className="hover:shadow-md transition-shadow">
			<CardContent className="p-4 md:p-6">
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
					<div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
						<div className="flex items-center gap-2 text-sm font-medium min-w-[120px]">
							<Calendar className="w-4 h-4 text-muted-foreground" />
							<span>{show.displayDate}</span>
						</div>

						<div className="flex-1 space-y-1">
							<h3 className="font-semibold text-lg">
								{show.venue}
								{show.notes && (
									<span className="text-sm font-normal text-muted-foreground ml-2">
										({show.notes})
									</span>
								)}
							</h3>
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<MapPin className="w-4 h-4" />
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
									<ExternalLink className="w-4 h-4 ml-2" />
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
		<section className="w-full py-16 px-4 md:px-6">
			<div className="container mx-auto max-w-4xl">
				<div className="mb-8 text-center">
					<h2 className="text-3xl font-bold tracking-tight mb-2">Tour Dates</h2>
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
					<div className="text-center py-12 border border-dashed rounded-lg">
						<p className="text-muted-foreground">
							No upcoming tour dates at the moment. Check back soon!
						</p>
					</div>
				)}

				{/* Past dates (optional) */}
				{showPastDates && pastDates.length > 0 && (
					<div className="mt-12">
						<h3 className="text-xl font-semibold mb-4 text-muted-foreground">
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
