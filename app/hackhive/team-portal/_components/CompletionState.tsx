"use client";

import { useEffect, useRef } from "react";
import type { Mission } from "../_data/demoMissions";
import { PORTAL_MODE } from "../_data/portalConfig";
import { EASE, MOTION_QUERIES, SPRING, gsap, useGSAP } from "../_lib/gsap";

interface Props {
	mission: Mission;
	teamName: string;
	onReturn: () => void;
}

export default function CompletionState({ mission, teamName, onReturn }: Props) {
	const root = useRef<HTMLDivElement>(null);
	const heading = useRef<HTMLHeadingElement>(null);

	// Move focus to the confirmation so keyboard and screen-reader users land on it.
	useEffect(() => {
		heading.current?.focus({ preventScroll: true });
	}, []);

	useGSAP(
		() => {
			const mm = gsap.matchMedia();
			mm.add(MOTION_QUERIES.motion, () => {
				gsap
					.timeline({ defaults: { ease: EASE } })
					.from(root.current, { opacity: 0, y: 24, duration: 0.6 })
					.from(".hhp-done-ring", { scale: 0.3, opacity: 0, duration: 0.7, ease: SPRING }, 0.15)
					.from(".hhp-done-check", { strokeDashoffset: 1, duration: 0.6, ease: "power2.out" }, 0.5)
					.fromTo(
						".hhp-done-sweep",
						{ xPercent: -120, autoAlpha: 1 },
						{ xPercent: 320, opacity: 0.9, duration: 1.4, ease: "power2.inOut" },
						0.6,
					)
					.set(".hhp-done-sweep", { autoAlpha: 0 })
					.from(".hhp-done-reveal", { opacity: 0, y: 12, duration: 0.45, stagger: 0.08 }, 0.7);
			});
		},
		{ scope: root },
	);

	return (
		<div ref={root} className="hhp-done">
			<span className="hhp-done-sweep" aria-hidden="true" />
			<div className="hhp-terminal-bar" aria-hidden="true">
				<span>MISSION ARCHIVE</span>
				<span className="hhp-terminal-state is-verified">LOCKED IN</span>
			</div>

			<div className="hhp-done-body">
				<span className="hhp-done-ring" aria-hidden="true">
					<svg viewBox="0 0 48 48">
						<path className="hhp-done-check" pathLength={1} d="M14 25 L21 32 L35 17" />
					</svg>
				</span>

				<h3 ref={heading} tabIndex={-1} className="hhp-done-reveal">
					Mission locked in
				</h3>

				<dl className="hhp-done-details hhp-done-reveal">
					<div>
						<dt>Team</dt>
						<dd>{teamName}</dd>
					</div>
					<div>
						<dt>Mission</dt>
						<dd>
							<span className="hhp-spec-code">{mission.code}</span> {mission.title}
						</dd>
					</div>
				</dl>

				<p className="hhp-note hhp-done-reveal">
					{PORTAL_MODE === "demo"
						? "Recorded in this prototype only. Your choice is kept in this browser tab and has not been sent to any server."
						: "Saved for your whole team: every member sees this mission when they sign in. To change it, ask an organizer at the help desk."}
				</p>

				<button type="button" className="hhp-btn hhp-btn-ghost hhp-done-reveal" onClick={onReturn}>
					<span aria-hidden="true">↑</span> Return to team dashboard
				</button>
			</div>
		</div>
	);
}
