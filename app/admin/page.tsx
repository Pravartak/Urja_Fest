"use client";

import { FormEvent, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { db, storage } from "@/lib/firebase";
import {
	collection,
	getDocs,
	updateDoc,
	doc,
	getDoc,
	increment,
	setDoc,
	writeBatch,
} from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";

type Event = {
	Id: string;
	Name: string;
	Teams: string[];
};

type College = {
	Id: string;
	ClCode: string;
	Name: string;
	Events: Event[];
};

const prizeOptions = [
	{ value: "first", label: "First Place", points: 700 },
	{ value: "second", label: "Second Place", points: 300 },
	{ value: "third", label: "Third Place", points: 250 },
];

type PendingRegistration = {
	id: string;
	collegeId: string;
	collegeName: string;
	collegeCode: string;
	teamLeaderName: string;
	contactNumber: string;
	eventId: string;
	eventName: string;
	selectedDay: string;
	teamMember2: string;
	teamMember3: string;
	teamMember4: string;
	teamMember5: string;
	paymentProofFileName: string | null;
	paymentProofPath: string | null;
	paymentProofUrl: string | null;
};

export default function Admin() {
	const [collegesList, setCollegesList] = useState<College[]>([]);
	const [selectedCollegeId, setSelectedCollegeId] = useState("");
	const [pointReason, setPointReason] = useState("");
	const [updatedBy, setUpdatedBy] = useState(""); // For custom point updator
	const [addedBy, setAddedBy] = useState(""); // For Registration acceptor
	const [pointAdjustment, setPointAdjustment] = useState<string>("");
	const [pointStatus, setPointStatus] = useState("");
	const [pendingRegistrations, setPendingRegistrations] = useState<
		PendingRegistration[]
	>([]);
	const [isLoadingRegistrations, setIsLoadingRegistrations] = useState(true);
	const [registrationError, setRegistrationError] = useState("");
	const [processingRegistrationId, setProcessingRegistrationId] = useState<
		string | null
	>(null);
	const [isUpdating, setIsUpdating] = useState(false);
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [password, setPassword] = useState("");
	const [errorMsg, setErrorMsg] = useState("");

	const selectedCollege = collegesList.find(
		(college) => college.Id === selectedCollegeId,
	);

	useEffect(() => {
		if (!isLoggedIn) return;

		let active = true;

		const fetchPendingRegistrations = async () => {
			setIsLoadingRegistrations(true);
			setRegistrationError("");

			try {
				const collegeSnapshot = await getDocs(collection(db, "CollegeCreds"));
				const collegeList = collegeSnapshot.docs.map((doc) => ({
					Id: doc.id,
					...doc.data(),
				}));
				setCollegesList(collegeList as College[]);

				const requestGroups = await Promise.all(
					collegeSnapshot.docs.map(async (collegeDoc) => {
						const collegeData = collegeDoc.data();
						const requestsSnapshot = await getDocs(
							collection(db, "CollegeCreds", collegeDoc.id, "Requests"),
						);

						return requestsSnapshot.docs
							.filter((requestDoc) => {
								const data = requestDoc.data();
								return !data.status || data.status === "pending";
							})
							.map((requestDoc) => {
								const data = requestDoc.data();
								const normalizedPaymentProofName =
									data.paymentProofName ??
									data.paymentProofFileName ??
									data.paymentProof?.name ??
									null;

								return {
									id: requestDoc.id,

									collegeId: data.collegeId ?? collegeDoc.id,
									collegeName:
										data.collegeName ??
										collegeData.CollegeName ??
										collegeData.Name ??
										"Unknown College",
									collegeCode: data.collegeCode ?? collegeData.ClCode ?? "",

									teamLeaderName:
										data.fullName ?? data.teamLeaderName ?? "Unknown",
									contactNumber: data.contactNumber ?? "Not provided",

									eventId: data.selectedEventId ?? data.eventId ?? "",
									eventName:
										data.selectedEvent ?? data.eventName ?? "Unknown Event",

									selectedDay: data.selectedDay ?? "",

									teamMember2: data.teamMember2 ?? "",
									teamMember3: data.teamMember3 ?? "",
									teamMember4: data.teamMember4 ?? "",
									teamMember5: data.teamMember5 ?? "",
									paymentProofFileName: normalizedPaymentProofName,
									paymentProofPath: data.paymentProofPath ?? null,
									paymentProofUrl: data.paymentProofUrl ?? null,
								} satisfies PendingRegistration;
							});
					}),
				);

				const pending = requestGroups.flat();

				const registrationsWithProofs = await Promise.all(
					pending.map(async (registration) => {
						if (registration.paymentProofUrl) return registration;
						if (
							!registration.paymentProofPath &&
							!registration.paymentProofFileName
						) {
							return registration;
						}

						try {
							const proofRef = ref(
								storage,
								registration.paymentProofPath ??
									`payment-proofs/${registration.collegeId}/${registration.id}-${registration.paymentProofFileName}`,
							);
							const paymentProofUrl = await getDownloadURL(proofRef);
							return { ...registration, paymentProofUrl };
						} catch {
							return registration;
						}
					}),
				);

				if (active) setPendingRegistrations(registrationsWithProofs);
			} catch (fetchError) {
				console.error("Failed to fetch pending registrations:", fetchError);
				if (active) {
					setRegistrationError(
						"Could not load pending registrations. Check Firestore permissions and try again.",
					);
				}
			} finally {
				if (active) setIsLoadingRegistrations(false);
			}
		};

		fetchPendingRegistrations();

		return () => {
			active = false;
		};
	}, [isLoggedIn]);

	const handleRegistrationDecision = async (
		registration: PendingRegistration,
		decision: "accepted" | "rejected",
	) => {
		setProcessingRegistrationId(registration.id);
		setRegistrationError("");

		try {
			const requestRef = doc(
				db,
				"CollegeCreds",
				registration.collegeId,
				"Requests",
				registration.id,
			);

			// --------------------------------------------------
			// REJECT
			// --------------------------------------------------
			if (decision === "rejected") {
				await updateDoc(requestRef, {
					status: "rejected",
					reviewedAt: new Date(),
				});

				setPendingRegistrations((current) =>
					current.filter((item) => item.id !== registration.id),
				);

				return;
			}

			// --------------------------------------------------
			// ACCEPT
			// --------------------------------------------------

			const addedByTrimmed = addedBy.trim();
			if (!addedByTrimmed) {
				const updatedBy = document.getElementById("updatedBy") as HTMLInputElement;
				updatedBy.placeholder = "Please enter your name...";
				return;
			};

			// 1. Create Team first
			const teamRef = doc(collection(db, "Teams"));
			const teamId = teamRef.id;

			await setDoc(teamRef, {
				teamLeader: registration.teamLeaderName,
				member2: registration.teamMember2,
				member3: registration.teamMember3,
				member4: registration.teamMember4,
				member5: registration.teamMember5,
				collegeId: registration.collegeId,
				eventId: registration.eventId,
				eventName: registration.eventName,
				createdAt: new Date(),
			});

			// 2. Now read existing Events
			const collegeRef = doc(db, "CollegeCreds", registration.collegeId);
			const transactionRef = doc(collection(db, "prPointTransactions"));

			const collegeSnapshot = await getDoc(collegeRef);
			const collegeData = collegeSnapshot.data();

			const currentEvents: Event[] = Array.isArray(collegeData?.Events)
				? collegeData.Events
				: [];

			// 3. Find the event
			const eventIndex = currentEvents.findIndex(
				(event) => String(event.Id) === String(registration.eventId),
			);

			// 4. Create/update the Event AFTER we have teamId
			let updatedEvents: Event[];

			if (eventIndex === -1) {
				// Event doesn't exist yet
				const newEvent: Event = {
					Id: registration.eventId,
					Name: registration.eventName,
					Teams: [teamId],
				};

				updatedEvents = [...currentEvents, newEvent];
			} else {
				// Event already exists
				updatedEvents = [...currentEvents];

				updatedEvents[eventIndex] = {
					...updatedEvents[eventIndex],
					Teams: [...(updatedEvents[eventIndex].Teams ?? []), teamId],
				};
			}

			// --------------------------------------------------
			// UPDATE COLLEGE + REQUEST
			// --------------------------------------------------

			const batch = writeBatch(db);

			batch.update(collegeRef, {
				PRPoints: increment(50),
				Teams: increment(1),
				Events: updatedEvents,
			});

			batch.update(requestRef, {
				status: "accepted",
				reviewedAt: new Date(),
				teamId: teamId,
			});

			await setDoc(transactionRef, {
				collegeId: registration.collegeId,
				collegeCode: registration.collegeCode,
				collegeName: registration.collegeName,
				reason: "Event registration points",
				points: 50,
				createdAt: new Date(),
				updatedBy: addedByTrimmed || "admin",
			});

			await batch.commit();

			// --------------------------------------------------
			// REMOVE FROM PENDING UI
			// --------------------------------------------------

			setPendingRegistrations((current) =>
				current.filter((item) => item.id !== registration.id),
			);
		} catch (decisionError) {
			console.error("Failed to review registration:", decisionError);

			setRegistrationError(
				decisionError instanceof Error
					? decisionError.message
					: "Could not update the registration. Check Firestore permissions and try again.",
			);
		} finally {
			setProcessingRegistrationId(null);
		}
	};

	const handleLogin = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (password === process.env.NEXT_PUBLIC_ADMIN_PASS) {
			setIsLoggedIn(true);
			setErrorMsg("");
			return;
		}

		setErrorMsg("Invalid password");
		setPassword("");
	};

	const handleLogout = () => {
		setIsLoggedIn(false);
		setPassword("");
		setErrorMsg("");
	};

	const handlePointsChange = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!selectedCollege) {
			setPointStatus("Please select a college.");
			return;
		}

		const trimmedReason = pointReason.trim();
		const trimmedUpdatedBy = updatedBy.trim();
		const numericValue = Number(pointAdjustment);

		if (!trimmedReason) {
			setPointStatus("Please enter a reason for the PR point update.");
			return;
		}

		if (!pointAdjustment || Number.isNaN(numericValue) || numericValue === 0) {
			setPointStatus("Please enter a non-zero numeric PR point value.");
			return;
		}

		setIsUpdating(true);

		try {
			const collegeRef = doc(db, "CollegeCreds", selectedCollege.Id);
			const transactionRef = doc(collection(db, "prPointTransactions"));

			const batch = writeBatch(db);
			batch.update(collegeRef, {
				PRPoints: increment(numericValue),
			});
			await batch.commit();

			await setDoc(transactionRef, {
				collegeId: selectedCollege.Id,
				collegeCode: selectedCollege.ClCode ?? "",
				collegeName: selectedCollege.Name,
				reason: trimmedReason,
				points: numericValue,
				createdAt: new Date(),
				updatedBy: trimmedUpdatedBy || "admin",
			});

			setPointStatus(
				`${numericValue >= 0 ? "Added" : "Deducted"} ${Math.abs(numericValue)} PR Points for ${selectedCollege.Name}: ${trimmedReason}`,
			);
		} catch (e) {
			console.error("Failed to update college PR points: ", e);
			setPointStatus(
				"Could not update PR points. Check Firestore permissions and try again.",
			);
		} finally {
			setIsUpdating(false);
			setSelectedCollegeId("");
			setPointReason("");
			setPointAdjustment("");
			setUpdatedBy("");
		}
	};

	return (
		<>
			<div className="cosmic-bg" />
			<div className="cosmic-vignette" />
			<Navbar />

			<div className="page-wrap">
				{!isLoggedIn ? (
					<section
						className="register-hero"
						style={{
							minHeight: "60vh",
							display: "flex",
							flexDirection: "column",
							justifyContent: "center",
						}}>
						<div
							style={{
								maxWidth: "420px",
								width: "100%",
								margin: "0 auto",
								padding: "0 24px",
							}}>
							<div style={{ textAlign: "center", marginBottom: "40px" }}>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										width: "90px",
										height: "90px",
										margin: "0 auto 24px",
										borderRadius: "9999px",
										background:
											"linear-gradient(135deg, var(--purple), var(--pink))",
										fontSize: "2.2rem",
										boxShadow: "0 0 60px rgba(232,69,184,0.35)",
									}}>
									🔐
								</div>

								<h1 className="hero-title" style={{ fontSize: "2.2rem" }}>
									Admin Panel
								</h1>
							</div>

							<form
								onSubmit={handleLogin}
								style={{
									background: "var(--card)",
									border: "1px solid var(--border)",
									borderRadius: "20px",
									padding: "36px",
								}}>
								<label
									htmlFor="admin-password"
									style={{
										display: "block",
										marginBottom: "10px",
										color: "var(--text-dim)",
										fontSize: "0.75rem",
										letterSpacing: "1.5px",
									}}>
									ADMIN PASSWORD
								</label>

								<input
									id="admin-password"
									type="password"
									value={password}
									onChange={(event) => setPassword(event.target.value)}
									placeholder="Enter password"
									style={{
										width: "100%",
										padding: "14px 16px",
										borderRadius: "10px",
										border: "1px solid var(--border)",
										background: "rgba(0,0,0,0.3)",
										color: "var(--text)",
										fontSize: "0.95rem",
										fontFamily: "inherit",
										boxSizing: "border-box",
									}}
								/>

								{errorMsg && (
									<div
										style={{
											marginTop: "16px",
											padding: "12px",
											borderRadius: "10px",
											border: "1px solid rgba(255,100,100,0.5)",
											background: "rgba(255,100,100,0.1)",
											color: "#ff6464",
											fontSize: "0.9rem",
										}}>
										{errorMsg}
									</div>
								)}

								<button
									type="submit"
									className="btn btn-purple-gradient"
									style={{
										width: "100%",
										justifyContent: "center",
										marginTop: "20px",
									}}>
									Login
								</button>
							</form>
						</div>
					</section>
				) : (
					<section className="section" style={{ marginTop: "80px" }}>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								gap: "20px",
								marginBottom: "40px",
								flexWrap: "wrap",
							}}>
							<h1 className="hero-title" style={{ fontSize: "2rem" }}>
								Dashboard
							</h1>

							<button onClick={handleLogout} className="btn btn-gold">
								Logout
							</button>
						</div>

						<div
							style={{
								display: "grid",
								gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
								gap: "24px",
								marginBottom: "50px",
							}}>
							<div className="feature-card">
								<div className="feature-icon">👥</div>
								<h3>Pending Registrations</h3>
								<div className="admin-stat-value">
									{pendingRegistrations.length}
								</div>
							</div>

							<div className="feature-card">
								<div className="feature-icon">📅</div>
								<h3>Active Events</h3>
								<div className="admin-stat-value">
									{collegesList.reduce(
										(total, college) => total + (college.Events?.length || 0),
										0,
									)}
								</div>
							</div>

							<div className="feature-card">
								<div className="feature-icon">🏆</div>
								<h3>Colleges</h3>
								<div className="admin-stat-value">{collegesList.length}</div>
							</div>
						</div>

						<section
							className="admin-points-panel"
							style={{
								padding: "32px",
								marginBottom: "60px",
								borderRadius: "20px",
								border: "1px solid var(--border)",
								background:
									"linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
								boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
							}}>
							<div style={{ marginBottom: "28px" }}>
								<p className="eyebrow">PR POINTS CONTROL</p>
								<h2 className="basic-heading">Update college PR points</h2>
								<p className="admin-points-help">
									Add or deduct points using a positive or negative value.
								</p>
							</div>

							<form
								className="admin-points-form"
								onSubmit={handlePointsChange}
								style={{
									display: "grid",
									gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
									gap: "16px",
								}}>
								<select
									value={selectedCollegeId}
									onChange={(event) => {
										setSelectedCollegeId(event.target.value);
										setPointStatus("");
									}}
									required
									aria-label="Select college"
									style={inputStyle}>
									<option value="">Select college</option>
									{collegesList.map((college) => (
										<option key={college.Id} value={college.Id}>
											{college.Name} ({college.ClCode})
										</option>
									))}
								</select>

								<input
									type="text"
									value={pointReason}
									onChange={(event) => {
										setPointReason(event.target.value);
										setPointStatus("");
									}}
									placeholder="Reason for updating PR Points"
									required
									style={{
										...inputStyle,
									}}
								/>

								<input
									type="text"
									value={updatedBy}
									onChange={(event) => {
										setUpdatedBy(event.target.value);
										setPointStatus("");
									}}
									placeholder="Updated by..."
									required
									style={{
										...inputStyle,
									}}
								/>

								<input
									type="number"
									step="1"
									value={pointAdjustment}
									onChange={(event) => {
										setPointAdjustment(event.target.value);
										setPointStatus("");
									}}
									placeholder="e.g. 50 or -15"
									required
									style={{
										...inputStyle,
									}}
								/>

								<button
									type="submit"
									className="btn btn-purple-gradient"
									disabled={
										!selectedCollegeId ||
										!pointReason.trim() ||
										!pointAdjustment ||
										Number(pointAdjustment) === 0 ||
										isUpdating
									}
									style={{
										minHeight: "50px",
										justifyContent: "center",
										gridColumn: "1 / -1",
									}}>
									Update PR Points
								</button>
							</form>

							{pointStatus && (
								<p
									className="admin-points-status"
									style={{
										marginTop: "18px",
										padding: "12px 16px",
										borderRadius: "10px",
										background: "rgba(232,194,106,0.08)",
										border: "1px solid rgba(232,194,106,0.2)",
										color: "var(--gold)",
									}}>
									{pointStatus}
								</p>
							)}

							<div
								style={{
									marginTop: "28px",
									padding: "16px 18px",
									borderRadius: "12px",
									background: "rgba(255,255,255,0.025)",
									border: "1px solid var(--border)",
								}}>
								<p
									style={{
										margin: 0,
										color: "var(--text-dim)",
										fontSize: "0.85rem",
										lineHeight: 1.6,
									}}>
									<strong style={{ color: "var(--text)" }}>
										Prize Points:
									</strong>{" "}
									First Place = 700 &nbsp;•&nbsp; Second Place = 300
									&nbsp;•&nbsp; Third Place = 250
								</p>
							</div>
						</section>

						<section>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "flex-end",
									gap: "20px",
									flexWrap: "wrap",
									marginBottom: "30px",
								}}>
								<div>
									<p className="eyebrow">APPLICATION REVIEW</p>
									<h2 className="basic-heading" style={{ marginBottom: "8px" }}>
										Pending Registrations
									</h2>
									<p
										style={{
											margin: 0,
											color: "var(--text-dim)",
											fontSize: "0.9rem",
										}}>
										Review payment proof and registration details before
										accepting an application.
									</p>
								</div>

								<div
									style={{
										padding: "9px 14px",
										borderRadius: "999px",
										border: "1px solid rgba(232,194,106,0.25)",
										background: "rgba(232,194,106,0.08)",
										color: "var(--gold)",
										fontSize: "0.82rem",
										fontWeight: 700,
									}}>
									{pendingRegistrations.length} Pending
								</div>
							</div>

							{registrationError && (
								<div
									style={{
										marginBottom: "20px",
										padding: "14px 16px",
										borderRadius: "12px",
										border: "1px solid rgba(255,100,100,0.4)",
										background: "rgba(255,100,100,0.08)",
										color: "#ff7777",
										fontSize: "0.9rem",
									}}>
									{registrationError}
								</div>
							)}

							{isLoadingRegistrations ? (
								<div className="feature-card" style={{ textAlign: "center" }}>
									<div
										style={{
											fontSize: "2rem",
											marginBottom: "12px",
										}}>
										⏳
									</div>
									<p
										style={{
											margin: 0,
											color: "var(--text-dim)",
										}}>
										Loading pending registrations...
									</p>
								</div>
							) : pendingRegistrations.length === 0 ? (
								<div
									className="feature-card"
									style={{
										textAlign: "center",
										padding: "50px 24px",
									}}>
									<div
										style={{
											fontSize: "2.5rem",
											marginBottom: "14px",
										}}>
										✓
									</div>
									<h3 style={{ marginBottom: "8px" }}>
										No Pending Registrations
									</h3>
									<p
										style={{
											margin: 0,
											color: "var(--text-dim)",
										}}>
										All registration applications have been reviewed.
									</p>
								</div>
							) : (
								<div
									style={{
										display: "grid",
										gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))",
										gap: "24px",
									}}>
									{pendingRegistrations.map((registration) => {
										const isProcessing =
											processingRegistrationId === registration.id;

										return (
											<article
												key={`${registration.collegeId}-${registration.id}`}
												style={{
													overflow: "hidden",
													borderRadius: "20px",
													border: "1px solid var(--border)",
													background:
														"linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
													boxShadow: "0 20px 60px rgba(0,0,0,0.16)",
												}}>
												<div
													style={{
														padding: "20px 22px",
														borderBottom: "1px solid var(--border)",
														display: "flex",
														justifyContent: "space-between",
														alignItems: "center",
														gap: "12px",
													}}>
													<div>
														<p
															style={{
																margin: "0 0 5px",
																color: "var(--gold)",
																fontSize: "0.72rem",
																fontWeight: 700,
																letterSpacing: "1.4px",
															}}>
															PENDING APPLICATION
														</p>
														<h3
															style={{
																margin: 0,
																color: "var(--text)",
																fontSize: "1.15rem",
															}}>
															{registration.teamLeaderName}
														</h3>
													</div>

													<span
														style={{
															flexShrink: 0,
															padding: "5px 10px",
															borderRadius: "999px",
															background: "rgba(232,194,106,0.1)",
															border: "1px solid rgba(232,194,106,0.2)",
															color: "var(--gold)",
															fontSize: "0.72rem",
														}}>
														{registration.selectedDay || "Day"}
													</span>
												</div>

												<div style={{ padding: "22px" }}>
													<div
														style={{
															display: "grid",
															gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
															gap: "14px",
														}}>
														<div style={detailCardStyle}>
															<span style={detailLabelStyle}>COLLEGE</span>
															<strong style={detailValueStyle}>
																{registration.collegeName}
															</strong>
														</div>

														<div style={detailCardStyle}>
															<span style={detailLabelStyle}>EVENT</span>
															<strong style={detailValueStyle}>
																{registration.eventName}
															</strong>
														</div>

														<div
															style={{
																...detailCardStyle,
																gridColumn: "1 / -1",
															}}>
															<span style={detailLabelStyle}>CONTACT NO.</span>
															<strong style={detailValueStyle}>
																{registration.contactNumber}
															</strong>
														</div>
													</div>

													<div style={{ marginTop: "18px" }}>
														<div
															style={{
																display: "flex",
																justifyContent: "space-between",
																alignItems: "center",
																marginBottom: "10px",
															}}>
															<span style={detailLabelStyle}>
																PAYMENT PROOF
															</span>
															{registration.paymentProofUrl && (
																<a
																	href={registration.paymentProofUrl}
																	target="_blank"
																	rel="noopener noreferrer"
																	style={{
																		color: "var(--gold)",
																		fontSize: "0.75rem",
																		textDecoration: "none",
																	}}>
																	Open full image ↗
																</a>
															)}
														</div>

														<div
															style={{
																minHeight: "180px",
																borderRadius: "14px",
																overflow: "hidden",
																border: "1px solid var(--border)",
																background: "rgba(0,0,0,0.22)",
																display: "flex",
																alignItems: "center",
																justifyContent: "center",
															}}>
															{registration.paymentProofUrl ? (
																<img
																	src={registration.paymentProofUrl}
																	alt={`Payment proof for ${registration.teamLeaderName}`}
																	style={{
																		display: "block",
																		width: "100%",
																		maxHeight: "300px",
																		objectFit: "contain",
																	}}
																/>
															) : (
																<div
																	style={{
																		padding: "30px",
																		textAlign: "center",
																		color: "var(--text-dim)",
																	}}>
																	<div
																		style={{
																			fontSize: "2rem",
																			marginBottom: "10px",
																		}}>
																		🖼️
																	</div>
																	<div style={{ fontSize: "0.85rem" }}>
																		Payment proof image unavailable
																	</div>
																</div>
															)}
														</div>
													</div>

													<input
														id="updatedBy"
														type="text"
														value={addedBy}
														onChange={(event) => {
															setAddedBy(event.target.value);
															setPointStatus("");
														}}
														placeholder="Updated by..."
														required
														style={{
															...inputStyle,
															marginTop: "18px",
														}}
													/>

													<div
														style={{
															display: "grid",
															gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
															gap: "12px",
															marginTop: "20px",
														}}>
														<button
															type="button"
															className="btn btn-gold"
															disabled={isProcessing}
															onClick={() =>
																handleRegistrationDecision(
																	registration,
																	"accepted",
																)
															}
															style={{
																justifyContent: "center",
																minHeight: "48px",
																opacity: isProcessing ? 0.6 : 1,
															}}>
															✓ Accept
														</button>

														<button
															type="button"
															className="btn"
															disabled={isProcessing}
															onClick={() =>
																handleRegistrationDecision(
																	registration,
																	"rejected",
																)
															}
															style={{
																justifyContent: "center",
																minHeight: "48px",
																border: "1px solid rgba(255,100,100,0.45)",
																color: "#ff7777",
																background: "rgba(255,100,100,0.07)",
																opacity: isProcessing ? 0.6 : 1,
															}}>
															{isProcessing ? "Updating..." : "✕ Reject"}
														</button>
													</div>
												</div>
											</article>
										);
									})}
								</div>
							)}
						</section>
					</section>
				)}
			</div>
			<Footer />
		</>
	);
}

const inputStyle = {
	width: "100%",
	minHeight: "50px",
	padding: "13px 15px",
	boxSizing: "border-box" as const,
	borderRadius: "11px",
	border: "1px solid var(--border)",
	background: "rgba(0,0,0,0.28)",
	color: "var(--text)",
	fontSize: "0.92rem",
	fontFamily: "inherit",
	outline: "none",
};

const detailCardStyle = {
	padding: "13px 14px",
	borderRadius: "12px",
	border: "1px solid var(--border)",
	background: "rgba(0,0,0,0.14)",
	display: "flex",
	flexDirection: "column" as const,
	gap: "6px",
};

const detailLabelStyle = {
	color: "var(--text-dim)",
	fontSize: "0.68rem",
	letterSpacing: "1.2px",
	fontWeight: 700,
};

const detailValueStyle = {
	color: "var(--text)",
	fontSize: "0.9rem",
	lineHeight: 1.35,
};

const tableHeaderStyle = {
	padding: "16px 24px",
	textAlign: "left" as const,
	fontWeight: 700,
	fontSize: "0.85rem",
	letterSpacing: "1px",
	color: "var(--text-dim)",
};

const tableCellStyle = {
	padding: "14px 24px",
	color: "var(--text)",
};
