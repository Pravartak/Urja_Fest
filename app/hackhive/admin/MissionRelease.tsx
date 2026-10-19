"use client";

import { useEffect, useRef, useState } from "react";
import {
	collection,
	doc,
	onSnapshot,
	serverTimestamp,
	setDoc,
} from "firebase/firestore";
import { Lock, Unlock } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { MISSIONS_COLLECTION, RELEASE_DOC_PATH, isReleased } from "@/lib/hackhiveMissions";

type ReleaseState = {
	released: boolean;
	updatedAt: Date | null;
	updatedBy: string | null;
};

const formatTime = (date: Date) =>
	date.toLocaleString("en-IN", {
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	});

/**
 * Reveals the HackHive problem statements on every open team portal at once.
 * Portals watch the same Firestore switch, so nobody has to reload.
 * This screen is projected, so it only ever shows how many missions there are.
 */
export default function MissionRelease() {
	const [release, setRelease] = useState<ReleaseState | null>(null);
	const [releaseError, setReleaseError] = useState<string | null>(null);
	const [missionCount, setMissionCount] = useState<number | null>(null);
	const [missionsError, setMissionsError] = useState<string | null>(null);
	// What the open confirm step will do, fixed when it opens: if another
	// organizer flips the switch meanwhile, "Yes" must not do the opposite.
	const [pending, setPending] = useState<boolean | null>(null);
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const confirming = pending !== null;

	const actionButton = useRef<HTMLButtonElement>(null);
	const cancelButton = useRef<HTMLButtonElement>(null);
	const wasConfirming = useRef(false);

	useEffect(
		() =>
			onSnapshot(
				doc(db, RELEASE_DOC_PATH),
				(snapshot) => {
					// "estimate" so our own pending write shows a time, not null.
					const data = snapshot.data({ serverTimestamps: "estimate" });
					setRelease({
						released: isReleased(data),
						updatedAt: data?.updatedAt?.toDate?.() ?? null,
						updatedBy: typeof data?.updatedBy === "string" ? data.updatedBy : null,
					});
					setReleaseError(null);
				},
				(error) => {
					console.error("Failed to read the mission release switch: ", error);
					setReleaseError(
						"Could not read the release switch. Check your connection and Firestore rules, then reload.",
					);
				},
			),
		[],
	);

	useEffect(
		() =>
			onSnapshot(
				collection(db, MISSIONS_COLLECTION),
				(snapshot) => {
					setMissionCount(snapshot.size);
					setMissionsError(null);
				},
				(error) => {
					console.error("Failed to read the missions: ", error);
					setMissionsError(
						"Could not count the uploaded missions. Check your connection and Firestore rules, then reload.",
					);
				},
			),
		[],
	);

	// Focus the safe choice when asked to confirm, and return it afterwards.
	useEffect(() => {
		if (confirming) cancelButton.current?.focus();
		else if (wasConfirming.current) actionButton.current?.focus();
		wasConfirming.current = confirming;
	}, [confirming]);

	// Someone else already did it: close the question instead of repeating it.
	useEffect(() => {
		if (pending === null || saving || release?.released !== pending) return;
		setPending(null);
		setNotice(
			pending
				? "Another organizer has just revealed the missions."
				: "Another organizer has just locked the missions.",
		);
	}, [pending, saving, release?.released]);

	const released = release?.released ?? false;
	const canRelease = release !== null && !releaseError && missionCount > 0;
	const missionsLabel = `${missionCount} ${missionCount === 1 ? "mission" : "missions"}`;

	const writeRelease = async (next: boolean) => {
		setSaving(true);
		setSaveError(null);
		try {
			await setDoc(doc(db, RELEASE_DOC_PATH), {
				released: next,
				updatedAt: serverTimestamp(),
				updatedBy: auth.currentUser?.email ?? "",
			});
			setPending(null);
		} catch (error) {
			console.error("Failed to update the mission release switch: ", error);
			setSaveError(
				next
					? "Could not release the missions. Nothing changed for the teams. Please try again."
					: "Could not lock the missions. They are still visible to teams. Please try again.",
			);
		} finally {
			setSaving(false);
		}
	};

	const openConfirm = (next: boolean) => {
		setNotice(null);
		setSaveError(null);
		setPending(next);
	};

	const statusText = releaseError
		? "Release status unavailable"
		: release === null
			? "Checking release status..."
			: released
				? "Missions are live on every team portal"
				: "Missions are sealed";

	return (
		<section
			className="section hackhive-admin-release-section"
			aria-labelledby="hackhive-admin-release-title">
			<header className="hackhive-admin-teams-header">
				<span className="hackhive-admin-login-kicker">// MISSION CONTROL</span>
				<h2 id="hackhive-admin-release-title">Problem Statements</h2>
				<p className="hackhive-admin-teams-count" role="status">
					{statusText}
				</p>
			</header>

			<div
				className={`hackhive-admin-release-card${released ? " is-released" : ""}`}>
				<div className="hackhive-admin-release-state">
					<span className="hackhive-admin-release-led" aria-hidden="true" />
					<span>{released ? "Released" : "Sealed"}</span>
				</div>

				<p className="hackhive-admin-release-copy">
					{released
						? "Teams can see and choose a mission now. Edits to the missions also reach them live."
						: "Teams see a locked vault. Revealing shows the missions on every open team portal at once, with no reload."}
				</p>

				{release?.updatedAt && (
					<p className="hackhive-admin-release-meta">
						{released ? "Released" : "Locked"} {formatTime(release.updatedAt)}
						{release.updatedBy && ` by ${release.updatedBy}`}
					</p>
				)}

				{releaseError && (
					<div className="hackhive-admin-login-error" role="alert">
						{releaseError}
					</div>
				)}

				{missionCount !== null && missionCount > 0 && (
					<p className="hackhive-admin-release-meta">
						{released ? `${missionsLabel} live` : `${missionsLabel} ready to reveal`}
					</p>
				)}

				{missionsError && (
					<div className="hackhive-admin-login-error" role="alert">
						{missionsError}
					</div>
				)}

				{!released && missionCount === 0 && !missionsError && (
					<p className="hackhive-admin-release-warning">
						No missions in Firestore yet. Upload them with
						scripts/seed-hackhive-missions.mjs before revealing.
					</p>
				)}

				{confirming ? (
					<div
						className="hackhive-admin-release-confirm"
						role="group"
						aria-labelledby="hackhive-admin-release-question">
						<p id="hackhive-admin-release-question">
							{!pending
								? "Lock the missions again? They disappear from every portal, but teams that already read them keep what they saw."
								: `Reveal ${missionsLabel} to every team now?`}
						</p>
						<div className="hackhive-admin-release-actions">
							<button
								type="button"
								className={`hackhive-registration-submit hackhive-admin-release-button${pending ? "" : " is-danger"}`}
								onClick={() => writeRelease(pending)}
								disabled={saving}>
								{pending ? (
									<Unlock aria-hidden="true" size={16} strokeWidth={2.2} />
								) : (
									<Lock aria-hidden="true" size={16} strokeWidth={2.2} />
								)}
								<span>
									{saving
										? pending
											? "Revealing..."
											: "Locking..."
										: pending
											? "Yes, reveal now"
											: "Yes, lock again"}
								</span>
							</button>
							<button
								ref={cancelButton}
								type="button"
								className="hackhive-admin-release-secondary"
								onClick={() => setPending(null)}
								disabled={saving}>
								Cancel
							</button>
						</div>
					</div>
				) : (
					<div className="hackhive-admin-release-actions">
						{released ? (
							<button
								ref={actionButton}
								type="button"
								className="hackhive-admin-release-secondary"
								onClick={() => openConfirm(false)}
								disabled={release === null || !!releaseError}>
								<Lock aria-hidden="true" size={16} strokeWidth={2.2} />
								<span>Lock missions again</span>
							</button>
						) : (
							<button
								ref={actionButton}
								type="button"
								className="hackhive-registration-submit hackhive-admin-release-button"
								onClick={() => openConfirm(true)}
								disabled={!canRelease}>
								<Unlock aria-hidden="true" size={16} strokeWidth={2.2} />
								<span>Reveal missions</span>
							</button>
						)}
					</div>
				)}

				{notice && <p className="hackhive-admin-release-meta">{notice}</p>}

				{saveError && (
					<div className="hackhive-admin-login-error" role="alert">
						{saveError}
					</div>
				)}
			</div>
		</section>
	);
}
