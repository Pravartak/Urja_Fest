/**
 * Firestore layout for HackHive room allocation. Keep in sync with
 * firestore.rules and scripts/assign-hackhive-rooms.mjs (which holds how many
 * teams of each size every room takes).
 *
 *   HackHiveRooms/{teamId}  { room, teamName, size, assignedAt }
 *     Written by the script. A team's portal shows its room once the missions
 *     are released (lib/hackhiveMissions.ts); until then the rules refuse the
 *     read. To move a team, change `room` in the console to another of
 *     HACKHIVE_ROOMS: the portal picks it up live.
 */
export const ROOMS_COLLECTION = "HackHiveRooms";

export const HACKHIVE_ROOMS = ["Room 11 & 12", "Library", "Room 13", "Room 14", "Room 5"] as const;

/** These are reached by turning left at the crossroad; the rest are straight on. */
const LEFT_OF_CROSSROAD: readonly string[] = ["Room 11 & 12", "Room 13", "Room 14", "Library"];

export const roomHint = (room: string) =>
	LEFT_OF_CROSSROAD.includes(room) ? "Take left at the crossroad to reach faster" : "Go straight";
