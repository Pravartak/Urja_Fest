"use client";

import { useEffect, useState } from "react";
import {
	collection,
	doc,
	onSnapshot,
	query,
	serverTimestamp,
	updateDoc,
	where,
} from "firebase/firestore";
import { Unlock } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { ACCESS_LOCKS_COLLECTION, MAX_ACCESS_ATTEMPTS } from "@/lib/hackhiveAccessLocks";

type Lockout = {
	id: string;
	tried: string;
	device: string;
	lockedAt: Date | null;
};

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const formatTime = (date: Date) =>
	date.toLocaleString("en-IN", {
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	});

/**
 * Team portal devices locked after too many wrong access codes. A wrong code
 * doesn't say which team typed it; the codes tried usually do (#4812 for #4821).
 * Unlocking re-opens the portal on that device live.
 */
export default function AccessLockouts() {
	const [lockouts, setLockouts] = useState<Lockout[] | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [unlocking, setUnlocking] = useState<string | null>(null);
	const [unlockError, setUnlockError] = useState<string | null>(null);

	useEffect(
		() =>
			onSnapshot(
				query(collection(db, ACCESS_LOCKS_COLLECTION), where("status", "==", "locked")),
				(snapshot) => {
					const list = snapshot.docs.map((lock) => {
						const data = lock.data({ serverTimestamps: "estimate" });
						return {
							id: lock.id,
							tried: text(data.tried),
							device: text(data.device) || "Unknown device",
							lockedAt: data.lockedAt?.toDate?.() ?? null,
						};
					});
					list.sort((a, b) => (b.lockedAt?.getTime() ?? 0) - (a.lockedAt?.getTime() ?? 0));
					setLockouts(list);
					setLoadError(null);
				},
				(error) => {
					console.error("Failed to read the portal lockouts: ", error);
					setLoadError(
						"Could not load portal lockouts. Check your connection and Firestore rules, then reload.",
					);
				},
			),
		[],
	);

	const unlock = async (id: string) => {
		setUnlocking(id);
		setUnlockError(null);
		try {
			await updateDoc(doc(db, ACCESS_LOCKS_COLLECTION, id), {
				status: "unlocked",
				unlockedAt: serverTimestamp(),
				unlockedBy: auth.currentUser?.email ?? "",
			});
		} catch (error) {
			console.error("Failed to unlock a portal device: ", error);
			setUnlockError("Could not unlock that device. Please try again.");
		} finally {
			setUnlocking(null);
		}
	};

	const count = lockouts?.length ?? 0;

	return (
		<section
			className="section hackhive-admin-release-section hackhive-admin-lockouts-section"
			aria-labelledby="hackhive-admin-lockouts-title">
			<header className="hackhive-admin-teams-header">
				<span className="hackhive-admin-login-kicker">// TEAM PORTAL</span>
				<h2 id="hackhive-admin-lockouts-title">Portal Lockouts</h2>
				<p className="hackhive-admin-teams-count" role="status">
					{loadError
						? "Lockouts unavailable"
						: lockouts === null
							? "Checking for lockouts..."
							: count === 0
								? "No devices are locked"
								: `${count} ${count === 1 ? "device" : "devices"} locked`}
				</p>
			</header>

			<p className="hackhive-admin-release-copy">
				A device locks after {MAX_ACCESS_ATTEMPTS} wrong access codes in a row. Check the codes it
				tried with the team at the help desk, then unlock it.
			</p>

			{loadError && (
				<div className="hackhive-admin-login-error" role="alert">
					{loadError}
				</div>
			)}

			{unlockError && (
				<div className="hackhive-admin-login-error" role="alert">
					{unlockError}
				</div>
			)}

			{count > 0 && (
				<ul className="hackhive-admin-lockout-list">
					{lockouts.map((lock) => (
						<li key={lock.id} className="hackhive-admin-release-card hackhive-admin-lockout-card">
							<div className="hackhive-admin-release-state">
								<span className="hackhive-admin-release-led" aria-hidden="true" />
								<span>Locked{lock.lockedAt && ` · ${formatTime(lock.lockedAt)}`}</span>
							</div>
							<p className="hackhive-admin-lockout-tried">
								<span className="hackhive-admin-team-label">Codes tried</span>
								<span>{lock.tried || "Not recorded"}</span>
							</p>
							<p className="hackhive-admin-release-meta">{lock.device}</p>
							<div className="hackhive-admin-release-actions">
								<button
									type="button"
									className="hackhive-admin-release-secondary"
									onClick={() => unlock(lock.id)}
									disabled={unlocking !== null}>
									<Unlock aria-hidden="true" size={16} strokeWidth={2.2} />
									<span>{unlocking === lock.id ? "Unlocking..." : "Unlock device"}</span>
								</button>
							</div>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
