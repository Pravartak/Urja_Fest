"use client";

import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, RoundedBox, Text } from "@react-three/drei";
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
import LcdBoard from "@/app/components/CircuitBoard";

type College = {
	id: string;
	ClCode: string;
	Name: string;
	PRPoints: number;
	Password: string;
	Teams: number;
};

	const HACKHIVE_EVENT_NAME = "HackHive Hackathon";

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
		if (selectedEvent?.Name === "HackHive Hackathon") {
			return "/Hackathon_QR.jpeg"; // HackHive QR code
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

		// Show teamMember5 input only if selected event is "HackHive Hackathon"
		if (name === "selectedEvent") {
			const event = getEventsForDay(formData.selectedDay).find(
				(e) => String(e.Id) === value,
			);
			if (event?.Name === "HackHive Hackathon") {
				setShowTeamMember5(true);
			} else {
				setShowTeamMember5(false);
			}
		} else if (name === "selectedDay") {
			// Reset teamMember5 visibility when day changes
			setShowTeamMember5(false);
		}
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
			setSubmitError("HackHive Hackathon is the only available event.");
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
					<LcdBoard
						text="Register"
						align="center"
						className="hackhive-registration-board"
					/>
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
										EVENT
									</label>
									<div
										style={{
											width: "100%",
											borderRadius: "10px",
											color: "var(--text)",
											padding: "14px 16px",
											border: "1px solid var(--border)",
											background: "var(--input-bg)",
											fontSize: "0.95rem",
										}}>
										{loading
											? "Loading HackHive Hackathon..."
											: error
												? "HackHive Hackathon unavailable"
												: "HackHive Hackathon"}
									</div>
								</div>

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
											disabled={formData.isSoloPlayer}
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
											disabled={formData.isSoloPlayer}
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
											disabled={formData.isSoloPlayer}
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
									{showTeamMember5 && (
										<div style={{ marginBottom: "24px" }}>
											<label
												style={{
													display: "block",
													marginBottom: "10px",
													color: "var(--text-dim)",
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
													color: "var(--text)",
													padding: "14px 16px",
													border: "1px solid var(--border)",
													background: "var(--input-bg)",
													fontSize: "0.95rem",
													fontFamily: "inherit",
												}}
											/>
										</div>
									)}
								</>

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

 type Point = [number, number];

const traces: Point[][] = [
  [[-4.1, 1.7], [-3.2, 1.7], [-2.7, 1.2], [-2.1, 1.2]],
  [[-4.1, 0.9], [-3.4, 0.9], [-3.0, 0.5], [-2.2, 0.5]],
  [[-4.1, -1.6], [-3.3, -1.6], [-2.8, -1.15], [-2.3, -1.15]],
  [[4.1, 1.55], [3.25, 1.55], [2.75, 1.05], [2.25, 1.05]],
  [[4.1, -0.6], [3.35, -0.6], [2.85, -0.15], [2.25, -0.15]],
  [[-1.5, -1.85], [-1.5, -1.25], [-1.15, -0.9], [-0.55, -0.9]],
  [[1.4, -1.85], [1.4, -1.25], [1.05, -0.9], [0.55, -0.9]],
];

function Trace({ points }: { points: Point[] }) {
  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, z]) => new THREE.Vector3(x, 0.095, z)),
  );
  return (
    <group>
      <mesh geometry={new THREE.TubeGeometry(curve, 24, 0.026, 6, false)}>
        <meshStandardMaterial color="#66c7ff" emissive="#1688d4" emissiveIntensity={1.4} metalness={0.8} roughness={0.28} />
      </mesh>
      {points.slice(0, -1).map(([x, z], index) => (
        <mesh key={index} position={[x, 0.115, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.065, 0.065, 0.025, 12]} />
          <meshStandardMaterial color="#dff5ff" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

function Chip({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <RoundedBox args={[0.78, 0.12, 0.62]} radius={0.05} smoothness={3}>
        <meshStandardMaterial color="#05080b" metalness={0.75} roughness={0.32} />
      </RoundedBox>
      <mesh position={[0, 0.072, 0]}>
        <boxGeometry args={[0.4, 0.018, 0.3]} />
        <meshStandardMaterial color="#121d25" emissive="#07538a" emissiveIntensity={0.7} />
      </mesh>
      {[-0.24, -0.08, 0.08, 0.24].flatMap((x) => [
        <mesh key={`${x}-a`} position={[x, 0.015, 0.39]}><boxGeometry args={[0.055, 0.05, 0.24]} /><meshStandardMaterial color="#f7fbff" metalness={0.95} roughness={0.18} /></mesh>,
        <mesh key={`${x}-b`} position={[x, 0.015, -0.39]}><boxGeometry args={[0.055, 0.05, 0.24]} /><meshStandardMaterial color="#f7fbff" metalness={0.95} roughness={0.18} /></mesh>,
      ])}
    </group>
  );
}

function Resistor({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh><boxGeometry args={[0.58, 0.08, 0.2]} /><meshStandardMaterial color="#f4f7f8" roughness={0.4} /></mesh>
      <mesh position={[-0.13, 0.045, 0]}><boxGeometry args={[0.055, 0.018, 0.21]} /><meshStandardMaterial color="#1689d4" /></mesh>
      <mesh position={[0.08, 0.045, 0]}><boxGeometry args={[0.055, 0.018, 0.21]} /><meshStandardMaterial color="#0b1a27" /></mesh>
      <mesh position={[0.28, 0, 0]}><boxGeometry args={[0.18, 0.035, 0.08]} /><meshStandardMaterial color="#dceeff" metalness={0.85} /></mesh>
      <mesh position={[-0.28, 0, 0]}><boxGeometry args={[0.18, 0.035, 0.08]} /><meshStandardMaterial color="#dceeff" metalness={0.85} /></mesh>
    </group>
  );
}

function Display({ displayText }: { displayText: string }) {
  return (
    <group position={[0, 0.18, 0.15]}>
      <RoundedBox args={[4.8, 0.14, 1.65]} radius={0.08} smoothness={3}>
        <meshStandardMaterial color="#06090c" metalness={0.7} roughness={0.25} />
      </RoundedBox>
      <mesh position={[0, 0.085, 0]}>
        <boxGeometry args={[4.35, 0.025, 1.22]} />
        <meshStandardMaterial color="#071724" emissive="#063d68" emissiveIntensity={0.8} roughness={0.22} />
      </mesh>
      <Text position={[0, 0.12, 0.02]} rotation={[-Math.PI / 2, 0, 0]} font="/fonts/Geist_Bold.json" fontSize={0.65} maxWidth={4} color="#eaf8ff" anchorX="center" anchorY="middle" outlineWidth={0.012} outlineColor="#168bd2">
        {displayText.toUpperCase()}
      </Text>
      <mesh position={[-2.12, 0.12, -0.48]} rotation={[Math.PI / 2, 0, 0]}><circleGeometry args={[0.055, 12]} /><meshStandardMaterial color="#66c7ff" emissive="#168bd4" emissiveIntensity={2} /></mesh>
      <mesh position={[2.12, 0.12, -0.48]} rotation={[Math.PI / 2, 0, 0]}><circleGeometry args={[0.055, 12]} /><meshStandardMaterial color="#66c7ff" emissive="#168bd4" emissiveIntensity={2} /></mesh>
    </group>
  );
}

function PCBScene({ displayText }: { displayText: string }) {
  return (
    <group>
      <RoundedBox args={[9.2, 0.08, 4.4]} radius={0.12} smoothness={4}>
        <meshStandardMaterial color="#0a1016" roughness={0.64} metalness={0.32} />
      </RoundedBox>
      <mesh position={[0, 0.047, 0]}>
        <boxGeometry args={[8.95, 0.018, 4.15]} />
        <meshStandardMaterial color="#101b24" roughness={0.7} metalness={0.18} />
      </mesh>
      {traces.map((points, index) => <Trace key={index} points={points} />)}
      <Display displayText={displayText} />
      <Chip position={[-3.25, 0.14, 1.35]} scale={0.85} />
      <Chip position={[3.25, 0.14, 0.95]} scale={0.78} />
      <Chip position={[-2.95, 0.14, -1.45]} scale={0.72} />
      <Chip position={[2.95, 0.14, -1.15]} scale={0.68} />
      <Resistor position={[-1.85, 0.14, 1.82]} rotation={0.12} />
      <Resistor position={[1.85, 0.14, 1.72]} rotation={-0.12} />
      <Resistor position={[-0.95, 0.14, -1.55]} rotation={0.08} />
      <Resistor position={[0.95, 0.14, -1.55]} rotation={-0.08} />
      {[[ -4.25, 1.85], [4.25, 1.85], [-4.25, -1.85], [4.25, -1.85]].map(([x, z], index) => (
        <mesh key={index} position={[x, 0.1, z]} rotation={[Math.PI / 2, 0, 0]}><ringGeometry args={[0.12, 0.17, 16]} /><meshStandardMaterial color="#dff5ff" metalness={0.95} roughness={0.18} /></mesh>
      ))}
    </group>
  );
}

type CircuitBoardHeaderProps = {
  displayText?: string;
};

function CircuitBoardHeader({ displayText = "REGISTER" }: CircuitBoardHeaderProps) {
  return (
    <div style={{ width: "100%", height: "250px", position: "relative", overflow: "hidden" }}>
      <div aria-hidden="true" style={{ position: "absolute", inset: "20px auto auto 50%", transform: "translateX(-50%)", width: "min(88vw, 680px)", height: "210px", border: "2px solid #168bd2", borderRadius: "10px", background: "#0a1016", boxShadow: "0 0 28px rgba(22,139,210,.35), inset 0 0 0 8px #101b24", zIndex: 0 }}>
        <div style={{ position: "absolute", inset: "22px 120px", display: "grid", placeItems: "center", border: "1px solid #168bd2", background: "#071724", color: "#eaf8ff", fontFamily: "monospace", fontWeight: 800, fontSize: "clamp(20px, 4vw, 38px)", letterSpacing: "0.12em", textShadow: "0 0 12px #168bd2" }}>{displayText.toUpperCase()}</div>
        {["10%", "28%", "72%", "90%"].map((left) => <span key={left} style={{ position: "absolute", left, top: "10px", width: "8px", height: "8px", borderRadius: "50%", background: "#66c7ff", boxShadow: "0 0 10px #66c7ff" }} />)}
        <div style={{ position: "absolute", left: "12px", right: "12px", top: "50%", height: "2px", background: "#168bd2", opacity: 0.8 }} />
      </div>
      <Canvas camera={{ position: [0, 0, 10], fov: 32, near: 0.1, far: 100 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }} onCreated={({ camera }) => camera.lookAt(0, 0, 0)}>
        <ambientLight intensity={1.25} />
        <directionalLight position={[-3, 5, 6]} intensity={2.2} color="#ffffff" />
        <pointLight position={[0, 1, 4]} intensity={4} distance={10} color="#2b9fe8" />
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <PCBScene displayText={displayText} />
        </group>
        <Environment preset="studio" />
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
            </Canvas>
    </div>
  );
}

export { CircuitBoardHeader };
