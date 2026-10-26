/*
 * Gives every accepted HackHive team a room, by team size, and saves the list
 * for the organizers. Teams see their room in /hackhive/team-portal once the
 * missions are released.
 *
 *   npm install --no-save firebase-admin
 *   node scripts/assign-hackhive-rooms.mjs              # place teams without a room, then export
 *   node scripts/assign-hackhive-rooms.mjs --dry-run    # show the plan, write nothing
 *   node scripts/assign-hackhive-rooms.mjs --reassign   # forget every room and place all teams again
 *
 * Teams keep their room across runs, so run it again after approving more
 * teams: they go into the places left. Team size counts the lead and every
 * filled member field. If any team doesn't fit, nothing is written and the
 * script says which; change ROOMS below, or move a team by hand in the console.
 * The list is written as hackhive-rooms-<time>.csv in the project root
 * (gitignored).
 *
 * Rooms live in HackHiveRooms/{teamId} -> { room, teamName, size, assignedAt }
 * (lib/hackhiveRooms.ts). Needs firebase-service-account.json in the project
 * root, as for scripts/assign-hackhive-access-codes.mjs.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { cert, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const HACKHIVE_EVENT_NAME = "HackHive Hackathon";
const ROOMS_COLLECTION = "HackHiveRooms";
const MEMBER_FIELDS = ["teamLeader", "member2", "member3", "member4", "member5"];

// How many teams of each size (members) every room takes. Teams fill the rooms
// in this order, so a team of 5 goes to Room 13 only once Room 11 & 12 is full.
// Keep the names in sync with HACKHIVE_ROOMS in lib/hackhiveRooms.ts.
const ROOMS = [
	{ name: "Room 11 & 12", slots: { 5: 7, 4: 1 } },
	{ name: "Library", slots: { 4: 6 } },
	{ name: "Room 13", slots: { 5: 5 } },
	{ name: "Room 14", slots: { 3: 5 } },
	{ name: "Room 1", slots: { 1: 1, 2: 3 } },
	{ name: "Room 2", slots: { 3:2 } },
];

const dryRun = process.argv.includes("--dry-run");
const reassign = process.argv.includes("--reassign");

const serviceAccount = JSON.parse(
	readFileSync(new URL("../firebase-service-account.json", import.meta.url), "utf8"),
);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const text = (value) => (typeof value === "string" ? value.trim() : "");

const [teamsSnapshot, roomsSnapshot] = await Promise.all([
	db.collection("Teams").where("eventName", "==", HACKHIVE_EVENT_NAME).get(),
	db.collection(ROOMS_COLLECTION).get(),
]);

const teams = teamsSnapshot.docs
	.map((team) => ({
		id: team.id,
		name: text(team.get("teamName")) || `(no team name) Teams/${team.id}`,
		lead: text(team.get("teamLeader")),
		size: MEMBER_FIELDS.filter((field) => text(team.get(field))).length,
		createdAt: team.get("createdAt")?.toMillis?.() ?? 0,
	}))
	// First approved, first placed.
	.sort((a, b) => a.createdAt - b.createdAt || a.name.localeCompare(b.name));

const roomOf = new Map(reassign ? [] : roomsSnapshot.docs.map((doc) => [doc.id, text(doc.get("room"))]));
const used = new Map(ROOMS.map((room) => [room.name, {}]));
const free = (room, size) => (room.slots[size] ?? 0) - (used.get(room.name)[size] ?? 0);
const take = (roomName, size) => {
	const counts = used.get(roomName);
	counts[size] = (counts[size] ?? 0) + 1;
};

// Rooms kept from earlier runs count first, even if they break the rules now.
const kept = teams.filter((team) => roomOf.has(team.id));
for (const team of kept) {
	const roomName = roomOf.get(team.id);
	const room = ROOMS.find((r) => r.name === roomName);
	if (!room) {
		console.warn(`${team.name} is in "${roomName}", which isn't one of the rooms. Fix it in the console.`);
		continue;
	}
	if (free(room, team.size) <= 0) {
		console.warn(`${team.name} (${team.size}) is in ${roomName}, which has no place left for a team of ${team.size}.`);
	}
	take(roomName, team.size);
}

const placed = [];
const unplaced = [];
for (const team of teams) {
	if (roomOf.has(team.id)) continue;
	const room = ROOMS.find((r) => free(r, team.size) > 0);
	if (!room) {
		unplaced.push(team);
		continue;
	}
	take(room.name, team.size);
	roomOf.set(team.id, room.name);
	placed.push(team);
}

for (const room of ROOMS) {
	const inRoom = teams.filter((team) => roomOf.get(team.id) === room.name);
	const places = Object.entries(room.slots)
		.map(([size, total]) => `${used.get(room.name)[size] ?? 0}/${total} teams of ${size}`)
		.join(", ");
	console.log(`\n${room.name}: ${places}, ${inRoom.reduce((n, team) => n + team.size, 0)} people`);
	inRoom.forEach((team) => console.log(`  ${placed.includes(team) ? "+" : " "} ${team.name} (${team.size})`));
}

if (unplaced.length > 0) {
	console.error(`\nNo place left for ${unplaced.length} ${unplaced.length === 1 ? "team" : "teams"}, so nothing was written:`);
	unplaced.forEach((team) => console.error(`  ${team.name} (${team.size === 1 ? "solo" : `${team.size} members`})`));
	process.exit(1);
}

console.log(
	`\n${teams.length} accepted HackHive teams, ${placed.length} newly placed (marked +)${dryRun ? " (dry run, nothing written)" : ""}.`,
);
if (dryRun) process.exit(0);

const batch = db.batch();
for (const team of placed) {
	batch.set(db.collection(ROOMS_COLLECTION).doc(team.id), {
		room: roomOf.get(team.id),
		teamName: team.name,
		size: team.size,
		assignedAt: FieldValue.serverTimestamp(),
	});
}
if (placed.length > 0) await batch.commit();

const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const order = (team) => ROOMS.findIndex((room) => room.name === roomOf.get(team.id));
const rows = teams
	.filter((team) => roomOf.has(team.id))
	.sort((a, b) => order(a) - order(b) || a.name.localeCompare(b.name));
if (rows.length > 0) {
	const stamp = new Date().toISOString().replace(/[:.]/g, "-");
	const listUrl = new URL(`../hackhive-rooms-${stamp}.csv`, import.meta.url);
	writeFileSync(
		listUrl,
		[
			"Room,Team,Members,Team leader,Team ID",
			...rows.map((team) => [roomOf.get(team.id), team.name, team.size, team.lead, team.id].map(csvCell).join(",")),
		].join("\n"),
		"utf8",
	);
	console.log(`Saved the list to ${fileURLToPath(listUrl)}.`);
}
