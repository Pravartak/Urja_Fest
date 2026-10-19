"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Shared motion language — matches the spring/ease feel of the HackHive pages. */
export const EASE = "power3.out";
export const SPRING = "back.out(1.6)";

/** Media-query conditions for gsap.matchMedia(). */
export const MOTION_QUERIES = {
	motion: "(prefers-reduced-motion: no-preference)",
	reduced: "(prefers-reduced-motion: reduce)",
	small: "(max-width: 700px)",
};

export const prefersReducedMotion = () =>
	typeof window !== "undefined" &&
	window.matchMedia(MOTION_QUERIES.reduced).matches;

/** Smooth-scroll to an element and move focus there without a second jump. */
export function scrollToAndFocus(el: HTMLElement | null) {
	if (!el) return;
	el.scrollIntoView({
		behavior: prefersReducedMotion() ? "auto" : "smooth",
		block: "start",
	});
	el.focus({ preventScroll: true });
}

export { gsap, ScrollTrigger, useGSAP };
