"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { db, storage } from "@/lib/firebase";
import { collection, doc, getDocs, serverTimestamp, writeBatch } from "firebase/firestore";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";

type College = {
	id: string;
	ClCode: string;
	Name: string;
	PRPoints: number;
	Password: string;
	Teams: number;
};

const labelStyle: React.CSSProperties = {
	display: "block",
	marginBottom: "10px",
	color: "var(--text-dim)",
	fontSize: "0.8rem",
	letterSpacing: "1.5px",
};

const inputStyle: React.CSSProperties = {
	width: "100%",
	borderRadius: "10px",
	color: "var(--text)",
	padding: "14px 16px",
	border: "1px solid var(--border)",
	background: "var(--input-bg)",
	fontSize: "0.95rem",
	fontFamily: "inherit",
};

const fieldWrapStyle: React.CSSProperties = { marginBottom: "24px" };

export default function PitchRoomRegister() {
	const [colleges, setColleges] = useState<College[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	const [formData, setFormData] = useState({
		fullName: "",
		contactNumber: "",
		emailId: "",
		collegeId: "",
		isSoloPlayer: false,
		teamMember2: "",
		teamMember3: "",
		teamMember4: "",
		teamMember5: "",
		businessIdeaTitle: "",
		businessSummary: null as File | null,
		paymentProof: null as File | null,
	});

	useEffect(() => {
		let active = true;

		const fetchColleges = async () => {
			try {
				const collegeSnapshot = await getDocs(collection(db, "CollegeCreds"));
				const nextColleges = collegeSnapshot.docs.map((collegeDoc) => ({
					id: collegeDoc.id,
					...collegeDoc.data(),
				})) as College[];

				if (!active) return;
				setColleges(nextColleges);
				setError(null);
			} catch (fetchError) {
				console.error("Failed to fetch colleges: ", fetchError);
				if (active) {
					setError("Registration data is currently unavailable. Please try again later.");
				}
			} finally {
				if (active) setLoading(false);
			}
		};

		fetchColleges();

		return () => {
			active = false;
		};
	}, []);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
	) => {
		const target = e.target;

		if (target instanceof HTMLInputElement && target.type === "checkbox") {
			const { name, checked } = target;
			setFormData((prev) => ({
				...prev,
				[name]: checked,
				...(name === "isSoloPlayer" && checked
					? { teamMember2: "", teamMember3: "", teamMember4: "", teamMember5: "" }
					: {}),
			}));
			return;
		}

		const { name, value } = target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleFileChange = (
		e: React.ChangeEvent<HTMLInputElement>,
		field: "businessSummary" | "paymentProof",
	) => {
		if (e.target.files && e.target.files[0]) {
			setFormData((prev) => ({ ...prev, [field]: e.target.files![0] }));
		}
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!formData.paymentProof) {
			setSubmitError("Please upload your payment proof image.");
			return;
		}

		if (!formData.businessSummary) {
			setSubmitError("Please upload your one-page business summary.");
			return;
		}

		const selectedCollege = colleges.find(
			(college) => college.id === formData.collegeId,
		);

		if (!selectedCollege) {
			setSubmitError("Please select the college you will represent.");
			return;
		}

		if (!formData.isSoloPlayer) {
			const teamCount =
				1 +
				[formData.teamMember2, formData.teamMember3, formData.teamMember4, formData.teamMember5].filter(
					(name) => name.trim().length > 0,
				).length;

			if (teamCount < 3) {
				setSubmitError("Teams must have a minimum of 3 members (or register solo).");
				return;
			}
		}

		setSubmitError(null);
		setSubmitting(true);

		try {
			const requestRef = doc(collection(db, "PitchRoomRegistrations"));

			const safeProofName = formData.paymentProof.name.replace(/\s+/g, "_");
			const paymentProofRef = storageRef(
				storage,
				`pitchroom/payment-proofs/${requestRef.id}-${safeProofName}`,
			);
			const uploadResult = await uploadBytes(paymentProofRef, formData.paymentProof);
			const paymentProofUrl = await getDownloadURL(uploadResult.ref);

			const safeSummaryName = formData.businessSummary.name.replace(/\s+/g, "_");
			const summaryRef = storageRef(
				storage,
				`pitchroom/business-summaries/${requestRef.id}-${safeSummaryName}`,
			);
			const summaryUploadResult = await uploadBytes(summaryRef, formData.businessSummary);
			const businessSummaryUrl = await getDownloadURL(summaryUploadResult.ref);

			const batch = writeBatch(db);

			batch.set(requestRef, {
				id: requestRef.id,
				collegeId: selectedCollege.id,
				collegeName: selectedCollege.Name,
				collegeCode: selectedCollege.ClCode,
				fullName: formData.fullName,
				contactNumber: formData.contactNumber,
				emailId: formData.emailId,
				isSoloPlayer: formData.isSoloPlayer,
				...(formData.isSoloPlayer
					? {}
					: {
							teamMember2: formData.teamMember2,
							teamMember3: formData.teamMember3,
							teamMember4: formData.teamMember4,
							teamMember5: formData.teamMember5,
						}),
				businessIdeaTitle: formData.businessIdeaTitle,
				businessSummaryUrl,
				businessSummaryName: safeSummaryName,
				paymentProofUrl,
				paymentProofPath: uploadResult.ref.fullPath,
				paymentProofName: safeProofName,
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
					collegeId: "",
					isSoloPlayer: false,
					teamMember2: "",
					teamMember3: "",
					teamMember4: "",
					teamMember5: "",
					businessIdeaTitle: "",
					businessSummary: null,
					paymentProof: null,
				});
				setSubmitted(false);
			}, 3000);
		} catch (submitErr) {
			console.error("🔥 PITCH ROOM REGISTRATION FAILED:", submitErr);
			setSubmitError(
				submitErr instanceof Error
					? submitErr.message
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
					<h1 className="hero-title" data-text="The Pitch Room">
						The Pitch Room
					</h1>
					<p className="hero-tagline">Register your team — 27 October 2026</p>
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
								<h3 style={{ fontSize: "1.5rem", marginBottom: "10px", color: "var(--gold)" }}>
									Registration Successful!
								</h3>
								<p style={{ color: "var(--text-dim)" }}>
									You're in for The Pitch Room! Your registration has been sent for approval.
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
								<div style={fieldWrapStyle}>
									<label style={labelStyle}>YOUR FULL NAME (TEAM LEADER)</label>
									<input
										type="text"
										name="fullName"
										value={formData.fullName}
										onChange={handleChange}
										required
										placeholder="Your full name"
										style={inputStyle}
									/>
								</div>

								<div style={fieldWrapStyle}>
									<label style={labelStyle}>YOUR EMAIL ID</label>
									<input
										type="email"
										name="emailId"
										value={formData.emailId}
										onChange={handleChange}
										required
										placeholder="your@email.com"
										style={inputStyle}
									/>
								</div>

								<div style={fieldWrapStyle}>
									<label style={labelStyle}>YOUR CONTACT NUMBER</label>
									<input
										type="tel"
										name="contactNumber"
										value={formData.contactNumber}
										onChange={handleChange}
										required
										placeholder="+91 XXXXXXXXXX"
										style={inputStyle}
									/>
								</div>

								<div style={fieldWrapStyle}>
									<label style={labelStyle}>COLLEGE YOU WILL REPRESENT</label>
									<select
										name="collegeId"
										value={formData.collegeId}
										onChange={handleChange}
										required
										disabled={loading || colleges.length === 0}
										style={inputStyle}>
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

								<div style={fieldWrapStyle}>
									<label style={labelStyle}>BUSINESS IDEA TITLE</label>
									<input
										type="text"
										name="businessIdeaTitle"
										value={formData.businessIdeaTitle}
										onChange={handleChange}
										required
										placeholder="Name of your business idea"
										style={inputStyle}
									/>
								</div>

								<div style={fieldWrapStyle}>
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
										<div style={fieldWrapStyle}>
											<label style={labelStyle}>TEAM MEMBER 2 FULL NAME</label>
											<input
												type="text"
												name="teamMember2"
												value={formData.teamMember2}
												onChange={handleChange}
												placeholder="Full name of team member 2"
												style={inputStyle}
											/>
										</div>
										<div style={fieldWrapStyle}>
											<label style={labelStyle}>TEAM MEMBER 3 FULL NAME</label>
											<input
												type="text"
												name="teamMember3"
												value={formData.teamMember3}
												onChange={handleChange}
												placeholder="Full name of team member 3"
												style={inputStyle}
											/>
										</div>
										<div style={fieldWrapStyle}>
											<label style={labelStyle}>TEAM MEMBER 4 FULL NAME</label>
											<input
												type="text"
												name="teamMember4"
												value={formData.teamMember4}
												onChange={handleChange}
												placeholder="Full name of team member 4"
												style={inputStyle}
											/>
										</div>
										<div style={fieldWrapStyle}>
											<label style={labelStyle}>TEAM MEMBER 5 FULL NAME</label>
											<input
												type="text"
												name="teamMember5"
												value={formData.teamMember5}
												onChange={handleChange}
												placeholder="Full name of team member 5"
												style={inputStyle}
											/>
										</div>
										<p
											style={{
												color: "var(--text-dim)",
												fontSize: "0.8rem",
												marginTop: "-14px",
												marginBottom: "24px",
											}}>
											Teams must have 3–5 members in total.
										</p>
									</>
								)}

								<div style={fieldWrapStyle}>
									<label style={labelStyle}>
										UPLOAD ONE-PAGE BUSINESS SUMMARY (PDF/IMAGE)
									</label>
									<input
										type="file"
										name="businessSummary"
										accept=".pdf,image/*"
										onChange={(e) => handleFileChange(e, "businessSummary")}
										required
										style={inputStyle}
									/>
								</div>

								<div style={{ marginBottom: "24px", textAlign: "center" }}>
									<label style={labelStyle}>PAYMENT QR CODE</label>
									<img
										src="/PitchRoom_QR.jpeg"
										alt="Pitch Room Payment QR Code"
										style={{
											maxWidth: "200px",
											height: "auto",
											borderRadius: "10px",
											border: "1px solid var(--border)",
											margin: "0 auto",
											display: "block",
										}}
									/>
									<p style={{ color: "var(--text-dim)", fontSize: "0.8rem", marginTop: "10px" }}>
										UPI ID: vedikajain182006@okicici
									</p>
								</div>

								<div style={{ marginBottom: "32px" }}>
									<label style={labelStyle}>UPLOAD PAYMENT PROOF (IMAGE)</label>
									<input
										type="file"
										name="paymentProof"
										accept="image/*"
										onChange={(e) => handleFileChange(e, "paymentProof")}
										required
										style={inputStyle}
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
									By registering, you agree to The Pitch Room's code of conduct and guidelines.
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
