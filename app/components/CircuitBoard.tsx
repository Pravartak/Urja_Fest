"use client";

/**
 * <LcdBoard /> — a 3D 16x2 character LCD module (HD44780 style) rendered with Three.js.
 *
 * Requires: three >= r163  (npm i three && npm i -D @types/three)
 *
 *   <LcdBoard text={["Hello, world!", "Welcome back"]} />
 *   <LcdBoard text="Line one\nLine two" align="center" />
 *
 * The screen is a real 5x7 dot-matrix render, so any ASCII text works (32–126).
 * Changing `text` only repaints the screen texture — the scene is NOT rebuilt.
 */

import { useEffect, useRef, type CSSProperties } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export interface LcdBoardProps {
	/** String (wrapped on words, "\n" starts a new row) or one string per row. Max 2 rows x 16 cols. */
	text?: string | string[];
	/** Horizontal alignment inside each row. */
	align?: "left" | "center" | "right";
	/** Colour of the lit LCD background. */
	backlightColor?: string;
	/** 0 (washed out) … 1 (dark, crisp pixels). */
	contrast?: number;
	/** Tilt the board towards the pointer. */
	interactive?: boolean;
	onReady?: () => void;
	className?: string;
	style?: CSSProperties;
}

/* ------------------------------------------------------------------ */
/* Layout constants (1 three.js unit = 1 mm)                           */
/* ------------------------------------------------------------------ */

const COLS = 16;
const ROWS = 2;

const PCB_W = 80;
const PCB_D = 36;
const PCB_T = 1.6;

const BEZEL_W = 72.4;
const BEZEL_D = 25;
const WINDOW_W = 65.8;
const WINDOW_D = 15.4;
const BEZEL_H = 5;

const GLASS_TOP = 3.05; // top of the LCD glass block above PCB surface

// Display plane (sits inside the bezel window, wider than the window so edges are hidden)
const PLANE_W = 67;
const PLANE_H = 17;

// Dot matrix geometry, in mm
const CHAR_PITCH = 4.0;
const DOT_PITCH_X = 0.65;
const DOT_PITCH_Y = 0.75;
const DOT_W = 0.57;
const DOT_H = 0.67;
const ROW_PITCH = 7.2;

// Header pins + mounting holes
const PIN_COUNT = 16;
const PIN_PITCH = 2.54;
const PIN_X0 = -6.6;
const PIN_Z = 15.3;
const HOLES: Array<[number, number]> = [
	[-37.4, -15.5],
	[37.4, -15.5],
	[-37.4, 15.5],
	[37.4, 15.5],
];
const HOLE_R = 1.25;
const HOLE_RING_R = 2.3;

const BASE_TILT = 1.5; // radians; ~62° — close to the reference photo but shows depth

/* ------------------------------------------------------------------ */
/* 5x7 font (ASCII 32–126). Each entry = 5 columns, bit0 = top pixel.  */
/* ------------------------------------------------------------------ */

const FONT_5X7: number[][] = [
	[0x00, 0x00, 0x00, 0x00, 0x00], // space
	[0x00, 0x00, 0x5f, 0x00, 0x00], // !
	[0x00, 0x07, 0x00, 0x07, 0x00], // "
	[0x14, 0x7f, 0x14, 0x7f, 0x14], // #
	[0x24, 0x2a, 0x7f, 0x2a, 0x12], // $
	[0x23, 0x13, 0x08, 0x64, 0x62], // %
	[0x36, 0x49, 0x55, 0x22, 0x50], // &
	[0x00, 0x05, 0x03, 0x00, 0x00], // '
	[0x00, 0x1c, 0x22, 0x41, 0x00], // (
	[0x00, 0x41, 0x22, 0x1c, 0x00], // )
	[0x14, 0x08, 0x3e, 0x08, 0x14], // *
	[0x08, 0x08, 0x3e, 0x08, 0x08], // +
	[0x00, 0x50, 0x30, 0x00, 0x00], // ,
	[0x08, 0x08, 0x08, 0x08, 0x08], // -
	[0x00, 0x60, 0x60, 0x00, 0x00], // .
	[0x20, 0x10, 0x08, 0x04, 0x02], // /
	[0x3e, 0x51, 0x49, 0x45, 0x3e], // 0
	[0x00, 0x42, 0x7f, 0x40, 0x00], // 1
	[0x42, 0x61, 0x51, 0x49, 0x46], // 2
	[0x21, 0x41, 0x45, 0x4b, 0x31], // 3
	[0x18, 0x14, 0x12, 0x7f, 0x10], // 4
	[0x27, 0x45, 0x45, 0x45, 0x39], // 5
	[0x3c, 0x4a, 0x49, 0x49, 0x30], // 6
	[0x01, 0x71, 0x09, 0x05, 0x03], // 7
	[0x36, 0x49, 0x49, 0x49, 0x36], // 8
	[0x06, 0x49, 0x49, 0x29, 0x1e], // 9
	[0x00, 0x36, 0x36, 0x00, 0x00], // :
	[0x00, 0x56, 0x36, 0x00, 0x00], // ;
	[0x08, 0x14, 0x22, 0x41, 0x00], // <
	[0x14, 0x14, 0x14, 0x14, 0x14], // =
	[0x00, 0x41, 0x22, 0x14, 0x08], // >
	[0x02, 0x01, 0x51, 0x09, 0x06], // ?
	[0x32, 0x49, 0x79, 0x41, 0x3e], // @
	[0x7e, 0x11, 0x11, 0x11, 0x7e], // A
	[0x7f, 0x49, 0x49, 0x49, 0x36], // B
	[0x3e, 0x41, 0x41, 0x41, 0x22], // C
	[0x7f, 0x41, 0x41, 0x22, 0x1c], // D
	[0x7f, 0x49, 0x49, 0x49, 0x41], // E
	[0x7f, 0x09, 0x09, 0x09, 0x01], // F
	[0x3e, 0x41, 0x49, 0x49, 0x7a], // G
	[0x7f, 0x08, 0x08, 0x08, 0x7f], // H
	[0x00, 0x41, 0x7f, 0x41, 0x00], // I
	[0x20, 0x40, 0x41, 0x3f, 0x01], // J
	[0x7f, 0x08, 0x14, 0x22, 0x41], // K
	[0x7f, 0x40, 0x40, 0x40, 0x40], // L
	[0x7f, 0x02, 0x0c, 0x02, 0x7f], // M
	[0x7f, 0x04, 0x08, 0x10, 0x7f], // N
	[0x3e, 0x41, 0x41, 0x41, 0x3e], // O
	[0x7f, 0x09, 0x09, 0x09, 0x06], // P
	[0x3e, 0x41, 0x51, 0x21, 0x5e], // Q
	[0x7f, 0x09, 0x19, 0x29, 0x46], // R
	[0x46, 0x49, 0x49, 0x49, 0x31], // S
	[0x01, 0x01, 0x7f, 0x01, 0x01], // T
	[0x3f, 0x40, 0x40, 0x40, 0x3f], // U
	[0x1f, 0x20, 0x40, 0x20, 0x1f], // V
	[0x3f, 0x40, 0x38, 0x40, 0x3f], // W
	[0x63, 0x14, 0x08, 0x14, 0x63], // X
	[0x07, 0x08, 0x70, 0x08, 0x07], // Y
	[0x61, 0x51, 0x49, 0x45, 0x43], // Z
	[0x00, 0x7f, 0x41, 0x41, 0x00], // [
	[0x02, 0x04, 0x08, 0x10, 0x20], // backslash
	[0x00, 0x41, 0x41, 0x7f, 0x00], // ]
	[0x04, 0x02, 0x01, 0x02, 0x04], // ^
	[0x40, 0x40, 0x40, 0x40, 0x40], // _
	[0x00, 0x01, 0x02, 0x04, 0x00], // `
	[0x20, 0x54, 0x54, 0x54, 0x78], // a
	[0x7f, 0x48, 0x44, 0x44, 0x38], // b
	[0x38, 0x44, 0x44, 0x44, 0x20], // c
	[0x38, 0x44, 0x44, 0x48, 0x7f], // d
	[0x38, 0x54, 0x54, 0x54, 0x18], // e
	[0x08, 0x7e, 0x09, 0x01, 0x02], // f
	[0x0c, 0x52, 0x52, 0x52, 0x3e], // g
	[0x7f, 0x08, 0x04, 0x04, 0x78], // h
	[0x00, 0x44, 0x7d, 0x40, 0x00], // i
	[0x20, 0x40, 0x44, 0x3d, 0x00], // j
	[0x7f, 0x10, 0x28, 0x44, 0x00], // k
	[0x00, 0x41, 0x7f, 0x40, 0x00], // l
	[0x7c, 0x04, 0x18, 0x04, 0x78], // m
	[0x7c, 0x08, 0x04, 0x04, 0x78], // n
	[0x38, 0x44, 0x44, 0x44, 0x38], // o
	[0x7c, 0x14, 0x14, 0x14, 0x08], // p
	[0x08, 0x14, 0x14, 0x18, 0x7c], // q
	[0x7c, 0x08, 0x04, 0x04, 0x08], // r
	[0x48, 0x54, 0x54, 0x54, 0x20], // s
	[0x04, 0x3f, 0x44, 0x40, 0x20], // t
	[0x3c, 0x40, 0x40, 0x20, 0x7c], // u
	[0x1c, 0x20, 0x40, 0x20, 0x1c], // v
	[0x3c, 0x40, 0x30, 0x40, 0x3c], // w
	[0x44, 0x28, 0x10, 0x28, 0x44], // x
	[0x0c, 0x50, 0x50, 0x50, 0x3c], // y
	[0x44, 0x64, 0x54, 0x4c, 0x44], // z
	[0x00, 0x08, 0x36, 0x41, 0x00], // {
	[0x00, 0x00, 0x7f, 0x00, 0x00], // |
	[0x00, 0x41, 0x36, 0x08, 0x00], // }
	[0x10, 0x08, 0x08, 0x10, 0x08], // ~
];

/* ------------------------------------------------------------------ */
/* Text layout                                                         */
/* ------------------------------------------------------------------ */

function wrapLine(line: string, cols: number): string[] {
	const out: string[] = [];
	let cur = "";
	for (const word of line.split(" ")) {
		let w = word;
		while (w.length > cols) {
			if (cur) {
				out.push(cur);
				cur = "";
			}
			out.push(w.slice(0, cols));
			w = w.slice(cols);
		}
		if (!cur) cur = w;
		else if (cur.length + 1 + w.length <= cols) cur += " " + w;
		else {
			out.push(cur);
			cur = w;
		}
	}
	out.push(cur);
	return out;
}

function layoutRows(
	text: string | string[],
	align: "left" | "center" | "right",
): string[] {
	let rows: string[];
	if (Array.isArray(text)) {
		rows = text.map((r) => String(r).slice(0, COLS));
	} else {
		rows = String(text)
			.split(/\r?\n/)
			.flatMap((l) => wrapLine(l, COLS));
	}
	rows = rows.slice(0, ROWS);
	while (rows.length < ROWS) rows.push("");

	return rows.map((r) => {
		const pad = COLS - r.length;
		const left =
			align === "center" ? Math.floor(pad / 2) : align === "right" ? pad : 0;
		return (" ".repeat(left) + r).padEnd(COLS, " ");
	});
}

/* ------------------------------------------------------------------ */
/* Screen texture                                                      */
/* ------------------------------------------------------------------ */

const LCD_TEX_W = 1024;
const LCD_TEX_H = Math.round((LCD_TEX_W * PLANE_H) / PLANE_W);

function drawLcd(
	ctx: CanvasRenderingContext2D,
	rows: string[],
	backlight: string,
	contrast: number,
) {
	const w = ctx.canvas.width;
	const h = ctx.canvas.height;
	const S = w / PLANE_W; // px per mm

	// Backlit background + gentle falloff towards the edges
	ctx.clearRect(0, 0, w, h);
	ctx.fillStyle = backlight;
	ctx.fillRect(0, 0, w, h);
	const g = ctx.createRadialGradient(
		w / 2,
		h / 2,
		h * 0.25,
		w / 2,
		h / 2,
		w * 0.58,
	);
	g.addColorStop(0, "rgba(255,255,255,0.10)");
	g.addColorStop(1, "rgba(0,0,0,0.30)");
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, w, h);

	const c = Math.min(1, Math.max(0, contrast));
	const ghostA = 0.05 + 0.05 * c;
	const onA = 0.72 + 0.26 * c;
	const ink = (a: number) => `rgba(6,26,24,${a})`;

	const gridX0 = (PLANE_W - ((COLS - 1) * CHAR_PITCH + 5 * DOT_PITCH_X)) / 2;
	const rowTop = (r: number) =>
		PLANE_H / 2 +
		(r === 0 ? -ROW_PITCH / 2 : ROW_PITCH / 2) -
		(8 * DOT_PITCH_Y) / 2;

	const on: Array<[number, number]> = [];

	// Pass 1: unlit pixel ghosts (every real LCD shows these faintly)
	ctx.fillStyle = ink(ghostA);
	for (let r = 0; r < ROWS; r++) {
		for (let col = 0; col < COLS; col++) {
			const code = rows[r].charCodeAt(col);
			const glyph = FONT_5X7[(code >= 32 && code <= 126 ? code : 63) - 32];
			for (let dx = 0; dx < 5; dx++) {
				for (let dy = 0; dy < 8; dy++) {
					const x = (gridX0 + col * CHAR_PITCH + dx * DOT_PITCH_X) * S;
					const y = (rowTop(r) + dy * DOT_PITCH_Y) * S;
					ctx.fillRect(x, y, DOT_W * S, DOT_H * S);
					if (dy < 7 && (glyph[dx] >> dy) & 1) on.push([x, y]);
				}
			}
		}
	}

	// Pass 2: parallax shadow of the lit pixels (glass sits above the segment layer)
	ctx.fillStyle = `rgba(0,0,0,${0.14 + 0.06 * c})`;
	const sx = 0.1 * S;
	const sy = 0.14 * S;
	for (const [x, y] of on) ctx.fillRect(x + sx, y + sy, DOT_W * S, DOT_H * S);

	// Pass 3: lit pixels
	ctx.fillStyle = ink(onA);
	for (const [x, y] of on) ctx.fillRect(x, y, DOT_W * S, DOT_H * S);
}

/* ------------------------------------------------------------------ */
/* PCB texture (solder mask, traces, pads, silkscreen)                 */
/* ------------------------------------------------------------------ */

const PCB_TEX_W = 2048;
const PCB_TEX_H = Math.round((PCB_TEX_W * PCB_D) / PCB_W);

function mulberry32(seed: number) {
	let a = seed;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function makePcbCanvas(): HTMLCanvasElement {
	const cv = document.createElement("canvas");
	cv.width = PCB_TEX_W;
	cv.height = PCB_TEX_H;
	const ctx = cv.getContext("2d")!;
	const S = PCB_TEX_W / PCB_W; // px per mm
	const X = (x: number) => (x + PCB_W / 2) * S;
	const Y = (z: number) => (z + PCB_D / 2) * S;
	const rnd = mulberry32(1602);

	// Solder mask
	const base = ctx.createLinearGradient(0, 0, PCB_TEX_W, PCB_TEX_H);
	base.addColorStop(0, "#075985");
	base.addColorStop(1, "#074f76");
	ctx.fillStyle = base;
	ctx.fillRect(0, 0, PCB_TEX_W, PCB_TEX_H);

	// Fine mottling
	for (let i = 0; i < 9000; i++) {
		const light = rnd() > 0.5;
		ctx.fillStyle = light ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.035)";
		ctx.fillRect(
			rnd() * PCB_TEX_W,
			rnd() * PCB_TEX_H,
			1 + rnd() * 3,
			1 + rnd() * 3,
		);
	}

	// Traces: dark outline, then lighter core (copper under mask)
	const trace = (pts: Array<[number, number]>, wmm = 0.2) => {
		const path = () => {
			ctx.beginPath();
			ctx.moveTo(X(pts[0][0]), Y(pts[0][1]));
			for (let i = 1; i < pts.length; i++)
				ctx.lineTo(X(pts[i][0]), Y(pts[i][1]));
		};
		ctx.lineJoin = "round";
		ctx.lineCap = "round";
		ctx.strokeStyle = "#38BDF8";
		ctx.lineWidth = (wmm + 0.14) * S;
		path();
		ctx.stroke();
		ctx.strokeStyle = "#38BDF8";
		ctx.lineWidth = wmm * S;
		path();
		ctx.stroke();
	};
	const via = (x: number, z: number) => {
		ctx.fillStyle = "#38BDF8";
		ctx.beginPath();
		ctx.arc(X(x), Y(z), 0.5 * S, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = "#4cc9ff";
		ctx.beginPath();
		ctx.arc(X(x), Y(z), 0.36 * S, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = "#c9a955";
		ctx.beginPath();
		ctx.arc(X(x), Y(z), 0.16 * S, 0, Math.PI * 2);
		ctx.fill();
	};

	// Pin fan-out towards the bezel
	for (let i = 0; i < PIN_COUNT; i++) {
		const x = PIN_X0 + i * PIN_PITCH;
		const jog = (i - 7.5) * 0.11;
		trace([
			[x, PIN_Z - 0.6],
			[x, 13.9],
			[x + jog, 13.1],
			[x + jog, 11],
		]);
	}
	// Top edge routing
	for (let i = 0; i < 12; i++) {
		const x0 = -34 + i * 5.6 + rnd() * 1.5;
		const z0 = -12.3;
		const z1 = -13.6 - rnd() * 3;
		const dx = (rnd() > 0.5 ? 1 : -1) * (1 + rnd() * 3);
		trace([
			[x0, z0],
			[x0, z1 + 1],
			[x0 + dx, z1],
			[x0 + dx + (dx > 0 ? 3 : -3), z1],
		]);
		if (i % 3 === 0) via(x0 + dx + (dx > 0 ? 3 : -3), z1);
	}
	// Side edge routing
	for (const sgn of [-1, 1]) {
		for (let i = 0; i < 4; i++) {
			const x = sgn * (36.9 + i * 0.75);
			trace([
				[x, -10 + i],
				[x, 9 - i * 0.8],
			]);
		}
	}
	// Scatter of vias near the pin row
	for (let i = 0; i < 6; i++) via(-22 + rnd() * 44, 13.2 + rnd() * 0.6 - 0.3);

	// Baked ambient-occlusion under the bezel
	ctx.save();
	ctx.shadowColor = "rgba(0,0,0,0.6)";
	ctx.shadowBlur = 1.4 * S;
	ctx.shadowOffsetY = 0.55 * S;
	ctx.fillStyle = "rgba(0,0,0,0.9)";
	ctx.fillRect(X(-BEZEL_W / 2), Y(-BEZEL_D / 2), BEZEL_W * S, BEZEL_D * S);
	ctx.restore();

	// Gold pads for the header pins
	for (let i = 0; i < PIN_COUNT; i++) {
		const x = PIN_X0 + i * PIN_PITCH;
		const grad = ctx.createRadialGradient(
			X(x) - 4,
			Y(PIN_Z) - 4,
			2,
			X(x),
			Y(PIN_Z),
			1.1 * S,
		);
		grad.addColorStop(0, "#f0d27a");
		grad.addColorStop(1, "#b48a2e");
		ctx.fillStyle = grad;
		if (i === 0) {
			ctx.fillRect(X(x) - 0.95 * S, Y(PIN_Z) - 0.95 * S, 1.9 * S, 1.9 * S);
		} else {
			ctx.beginPath();
			ctx.arc(X(x), Y(PIN_Z), 0.95 * S, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.fillStyle = "#1a1a12";
		ctx.beginPath();
		ctx.arc(X(x), Y(PIN_Z), 0.42 * S, 0, Math.PI * 2);
		ctx.fill();
	}

	// Small 4-pad test row at the top
	for (let i = 0; i < 4; i++) {
		const x = 4.2 + i * 1.85;
		ctx.fillStyle = "#d9b552";
		ctx.beginPath();
		ctx.arc(X(x), Y(-14.1), 0.5 * S, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = "#231e10";
		ctx.beginPath();
		ctx.arc(X(x), Y(-14.1), 0.2 * S, 0, Math.PI * 2);
		ctx.fill();
	}

	// Plated rings around mounting holes (geometry punches the centre out)
	for (const [x, y] of HOLES) {
		const z = -y;
		const grad = ctx.createRadialGradient(
			X(x),
			Y(z),
			HOLE_R * S,
			X(x),
			Y(z),
			HOLE_RING_R * S,
		);
		grad.addColorStop(0, "#b98f30");
		grad.addColorStop(0.5, "#38BDF8");
		grad.addColorStop(1, "#38BDF8");
		ctx.fillStyle = grad;
		ctx.beginPath();
		ctx.arc(X(x), Y(z), HOLE_RING_R * S, 0, Math.PI * 2);
		ctx.fill();
	}

	// Silkscreen
	ctx.fillStyle = "rgba(240,246,236,0.92)";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.font = `bold ${1.15 * S}px "Courier New", monospace`;
	ctx.fillText("1", X(PIN_X0), Y(17.2));
	ctx.fillText("16", X(PIN_X0 + 15 * PIN_PITCH), Y(17.2));
	ctx.font = `bold ${1.3 * S}px "Courier New", monospace`;
	ctx.textAlign = "left";
	ctx.fillText("LCD1602A", X(-19), Y(16.9));
	ctx.fillText("HD44780", X(-30), Y(-16.6));
	ctx.fillText("5V", X(20), Y(-16.6));

	return cv;
}

/* ------------------------------------------------------------------ */
/* Geometry helpers                                                    */
/* ------------------------------------------------------------------ */

function roundedRect(w: number, h: number, r: number): THREE.Shape {
	const s = new THREE.Shape();
	const x = -w / 2;
	const y = -h / 2;
	s.moveTo(x + r, y);
	s.lineTo(x + w - r, y);
	s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
	s.lineTo(x + w, y + h - r);
	s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
	s.lineTo(x + r, y + h);
	s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
	s.lineTo(x, y + r);
	s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
	return s;
}

function rectPath(w: number, h: number): THREE.Path {
	const p = new THREE.Path();
	p.moveTo(-w / 2, -h / 2);
	p.lineTo(w / 2, -h / 2);
	p.lineTo(w / 2, h / 2);
	p.lineTo(-w / 2, h / 2);
	p.closePath();
	return p;
}

function buildPcbGeometry(): THREE.ExtrudeGeometry {
	const shape = new THREE.Shape();
	shape.moveTo(-PCB_W / 2, -PCB_D / 2);
	shape.lineTo(PCB_W / 2, -PCB_D / 2);
	shape.lineTo(PCB_W / 2, PCB_D / 2);
	shape.lineTo(-PCB_W / 2, PCB_D / 2);
	shape.closePath();
	for (const [x, y] of HOLES) {
		const hole = new THREE.Path();
		hole.absarc(x, y, HOLE_R, 0, Math.PI * 2, true);
		shape.holes.push(hole);
	}
	const geo = new THREE.ExtrudeGeometry(shape, {
		depth: PCB_T,
		bevelEnabled: false,
		curveSegments: 40,
	});

	// Planar UVs from the shape plane so the canvas texture maps 1:1 onto the caps
	const pos = geo.attributes.position;
	const uv = geo.attributes.uv;
	for (let i = 0; i < pos.count; i++) {
		uv.setXY(
			i,
			(pos.getX(i) + PCB_W / 2) / PCB_W,
			(pos.getY(i) + PCB_D / 2) / PCB_D,
		);
	}
	uv.needsUpdate = true;

	geo.rotateX(-Math.PI / 2); // shape +y → board −z, extrusion → +y
	geo.translate(0, -PCB_T, 0); // top face at y = 0
	return geo;
}

function buildBezelGeometry(): THREE.ExtrudeGeometry {
	const shape = roundedRect(BEZEL_W, BEZEL_D, 0.8);
	shape.holes.push(rectPath(WINDOW_W, WINDOW_D));
	const geo = new THREE.ExtrudeGeometry(shape, {
		depth: BEZEL_H - 0.24,
		bevelEnabled: true,
		bevelThickness: 0.12,
		bevelSize: 0.12,
		bevelSegments: 2,
		curveSegments: 10,
	});
	geo.rotateX(-Math.PI / 2);
	geo.translate(0, 0.12, 0);
	return geo;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

interface SceneApi {
	redraw: () => void;
}

export default function LcdBoard({
	text = ["Hello, world!", "LCD 16x2 ready"],
	align = "left",
	backlightColor = "#6fa697",
	contrast = 0.7,
	interactive = true,
	onReady,
	className,
	style,
}: LcdBoardProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const apiRef = useRef<SceneApi | null>(null);

	// Always-current props for the (mount-once) scene closure
	const propsRef = useRef({
		text,
		align,
		backlightColor,
		contrast,
		interactive,
		onReady,
	});
	propsRef.current = {
		text,
		align,
		backlightColor,
		contrast,
		interactive,
		onReady,
	};

	/* ---- Build the scene once ------------------------------------- */
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true,
			powerPreference: "high-performance",
		});
		renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
		renderer.outputColorSpace = THREE.SRGBColorSpace;
		renderer.toneMapping = THREE.NeutralToneMapping;
		renderer.toneMappingExposure = 1.0;
		renderer.domElement.style.display = "block";
		renderer.domElement.style.width = "100%";
		renderer.domElement.style.height = "100%";
		container.appendChild(renderer.domElement);
		const maxAniso = renderer.capabilities.getMaxAnisotropy();

		const scene = new THREE.Scene();
		const pmrem = new THREE.PMREMGenerator(renderer);
		const room = new RoomEnvironment();
		const envRT = pmrem.fromScene(room, 0.04);
		scene.environment = envRT.texture;
		scene.environmentIntensity = 0.85;

		const key = new THREE.DirectionalLight(0xffffff, 1.6);
		key.position.set(-30, 60, 50);
		scene.add(key);
		const fill = new THREE.DirectionalLight(0xbfd4ff, 0.35);
		fill.position.set(40, 20, 30);
		scene.add(fill);

		const camera = new THREE.PerspectiveCamera(24, 1, 10, 800);

		const pivot = new THREE.Group();
		pivot.rotation.order = "YXZ"; // yaw about world-Y after the base tilt
		scene.add(pivot);
		const board = new THREE.Group();
		pivot.add(board);

		/* PCB */
		const pcbTex = new THREE.CanvasTexture(makePcbCanvas());
		pcbTex.colorSpace = THREE.SRGBColorSpace;
		pcbTex.anisotropy = maxAniso;
		const pcbGeo = buildPcbGeometry();
		const pcbMats = [
			new THREE.MeshStandardMaterial({
				map: pcbTex,
				roughness: 0.42,
				metalness: 0.0,
			}),
			new THREE.MeshStandardMaterial({
				color: "#c7b070",
				roughness: 0.85,
				metalness: 0.0,
			}),
		];
		board.add(new THREE.Mesh(pcbGeo, pcbMats));

		/* LCD glass block (hidden under the bezel except through the window) */
		const glassGeo = new THREE.BoxGeometry(71, GLASS_TOP - 0.05, 23.6);
		const glassMat = new THREE.MeshStandardMaterial({
			color: "#101312",
			roughness: 0.6,
		});
		const glass = new THREE.Mesh(glassGeo, glassMat);
		glass.position.y = 0.05 + (GLASS_TOP - 0.05) / 2;
		board.add(glass);

		/* Screen */
		const lcdCanvas = document.createElement("canvas");
		lcdCanvas.width = LCD_TEX_W;
		lcdCanvas.height = LCD_TEX_H;
		const lcdCtx = lcdCanvas.getContext("2d")!;
		const lcdTex = new THREE.CanvasTexture(lcdCanvas);
		lcdTex.colorSpace = THREE.SRGBColorSpace;
		lcdTex.anisotropy = maxAniso;

		const screenGeo = new THREE.PlaneGeometry(PLANE_W, PLANE_H);
		screenGeo.rotateX(-Math.PI / 2);
		const screenMat = new THREE.MeshBasicMaterial({
			map: lcdTex,
			toneMapped: false,
		});
		const screen = new THREE.Mesh(screenGeo, screenMat);
		screen.position.y = GLASS_TOP + 0.02;
		board.add(screen);

		// Glossy cover glass: adds only reflections (additive), never darkens the LCD
		const coverGeo = new THREE.PlaneGeometry(WINDOW_W, WINDOW_D);
		coverGeo.rotateX(-Math.PI / 2);
		const coverMat = new THREE.MeshStandardMaterial({
			color: 0x000000,
			roughness: 0.07,
			metalness: 0,
			transparent: true,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
			envMapIntensity: 1.3,
		});
		const cover = new THREE.Mesh(coverGeo, coverMat);
		cover.position.y = GLASS_TOP + 0.12;
		board.add(cover);

		/* Bezel */
		const bezelGeo = buildBezelGeometry();
		const bezelMat = new THREE.MeshStandardMaterial({
			color: "#0c0c0d",
			roughness: 0.42,
			metalness: 0.65,
		});
		board.add(new THREE.Mesh(bezelGeo, bezelMat));

		/* Header pins */
		const pinGeo = new THREE.BoxGeometry(0.64, 6.5, 0.64);
		const pinMat = new THREE.MeshStandardMaterial({
			color: "#dcb650",
			metalness: 1,
			roughness: 0.28,
		});
		const pins = new THREE.InstancedMesh(pinGeo, pinMat, PIN_COUNT);
		const dummy = new THREE.Object3D();
		for (let i = 0; i < PIN_COUNT; i++) {
			dummy.position.set(PIN_X0 + i * PIN_PITCH, 0.25, PIN_Z);
			dummy.updateMatrix();
			pins.setMatrixAt(i, dummy.matrix);
		}
		pins.instanceMatrix.needsUpdate = true;
		board.add(pins);

		/* Solder fillets on the pins */
		const filletGeo = new THREE.ConeGeometry(0.95, 0.75, 20);
		const filletMat = new THREE.MeshStandardMaterial({
			color: "#c9ccd0",
			metalness: 1,
			roughness: 0.3,
		});
		const fillets = new THREE.InstancedMesh(filletGeo, filletMat, PIN_COUNT);
		for (let i = 0; i < PIN_COUNT; i++) {
			dummy.position.set(PIN_X0 + i * PIN_PITCH, 0.375, PIN_Z);
			dummy.updateMatrix();
			fillets.setMatrixAt(i, dummy.matrix);
		}
		fillets.instanceMatrix.needsUpdate = true;
		board.add(fillets);

		/* Driver IC epoxy blob (chip-on-board) */
		const blobGeo = new THREE.SphereGeometry(1.6, 32, 16);
		blobGeo.scale(1, 0.32, 1);
		const blobMat = new THREE.MeshStandardMaterial({
			color: "#0a0a0a",
			roughness: 0.3,
			metalness: 0.1,
		});
		const blob = new THREE.Mesh(blobGeo, blobMat);
		blob.position.set(-24, 0, 14.6);
		board.add(blob);

		/* Side connector clip */
		const clipGeo = new THREE.BoxGeometry(2.4, 1.5, 11);
		const clipMat = new THREE.MeshStandardMaterial({
			color: "#a9adb2",
			metalness: 0.9,
			roughness: 0.35,
		});
		const clip = new THREE.Mesh(clipGeo, clipMat);
		clip.position.set(-38.4, 0.75, 0);
		board.add(clip);

		/* Painting */
		const redraw = () => {
			const p = propsRef.current;
			drawLcd(
				lcdCtx,
				layoutRows(p.text, p.align),
				p.backlightColor,
				p.contrast,
			);
			lcdTex.needsUpdate = true;
		};
		apiRef.current = { redraw };
		redraw();

		/* Sizing */
		const resize = () => {
			const w = Math.max(1, container.clientWidth);
			const h = Math.max(1, container.clientHeight);
			renderer.setSize(w, h, false);
			camera.aspect = w / h;
			camera.updateProjectionMatrix();
			const t = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
			const dH = 20.5 / t;
			const dW = 47 / (t * camera.aspect);
			camera.position.set(0, 0, Math.max(dH, dW));
			camera.lookAt(0, 0, 0);
		};
		resize();
		const ro = new ResizeObserver(resize);
		ro.observe(container);

		/* Pointer tilt */
		const target = { x: 0, y: 0 };
		const cur = { x: 0, y: 0 };
		const onMove = (e: PointerEvent) => {
			if (!propsRef.current.interactive) return;
			const r = container.getBoundingClientRect();
			target.x = ((e.clientX - r.left) / r.width) * 2 - 1;
			target.y = ((e.clientY - r.top) / r.height) * 2 - 1;
		};
		const onLeave = () => {
			target.x = 0;
			target.y = 0;
		};
		container.addEventListener("pointermove", onMove);
		container.addEventListener("pointerleave", onLeave);

		/* Loop (paused while off-screen) */
		const reduceMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		let visible = true;
		let hasReportedReady = false;
		const io = new IntersectionObserver(([entry]) => {
			visible = entry.isIntersecting;
		});
		io.observe(container);

		const clock = new THREE.Timer();
		let raf = 0;
		const tick = () => {
			raf = requestAnimationFrame(tick);
			if (!visible) return;
			const t = clock.getElapsed();
			cur.x += (target.x - cur.x) * 0.08;
			cur.y += (target.y - cur.y) * 0.08;
			const idleYaw = reduceMotion ? 0 : Math.sin(t * 0.5) * 0.07;
			const idlePitch = reduceMotion ? 0 : Math.cos(t * 0.37) * 0.035;
			const floatOffset = reduceMotion ? 0 : Math.sin(t * 0.85) * 0.8;
			board.position.y = floatOffset;
			pivot.rotation.x = BASE_TILT + cur.y * 0.18 + idlePitch;
			pivot.rotation.y = cur.x * 0.32 + idleYaw;
			renderer.render(scene, camera);
			if (!hasReportedReady) {
				hasReportedReady = true;
				propsRef.current.onReady?.();
			}
		};
		// The loader should not depend on IntersectionObserver timing.
		renderer.render(scene, camera);
		hasReportedReady = true;
		propsRef.current.onReady?.();
		tick();

		/* Cleanup */
		return () => {
			cancelAnimationFrame(raf);
			io.disconnect();
			ro.disconnect();
			container.removeEventListener("pointermove", onMove);
			container.removeEventListener("pointerleave", onLeave);
			apiRef.current = null;

			[
				pcbGeo,
				glassGeo,
				screenGeo,
				coverGeo,
				bezelGeo,
				pinGeo,
				filletGeo,
				blobGeo,
				clipGeo,
			].forEach((g) => g.dispose());
			[
				...pcbMats,
				glassMat,
				screenMat,
				coverMat,
				bezelMat,
				pinMat,
				filletMat,
				blobMat,
				clipMat,
			].forEach((m) => m.dispose());
			pcbTex.dispose();
			lcdTex.dispose();
			room.dispose();
			envRT.dispose();
			pmrem.dispose();
			renderer.dispose();
			if (renderer.domElement.parentNode === container)
				container.removeChild(renderer.domElement);
		};
	}, []);

	/* ---- Repaint the screen when the text / look changes ---------- */
	const textKey = JSON.stringify(text);
	useEffect(() => {
		apiRef.current?.redraw();
	}, [textKey, align, backlightColor, contrast]);

	const rows = layoutRows(text, align)
		.map((r) => r.trim())
		.filter(Boolean)
		.join(" / ");

	return (
		<div
			ref={containerRef}
			className={className}
			role="img"
			aria-label={`16 by 2 character LCD module displaying: ${rows || "blank screen"}`}
			style={{
				width: "100%",
				aspectRatio: "2.2 / 1",
				touchAction: "pan-y",
				...style,
			}}
		/>
	);
}
