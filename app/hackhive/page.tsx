"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
				<Link
					className="hackhive-back-button"
					href="/"
					aria-label="Back to home">
					<ArrowLeft aria-hidden="true" size={16} strokeWidth={2.2} />
					<span>Back</span>
				</Link>
				<section
					className={`register-hero hackhive-registration-hero${boardReady ? " is-ready" : ""}`}>
					<div className="cab-sponsor-logo" aria-label="CAB Sponsor logo">
						<strong className="cab-sponsor-label">Presented By</strong>
						<img src="/cab-logo.png" alt="CAB logo" />
					</div>
					<LcdBoard
						text={["HackHive", " Beyond Ordinary"]}
						align="center"
						className="lcd-board"
						onReady={() => setBoardReady(true)}
					/>
					<div className="title-sponsor">
						<strong className="title-sponsor-label">Title Sponsor</strong>
						<span>
							<img src="/Warana.png" alt="Title Sponsor" />
						</span>
					</div>
				</section>

				<div className="hackhive-register-cta-wrap">
					<a className="hackhive-register-cta" href="/hackhive/registration">
						<span className="hackhive-register-cta-led" aria-hidden="true" />
						<span>Initialize Registration</span>
						<span className="hackhive-register-cta-terminal" aria-hidden="true">
							↗
						</span>
					</a>
				</div>

				<section
					className="hackhive-event-info"
					aria-labelledby="hackhive-event-info-title">
					<div className="hackhive-section-kicker">// EVENT CORE :: 2026</div>
					<h2 id="hackhive-event-info-title">Build beyond the ordinary</h2>
					<p className="hackhive-event-intro">
						HackHive is a hackathon where students and makers come together to
						build innovative solutions. Whether you're a seasoned developer or a
						curious beginner, HackHive provides the perfect environment to
						learn, collaborate, and create.
					</p>
					<div className="hackhive-event-grid">
						<article className="hackhive-event-card">
							<span className="hackhive-event-card-index">01 / WHEN</span>
							<h3>27 October 2026</h3>
							<p>A special 6 hour hackathon experience on this day.</p>
						</article>
						<article className="hackhive-event-card">
							<span className="hackhive-event-card-index">02 / WHERE</span>
							<h3>
								Bakliwal Foundation College of Arts, Commerce, and Science,
								Vashi
							</h3>
							<p>
								The exact venue details will be shared with registered teams.
							</p>
						</article>
						<article className="hackhive-event-card">
							<span className="hackhive-event-card-index">03 / FORMAT</span>
							<h3>Play solo or upto 5 members</h3>
							<p>
								Play solo or form a team to build a strong and working prototype.
							</p>
						</article>
						<article className="hackhive-event-card">
							<span className="hackhive-event-card-index">04 / ACCESS</span>
							<h3>Open to innovators</h3>
							<p>
								Students and makers of every skill level are welcome. Curiosity
								is the only prerequisite.
							</p>
						</article>
						<article className="hackhive-event-card">
							<span className="hackhive-event-card-index">
								04 / Requirements
							</span>
							<h3>System requirements</h3>
							<p>
								Registered participants must bring their laptops and chargers
								and we'll make sure the necessary infrastructure is available.
							</p>
						</article>
					</div>
				</section>

				<section
					className="hackhive-ewaste-section"
					aria-labelledby="hackhive-ewaste-title">
					<span className="hackhive-section-kicker">
						// COMMUNITY CORE :: RESPONSIBILITY
					</span>
					<h2 id="hackhive-ewaste-title">E-Waste Management</h2>
					<p>
						Students can bring any type of E-Waste with them and submit it at
						the college. Let&apos;s dispose of electronic waste responsibly and
						keep our community cleaner.
					</p>
				</section>

				<div className="hackhive-register-cta-wrap hackhive-register-cta-wrap-after">
					<a className="hackhive-register-cta" href="/hackhive/registration">
						<span className="hackhive-register-cta-led" aria-hidden="true" />
						<span>Initialize Registration</span>
						<span className="hackhive-register-cta-terminal" aria-hidden="true">
							↗
						</span>
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
								<span>Computer Association of Bakliwal Foundation College, Vashi</span>
							</div>
						</div>
						<div className="hackhive-footer-socials">
							<span className="hackhive-footer-label">Transmit</span>
							<a
								href="https://instagram.com/zen_pravartak"
								target="_blank"
								rel="noreferrer">
								Follow Developer on Instagram
							</a>
							<a
								href="https://instagram.com/bakliwal_.computerassociation"
								target="_blank"
								rel="noreferrer">
								Follow Computer Association on Instagram
							</a>
						</div>
						<div className="hackhive-footer-admin">
							<span className="hackhive-footer-label">Admin Contact</span>
							<span>
								Pratik Shinde:{" "}
								<a href="tel:+918010418829">+91 8010418829</a>
							</span>
							<span>
								Amandeep Chhatai:{" "}
								<a href="tel:+919082013733">+91 9082013733</a>
							</span>
							<span>
								Pravartak Ambhore:{" "}
								<a href="tel:+919136672230">+91 9136672230</a>
							</span>
						</div>
						<div className="other-sponsors">
							<span className="sponsor-chip">
								<img src="/Cosmic Grid Logo.png" alt="Sponsor 1" />
							</span>
							<span className="sponsor-chip">
								<img src="/Wheels Navi Mumbai.png" alt="Sponsor 3" />
							</span>
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
