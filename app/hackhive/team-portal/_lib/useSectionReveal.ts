"use client";

import type { RefObject } from "react";
import { EASE, MOTION_QUERIES, gsap, useGSAP } from "./gsap";

/**
 * Scroll-triggered reveal for a section: its heading block, then any
 * `[data-reveal]` children with a restrained stagger, plus a cyan rule that
 * lights up along the section's top edge. Runs once; skipped for reduced motion.
 */
export function useSectionReveal(
	scope: RefObject<HTMLElement | null>,
	extra?: (tl: gsap.core.Timeline) => void,
) {
	useGSAP(
		() => {
			const mm = gsap.matchMedia();
			mm.add(MOTION_QUERIES.motion, () => {
				const el = scope.current;
				if (!el) return;
				const tl = gsap.timeline({
					defaults: { ease: EASE },
					scrollTrigger: { trigger: el, start: "top 82%", once: true },
				});
				// Skip empty groups: GSAP warns about tweens with no targets.
				const reveal = (sel: string, vars: gsap.TweenVars, at: number) => {
					const targets = el.querySelectorAll(sel);
					if (targets.length) tl.from(targets, vars, at);
				};
				reveal(
					".hhp-rule",
					{ scaleX: 0, transformOrigin: "left center", duration: 0.9, ease: "power2.inOut" },
					0,
				);
				reveal(".hhp-section-head > *", { opacity: 0, y: 18, duration: 0.6, stagger: 0.08 }, 0.1);
				reveal("[data-reveal]", { opacity: 0, y: 22, duration: 0.6, stagger: 0.07 }, 0.3);
				extra?.(tl);
			});
		},
		{ scope },
	);
}
