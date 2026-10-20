/**
 * Live mode only: after MAX_ACCESS_ATTEMPTS wrong codes this device locks and
 * reports itself to the organizers (lib/hackhiveAccessLocks.ts). The count is
 * kept in localStorage, so reloading or opening another tab doesn't reset it.
 * Clearing site data does, so this slows guessing rather than stopping it.
 */

import { ACCESS_LOCKS_COLLECTION, MAX_ACCESS_ATTEMPTS } from "@/lib/hackhiveAccessLocks";
import type { Unsubscribe } from "./portalApi";

export { MAX_ACCESS_ATTEMPTS };

export interface AttemptState {
	/** Wrong codes since the last sign-in or unlock, oldest first. */
	tried: string[];
	/** Set once locked: the HackHiveAccessLocks doc that reports it. */
	lockId: string | null;
}

export const ATTEMPTS_KEY = "hhp-access-attempts";
const NONE: AttemptState = { tried: [], lockId: null };

export function readAttempts(): AttemptState {
	try {
		const saved = JSON.parse(localStorage.getItem(ATTEMPTS_KEY) ?? "null");
		if (!saved || !Array.isArray(saved.tried)) return NONE;
		return {
			tried: saved.tried.filter((code: unknown) => typeof code === "string").slice(0, MAX_ACCESS_ATTEMPTS),
			lockId: typeof saved.lockId === "string" ? saved.lockId : null,
		};
	} catch {
		return NONE;
	}
}

export function clearAttempts() {
	try {
		localStorage.removeItem(ATTEMPTS_KEY);
	} catch {
		// Storage blocked: there was nothing to clear.
	}
}

const newLockId = () => {
	if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
	return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
};

/** Counts one wrong code, locking on the last allowed one. */
export function recordFailure(code: string): AttemptState {
	// Read fresh each time so tabs on the same device share one count.
	const current = readAttempts();
	if (current.lockId) return current;
	const tried = [...current.tried, code.replace(/\s+/g, "").slice(0, 12)];
	const next = { tried, lockId: tried.length >= MAX_ACCESS_ATTEMPTS ? newLockId() : null };
	try {
		localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(next));
	} catch {
		// Storage blocked: the count only lasts for this page.
	}
	return next;
}

/** "Android · Chrome": enough for an organizer to spot the device in the room. */
function deviceLabel() {
	const ua = navigator.userAgent;
	const os = /Android/.test(ua)
		? "Android"
		: /iPhone|iPad|iPod/.test(ua)
			? "iOS"
			: /Windows/.test(ua)
				? "Windows"
				: /Mac OS X/.test(ua)
					? "macOS"
					: /CrOS/.test(ua)
						? "ChromeOS"
						: /Linux/.test(ua)
							? "Linux"
							: "Unknown OS";
	const browser = /Edg\//.test(ua)
		? "Edge"
		: /OPR\/|Opera/.test(ua)
			? "Opera"
			: /SamsungBrowser/.test(ua)
				? "Samsung Internet"
				: /Firefox|FxiOS/.test(ua)
					? "Firefox"
					: /Chrome|CriOS/.test(ua)
						? "Chrome"
						: /Safari/.test(ua)
							? "Safari"
							: "Unknown browser";
	return `${os} · ${browser}`;
}

const firestore = () => Promise.all([import("firebase/firestore"), import("@/lib/firebase")]);

/** Tells the organizers this device is locked. Runs once per lock. */
export async function reportLockout(lockId: string, tried: string[]) {
	const [fs, { db }] = await firestore();
	await fs.setDoc(fs.doc(db, ACCESS_LOCKS_COLLECTION, lockId), {
		status: "locked",
		tried: tried.join(", "),
		device: deviceLabel(),
		lockedAt: fs.serverTimestamp(),
	});
}

/**
 * Watches this device's lock. `onUnreported` fires when the server has no
 * report yet (the first write failed or never left the device), `onUnlocked`
 * when an organizer re-opens it.
 */
export function watchLockout(
	lockId: string,
	onUnreported: () => void,
	onUnlocked: () => void,
): Unsubscribe {
	let stop: Unsubscribe | null = null;
	let cancelled = false;
	firestore()
		.then(([fs, { db }]) => {
			if (cancelled) return;
			stop = fs.onSnapshot(
				fs.doc(db, ACCESS_LOCKS_COLLECTION, lockId),
				// Metadata changes too, so the server's word arrives after a cached "missing".
				{ includeMetadataChanges: true },
				(snap) => {
					const data = snap.data();
					if (!data) {
						if (!snap.metadata.fromCache) onUnreported();
						return;
					}
					if (data.status === "unlocked") onUnlocked();
				},
				// Stay locked: an unreadable lock must not open the portal.
				(error) => console.error("Lockout status unavailable:", error),
			);
		})
		.catch((error) => console.error("Lockout status unavailable:", error));
	return () => {
		cancelled = true;
		stop?.();
	};
}
