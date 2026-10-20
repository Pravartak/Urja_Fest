"use client";

import { forwardRef, useEffect, useRef, type FormEvent } from "react";
import { PORTAL_FLAGS, PORTAL_MODE, DEMO_ACCESS_CODES } from "../_data/portalConfig";
import { MOTION_QUERIES, gsap, useGSAP } from "../_lib/gsap";
import { useSectionReveal } from "../_lib/useSectionReveal";

export type AccessStatus =
	| "idle"
	| "empty"
	| "format"
	| "invalid"
	| "unavailable"
	| "verified"
	/** The organizers unlocked this device after a lockout. */
	| "reopened";

const ERRORS: AccessStatus[] = ["empty", "format", "invalid", "unavailable"];

interface Props {
	code: string;
	status: AccessStatus;
	/** True while the code is being checked. */
	verifying: boolean;
	/** Increments on every submit; drives the scan animation. */
	attempt: number;
	teamName?: string;
	/** Too many wrong codes: the field stays disabled until the organizers unlock it. */
	locked: boolean;
	/** Wrong codes left before locking; null when there is no limit (demo). */
	triesLeft: number | null;
	onCodeChange: (value: string) => void;
	onVerify: () => void;
	onClear: () => void;
}

const LIVE = PORTAL_MODE === "live";

const MESSAGES: Record<AccessStatus, string> = {
	idle: "Awaiting access code.",
	empty: "Enter your access code before verifying.",
	format: "Access codes are 4 digits, like #4821. That didn't use up a try.",
	invalid: LIVE
		? "That code wasn't recognised. Check the 4-digit code from your organizers, like #4821, and try again."
		: "That code wasn't recognised. Check the code from your organizers and try again.",
	unavailable: "Couldn't reach mission control. Check your connection and try again.",
	verified: "Access granted.",
	reopened: "The organizers have unlocked this device. Enter your access code.",
};

const LOCKED_MESSAGE =
	"Too many wrong codes. This device is locked and the organizers have been notified. Ask them to unlock it.";

const demoCode = Object.keys(DEMO_ACCESS_CODES)[0];

const ParticipantAccess = forwardRef<HTMLHeadingElement, Props>(function ParticipantAccess(
	{ code, status, verifying, attempt, teamName, locked, triesLeft, onCodeChange, onVerify, onClear },
	headingRef,
) {
	const root = useRef<HTMLElement>(null);
	const terminal = useRef<HTMLDivElement>(null);
	const input = useRef<HTMLInputElement>(null);
	const lastAttempt = useRef(0);
	useSectionReveal(root);

	const { contextSafe } = useGSAP({ scope: root });

	// Feedback animations run alongside the (instant) mock check and never
	// block typing or resubmitting.
	useEffect(() => {
		const el = terminal.current;
		if (!el || attempt === 0 || attempt === lastAttempt.current) return;
		lastAttempt.current = attempt;
		if (window.matchMedia(MOTION_QUERIES.reduced).matches) return;

		contextSafe(() => {
			gsap.fromTo(
				".hhp-scan-beam",
				{ yPercent: -100, autoAlpha: 1 },
				{ yPercent: 900, opacity: 0.2, duration: 0.7, ease: "power1.inOut" },
			);
			gsap.fromTo(
				el,
				{ "--hhp-terminal-glow": 0 },
				{ "--hhp-terminal-glow": 1, duration: 0.22, yoyo: true, repeat: 1 },
			);
			if (locked || ERRORS.includes(status)) {
				gsap.to(".hhp-input-row", {
					keyframes: { x: [0, -7, 6, -4, 3, 0] },
					duration: 0.42,
					ease: "none",
				});
			} else if (status === "verified") {
				gsap.from(".hhp-feedback", { opacity: 0, y: 6, duration: 0.4, delay: 0.2 });
			}
		})();
	}, [attempt, status, locked, contextSafe]);

	const submit = (e: FormEvent) => {
		e.preventDefault();
		onVerify();
	};

	const clear = () => {
		onClear();
		input.current?.focus();
	};

	const isError = locked || ERRORS.includes(status);
	// Every failure shares the "invalid" styling.
	const tone = isError ? "invalid" : status === "reopened" ? "idle" : status;
	const message = locked
		? LOCKED_MESSAGE
		: status === "verified" && teamName
			? `Access granted — welcome, ${teamName}.`
			: status === "invalid" && triesLeft !== null
				? `That code wasn't recognised. ${triesLeft} ${triesLeft === 1 ? "try" : "tries"} left before this device is locked.`
				: MESSAGES[status];

	return (
		<section
			ref={root}
			id="access"
			className="hhp-section hhp-access"
			aria-labelledby="hhp-access-title">
			<span className="hhp-rule" aria-hidden="true" />
			<div className="hhp-section-head">
				<span className="hhp-kicker">// AUTH NODE :: 01</span>
				<h2 id="hhp-access-title" ref={headingRef} tabIndex={-1}>
					Identify yourself
				</h2>
				<p>
					{LIVE
						? "Enter your team's access code from the organizers to retrieve your team information."
						: "Enter the participant access code provided by your organizers to retrieve your team information."}
				</p>
			</div>

			<div
				ref={terminal}
				className="hhp-terminal"
				data-state={tone}
				data-reveal>
				<div className="hhp-terminal-bar" aria-hidden="true">
					<span>ACCESS TERMINAL</span>
					<span className={`hhp-terminal-state is-${tone}`}>
						{locked ? "LOCKED" : status === "verified" ? "UNLOCKED" : isError ? "DENIED" : "STANDBY"}
					</span>
				</div>
				<span className="hhp-scan-beam" aria-hidden="true" />

				<form className="hhp-access-form" onSubmit={submit} noValidate>
					<label htmlFor="hhp-code" className="hhp-field-label">
						{LIVE ? "Team access code" : "Participant access code"}
					</label>
					<div className="hhp-input-row">
						<span className="hhp-input-prompt" aria-hidden="true">
							&gt;
						</span>
						<input
							ref={input}
							id="hhp-code"
							name="accessCode"
							type="text"
							value={code}
							onChange={(e) => onCodeChange(e.target.value)}
							disabled={locked}
							placeholder={LIVE ? "#0000" : "ENTER ACCESS CODE"}
							autoComplete="off"
							inputMode={LIVE ? "numeric" : undefined}
							autoCapitalize="characters"
							autoCorrect="off"
							spellCheck={false}
							enterKeyHint="go"
							maxLength={LIVE ? 12 : 40}
							aria-invalid={isError || undefined}
							aria-describedby="hhp-code-feedback hhp-code-note"
						/>
					</div>

					<div className="hhp-access-actions">
						<button
							type="submit"
							className="hhp-btn hhp-btn-primary"
							aria-disabled={verifying || locked || undefined}>
							<span className="hhp-btn-led" aria-hidden="true" />
							<span>{verifying ? "Verifying..." : "Verify access"}</span>
						</button>
						<button
							type="button"
							className="hhp-btn hhp-btn-ghost"
							onClick={clear}
							disabled={!code || locked}>
							Clear
						</button>
					</div>

					<p
						id="hhp-code-feedback"
						className={`hhp-feedback is-${tone}`}
						role="status"
						aria-live="polite">
						<span className="hhp-feedback-led" aria-hidden="true" />
						{/* Re-keyed per attempt so a repeated message is announced again. */}
						<span key={attempt}>{message}</span>
					</p>
				</form>

				<p id="hhp-code-note" className="hhp-note">
					{LIVE
						? "Your team's 4-digit code, like #4821. The # is optional. Keep it within your team."
						: "Prototype: codes are checked against demonstration data in this browser — no server is contacted."}
					{PORTAL_FLAGS.showDemoCodeHint && (
						<>
							{" "}
							Demo code: <code>{demoCode}</code>
						</>
					)}
				</p>
			</div>
		</section>
	);
});

export default ParticipantAccess;
