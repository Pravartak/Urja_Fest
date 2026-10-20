/*
 * Makes the QR code for the HackHive food stall. Teams scan it from
 * /hackhive/team-portal to redeem their one free meal.
 *
 *   npm install --no-save firebase-admin
 *   node scripts/make-food-stall-qr.mjs        # print the current stall code (creates one the first time)
 *   node scripts/make-food-stall-qr.mjs --new  # replace it: QRs printed before stop working
 *
 * Writes food-stall-qr.svg (print this: QR with the code under it, for teams
 * whose camera won't scan) and food-stall-qr.png in the project root
 * (gitignored). The code is saved in HackHiveConfig/foodStall, which the rules
 * keep unreadable to browsers. Needs firebase-service-account.json in the
 * project root, as for scripts/create-college-accounts.mjs. Keep the prefix in
 * sync with lib/hackhiveFood.ts.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { randomInt } from "node:crypto";
import { fileURLToPath } from "node:url";
import { cert, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import QRCode from "qrcode";

const PREFIX = "HACKHIVE-FOOD-";
// No 0/O or 1/I, so the printed code can be typed without guessing.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const replace = process.argv.includes("--new");

const serviceAccount = JSON.parse(
	readFileSync(new URL("../firebase-service-account.json", import.meta.url), "utf8"),
);
initializeApp({ credential: cert(serviceAccount) });
const stallDoc = getFirestore().doc("HackHiveConfig/foodStall");

let code = (await stallDoc.get()).get("code");
if (code && !replace) {
	console.log("Using the existing stall code (pass --new to replace it).");
} else {
	code = PREFIX + Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
	await stallDoc.set({ code, createdAt: FieldValue.serverTimestamp() });
	console.log(replace ? "New stall code saved. Throw away QRs printed before." : "Stall code created.");
}

const out = (name) => fileURLToPath(new URL(`../${name}`, import.meta.url));
const options = { errorCorrectionLevel: "M", margin: 2 };

await QRCode.toFile(out("food-stall-qr.png"), code, { ...options, width: 1200 });

// A4-ish card: title, QR, then the code for typing in by hand.
const qr = (await QRCode.toString(code, { ...options, type: "svg" })).replace(
	"<svg ",
	'<svg x="60" y="150" width="480" height="480" ',
);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
<rect width="600" height="800" fill="#fff"/>
<text x="300" y="80" text-anchor="middle" font-family="Arial, sans-serif" font-size="40" font-weight="700">HackHive · Free Food</text>
<text x="300" y="122" text-anchor="middle" font-family="Arial, sans-serif" font-size="19" fill="#444">Scan from your team portal: 1 biryani + 2 drinks each.</text>
${qr}
<text x="300" y="690" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#444">Camera not working? Type this code:</text>
<text x="300" y="735" text-anchor="middle" font-family="Consolas, monospace" font-size="34" font-weight="700" letter-spacing="2">${code}</text>
</svg>
`;
writeFileSync(out("food-stall-qr.svg"), svg);

console.log(`Wrote food-stall-qr.svg and food-stall-qr.png for ${code}.`);
console.log("Print the SVG (open it in a browser and print) and put it at the food stall.");
