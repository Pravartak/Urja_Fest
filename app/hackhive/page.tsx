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

				<div className="hackhive-register-cta-wrap">
					<a className="hackhive-register-cta" href="/hackhive/registration">
						<span className="hackhive-register-cta-led" aria-hidden="true" />
						<span>Initialize Registration</span>
						<span className="hackhive-register-cta-terminal" aria-hidden="true">↗</span>
					</a>
				</div>

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

				<div className="hackhive-register-cta-wrap hackhive-register-cta-wrap-after">
					<a className="hackhive-register-cta" href="/hackhive/registration">
						<span className="hackhive-register-cta-led" aria-hidden="true" />
						<span>Initialize Registration</span>
						<span className="hackhive-register-cta-terminal" aria-hidden="true">↗</span>
					</a>
				</div>

				<footer className="hackhive-footer">
					<div className="hackhive-footer-line" aria-hidden="true" />
					<div className="hackhive-footer-grid">
						<div className="hackhive-footer-brand">
							<span className="hackhive-footer-kicker">// SIGNAL ONLINE</span>
							<strong>HackHive</strong>
							<p>Build beyond the ordinary.</p>
						</div>
						<div className="hackhive-footer-meta">
							<div>
								<span className="hackhive-footer-label">Developed by</span>
								<span>HackHive Tech Team</span>
							</div>
							<div>
								<span className="hackhive-footer-label">Organized by</span>
								<span>Urja Fest Organizers</span>
							</div>
						</div>
						<div className="hackhive-footer-socials">
							<span className="hackhive-footer-label">Transmit</span>
							<a href="https://instagram.com/hackhive" target="_blank" rel="noreferrer">Instagram @hackhive</a>
							<a href="https://instagram.com/urjafest" target="_blank" rel="noreferrer">Instagram @urjafest</a>
						</div>
					</div>
					<div className="hackhive-footer-copyright">
						<span aria-hidden="true">[ SYS.OK ]</span>
						<span>© 2026 HackHive // All systems reserved</span>
						<span aria-hidden="true">[ END OF LINE ]</span>
					</div>
				</footer>
			</PCBBackground>
		</>
	);
}
