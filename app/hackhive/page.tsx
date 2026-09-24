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
					className={`register-hero hackhive-registration-hero${boardReady ? " is-ready" : ""}`}
				>
					<div className="title-sponsor">
						<span>
							<strong className="title-sponsor-label">Title Sponsor</strong>
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
						<img src="/galaxy-bg.png" alt="Sponsor 1" />
						<img src="/galaxy-bg.png" alt="Sponsor 2" />
						<img src="/galaxy-bg.png" alt="Sponsor 3" />
					</div>
				</section>
			</PCBBackground>
		</>
	);
}
