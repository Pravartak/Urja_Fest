import { deleteApp, initializeApp } from "firebase/app";
import {
	browserSessionPersistence,
	createUserWithEmailAndPassword,
	getAuth,
	setPersistence,
	signInWithEmailAndPassword,
	signOut,
} from "firebase/auth";
import { auth, firebaseConfig } from "./firebase";

/*
 * Each college logs in to a Firebase Auth account derived from its CC code.
 * Keep collegeEmail and collegeAuthPassword in sync with
 * scripts/create-college-accounts.mjs.
 */

// Auth emails are case-insensitive but CC codes are matched exactly, so every
// character other than a-z and 0-9 (uppercase included) is escaped as _xx.
export const collegeEmail = (ccCode: string) =>
	`${ccCode
		.trim()
		.replace(/[^a-z0-9]/g, (char) => `_${char.charCodeAt(0).toString(16)}`)}@colleges.urja-fest.app`;

// Firebase needs at least 6 characters; the prefix lets existing shorter
// college passwords keep working unchanged.
export const collegeAuthPassword = (password: string) => `urja-cc:${password}`;

const WRONG_CREDENTIAL_CODES = new Set([
	"auth/invalid-credential",
	"auth/wrong-password",
	"auth/user-not-found",
	"auth/invalid-login-credentials",
	"auth/invalid-email",
]);

/** Returns false for a wrong CC code or password; throws on other failures. */
export async function signInCollege(ccCode: string, password: string) {
	await setPersistence(auth, browserSessionPersistence);
	try {
		await signInWithEmailAndPassword(
			auth,
			collegeEmail(ccCode),
			collegeAuthPassword(password),
		);
		return true;
	} catch (error) {
		const code = (error as { code?: string }).code ?? "";
		if (WRONG_CREDENTIAL_CODES.has(code)) return false;
		throw error;
	}
}

export const signOutCollege = () => signOut(auth);

/*
 * Creates a college's login from the admin page. It runs on a throwaway app
 * instance so the admin stays signed in on the main one.
 */
export async function createCollegeAccount(ccCode: string, password: string) {
	const provisioningApp = initializeApp(
		firebaseConfig,
		`college-provisioning-${Date.now()}`,
	);
	try {
		const provisioningAuth = getAuth(provisioningApp);
		await createUserWithEmailAndPassword(
			provisioningAuth,
			collegeEmail(ccCode),
			collegeAuthPassword(password),
		);
		await signOut(provisioningAuth);
	} finally {
		await deleteApp(provisioningApp);
	}
}
