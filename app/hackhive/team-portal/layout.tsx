import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
	title: "HackHive 2026 · Participant Portal",
	description: "Team access portal for HackHive 2026 participants.",
	robots: { index: false, follow: false },
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	viewportFit: "cover",
	themeColor: "#03141D",
};

export default function ParticipantPortalLayout({ children }: { children: ReactNode }) {
	return children;
}
