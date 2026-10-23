"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PCBBackground from "@/app/components/PCBBackground";
import { PORTAL_MODE, type Team, type TeamMember } from "./_data/portalConfig";
import type { Mission } from "./_data/demoMissions";
import {
	submitMissionSelection,
	verifyAccessCode,
	watchMissions,
	watchReleaseStatus,
} from "./_lib/portalApi";
import {
	ATTEMPTS_KEY,
	MAX_ACCESS_ATTEMPTS,
	clearAttempts,
	readAttempts,
	recordFailure,
	reportLockout,
	watchLockout,
} from "./_lib/accessLock";
import { scrollToAndFocus } from "./_lib/gsap";
import HeroSection from "./_components/HeroSection";
import EventDetails from "./_components/EventDetails";
import SponsorShowcase from "./_components/SponsorShowcase";
import ParticipantAccess, { type AccessStatus } from "./_components/ParticipantAccess";
import TeamDashboard, { type MissionPhase } from "./_components/TeamDashboard";
import MissionSelection from "./_components/MissionSelection";
import FoodRedemption from "./_components/FoodRedemption";
import RoomAssignment from "./_components/RoomAssignment";
import "./portal.css";

type FocusTarget = "access" | "team" | "missions" | null;

const LIMITED = PORTAL_MODE === "live";

export default function ParticipantPortalPage() {
	// Access
	const [code, setCode] = useState("");
	const [status, setStatus] = useState<AccessStatus>("idle");
	const [verifying, setVerifying] = useState(false);
	// Bumped by every sign-out, clear and edit, so a lookup that lands after
	// one of them is ignored.
	const verifyRequest = useRef(0);
	const [attempt, setAttempt] = useState(0);
	const [team, setTeam] = useState<Team | null>(null);
	const [participant, setParticipant] = useState<TeamMember | null>(null);
	// The signed-in team's 4 digits (live only): its food redemption is stored under them.
	const [accessCode, setAccessCode] = useState<string | null>(null);
	// Lockout after too many wrong codes (live only).
	const [triesLeft, setTriesLeft] = useState<number | null>(LIMITED ? MAX_ACCESS_ATTEMPTS : null);
	const [lockId, setLockId] = useState<string | null>(null);
	const reporting = useRef(false);

	// Missions
	const [released, setReleased] = useState(false);
	const [releaseAt, setReleaseAt] = useState<Date | null>(null);
	const [releaseFailed, setReleaseFailed] = useState(false);
	const [releaseAttempt, setReleaseAttempt] = useState(0);
	const [missions, setMissions] = useState<Mission[] | null>(null);
	const [missionsFailed, setMissionsFailed] = useState(false);
	const [missionsAttempt, setMissionsAttempt] = useState(0);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [confirmed, setConfirmed] = useState<Mission | null>(null);

	const accessHeading = useRef<HTMLHeadingElement>(null);
	const teamHeading = useRef<HTMLHeadingElement>(null);
	const missionsHeading = useRef<HTMLHeadingElement>(null);
	const [focusTarget, setFocusTarget] = useState<FocusTarget>(null);

	// Pick up a count or lock from earlier visits, and from other tabs.
	useEffect(() => {
		if (!LIMITED) return;
		const sync = () => {
			const saved = readAttempts();
			setTriesLeft(MAX_ACCESS_ATTEMPTS - saved.tried.length);
			setLockId(saved.lockId);
		};
		sync();
		const onStorage = (e: StorageEvent) => {
			if (e.key === ATTEMPTS_KEY || e.key === null) sync();
		};
		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, []);

	// While locked, make sure the organizers know, and re-open the moment they unlock.
	useEffect(() => {
		if (!lockId) return;
		let retryTimer: number | undefined;
		const stop = watchLockout(
			lockId,
			() => {
				if (reporting.current) return;
				reporting.current = true;
				reportLockout(lockId, readAttempts().tried).catch((error) => {
					console.error("Could not report the lockout:", error);
					// Let the next server answer try again, but not in a tight loop.
					retryTimer = window.setTimeout(() => (reporting.current = false), 15000);
				});
			},
			() => {
				clearAttempts();
				setLockId(null);
				setTriesLeft(MAX_ACCESS_ATTEMPTS);
				setStatus("reopened");
			},
		);
		return () => {
			window.clearTimeout(retryTimer);
			reporting.current = false;
			stop();
		};
	}, [lockId]);

	// The organizers' release switch, pushed live: no reload needed.
	useEffect(() => {
		setReleaseFailed(false);
		return watchReleaseStatus(
			(s) => {
				setReleased(s.released);
				setReleaseAt(s.releaseAt);
			},
			(error) => {
				// A failed listener never recovers by itself, so offer a retry.
				console.error("Mission release status unavailable:", error);
				setReleaseFailed(true);
			},
		);
	}, [releaseAttempt]);

	// If the organizers lock the missions again, drop any choice made from them.
	useEffect(() => {
		if (released) return;
		setSelectedId(null);
		setConfirmed(null);
	}, [released]);

	// Missions are only requested once released, and dropped if locked again.
	const teamId = team?.id;
	useEffect(() => {
		if (!released || !teamId) return;
		setMissionsFailed(false);
		let refusedTimer: number | undefined;
		const stop = watchMissions(
			(list) => {
				setMissions(list);
				// A mission withdrawn after release can no longer be chosen.
				setSelectedId((id) => (list.some((m) => m.id === id) ? id : null));
			},
			(error) => {
				// Re-locking cuts the missions off a moment before the switch itself
				// reaches this page, which then unmounts this listener. Only treat a
				// refusal as a failure if the missions still count as released later.
				if ((error as { code?: string }).code === "permission-denied") {
					refusedTimer = window.setTimeout(() => {
						console.error("Missions unavailable:", error);
						setMissionsFailed(true);
					}, 5000);
					return;
				}
				console.error("Missions unavailable:", error);
				setMissionsFailed(true);
			},
		);
		return () => {
			window.clearTimeout(refusedTimer);
			stop();
			setMissions(null);
		};
	}, [released, teamId, missionsAttempt]);

	// Scroll + focus after the target section has rendered.
	useEffect(() => {
		if (!focusTarget) return;
		const el = {
			access: accessHeading.current,
			team: teamHeading.current,
			missions: missionsHeading.current,
		}[focusTarget];
		scrollToAndFocus(el);
		setFocusTarget(null);
	}, [focusTarget]);

	const resetMission = () => {
		setSelectedId(null);
		setConfirmed(null);
	};

	const handleVerify = async () => {
		if (verifying || lockId) return;
		const request = ++verifyRequest.current;
		setVerifying(true);
		const result = await verifyAccessCode(code);
		// A newer action already reset the button, maybe for a newer lookup.
		if (request !== verifyRequest.current) return;
		setVerifying(false);
		setAttempt((n) => n + 1);
		// Narrow on a property check: the project runs without strictNullChecks.
		if (!("reason" in result)) {
			if (LIMITED) {
				clearAttempts();
				setTriesLeft(MAX_ACCESS_ATTEMPTS);
			}
			const isNewTeam = result.team.id !== team?.id;
			setTeam(result.team);
			setParticipant(result.participant);
			setAccessCode(result.accessCode);
			setStatus("verified");
			if (isNewTeam) resetMission();
			setFocusTarget("team");
		} else {
			if (LIMITED && result.reason === "invalid") {
				const counted = recordFailure(code);
				setTriesLeft(MAX_ACCESS_ATTEMPTS - counted.tried.length);
				setLockId(counted.lockId);
			}
			setStatus(result.reason);
			setTeam(null);
			setParticipant(null);
			setAccessCode(null);
			resetMission();
		}
	};

	const handleClear = () => {
		verifyRequest.current++;
		setVerifying(false);
		setCode("");
		if (status !== "verified") setStatus("idle");
	};

	const handleSignOut = () => {
		verifyRequest.current++;
		setVerifying(false);
		setCode("");
		setStatus("idle");
		setTeam(null);
		setParticipant(null);
		setAccessCode(null);
		resetMission();
		setFocusTarget("access");
	};

	const handleConfirm = async () => {
		const mission = missions?.find((m) => m.id === selectedId);
		if (!team || !mission) return;
		const res = await submitMissionSelection(team.id, mission.id);
		if (res.ok) setConfirmed(mission);
	};

	// Demo only: in live mode only the organizers' switch can unlock missions.
	const releaseNow = useCallback(() => {
		if (PORTAL_MODE === "demo") setReleased(true);
	}, []);

	const missionPhase: MissionPhase = confirmed ? "confirmed" : released ? "open" : "locked";

	return (
		<PCBBackground className="page-wrap hackhive-page-background hhp-portal">
			<a className="hhp-skip" href="#access">
				Skip to participant access
			</a>

			<HeroSection onEnter={() => scrollToAndFocus(accessHeading.current)} />

			<main className="hhp-main">
				<EventDetails />
				<SponsorShowcase />

				<ParticipantAccess
					ref={accessHeading}
					code={code}
					status={status}
					verifying={verifying}
					attempt={attempt}
					teamName={team?.name}
					locked={!!lockId}
					triesLeft={triesLeft}
					onCodeChange={(v) => {
						verifyRequest.current++;
						setVerifying(false);
						setCode(v);
						if (status !== "idle" && status !== "verified") setStatus("idle");
					}}
					onVerify={handleVerify}
					onClear={handleClear}
				/>

				{team && (
					<>
						<TeamDashboard
							ref={teamHeading}
							team={team}
							participant={participant}
							missionPhase={missionPhase}
							missionTitle={confirmed?.title}
							onContinue={() => scrollToAndFocus(missionsHeading.current)}
							onSignOut={handleSignOut}
						/>
						<MissionSelection
							ref={missionsHeading}
							released={released}
							releaseAt={releaseAt}
							missions={missions}
							releaseFailed={releaseFailed}
							onRetryRelease={() => setReleaseAttempt((n) => n + 1)}
							missionsFailed={missionsFailed}
							onRetryMissions={() => setMissionsAttempt((n) => n + 1)}
							selectedId={selectedId}
							confirmed={confirmed}
							teamName={team.name}
							onSelect={setSelectedId}
							onConfirm={handleConfirm}
							onSimulateRelease={releaseNow}
							onReleaseDue={releaseNow}
							onReturn={() => scrollToAndFocus(teamHeading.current)}
						/>
						<RoomAssignment teamId={team.id} released={released} />
						{accessCode && (
							<FoodRedemption key={accessCode} accessCode={accessCode} team={team} />
						)}
					</>
				)}
			</main>

			<footer className="hhp-footer">
				<p className="hackhive-footer-copyright">
					<span>© 2026 HackHive</span>
					<span>Computer Association · BFC</span>
				</p>
				{PORTAL_MODE === "demo" && (
					<p className="hhp-footer-note">Participant portal prototype · demonstration data only</p>
				)}
			</footer>
		</PCBBackground>
	);
}
