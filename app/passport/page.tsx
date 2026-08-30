"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
	collection,
	getDocs,
	query,
	where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type Event = {
	Id: string;
	Name: string;
	Teams?: string[];
};

type CollegeData = {
	ClCode?: string;
	Name?: string;
	CollegeName?: string;
	PRPoints?: number;
	Teams?: number;
	Events?: Event[];
};

type RecentUpdate = {
	id: string;
	eventName: string;
	teamLeader: string;
	points: number;
	reviewedAt: Date | null;
};

type CollegeCredential = {
	ClCode: string;
	Password: string;
};

export default function CollegeDashboard() {
	const router = useRouter();
	const params = useParams<{ clCode?: string }>();

	const routeClCode = Array.isArray(params?.clCode)
		? params.clCode[0]
		: params?.clCode ?? "";

	const [collegeCreds, setCollegeCreds] = useState<CollegeCredential[]>([]);
	const [clCode, setClCode] = useState(routeClCode);
	const [password, setPassword] = useState("");

	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [college, setCollege] = useState<CollegeData | null>(null);
	const [recentUpdates, setRecentUpdates] = useState<RecentUpdate[]>([]);

	const [credentialsLoading, setCredentialsLoading] = useState(true);
	const [dashboardLoading, setDashboardLoading] = useState(false);
	const [loginError, setLoginError] = useState("");
	const [dashboardError, setDashboardError] = useState("");

	/*
	 * The passport page and dashboard use the same CollegeCreds collection.
	 * Credentials are fetched once when the page opens.
	 */
	useEffect(() => {
		const fetchCredentials = async () => {
			try {
				const snapshot = await getDocs(collection(db, "CollegeCreds"));

				setCollegeCreds(
					snapshot.docs.map((collegeDoc) => {
						const data = collegeDoc.data();

						return {
							ClCode: String(data.ClCode ?? ""),
							Password: String(data.Password ?? ""),
						};
					})
				);
			} catch (error) {
				console.error("Error fetching college credentials:", error);
				setLoginError("Unable to connect. Please try again.");
			} finally {
				setCredentialsLoading(false);
			}
		};

		fetchCredentials();
	}, []);

	const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoginError("");

		const enteredCode = clCode.trim();

		const credential = collegeCreds.find(
			(cred) => cred.ClCode === enteredCode
		);

		if (!credential) {
			setLoginError("Invalid Cl Code. Please check and try again.");
			return;
		}

		if (credential.Password !== password) {
			setLoginError("Invalid Password. Please check and try again.");
			return;
		}

		setIsAuthenticated(true);
		setPassword("");
	};

	useEffect(() => {
		if (!isAuthenticated || !clCode.trim()) return;

		const fetchDashboard = async () => {
			setDashboardLoading(true);
			setDashboardError("");

			try {
				const collegeSnapshot = await getDocs(
					query(
						collection(db, "CollegeCreds"),
						where("ClCode", "==", clCode.trim())
					)
				);

				if (collegeSnapshot.empty) {
					setDashboardError("College data could not be found.");
					setCollege(null);
					return;
				}

				const collegeDoc = collegeSnapshot.docs[0];
				const collegeData = collegeDoc.data() as CollegeData;

				setCollege(collegeData);

				const requestsSnapshot = await getDocs(
					collection(
						db,
						"CollegeCreds",
						collegeDoc.id,
						"Requests"
					)
				);

				const updates: RecentUpdate[] = requestsSnapshot.docs
					.map((requestDoc) => {
						const data = requestDoc.data();

						if (data.status !== "accepted") return null;

						const reviewedAt =
							data.reviewedAt?.toDate?.() ??
							data.createdAt?.toDate?.();

						return {
							id: requestDoc.id,
							eventName:
								data.selectedEvent ??
								data.eventName ??
								"Event",
							teamLeader:
								data.fullName ??
								data.teamLeaderName ??
								"Team",
							points: 50,
							reviewedAt: reviewedAt ?? null,
						};
					})
					.filter(
						(update): update is RecentUpdate => update !== null
					)
					.sort(
						(a, b) =>
							(b.reviewedAt?.getTime() ?? 0) -
							(a.reviewedAt?.getTime() ?? 0)
					)
					.slice(0, 5);

				setRecentUpdates(updates);
			} catch (error) {
				console.error("Failed to load college dashboard:", error);
				setDashboardError(
					"Unable to load dashboard data. Please try again later."
				);
			} finally {
				setDashboardLoading(false);
			}
		};

		fetchDashboard();
	}, [isAuthenticated, clCode]);

	const eventsRegistered = college?.Events?.length ?? 0;

	const totalParticipants = useMemo(() => {
		return college?.Teams ?? 0;
	}, [college]);

	const formatDate = (date?: Date | null) => {
		if (!date) return "Recently";

		return date.toLocaleDateString("en-IN", {
			day: "numeric",
			month: "short",
			year: "numeric",
		});
	};

	/*
	 * Keep the exact visual language of /passport for the login state.
	 * Dashboard cards use the same colors, borders, typography and glow.
	 */
	if (!isAuthenticated) {
		return (
			<div className="page-container">
				<button
					onClick={() => router.back()}
					className="back-button"
				>
					← Back
				</button>

				<div className="passport-container">
					<div className="passport-card">
						<h1 className="passport-title">College Dashboard</h1>

						<p className="passport-subtitle">
							Enter your College Code and Password
						</p>

						<form
							onSubmit={handleLogin}
							className="passport-form"
						>
							<div className="form-group">
								<label
									htmlFor="clCode"
									className="form-label"
								>
									Cl Code
								</label>

								<input
									type="text"
									id="clCode"
									value={clCode}
									onChange={(e) =>
										setClCode(e.target.value)
									}
									placeholder="Enter your Cl Code"
									className="form-input"
									autoComplete="username"
									required
								/>

								<label
									htmlFor="clPassword"
									className="form-label"
								>
									Password
								</label>

								<input
									type="password"
									id="clPassword"
									value={password}
									onChange={(e) =>
										setPassword(e.target.value)
									}
									placeholder="Enter your Password"
									className="form-input"
									autoComplete="current-password"
									required
								/>
							</div>

							{loginError && (
								<div className="login-error">
									{loginError}
								</div>
							)}

							<button
								type="submit"
								className="submit-btn"
								disabled={credentialsLoading}
							>
								{credentialsLoading
									? "CONNECTING..."
									: "SUBMIT"}
							</button>
						</form>
					</div>
				</div>

				<style jsx>{styles}</style>
			</div>
		);
	}

	if (dashboardLoading) {
		return (
			<div className="page-container">
				<div className="loading-card">
					<div className="loading-spinner" />
					<p>Loading your dashboard...</p>
				</div>

				<style jsx>{styles}</style>
			</div>
		);
	}

	if (dashboardError || !college) {
		return (
			<div className="page-container">
				<button
					className="back-button"
					onClick={() => setIsAuthenticated(false)}
				>
					← Back
				</button>

				<div className="error-card">
					<h1>Dashboard Unavailable</h1>
					<p>
						{dashboardError ||
							"College data could not be found."}
					</p>

					<button
						className="submit-btn error-button"
						onClick={() => window.location.reload()}
					>
						TRY AGAIN
					</button>
				</div>

				<style jsx>{styles}</style>
			</div>
		);
	}

	const collegeName =
		college.CollegeName ?? college.Name ?? "College";

	return (
		<div className="page-container dashboard-page">
			<button
				className="back-button"
				onClick={() => setIsAuthenticated(false)}
			>
				← Logout
			</button>

			<div className="dashboard-container">
				<header className="dashboard-header">
					<div>
						<div className="dashboard-kicker">
							URJA • COLLEGE PASSPORT
						</div>

						<h1>{collegeName}</h1>

						<p>
							College Code:{" "}
							<strong>
								{college.ClCode ?? clCode}
							</strong>
						</p>
					</div>

					<div className="pr-badge">
						<span>PR</span>
						<small>POINTS</small>
					</div>
				</header>

				<section className="stats-grid">
					<div className="stat-card">
						<div className="stat-icon">♙</div>

						<div className="stat-content">
							<span className="stat-label">
								TOTAL PARTICIPANTS
							</span>

							<strong className="stat-value">
								{totalParticipants}
							</strong>

							<span className="stat-description">
								Registered teams
							</span>
						</div>
					</div>

					<div className="stat-card points-card">
						<div className="stat-icon gold-icon">✦</div>

						<div className="stat-content">
							<span className="stat-label">
								CURRENT PR POINTS
							</span>

							<strong className="stat-value">
								{college.PRPoints ?? 0}
							</strong>

							<span className="stat-description">
								Accumulated points
							</span>
						</div>
					</div>

					<div className="stat-card">
						<div className="stat-icon pink-icon">✧</div>

						<div className="stat-content">
							<span className="stat-label">
								EVENTS REGISTERED
							</span>

							<strong className="stat-value">
								{eventsRegistered}
							</strong>

							<span className="stat-description">
								Events with registrations
							</span>
						</div>
					</div>
				</section>

				<section className="updates-card">
					<div className="updates-header">
						<div>
							<span className="updates-kicker">
								PR ACTIVITY
							</span>
							<h2>Recent Updates</h2>
						</div>

						<div className="latest-badge">
							<span />
							LATEST
						</div>
					</div>

					{recentUpdates.length === 0 ? (
						<div className="empty-state">
							<div className="empty-icon">✦</div>

							<h3>No recent updates</h3>

							<p>
								Your PR point activity will appear here
								after registrations are accepted.
							</p>
						</div>
					) : (
						<div className="updates-list">
							{recentUpdates.map((update) => (
								<div
									className="update-row"
									key={update.id}
								>
									<div className="update-icon">+</div>

									<div className="update-details">
										<strong>
											{update.eventName}
										</strong>

										<span>
											{update.teamLeader} •{" "}
											{formatDate(
												update.reviewedAt
											)}
										</span>
									</div>

									<div className="earned-points">
										<strong>
											+{update.points}
										</strong>

										<span>PR POINTS</span>
									</div>
								</div>
							))}
						</div>
					)}
				</section>
			</div>

			<style jsx>{styles}</style>
		</div>
	);
}

const styles = `
	.page-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
		margin-top: 80px;
		background:
			radial-gradient(
				circle at 20% 20%,
				rgba(86, 21, 142, 0.13),
				transparent 32%
			),
			radial-gradient(
				circle at 80% 75%,
				rgba(255, 20, 147, 0.08),
				transparent 30%
			);
	}

	.dashboard-page {
		display: block;
		padding: 110px 28px 60px;
	}

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
		margin: 0 0 10px;
		text-transform: uppercase;
		letter-spacing: 2px;
	}

	.passport-subtitle {
		color: #b0b0b0;
		text-align: center;
		margin: 0 0 30px;
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

	.login-error {
		padding: 10px 12px;
		border: 1px solid rgba(255, 20, 147, 0.4);
		border-radius: 6px;
		background: rgba(255, 20, 147, 0.08);
		color: #ff9bd0;
		font-size: 12px;
		line-height: 1.4;
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

	.submit-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(212, 175, 55, 0.4);
	}

	.submit-btn:active:not(:disabled) {
		transform: translateY(0);
	}

	.submit-btn:disabled {
		opacity: 0.55;
		cursor: wait;
	}

	.dashboard-container {
		width: 100%;
		max-width: 1100px;
		margin: 0 auto;
	}

	.dashboard-header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 30px;
		margin-bottom: 30px;
	}

	.dashboard-kicker,
	.updates-kicker {
		color: #d4af37;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 2px;
		text-transform: uppercase;
	}

	.dashboard-header h1 {
		color: #ffffff;
		font-size: clamp(28px, 4vw, 44px);
		line-height: 1.1;
		margin: 8px 0;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.dashboard-header p {
		color: #b0b0b0;
		font-size: 14px;
		margin: 0;
	}

	.dashboard-header p strong {
		color: #ffffff;
	}

	.pr-badge {
		min-width: 100px;
		padding: 14px 18px;
		border: 1px solid rgba(212, 175, 55, 0.45);
		border-radius: 8px;
		background: rgba(212, 175, 55, 0.08);
		text-align: center;
		color: #d4af37;
	}

	.pr-badge span {
		display: block;
		font-size: 26px;
		font-weight: 800;
		line-height: 1;
	}

	.pr-badge small {
		display: block;
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 1.5px;
		margin-top: 5px;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 18px;
		margin-bottom: 20px;
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: 17px;
		min-height: 135px;
		padding: 22px;
		background: rgba(20, 10, 40, 0.8);
		border: 1px solid #512a65;
		border-radius: 10px;
		backdrop-filter: blur(10px);
		box-shadow: 0 0 18px rgba(86, 21, 142, 0.08);
		transition: all 0.3s ease;
	}

	.stat-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(212, 175, 55, 0.08);
	}

	.points-card {
		border-color: rgba(212, 175, 55, 0.5);
	}

	.stat-icon {
		flex: 0 0 50px;
		width: 50px;
		height: 50px;
		display: grid;
		place-items: center;
		border-radius: 8px;
		background: rgba(86, 21, 142, 0.2);
		border: 1px solid #512a65;
		color: #ffffff;
		font-size: 22px;
	}

	.gold-icon {
		color: #d4af37;
		background: rgba(212, 175, 55, 0.08);
		border-color: rgba(212, 175, 55, 0.35);
	}

	.pink-icon {
		color: #ff1493;
	}

	.stat-content {
		min-width: 0;
	}

	.stat-label {
		display: block;
		color: #999999;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 1.2px;
		margin-bottom: 7px;
	}

	.stat-value {
		display: block;
		color: #ffffff;
		font-size: 30px;
		line-height: 1;
	}

	.stat-description {
		display: block;
		color: #666666;
		font-size: 11px;
		margin-top: 7px;
	}

	.updates-card {
		background: rgba(20, 10, 40, 0.8);
		border: 2px solid #512a65;
		border-radius: 12px;
		backdrop-filter: blur(10px);
		box-shadow: 0 0 30px rgba(212, 175, 55, 0.08);
		overflow: hidden;
	}

	.updates-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 23px 25px 18px;
		border-bottom: 1px solid rgba(81, 42, 101, 0.55);
	}

	.updates-header h2 {
		color: #ffffff;
		font-size: 22px;
		margin: 6px 0 0;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.latest-badge {
		display: flex;
		align-items: center;
		gap: 7px;
		padding: 6px 10px;
		border: 1px solid rgba(212, 175, 55, 0.35);
		border-radius: 6px;
		color: #b0b0b0;
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 1px;
	}

	.latest-badge span {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #d4af37;
		box-shadow: 0 0 8px rgba(212, 175, 55, 0.7);
	}

	.updates-list {
		padding: 0 25px;
	}

	.update-row {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 17px 0;
		border-bottom: 1px solid rgba(81, 42, 101, 0.3);
	}

	.update-row:last-child {
		border-bottom: none;
	}

	.update-icon {
		flex: 0 0 38px;
		width: 38px;
		height: 38px;
		display: grid;
		place-items: center;
		border: 1px solid rgba(212, 175, 55, 0.35);
		border-radius: 7px;
		background: rgba(212, 175, 55, 0.08);
		color: #d4af37;
		font-size: 19px;
	}

	.update-details {
		flex: 1;
		min-width: 0;
	}

	.update-details strong {
		display: block;
		color: #ffffff;
		font-size: 14px;
		margin-bottom: 4px;
	}

	.update-details span {
		display: block;
		color: #777777;
		font-size: 11px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.earned-points {
		min-width: 85px;
		text-align: right;
	}

	.earned-points strong {
		display: block;
		color: #d4af37;
		font-size: 17px;
	}

	.earned-points span {
		display: block;
		color: #666666;
		font-size: 8px;
		font-weight: 700;
		letter-spacing: 1px;
		margin-top: 3px;
	}

	.empty-state {
		padding: 50px 25px;
		text-align: center;
	}

	.empty-icon {
		width: 45px;
		height: 45px;
		display: grid;
		place-items: center;
		margin: 0 auto 14px;
		border: 1px solid rgba(212, 175, 55, 0.35);
		border-radius: 8px;
		background: rgba(212, 175, 55, 0.08);
		color: #d4af37;
		font-size: 20px;
	}

	.empty-state h3 {
		color: #ffffff;
		font-size: 16px;
		margin: 0 0 7px;
	}

	.empty-state p {
		max-width: 430px;
		margin: 0 auto;
		color: #777777;
		font-size: 12px;
		line-height: 1.6;
	}

	.loading-card,
	.error-card {
		width: min(420px, 100%);
		padding: 42px 30px;
		background: rgba(20, 10, 40, 0.8);
		border: 2px solid #512a65;
		border-radius: 12px;
		backdrop-filter: blur(10px);
		box-shadow: 0 0 30px rgba(212, 175, 55, 0.12);
		text-align: center;
	}

	.loading-card p {
		color: #b0b0b0;
		font-size: 13px;
		margin: 18px 0 0;
	}

	.loading-spinner {
		width: 38px;
		height: 38px;
		margin: 0 auto;
		border: 3px solid rgba(212, 175, 55, 0.15);
		border-top-color: #d4af37;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.error-card h1 {
		color: #ffffff;
		font-size: 22px;
		margin: 0 0 10px;
		text-transform: uppercase;
	}

	.error-card p {
		color: #999999;
		font-size: 13px;
		line-height: 1.5;
		margin: 0 0 10px;
	}

	.error-button {
		margin-top: 10px;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 800px) {
		.dashboard-page {
			padding: 95px 16px 40px;
		}

		.back-button {
			top: 20px;
			left: 16px;
		}

		.dashboard-header {
			align-items: flex-start;
			flex-direction: column;
			margin-top: 35px;
		}

		.pr-badge {
			display: none;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 520px) {
		.page-container {
			padding: 16px;
			margin-top: 60px;
		}

		.passport-card {
			padding: 28px 22px;
		}

		.passport-title {
			font-size: 27px;
		}

		.dashboard-page {
			padding: 85px 12px 30px;
		}

		.updates-header,
		.updates-list {
			padding-left: 17px;
			padding-right: 17px;
		}

		.update-row {
			gap: 10px;
		}

		.earned-points {
			min-width: 65px;
		}
	}
`;

