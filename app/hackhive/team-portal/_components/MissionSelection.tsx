"use client";

import { forwardRef, useEffect, useRef, useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import type { Mission } from "../_data/demoMissions";
import { EVENT } from "../_data/eventInfo";
import { PORTAL_FLAGS, PORTAL_MODE } from "../_data/portalConfig";
import type { MissionChoiceError } from "../_lib/portalApi";
import { EASE, MOTION_QUERIES, SPRING, gsap, useGSAP } from "../_lib/gsap";
import CompletionState from "./CompletionState";

interface Props {
	released: boolean;
	releaseAt: Date | null;
	releaseFailed: boolean;
	onRetryRelease: () => void;
	missions: Mission[] | null;
	missionsFailed: boolean;
	onRetryMissions: () => void;
	selectedId: string | null;
	confirmed: Mission | null;
	/** Saving the choice. */
	confirming: boolean;
	confirmError: MissionChoiceError | null;
	teamName: string;
	onSelect: (id: string) => void;
	onConfirm: () => void;
	onSimulateRelease: () => void;
	onReleaseDue: () => void;
	onReturn: () => void;
}

const MissionSelection = forwardRef<HTMLHeadingElement, Props>(function MissionSelection(
	props,
	headingRef,
) {
	const { released, confirmed, missions } = props;
	const root = useRef<HTMLElement>(null);

	// Missions can arrive while the team is looking at the vault, so say so.
	const announce = released && missions !== null && !confirmed;

	useGSAP(
		() => {
			const mm = gsap.matchMedia();
			mm.add(MOTION_QUERIES.motion, () => {
				gsap.from(".hhp-section-head > *", {
					opacity: 0,
					y: 16,
					duration: 0.55,
					stagger: 0.08,
					ease: EASE,
					scrollTrigger: { trigger: root.current, start: "top 85%", once: true },
				});
			});
		},
		{ scope: root },
	);

	return (
		<section ref={root} id="missions" className="hhp-section hhp-missions" aria-labelledby="hhp-missions-title">
			<span className="hhp-rule is-lit" aria-hidden="true" />
			<div className="hhp-section-head">
				<span className="hhp-kicker">// MISSION CONTROL :: 02</span>
				<h2 id="hhp-missions-title" ref={headingRef} tabIndex={-1}>
					Choose your mission
				</h2>
				<p>Select a problem statement to define your team&apos;s challenge.</p>
			</div>

			<p className="hhp-sr-only" role="status">
				{announce ? `Missions released. ${missions.length} available to choose from.` : ""}
			</p>

			{confirmed ? (
				<CompletionState mission={confirmed} teamName={props.teamName} onReturn={props.onReturn} />
			) : released ? (
				<MissionList {...props} />
			) : (
				<LockedVault {...props} />
			)}
		</section>
	);
});

export default MissionSelection;

/* ------------------------------------------------------------------ */

function useCountdown(target: Date | null, onDue: () => void) {
	const [now, setNow] = useState(() => Date.now());
	const onDueRef = useRef(onDue);
	onDueRef.current = onDue;

	useEffect(() => {
		if (!target) return;
		const id = window.setInterval(() => {
			const t = Date.now();
			setNow(t);
			if (t >= target.getTime()) {
				window.clearInterval(id);
				onDueRef.current();
			}
		}, 1000);
		return () => window.clearInterval(id);
	}, [target]);

	if (!target) return null;
	const ms = Math.max(0, target.getTime() - now);
	const s = Math.floor(ms / 1000);
	return {
		d: Math.floor(s / 86400),
		h: Math.floor((s % 86400) / 3600),
		m: Math.floor((s % 3600) / 60),
		s: s % 60,
	};
}

const pad = (n: number) => String(n).padStart(2, "0");

function LockedVault({
	releaseAt,
	releaseFailed,
	onRetryRelease,
	onSimulateRelease,
	onReleaseDue,
}: Props) {
	const root = useRef<HTMLDivElement>(null);
	const countdown = useCountdown(releaseAt, onReleaseDue);

	useGSAP(
		() => {
			const mm = gsap.matchMedia();
			mm.add(MOTION_QUERIES.motion, () => {
				gsap
					.timeline({
						defaults: { ease: EASE },
						scrollTrigger: { trigger: root.current, start: "top 85%", once: true },
					})
					.from(root.current, { opacity: 0, y: 24, duration: 0.6 })
					.from(".hhp-vault-lock", { scale: 0.4, opacity: 0, duration: 0.6, ease: SPRING }, "-=0.25")
					.from(".hhp-redacted-row", { scaleX: 0, transformOrigin: "left", duration: 0.5, stagger: 0.1 }, "-=0.3");

				// The idle shimmer on the bars is a CSS transform animation (see portal.css).
			});
		},
		{ scope: root },
	);

	return (
		<div ref={root} className="hhp-vault">
			<div className="hhp-terminal-bar" aria-hidden="true">
				<span>MISSION ARCHIVE</span>
				<span className="hhp-terminal-state is-sealed">SEALED</span>
			</div>

			<div className="hhp-vault-body">
				<span className="hhp-vault-lock" aria-hidden="true">
					<Lock size={26} strokeWidth={1.8} />
				</span>
				<h3>Missions not yet declassified</h3>
				<p>
					Problem statements will become available on the day of the hackathon. The moment
					the organizers release them, they&apos;ll appear here for your team to choose
					from.{releaseFailed ? "" : " No need to refresh."}
				</p>

				{releaseFailed && (
					<div className="hhp-loading" role="alert">
						<p>
							Lost contact with mission control, so the release may not reach this page.
							Check your connection and try again.
						</p>
						<button type="button" className="hhp-btn hhp-btn-ghost" onClick={onRetryRelease}>
							Try again
						</button>
					</div>
				)}

				<div className="hhp-redacted" aria-hidden="true">
					{[0, 1, 2].map((i) => (
						<div className="hhp-redacted-row" key={i}>
							<span className="hhp-spec-code">M-0{i + 1}</span>
							<span className="hhp-redacted-bar" style={{ width: `${[72, 58, 66][i]}%` }} />
						</div>
					))}
				</div>

				<dl className="hhp-vault-status">
					<div>
						<dt>Release day</dt>
						<dd>{EVENT.date}</dd>
					</div>
					<div>
						<dt>Release time</dt>
						<dd>
							{countdown ? (
								<span className="hhp-countdown" role="timer" aria-live="off">
									{countdown.d > 0 && `${countdown.d}d `}
									{pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}
								</span>
							) : (
								"To be announced by the organizers"
							)}
						</dd>
					</div>
				</dl>
			</div>

			{PORTAL_FLAGS.showReleaseSimulator && (
				<div className="hhp-demo-control">
					<p>
						<span className="hhp-demo-badge">Prototype control</span>
						Simulates the organizers releasing problem statements. Not visible to
						participants in production.
					</p>
					<button type="button" className="hhp-btn hhp-btn-ghost" onClick={onSimulateRelease}>
						Simulate release
					</button>
				</div>
			)}
		</div>
	);
}

const CONFIRM_ERRORS: Record<MissionChoiceError, string> = {
	taken: "Your team has already chosen a mission. To change it, ask an organizer at the help desk.",
	rejected: "Your choice wasn't saved. Please ask an organizer at the help desk.",
	unavailable: "Couldn't save your choice. Check your connection and try again.",
};

function MissionList({
	missions,
	missionsFailed,
	onRetryMissions,
	selectedId,
	confirming,
	confirmError,
	onSelect,
	onConfirm,
}: Props) {
	const root = useRef<HTMLFormElement>(null);
	const ready = missions !== null;
	// Keyed to missions being there, so an empty first answer doesn't spend it.
	const hasMissions = missions !== null && missions.length > 0;

	// Unlock transition: the archive doors part, then missions stagger in.
	useGSAP(
		() => {
			if (!hasMissions) return;
			const mm = gsap.matchMedia();
			mm.add(MOTION_QUERIES.motion, () => {
				gsap
					.timeline({ defaults: { ease: EASE } })
					.set(".hhp-door", { autoAlpha: 1 })
					.from(".hhp-unlock-flash", { autoAlpha: 1, duration: 0.5 }, 0.15)
					.to(".hhp-door-l", { xPercent: -101, duration: 0.8, ease: "power3.inOut" }, 0.25)
					.to(".hhp-door-r", { xPercent: 101, duration: 0.8, ease: "power3.inOut" }, 0.25)
					.set(".hhp-door", { autoAlpha: 0 })
					.from(".hhp-mission", { opacity: 0, y: 18, duration: 0.5, stagger: 0.09 }, 0.6)
					.from(".hhp-mission-confirm", { opacity: 0, y: 10, duration: 0.4 }, "-=0.2");
			});
		},
		{ scope: root, dependencies: [hasMissions] },
	);

	const { contextSafe } = useGSAP({ scope: root });
	const pick = contextSafe((id: string) => {
		onSelect(id);
		if (window.matchMedia(MOTION_QUERIES.reduced).matches) return;
		gsap.fromTo(
			`[data-mission="${id}"] .hhp-mission-marker`,
			{ scale: 0.5 },
			{ scale: 1, duration: 0.45, ease: SPRING },
		);
	});

	const submit = (e: FormEvent) => {
		e.preventDefault();
		if (selectedId && !confirming) onConfirm();
	};

	const selected = missions?.find((m) => m.id === selectedId);

	return (
		<form ref={root} className="hhp-mission-panel" onSubmit={submit}>
			<span className="hhp-door hhp-door-l" aria-hidden="true" />
			<span className="hhp-door hhp-door-r" aria-hidden="true" />
			<span className="hhp-unlock-flash" aria-hidden="true" />

			<div className="hhp-terminal-bar" aria-hidden="true">
				<span>MISSION ARCHIVE</span>
				<span className="hhp-terminal-state is-verified">DECLASSIFIED</span>
			</div>

			{PORTAL_MODE === "demo" && (
				<p className="hhp-demo-notice">
					<span className="hhp-demo-badge">Demonstration content</span>
					These are placeholder missions for testing — not official HackHive 2026 problem
					statements.
				</p>
			)}

			{!ready && missionsFailed ? (
				<div className="hhp-loading" role="alert">
					<p>Couldn&apos;t retrieve the missions. Check your connection and try again.</p>
					<button type="button" className="hhp-btn hhp-btn-ghost" onClick={onRetryMissions}>
						Try again
					</button>
				</div>
			) : !ready ? (
				<p className="hhp-loading" role="status">
					Retrieving missions…
				</p>
			) : missions.length === 0 ? (
				<p className="hhp-loading" role="status">
					The organizers are publishing the missions. They&apos;ll appear here shortly.
				</p>
			) : (
				<fieldset className="hhp-mission-list">
					<legend className="hhp-field-label">Available missions · choose one</legend>
					{missions.map((m) => {
						const isSelected = m.id === selectedId;
						return (
							<label
								key={m.id}
								className={`hhp-mission${isSelected ? " is-selected" : ""}`}
								data-mission={m.id}>
								<input
									type="radio"
									name="mission"
									value={m.id}
									checked={isSelected}
									onChange={() => pick(m.id)}
									className="hhp-sr-only"
								/>
								<span className="hhp-mission-marker" aria-hidden="true" />
								<span className="hhp-mission-text">
									<span className="hhp-spec-code">{m.code}</span>
									<span className="hhp-mission-title">{m.title}</span>
									<span className="hhp-mission-summary">{m.summary}</span>
								</span>
							</label>
						);
					})}
				</fieldset>
			)}

			<div className="hhp-mission-confirm">
				<div>
					<p className="hhp-mission-choice" aria-live="polite">
						{selected ? (
							<>
								Selected: <strong>{selected.title}</strong>
							</>
						) : (
							"No mission selected yet."
						)}
					</p>
					{PORTAL_MODE === "live" && (
						<p className="hhp-mission-final">
							Your team chooses once, for everyone. It can&apos;t be changed after you confirm.
						</p>
					)}
					{confirmError && (
						<p className="hhp-feedback is-invalid" role="alert">
							<span className="hhp-feedback-led" aria-hidden="true" />
							<span>{CONFIRM_ERRORS[confirmError]}</span>
						</p>
					)}
				</div>
				<button type="submit" className="hhp-btn hhp-btn-primary" disabled={!selected || confirming}>
					<span className="hhp-btn-led" aria-hidden="true" />
					<span>{confirming ? "Saving…" : "Confirm mission"}</span>
				</button>
			</div>
		</form>
	);
}
