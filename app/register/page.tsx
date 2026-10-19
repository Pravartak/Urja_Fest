"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { formatEventDateTime } from "../events/page";
import { db, storage } from "@/lib/firebase";
import {
	collection,
	doc,
	getDocs,
	serverTimestamp,
	writeBatch,
} from "firebase/firestore";
import {
	getDownloadURL,
	ref as storageRef,
	uploadBytes,
} from "firebase/storage";
import { TEAM_MEMBER_POSITIONS } from "@/lib/teamMembers";

type Event = {
	Id: number | string;
	Name: string;
	Description?: string;
	Venue: string;
	Date_and_Time: string;
	Fee?: string;
};

type EventCategory = {
	Id: number | string;
	Name: string;
	Events: Event[];
};

type College = {
	id: string;
	ClCode: string;
	Name: string;
	PRPoints: number;
	Teams: number;
};

// Firestore is used here only as a read-only source for colleges and events.
const eventDays = [
	{ label: "Day 1", collectionName: "Day1" },
	{ label: "Day 2", collectionName: "Day2" },
	{ label: "Day 4", collectionName: "Day4" },
] as const;

const separateDay2Events = new Set(["HackHive Hackathon", "The Pitch Room"]);

type TeamSize = { min: number; max: number };

// Team size per event, counting the team leader. Keyed by the Firestore event
// Id so renaming an event doesn't lose its limits.
const eventTeamSizes: Record<string, TeamSize> = {
	// Day 1 - Literature Arts
	DRs3mw9JzZpjnImyatVK: { min: 1, max: 1 }, // Stellar Punchlines
	KLJMB26MaCepuzCWgdBG: { min: 1, max: 1 }, // Shades of Shakespeare
	eEQcl5kjTjAfsu0x9ERA: { min: 1, max: 1 }, // Ink Verse
	// Day 1 - Fine Arts
	YvHSH7jjQiVXK7MXVdjK: { min: 1, max: 1 }, // Scribble Verse
	"3sMvFccurr1uaJpgW8sH": { min: 1, max: 2 }, // Canvas of Souls
	dP41i6bh3WJan5GJOBJT: { min: 1, max: 1 }, // Arabasque
	// Day 1 - Solo Performances
	"31uIVClwanqksfFZCcgV": { min: 1, max: 1 }, // Solea
	aY9dyLV5IZHuejYmi8yu: { min: 1, max: 1 }, // Resonance
	LUTS86JLpZNV9n5ZGjMG: { min: 1, max: 1 }, // VerseVerse
	// Day 1 - Group Performances
	"15gWA1hrAhARnYS4agZL": { min: 4, max: 8 }, // Harmonic Orbit
	fvcIcIJ0IW6kBTVjXbOK: { min: 10, max: 10 }, // Theatre of Souls
	// Day 4
	UtPd8EKsb6VEH0UbqHgE: { min: 10, max: 10 }, // Confluence
	sPlrTbxAymZXhmed78Zf: { min: 10, max: 14 }, // Aura
};

// Events without an entry above keep the old form: leader plus up to 3 optional members.
const defaultTeamSize: TeamSize = { min: 1, max: 4 };

const getTeamSize = (eventId: string): TeamSize =>
	eventTeamSizes[eventId] ?? defaultTeamSize;

const emptyTeamMembers = () => TEAM_MEMBER_POSITIONS.map(() => "");

export default function Register() {
	const [colleges, setColleges] = useState<College[]>([]);
	const [day1Categories, setDay1Categories] = useState<EventCategory[]>([]);
	const [day2Events, setDay2Events] = useState<Event[]>([]);
	const [day4Events, setDay4Events] = useState<Event[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const [formData, setFormData] = useState({
		fullName: "",
		contactNumber: "",
		emailId: "",
		selectedDay: "",
		selectedCategory: "",
		selectedEvent: "",
		selectedEventId: "",
		collegeId: "",
		teamMembers: emptyTeamMembers(),
		paymentProof: null as File | null,
	});

	const [submitted, setSubmitted] = useState(false);

	useEffect(() => {
		let active = true;

		const fetchRegistrationData = async () => {
			try {
				const [collegeSnapshot, day1Snapshot, day2Snapshot, day4Snapshot] =
					await Promise.all([
						getDocs(collection(db, "CollegeCreds")),
						getDocs(collection(db, "Day1")),
						getDocs(collection(db, "Day2")),
						getDocs(collection(db, "Day4")),
					]);

				const mapEvent = (eventData: unknown, fallbackId: string): Event => {
					const data = (eventData ?? {}) as Partial<Event> & {
						Date?: unknown;
						Date_and_Time?: unknown;
					};

					return {
						Id: data.Id ?? fallbackId,
						Name: data.Name ?? "Untitled event",
						Description: data.Description,
						Venue: data.Venue ?? "Venue to be announced",
						Date_and_Time: formatEventDateTime(data.Date_and_Time ?? data.Date),
						Fee: data.Fee ?? "Not mentioned yet",
					};
				};

				const mapEvents = (snapshot: typeof day2Snapshot): Event[] =>
					snapshot.docs.map((eventDoc) => {
						return mapEvent(eventDoc.data(), eventDoc.id);
					});

				const day1Categories = day1Snapshot.docs.map((categoryDoc) => {
					const data = categoryDoc.data();
					const events = Array.isArray(data.Events)
						? data.Events.map((event, index) =>
								mapEvent(event, `${categoryDoc.id}-${index}`),
							)
						: [];

					return {
						Id: data.Id ?? categoryDoc.id,
						Name: data.Name ?? "Untitled category",
						Events: events,
					};
				});

				const nextColleges = collegeSnapshot.docs.map((collegeDoc) => ({
					id: collegeDoc.id,
					...collegeDoc.data(),
				})) as College[];

				if (!active) return;

				setColleges(nextColleges);
				setDay1Categories(day1Categories);
				setDay2Events(mapEvents(day2Snapshot));
				setDay4Events(mapEvents(day4Snapshot));
				setError(null);
			} catch (fetchError) {
				console.error("Failed to fetch registration data: ", fetchError);

				if (active) {
					setError(
						"Registration data is currently unavailable. Please try again later.",
					);
				}
			} finally {
				if (active) setLoading(false);
			}
		};

		fetchRegistrationData();

		return () => {
			active = false;
		};
	}, []);

	const getEventsForDay = (day: string): Event[] => {
		switch (day) {
			case "Day 1":
				return (
					day1Categories.find(
						(category) => String(category.Id) === formData.selectedCategory,
					)?.Events ?? []
				);
			case "Day 2":
				return day2Events.filter((event) => !separateDay2Events.has(event.Name));
			case "Day 4":
				return day4Events;
			default:
				return [];
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			setFormData((prev) => ({ ...prev, paymentProof: e.target.files![0] }));
		}
	};

	const getQRCodeImage = (): string => {
		const events = getEventsForDay(formData.selectedDay);
		const selectedEvent = events.find(
			(e) => String(e.Id) === formData.selectedEvent,
		);

		// Return different QR code based on selected event
		if (selectedEvent?.Name === "HackHive Hackathon") {
			return "/Hackathon_QR.jpeg"; // HackHive QR code
		}

		return "/Other_QR.jpeg"; // Default QR code for other events
	};

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
			...(name === "selectedDay"
				? {
						selectedCategory: "",
						selectedEvent: "",
						selectedEventId: "",
						teamMembers: emptyTeamMembers(),
					}
				: name === "selectedCategory"
					? {
							selectedEvent: "",
							selectedEventId: "",
							teamMembers: emptyTeamMembers(),
						}
					: name === "selectedEvent"
						? { selectedEventId: value, teamMembers: emptyTeamMembers() }
						: {}),
		}));
	};

	const handleTeamMemberChange = (index: number, value: string) => {
		setFormData((prev) => ({
			...prev,
			teamMembers: prev.teamMembers.map((member, i) =>
				i === index ? value : member,
			),
		}));
	};

	const teamSize = getTeamSize(formData.selectedEvent);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!formData.paymentProof) {
			setSubmitError("Please upload your payment proof image.");
			return;
		}

		const selectedCollege = colleges.find(
			(college) => college.id === formData.collegeId,
		);

		if (!selectedCollege) {
			setSubmitError("Please select the college you will represent.");
			return;
		}

		const selectedEvent = getEventsForDay(formData.selectedDay).find(
			(event) => String(event.Id) === formData.selectedEvent,
		);

		if (!selectedEvent) {
			setSubmitError("Please select a valid event.");
			return;
		}

		setSubmitError(null);
		setSubmitting(true);

		try {
			const requestRef = doc(
				collection(db, "CollegeCreds", selectedCollege.id, "Requests"),
			);
			const safeFileName = formData.paymentProof.name.replace(/\s+/g, "_");
			const paymentProofRef = storageRef(
				storage,
				`payment-proofs/${selectedCollege.id}/${requestRef.id}-${safeFileName}`,
			);
			console.log("Payment proof:", {
				name: formData.paymentProof.name,
				type: formData.paymentProof.type,
				size: formData.paymentProof.size,
				sizeMB: (formData.paymentProof.size / (1024 * 1024)).toFixed(2),
			});
			const uploadResult = await uploadBytes(
				paymentProofRef,
				formData.paymentProof,
			);
			const paymentProofUrl = await getDownloadURL(uploadResult.ref);
			const batch = writeBatch(db);
			const { paymentProof, ...registrationData } = formData;

			batch.set(requestRef, {
				id: requestRef.id,
				collegeId: selectedCollege.id,
				collegeName: selectedCollege.Name,
				collegeCode: selectedCollege.ClCode,
				fullName: registrationData.fullName,
				contactNumber: registrationData.contactNumber,
				emailId: registrationData.emailId,
				selectedDay: registrationData.selectedDay,
				...(registrationData.selectedDay === "Day 1"
					? { selectedCategory: registrationData.selectedCategory }
					: {}),
				selectedEvent: selectedEvent.Name,
				selectedEventId: String(selectedEvent.Id),
				...Object.fromEntries(
					registrationData.teamMembers
						.slice(0, getTeamSize(String(selectedEvent.Id)).max - 1)
						.map((member, index) => [
							`teamMember${TEAM_MEMBER_POSITIONS[index]}`,
							member.trim(),
						]),
				),
				paymentProofUrl,
				paymentProofPath: uploadResult.ref.fullPath,
				paymentProofName: safeFileName,
				paymentProofType: paymentProof.type,
				paymentProofSize: paymentProof.size,
				status: "pending",
				createdAt: serverTimestamp(),
			});

			await batch.commit();
			setSubmitted(true);

			setTimeout(() => {
				setFormData({
					fullName: "",
					contactNumber: "",
					emailId: "",
					selectedDay: "",
					selectedCategory: "",
					selectedEvent: "",
					selectedEventId: "",
					collegeId: "",
					teamMembers: emptyTeamMembers(),
					paymentProof: null,
				});
				setSubmitted(false);
			}, 3000);
		} catch (error) {
			console.error("🔥 REGISTRATION FAILED:", error);

			if (error instanceof Error) {
				console.error("Message:", error.message);
				console.error("Name:", error.name);
			}

			setSubmitError(
				error instanceof Error
					? error.message
					: "Registration could not be submitted.",
			);
		} finally {
			setSubmitting(false);
		}
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
									Welcome to URJA 2026! Your registration details have been sent
									for approval.
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
										name="collegeId"
										value={formData.collegeId}
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
												{college.Name ?? college.ClCode ?? college.id}
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

								{formData.selectedDay === "Day 2" && (
									<div className="separate-registration-notice">
										<p>Some Day 2 events have dedicated registration pages:</p>
										<div className="separate-registration-links">
											<Link href="/hackhive" className="separate-registration-link">
												Register for HackHive Hackathon
											</Link>
											<Link href="/pitchroom" className="separate-registration-link">
												Register for The Pitch Room
											</Link>
										</div>
									</div>
								)}

								{formData.selectedDay === "Day 1" && (
									<div style={{ marginBottom: "24px" }}>
										<label
											style={{
												display: "block",
												marginBottom: "10px",
												color: "var(--text-dim)",
												fontSize: "0.8rem",
												letterSpacing: "1.5px",
											}}>
											SELECT CATEGORY
										</label>
										<select
											name="selectedCategory"
											value={formData.selectedCategory}
											onChange={handleChange}
											required
											disabled={
												loading || Boolean(error) || day1Categories.length === 0
											}
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
													? "Loading categories..."
													: error
														? "Categories unavailable"
														: day1Categories.length === 0
															? "No categories available"
															: "Select a category"}
											</option>
											{day1Categories.map((category) => (
												<option key={category.Id} value={category.Id}>
													{category.Name}
												</option>
											))}
										</select>
									</div>
								)}

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
											disabled={
												loading ||
												Boolean(error) ||
												getEventsForDay(formData.selectedDay).length === 0
											}
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
											{getEventsForDay(formData.selectedDay).map((event) => (
												<option key={event.Id} value={event.Id}>
													{event.Fee
														? `${event.Name} - Fee: ${event.Fee}`
														: event.Name}
												</option>
											))}
										</select>
									</div>
								)}

								{formData.selectedEvent && (
									<p
										style={{
											marginBottom: "24px",
											color: "var(--text-dim)",
											fontSize: "0.8rem",
											letterSpacing: "1.5px",
										}}>
										{teamSize.max === 1
											? "SOLO EVENT - NO TEAM MEMBERS NEEDED"
											: teamSize.min === teamSize.max
												? `TEAM OF ${teamSize.max} INCLUDING YOU`
												: `TEAM OF ${teamSize.min} TO ${teamSize.max} INCLUDING YOU`}
									</p>
								)}

								{TEAM_MEMBER_POSITIONS.filter(
									(position) =>
										formData.selectedEvent !== "" && position <= teamSize.max,
								).map((position, index) => {
									const required = position <= teamSize.min;

									return (
										<div key={position} style={{ marginBottom: "24px" }}>
											<label
												style={{
													display: "block",
													marginBottom: "10px",
													color: "var(--text-dim)",
													fontSize: "0.8rem",
													letterSpacing: "1.5px",
												}}>
												TEAM MEMBER {position} FULL NAME
												{required ? "" : " (OPTIONAL)"}
											</label>
											<input
												type="text"
												name={`teamMember${position}`}
												value={formData.teamMembers[index]}
												onChange={(e) =>
													handleTeamMemberChange(index, e.target.value)
												}
												required={required}
												placeholder={`Full name of team member ${position}`}
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
									);
								})}

								{formData.selectedEvent && (
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
										<img
											src={getQRCodeImage()}
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
								)}

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
									<p
										style={{ color: "#ff8f8f", marginBottom: "16px" }}
										role="alert">
										{submitError}
									</p>
								)}

								<button
									type="submit"
									className="btn btn-gold"
									disabled={submitting || loading || colleges.length === 0}
									style={{ width: "100%", justifyContent: "center" }}>
									{submitting ? "Submitting..." : "Register Now"}
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
