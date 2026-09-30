"use client";

import { useEffect, useState } from "react";
// import Navbar from "../components/Navbar";
import Footer from "../../components/Footer";
import { formatEventDateTime } from "../../events/page";
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
	Fee?: string;
};

type College = {
	id: string;
	ClCode: string;
	Name: string;
	PRPoints: number;
	Password: string;
	Teams: number;
};

	const HACKHIVE_EVENT_NAME = "The Pitch Room";

export default function Register() {
	const [colleges, setColleges] = useState<College[]>([]);
	const [day2Events, setDay2Events] = useState<Event[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [showTeamMember5, setShowTeamMember5] = useState(false);

	const [formData, setFormData] = useState({
		fullName: "",
		contactNumber: "",
		emailId: "",
		selectedDay: "Day 2",
		selectedCategory: "",
		selectedEvent: "",
		selectedEventId: "",
		collegeId: "",
		isSoloPlayer: false,
		teamMember2: "",
		teamMember3: "",
		teamMember4: "",
		teamMember5: "",
		paymentProof: null as File | null,
	});

	const [submitted, setSubmitted] = useState(false);

	useEffect(() => {
		let active = true;

		const fetchRegistrationData = async () => {
			try {
				const [collegeSnapshot, day2Snapshot] =
					await Promise.all([
						getDocs(collection(db, "CollegeCreds")),
						getDocs(collection(db, "Day2")),
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

				const nextColleges = collegeSnapshot.docs.map((collegeDoc) => ({
					id: collegeDoc.id,
					...collegeDoc.data(),
				})) as College[];

				if (!active) return;

				setColleges(nextColleges);
				const hackHiveEvents = mapEvents(day2Snapshot).filter(
					(event) => event.Name === HACKHIVE_EVENT_NAME,
				);
				setDay2Events(hackHiveEvents);
				setFormData((prev) => ({
					...prev,
					selectedDay: "Day 2",
					selectedEvent: hackHiveEvents[0]
						? String(hackHiveEvents[0].Id)
						: "",
					selectedEventId: hackHiveEvents[0]
						? String(hackHiveEvents[0].Id)
						: "",
				}));
				setShowTeamMember5(true);
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
		return day === "Day 2" ? day2Events : [];
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
		if (selectedEvent?.Name === "The Pitch Room") {
			return "/PitchRoom_QR.jpeg"; // Pitch Room QR code
		}

		return "/Other_QR.jpeg"; // Default QR code for other events
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
				...(name === "isSoloPlayer" && checked
					? {
							teamMember2: "",
							teamMember3: "",
							teamMember4: "",
							teamMember5: "",
						}
					: {}),
			}));
			return;
		}

		const { name, value } = target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
			...(name === "selectedDay"
				? {
						selectedCategory: "",
						selectedEvent: "",
						selectedEventId: "",
					}
				: name === "selectedCategory"
					? { selectedEvent: "", selectedEventId: "" }
					: name === "selectedEvent"
						? { selectedEventId: value }
						: {}),
		}));

		// // Show teamMember5 input only if selected event is "The Pitch Room"
		// if (name === "selectedEvent") {
		// 	const event = getEventsForDay(formData.selectedDay).find(
		// 		(e) => String(e.Id) === value,
		// 	);
		// 	if (event?.Name === "HackHive Hackathon") {
		// 		setShowTeamMember5(true);
		// 	} else {
		// 		setShowTeamMember5(false);
		// 	}
		// } else if (name === "selectedDay") {
		// 	// Reset teamMember5 visibility when day changes
		// 	setShowTeamMember5(false);
		// }
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

		if (!selectedEvent || selectedEvent.Name !== HACKHIVE_EVENT_NAME) {
			setSubmitError("The Pitch Room is the only available event.");
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
				...(registrationData.isSoloPlayer
					? {}
					: {
							teamMember2: registrationData.teamMember2,
							teamMember3: registrationData.teamMember3,
							teamMember4: registrationData.teamMember4,
							teamMember5: registrationData.teamMember5,
						}),
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
					selectedDay: "Day 2",
					selectedCategory: "",
					selectedEvent: day2Events[0] ? String(day2Events[0].Id) : "",
					selectedEventId: day2Events[0] ? String(day2Events[0].Id) : "",
					collegeId: "",
					isSoloPlayer: false,
					teamMember2: "",
					teamMember3: "",
					teamMember4: "",
					teamMember5: "",
					paymentProof: null,
				});
				setShowTeamMember5(true);
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
			<div className="page-wrap">
				<section className="register-hero hackhive-registration-hero">
					<p
						style={{
							textAlign: "center",
							color: "#7ec9c2",
							fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
							letterSpacing: "5px",
							fontWeight: 700,
							textTransform: "uppercase",
							marginBottom: "12px",
						}}>
						The Pitch Room
					</p>
					<h1
						style={{
							textAlign: "center",
							fontSize: "clamp(3rem, 8vw, 4.5rem)",
							fontWeight: 800,
							letterSpacing: "2px",
							textTransform: "uppercase",
							backgroundImage:
								"linear-gradient(90deg, #5eead4 0%, #38bdf8 100%)",
							WebkitBackgroundClip: "text",
							backgroundClip: "text",
							color: "transparent",
							WebkitTextFillColor: "transparent",
							margin: 0,
						}}>
						Register
					</h1>
				</section>

				<section className="section">
					<div style={{ maxWidth: "600px", margin: "0 auto" }}>
						{submitted ? (
							<div
								style={{
									background: "rgba(94, 234, 212, 0.12)",
									border: "1px solid rgba(94, 234, 212, 0.4)",
									borderRadius: "18px",
									padding: "40px",
									textAlign: "center",
								}}>
								<div style={{ fontSize: "3rem", marginBottom: "20px" }}>✅</div>
								<h3
									style={{
										fontSize: "1.5rem",
										marginBottom: "10px",
										backgroundImage:
											"linear-gradient(90deg, #5eead4 0%, #38bdf8 100%)",
										WebkitBackgroundClip: "text",
										backgroundClip: "text",
										color: "transparent",
										WebkitTextFillColor: "transparent",
									}}>
									Registration Successful!
								</h3>
								<p style={{ color: "#a7f3e0" }}>
									Welcome to URJA 2026! Your registration details have been sent
									for approval.
								</p>
							</div>
						) : (
							<form
								onSubmit={handleSubmit}
								style={{
									background: "rgba(10, 20, 45, 0.55)",
									border: "1px solid rgba(94, 234, 212, 0.25)",
									borderRadius: "18px",
									padding: "40px",
									backdropFilter: "blur(6px)",
									boxShadow: "0 0 30px rgba(56, 189, 248, 0.08)",
								}}>
								<div style={{ marginBottom: "24px" }}>
									<label
										style={{
											display: "block",
											marginBottom: "10px",
											color: "#7ec9c2",
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
											color: "#e6fff9",
											padding: "14px 16px",
											border: "1px solid rgba(94, 234, 212, 0.3)",
											background: "rgba(4, 18, 28, 0.6)",
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
											color: "#7ec9c2",
											fontSize: "0.8rem",
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
											color: "#e6fff9",
											padding: "14px 16px",
											border: "1px solid rgba(94, 234, 212, 0.3)",
											background: "rgba(4, 18, 28, 0.6)",
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
											color: "#7ec9c2",
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
											color: "#e6fff9",
											padding: "14px 16px",
											border: "1px solid rgba(94, 234, 212, 0.3)",
											background: "rgba(4, 18, 28, 0.6)",
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
											color: "#7ec9c2",
											fontSize: "0.8rem",
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
											color: "#e6fff9",
											padding: "14px 16px",
											border: "1px solid rgba(94, 234, 212, 0.3)",
											background: "rgba(4, 18, 28, 0.6)",
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
											color: "#7ec9c2",
											fontSize: "0.8rem",
											letterSpacing: "1.5px",
										}}>
										EVENT
									</label>
									<div
										style={{
											width: "100%",
											borderRadius: "10px",
											color: "#e6fff9",
											padding: "14px 16px",
											border: "1px solid rgba(94, 234, 212, 0.3)",
											background: "rgba(4, 18, 28, 0.6)",
											fontSize: "0.95rem",
										}}>
										{loading
											? "Loading The Pitch Room..."
											: error
												? "The Pitch Room unavailable"
												: "The Pitch Room"}
									</div>
								</div>

								<div style={{ marginBottom: "24px" }}>
									<label
										style={{
											display: "flex",
											alignItems: "center",
											color: "#7ec9c2",
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

								<>
									<div style={{ marginBottom: "24px" }}>
										<label
											style={{
												display: "block",
												marginBottom: "10px",
												color: "#7ec9c2",
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
											disabled={formData.isSoloPlayer}
											placeholder="Full name of team member 2"
											style={{
												width: "100%",
												borderRadius: "10px",
												color: "#e6fff9",
												padding: "14px 16px",
												border: "1px solid rgba(94, 234, 212, 0.3)",
												background: "rgba(4, 18, 28, 0.6)",
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
												color: "#7ec9c2",
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
											disabled={formData.isSoloPlayer}
											placeholder="Full name of team member 3"
											style={{
												width: "100%",
												borderRadius: "10px",
												color: "#e6fff9",
												padding: "14px 16px",
												border: "1px solid rgba(94, 234, 212, 0.3)",
												background: "rgba(4, 18, 28, 0.6)",
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
												color: "#7ec9c2",
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
											disabled={formData.isSoloPlayer}
											placeholder="Full name of team member 4"
											style={{
												width: "100%",
												borderRadius: "10px",
												color: "#e6fff9",
												padding: "14px 16px",
												border: "1px solid rgba(94, 234, 212, 0.3)",
												background: "rgba(4, 18, 28, 0.6)",
												fontSize: "0.95rem",
												fontFamily: "inherit",
											}}
										/>
									</div>
									{/* {showTeamMember5 && (
										<div style={{ marginBottom: "24px" }}>
											<label
												style={{
													display: "block",
													marginBottom: "10px",
													color: "#7ec9c2",
													fontSize: "0.8rem",
													letterSpacing: "1.5px",
												}}>
												TEAM MEMBER 5 FULL NAME
											</label>
											<input
												type="text"
												name="teamMember5"
												value={formData.teamMember5}
												onChange={handleChange}
												disabled={formData.isSoloPlayer}
												placeholder="Full name of team member 5"
												style={{
													width: "100%",
													borderRadius: "10px",
													color: "#e6fff9",
													padding: "14px 16px",
													border: "1px solid rgba(94, 234, 212, 0.3)",
													background: "rgba(4, 18, 28, 0.6)",
													fontSize: "0.95rem",
													fontFamily: "inherit",
												}}
											/>
										</div>
									)} */}
								</>

								{formData.selectedEvent && (
									<div style={{ marginBottom: "24px", textAlign: "center" }}>
										<label
											style={{
												display: "block",
												marginBottom: "10px",
												color: "#7ec9c2",
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
												border: "1px solid rgba(94, 234, 212, 0.3)",
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
											color: "#7ec9c2",
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
											color: "#e6fff9",
											padding: "14px 16px",
											border: "1px solid rgba(94, 234, 212, 0.3)",
											background: "rgba(4, 18, 28, 0.6)",
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
									disabled={submitting || loading || colleges.length === 0}
									style={{
										width: "100%",
										justifyContent: "center",
										display: "flex",
										background:
											"linear-gradient(90deg, #5eead4 0%, #38bdf8 100%)",
										color: "#04121c",
										fontWeight: 700,
										border: "none",
										padding: "14px",
										borderRadius: "12px",
										fontSize: "0.95rem",
										cursor:
											submitting || loading || colleges.length === 0
												? "not-allowed"
												: "pointer",
										opacity:
											submitting || loading || colleges.length === 0 ? 0.6 : 1,
									}}>
									{submitting ? "Submitting..." : "Register Now"}
								</button>

								<p
									style={{
										marginTop: "24px",
										maxWidth: "100%",
										color: "#7ec9c2",
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
