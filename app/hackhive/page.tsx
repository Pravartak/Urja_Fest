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
						text={["HackHive", " Beyond Ordinary"]}
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
						HackHive is a hackathon where students and makers come together to build innovative solutions. Whether you're a seasoned developer or a curious beginner, HackHive provides the perfect environment to learn, collaborate, and create.
					</p>
					<div className="hackhive-event-grid">
						<article className="hackhive-event-card">
							<span className="hackhive-event-card-index">01 / WHEN</span>
							<h3>27 October 2026</h3>
							<p>A special 6 hour hackathon experience on this day.</p>
						</article>
						<article className="hackhive-event-card">
							<span className="hackhive-event-card-index">02 / WHERE</span>
							<h3>Bakliwal Foundation College of Arts, Commerce, and Science, Vashi</h3>
							<p>The exact venue details will be shared with registered teams.</p>
						</article>
						<article className="hackhive-event-card">
							<span className="hackhive-event-card-index">03 / FORMAT</span>
							<h3>Play solo or upto 5 members</h3>
							<p>Bring your strongest idea, form a team, and turn a bold concept into a working prototype.</p>
						</article>
						<article className="hackhive-event-card">
							<span className="hackhive-event-card-index">04 / ACCESS</span>
							<h3>Open to innovators</h3>
							<p>Students and makers of every skill level are welcome. Curiosity is the only prerequisite.</p>
						</article>
						<article className="hackhive-event-card">
							<span className="hackhive-event-card-index">04 / Requirements</span>
							<h3>System requirements</h3>
							<p>Registered participants must bring their laptops and chargers and we'll make sure the necessary infrastructure is available.</p>
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
								<span>Computer Association Technical Department</span>
							</div>
							<div>
								<span className="hackhive-footer-label">Organized by</span>
								<span>Computer Association of Bakliwal</span>
							</div>
						</div>
						<div className="hackhive-footer-socials">
							<span className="hackhive-footer-label">Transmit</span>
							<a href="https://instagram.com/zen_pravartak" target="_blank" rel="noreferrer">Follow Developer on Instagram</a>
							<a href="https://instagram.com/bakliwal_.computerassociation" target="_blank" rel="noreferrer">Follow Computer Association on Instagram</a>
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
