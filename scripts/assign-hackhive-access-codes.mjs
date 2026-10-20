/*
 * Gives every accepted HackHive team a random access code like #4821 for
 * /hackhive/team-portal, and saves the full list for the organizers.
 *
 *   npm install --no-save firebase-admin
 *   node scripts/assign-hackhive-access-codes.mjs            # allot codes to teams without one, then export
 *   node scripts/assign-hackhive-access-codes.mjs --dry-run  # show what would change, write nothing
 *
 * Teams keep their code across runs, so run it again after approving more
 * teams. The list is written as hackhive-access-codes-<time>.csv in the project
 * root (gitignored); share each team's code with that team only.
 *
 * Codes live in HackHiveTeamAccess/{4 digits} -> { teamId, teamName }. The
 * rules let anyone look up one code but nobody list them. Needs
 * firebase-service-account.json in the project root, as for
 * scripts/create-college-accounts.mjs. Keep the collection name and
 * HACKHIVE_EVENT_NAME in sync with app/hackhive/team-portal/_lib/portalApi.ts.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { randomInt } from "node:crypto";
import { fileURLToPath } from "node:url";
import { cert, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const HACKHIVE_EVENT_NAME = "HackHive Hackathon";
const ACCESS_COLLECTION = "HackHiveTeamAccess";
const dryRun = process.argv.includes("--dry-run");

const serviceAccount = JSON.parse(
	readFileSync(new URL("../firebase-service-account.json", import.meta.url), "utf8"),
);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const text = (value) => (typeof value === "string" ? value.trim() : "");

const [teamsSnapshot, accessSnapshot, collegesSnapshot] = await Promise.all([
	db.collection("Teams").where("eventName", "==", HACKHIVE_EVENT_NAME).get(),
	db.collection(ACCESS_COLLECTION).get(),
	db.collection("CollegeCreds").get(),
]);

const collegeNames = new Map(
	collegesSnapshot.docs.map((college) => [college.id, text(college.get("Name"))]),
);
const usedCodes = new Set(accessSnapshot.docs.map((access) => access.id));
const codeByTeam = new Map();
accessSnapshot.docs.forEach((access) => {
	const teamId = access.get("teamId");
	if (codeByTeam.has(teamId)) {
		console.warn(`Team ${teamId} has more than one code; keeping #${codeByTeam.get(teamId)}, #${access.id} also works.`);
		return;
	}
	codeByTeam.set(teamId, access.id);
});

const teamIds = new Set(teamsSnapshot.docs.map((team) => team.id));
const orphans = [...codeByTeam].filter(([teamId]) => !teamIds.has(teamId));
orphans.forEach(([teamId, code]) =>
	console.warn(`#${code} points at Teams/${teamId}, which no longer exists. It signs nobody in; delete it in the console if you like.`),
);

// 1000-9999, so a code never starts with 0 and loses a digit in a spreadsheet.
const newCode = () => {
	if (usedCodes.size >= 9000) throw new Error("All 9000 four-digit codes are taken.");
	let code;
	do code = String(randomInt(1000, 10000));
	while (usedCodes.has(code));
	usedCodes.add(code);
	return code;
};

const batch = db.batch();
let allotted = 0;
for (const team of teamsSnapshot.docs) {
	if (codeByTeam.has(team.id)) continue;
	const code = newCode();
	codeByTeam.set(team.id, code);
	batch.set(db.collection(ACCESS_COLLECTION).doc(code), {
		teamId: team.id,
		teamName: text(team.get("teamName")),
		createdAt: FieldValue.serverTimestamp(),
	});
	allotted++;
	console.log(`${dryRun ? "Would allot" : "Allotted"} #${code} to ${text(team.get("teamName")) || `(no team name) Teams/${team.id}`}`);
}
if (!dryRun && allotted > 0) await batch.commit();

const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const rows = teamsSnapshot.docs
	.map((team) => ({
		code: `#${codeByTeam.get(team.id)}`,
		teamName: text(team.get("teamName")),
		teamLeader: text(team.get("teamLeader")),
		college: text(team.get("collegeName")) || collegeNames.get(team.get("collegeId")) || "",
		teamId: team.id,
	}))
	.sort((a, b) => a.college.localeCompare(b.college) || a.teamName.localeCompare(b.teamName));

console.log(
	`${teamsSnapshot.size} accepted HackHive teams, ${allotted} new ${allotted === 1 ? "code" : "codes"}${dryRun ? " (dry run, nothing written)" : ""}.`,
);

if (!dryRun && rows.length > 0) {
	const stamp = new Date().toISOString().replace(/[:.]/g, "-");
	const listUrl = new URL(`../hackhive-access-codes-${stamp}.csv`, import.meta.url);
	writeFileSync(
		listUrl,
		[
			"Access code,Team,Team leader,College,Team ID",
			...rows.map((row) => [row.code, row.teamName, row.teamLeader, row.college, row.teamId].map(csvCell).join(",")),
		].join("\n"),
		"utf8",
	);
	console.log(`Saved the list to ${fileURLToPath(listUrl)}. Keep it private.`);
}
