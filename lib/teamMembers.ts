// Largest team any event allows, counting the team leader (the person who
// fills the registration form, stored as fullName / teamLeader).
export const MAX_TEAM_SIZE = 14;

// Member positions after the leader: 2..MAX_TEAM_SIZE. Registration requests
// store them as teamMember2..teamMember14, Teams docs as member2..member14.
export const TEAM_MEMBER_POSITIONS = Array.from(
	{ length: MAX_TEAM_SIZE - 1 },
	(_, index) => index + 2,
);

export const pickTeamMembers = (
	data: Record<string, unknown>,
	prefix: "teamMember" | "member",
): string[] =>
	TEAM_MEMBER_POSITIONS.map((position) => {
		const value = data[`${prefix}${position}`];
		return typeof value === "string" ? value : "";
	});
