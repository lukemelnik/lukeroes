export interface TourDate {
	id: string;
	/** ISO date string (YYYY-MM-DD) for sorting and filtering */
	date: string;
	/** Display format for the date (e.g., "Mar 15, 2024") */
	displayDate: string;
	venue: string;
	city: string;
	/** State/province or country code */
	region: string;
	country: string;
	/** Optional ticket purchase URL - if not provided, shows "TBA" */
	ticketUrl?: string;
	soldOut?: boolean;
	/** Optional additional info (e.g., "w/ Special Guest", "Festival Set") */
	notes?: string;
}

/**
 * Tour dates configuration
 * Add new dates to this array - they will automatically be sorted and filtered
 * by the tour section component.
 */
export const tourDates: TourDate[] = [
	{
		id: "1",
		date: "2024-03-15",
		displayDate: "Mar 15, 2024",
		venue: "The Fillmore",
		city: "San Francisco",
		region: "CA",
		country: "USA",
		ticketUrl: "#",
	},
	{
		id: "2",
		date: "2024-03-18",
		displayDate: "Mar 18, 2024",
		venue: "The Roxy Theatre",
		city: "Los Angeles",
		region: "CA",
		country: "USA",
		ticketUrl: "#",
		soldOut: true,
	},
	{
		id: "3",
		date: "2024-03-22",
		displayDate: "Mar 22, 2024",
		venue: "House of Blues",
		city: "Chicago",
		region: "IL",
		country: "USA",
		ticketUrl: "#",
	},
	{
		id: "4",
		date: "2024-03-25",
		displayDate: "Mar 25, 2024",
		venue: "Brooklyn Steel",
		city: "Brooklyn",
		region: "NY",
		country: "USA",
		ticketUrl: "#",
	},
	{
		id: "5",
		date: "2024-03-28",
		displayDate: "Mar 28, 2024",
		venue: "9:30 Club",
		city: "Washington",
		region: "DC",
		country: "USA",
		ticketUrl: "#",
	},
];

/** Get upcoming tour dates (today or future), sorted by date ascending */
export function getUpcomingDates(dates: TourDate[] = tourDates): TourDate[] {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	return dates
		.filter((d) => new Date(d.date) >= today)
		.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/** Get past tour dates, sorted by date descending (most recent first) */
export function getPastDates(dates: TourDate[] = tourDates): TourDate[] {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	return dates
		.filter((d) => new Date(d.date) < today)
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
