"use client";

import { useRef } from "react";
import { EVENT, MAPS_URL } from "../_data/eventInfo";
import { useSectionReveal } from "../_lib/useSectionReveal";

const SPECS = [
	{ code: "02", label: "Duration", value: EVENT.duration },
	{ code: "03", label: "Prize pool", value: EVENT.prizePool },
	{ code: "04", label: "Team size", value: EVENT.teamSize },
	{ code: "05", label: "Registration fee", value: EVENT.fee },
];

export default function EventDetails() {
	const root = useRef<HTMLElement>(null);
	useSectionReveal(root);

	return (
		<section ref={root} className="hhp-section hhp-event" aria-labelledby="hhp-event-title">
			<span className="hhp-rule" aria-hidden="true" />
			<div className="hhp-section-head">
				<span className="hhp-kicker">// EVENT CORE :: SPEC SHEET</span>
				<h2 id="hhp-event-title">Event brief</h2>
			</div>

			<div className="hhp-event-board">
				<div className="hhp-event-date" data-reveal>
					<span className="hhp-spec-code">01 / Date</span>
					<p>
						<span className="hhp-event-day">27</span>
						<span className="hhp-event-month">October</span>
						<span className="hhp-event-year">2026</span>
					</p>
					<span className="hhp-event-name">{EVENT.name}</span>
				</div>

				<dl className="hhp-spec-list">
					{SPECS.map((s) => (
						<div className="hhp-spec" key={s.code} data-reveal>
							<dt>
								<span className="hhp-spec-code">{s.code}</span> {s.label}
							</dt>
							<dd>{s.value}</dd>
						</div>
					))}
					<div className="hhp-spec hhp-spec-venue" data-reveal>
						<dt>
							<span className="hhp-spec-code">06</span> Venue
						</dt>
						<dd>
							<address>{EVENT.venue}</address>
							<a className="hhp-link" href={MAPS_URL} target="_blank" rel="noreferrer">
								Open in Maps <span aria-hidden="true">↗</span>
							</a>
						</dd>
					</div>
				</dl>
			</div>
		</section>
	);
}
