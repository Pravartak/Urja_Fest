"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type QrScanner from "qr-scanner";
import type { Team } from "../_data/portalConfig";
import {
	FOOD_SLOTS,
	claimFood,
	isStallQr,
	itemsLeft,
	toStallCode,
	watchClaims,
	type FoodClaim,
	type FoodItem,
} from "../_lib/foodRedemption";
import { useSectionReveal } from "../_lib/useSectionReveal";

interface Props {
	/** The team's 4-digit access code: its claims are stored under it. */
	accessCode: string;
	team: Team;
}

type Counts = Record<FoodItem, number>;

type Tone = "idle" | "invalid";

interface Served {
	lines: { name: string; counts: Counts }[];
	at: Date;
}

const ITEMS: FoodItem[] = ["biryani", "drink"];
const NONE: Counts = { biryani: 0, drink: 0 };
const DRINKS_EACH = FOOD_SLOTS.drink.length;

const formatTime = (date: Date) =>
	date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

const listNames = (names: string[]) =>
	names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

/** "2 × Biryani", "1 × Mojito": "" for none. */
const amount = (item: FoodItem, n: number) =>
	!n ? "" : item === "biryani" ? `${n} × Biryani` : `${n} × ${n === 1 ? "Mojito" : "Mojitos"}`;

/** "2 Biryani + 3 Mojitos", for the scan button. */
const summary = (counts: Counts) =>
	[counts.biryani && `${counts.biryani} Biryani`, counts.drink && `${counts.drink} ${counts.drink === 1 ? "Mojito" : "Mojitos"}`]
		.filter(Boolean)
		.join(" + ");

/** "Biryani + 2 Mojitos", for one member on the serve screen. */
const memberLine = (counts: Counts) =>
	[counts.biryani && "Biryani", counts.drink && (counts.drink === 1 ? "1 Mojito" : `${counts.drink} Mojitos`)]
		.filter(Boolean)
		.join(" + ");

/**
 * qr-scanner reports every failure as "Camera not found.", so ask the browser
 * directly what went wrong and say how to fix it.
 */
async function cameraProblem(): Promise<string> {
	const fallback = "or type the code printed under the stall QR.";
	if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
		return `The camera only works on the secure https:// portal, not an http:// link. Open the portal's https link, ${fallback}`;
	}
	try {
		const stream = await navigator.mediaDevices.getUserMedia({ video: true });
		stream.getTracks().forEach((track) => track.stop());
	} catch (error) {
		const name = (error as { name?: string }).name;
		if (name === "NotAllowedError" || name === "SecurityError") {
			return `Camera access is blocked for this site. Tap the icon next to the address bar, allow Camera, then try again, ${fallback}`;
		}
		if (name === "NotFoundError" || name === "OverconstrainedError") {
			return `No camera found on this device. Scan from a phone, ${fallback}`;
		}
		if (name === "NotReadableError" || name === "AbortError") {
			return `The camera is in use by another app. Close it and try again, ${fallback}`;
		}
	}
	return `Couldn't open the camera. Try again, ${fallback}`;
}

/**
 * Each member gets one biryani and two drinks (the drink is a Mojito), whenever
 * they like: pick what each member is having now, then scan the QR at the food
 * stall. Once everyone has had everything the scanner is gone for good, on
 * every device the team uses.
 */
export default function FoodRedemption({ accessCode, team }: Props) {
	const root = useRef<HTMLElement>(null);
	const video = useRef<HTMLVideoElement>(null);
	const scanner = useRef<QrScanner | null>(null);
	// Guards against the scanner firing again while a claim is in flight.
	const busy = useRef(false);
	useSectionReveal(root);

	/** undefined while loading. */
	const [claims, setClaims] = useState<FoodClaim[] | undefined>(undefined);
	const [watchFailed, setWatchFailed] = useState(false);
	const [watchAttempt, setWatchAttempt] = useState(0);
	/** What each member (by id) is having in the next scan. */
	const [order, setOrder] = useState<Record<string, Counts>>({});
	const [scanning, setScanning] = useState(false);
	const [claiming, setClaiming] = useState(false);
	const [typed, setTyped] = useState("");
	const [message, setMessage] = useState<{ tone: Tone; text: string } | null>(null);
	const [served, setServed] = useState<Served | null>(null);

	useEffect(() => {
		setWatchFailed(false);
		return watchClaims(accessCode, setClaims, (error) => {
			console.error("Food status unavailable:", error);
			setWatchFailed(true);
		});
	}, [accessCode, watchAttempt]);

	const left = (member: string, item: FoodItem) => (claims ? itemsLeft(claims, member, item) : 0);
	const allDone = !!claims && team.members.every((m) => ITEMS.every((i) => left(m.id, i) === 0));

	// Claimed elsewhere (another tab or phone): never ask for more than is left.
	useEffect(() => {
		if (!claims) return;
		setOrder((current) => {
			const next: Record<string, Counts> = {};
			for (const [id, counts] of Object.entries(current)) {
				next[id] = {
					biryani: Math.min(counts.biryani, itemsLeft(claims, id, "biryani")),
					drink: Math.min(counts.drink, itemsLeft(claims, id, "drink")),
				};
			}
			return next;
		});
	}, [claims]);

	useEffect(() => {
		if (allDone) setScanning(false);
	}, [allDone]);

	const countsFor = (id: string) => order[id] ?? NONE;
	const setCount = (id: string, item: FoodItem, n: number) =>
		setOrder((current) => ({ ...current, [id]: { ...(current[id] ?? NONE), [item]: n } }));

	const orders = team.members
		.map((member) => ({ member, counts: countsFor(member.id) }))
		.filter(({ counts }) => counts.biryani + counts.drink > 0);
	const totals: Counts = {
		biryani: orders.reduce((sum, o) => sum + o.counts.biryani, 0),
		drink: orders.reduce((sum, o) => sum + o.counts.drink, 0),
	};
	const nothingPicked = orders.length === 0;

	// Everything picked was just claimed on another phone: nothing left to scan for.
	useEffect(() => {
		if (!scanning || !nothingPicked || busy.current) return;
		setScanning(false);
		setMessage({ tone: "idle", text: "Those picks were just claimed on another phone, so there's nothing left to scan for." });
	}, [scanning, nothingPicked]);

	const claim = async (stallCode: string) => {
		if (busy.current || !orders.length) return;
		busy.current = true;
		setClaiming(true);
		setScanning(false);
		const result = await claimFood(accessCode, team.id, orders, stallCode);
		busy.current = false;
		setClaiming(false);
		if (!("reason" in result)) {
			setServed({ lines: orders.map(({ member, counts }) => ({ name: member.name, counts })), at: result.claimedAt });
			setOrder({});
			setTyped("");
			setMessage(null);
		} else if (result.reason === "used up") {
			setMessage({
				tone: "invalid",
				text: `${listNames(result.names)} already had some of that. Nothing was claimed: check the picks and scan again.`,
			});
		} else if (result.reason === "rejected") {
			setMessage({
				tone: "invalid",
				text: "That isn't this year's food stall code. Scan the QR at the HackHive food stall, or ask the volunteers there.",
			});
		} else {
			setMessage({ tone: "invalid", text: "Couldn't reach mission control. Check your connection and scan again." });
		}
	};

	const claimRef = useRef(claim);
	claimRef.current = claim;

	// The camera runs only while scanning, and always stops on the way out.
	useEffect(() => {
		if (!scanning) return;
		let cancelled = false;
		let lastWrong = "";
		import("qr-scanner")
			.then(({ default: Scanner }) => {
				if (cancelled || !video.current) return;
				const qr = new Scanner(
					video.current,
					({ data }) => {
						if (isStallQr(data)) {
							const stallCode = toStallCode(data);
							if (stallCode) return void claimRef.current(stallCode);
						}
						// The same wrong QR is read many times a second: say it once.
						if (data === lastWrong) return;
						lastWrong = data;
						setMessage({
							tone: "invalid",
							text: "That's not the food stall QR. Point the camera at the QR at the HackHive food stall.",
						});
					},
					{ preferredCamera: "environment", returnDetailedScanResult: true, maxScansPerSecond: 8 },
				);
				scanner.current = qr;
				return qr.start();
			})
			.then(() => {
				if (!cancelled) setMessage({ tone: "idle", text: "Camera on. Point it at the QR at the food stall." });
			})
			.catch(async (error) => {
				if (cancelled) return;
				// A warning, not an error: the card already tells the team what to do.
				console.warn("Couldn't start the camera:", error);
				scanner.current?.destroy();
				scanner.current = null;
				const text = await cameraProblem();
				if (cancelled) return;
				setScanning(false);
				setMessage({ tone: "invalid", text });
			});
		return () => {
			cancelled = true;
			scanner.current?.destroy();
			scanner.current = null;
		};
	}, [scanning]);

	const submitTyped = (e: FormEvent) => {
		e.preventDefault();
		const stallCode = toStallCode(typed);
		if (!stallCode) {
			setMessage({ tone: "invalid", text: "Type the code printed under the stall QR, like HACKHIVE-FOOD-AB12CD34." });
			return;
		}
		claim(stallCode);
	};

	const loading = claims === undefined && !watchFailed;
	const locked = loading || claiming;

	const memberStatus = (id: string) => {
		const biryani = left(id, "biryani") === 0 ? "Biryani ✓" : "Biryani —";
		return `${biryani} · Mojitos ${DRINKS_EACH - left(id, "drink")}/${DRINKS_EACH}`;
	};

	let body;
	if (served) {
		body = (
			<div className="hhp-food-serve" role="status" aria-live="assertive">
				<span className="hhp-spec-code">Show this to the stall volunteer</span>
				<p className="hhp-food-serve-count">
					{ITEMS.map((item) => {
						const n = served.lines.reduce((sum, line) => sum + line.counts[item], 0);
						return n ? <span key={item}>Serve {amount(item, n)}</span> : null;
					})}
				</p>
				<ul className="hhp-food-serve-names">
					{served.lines.map(({ name, counts }) => (
						<li key={name}>
							<span>{name}</span>
							<span className="hhp-food-serve-what">{memberLine(counts)}</span>
						</li>
					))}
				</ul>
				<p className="hhp-food-serve-meta">
					{team.name} · claimed {formatTime(served.at)}
				</p>
				<button type="button" className="hhp-btn hhp-btn-primary" onClick={() => setServed(null)}>
					<span className="hhp-btn-led" aria-hidden="true" />
					<span>Done</span>
				</button>
			</div>
		);
	} else if (watchFailed) {
		body = (
			<div className="hhp-food-error">
				<p className="hhp-feedback is-invalid">
					<span className="hhp-feedback-led" aria-hidden="true" />
					<span>Couldn&apos;t check your food status. Check your connection and retry.</span>
				</p>
				<button type="button" className="hhp-btn hhp-btn-ghost" onClick={() => setWatchAttempt((n) => n + 1)}>
					Retry
				</button>
			</div>
		);
	} else if (allDone) {
		body = (
			<p className="hhp-food-done">
				<span className="hhp-food-stamp" aria-hidden="true">
					✓
				</span>
				<span>
					Everyone in {team.name} has had their biryani and both Mojitos. The scanner is now switched off for
					your team.
				</span>
			</p>
		);
	} else {
		body = (
			<>
				<fieldset className="hhp-food-members" disabled={locked}>
					<legend className="hhp-field-label">Who&apos;s having what now?</legend>
					<ul>
						{team.members.map((m) => {
							const counts = countsFor(m.id);
							const biryaniLeft = left(m.id, "biryani");
							const drinksLeft = left(m.id, "drink");
							const picked = counts.biryani + counts.drink > 0;
							const biryaniId = `hhp-food-${m.id}-biryani`;
							return (
								<li
									key={m.id}
									className={`hhp-food-member${picked ? " is-picked" : ""}${!loading && biryaniLeft + drinksLeft === 0 ? " is-used" : ""}`}
									data-member={m.id}>
									<div className="hhp-food-member-head">
										<span className="hhp-member-name">
											{m.name}
											{m.role === "Team Lead" && <span className="hhp-tag">Lead</span>}
										</span>
										<span className="hhp-food-member-status">{loading ? "Checking..." : memberStatus(m.id)}</span>
									</div>
									<div className="hhp-food-picks">
										<span className={`hhp-food-pick${biryaniLeft || loading ? "" : " is-used"}`}>
											<input
												id={biryaniId}
												type="checkbox"
												checked={counts.biryani > 0}
												onChange={(e) => setCount(m.id, "biryani", e.target.checked ? 1 : 0)}
												disabled={!biryaniLeft}
											/>
											<label htmlFor={biryaniId}>{biryaniLeft || loading ? "Biryani" : "Biryani had"}</label>
										</span>
										<span
											className={`hhp-food-stepper${drinksLeft || loading ? "" : " is-used"}`}
											role="group"
											aria-label={`Mojitos for ${m.name}`}>
											<span className="hhp-food-stepper-label">{drinksLeft || loading ? "Mojitos" : "Mojitos had"}</span>
											<button
												type="button"
												aria-label={`One Mojito fewer for ${m.name}`}
												onClick={() => setCount(m.id, "drink", counts.drink - 1)}
												disabled={counts.drink === 0}>
												−
											</button>
											<output aria-live="polite">{counts.drink}</output>
											<button
												type="button"
												aria-label={`One more Mojito for ${m.name}`}
												onClick={() => setCount(m.id, "drink", counts.drink + 1)}
												disabled={counts.drink >= drinksLeft}>
												+
											</button>
										</span>
									</div>
								</li>
							);
						})}
					</ul>
				</fieldset>

				<div className={`hhp-food-viewport${scanning ? " is-live" : ""}`} hidden={!scanning}>
					<video ref={video} muted playsInline aria-label="Camera view for scanning the food stall QR" />
					<span className="hhp-food-frame" aria-hidden="true" />
				</div>

				<div className="hhp-food-actions">
					{scanning ? (
						<button type="button" className="hhp-btn hhp-btn-ghost" onClick={() => setScanning(false)}>
							Stop camera
						</button>
					) : (
						<button
							type="button"
							className="hhp-btn hhp-btn-primary"
							onClick={() => {
								setMessage(null);
								setScanning(true);
							}}
							disabled={locked || nothingPicked}>
							<span className="hhp-btn-led" aria-hidden="true" />
							<span>
								{claiming
									? "Claiming..."
									: nothingPicked
										? "Pick what each member is having"
										: `Scan stall QR · ${summary(totals)}`}
							</span>
						</button>
					)}
				</div>

				<p className={`hhp-feedback is-${message?.tone ?? "idle"}`} aria-live="polite">
					<span className="hhp-feedback-led" aria-hidden="true" />
					<span>{message?.text ?? "Scanner off."}</span>
				</p>

				<form className="hhp-food-manual" onSubmit={submitTyped} noValidate>
					<label htmlFor="hhp-food-code" className="hhp-field-label">
						Camera not working? Type the code under the stall QR
					</label>
					<div className="hhp-food-manual-row">
						<div className="hhp-input-row">
							<span className="hhp-input-prompt" aria-hidden="true">
								&gt;
							</span>
							<input
								id="hhp-food-code"
								type="text"
								value={typed}
								onChange={(e) => setTyped(e.target.value)}
								disabled={locked}
								placeholder="HACKHIVE-FOOD-..."
								autoComplete="off"
								autoCapitalize="characters"
								autoCorrect="off"
								spellCheck={false}
								enterKeyHint="go"
								maxLength={48}
							/>
						</div>
						<button type="submit" className="hhp-btn hhp-btn-ghost" disabled={!typed.trim() || locked || nothingPicked}>
							Claim
						</button>
					</div>
				</form>
			</>
		);
	}

	return (
		<section ref={root} id="food" className="hhp-section hhp-food" aria-labelledby="hhp-food-title">
			<span className="hhp-rule" aria-hidden="true" />
			<div className="hhp-section-head">
				<span className="hhp-kicker">// FUEL STATION</span>
				<h2 id="hhp-food-title">Free food</h2>
				<p>
					Every member gets one box of biryani and two Mojitos, whenever they like. At the HackHive food stall,
					pick what each member is having, then scan the stall&apos;s QR code from here.
				</p>
			</div>

			<article className={`hhp-food-card${allDone ? " is-redeemed" : ""}`} data-reveal>
				{body}
			</article>
		</section>
	);
}
