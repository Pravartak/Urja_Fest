"use client";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";

type Event = {
	Id: number | string;
	Name: string;
	Description?: string;
	Venue: string;
	Date_and_Time: string;
	Fee?: string;
};

type FirestoreEvent = Partial<Omit<Event, "Date_and_Time">> & {
	Date_and_Time?: unknown;
	Date?: unknown;
};

type EventCategory = {
	Id: number | string;
	Name: string;
	Events: Event[];
};

type FirestoreCategory = {
	Id?: number | string;
	Name?: string;
	Events?: unknown;
};

// Day 1 uses category documents containing an Events array.
// Days 2–4 continue to use individual event documents.
const eventDays = [
	{ label: "Day 1", collectionName: "Day1" },
	{ label: "Day 2", collectionName: "Day2" },
	{ label: "Day 3", collectionName: "Day3" },
	{ label: "Day 4", collectionName: "Day4" },
] as const;

export function formatEventDateTime(value: unknown): string {
	if (typeof value === "string") return value;

	const timestamp = value as {
		toDate?: () => Date;
		seconds?: number;
		nanoseconds?: number;
	} | null;

	let date: Date | undefined;

	if (timestamp?.toDate) {
		date = timestamp.toDate();
	} else if (typeof timestamp?.seconds === "number") {
		date = new Date(timestamp.seconds * 1_000);
	} else if (value instanceof Date) {
		date = value;
	}

	if (!date || Number.isNaN(date.getTime())) {
		return "Date to be announced";
	}

	const dateOnly =
		date.getHours() === 0 &&
		date.getMinutes() === 0 &&
		date.getSeconds() === 0;

	return date.toLocaleString(
		"en-IN",
		dateOnly
			? { dateStyle: "medium" }
			: { dateStyle: "medium", timeStyle: "short" },
	);
}

function mapEvent(eventData: unknown, fallbackId: string): Event {
	const data = (eventData ?? {}) as FirestoreEvent;

	return {
		Id: data.Id ?? fallbackId,
		Name: data.Name ?? "Untitled event",
		Description: data.Description,
		Venue: data.Venue ?? "Venue to be announced",
		Date_and_Time: formatEventDateTime(
			data.Date_and_Time ?? data.Date,
		),
		Fee: data.Fee,
	};
}

export default function Events() {
	const [eventsByDay, setEventsByDay] = useState<Record<string, Event[]>>({});
	const [day1Categories, setDay1Categories] = useState<EventCategory[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let active = true;

		const fetchEvents = async () => {
			try {
				const snapshots = await Promise.all(
					eventDays.map(({ collectionName }) =>
						getDocs(collection(db, collectionName)),
					),
				);

				const day1Snapshot = snapshots[0];
				const day1Data: EventCategory[] = day1Snapshot.docs.map(
					(categoryDoc) => {
						const data = categoryDoc.data() as FirestoreCategory;

						const categoryEvents = Array.isArray(data.Events)
							? data.Events.map((event, index) =>
									mapEvent(event, `${categoryDoc.id}-${index}`),
								)
							: [];

						return {
							Id: data.Id ?? categoryDoc.id,
							Name: data.Name ?? "Untitled category",
							Events: categoryEvents,
						};
					},
				);

				const nextEvents = Object.fromEntries(
					snapshots.slice(1).map((snapshot, index) => [
						eventDays[index + 1].label,
						snapshot.docs.map((eventDoc) =>
							mapEvent(eventDoc.data(), eventDoc.id),
						),
					]),
				);

				if (active) {
					setDay1Categories(day1Data);
					setEventsByDay(nextEvents);
					setError(null);
				}
			} catch (fetchError) {
				console.error(
					"[v0] Failed to fetch events from Firestore:",
					fetchError,
				);

				if (active) {
					setError(
						"Events are currently unavailable. Please try again later.",
					);
				}
			} finally {
				if (active) setLoading(false);
			}
		};

		fetchEvents();

		return () => {
			active = false;
		};
	}, []);

	return (
		<>
			<div className="cosmic-bg" />
			<div className="cosmic-vignette" />
			<Navbar />

			<div className="page-wrap">
				<section className="events-hero">
					<h1 className="hero-title" data-text="Events">
						Events
					</h1>

					<p className="hero-tagline">
						Explore all the events taking place during URJA.
					</p>
				</section>

				<section className="section">
					{loading ? (
						<div className="event-day-empty">Loading events...</div>
					) : error ? (
						<div className="event-day-empty">{error}</div>
					) : (
						<div className="event-days">
							{/* DAY 1 — Categories containing individual events */}
							<section className="event-day">
								<h2 className="section-title">Day 1</h2>

								{day1Categories.length > 0 ? (
									<div className="day1-categories">
										{day1Categories.map((category) => (
											<div
												key={category.Id}
												className="event-category"
											>
												<h3
													className="event-category-title"
													style={{
														marginBottom: "18px",
														fontSize: "1.5rem",
														color: "var(--gold)",
													}}
												>
													{category.Name}
												</h3>

												{category.Events.length > 0 ? (
													<div className="events-grid">
														{category.Events.map((event) => (
															<article
																key={event.Id}
																className="event-card"
															>
																<h3>{event.Name}</h3>

																{event.Description && (
																	<p>{event.Description}</p>
																)}

																<div className="event-meta">
																	<span>
																		Date:{" "}
																		{event.Date_and_Time}
																	</span>

																	<span>
																		Venue: {event.Venue}
																	</span>

																	{event.Fee && (
																		<span>
																			Fee: {event.Fee}
																		</span>
																	)}
																</div>
															</article>
														))}
													</div>
												) : (
													<div className="event-day-empty">
														No events announced yet.
													</div>
												)}
											</div>
										))}
									</div>
								) : (
									<div className="event-day-empty">
										No events announced yet.
									</div>
								)}
							</section>

							{/* DAYS 2–4 — Individual event documents */}
							{(["Day 2", "Day 3", "Day 4"] as const).map((day) => {
								const dayEvents = eventsByDay[day] ?? [];

								return (
									<section key={day} className="event-day">
										<h2 className="section-title">{day}</h2>

										{dayEvents.length > 0 ? (
											<div className="events-grid">
												{dayEvents.map((event) => (
													<article
														key={event.Id}
														className="event-card"
													>
														<h3>{event.Name}</h3>

														{event.Description && (
															<p>{event.Description}</p>
														)}

														<div className="event-meta">
															<span>
																Date:{" "}
																{event.Date_and_Time}
															</span>

															<span>
																Venue: {event.Venue}
															</span>

															{event.Fee && (
																<span>
																	Fee: {event.Fee}
																</span>
															)}
														</div>
													</article>
												))}
											</div>
										) : (
											<div className="event-day-empty">
												No events announced yet.
											</div>
										)}
									</section>
								);
							})}
						</div>
					)}
				</section>
			</div>

			<Footer />
		</>
	);
}
