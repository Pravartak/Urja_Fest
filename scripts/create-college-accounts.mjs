/*
 * One-time migration of college logins from CollegeCreds.Password to Firebase Auth.
 *
 *   npm install --no-save firebase-admin
 *   node scripts/create-college-accounts.mjs                    # create/sync accounts
 *   node scripts/create-college-accounts.mjs --strip-passwords  # then remove Password fields
 *
 * Needs a service-account key saved as firebase-service-account.json in the
 * project root (Firebase Console > Project settings > Service accounts). It is
 * gitignored; delete it when you are done.
 *
 * Safe to run more than once. Keep collegeEmail and collegeAuthPassword in
 * sync with lib/collegeAuth.ts.
 */
import { readFileSync } from "node:fs";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const collegeEmail = (ccCode) =>
	`${ccCode
		.trim()
		.replace(/[^a-z0-9]/g, (char) => `_${char.charCodeAt(0).toString(16)}`)}@colleges.urja-fest.app`;

const collegeAuthPassword = (password) => `urja-cc:${password}`;

const stripPasswords = process.argv.includes("--strip-passwords");

const serviceAccount = JSON.parse(
	readFileSync(new URL("../firebase-service-account.json", import.meta.url), "utf8"),
);
initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();
const db = getFirestore();

const snapshot = await db.collection("CollegeCreds").get();
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
