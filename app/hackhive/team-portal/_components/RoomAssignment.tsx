"use client";

import { useEffect, useRef, useState } from "react";
import { roomHint } from "@/lib/hackhiveRooms";
import { watchRoom } from "../_lib/portalApi";
import { useSectionReveal } from "../_lib/useSectionReveal";

interface Props {
	teamId: string;
	/** Rooms are revealed together with the missions. */
	released: boolean;
}

export default function RoomAssignment({ teamId, released }: Props) {
	const root = useRef<HTMLElement>(null);
	useSectionReveal(root);

	// undefined: still looking. null: no room assigned yet.
	const [room, setRoom] = useState<string | null | undefined>(undefined);
	const [failed, setFailed] = useState(false);
	const [attempt, setAttempt] = useState(0);

	useEffect(() => {
		if (!released) return;
		setFailed(false);
		let refusedTimer: number | undefined;
		const stop = watchRoom(teamId, setRoom, (error) => {
			// As with the missions: re-locking cuts the room off a moment before the
			// switch reaches this page, so a refusal only counts if it lasts.
			if ((error as { code?: string }).code === "permission-denied") {
				refusedTimer = window.setTimeout(() => {
					console.error("Room unavailable:", error);
					setFailed(true);
				}, 5000);
				return;
			}
			console.error("Room unavailable:", error);
			setFailed(true);
		});
		return () => {
			window.clearTimeout(refusedTimer);
			stop();
			setRoom(undefined);
		};
	}, [teamId, released, attempt]);

	let body;
	if (!released) {
		body = (
			<p className="hhp-room-note">
				<span className="hhp-room-glyph" aria-hidden="true">
					⌁
				</span>
				Your room is revealed when the missions are released.
			</p>
		);
	} else if (failed) {
		body = (
			<div className="hhp-food-error">
				<p className="hhp-feedback is-invalid">
					<span className="hhp-feedback-led" aria-hidden="true" />
					<span>Couldn&apos;t find your room. Check your connection and retry.</span>
				</p>
				<button type="button" className="hhp-btn hhp-btn-ghost" onClick={() => setAttempt((n) => n + 1)}>
					Retry
				</button>
			</div>
		);
	} else if (room === undefined) {
		body = <p className="hhp-room-note">Finding your room...</p>;
	} else if (room === null) {
		body = (
			<p className="hhp-room-note">
				Your room hasn&apos;t been assigned yet. Please ask an organizer at the help desk.
			</p>
		);
	} else {
		body = (
			<div className="hhp-room-found" role="status">
				<span className="hhp-spec-code">Your room</span>
				<p className="hhp-room-name">{room}</p>
				<p className="hhp-room-hint">
					<span className="hhp-room-glyph" aria-hidden="true">
						➜
					</span>
					{roomHint(room)}
				</p>
			</div>
		);
	}

	return (
		<section ref={root} id="room" className="hhp-section hhp-room" aria-labelledby="hhp-room-title">
			<span className="hhp-rule" aria-hidden="true" />
			<div className="hhp-section-head">
				<span className="hhp-kicker">// BASE STATION</span>
				<h2 id="hhp-room-title">Your room</h2>
				<p>Where your team works during the hackathon.</p>
			</div>

			<article className={`hhp-room-card${room ? " is-found" : ""}`} data-reveal>
				{body}
			</article>
		</section>
	);
}
