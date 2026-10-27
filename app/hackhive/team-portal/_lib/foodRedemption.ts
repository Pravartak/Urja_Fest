/**
 * Live mode only: team members claim their free food (one biryani and two
 * drinks each — any mix of Mojito and Sprite, each claim recording which) by
 * scanning the QR at the food stall (lib/hackhiveFood.ts). Claims are stored
 * under the team's access code, so they hold across reloads, tabs and phones.
 */

import {
	DRINKS,
	FOOD_CLAIMS_SUBCOLLECTION,
	FOOD_REDEMPTIONS_COLLECTION,
	FOOD_SLOTS,
	FOOD_STALL_CODE_PREFIX,
	type Drink,
	type FoodItem,
} from "@/lib/hackhiveFood";
import type { TeamMember } from "../_data/portalConfig";
import type { Unsubscribe } from "./portalApi";

export { DRINKS, FOOD_SLOTS, type Drink, type FoodItem };

export interface FoodClaim {
	/** A Teams field name: teamLeader, member2..member5. */
	member: string;
	slot: string;
	item: FoodItem;
	/** Which drink this claim was; absent on biryani and on claims made before drinks were recorded. */
	drink?: Drink;
}

export type ClaimResult =
	| { ok: true; claimedAt: Date }
	/** "used up": these members asked for more than they have left; nothing was saved. */
	| { ok: false; reason: "used up"; names: string[] }
	/** "rejected": shaped like a stall code, but the rules refused it. */
	| { ok: false; reason: "rejected" | "unavailable" };

/**
 * The stall QR holds "HACKHIVE-FOOD-XXXXXXXX". Typed in by hand, the prefix is
 * optional and case doesn't matter. Returns null for anything else.
 */
export function toStallCode(raw: string): string | null {
	const code = raw.replace(/\s+/g, "").toUpperCase();
	if (!code) return null;
	const secret = code.startsWith(FOOD_STALL_CODE_PREFIX) ? code.slice(FOOD_STALL_CODE_PREFIX.length) : code;
	return /^[A-Z0-9]{6,32}$/.test(secret) ? FOOD_STALL_CODE_PREFIX + secret : null;
}

/** QR contents count only with the prefix, so a random QR isn't mistaken for a typed code. */
export const isStallQr = (raw: string) => raw.trim().toUpperCase().startsWith(FOOD_STALL_CODE_PREFIX);

/** How many of `item` the member can still claim. */
export const itemsLeft = (claims: FoodClaim[], member: string, item: FoodItem) =>
	FOOD_SLOTS[item].length - claims.filter((c) => c.member === member && c.item === item).length;

const firestore = () => Promise.all([import("firebase/firestore"), import("@/lib/firebase")]);

const claimsPath = (accessCode: string) =>
	[FOOD_REDEMPTIONS_COLLECTION, accessCode, FOOD_CLAIMS_SUBCOLLECTION] as const;

/** Calls `onChange` with every claim the team has made, now and on each change. */
export function watchClaims(
	accessCode: string,
	onChange: (claims: FoodClaim[]) => void,
	onError: (error: unknown) => void,
): Unsubscribe {
	let stop: Unsubscribe | null = null;
	let cancelled = false;
	firestore()
		.then(([fs, { db }]) => {
			if (cancelled) return;
			stop = fs.onSnapshot(
				fs.collection(db, ...claimsPath(accessCode)),
				// Metadata changes too, so the server's word arrives after a cached "none".
				{ includeMetadataChanges: true },
				(snap) => {
					// An empty answer from the local cache is not "nothing claimed".
					if (snap.empty && snap.metadata.fromCache) return;
					onChange(
						snap.docs.map((d) => {
							const data = d.data();
							return {
								member: String(data.member),
								slot: String(data.slot),
								item: data.item as FoodItem,
								drink: typeof data.drink === "string" ? (data.drink as Drink) : undefined,
							};
						}),
					);
				},
				onError,
			);
		})
		.catch((error) => {
			if (!cancelled) onError(error);
		});
	return () => {
		cancelled = true;
		stop?.();
	};
}

/** What one member is having in this scan: a biryani or not, and a drink mix. */
export interface FoodOrder {
	member: TeamMember;
	biryani: boolean;
	drinks: Record<Drink, number>;
}

/**
 * Claims every order in one go, all or nothing. A transaction: it picks each
 * member's free slots as the server sees them, fails fast when offline instead
 * of queueing, and saves nothing if anyone asked for more than they have left.
 */
export async function claimFood(
	accessCode: string,
	teamId: string,
	orders: FoodOrder[],
	stallCode: string,
): Promise<ClaimResult> {
	try {
		const [fs, { db }] = await firestore();
		const claims = fs.collection(db, ...claimsPath(accessCode));
		const usedUp = await fs.runTransaction(db, async (tx) => {
			const picks: { member: TeamMember; item: FoodItem; slot: string; drink?: Drink }[] = [];
			const none: string[] = [];
			for (const { member, biryani, drinks } of orders) {
				let short = false;
				if (biryani) {
					if ((await tx.get(fs.doc(claims, `${member.id}_biryani`))).exists()) short = true;
					else picks.push({ member, item: "biryani", slot: "biryani" });
				}
				// Each drink of the mix takes the member's next free drink slot.
				const wanted = DRINKS.flatMap((drink) => Array<Drink>(drinks[drink]).fill(drink));
				if (wanted.length) {
					const free: string[] = [];
					for (const slot of FOOD_SLOTS.drink) {
						if (!(await tx.get(fs.doc(claims, `${member.id}_${slot}`))).exists()) free.push(slot);
					}
					if (free.length < wanted.length) short = true;
					else picks.push(...wanted.map((drink, i) => ({ member, item: "drink" as const, slot: free[i], drink })));
				}
				if (short) none.push(member.name);
			}
			if (none.length) return none;
			for (const { member, item, slot, drink } of picks) {
				tx.set(fs.doc(claims, `${member.id}_${slot}`), {
					teamId,
					member: member.id,
					memberName: member.name,
					item,
					slot,
					// The rules only allow `drink` on drink claims, so leave it off biryani.
					...(drink ? { drink } : {}),
					stallCode,
					claimedAt: fs.serverTimestamp(),
				});
			}
			return [];
		});
		if (usedUp.length) return { ok: false, reason: "used up", names: usedUp };
		return { ok: true, claimedAt: new Date() };
	} catch (error) {
		console.error("Food claim failed:", error);
		const code = (error as { code?: string }).code;
		return { ok: false, reason: code === "permission-denied" ? "rejected" : "unavailable" };
	}
}
