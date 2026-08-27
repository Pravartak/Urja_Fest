"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { formatEventDateTime } from "../events/page";
import { db } from "@/lib/firebase";
import {
	addDoc,
	collection,
	doc,
	getDocs,
	serverTimestamp,
} from "firebase/firestore";

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

type College = {
	id: string;
	ClCode?: string;
	CollegeName?: string;
	Name?: string;
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
	const [colleges, setColleges] = useState<College[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const [formData, setFormData] = useState({
		fullName: "",
		contactNumber: "",
		emailId: "",
		selectedDay: "",
		selectedEvent: "",
		selectedCollege: "",
		isSoloPlayer: false,
		teamMember2: "",
		teamMember3: "",
		teamMember4: "",
		paymentProof: null as File | null,
	});

	const [submitted, setSubmitted] = useState(false);

	useEffect(() => {
		let active = true;

		async function fetchEvents() {
			try {
				const [collegeSnapshot, ...eventSnapshots] = await Promise.all([
					getDocs(collection(db, "CollegeCreds")),
					...eventDays.map(({ collectionName }) =>
						getDocs(collection(db, collectionName)),
					),
				]);
				const nextColleges = collegeSnapshot.docs.map((collegeDoc) => ({
					id: collegeDoc.id,
					...collegeDoc.data(),
				})) as College[];
				const nextEvents = Object.fromEntries(
					eventSnapshots.map((snapshot, index) => [
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
					setColleges(nextColleges);
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
				...(name === "selectedDay" ? { selectedEvent: "" } : {}),
			}));
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const selectedCollege = colleges.find(
			(college) => college.id === formData.selectedCollege,
		);
		if (!selectedCollege) {
			setSubmitError("Please select the college you will represent.");
			return;
		}

		setIsSubmitting(true);
		setSubmitError(null);
		try {
			await addDoc(
				collection(doc(db, "CollegeCreds", selectedCollege.id), "Requests"),
				{
					fullName: formData.fullName,
					contactNumber: formData.contactNumber,
					emailId: formData.emailId,
					collegeId: selectedCollege.id,
					collegeCode: selectedCollege.ClCode ?? null,
					collegeName:
						selectedCollege.CollegeName ?? selectedCollege.Name ?? "",
					selectedDay: formData.selectedDay,
					selectedEvent: formData.selectedEvent,
					isSoloPlayer: formData.isSoloPlayer,
					teamMember2: formData.teamMember2,
					teamMember3: formData.teamMember3,
					teamMember4: formData.teamMember4,
					paymentProofFileName: formData.paymentProof?.name ?? null,
					createdAt: serverTimestamp(),
				},
			);
			setSubmitted(true);
		} catch (submissionError) {
			console.error("Failed to submit registration:", submissionError);
			setSubmitError(
				"Registration could not be submitted. Please check your connection and try again.",
			);
			return;
		} finally {
			setIsSubmitting(false);
		}

		setTimeout(() => {
			setFormData({
				fullName: "",
				contactNumber: "",
				emailId: "",
				selectedDay: "",
				selectedEvent: "",
				selectedCollege: "",
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
										name="emailId"
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
											color: "var(--text-dim)",
											fontSize: "0.8rem",
											letterSpacing: "1.5px",
										}}>
										COLLEGE YOU WILL REPRESENT
									</label>
									<select
										name="selectedCollege"
										value={formData.selectedCollege}
										onChange={handleChange}
										required
										disabled={loading || colleges.length === 0}
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
										<option value="">
											{loading
												? "Loading colleges..."
												: error
													? "Colleges unavailable"
													: colleges.length === 0
														? "No colleges available"
														: "Select your college"}
										</option>
										{colleges.map((college) => (
											<option key={college.id} value={college.id}>
												{college.CollegeName ?? college.Name ?? college.ClCode ?? college.id}
												{college.ClCode ? ` (${college.ClCode})` : ""}
											</option>
										))}
									</select>
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
											disabled={loading}
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
											{eventDays.map(({ label: day }) => (
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
												disabled={loading || Boolean(error) || (eventsByDay[formData.selectedDay] ?? []).length === 0}
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
												<option value="">
													{loading
														? "Loading events..."
														: error
															? "Events unavailable"
															: "Select an event"}
												</option>
												{(eventsByDay[formData.selectedDay] ?? []).map((event) => (
													<option key={event.Id} value={event.Name}>
														{event.Name}
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

								{submitError && (
									<p style={{ color: "#ff8f8f", marginBottom: "16px" }} role="alert">
										{submitError}
									</p>
								)}

								<button
									type="submit"
									className="btn btn-gold"
									disabled={isSubmitting || loading || colleges.length === 0}
									style={{ width: "100%", justifyContent: "center" }}>
									{isSubmitting ? "Submitting..." : "Register Now"}
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
