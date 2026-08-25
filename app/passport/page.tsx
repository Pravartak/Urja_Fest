"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function PassportPage() {
	const router = useRouter();
	const [collegeCreds, setCollegeCreds] = useState<CollegeCred[]>([]);
	const [clCode, setClCode] = useState("");
	const [password, setPassword] = useState("");

	type CollegeCred = {
		ClCode: string;
		Password: string;
	};

	useEffect(() => {
		const fetchData = async () => {
			try {
				const collegeCreds = await getDocs(collection(db, "CollegeCreds"));
				setCollegeCreds(
					collegeCreds.docs.map((doc) => doc.data() as CollegeCred)
				);
			} catch (e) {
				console.error("Error fetching college credentials: ", e);
			}
		}
		fetchData();
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (collegeCreds.some((cred) => cred.ClCode === clCode && cred.Password === password)) {
			router.push(`/college/${clCode}`);
		} else {
			if (!collegeCreds.some((cred) => cred.ClCode === clCode)) {
				alert("Invalid Cl Code. Please check and try again.");
			} else {
				alert("Invalid Password. Please check and try again.");
			}
		}
	};

	return (
		<div className="page-container">
			<button onClick={() => router.back()} className="back-button">
				← Back
			</button>
			<div className="passport-container">
				<div className="passport-card">
					<h1 className="passport-title">College Dashboard</h1>
					<p className="passport-subtitle">
						Enter your College Code and Password
					</p>

					<form onSubmit={handleSubmit} className="passport-form">
						<div className="form-group">
							<label htmlFor="clCode" className="form-label">
								Cl Code
							</label>
							<input
								type="text"
								id="clCode"
								value={clCode}
								onChange={(e) => setClCode(e.target.value)}
								placeholder="Enter your Cl Code"
								className="form-input"
							/>

							<label htmlFor="clPassword" className="form-label">
								Password
							</label>
							<input
								type="password"
								id="clPassword"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Enter your Password"
								className="form-input"
							/>
						</div>

						<button type="submit" className="submit-btn">
							SUBMIT
						</button>
					</form>
				</div>
			</div>

			<style jsx>{`
				.back-button {
					position: fixed;
					top: 90px;
					left: 30px;
					padding: 10px 20px;
					background: rgba(212, 175, 55, 0.1);
					border: 1px solid #56158e;
					color: #ffffff;
					border-radius: 6px;
					cursor: pointer;
					font-weight: 600;
					transition: all 0.3s ease;
					z-index: 100;
				}

				.back-button:hover {
					background: rgba(212, 175, 55, 0.2);
					box-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
				}

				.page-container {
					min-height: 100vh;
					display: flex;
					align-items: center;
					justify-content: center;
					padding: 20px;
					margin-top: 80px;
				}

				.passport-container {
					width: 100%;
					max-width: 500px;
				}

				.passport-card {
					background: rgba(20, 10, 40, 0.8);
					border: 2px solid #512a65;
					border-radius: 12px;
					padding: 40px;
					backdrop-filter: blur(10px);
					box-shadow: 0 0 30px rgba(212, 175, 55, 0.2);
				}

				.passport-title {
					font-size: 32px;
					font-weight: bold;
					color: #ffffff;
					text-align: center;
					margin-bottom: 10px;
					text-transform: uppercase;
					letter-spacing: 2px;
				}

				.passport-subtitle {
					color: #b0b0b0;
					text-align: center;
					margin-bottom: 30px;
					font-size: 14px;
				}

				.passport-form {
					display: flex;
					flex-direction: column;
					gap: 20px;
				}

				.form-group {
					display: flex;
					flex-direction: column;
					gap: 8px;
				}

				.form-label {
					color: #ffffff;
					font-size: 14px;
					font-weight: 600;
					text-transform: uppercase;
					letter-spacing: 1px;
				}

				.form-input {
					padding: 12px 16px;
					border: 1px solid #d4af37;
					border-radius: 6px;
					background: rgba(255, 255, 255, 0.05);
					color: #ffffff;
					font-size: 14px;
					transition: all 0.3s ease;
				}

				.form-input::placeholder {
					color: #666666;
				}

				.form-input:focus {
					outline: none;
					border-color: #ff1493;
					box-shadow: 0 0 10px rgba(255, 20, 147, 0.3);
					background: rgba(255, 255, 255, 0.1);
				}

				.submit-btn {
					padding: 12px 24px;
					background-color: #d4af37;
					color: #ffffff;
					border: none;
					border-radius: 6px;
					font-size: 14px;
					font-weight: 700;
					text-transform: uppercase;
					letter-spacing: 1px;
					cursor: pointer;
					transition: all 0.3s ease;
					margin-top: 10px;
				}

				.submit-btn:hover {
					transform: translateY(-2px);
					box-shadow: 0 8px 20px rgba(212, 175, 55, 0.4);
				}

				.submit-btn:active {
					transform: translateY(0);
				}
			`}</style>
		</div>
	);
}
