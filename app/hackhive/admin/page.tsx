"use client";

import PCBBackground from "@/app/components/PCBBackground";
import LcdBoard from "@/app/components/CircuitBoard";
import { useEffect, useState, SubmitEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

const HACKHIVE_EVENT_NAME = "HackHive Hackathon";
// Must match the value your approval flow writes to `status` on a request.
const ACCEPTED_STATUS = "accepted";

type AcceptedTeam = {
	id: string;
	leaderName: string;
	collegeName: string;
	collegeCode: string | null; // null when the team chose "Other College"
	members: string[];
};

const clean = (value: unknown): string =>
	typeof value === "string" ? value.trim() : "";

const toTeam = (id: string, data: Record<string, unknown>): AcceptedTeam => ({
	id,
	leaderName: clean(data.fullName) || "Unnamed leader",
	collegeName:
		clean(data.collegeName) ||
		clean(data.customCollegeName) ||
		"College not provided",
	collegeCode: clean(data.collegeCode) || null,
	members: [
		data.teamMember2,
		data.teamMember3,
		data.teamMember4,
		data.teamMember5,
	]
		.map(clean)
		.filter(Boolean),
});

export default function HackHiveAdmin() {
	const [boardReady, setBoardReady] = useState(false);
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [password, setPassword] = useState("");
	const [errorMsg, setErrorMsg] = useState("");

	const [teams, setTeams] = useState<AcceptedTeam[]>([]);
	const [teamsLoading, setTeamsLoading] = useState(false);
	const [teamsError, setTeamsError] = useState<string | null>(null);
	const [downloading, setDownloading] = useState(false);
	const [downloadError, setDownloadError] = useState<string | null>(null);

	const handleLogin = (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (password === process.env.NEXT_PUBLIC_HACKHIVE_ADMIN_PASS) {
			setIsLoggedIn(true);
			setErrorMsg("");
			return;
		}

		setErrorMsg("Invalid password");
		setPassword("");
	};

	const handleDownload = async () => {
		if (teams.length === 0) return;

		setDownloading(true);
		setDownloadError(null);

		try {
			// Loaded on demand so the Excel library stays out of the main bundle.
			const ExcelJS = (await import("exceljs")).default;
			const workbook = new ExcelJS.Workbook();
			const sheet = workbook.addWorksheet("Accepted Teams");

			const memberColumnCount = Math.max(
				1,
				...teams.map((team) => team.members.length),
			);

			sheet.columns = [
				{ header: "S.No", key: "sno", width: 8 },
				{ header: "Team Leader", key: "leader", width: 28 },
				{ header: "College", key: "college", width: 40 },
				{ header: "CC Code", key: "code", width: 14 },
				{ header: "Team Size", key: "size", width: 12 },
				...Array.from({ length: memberColumnCount }, (_, index) => ({
					header: `Member ${index + 1}`,
					key: `member${index}`,
					width: 26,
				})),
			];

			teams.forEach((team, index) => {
				const row: Record<string, string | number> = {
					sno: index + 1,
					leader: team.leaderName,
					college: team.collegeName,
					code: team.collegeCode ?? "",
					size: team.members.length + 1,
				};
				team.members.forEach((member, memberIndex) => {
					row[`member${memberIndex}`] = member;
				});
				sheet.addRow(row);
			});

			sheet.getRow(1).font = { bold: true };
			sheet.views = [{ state: "frozen", ySplit: 1 }];

			const buffer = await workbook.xlsx.writeBuffer();
			const blob = new Blob([buffer], {
				type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			});
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = "hackhive-accepted-teams.xlsx";
			document.body.appendChild(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Failed to generate Excel file: ", error);
			setDownloadError("Could not create the Excel file. Please try again.");
		} finally {
			setDownloading(false);
		}
	};

	useEffect(() => {
		if (!isLoggedIn) return;
		let active = true;

		const fetchAcceptedTeams = async () => {
			setTeamsLoading(true);
			setTeamsError(null);

			try {
				const acceptedOnly = (path: string[]) =>
					query(
						collection(db, path[0], ...path.slice(1)),
						where("status", "==", ACCEPTED_STATUS),
					);

				// Registered colleges keep requests under CollegeCreds/{id}/Requests;
				// "Other College" registrations live in HackHiveOtherRegistrations.
				const [collegeSnapshot, otherSnapshot] = await Promise.all([
					getDocs(collection(db, "CollegeCreds")),
					getDocs(acceptedOnly(["HackHiveOtherRegistrations"])),
				]);

				const perCollege = await Promise.all(
					collegeSnapshot.docs.map((collegeDoc) =>
						getDocs(acceptedOnly(["CollegeCreds", collegeDoc.id, "Requests"])),
					),
				);

				const results: AcceptedTeam[] = [];
				[...perCollege, otherSnapshot].forEach((snapshot) => {
					snapshot.docs.forEach((requestDoc) => {
						const data = requestDoc.data();
						if (data.selectedEvent !== HACKHIVE_EVENT_NAME) return;
						results.push(toTeam(requestDoc.id, data));
					});
				});

				results.sort(
					(a, b) =>
						a.collegeName.localeCompare(b.collegeName) ||
						a.leaderName.localeCompare(b.leaderName),
				);

				if (active) setTeams(results);
			} catch (error) {
				console.error("Failed to fetch accepted teams: ", error);
				if (active) {
					setTeamsError(
						"Could not load accepted teams. Check your connection and Firestore rules, then reload.",
					);
				}
			} finally {
				if (active) setTeamsLoading(false);
			}
		};

		fetchAcceptedTeams();

		return () => {
			active = false;
		};
	}, [isLoggedIn]);

	return (
		<>
			<PCBBackground className="page-wrap hackhive-page-background">
				{!isLoggedIn ? (
					<section className="register-hero hackhive-admin-login-section">
						<div className="hackhive-admin-login">
							<header className="hackhive-admin-login-header">
								<span className="hackhive-admin-login-kicker">// SECURE TERMINAL</span>
								<h1>Admin Panel</h1>
							</header>

							<form
								className="hackhive-admin-login-form"
								onSubmit={handleLogin}
							>
								<label htmlFor="admin-password">
									ADMIN PASSWORD
								</label>

								<input
									className="hackhive-admin-password"
									id="admin-password"
									type="password"
									value={password}
									onChange={(event) => setPassword(event.target.value)}
									placeholder="Enter password"
								/>

								{errorMsg && (
									<div className="hackhive-admin-login-error" role="alert">
										{errorMsg}
									</div>
								)}

								<button
									type="submit"
									className="hackhive-registration-submit hackhive-admin-login-submit">
									Login
								</button>
							</form>
						</div>
					</section>
				) : (
					<section>
						{!boardReady && (
							<div className="hackhive-loader" role="status" aria-hidden="true">
								<div className="hackhive-loader-orbit" aria-hidden="true"></div>
								<p>Loading Administrator...</p>
							</div>
						)}
						<Link
							className="hackhive-back-button"
							href="/hackhive"
							aria-label="Back to HackHive">
							<ArrowLeft aria-hidden="true" size={16} strokeWidth={2.2} />
							<span>Back</span>
						</Link>

						<section
							className={`register-hero hackhive-registration-hero hackhive-registration-hero--compact ${boardReady ? " is-ready" : ""}`}>
							<LcdBoard
								text={["Admin", "Access Granted"]}
								align="center"
								className="hackhive-registration-board lcd-board"
								onReady={() => setBoardReady(true)}
							/>
						</section>

						<section
							className="section hackhive-admin-teams-section"
							aria-labelledby="hackhive-admin-teams-title">
							<div className="hackhive-admin-teams-shell">
								<header className="hackhive-admin-teams-header">
									<span className="hackhive-admin-login-kicker">
										// {HACKHIVE_EVENT_NAME.toUpperCase()}
									</span>
									<h2 id="hackhive-admin-teams-title">Accepted Teams</h2>
									{!teamsLoading && !teamsError && (
										<p className="hackhive-admin-teams-count">
											{teams.length} {teams.length === 1 ? "team" : "teams"} confirmed
										</p>
									)}
									<button
										type="button"
										className="hackhive-registration-submit hackhive-admin-teams-download"
										onClick={handleDownload}
										disabled={downloading || teamsLoading || teams.length === 0}>
										<Download aria-hidden="true" size={16} strokeWidth={2.2} />
										<span>{downloading ? "Preparing..." : "Download Excel"}</span>
									</button>
									{downloadError && (
										<div className="hackhive-admin-login-error" role="alert">
											{downloadError}
										</div>
									)}
								</header>

								{teamsLoading && (
									<p className="hackhive-admin-teams-state" role="status">
										Loading accepted teams...
									</p>
								)}

								{teamsError && (
									<div className="hackhive-admin-login-error" role="alert">
										{teamsError}
									</div>
								)}

								{!teamsLoading && !teamsError && teams.length === 0 && (
									<p className="hackhive-admin-teams-state">
										No teams have been accepted yet. Accepted registrations will
										appear here.
									</p>
								)}

								{teams.length > 0 && (
									<ul className="hackhive-admin-team-list">
										{teams.map((team) => (
											<li key={team.id} className="hackhive-admin-team-card">
												<div className="hackhive-admin-team-field">
													<span className="hackhive-admin-team-label">
														Team leader
													</span>
													<span className="hackhive-admin-team-leader">
														{team.leaderName}
													</span>
												</div>

												<div className="hackhive-admin-team-field">
													<span className="hackhive-admin-team-label">
														College
													</span>
													<span className="hackhive-admin-team-value">
														{team.collegeName}
														{team.collegeCode && (
															<span className="hackhive-admin-team-code">
																CC {team.collegeCode}
															</span>
														)}
													</span>
												</div>

												{team.members.length > 0 && (
													<div className="hackhive-admin-team-field">
														<span className="hackhive-admin-team-label">
															Team members ({team.members.length})
														</span>
														<ul className="hackhive-admin-team-members">
															{team.members.map((member, index) => (
																<li key={`${team.id}-${index}`}>{member}</li>
															))}
														</ul>
													</div>
												)}
											</li>
										))}
									</ul>
								)}
							</div>
						</section>
					</section>
				)}
			</PCBBackground>
		</>
	);
}