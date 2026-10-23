/**
 * HackHive takes at most HACKHIVE_MAX_TEAMS teams, each with its own name.
 * Both are judged against the accepted HackHive Teams docs, which anyone can
 * read (pending requests are admin-only). The registration page uses them to
 * close itself and to say whether a name is free; the admin page checks again
 * before accepting, so two teams registering at once can't break either rule.
 */
import { collection, getDocs, onSnapshot, query, where, type Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const HACKHIVE_EVENT_NAME = "HackHive Hackathon";
export const HACKHIVE_MAX_TEAMS = 28;

/** "  Code  Ninjas " and "code ninjas" are the same name. */
export const normalizeTeamName = (name: string) => name.trim().replace(/\s+/g, " ").toLowerCase();

const hackHiveTeams = () => query(collection(db, "Teams"), where("eventName", "==", HACKHIVE_EVENT_NAME));

const namesOf = (docs: { data: () => Record<string, unknown> }[]) =>
	docs.map((d) => normalizeTeamName(String(d.data().teamName ?? "")));

/** Normalized names of every accepted HackHive team, one per team. */
export async function getHackHiveTeamNames(): Promise<string[]> {
	return namesOf((await getDocs(hackHiveTeams())).docs);
}

/** Like getHackHiveTeamNames, but calls `onChange` again whenever a team is accepted. */
export function watchHackHiveTeamNames(
	onChange: (names: string[]) => void,
	onError: (error: unknown) => void,
): Unsubscribe {
	return onSnapshot(hackHiveTeams(), (snap) => onChange(namesOf(snap.docs)), onError);
}
