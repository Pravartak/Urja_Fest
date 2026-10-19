/** Official HackHive 2026 details, taken from the event poster. */

export const EVENT = {
	name: "HackHive 2026",
	tagline: "Intelligence for Tomorrow",
	date: "27 October 2026",
	duration: "Six hours",
	prizePool: "Up to ₹10,000",
	teamSize: "1–5 members",
	fee: "₹100 per member",
	venue:
		"U Building, 1st Floor, Dana Bandar, APMC Plot No. 7, near RTO, Sector 19B, Vashi, Navi Mumbai, Maharashtra 400703",
};

export const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
	EVENT.venue,
)}`;

export const SPONSORS = {
	title: {
		name: "WARANA",
		tagline: "Taste of Trust",
		logo: "/Warana.png",
		width: 1250,
		height: 402,
	},
	associated: [
		{
			name: "The Cosmic Grid",
			logo: "/Cosmic Grid Logo.png",
			width: 8334,
			height: 8334,
		},
		{
			name: "Wheels Navi Mumbai",
			logo: "/Wheels Navi Mumbai.png",
			width: 2048,
			height: 2048,
		},
	],
	presenter: {
		name: "Computer Association, Bakliwal Foundation College",
		logo: "/cab-logo.png",
		width: 843,
		height: 797,
	},
};
