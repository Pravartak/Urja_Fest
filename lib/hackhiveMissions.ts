/**
 * Firestore layout for the HackHive mission release. Keep in sync with
 * firestore.rules and scripts/seed-hackhive-missions.mjs.
 *
 *   HackHiveConfig/missionRelease  { released, updatedAt, updatedBy }
 *     Public, so team portals can watch it live. Flipped from /hackhive/admin.
 *   HackHiveMissions/{missionId}   { code, title, summary, order }
 *     Readable by participants only while `released` is true.
 */
import type { DocumentData } from "firebase/firestore";

export const RELEASE_DOC_PATH = "HackHiveConfig/missionRelease";
export const MISSIONS_COLLECTION = "HackHiveMissions";

export interface MissionRecord {
	id: string;
	code: string;
	title: string;
	summary: string;
	order: number;
}

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export const isReleased = (data: DocumentData | undefined) => data?.released === true;

export const toMission = (id: string, data: DocumentData): MissionRecord => ({
	id,
	code: text(data.code) || id,
	title: text(data.title) || "Untitled mission",
	summary: text(data.summary),
	order: typeof data.order === "number" ? data.order : Number.MAX_SAFE_INTEGER,
});

/** Sorted here rather than with orderBy, which would hide docs without `order`. */
export const sortMissions = (missions: MissionRecord[]) =>
	[...missions].sort((a, b) => a.order - b.order || a.code.localeCompare(b.code));
