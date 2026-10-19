/*
 * Uploads the HackHive problem statements to Firestore (HackHiveMissions).
 * Teams cannot read them until someone presses "Reveal missions" on
 * /hackhive/admin, which flips HackHiveConfig/missionRelease.
 *
 *   npm install --no-save firebase-admin
 *   node scripts/seed-hackhive-missions.mjs hackhive-missions.json            # add/update
 *   node scripts/seed-hackhive-missions.mjs hackhive-missions.json --replace  # also delete missions missing from the file
 *
 * The file is a JSON array of { id, code, title, summary }; teams see them in
 * file order. Copy scripts/hackhive-missions.example.json to the project root
 * as hackhive-missions.json (gitignored) so the real statements never reach git.
 *
 * Needs firebase-service-account.json in the project root, as for
 * scripts/create-college-accounts.mjs. Never touches the release switch.
 * Keep the field names in sync with lib/hackhiveMissions.ts.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const file = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
const replace = process.argv.includes("--replace");

if (!file) {
	console.error("Usage: node scripts/seed-hackhive-missions.mjs <missions.json> [--replace]");
	process.exit(1);
}

const missions = JSON.parse(readFileSync(resolve(file), "utf8"));
const text = (value) => (typeof value === "string" ? value.trim() : "");

if (!Array.isArray(missions) || missions.length === 0) {
	console.error("The file must hold a non-empty JSON array of missions.");
	process.exit(1);
}

const problems = [];
const ids = new Set();
missions.forEach((mission, index) => {
	const id = text(mission?.id);
	if (!/^[A-Za-z0-9_-]+$/.test(id)) problems.push(`#${index + 1}: id must be letters, digits, - or _`);
	else if (ids.has(id)) problems.push(`#${index + 1}: duplicate id "${id}"`);
	ids.add(id);
	if (!text(mission?.code)) problems.push(`#${index + 1}: missing code`);
	if (!text(mission?.title)) problems.push(`#${index + 1}: missing title`);
});
if (problems.length > 0) {
	console.error(`Nothing uploaded:\n  ${problems.join("\n  ")}`);
	process.exit(1);
}

const serviceAccount = JSON.parse(
	readFileSync(new URL("../firebase-service-account.json", import.meta.url), "utf8"),
);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
const collection = db.collection("HackHiveMissions");

const batch = db.batch();
missions.forEach((mission, order) => {
	batch.set(collection.doc(text(mission.id)), {
		code: text(mission.code),
		title: text(mission.title),
		summary: text(mission.summary),
		order,
	});
});

let removed = 0;
if (replace) {
	const existing = await collection.get();
	existing.docs
		.filter((missionDoc) => !ids.has(missionDoc.id))
		.forEach((missionDoc) => {
			batch.delete(missionDoc.ref);
			removed++;
		});
}

await batch.commit();

const release = await db.doc("HackHiveConfig/missionRelease").get();
const live = release.exists && release.get("released") === true;
console.log(
	`Uploaded ${missions.length} missions${removed ? `, removed ${removed}` : ""}.`,
	live
		? "Missions are RELEASED: teams see these changes right away."
		: "Missions are sealed until someone presses Reveal on /hackhive/admin.",
);
