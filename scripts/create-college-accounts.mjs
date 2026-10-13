/*
 * One-time migration of college logins from CollegeCreds.Password to Firebase Auth.
 *
 *   npm install --no-save firebase-admin
 *   node scripts/create-college-accounts.mjs                    # create/sync accounts
 *   node scripts/create-college-accounts.mjs --strip-passwords  # back up, then remove Password fields
 *   node scripts/create-college-accounts.mjs --export           # only save the passwords to a CSV
 *
 * Backups are written as college-passwords-<time>.csv in the project root
 * (gitignored). Move them somewhere safe, like a password manager.
 *
 * Needs a service-account key saved as firebase-service-account.json in the
 * project root (Firebase Console > Project settings > Service accounts). It is
 * gitignored; delete it when you are done.
 *
 * Safe to run more than once. Keep collegeEmail and collegeAuthPassword in
 * sync with lib/collegeAuth.ts.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const collegeEmail = (ccCode) =>
	`${ccCode
		.trim()
		.replace(/[^a-z0-9]/g, (char) => `_${char.charCodeAt(0).toString(16)}`)}@colleges.urja-fest.app`;

const collegeAuthPassword = (password) => `urja-cc:${password}`;

const stripPasswords = process.argv.includes("--strip-passwords");
const exportOnly = process.argv.includes("--export");

const serviceAccount = JSON.parse(
	readFileSync(new URL("../firebase-service-account.json", import.meta.url), "utf8"),
);
initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();
const db = getFirestore();

const snapshot = await db.collection("CollegeCreds").get();

// Firebase Auth keeps only password hashes, so save a readable copy before
// anything is stripped. Timestamped so a later run never overwrites it.
if (stripPasswords || exportOnly) {
	const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
	const rows = snapshot.docs
		.map((collegeDoc) => collegeDoc.data())
		.filter((data) => data.Password !== undefined)
		.map((data) => [data.ClCode, data.Name, data.Password].map(csvCell).join(","));

	if (rows.length > 0) {
		const stamp = new Date().toISOString().replace(/[:.]/g, "-");
		const backupUrl = new URL(`../college-passwords-${stamp}.csv`, import.meta.url);
		writeFileSync(backupUrl, ["CC Code,College,Password", ...rows].join("\n"), "utf8");
		console.log(`Saved ${rows.length} passwords to ${fileURLToPath(backupUrl)}\n`);
	} else {
		console.log("No passwords left in Firestore to back up.\n");
	}

	if (exportOnly) process.exit(0);
}
const seenCodes = new Set();
let problems = 0;

for (const collegeDoc of snapshot.docs) {
	const data = collegeDoc.data();
	const ccCode = String(data.ClCode ?? "").trim();
	const label = `${ccCode || "(no CC code)"} - ${data.Name ?? collegeDoc.id}`;

	if (!ccCode) {
		console.warn(`SKIP  ${label}: no CC code`);
		problems++;
		continue;
	}
	if (seenCodes.has(ccCode)) {
		console.warn(`SKIP  ${label}: duplicate CC code, fix it in Firestore`);
		problems++;
		continue;
	}
	seenCodes.add(ccCode);

	const email = collegeEmail(ccCode);
	let existing = null;
	try {
		existing = await auth.getUserByEmail(email);
	} catch (error) {
		if (error.code !== "auth/user-not-found") throw error;
	}

	if (stripPasswords) {
		if (data.Password === undefined) continue;
		if (!existing) {
			console.warn(`KEEP  ${label}: no login account yet, run without --strip-passwords first`);
			problems++;
			continue;
		}
		await collegeDoc.ref.update({ Password: FieldValue.delete() });
		console.log(`STRIP ${label}`);
		continue;
	}

	if (data.Password === undefined || data.Password === "") {
		console.log(`OK    ${label}: no Password field${existing ? "" : " and NO login account"}`);
		if (!existing) problems++;
		continue;
	}

	const password = collegeAuthPassword(String(data.Password));
	if (existing) {
		await auth.updateUser(existing.uid, { password });
		console.log(`SYNC  ${label}`);
	} else {
		await auth.createUser({ email, password, displayName: ccCode });
		console.log(`NEW   ${label}`);
	}
}

console.log(
	`\nDone: ${snapshot.size} colleges checked, ${problems} need attention${problems ? " (see warnings above)" : ""}.`,
);
