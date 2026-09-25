"use client";

import { useState } from "react";
import PCBBackground from "../components/PCBBackground";
import LcdBoard from "../components/CircuitBoard";

export default function HackHive() {
	const [boardReady, setBoardReady] = useState(false);

	return (
		<>
			{!boardReady && (
				<div className="hackhive-loader" role="status" aria-live="polite">
					<div className="hackhive-loader-orbit" aria-hidden="true" />
					<p>Initializing HackHive...</p>
				</div>
			)}
			<PCBBackground className="page-wrap hackhive-page-background">
				<section
					className={`register-hero hackhive-registration-hero${boardReady ? " is-ready" : ""}`}>
					<div className="title-sponsor">
						<span>
							<strong className="title-sponsor-label">Sponsored By</strong>
							<img src="/galaxy-bg.png" alt="Title Sponsor" />
						</span>
					</div>
					<LcdBoard
						text="HackHive"
						align="center"
						className="lcd-board"
						onReady={() => setBoardReady(true)}
					/>
					<div className="other-sponsors">
						<span className="sponsor-chip">
							<img src="/galaxy-bg.png" alt="Sponsor 1" />
						</span>
						<span className="sponsor-chip">
							<img src="/galaxy-bg.png" alt="Sponsor 2" />
						</span>
						<span className="sponsor-chip">
							<img src="/galaxy-bg.png" alt="Sponsor 3" />
						</span>
					</div>
				</section>

				<section className="hackhive-event-info" aria-labelledby="hackhive-event-info-title">
					<div className="hackhive-section-kicker">// EVENT CORE :: 2026</div>
					<h2 id="hackhive-event-info-title">Build beyond the ordinary</h2>
					<p className="hackhive-event-intro">
						HackHive is a high-voltage gathering for builders, designers, and problem solvers.
						Plug into a weekend of rapid prototyping, sharp ideas, and real-world impact.
					</p>
					<div className="hackhive-event-grid">
						<article className="hackhive-event-card">
							<span className="hackhive-event-card-index">01 / WHEN</span>
							<h3>13–15 March 2026</h3>
							<p>Three days of workshops, builds, demos, and late-night collaboration.</p>
						</article>
						<article className="hackhive-event-card">
							<span className="hackhive-event-card-index">02 / WHERE</span>
							<h3>VIT-AP University</h3>
							<p>Amaravati, Andhra Pradesh. The exact venue details will be shared with registered teams.</p>
						</article>
						<article className="hackhive-event-card">
							<span className="hackhive-event-card-index">03 / FORMAT</span>
							<h3>Team-powered sprint</h3>
							<p>Bring your strongest idea, form a team, and turn a bold concept into a working prototype.</p>
						</article>
						<article className="hackhive-event-card">
							<span className="hackhive-event-card-index">04 / ACCESS</span>
							<h3>Open to innovators</h3>
							<p>Students and makers of every skill level are welcome. Curiosity is the only prerequisite.</p>
						</article>
					</div>
				</section>
			</PCBBackground>
		</>
	);
}
