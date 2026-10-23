/**
 * Participant-portal API.
 *
 * Every function returns plain data so the UI never needs to change when these
 * are swapped for real calls. In live mode (PORTAL_MODE) a team signs in with
 * its access code, and the mission release and the problem statements come
 * from Firestore, pushed live. Selections still happen only in this browser tab.
 */

import type { Firestore } from "firebase/firestore";
import {
	DEMO_ACCESS_CODES,
	DEMO_TEAMS,
	MISSION_RELEASE,
	PORTAL_MODE,
	type Team,
	type TeamMember,
} from "../_data/portalConfig";
import type { Mission } from "../_data/demoMissions";
import {
	MISSIONS_COLLECTION,
	RELEASE_DOC_PATH,
	isReleased,
	sortMissions,
	toMission,
} from "@/lib/hackhiveMissions";
import { HACKHIVE_ROOMS, ROOMS_COLLECTION } from "@/lib/hackhiveRooms";

export type VerifyResult =
	/**
	 * `participant` is null in live mode: a team code doesn't say who is typing.
	 * `accessCode` is the 4 digits in live mode, null in demo.
	 */
	| { ok: true; team: Team; participant: TeamMember | null; accessCode: string | null }
	/** "format": not shaped like a code at all, so it doesn't count as a try. */
	| { ok: false; reason: "empty" | "format" | "invalid" | "unavailable" };

export type Unsubscribe = () => void;

export const normalizeCode = (raw: string) =>
	raw.replace(/\s+/g, "").toUpperCase();

/** Must match the eventName the approval flow writes on Teams docs. */
const HACKHIVE_EVENT_NAME = "HackHive Hackathon";

/**
 * HackHiveTeamAccess/{4 digits} -> { teamId }, written by
 * scripts/assign-hackhive-access-codes.mjs. Codes can be looked up one at a
 * time but never listed (firestore.rules).
 */
const ACCESS_COLLECTION = "HackHiveTeamAccess";

/** "#4821", "4821" and "# 4821" all mean code 4821. */
const accessDigits = (code: string) => /^#?(\d{4})$/.exec(code)?.[1] ?? null;

const clean = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const MEMBER_FIELDS = ["member2", "member3", "member4", "member5"] as const;

/**
 * Accepted teams get a Teams doc on approval (app/admin/page.tsx). Member ids
 * are the Teams field names, so they stay put when a field is blank, and the
 * food rules can check a member against the doc (lib/hackhiveFood.ts).
 */
function toTeam(id: string, data: Record<string, unknown>): Team {
	const lead = clean(data.teamLeader);
	return {
		id,
		name: clean(data.teamName),
		status: "Accepted",
		members: [
			...(lead ? [{ id: "teamLeader", name: lead, role: "Team Lead" as const }] : []),
			...MEMBER_FIELDS.filter((field) => clean(data[field])).map((field) => ({
				id: field,
				name: clean(data[field]),
				role: "Member" as const,
			})),
		],
	};
}

export async function verifyAccessCode(raw: string): Promise<VerifyResult> {
	const code = normalizeCode(raw);
	if (!code) return { ok: false, reason: "empty" };

	if (PORTAL_MODE === "live") {
		const digits = accessDigits(code);
		if (!digits) return { ok: false, reason: "format" };
		try {
			const [fs, { db }] = await Promise.all([
				import("firebase/firestore"),
				import("@/lib/firebase"),
			]);
			// From the server only: offline, the cache would answer "no such code"
			// and the team would be told its code is wrong.
			const access = await fs.getDocFromServer(fs.doc(db, ACCESS_COLLECTION, digits));
			const teamId = clean(access.data()?.teamId);
			if (!teamId) return { ok: false, reason: "invalid" };
			const teamDoc = await fs.getDocFromServer(fs.doc(db, "Teams", teamId));
			// A code left behind by a deleted team signs nobody in.
			if (!teamDoc.exists() || teamDoc.data().eventName !== HACKHIVE_EVENT_NAME) {
				return { ok: false, reason: "invalid" };
			}
			return { ok: true, team: toTeam(teamDoc.id, teamDoc.data()), participant: null, accessCode: digits };
		} catch (error) {
			console.error("Team lookup failed:", error);
			return { ok: false, reason: "unavailable" };
		}
	}

	const match = DEMO_ACCESS_CODES[code];
	const team = match ? DEMO_TEAMS[match.teamId] : undefined;
	const participant = team?.members.find((m) => m.id === match.memberId);
	if (!team || !participant) return { ok: false, reason: "invalid" };

	return { ok: true, team, participant, accessCode: null };
}

export interface ReleaseStatus {
	released: boolean;
	releaseAt: Date | null;
}

export function getReleaseStatus(now = Date.now()): ReleaseStatus {
	const releaseAt = MISSION_RELEASE.releaseAt
		? new Date(MISSION_RELEASE.releaseAt)
		: null;
	const validAt = releaseAt && !Number.isNaN(releaseAt.getTime()) ? releaseAt : null;
	return {
		released:
			MISSION_RELEASE.released || (validAt !== null && now >= validAt.getTime()),
		releaseAt: validAt,
	};
}

/**
 * Returns the demo missions only once released. The demo set is code-split so
 * it is not downloaded while missions are locked.
 */
export async function getMissions(released: boolean): Promise<Mission[]> {
	if (!released) return [];
	const { DEMO_MISSIONS } = await import("../_data/demoMissions");
	return DEMO_MISSIONS;
}

/**
 * Firestore is loaded on first use so it stays out of the portal's first
 * paint. The returned function cancels the load or stops the listener.
 */
function subscribeLazily(
	start: (fs: typeof import("firebase/firestore"), db: Firestore) => Unsubscribe,
	onError: (error: unknown) => void,
): Unsubscribe {
	let stop: Unsubscribe | null = null;
	let cancelled = false;
	Promise.all([import("firebase/firestore"), import("@/lib/firebase")])
		.then(([fs, { db }]) => {
			if (!cancelled) stop = start(fs, db);
		})
		.catch((error) => {
			if (!cancelled) onError(error);
		});
	return () => {
		cancelled = true;
		stop?.();
	};
}

/** Calls `onChange` now and whenever the organizers release or re-lock. */
export function watchReleaseStatus(
	onChange: (status: ReleaseStatus) => void,
	onError: (error: unknown) => void,
): Unsubscribe {
	if (PORTAL_MODE === "demo") {
		onChange(getReleaseStatus());
		return () => {};
	}
	return subscribeLazily(
		(fs, db) =>
			fs.onSnapshot(
				fs.doc(db, RELEASE_DOC_PATH),
				(snap) => onChange({ released: isReleased(snap.data()), releaseAt: null }),
				onError,
			),
		onError,
	);
}

/**
 * Streams the released missions, including any edits made after release.
 * Only call it once released: before that the rules refuse the read.
 */
export function watchMissions(
	onChange: (missions: Mission[]) => void,
	onError: (error: unknown) => void,
): Unsubscribe {
	if (PORTAL_MODE === "demo") {
		let live = true;
		getMissions(true).then(
			(list) => live && onChange(list),
			(error) => live && onError(error),
		);
		return () => {
			live = false;
		};
	}
	return subscribeLazily(
		(fs, db) =>
			fs.onSnapshot(
				fs.collection(db, MISSIONS_COLLECTION),
				// Metadata changes too: when the server confirms an empty set, only
				// the metadata changes, and the portal must still hear about it.
				{ includeMetadataChanges: true },
				(snap) => {
					// An empty answer from the local cache is not "no missions".
					if (snap.empty && snap.metadata.fromCache) return;
					onChange(
						sortMissions(snap.docs.map((d) => toMission(d.id, d.data()))).map(
							({ id, code, title, summary }) => ({ id, code, title, summary }),
						),
					);
				},
				onError,
			),
		onError,
	);
}

/**
 * Streams the team's room (null while none is assigned), including moves made
 * later. Like the missions, only call it once released.
 */
export function watchRoom(
	teamId: string,
	onChange: (room: string | null) => void,
	onError: (error: unknown) => void,
): Unsubscribe {
	if (PORTAL_MODE === "demo") {
		onChange(HACKHIVE_ROOMS[0]);
		return () => {};
	}
	return subscribeLazily(
		(fs, db) =>
			fs.onSnapshot(
				fs.doc(db, ROOMS_COLLECTION, teamId),
				{ includeMetadataChanges: true },
				(snap) => {
					// A missing doc in the local cache is not "no room".
					if (snap.metadata.fromCache && !snap.exists()) return;
					onChange(clean(snap.data()?.room) || null);
				},
				onError,
			),
		onError,
	);
}

export async function submitMissionSelection(
	teamId: string,
	missionId: string,
): Promise<{ ok: true; recordedAt: Date; teamId: string; missionId: string }> {
	// Prototype only: recorded in component state, not persisted anywhere.
	return { ok: true, recordedAt: new Date(), teamId, missionId };
}
