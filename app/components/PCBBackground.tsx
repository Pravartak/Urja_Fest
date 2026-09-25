import type { CSSProperties, ReactNode } from "react";

export interface PCBBackgroundProps {
	children?: ReactNode;
	className?: string;
	style?: CSSProperties;
}

const pcbBackgroundStyle: CSSProperties = {
	backgroundColor: "#075985",

	// Subtle PCB texture/grid
	backgroundImage: `
		linear-gradient(
			rgba(56, 189, 248, 0.035) 1px,
			transparent 1px
		),
		linear-gradient(
			90deg,
			rgba(56, 189, 248, 0.035) 1px,
			transparent 1px
		),
		radial-gradient(
			circle at 50% 50%,
			rgba(56, 189, 248, 0.045) 1px,
			transparent 1px
		)
	`,
	backgroundPosition: "0 0, 0 0, 18px 18px",
	backgroundSize: "36px 36px, 36px 36px, 36px 36px",

	backgroundAttachment: "scroll",

	minHeight: "100%",
	width: "100%",

	position: "relative",
	overflow: "hidden",
};

/* -------------------------------------------------------
   Trace definitions
------------------------------------------------------- */

const traces = [
	// Top-left
	{
		className: "trace trace-1",
		segments: [
			{ type: "horizontal", style: { left: "3%", top: "13%", width: "14%" } },
			{ type: "vertical", style: { left: "17%", top: "13%", height: "10%" } },
			{ type: "horizontal", style: { left: "17%", top: "23%", width: "8%" } },
		],
		nodes: [
			{ left: "3%", top: "13%" },
			{ left: "17%", top: "23%" },
			{ left: "25%", top: "23%" },
		],
	},

	// Top-right
	{
		className: "trace trace-2",
		segments: [
			{ type: "horizontal", style: { left: "72%", top: "11%", width: "16%" } },
			{ type: "vertical", style: { left: "72%", top: "11%", height: "13%" } },
			{ type: "horizontal", style: { left: "63%", top: "24%", width: "9%" } },
		],
		nodes: [
			{ left: "88%", top: "11%" },
			{ left: "72%", top: "24%" },
			{ left: "63%", top: "24%" },
		],
	},

	// Left middle
	{
		className: "trace trace-3",
		segments: [
			{ type: "vertical", style: { left: "7%", top: "37%", height: "18%" } },
			{ type: "horizontal", style: { left: "7%", top: "55%", width: "12%" } },
			{ type: "vertical", style: { left: "19%", top: "45%", height: "10%" } },
			{ type: "horizontal", style: { left: "19%", top: "45%", width: "8%" } },
		],
		nodes: [
			{ left: "7%", top: "37%" },
			{ left: "19%", top: "45%" },
			{ left: "27%", top: "45%" },
		],
	},

	// Right middle
	{
		className: "trace trace-4",
		segments: [
			{ type: "horizontal", style: { left: "79%", top: "39%", width: "13%" } },
			{ type: "vertical", style: { left: "79%", top: "39%", height: "13%" } },
			{ type: "horizontal", style: { left: "69%", top: "52%", width: "10%" } },
		],
		nodes: [
			{ left: "92%", top: "39%" },
			{ left: "79%", top: "52%" },
			{ left: "69%", top: "52%" },
		],
	},

	// Center-left
	{
		className: "trace trace-5",
		segments: [
			{ type: "horizontal", style: { left: "12%", top: "68%", width: "11%" } },
			{ type: "vertical", style: { left: "23%", top: "60%", height: "8%" } },
			{ type: "horizontal", style: { left: "23%", top: "60%", width: "12%" } },
		],
		nodes: [
			{ left: "12%", top: "68%" },
			{ left: "23%", top: "60%" },
			{ left: "35%", top: "60%" },
		],
	},

	// Center-right
	{
		className: "trace trace-6",
		segments: [
			{ type: "horizontal", style: { left: "65%", top: "67%", width: "14%" } },
			{ type: "vertical", style: { left: "65%", top: "58%", height: "9%" } },
			{ type: "horizontal", style: { left: "56%", top: "58%", width: "9%" } },
		],
		nodes: [
			{ left: "79%", top: "67%" },
			{ left: "65%", top: "58%" },
			{ left: "56%", top: "58%" },
		],
	},

	// Bottom-left
	{
		className: "trace trace-7",
		segments: [
			{ type: "horizontal", style: { left: "4%", top: "86%", width: "17%" } },
			{ type: "vertical", style: { left: "21%", top: "78%", height: "8%" } },
			{ type: "horizontal", style: { left: "21%", top: "78%", width: "7%" } },
		],
		nodes: [
			{ left: "4%", top: "86%" },
			{ left: "21%", top: "78%" },
			{ left: "28%", top: "78%" },
		],
	},

	// Bottom-right
	{
		className: "trace trace-8",
		segments: [
			{ type: "horizontal", style: { left: "75%", top: "86%", width: "17%" } },
			{ type: "vertical", style: { left: "75%", top: "77%", height: "9%" } },
			{ type: "horizontal", style: { left: "67%", top: "77%", width: "8%" } },
		],
		nodes: [
			{ left: "92%", top: "86%" },
			{ left: "75%", top: "77%" },
			{ left: "67%", top: "77%" },
		],
	},

	// Long diagonal-style stepped trace
	{
		className: "trace trace-9",
		segments: [
			{ type: "horizontal", style: { left: "31%", top: "16%", width: "9%" } },
			{ type: "vertical", style: { left: "40%", top: "16%", height: "12%" } },
			{ type: "horizontal", style: { left: "40%", top: "28%", width: "15%" } },
			{ type: "vertical", style: { left: "55%", top: "28%", height: "8%" } },
		],
		nodes: [
			{ left: "31%", top: "16%" },
			{ left: "40%", top: "28%" },
			{ left: "55%", top: "36%" },
		],
	},

	// Long lower trace
	{
		className: "trace trace-10",
		segments: [
			{ type: "horizontal", style: { left: "38%", top: "88%", width: "11%" } },
			{ type: "vertical", style: { left: "49%", top: "78%", height: "10%" } },
			{ type: "horizontal", style: { left: "49%", top: "78%", width: "12%" } },
			{ type: "vertical", style: { left: "61%", top: "69%", height: "9%" } },
		],
		nodes: [
			{ left: "38%", top: "88%" },
			{ left: "49%", top: "78%" },
			{ left: "61%", top: "69%" },
		],
	},

	// Display power and data bus: routes into the center display from both sides.
	{
		className: "trace trace-11",
		segments: [
			{ type: "horizontal", style: { left: "18%", top: "31%", width: "24%" } },
			{ type: "vertical", style: { left: "42%", top: "31%", height: "9%" } },
			{ type: "horizontal", style: { left: "42%", top: "40%", width: "16%" } },
			{ type: "vertical", style: { left: "58%", top: "40%", height: "9%" } },
			{ type: "horizontal", style: { left: "58%", top: "49%", width: "24%" } },
		],
		nodes: [
			{ left: "18%", top: "31%" },
			{ left: "42%", top: "40%" },
			{ left: "58%", top: "49%" },
			{ left: "82%", top: "49%" },
		],
	},

	// Lower shared bus linking the event cards and sponsor components.
	{
		className: "trace trace-12",
		segments: [
			{ type: "horizontal", style: { left: "8%", top: "73%", width: "21%" } },
			{ type: "vertical", style: { left: "29%", top: "63%", height: "10%" } },
			{ type: "horizontal", style: { left: "29%", top: "63%", width: "42%" } },
			{ type: "vertical", style: { left: "71%", top: "63%", height: "10%" } },
			{ type: "horizontal", style: { left: "71%", top: "73%", width: "21%" } },
		],
		nodes: [
			{ left: "8%", top: "73%" },
			{ left: "29%", top: "63%" },
			{ left: "50%", top: "63%" },
			{ left: "71%", top: "63%" },
			{ left: "92%", top: "73%" },
		],
	},

	// Vertical rails connect the upper components to the lower shared bus.
	{
		className: "trace trace-13",
		segments: [
			{ type: "vertical", style: { left: "14%", top: "24%", height: "49%" } },
			{ type: "vertical", style: { left: "86%", top: "24%", height: "49%" } },
		],
		nodes: [
			{ left: "14%", top: "24%" },
			{ left: "14%", top: "73%" },
			{ left: "86%", top: "24%" },
			{ left: "86%", top: "73%" },
		],
	},

	// Fine parallel traces add realistic routed signal lanes around the display.
	{
		className: "trace trace-14",
		segments: [
			{ type: "horizontal", style: { left: "22%", top: "34%", width: "16%" } },
			{ type: "horizontal", style: { left: "62%", top: "34%", width: "16%" } },
			{ type: "horizontal", style: { left: "22%", top: "37%", width: "12%" } },
			{ type: "horizontal", style: { left: "66%", top: "37%", width: "12%" } },
		],
		nodes: [
			{ left: "22%", top: "34%" },
			{ left: "78%", top: "34%" },
			{ left: "22%", top: "37%" },
			{ left: "78%", top: "37%" },
		],
	},
];

export default function PCBBackground({
	children,
	className,
	style,
}: PCBBackgroundProps) {
	return (
		<div
			className={`pcb-background ${className ?? ""}`}
			style={{ ...pcbBackgroundStyle, ...style }}>
			<div className="pcb-traces" aria-hidden="true">
				{traces.map((trace) => (
					<div className={trace.className} key={trace.className}>
						{trace.segments.map((segment, index) => (
							<span
								key={index}
								className={`trace-segment ${segment.type}`}
								style={segment.style}
							/>
						))}

						{trace.nodes.map((node, index) => (
							<span key={index} className="trace-node" style={node} />
						))}
					</div>
				))}
			</div>

			<div className="pcb-content">{children}</div>
		</div>
	);
}
