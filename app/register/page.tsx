"use client";

import { useEffect, useState } from "react";
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

type Event = {
	Id: number | string;
	Name: string;
	Description?: string;
	Venue: string;
	Date_and_Time: string;
};

type College = {
	id: string;
	ClCode: string;
	Name: string;
	PRPoints: number;
	Password: string;
	Teams: number;
};

// Firestore is used here only as a read-only source for colleges and events.
const eventDays = [
	{ label: "Day 1", collectionName: "Day1" },
	{ label: "Day 2", collectionName: "Day2" },
	{ label: "Day 3", collectionName: "Day3" },
	{ label: "Day 4", collectionName: "Day4" },
] as const;

export default function Register() {
	const [colleges, setColleges] = useState<College[]>([]);
	const [day1Events, setDay1Events] = useState<Event[]>([]);
	const [day2Events, setDay2Events] = useState<Event[]>([]);
	const [day3Events, setDay3Events] = useState<Event[]>([]);
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
		selectedEvent: "",
		selectedEventId: "",
		collegeId: "",
		isSoloPlayer: false,
		teamMember2: "",
		teamMember3: "",
		teamMember4: "",
		paymentProof: null as File | null,
	});

	const [submitted, setSubmitted] = useState(false);

	useEffect(() => {
		let active = true;

		const fetchRegistrationData = async () => {
			try {
				const [
					collegeSnapshot,
					day1Snapshot,
					day2Snapshot,
					day3Snapshot,
					day4Snapshot,
				] = await Promise.all([
					getDocs(collection(db, "CollegeCreds")),
					getDocs(collection(db, "Day1")),
					getDocs(collection(db, "Day2")),
					getDocs(collection(db, "Day3")),
					getDocs(collection(db, "Day4")),
				]);

				const mapEvents = (snapshot: typeof day1Snapshot): Event[] =>
					snapshot.docs.map((eventDoc) => {
						const data = eventDoc.data();
						return {
							Id: data.Id ?? eventDoc.id,
							Name: data.Name ?? "Untitled event",
							Description: data.Description,
							Venue: data.Venue ?? "Venue to be announced",
							Date_and_Time: formatEventDateTime(
								data.Date_and_Time ?? data.Date,
							),
						};
					});

				const nextColleges = collegeSnapshot.docs.map((collegeDoc) => ({
					id: collegeDoc.id,
					...collegeDoc.data(),
				})) as College[];

				if (!active) return;

				setColleges(nextColleges);
				setDay1Events(mapEvents(day1Snapshot));
				setDay2Events(mapEvents(day2Snapshot));
				setDay3Events(mapEvents(day3Snapshot));
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
				return day1Events;
			case "Day 2":
				return day2Events;
			case "Day 3":
				return day3Events;
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
			...(name === "selectedDay"
				? { selectedEvent: "", selectedEventId: "" }
				: {}),
		}));
	};

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
				selectedEvent: selectedEvent.Name,
				selectedEventId: String(selectedEvent.Id),
				teamMember2: registrationData.teamMember2,
				teamMember3: registrationData.teamMember3,
				teamMember4: registrationData.teamMember4,
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
					selectedEvent: "",
					selectedEventId: "",
					collegeId: "",
					isSoloPlayer: false,
					teamMember2: "",
					teamMember3: "",
					teamMember4: "",
					paymentProof: null,
				});
				setSubmitted(false);
			}, 3000);
		} catch (error) {
			console.error("Error submitting registration: ", error);
			setSubmitError(
				"Registration could not be submitted. Please check the payment proof image and try again.",
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
