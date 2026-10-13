import {
	browserSessionPersistence,
	onAuthStateChanged,
	setPersistence,
	signInWithEmailAndPassword,
	signOut,
	User,
} from "firebase/auth";
import { auth } from "./firebase";

// Each admin role is one Firebase Auth account; admins only ever type the
// password. These emails are not secret: Firebase checks the password, and
// firestore.rules decides what each account may do. Keep them in sync with
// the email lists in firestore.rules.
export const ADMIN_ACCOUNTS = {
	// Main admin panel: colleges, PR points, non-HackHive registrations.
	admin: "admin@urja-fest.app",
	// Main admin panel plus accepting/rejecting HackHive registrations.
	hackhiveApprover: "hackhive-approver@urja-fest.app",
	// HackHive admin page: read-only list of accepted teams.
	hackhiveViewer: "hackhive-viewer@urja-fest.app",
} as const;

export type AdminRole = keyof typeof ADMIN_ACCOUNTS;

export const roleOf = (user: User | null): AdminRole | null => {
	const match = Object.entries(ADMIN_ACCOUNTS).find(
		([, email]) => email === user?.email,
	);
	return match ? (match[0] as AdminRole) : null;
};

const WRONG_PASSWORD_CODES = new Set([
	"auth/invalid-credential",
	"auth/wrong-password",
	"auth/user-not-found",
	"auth/invalid-login-credentials",
]);

// Tries the password against each allowed role's account in order and
// returns the role it unlocked, or null if it matched none of them.
export async function signInWithPassword(
	password: string,
	roles: AdminRole[],
): Promise<AdminRole | null> {
	// Session-only: closing the tab logs the admin out, like before.
	await setPersistence(auth, browserSessionPersistence);

	for (const role of roles) {
		try {
			await signInWithEmailAndPassword(auth, ADMIN_ACCOUNTS[role], password);
			return role;
		} catch (error) {
			const code = (error as { code?: string }).code ?? "";
			if (!WRONG_PASSWORD_CODES.has(code)) throw error;
		}
	}

	return null;
}

export const loginErrorMessage = (error: unknown) =>
	(error as { code?: string }).code === "auth/too-many-requests"
		? "Too many attempts. Please wait a few minutes and try again."
		: "Could not reach the login service. Check your connection and try again.";

export const watchAdminRole = (callback: (role: AdminRole | null) => void) =>
	onAuthStateChanged(auth, (user) => callback(roleOf(user)));

export const signOutAdmin = () => signOut(auth);
