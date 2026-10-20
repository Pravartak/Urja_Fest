/**
 * Firestore layout for team portal lockouts. Keep in sync with firestore.rules.
 *
 *   HackHiveAccessLocks/{lockId}  { status, tried, device, lockedAt, unlockedAt?, unlockedBy? }
 *     Written by a portal after MAX_ACCESS_ATTEMPTS wrong access codes in a row.
 *     Listed on /hackhive/admin, where an organizer flips status to "unlocked";
 *     the locked portal watches its own doc and re-opens live.
 */
export const ACCESS_LOCKS_COLLECTION = "HackHiveAccessLocks";
export const MAX_ACCESS_ATTEMPTS = 5;
