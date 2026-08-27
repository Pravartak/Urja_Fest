"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { db } from "@/lib/firebase";

type College = {
	code: string;
	name: string;
	city: string;
	description: string;
	participants: number;
	events: string[];
	prPoints: number;
};
type PointTransaction = {
	id: string;
	event: string;
	note: string;
	points: number;
	createdAt?: unknown;
};

const mockTransactions: PointTransaction[] = [
	{
		id: "mock-1",
		event: "Code Clash",
		note: "Participation points awarded",
		points: 50,
	},
	{
		id: "mock-2",
		event: "Sports Relay",
		note: "Late check-in deduction",
		points: -10,
	},
	{
		id: "mock-3",
		event: "Art Exhibition",
		note: "Runner-up placement",
		points: 75,
	},
];

function getText(data: Record<string, unknown>, keys: string[], fallback = "") {
	const value = keys
		.map((key) => data[key])
		.find((item) => typeof item === "string");
	return typeof value === "string" && value.trim() ? value : fallback;
}

function getNumber(data: Record<string, unknown>, keys: string[]) {
	const value = keys
		.map((key) => data[key])
		.find((item) => typeof item === "number");
	return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatTransactionDate(value: unknown) {
	const timestamp = value as
		| { toDate?: () => Date; seconds?: number }
		| undefined;
	const date =
		timestamp?.toDate?.() ??
		(typeof timestamp?.seconds === "number"
			? new Date(timestamp.seconds * 1000)
			: undefined);
	return date && !Number.isNaN(date.getTime())
		? date.toLocaleDateString("en-IN", {
				day: "numeric",
				month: "short",
				year: "numeric",
			})
		: "Recent";
}

export default function CollegePage({
	params,
}: {
	params: Promise<{ clcode: string }>;
}) {
	const { clcode } = use(params);
	const [college, setCollege] = useState<College | null>(null);
	const [transactions, setTransactions] = useState<PointTransaction[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let active = true;
		const collegeCode = clcode.trim().toUpperCase();
		async function loadCollege() {
			try {
				const collegeSnapshot = await getDocs(
					query(
						collection(db, "CollegeCreds"),
						where("ClCode", "==", collegeCode),
					),
				);
				const collegeDoc = collegeSnapshot.docs[0];
				if (!collegeDoc) throw new Error("College not found");
				const data = collegeDoc.data() as Record<string, unknown>;
				const eventValue = data.Events ?? data.events;
				const eventList = Array.isArray(eventValue)
					? eventValue.filter(
							(event): event is string => typeof event === "string",
						)
					: [];
				const nextCollege: College = {
					code: getText(data, ["ClCode"], collegeCode),
					name: getText(
						data,
						["CollegeName", "collegeName", "Name", "name"],
						"College profile",
					),
					city: getText(
						data,
						["City", "city", "Location", "location"],
						"Location to be announced",
					),
					description: getText(
						data,
						["Description", "description"],
						"Representing their college at URJA.",
					),
					participants: getNumber(data, [
						"Participants",
						"participants",
						"ParticipantCount",
					]),
					events: eventList,
					prPoints: getNumber(data, [
						"PRPoints",
						"prPoints",
						"Points",
						"points",
					]),
				};
				const transactionSnapshot = await getDocs(
					query(
						collection(db, "prPointTransactions"),
						where("collegeCode", "==", collegeCode),
					),
				);
				if (!active) return;
				setCollege(nextCollege);
				setTransactions(
					transactionSnapshot.docs
						.map((doc) => ({ id: doc.id, ...doc.data() }) as PointTransaction)
						.sort((a, b) => {
							const aSeconds =
								(a.createdAt as { seconds?: number } | undefined)?.seconds ?? 0;
							const bSeconds =
								(b.createdAt as { seconds?: number } | undefined)?.seconds ?? 0;
							return bSeconds - aSeconds;
						}),
				);
				setError(null);
			} catch (loadError) {
				console.error("Failed to load college profile:", loadError);
				if (active)
					setError(
						"We couldn't load this college profile. Please check the college code and try again.",
					);
			} finally {
				if (active) setLoading(false);
			}
		}
		loadCollege();
		return () => {
			active = false;
		};
	}, [clcode]);

	if (loading)
		return (
			<>
				<Navbar />
				<main className="page-wrap college-dashboard">
					<section className="section event-day-empty">
						Loading college profile...
					</section>
				</main>
				<Footer />
			</>
		);
	if (error || !college)
		return (
			<>
				<Navbar />
				<main className="page-wrap college-dashboard">
					<section className="section event-day-empty">
						{error ?? "College not found."}
					</section>
				</main>
				<Footer />
			</>
		);
	const displayedTransactions = transactions.length
		? transactions
		: mockTransactions;
	return (
		<>
			<div className="cosmic-bg" />
			<div className="cosmic-vignette" />
			<Navbar />
			<main className="page-wrap college-dashboard">
				<section className="college-hero section">
					<div className="college-identity">
						<div className="college-mark" aria-hidden="true">
							{college.code.slice(0, 2)}
						</div>
						<div>
							<p className="eyebrow">COLLEGE PROFILE / {college.code}</p>
							<h1>{college.name}</h1>
							<p className="college-location">
								{college.city} · URJA 2026 delegate hub
							</p>
						</div>
					</div>
					<p className="college-description">{college.description}</p>
					<Link className="btn btn-ghost" href="/events">
						View all URJA events <span aria-hidden="true">→</span>
					</Link>
				</section>
				<section
					className="college-stats section"
					aria-label="College statistics">
					<div className="college-stat">
						<span className="stat-label">PARTICIPANTS</span>
						<strong>{college.participants}</strong>
						<span>registered students</span>
					</div>
					<div className="college-stat">
						<span className="stat-label">PR POINTS</span>
						<strong>{college.prPoints}</strong>
						<span>current balance</span>
					</div>
					<div className="college-stat">
						<span className="stat-label">EVENTS</span>
						<strong>{college.events.length}</strong>
						<span>events entered</span>
					</div>
					<div className="college-stat">
						<span className="stat-label">STATUS</span>
						<strong>LIVE</strong>
						<span>URJA 2026 delegate</span>
					</div>
				</section>
				<section className="college-content section">
					<div className="section-heading-row">
						<div>
							<p className="eyebrow">PR POINTS</p>
							<h2>Transaction history</h2>
						</div>
						<span className="live-pill">
							<span /> LIVE BALANCE
						</span>
					</div>
					<div className="transaction-list">
						{displayedTransactions.map((transaction) => (
							<article className="transaction-row" key={transaction.id}>
								<div
									className={`transaction-sign ${transaction.points >= 0 ? "is-credit" : "is-debit"}`}>
									{transaction.points >= 0 ? "+" : "−"}
								</div>
								<div className="transaction-main">
									<h3>{transaction.event}</h3>
									<p>{transaction.note}</p>
									<time>{formatTransactionDate(transaction.createdAt)}</time>
								</div>
								<strong
									className={
										transaction.points >= 0 ? "is-credit" : "is-debit"
									}>
									{transaction.points >= 0 ? "+" : ""}
									{transaction.points} <span>PR POINTS</span>
								</strong>
							</article>
						))}
					</div>
				</section>
				{college.events.length > 0 && (
					<section className="college-events section">
						<div className="section-heading-row">
							<div>
								<p className="eyebrow">EVENT MAP</p>
								<h2>Where they compete</h2>
							</div>
							<Link href="/events" className="text-link">
								Browse schedule →
							</Link>
						</div>
						<div className="college-event-grid">
							{college.events.map((event) => (
								<div className="college-event-card" key={event}>
									<div>
										<span>URJA EVENT</span>
										<h3>{event}</h3>
									</div>
								</div>
							))}
						</div>
					</section>
				)}
			</main>
			<Footer />
		</>
	);
}
