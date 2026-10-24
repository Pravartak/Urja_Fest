/*
 * Lists every HackHive team's chosen mission, as saved by the team portal, and
 * the teams that haven't chosen yet. Reads only; run it as often as you like.
 *
 *   npm install --no-save firebase-admin
 *   node scripts/export-hackhive-mission-choices.mjs
 *
 * The list is written as hackhive-mission-choices-<time>.csv in the project
 * root (gitignored). To change a team's mission, edit `missionId` in
 * HackHiveMissionChoices/{access code} in the console; delete the doc to let
 * the team choose again. Needs firebase-service-account.json in the project
 * root, as for scripts/assign-hackhive-access-codes.mjs.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const HACKHIVE_EVENT_NAME = "HackHive Hackathon";
const MISSIONS_COLLECTION = "HackHiveMissions";
const MISSION_CHOICES_COLLECTION = "HackHiveMissionChoices";

const serviceAccount = JSON.parse(
	readFileSync(new URL("../firebase-service-account.json", import.meta.url), "utf8"),
);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const text = (value) => (typeof value === "string" ? value.trim() : "");

const [teamsSnapshot, missionsSnapshot, choicesSnapshot] = await Promise.all([
	db.collection("Teams").where("eventName", "==", HACKHIVE_EVENT_NAME).get(),
	db.collection(MISSIONS_COLLECTION).get(),
	db.collection(MISSION_CHOICES_COLLECTION).get(),
]);

const teams = new Map(
	teamsSnapshot.docs.map((team) => [
		team.id,
		{ name: text(team.get("teamName")) || `(no team name) Teams/${team.id}`, lead: text(team.get("teamLeader")) },
	]),
);
const missions = missionsSnapshot.docs
	.map((mission) => ({
		id: mission.id,
		code: text(mission.get("code")) || mission.id,
		title: text(mission.get("title")) || "Untitled mission",
		order: typeof mission.get("order") === "number" ? mission.get("order") : Number.MAX_SAFE_INTEGER,
	}))
	.sort((a, b) => a.order - b.order || a.code.localeCompare(b.code));

const choices = choicesSnapshot.docs.map((choice) => ({
	accessCode: choice.id,
	teamId: text(choice.get("teamId")),
	missionId: text(choice.get("missionId")),
	chosenAt: choice.get("chosenAt")?.toDate?.() ?? null,
}));
const chosenBy = new Map(choices.map((choice) => [choice.teamId, choice]));
const time = (date) => (date ? date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "");

const rows = [];
for (const mission of missions) {
	const picks = choices
		.filter((choice) => choice.missionId === mission.id)
		.sort((a, b) => (a.chosenAt?.getTime() ?? 0) - (b.chosenAt?.getTime() ?? 0));
	console.log(`\n${mission.code} ${mission.title}: ${picks.length} ${picks.length === 1 ? "team" : "teams"}`);
	for (const choice of picks) {
		const team = teams.get(choice.teamId);
		console.log(`  ${team?.name ?? `(no HackHive team) Teams/${choice.teamId}`}  ${time(choice.chosenAt)}`);
		rows.push([mission.code, mission.title, team?.name ?? "", team?.lead ?? "", time(choice.chosenAt), choice.accessCode, choice.teamId]);
	}
}

// A choice of a mission that has since been deleted still needs sorting out.
const known = new Set(missions.map((mission) => mission.id));
const lost = choices.filter((choice) => !known.has(choice.missionId));
if (lost.length > 0) {
	console.warn(`\nChose a mission that no longer exists (fix in the console):`);
	for (const choice of lost) {
		const team = teams.get(choice.teamId);
		console.warn(`  ${team?.name ?? `Teams/${choice.teamId}`}: "${choice.missionId}" (HackHiveMissionChoices/${choice.accessCode})`);
		rows.push([choice.missionId, "(no such mission)", team?.name ?? "", team?.lead ?? "", time(choice.chosenAt), choice.accessCode, choice.teamId]);
	}
}

const waiting = [...teams].filter(([id]) => !chosenBy.has(id)).sort(([, a], [, b]) => a.name.localeCompare(b.name));
console.log(`\nNot chosen yet: ${waiting.length}`);
for (const [id, team] of waiting) {
	console.log(`  ${team.name}`);
	rows.push(["", "(not chosen yet)", team.name, team.lead, "", "", id]);
}

console.log(`\n${teams.size} accepted HackHive teams, ${teams.size - waiting.length} chose a mission.`);

const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const listUrl = new URL(`../hackhive-mission-choices-${stamp}.csv`, import.meta.url);
writeFileSync(
	listUrl,
	[
		"Mission code,Mission,Team,Team leader,Chosen at,Access code,Team ID",
		...rows.map((row) => row.map(csvCell).join(",")),
	].join("\n"),
	"utf8",
);
console.log(`Saved the list to ${fileURLToPath(listUrl)}.`);
