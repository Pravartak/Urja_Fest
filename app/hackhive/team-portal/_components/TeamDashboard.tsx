"use client";

import { forwardRef, useRef } from "react";
import { PORTAL_MODE, type Team, type TeamMember } from "../_data/portalConfig";
import { EASE, MOTION_QUERIES, SPRING, gsap, useGSAP } from "../_lib/gsap";

export type MissionPhase = "locked" | "open" | "confirmed";

interface Props {
	team: Team;
	/** Who signed in, when known (demo codes). A team name alone doesn't say. */
	participant: TeamMember | null;
	missionPhase: MissionPhase;
	missionTitle?: string;
	onContinue: () => void;
	onSignOut: () => void;
}

const PHASE_LABEL: Record<MissionPhase, string> = {
	locked: "Awaiting release",
	open: "Selection open",
	confirmed: "Mission locked in",
};

const TeamDashboard = forwardRef<HTMLHeadingElement, Props>(function TeamDashboard(
	{ team, participant, missionPhase, missionTitle, onContinue, onSignOut },
	headingRef,
) {
	const root = useRef<HTMLElement>(null);
	const lead = team.members.find((m) => m.role === "Team Lead");

	// Reveal on mount (i.e. right after a successful verification).
	useGSAP(
		() => {
			const mm = gsap.matchMedia();
			mm.add(MOTION_QUERIES.motion, () => {
				gsap
					.timeline({ defaults: { ease: EASE } })
					.from(".hhp-team-card", {
						opacity: 0,
						y: 28,
						duration: 0.7,
					})
					.fromTo(
						".hhp-team-scan",
						{ yPercent: -100, autoAlpha: 1 },
						{ yPercent: 100, autoAlpha: 0, duration: 0.9, ease: "power2.inOut" },
						0.1,
					)
					.from(".hhp-team-name", { opacity: 0, x: -18, duration: 0.55 }, "-=0.35")
					.from(".hhp-team-stat", { opacity: 0, y: 12, duration: 0.45, stagger: 0.07 }, "-=0.3")
					.from(".hhp-member", { opacity: 0, x: -14, duration: 0.45, stagger: 0.08 }, "-=0.25")
					.from(".hhp-team-actions > *", { opacity: 0, y: 10, duration: 0.4, stagger: 0.08, ease: SPRING }, "-=0.2");
			});
		},
		{ scope: root, dependencies: [team.id], revertOnUpdate: true },
	);

	return (
		<section ref={root} id="team" className="hhp-section hhp-team" aria-labelledby="hhp-team-title">
			<span className="hhp-rule" aria-hidden="true" />
			<div className="hhp-section-head">
				<span className="hhp-kicker">// TEAM NODE :: VERIFIED</span>
				<h2 id="hhp-team-title" ref={headingRef} tabIndex={-1}>
					Your team
				</h2>
			</div>

			<article className="hhp-team-card">
				<span className="hhp-team-scan" aria-hidden="true" />
				<div className="hhp-team-banner">
					{PORTAL_MODE === "demo" && <span className="hhp-demo-badge">Demonstration data</span>}
					<span className="hhp-team-id">
						<span className="hhp-spec-code">Team ID</span>
						<strong>{team.id}</strong>
					</span>
				</div>

				<p className="hhp-team-name">{team.name}</p>

				<dl className="hhp-team-stats">
					<div className="hhp-team-stat">
						<dt>Team size</dt>
						<dd>
							{team.members.length} {team.members.length === 1 ? "member" : "members"}
						</dd>
					</div>
					{participant ? (
						<div className="hhp-team-stat">
							<dt>Your role</dt>
							<dd>{participant.role}</dd>
						</div>
					) : (
						<div className="hhp-team-stat">
							<dt>Team lead</dt>
							<dd>{lead?.name ?? "Not provided"}</dd>
						</div>
					)}
					<div className="hhp-team-stat">
						<dt>Team status</dt>
						<dd>
							<span className="hhp-led" aria-hidden="true" />
							{team.status}
						</dd>
					</div>
					<div className="hhp-team-stat">
						<dt>Mission</dt>
						<dd className={`hhp-phase is-${missionPhase}`}>
							{missionPhase === "confirmed" && missionTitle ? missionTitle : PHASE_LABEL[missionPhase]}
						</dd>
					</div>
				</dl>

				<div className="hhp-members">
					<h3 className="hhp-field-label">Team members</h3>
					<ol>
						{team.members.map((m, i) => (
							<li className="hhp-member" key={m.id}>
								<span className="hhp-member-index">{String(i + 1).padStart(2, "0")}</span>
								<span className="hhp-member-name">{m.name}</span>
								<span className="hhp-member-tags">
									{m.role === "Team Lead" && <span className="hhp-tag">Lead</span>}
									{m.id === participant?.id && <span className="hhp-tag hhp-tag-you">You</span>}
								</span>
							</li>
						))}
					</ol>
				</div>

				<div className="hhp-team-actions">
					<button type="button" className="hhp-btn hhp-btn-primary" onClick={onContinue}>
						<span className="hhp-btn-led" aria-hidden="true" />
						<span>{missionPhase === "confirmed" ? "View mission" : "Choose your mission"}</span>
						<span className="hhp-btn-glyph" aria-hidden="true">
							↓
						</span>
					</button>
					<button type="button" className="hhp-btn hhp-btn-ghost" onClick={onSignOut}>
						Lock portal
					</button>
				</div>
			</article>
		</section>
	);
});

export default TeamDashboard;
