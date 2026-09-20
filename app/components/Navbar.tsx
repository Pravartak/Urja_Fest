"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const HackHiveSaturn = dynamic(() => import("./HackHiveSaturn"), {
	ssr: false,
});

export default function Navbar() {
	const pathname = usePathname();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const isActive = (path: string) =>
		mounted && pathname === path ? "active" : "";

	const handleHover = (isHovered: boolean) => {
		// Broadcast a custom event with the hover state
		const event = new CustomEvent("targetHover", { detail: { isHovered } });
		window.dispatchEvent(event);
	};

	return (
		<nav className="navbar">
			<Link href="/" className="brand">
				<span>⚡URJA</span>
			</Link>
			<div className="nav-links">
				<Link href="/" className={isActive("/")}>
					HOME
				</Link>
				<Link href="/about" className={isActive("/about")}>
					ABOUT
				</Link>
				<Link href="/events" className={isActive("/events")}>
					EVENTS
				</Link>
				<Link href="/register" className={isActive("/register")}>
					REGISTER
				</Link>
				<Link href="/leaderboard" className={isActive("/leaderboard")}>
					LEADERBOARD
				</Link>
				<Link href="/gallery" className={isActive("/gallery")}>
					GALLERY
				</Link>
				<Link href="/sponsors" className={isActive("/sponsors")}>
					SPONSORS
				</Link>
				<Link href="#" className={`pitchroom ${isActive("/pitchroom")}`}>
					THE PITCH ROOM
				</Link>
				<Link
					href="/hackhive"
					className={`hackhive-link ${isActive("/hackhive")}`}
					onMouseEnter={() => handleHover(true)}
					onMouseLeave={() => handleHover(false)}>
					<HackHiveSaturn />
					<span>HACKHIVE</span>
				</Link>
				<Link href="/passport" className={`passport ${isActive("/passport")}`}>
					CC PASSPORT
				</Link>
			</div>
		</nav>
	);
}
