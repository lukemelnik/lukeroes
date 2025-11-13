import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, ExternalLink } from "lucide-react";

interface TourDate {
	id: string;
	date: string;
	venue: string;
	city: string;
	country: string;
	ticketUrl: string;
	soldOut?: boolean;
}

const mockTourDates: TourDate[] = [
	{
		id: "1",
		date: "Mar 15, 2024",
		venue: "The Fillmore",
		city: "San Francisco",
		country: "CA",
		ticketUrl: "#",
	},
	{
		id: "2",
		date: "Mar 18, 2024",
		venue: "The Roxy Theatre",
		city: "Los Angeles",
		country: "CA",
		ticketUrl: "#",
		soldOut: true,
	},
	{
		id: "3",
		date: "Mar 22, 2024",
		venue: "House of Blues",
		city: "Chicago",
		country: "IL",
		ticketUrl: "#",
	},
	{
		id: "4",
		date: "Mar 25, 2024",
		venue: "Brooklyn Steel",
		city: "Brooklyn",
		country: "NY",
		ticketUrl: "#",
	},
	{
		id: "5",
		date: "Mar 28, 2024",
		venue: "9:30 Club",
		city: "Washington",
		country: "DC",
		ticketUrl: "#",
	},
];

export default function TourSection() {
	return (
		<section className="w-full py-16 px-4 md:px-6">
			<div className="container mx-auto max-w-4xl">
				<div className="mb-8 text-center">
					<h2 className="text-3xl font-bold tracking-tight mb-2">Tour Dates</h2>
					<p className="text-muted-foreground">
						Catch a live performance near you
					</p>
				</div>

				<div className="space-y-3">
					{mockTourDates.map((show) => (
						<Card
							key={show.id}
							className="hover:shadow-md transition-shadow"
						>
							<CardContent className="p-4 md:p-6">
								<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
									<div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
										<div className="flex items-center gap-2 text-sm font-medium min-w-[120px]">
											<Calendar className="w-4 h-4 text-muted-foreground" />
											<span>{show.date}</span>
										</div>

										<div className="flex-1 space-y-1">
											<h3 className="font-semibold text-lg">{show.venue}</h3>
											<div className="flex items-center gap-2 text-sm text-muted-foreground">
												<MapPin className="w-4 h-4" />
												<span>
													{show.city}, {show.country}
												</span>
											</div>
										</div>
									</div>

									<div className="flex items-center gap-2">
										{show.soldOut ? (
											<Button variant="secondary" disabled className="w-full md:w-auto">
												Sold Out
											</Button>
										) : (
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
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{mockTourDates.length === 0 && (
					<div className="text-center py-12">
						<p className="text-muted-foreground">
							No tour dates scheduled at the moment. Check back soon!
						</p>
					</div>
				)}
			</div>
		</section>
	);
}
