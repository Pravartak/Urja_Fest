/**
 * DEMONSTRATION problem statements — placeholders for testing the selection
 * flow. These are NOT official HackHive 2026 challenges.
 *
 * This module is only loaded (via dynamic import) after the mock release
 * switch is on. In production, real statements must come from the server
 * after release and must never ship in the client bundle.
 */

export interface Mission {
	id: string;
	code: string;
	title: string;
	summary: string;
}

export const DEMO_MISSIONS: Mission[] = [
	{
		id: "demo-alpha",
		code: "DEMO-01",
		title: "Sample Mission Alpha",
		summary:
			"Placeholder statement for testing selection. The official brief will replace this text on hackathon day.",
	},
	{
		id: "demo-beta",
		code: "DEMO-02",
		title: "Sample Mission Beta",
		summary:
			"Placeholder statement for testing selection. The official brief will replace this text on hackathon day.",
	},
	{
		id: "demo-gamma",
		code: "DEMO-03",
		title: "Sample Mission Gamma",
		summary:
			"Placeholder statement for testing selection. The official brief will replace this text on hackathon day.",
	},
];
