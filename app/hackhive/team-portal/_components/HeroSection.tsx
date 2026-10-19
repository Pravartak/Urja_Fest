"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { EVENT, SPONSORS } from "../_data/eventInfo";
import { EASE, MOTION_QUERIES, SPRING, gsap, useGSAP } from "../_lib/gsap";

/**
 * Without WebGL the board throws while mounting. Contain that so the rest of
 * the portal stays usable and the loader lifts.
 */
class BoardBoundary extends Component<
	{ onError: () => void; children: ReactNode },
	{ failed: boolean }
> {
	state = { failed: false };
	static getDerivedStateFromError() {
		return { failed: true };
	}
	componentDidCatch() {
		this.props.onError();
	}
	render() {
		return this.state.failed ? null : this.props.children;
	}
}

// The board sizes itself (2.2 : 1), so its slot holds its height while loading.
const LcdBoard = dynamic(() => import("@/app/components/CircuitBoard"), {
	ssr: false,
	loading: () => null,
});

/**
 * How long to wait for the board before showing the page anyway. Its slot
 * stays empty and it fades in whenever it does arrive.
 */
const BOARD_TIMEOUT_MS = 10000;

export default function HeroSection({ onEnter }: { onEnter: () => void }) {
	const root = useRef<HTMLElement>(null);
	const entrance = useRef<gsap.core.Timeline | null>(null);
	const [boardReady, setBoardReady] = useState(false);
	const [timedOut, setTimedOut] = useState(false);
	const [boardFailed, setBoardFailed] = useState(false);

	// Like the other HackHive pages, the loader stays up until the board has
	// drawn its first frame. Its one-off set-up is synchronous, so it runs
	// behind the loader instead of stalling the entrance.
	const revealed = boardReady || timedOut || boardFailed;
	const revealedRef = useRef(revealed);
	revealedRef.current = revealed;

	useEffect(() => {
		if (boardReady) return;
		const t = window.setTimeout(() => setTimedOut(true), BOARD_TIMEOUT_MS);
		return () => window.clearTimeout(t);
	}, [boardReady]);

	useEffect(() => {
		if (revealed) entrance.current?.play();
	}, [revealed]);

	useGSAP(
		() => {
			const mm = gsap.matchMedia();
			mm.add(
				{ motion: MOTION_QUERIES.motion, small: MOTION_QUERIES.small },
				(ctx) => {
					const { motion, small } = ctx.conditions as {
						motion: boolean;
						small: boolean;
					};
					if (!motion) return;

					// Built paused (from-states applied) and played once the loader lifts.
					const tl = gsap.timeline({ defaults: { ease: EASE }, paused: true });
					tl.from(".hhp-hero-frame", { opacity: 0, duration: 0.6 })
						.from(
							".hhp-trace-base",
							{ strokeDashoffset: 1, duration: 1.4, ease: "power2.inOut" },
							0,
						)
						.from(".hhp-hero-presenter", { opacity: 0, y: -12, duration: 0.6 }, 0.15)
						.from(
							".hhp-hero-lcd",
							{ opacity: 0, scale: 0.6, duration: 0.9, ease: SPRING },
							0.3,
						)
						.from(
							".hhp-hero-reveal",
							{ opacity: 0, y: 16, duration: 0.6, stagger: 0.09 },
							0.65,
						)
						.from(
							".hhp-hero-cta",
							{ opacity: 0, y: 18, scale: 0.96, duration: 0.7, ease: SPRING },
							1,
						)
						// A pulse of current travelling along the hero traces.
						.fromTo(
							".hhp-hero-pulse",
							{ strokeDashoffset: 1 },
							{
								strokeDashoffset: -0.12,
								duration: 3.2,
								ease: "none",
								repeat: -1,
								repeatDelay: 1.6,
							},
							1.6,
						);
					entrance.current = tl;
					if (revealedRef.current) tl.play();

					// Gentle parallax as the hero scrolls away (lighter on phones).
					gsap.to(".hhp-hero-glow", {
						yPercent: small ? 12 : 26,
						ease: "none",
						scrollTrigger: {
							trigger: root.current,
							start: "top top",
							end: "bottom top",
							scrub: true,
						},
					});
					gsap.to(".hhp-hero-trace", {
						yPercent: small ? -6 : -14,
						ease: "none",
						scrollTrigger: {
							trigger: root.current,
							start: "top top",
							end: "bottom top",
							scrub: true,
						},
					});

					return () => {
						entrance.current = null;
					};
				},
			);
		},
		{ scope: root },
	);

	return (
		<>
			{/* Outside the hero, whose isolated stacking context would trap it. */}
			{!revealed && (
				<div className="hackhive-loader" role="status" aria-live="polite">
					<div className="hackhive-loader-orbit" aria-hidden="true" />
					<p>Initializing team portal...</p>
				</div>
			)}
			<header ref={root} className="hhp-hero">

				<Link className="hackhive-back-button hhp-back" href="/hackhive">
					<ArrowLeft aria-hidden="true" size={16} strokeWidth={2.2} />
					<span>HackHive</span>
				</Link>

				<div className="hhp-hero-glow" aria-hidden="true" />
				<div className="hhp-hero-frame" aria-hidden="true" />

				{/* Hero circuitry: normalised paths so dash offsets are length-independent. */}
				<svg
					className="hhp-hero-trace"
					viewBox="0 0 400 300"
					preserveAspectRatio="none"
					aria-hidden="true">
					<path className="hhp-trace-base" pathLength={1} d="M0 92 H64 L84 112 H122 V150" />
					<path className="hhp-trace-base" pathLength={1} d="M400 70 H332 L312 90 H282 V128" />
					<path className="hhp-trace-base" pathLength={1} d="M0 238 H48 L70 216 H112" />
					<path className="hhp-trace-base" pathLength={1} d="M400 226 H346 L326 246 H290" />
					{/* Glow underlay instead of a drop-shadow filter (which repainted every frame). */}
					<path className="hhp-hero-pulse hhp-hero-pulse-glow" pathLength={1} d="M0 92 H64 L84 112 H122 V150" />
					<path className="hhp-hero-pulse hhp-hero-pulse-glow" pathLength={1} d="M400 226 H346 L326 246 H290" />
					<path className="hhp-hero-pulse" pathLength={1} d="M0 92 H64 L84 112 H122 V150" />
					<path className="hhp-hero-pulse" pathLength={1} d="M400 226 H346 L326 246 H290" />
				</svg>

				<div className="hhp-hero-inner">
					<div className="hhp-hero-presenter">
						<span className="hhp-chip-label">Presented by</span>
						<Image
							src={SPONSORS.presenter.logo}
							alt="Computer Association of BFC"
							width={SPONSORS.presenter.width}
							height={SPONSORS.presenter.height}
							sizes="88px"
							priority
						/>
					</div>

					<h1 className="hhp-sr-only">HackHive 2026 — Participant Portal</h1>

					{!boardFailed && (
						<div className={`hhp-hero-lcd${boardReady ? " is-ready" : ""}`}>
							<div className="hhp-hero-lcd-board">
								<BoardBoundary onError={() => setBoardFailed(true)}>
									<LcdBoard
										text={["HACKHIVE 2026", "TEAM PORTAL"]}
										align="center"
										onReady={() => setBoardReady(true)}
									/>
								</BoardBoundary>
							</div>
						</div>
					)}

					<p className="hhp-hero-tagline hhp-hero-reveal">{EVENT.tagline}</p>

					<ul className="hhp-hero-meta" aria-label="Event at a glance">
						<li className="hhp-hero-reveal">
							<span className="hhp-led" aria-hidden="true" />
							27 October 2026
						</li>
						<li className="hhp-hero-reveal">
							<span className="hhp-led" aria-hidden="true" />
							Six-hour hackathon
						</li>
					</ul>

					<button type="button" className="hhp-btn hhp-btn-primary hhp-hero-cta" onClick={onEnter}>
						<span className="hhp-btn-led" aria-hidden="true" />
						<span>Access participant portal</span>
						<span className="hhp-btn-glyph" aria-hidden="true">
							↓
						</span>
					</button>
				</div>
			</header>
		</>
	);
}
