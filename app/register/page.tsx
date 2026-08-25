"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { formatEventDateTime } from "../events/page";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

type Event = {
	Id: number | string;
	Name: string;
	Description?: string;
	Venue: string;
	Date_and_Time: string;
};

type FirestoreEvent = Partial<Omit<Event, "Date_and_Time">> & {
	Date_and_Time?: unknown;
	Date?: unknown;
};

// The display labels include spaces, but the Firestore collections are named
// Day1 through Day4. Keep the two values separate so changing the UI label
// cannot accidentally change the collection being queried.
const eventDays = [
	{ label: "Day 1", collectionName: "Day1" },
	{ label: "Day 2", collectionName: "Day2" },
	{ label: "Day 3", collectionName: "Day3" },
	{ label: "Day 4", collectionName: "Day4" },
] as const;

export default function Register() {
	const [eventsByDay, setEventsByDay] = useState<Record<string, Event[]>>({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [formData, setFormData] = useState({
		fullName: "",
		contactNumber: "",
		emailId: "",
		selectedDay: "",
		selectedEvent: "",
		isSoloPlayer: false,
		teamMember2: "",
		teamMember3: "",
		teamMember4: "",
		paymentProof: null as File | null,
	});

	const [submitted, setSubmitted] = useState(false);

	const mockEvents = {
		"Day 1": [
			{ name: "Coding Challenge", fee: "₹100" },
			{ name: "Quiz Bowl", fee: "₹50" },
			{ name: "Debate Competition", fee: "₹75" },
		],
		"Day 2": [
			{ name: "Robotics Workshop", fee: "₹200" },
			{ name: "Gaming Tournament", fee: "₹150" },
			{ name: "Photography Contest", fee: "₹60" },
		],
		"Day 3": [
			{ name: "Cultural Dance", fee: "₹120" },
			{ name: "Singing Competition", fee: "₹80" },
			{ name: "Fashion Show", fee: "₹180" },
		],
	};

	useEffect(() => {
		let active = true;

		async function fetchEvents() {
			try {
				const snapshots = await Promise.all(
					eventDays.map(({ collectionName }) =>
						getDocs(collection(db, collectionName)),
					),
				);
				const nextEvents = Object.fromEntries(
					snapshots.map((snapshot, index) => [
						eventDays[index].label,
						snapshot.docs.map((eventDoc) => {
							const data = eventDoc.data() as FirestoreEvent;
							return {
								Id: data.Id ?? eventDoc.id,
								Name: data.Name ?? "Untitled event",
								Description: data.Description,
								Venue: data.Venue ?? "Venue to be announced",
								Date_and_Time: formatEventDateTime(
									data.Date_and_Time ?? data.Date,
								),
							} satisfies Event;
						}),
					]),
				);

				if (active) {
					setEventsByDay(nextEvents);
					setError(null);
				}
			} catch (fetchError) {
				console.error(
					"[v0] Failed to fetch events from Firestore:",
					fetchError,
				);
				if (active)
					setError("Events are currently unavailable. Please try again later.");
			} finally {
				if (active) setLoading(false);
			}
		}

		fetchEvents();
		return () => {
			active = false;
		};
	}, []);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			setFormData((prev) => ({ ...prev, paymentProof: e.target.files![0] }));
		}
	};

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const target = e.target;

		if (target instanceof HTMLInputElement) {
			const { name, type, checked, value } = target;
			setFormData((prev) => ({
				...prev,
				[name]: type === "checkbox" ? checked : value,
			}));
			return;
		}

		const { name, value } = target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = (e: any) => {
		e.preventDefault();
		setSubmitted(true);
		console.log("Form submitted:", formData);
		// Simulate API call or processing
		setTimeout(() => {
			setFormData({
				fullName: "",
				contactNumber: "",
				emailId: "",
				selectedDay: "",
				selectedEvent: "",
				isSoloPlayer: false,
				teamMember2: "",
				teamMember3: "",
				teamMember4: "",
				paymentProof: null,
			});
			setSubmitted(false);
		}, 3000);
	};

	return (
		<>
			<div className="cosmic-bg" />
			<div className="cosmic-vignette" />
			<Navbar />

			<div className="page-wrap">
				<section className="register-hero">
					<h1 className="hero-title" data-text="Register">
						Register
					</h1>
					<p className="hero-tagline">
						Be part of the cosmic experience. Register now!
					</p>
				</section>

				<section className="section">
					<div style={{ maxWidth: "600px", margin: "0 auto" }}>
						{submitted ? (
							<div
								style={{
									background: "rgba(80, 220, 140, 0.15)",
									border: "1px solid rgba(80, 220, 140, 0.5)",
									borderRadius: "18px",
									padding: "40px",
									textAlign: "center",
								}}>
								<div style={{ fontSize: "3rem", marginBottom: "20px" }}>✅</div>
								<h3
									style={{
										fontSize: "1.5rem",
										marginBottom: "10px",
										color: "var(--gold)",
									}}>
									Registration Successful!
								</h3>
								<p style={{ color: "var(--text-dim)" }}>
									Welcome to URJA 2026! Check your email for confirmation
									details.
								</p>
							</div>
						) : (
							<form
								onSubmit={handleSubmit}
								style={{
									background: "var(--card)",
									border: "1px solid var(--border)",
									borderRadius: "18px",
									padding: "40px",
								}}>
								<div style={{ marginBottom: "24px" }}>
									<label
										style={{
											display: "block",
											marginBottom: "10px",
											color: "var(--text-dim)",
											fontSize: "0.8rem",
											letterSpacing: "1.5px",
										}}>
										YOUR FULL NAME (TEAM LEADER)
									</label>
									<input
										type="text"
										name="fullName"
										value={formData.fullName}
										onChange={handleChange}
										required
										placeholder="Your full name"
										style={{
											width: "100%",
											borderRadius: "10px",
											color: "var(--text)",
											padding: "14px 16px",
											border: "1px solid var(--border)",
											background: "var(--input-bg)",
											fontSize: "0.95rem",
											fontFamily: "inherit",
										}}
									/>
								</div>

								<div style={{ marginBottom: "24px" }}>
									<label
										style={{
											display: "block",
											marginBottom: "10px",
											color: "var(--text-dim)", // Changed from --text-dim
											fontSize: "0.8rem", // Changed from 0.75rem
											letterSpacing: "1.5px",
										}}>
										YOUR EMAIL ID
									</label>
									<input
										type="email"
										name="email"
										value={formData.emailId}
										onChange={handleChange}
										required
										placeholder="your@email.com"
										style={{
											width: "100%",
											borderRadius: "10px",
											color: "var(--text)",
											padding: "14px 16px",
											border: "1px solid var(--border)",
											background: "var(--input-bg)",
											fontSize: "0.95rem",
											fontFamily: "inherit",
										}}
									/>
								</div>

								<div style={{ marginBottom: "24px" }}>
									<label
										style={{
											display: "block",
											marginBottom: "10px",
											color: "var(--text-dim)", // Changed from --text-dim
											fontSize: "0.8rem", // Changed from 0.75rem
											letterSpacing: "1.5px",
										}}>
										YOUR CONTACT NUMBER
									</label>
									<input
										type="tel"
										name="contactNumber"
										value={formData.contactNumber}
										onChange={handleChange}
										required
										placeholder="+91 XXXXXXXXXX"
										style={{
											width: "100%",
											borderRadius: "10px",
											color: "var(--text)",
											padding: "14px 16px",
											border: "1px solid var(--border)",
											background: "var(--input-bg)",
											fontSize: "0.95rem",
											fontFamily: "inherit",
										}}
									/>
								</div>
								<div style={{ marginBottom: "24px" }}>
									<label
										style={{
											display: "block",
											marginBottom: "10px",
											color: "var(--text-dim)",
											fontSize: "0.8rem",
											letterSpacing: "1.5px",
										}}>
										SELECT DAY
									</label>
									<select
										name="selectedDay"
										value={formData.selectedDay}
										onChange={handleChange}
										required
										style={{
											width: "100%",
											borderRadius: "10px",
											color: "var(--text)",
											padding: "14px 16px",
											border: "1px solid var(--border)", // Changed from rgba(0,0,0,0.3)
											background: "var(--input-bg)",
											fontSize: "0.95rem",
											fontFamily: "inherit",
										}}>
										<option value="">Select a day</option>
										{Object.keys(mockEvents).map((day) => (
											<option key={day} value={day}>
												{day}
											</option>
										))}
									</select>
								</div>

								{formData.selectedDay && (
									<div style={{ marginBottom: "24px" }}>
										<label
											style={{
												display: "block",
												marginBottom: "10px",
												color: "var(--text-dim)",
												fontSize: "0.8rem",
												letterSpacing: "1.5px",
											}}>
											SELECT EVENT
										</label>
										<select
											name="selectedEvent"
											value={formData.selectedEvent}
											onChange={handleChange}
											required
											style={{
												width: "100%",
												borderRadius: "10px",
												color: "var(--text)",
												padding: "14px 16px",
												border: "1px solid var(--border)",
												background: "var(--input-bg)",
												fontSize: "0.95rem",
												fontFamily: "inherit",
											}}>
											<option value="">Select an event</option>
											{mockEvents[
												formData.selectedDay as keyof typeof mockEvents
											]?.map((event) => (
												<option key={event.name} value={event.name}>
													{event.name} ({event.fee})
												</option>
											))}
										</select>
									</div>
								)}

								<div style={{ marginBottom: "24px" }}>
									<label
										style={{
											display: "flex",
											alignItems: "center",
											color: "var(--text-dim)",
											fontSize: "0.8rem",
											letterSpacing: "1.5px",
										}}>
										<input
											type="checkbox"
											name="isSoloPlayer"
											checked={formData.isSoloPlayer}
											onChange={handleChange}
											style={{ marginRight: "10px" }}
										/>
										SOLO PLAYER
									</label>
								</div>

								{!formData.isSoloPlayer && (
									<>
										<div style={{ marginBottom: "24px" }}>
											<label
												style={{
													display: "block",
													marginBottom: "10px",
													color: "var(--text-dim)",
													fontSize: "0.8rem",
													letterSpacing: "1.5px",
												}}>
												TEAM MEMBER 2 FULL NAME
											</label>
											<input
												type="text"
												name="teamMember2"
												value={formData.teamMember2}
												onChange={handleChange}
												placeholder="Full name of team member 2"
												style={{
													width: "100%",
													borderRadius: "10px",
													color: "var(--text)",
													padding: "14px 16px",
													border: "1px solid var(--border)",
													background: "var(--input-bg)",
													fontSize: "0.95rem",
													fontFamily: "inherit",
												}}
											/>
										</div>
										<div style={{ marginBottom: "24px" }}>
											<label
												style={{
													display: "block",
													marginBottom: "10px",
													color: "var(--text-dim)",
													fontSize: "0.8rem",
													letterSpacing: "1.5px",
												}}>
												TEAM MEMBER 3 FULL NAME
											</label>
											<input
												type="text"
												name="teamMember3"
												value={formData.teamMember3}
												onChange={handleChange}
												placeholder="Full name of team member 3"
												style={{
													width: "100%",
													borderRadius: "10px",
													color: "var(--text)",
													padding: "14px 16px",
													border: "1px solid var(--border)",
													background: "var(--input-bg)",
													fontSize: "0.95rem",
													fontFamily: "inherit",
												}}
											/>
										</div>
										<div style={{ marginBottom: "24px" }}>
											<label
												style={{
													display: "block",
													marginBottom: "10px",
													color: "var(--text-dim)",
													fontSize: "0.8rem",
													letterSpacing: "1.5px",
												}}>
												TEAM MEMBER 4 FULL NAME
											</label>
											<input
												type="text"
												name="teamMember4"
												value={formData.teamMember4}
												onChange={handleChange}
												placeholder="Full name of team member 4"
												style={{
													width: "100%",
													borderRadius: "10px",
													color: "var(--text)",
													padding: "14px 16px",
													border: "1px solid var(--border)",
													background: "var(--input-bg)",
													fontSize: "0.95rem",
													fontFamily: "inherit",
												}}
											/>
										</div>
									</>
								)}

								<div style={{ marginBottom: "24px", textAlign: "center" }}>
									<label
										style={{
											display: "block",
											marginBottom: "10px",
											color: "var(--text-dim)",
											fontSize: "0.8rem",
											letterSpacing: "1.5px",
										}}>
										PAYMENT QR CODE
									</label>
									{/* Placeholder for QR Code image */}
									<img
										src="/assets/img/cab-logo.png" // Replace with your actual QR code image path
										alt="Payment QR Code"
										style={{
											maxWidth: "200px",
											height: "auto",
											borderRadius: "10px",
											border: "1px solid var(--border)",
											margin: "0 auto",
											display: "block",
										}}
									/>
								</div>

								<div style={{ marginBottom: "32px" }}>
									<label
										style={{
											display: "block",
											marginBottom: "10px",
											color: "var(--text-dim)",
											fontSize: "0.8rem",
											letterSpacing: "1.5px",
										}}>
										UPLOAD PAYMENT PROOF (IMAGE)
									</label>
									<input
										type="file"
										name="paymentProof"
										accept="image/*"
										onChange={handleFileChange}
										required
										style={{
											width: "100%",
											borderRadius: "10px",
											color: "var(--text)",
											padding: "14px 16px",
											border: "1px solid var(--border)",
											background: "var(--input-bg)",
											fontSize: "0.95rem",
											fontFamily: "inherit",
										}}
									/>
								</div>

								<button
									type="submit"
									className="btn btn-gold"
									style={{ width: "100%", justifyContent: "center" }}>
									Register Now
								</button>

								<p
									style={{
										marginTop: "24px",
										maxWidth: "100%",
										color: "var(--text-dim)",
										fontSize: "0.82rem",
										textAlign: "center",
									}}>
									By registering, you agree to participate in URJA 2026 events.
								</p>
							</form>
						)}
					</div>
				</section>
			</div>

			<Footer />
		</>
	);
}
