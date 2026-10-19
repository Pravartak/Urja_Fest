/**
 * HackHive 2026 participant portal — PROTOTYPE CONFIGURATION
 * ----------------------------------------------------------------
 * Everything the organizers may want to change for the prototype lives here:
 *   • PORTAL_MODE         → where mission release and problem statements come from
 *   • DEMO_ACCESS_CODES   → which codes unlock which demonstration team (demo mode)
 *   • DEMO_TEAMS          → the fictional team(s) shown after verification
 *   • MISSION_RELEASE     → whether / when problem statements unlock (demo mode)
 *   • PORTAL_FLAGS        → demo-only helpers shown in the UI
 *
 * In live mode a team signs in with its registered team name, looked up among
 * the accepted HackHive teams in Firestore (Teams). Selections are still only
 * kept in the browser tab.
 */

/**
 * "live": missions unlock when an organizer presses Reveal on /hackhive/admin,
 * on every open portal at once, and come from Firestore (lib/hackhiveMissions.ts).
 * "demo": the placeholder missions below and the in-page release simulator,
 * for prototype reviews without touching Firestore.
 */
export const PORTAL_MODE = "live" as "demo" | "live";

export type ParticipantRole = "Team Lead" | "Member";

export interface TeamMember {
	id: string;
	name: string;
	role: ParticipantRole;
}

export interface Team {
	id: string;
	name: string;
	status: string;
	members: TeamMember[];
}

/** Demonstration access codes. Matching ignores case and spaces. */
export const DEMO_ACCESS_CODES: Record<
	string,
	{ teamId: string; memberId: string }
> = {
	"HIVE-DEMO-2026": { teamId: "HH-DEMO-001", memberId: "m1" },
};

/** Fictional demonstration team — not a real registration. */
export const DEMO_TEAMS: Record<string, Team> = {
	"HH-DEMO-001": {
		id: "HH-DEMO-001",
		name: "NOVA PROTOCOL",
		status: "Registered",
		members: [
			{ id: "m1", name: "Member One", role: "Team Lead" },
			{ id: "m2", name: "Member Two", role: "Member" },
			{ id: "m3", name: "Member Three", role: "Member" },
		],
	},
};

/** Demo mode only; in live mode the switch lives in Firestore. */
export const MISSION_RELEASE = {
	/**
	 * Mock release switch. Keep `false` until organizers release the
	 * problem statements. (The demo control below can flip it in-session.)
	 */
	released: false,
	/**
	 * Official release moment as an ISO timestamp, e.g. "2026-10-27T10:00:00+05:30".
	 * Leave `null` until the organizers confirm a time — no countdown is shown
	 * without it. When set, the portal counts down and unlocks automatically.
	 */
	releaseAt: null as string | null,
};

export const PORTAL_FLAGS = {
	/** Show the demo access code under the input (prototype reviews only). */
	showDemoCodeHint: PORTAL_MODE === "demo",
	/** Show the "simulate organizer release" control in the locked state. */
	showReleaseSimulator: PORTAL_MODE === "demo",
};
