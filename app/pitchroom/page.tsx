"use client";

import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const cardStyle: React.CSSProperties = {
	background: "rgba(10, 20, 45, 0.55)",
	border: "1px solid rgba(94, 234, 212, 0.25)",
	borderRadius: "18px",
	padding: "32px",
	marginBottom: "28px",
	backdropFilter: "blur(6px)",
	boxShadow: "0 0 30px rgba(56, 189, 248, 0.08)",
};

const sectionTitleStyle: React.CSSProperties = {
	fontSize: "2.2rem",
	fontWeight: 900,
	marginBottom: "18px",
	letterSpacing: "0.5px",
	textTransform: "uppercase",
	backgroundImage: "linear-gradient(180deg, #5eead4 0%, #38bdf8 100%)",
	WebkitBackgroundClip: "text",
	backgroundClip: "text",
	color: "transparent",
	WebkitTextFillColor: "transparent",
	textShadow: "0 4px 18px rgba(56, 189, 248, 0.25)",
};

const bodyTextStyle: React.CSSProperties = {
	color: "#a7f3e0",
	fontSize: "0.98rem",
	lineHeight: 1.7,
	marginBottom: "14px",
};

const listStyle: React.CSSProperties = {
	color: "#a7f3e0",
	fontSize: "0.98rem",
	lineHeight: 1.8,
	paddingLeft: "20px",
	margin: 0,
};

export default function PitchRoomLanding() {
	return (
		<>
			<div className="cosmic-bg" />
			<div className="cosmic-vignette" />
			<Navbar />

			<div className="page-wrap">
				<section className="register-hero">
					<img
						src="/pitchroom-logo.png"
						alt="The Pitch Room — Bakliwal Foundation College"
						style={{
							width: "min(70vw, 260px)",
							height: "auto",
							display: "block",
							margin: "0 auto 20px",
						}}
					/>
					<h1
						className="hero-title"
						data-text="The Pitch Room"
						style={{
							fontWeight: 900,
							letterSpacing: "0.5px",
							backgroundImage:
								"linear-gradient(180deg, #5eead4 0%, #38bdf8 100%)",
							WebkitBackgroundClip: "text",
							backgroundClip: "text",
							color: "transparent",
							WebkitTextFillColor: "transparent",
							textShadow: "0 6px 24px rgba(56, 189, 248, 0.3)",
						}}>
						The Pitch Room
					</h1>
					<p
						style={{
							color: "#7ec9c2",
							marginTop: "2px",
							marginBottom: "16px",
							fontSize: "1.1rem",
							fontWeight: 700,
							letterSpacing: "3px",
							textTransform: "uppercase",
						}}>
						2026-2027
					</p>
					<p
						className="hero-tagline"
						style={{
							background: "rgba(10, 20, 45, 0.6)",
							border: "1px solid rgba(94, 234, 212, 0.3)",
							color: "#e6fff9",
							display: "inline-block",
							padding: "10px 24px",
							borderRadius: "999px",
						}}>
						Pitch Beyond Possibilities
					</p>
					<p
						style={{
							color: "#7ec9c2",
							marginTop: "8px",
							fontSize: "0.95rem",
							letterSpacing: "1px",
						}}>
						Business Idea &amp; Startup Pitching Event · Bakliwal Foundation
						College
					</p>
				</section>

				<section className="section">
					<div style={{ maxWidth: "820px", margin: "0 auto" }}>
						{/* About */}
						<div style={cardStyle}>
							<h2 style={sectionTitleStyle}>About The Pitch Room</h2>
							<p style={bodyTextStyle}>
								The Pitch Room is an exciting business exhibition and startup
								pitching competition that provides students with a platform to
								transform innovative ideas into potential business
								opportunities.
							</p>
							<p style={bodyTextStyle}>
								Participants begin by showcasing their products, prototypes,
								and business concepts through creatively designed exhibition
								stalls, explaining their unique features, USP, target market,
								and the real-world problem their idea solves.
							</p>
							<p style={bodyTextStyle}>
								In the final pitching round, teams present their complete
								business model to a panel of judges, covering innovation,
								market potential, financial viability, scalability, and social
								impact. Judges may challenge participants with questions and
								real-world scenarios to test their problem-solving abilities.
							</p>
							<p style={{ ...bodyTextStyle, marginBottom: 0 }}>
								The event encourages students to think creatively, take
								entrepreneurial initiatives, and build skills in business
								planning, communication, teamwork, leadership, and
								presentation — inspiring young entrepreneurs to turn their
								ideas into meaningful, impactful ventures.
							</p>
						</div>

						{/* Event details */}
						<div style={cardStyle}>
							<h2 style={sectionTitleStyle}>Event Details</h2>
							<div
								style={{
									display: "grid",
									gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
									gap: "18px",
								}}>
								<div>
									<p
										style={{
											color: "#7ec9c2",
											fontSize: "0.75rem",
											letterSpacing: "1.5px",
											marginBottom: "6px",
										}}>
										DATE
									</p>
									<p style={{ color: "#e6fff9", fontSize: "1.05rem" }}>
										27 October 2026
									</p>
								</div>
								<div>
									<p
										style={{
											color: "#7ec9c2",
											fontSize: "0.75rem",
											letterSpacing: "1.5px",
											marginBottom: "6px",
										}}>
										TEAM SIZE
									</p>
									<p style={{ color: "#e6fff9", fontSize: "1.05rem" }}>
										3 – 5 members
									</p>
								</div>
								<div>
									<p
										style={{
											color: "#7ec9c2",
											fontSize: "0.75rem",
											letterSpacing: "1.5px",
											marginBottom: "6px",
										}}>
										ELIGIBILITY
									</p>
									<p style={{ color: "#e6fff9", fontSize: "1.05rem" }}>
										UG &amp; PG students, any college
									</p>
								</div>
							</div>
						</div>

						{/* General Guidelines */}
						<div style={cardStyle}>
							<h2 style={sectionTitleStyle}>General Guidelines</h2>
							<p style={bodyTextStyle}>
								<strong style={{ color: "#e6fff9" }}>Eligibility:</strong>{" "}
								Open to all undergraduate and postgraduate students from any
								recognized college interested in entrepreneurship, innovation,
								and presenting business ideas.
							</p>
							<p style={bodyTextStyle}>
								<strong style={{ color: "#e6fff9" }}>
									Team Composition:
								</strong>{" "}
								Teams of minimum 3 and maximum 5 members, working together to
								develop, plan, and present their business concept.
							</p>
							<p style={bodyTextStyle}>
								<strong style={{ color: "#e6fff9" }}>
									Business Idea:
								</strong>{" "}
								An original, innovative idea from any sector (technology,
								sustainability, healthcare, retail, education, or others),
								solving a real-world problem with potential for growth.
							</p>
							<p style={{ ...bodyTextStyle, marginBottom: 0 }}>
								<strong style={{ color: "#e6fff9" }}>
									Model Creation:
								</strong>{" "}
								A physical or digital prototype/model that clearly represents
								the business concept for judges and audiences.
							</p>
						</div>

						{/* Exhibition Rules */}
						<div style={cardStyle}>
							<h2 style={sectionTitleStyle}>Exhibition Rules</h2>
							<p style={bodyTextStyle}>
								Each team gets a stall/booth to showcase their idea, prototype,
								and creative elements — attractive, organized, and
								professional. Setup must be completed at least 1 hour before
								the event. The exhibit should include:
							</p>
							<ul style={listStyle}>
								<li>
									<strong style={{ color: "#e6fff9" }}>
										Business Model Canvas / Idea Poster
									</strong>
									: problem, target customers, solution, revenue model, future
									scope
								</li>
								<li>
									<strong style={{ color: "#e6fff9" }}>
										Working Prototype
									</strong>
									: functional prototype or demo, if applicable
								</li>
								<li>
									<strong style={{ color: "#e6fff9" }}>Pitch Deck</strong>:
									optional for exhibition, mandatory for the pitching round
								</li>
								<li>
									<strong style={{ color: "#e6fff9" }}>
										Marketing Materials
									</strong>
									: brochures, posters, visiting cards, samples, QR codes
								</li>
								<li>
									<strong style={{ color: "#e6fff9" }}>
										Interactive Elements
									</strong>
									: live demos, videos, surveys, customer interactions, or
									sample products
								</li>
							</ul>
						</div>

						{/* Pitching Rounds */}
						<div style={cardStyle}>
							<h2 style={sectionTitleStyle}>Pitching Rounds</h2>
							<p style={bodyTextStyle}>
								<strong style={{ color: "#e6fff9" }}>
									Round 1 — Product Explanation (5 minutes):
								</strong>{" "}
								Introduce the business idea, product/service, USP, target
								customers, and key value.
							</p>
							<p style={bodyTextStyle}>
								<strong style={{ color: "#e6fff9" }}>
									Round 2 — Problem Solving (5 minutes):
								</strong>{" "}
								Explain the real-world problem, proposed solution, and its
								practicality and impact. Judges may ask questions or give
								scenarios.
							</p>
							<p style={bodyTextStyle}>
								<strong style={{ color: "#e6fff9" }}>
									Round 3 — Final Pitch (5 + 5 minutes Q&amp;A):
								</strong>{" "}
								Present the complete business pitch in 5 minutes, followed by a
								5-minute Q&amp;A. Teams may use slides, videos, or live demos.
							</p>
							<p
								style={{
									color: "#7ec9c2",
									fontSize: "0.8rem",
									letterSpacing: "1.5px",
									marginTop: "20px",
									marginBottom: "10px",
								}}>
								SCORING CRITERIA
							</p>
							<ul style={{ ...listStyle }}>
								<li>Innovation &amp; Feasibility — 20%</li>
								<li>Market Potential — 20%</li>
								<li>Financial Viability — 20%</li>
								<li>Presentation Skills — 20%</li>
								<li>Q&amp;A Response — 20%</li>
							</ul>
						</div>

						{/* Registration Hub */}
						<div style={cardStyle}>
							<h2 style={sectionTitleStyle}>Registration Hub</h2>
							<p style={bodyTextStyle}>
								<strong style={{ color: "#e6fff9" }}>
									Registration:
								</strong>{" "}
								Teams must register online within the given deadline to
								participate in the event.
							</p>
							<p style={bodyTextStyle}>
								<strong style={{ color: "#e6fff9" }}>
									Business Summary:
								</strong>{" "}
								A one-page summary of the business idea must be submitted
								during registration.
							</p>
							<p style={{ ...bodyTextStyle, marginBottom: "24px" }}>
								<strong style={{ color: "#e6fff9" }}>Shortlisting:</strong>{" "}
								Selected teams will be informed in advance and will proceed to
								the next round.
							</p>
							<Link
								href="/pitchroom/register"
								className="btn"
								style={{
									display: "inline-flex",
									justifyContent: "center",
									width: "100%",
									background: "linear-gradient(90deg, #5eead4 0%, #38bdf8 100%)",
									color: "#04121c",
									fontWeight: 700,
									border: "none",
									padding: "14px",
									borderRadius: "12px",
									textDecoration: "none",
								}}>
								Register Now
							</Link>
						</div>

						{/* Code of Conduct */}
						<div style={cardStyle}>
							<h2 style={sectionTitleStyle}>Code of Conduct</h2>
							<p style={bodyTextStyle}>
								<strong style={{ color: "#e6fff9" }}>
									1. Originality:
								</strong>{" "}
								Teams must present their own unique ideas. Any copied or
								plagiarized content will lead to disqualification.
							</p>
							<p style={bodyTextStyle}>
								<strong style={{ color: "#e6fff9" }}>
									2. Professionalism:
								</strong>{" "}
								Participants must maintain proper behavior, discipline, and
								ethical conduct throughout the event.
							</p>
							<p style={bodyTextStyle}>
								<strong style={{ color: "#e6fff9" }}>
									3. Time Adherence:
								</strong>{" "}
								Teams must complete their presentation within the given time
								limit. Exceeding it may result in penalties.
							</p>
							<p style={{ ...bodyTextStyle, marginBottom: 0 }}>
								<strong style={{ color: "#e6fff9" }}>
									4. Decision of Judges:
								</strong>{" "}
								The judging panel's decision will be considered final and
								binding for all teams.
							</p>
						</div>

						{/* Hall of Fame */}
						<div style={cardStyle}>
							<h2 style={sectionTitleStyle}>Hall of Fame</h2>
							<p style={bodyTextStyle}>
								Top-performing teams will be recognized for their outstanding
								ideas, innovation, and presentation skills.
							</p>
							<ul style={listStyle}>
								<li>🏆 1st Place: Cash Prize + Certificate + Trophy</li>
								<li>🏆 2nd Place: Trophy</li>
								<li>🏆 3rd Place: Certificate</li>
							</ul>
							<p
								style={{
									color: "#7ec9c2",
									fontSize: "0.8rem",
									letterSpacing: "1.5px",
									marginTop: "20px",
									marginBottom: "10px",
								}}>
								SPECIAL RECOGNITION AWARDS
							</p>
							<ul style={listStyle}>
								<li>Most Innovative Idea</li>
								<li>Best Business Model</li>
								<li>Audience Choice Award</li>
							</ul>
							<p style={{ ...bodyTextStyle, marginTop: "18px", marginBottom: 0 }}>
								Participants will also get opportunities for networking with
								industry experts and potential investors.
							</p>
						</div>

						{/* Contacts */}
						<div style={{ ...cardStyle, marginBottom: "60px" }}>
							<h2 style={sectionTitleStyle}>Contacts</h2>
							<p
								style={{
									color: "#7ec9c2",
									fontSize: "0.8rem",
									letterSpacing: "1.5px",
									marginBottom: "10px",
								}}>
								COMMITTEE HEADS
							</p>
							<p style={{ ...bodyTextStyle, marginBottom: "4px" }}>
								Vedika Jain — +91 99308 47170
							</p>
							<p style={{ ...bodyTextStyle, marginBottom: "20px" }}>
								Aditiya Kottara — +91 85916 42488
							</p>
							<p
								style={{
									color: "#7ec9c2",
									fontSize: "0.8rem",
									letterSpacing: "1.5px",
									marginBottom: "10px",
								}}>
								COMMITTEE CO-HEADS
							</p>
							<p style={{ ...bodyTextStyle, marginBottom: "4px" }}>
								Sejal Singh — +91 89765 80695
							</p>
							<p style={{ ...bodyTextStyle, marginBottom: 0 }}>
								Manish Sharma — +91 84240 32976
							</p>
						</div>
					</div>
				</section>
			</div>

			<Footer />
		</>
	);
}
