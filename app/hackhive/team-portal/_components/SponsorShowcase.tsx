"use client";

import Image from "next/image";
import { useRef } from "react";
import { SPONSORS } from "../_data/eventInfo";
import { MOTION_QUERIES, SPRING, gsap, useGSAP } from "../_lib/gsap";
import { useSectionReveal } from "../_lib/useSectionReveal";

export default function SponsorShowcase() {
	const root = useRef<HTMLElement>(null);
	useSectionReveal(root);

	useGSAP(
		() => {
			const mm = gsap.matchMedia();
			mm.add(MOTION_QUERIES.motion, () => {
				const tl = gsap.timeline({
					scrollTrigger: { trigger: ".hhp-title-plate", start: "top 85%", once: true },
				});
				tl.from(".hhp-title-plate", {
					opacity: 0,
					scale: 0.92,
					duration: 0.8,
					ease: SPRING,
				})
					.from(".hhp-bus-line", { scaleY: 0, transformOrigin: "top", duration: 0.5 }, "-=0.2")
					.from(
						".hhp-partner",
						{ opacity: 0, y: 20, duration: 0.6, stagger: 0.12, ease: SPRING },
						"-=0.15",
					)
					.from(".hhp-presenter-row", { opacity: 0, y: 14, duration: 0.5 }, "-=0.2");

				// Controlled highlight sweep across the title sponsor plate.
				gsap.fromTo(
					".hhp-title-sweep",
					{ xPercent: -120, autoAlpha: 1 },
					{
						xPercent: 360,
						duration: 1.6,
						ease: "power2.inOut",
						repeat: -1,
						repeatDelay: 4.5,
						scrollTrigger: {
							trigger: ".hhp-title-plate",
							start: "top 85%",
							toggleActions: "play pause resume pause",
						},
					},
				);
			});
		},
		{ scope: root },
	);

	const { title, associated, presenter } = SPONSORS;

	return (
		<section ref={root} className="hhp-section hhp-sponsors" aria-labelledby="hhp-sponsors-title">
			<span className="hhp-rule" aria-hidden="true" />
			<div className="hhp-section-head">
				<span className="hhp-kicker">// POWER RAIL :: SPONSORS</span>
				<h2 id="hhp-sponsors-title">Powered by</h2>
			</div>

			<div className="hhp-sponsor-board">
				<figure className="hhp-title-plate">
					<figcaption className="hhp-chip-label">Title sponsor</figcaption>
					<div className="hhp-title-logo">
						<Image
							src={title.logo}
							alt={`${title.name} — ${title.tagline}`}
							width={title.width}
							height={title.height}
							sizes="(max-width: 700px) 78vw, 460px"
						/>
						<span className="hhp-title-sweep" aria-hidden="true" />
					</div>
					<span className="hhp-pin hhp-pin-a" aria-hidden="true" />
					<span className="hhp-pin hhp-pin-b" aria-hidden="true" />
				</figure>

				<span className="hhp-bus-line" aria-hidden="true" />

				<div className="hhp-partners">
					<span className="hhp-chip-label hhp-partners-label">Associated by</span>
					{associated.map((s) => (
						<figure className="hhp-partner" key={s.name}>
							<div className="hhp-partner-chip">
								<Image
									src={s.logo}
									alt={s.name}
									width={s.width}
									height={s.height}
									sizes="(max-width: 700px) 38vw, 168px"
								/>
							</div>
							<figcaption>{s.name}</figcaption>
						</figure>
					))}
				</div>

				<div className="hhp-presenter-row">
					<Image
						src={presenter.logo}
						alt=""
						width={presenter.width}
						height={presenter.height}
						sizes="52px"
					/>
					<p>
						<span className="hhp-chip-label">Presented by</span>
						<strong>Computer Association</strong>
						<span className="hhp-presenter-sub">Bakliwal Foundation College, Vashi</span>
					</p>
				</div>
			</div>
		</section>
	);
}
