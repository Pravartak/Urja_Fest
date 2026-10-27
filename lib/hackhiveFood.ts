/**
 * Firestore layout for the HackHive free food. Keep in sync with
 * firestore.rules and scripts/make-food-stall-qr.mjs.
 *
 *   HackHiveConfig/foodStall  { code, createdAt }
 *     The secret printed as a QR at the food stall. No client can read it; the
 *     rules compare a claim's stallCode against it.
 *
 *   HackHiveFoodRedemptions/{4-digit access code}/claims/{member}_{slot}
 *       { teamId, member, memberName, item, stallCode, claimedAt }
 *     One doc per thing handed out, written by the team's portal when it scans
 *     the stall QR. `member` is a Teams field name (teamLeader, member2..5) and
 *     `slot` one of FOOD_SLOTS. Claims can only be created, never changed, so
 *     each member gets one biryani and two drinks: there is no other slot.
 */
export const FOOD_REDEMPTIONS_COLLECTION = "HackHiveFoodRedemptions";
export const FOOD_CLAIMS_SUBCOLLECTION = "claims";
export const FOOD_STALL_CODE_PREFIX = "HACKHIVE-FOOD-";

export type FoodItem = "biryani" | "drink";

/** What each member may claim, one doc per slot. */
export const FOOD_SLOTS: Record<FoodItem, readonly string[]> = {
	biryani: ["biryani"],
	drink: ["drink1", "drink2"],
};
