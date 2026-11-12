import { bayerThreshold, type Rgb, writePixel } from "./dither"

export type Point = { x: number; y: number }

/** A rectangle in cells where the scene dims so the text on top stays readable. */
export type QuietZone = { left: number; top: number; right: number; bottom: number }

/**
 * Off-screen state of the backdrop: a light-energy buffer the tesseract, the corridor and the
 * strings are splatted into every step, plus a blurred copy for the glow and a per-cell falloff
 * that dims the corners and the quiet zones under the page text.
 */
export type Scene = {
	cols: number
	rows: number
	energy: Float32Array
	scratch: Float32Array
	glow: Float32Array
	falloff: Float32Array
	clock: number
	spin: number
	fold: number
}

type Projected = { x: number; y: number; depth: number }

const W_DISTANCE = 2.4
const CAMERA_DISTANCE = 3.6
const RIBS = 16
const RAYS = 6
const ECHOES = 3
const STRINGS = 9
const STRING_SEGMENTS = 24
const EDGE_ALPHA = 0.1
const TUNNEL_ALPHA = 0.012
const STRING_ALPHA = 0.016
const TRAIL_DECAY = 0.86
const GLOW_STRENGTH = 1.76
const ENERGY_GAIN = 1.5
const BLUR_RADIUS = 4
const SPIN_DECAY = 0.94
const SPIN_KICK = 0.22
const CLOCK_PER_MS = 0.0004
const CLEAR_RADIUS = 0.42
const CORNER_RADIUS = 0.92
const CORNER_FLOOR = 0.45
const QUIET_FLOOR = 0
const QUIET_FEATHER_CELLS = 14
const SETTLE_CLOCK = 4
const SETTLE_STEPS = 30
const SETTLE_STEP_MS = 33

const VERTICES: readonly (readonly number[])[] = Array.from({ length: 16 }, (_, i) => [
	i & 1 ? 1 : -1,
	i & 2 ? 1 : -1,
	i & 4 ? 1 : -1,
	i & 8 ? 1 : -1,
])

const EDGES: readonly (readonly [number, number])[] = VERTICES.flatMap((_, i) =>
	[0, 1, 2, 3]
		.map((bit) => i ^ (1 << bit))
		.filter((j) => j > i)
		.map((j) => [i, j] as const),
)

const STRING_SEEDS = Array.from({ length: STRINGS }, (_, i) => {
	const s = Math.sin(i * 91.7 + 3.1) * 43758.5453
	return { x: (s - Math.floor(s)) * 2 - 1, phase: i * 1.7, depth: 0.4 + ((i * 37) % 10) / 16 }
})

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t
}

function clamp01(v: number): number {
	return Math.min(1, Math.max(0, v))
}

function rotate(p: number[], a: number, b: number, angle: number) {
	const c = Math.cos(angle)
	const s = Math.sin(angle)
	const pa = p[a]
	const pb = p[b]
	p[a] = pa * c - pb * s
	p[b] = pa * s + pb * c
}

function quietness(x: number, y: number, zones: readonly QuietZone[]): number {
	let level = 1
	for (const zone of zones) {
		const dx = Math.max(zone.left - x, 0, x - zone.right)
		const dy = Math.max(zone.top - y, 0, y - zone.bottom)
		const k = clamp01(Math.hypot(dx, dy) / QUIET_FEATHER_CELLS)
		level = Math.min(level, QUIET_FLOOR + (1 - QUIET_FLOOR) * k)
	}
	return level
}

/** Recomputes the falloff for new quiet zones, keeping the animation state. */
export function setQuietZones(scene: Scene, zones: readonly QuietZone[]) {
	const { cols, rows, falloff } = scene
	for (let y = 0; y < rows; y++) {
		for (let x = 0; x < cols; x++) {
			const nx = (x / (cols - 1)) * 2 - 1
			const ny = (y / (rows - 1)) * 2 - 1
			const r = Math.hypot(nx, ny) / Math.SQRT2
			const k = clamp01((r - CLEAR_RADIUS) / (CORNER_RADIUS - CLEAR_RADIUS))
			falloff[y * cols + x] = (1 - k * (1 - CORNER_FLOOR)) * quietness(x, y, zones)
		}
	}
}

export function createScene(cols: number, rows: number, zones: readonly QuietZone[]): Scene {
	const size = cols * rows
	const scene: Scene = {
		cols,
		rows,
		energy: new Float32Array(size),
		scratch: new Float32Array(size),
		glow: new Float32Array(size),
		falloff: new Float32Array(size),
		clock: 0,
		spin: 0,
		fold: 0,
	}
	setQuietZones(scene, zones)
	return scene
}

/** Gives the hypercube a push that folds it faster for a moment. */
export function kickScene(scene: Scene) {
	scene.spin += SPIN_KICK
}

function splat(scene: Scene, x: number, y: number, amount: number, radius: number) {
	const { cols, rows, energy } = scene
	const ix = Math.round(x)
	const iy = Math.round(y)
	if (ix < 2 || iy < 2 || ix >= cols - 2 || iy >= rows - 2) return
	const i = iy * cols + ix
	energy[i] += amount
	if (radius < 1) return
	const near = amount * 0.35
	energy[i - 1] += near
	energy[i + 1] += near
	energy[i - cols] += near
	energy[i + cols] += near
	if (radius < 2) return
	const far = amount * 0.12
	energy[i - 2] += far
	energy[i + 2] += far
	energy[i - 2 * cols] += far
	energy[i + 2 * cols] += far
	energy[i - cols - 1] += far
	energy[i - cols + 1] += far
	energy[i + cols - 1] += far
	energy[i + cols + 1] += far
}

function line(
	scene: Scene,
	x0: number,
	y0: number,
	x1: number,
	y1: number,
	amount: number,
	radius: number,
) {
	const steps = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))))
	for (let s = 0; s <= steps; s++) {
		const k = s / steps
		splat(scene, x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, amount, radius)
	}
}

function project(
	scene: Scene,
	pointer: Point,
	time: number,
	cx: number,
	cy: number,
	size: number,
): Projected[] {
	const breathe = 0.55 * Math.sin(time * 0.31)
	return VERTICES.map((vertex) => {
		const p = [...vertex]
		rotate(p, 0, 3, time * 0.5 + breathe + scene.fold + pointer.x * 1.2)
		rotate(p, 1, 3, time * 0.33 - breathe * 0.6 + scene.fold * 0.7 + pointer.y * 1.2)
		rotate(p, 2, 3, time * 0.19 + scene.fold * 0.4)
		rotate(p, 0, 2, time * 0.15)
		rotate(p, 1, 2, 0.42)
		const k4 = 1 / (W_DISTANCE - p[3])
		const f = 1 / (CAMERA_DISTANCE - p[2] * k4)
		return { x: cx + p[0] * k4 * f * size, y: cy + p[1] * k4 * f * size, depth: k4 * f }
	})
}

function drawTesseract(
	scene: Scene,
	pointer: Point,
	time: number,
	cx: number,
	cy: number,
	size: number,
	alpha: number,
) {
	const points = project(scene, pointer, time, cx, cy, size)
	const large = size > scene.rows * 0.5
	for (const [i, j] of EDGES) {
		const a = points[i]
		const b = points[j]
		const near = clamp01(((a.depth + b.depth) * 0.5 - 0.1) / 0.22)
		const radius = large ? (near > 0.55 ? 2 : near > 0.2 ? 1 : 0) : 0
		line(scene, a.x, a.y, b.x, b.y, alpha * (0.35 + 1.4 * near), radius)
	}
	for (const p of points) splat(scene, p.x, p.y, alpha * 4, 2)
}

function drawCorridor(scene: Scene, time: number, cx: number, cy: number, vx: number, vy: number) {
	const { cols, rows } = scene
	const aspect = cols / rows
	const phase = (time * 0.3) % 1
	for (let k = 0; k < RIBS; k++) {
		const f = (k + phase) / RIBS
		const hh = f ** 2.6 * rows * 0.78
		const hw = hh * aspect
		const ox = lerp(vx, cx, f)
		const oy = lerp(vy, cy, f)
		const a = TUNNEL_ALPHA * Math.min(1, f * 4) * (1 - f ** 6 * 0.6)
		line(scene, ox - hw, oy - hh, ox + hw, oy - hh, a, 0)
		line(scene, ox + hw, oy - hh, ox + hw, oy + hh, a, 0)
		line(scene, ox + hw, oy + hh, ox - hw, oy + hh, a, 0)
		line(scene, ox - hw, oy + hh, ox - hw, oy - hh, a, 0)
	}
	const far = rows * 0.02
	const near = rows * 0.85
	for (let i = 0; i <= RAYS; i++) {
		const q = (i / RAYS) * 2 - 1
		const ends = [
			[q * aspect, -1],
			[q * aspect, 1],
			[-aspect, q],
			[aspect, q],
		]
		for (const [ex, ey] of ends) {
			line(
				scene,
				vx + ex * far,
				vy + ey * far,
				cx + ex * near,
				cy + ey * near,
				TUNNEL_ALPHA * 0.55,
				0,
			)
		}
	}
}

function drawStrings(scene: Scene, pointer: Point, time: number) {
	const { cols, rows } = scene
	for (const seed of STRING_SEEDS) {
		const x0 = cols / 2 + seed.x * cols * 0.48 - pointer.x * cols * 0.05 * seed.depth
		const amplitude = 2 + 3 * seed.depth
		let px = x0
		let py = 0
		for (let k = 1; k <= STRING_SEGMENTS; k++) {
			const t = k / STRING_SEGMENTS
			const yy = t * rows
			const xx =
				x0 + Math.sin(time * 2.4 + seed.phase + k * 0.55) * amplitude * Math.sin(t * Math.PI)
			line(scene, px, py, xx, yy, STRING_ALPHA * seed.depth, 0)
			px = xx
			py = yy
		}
	}
}

/** Advances the animation by `elapsedMs` and splats the new frame into the energy buffer. */
export function advanceScene(scene: Scene, elapsedMs: number, pointer: Point) {
	const { cols, rows, energy } = scene
	scene.clock += elapsedMs * CLOCK_PER_MS
	scene.fold += scene.spin
	scene.spin *= SPIN_DECAY
	for (let i = 0; i < energy.length; i++) energy[i] *= TRAIL_DECAY

	const time = scene.clock
	const cx = cols / 2 + pointer.x * cols * 0.025
	const cy = rows / 2 + pointer.y * rows * 0.025
	const vx = cols / 2 - pointer.x * cols * 0.04
	const vy = rows / 2 - pointer.y * rows * 0.04

	drawCorridor(scene, time, cx, cy, vx, vy)
	drawStrings(scene, pointer, time)
	const phase = (time * 0.3) % 1
	for (let k = ECHOES; k >= 1; k--) {
		const f = (k - 1 + phase) / ECHOES
		const size = rows * (0.12 + 0.35 * f * f)
		const alpha = EDGE_ALPHA * 0.35 * Math.sin(f * Math.PI)
		drawTesseract(
			scene,
			pointer,
			time - k * 0.9,
			lerp(vx, cx, f * 0.6),
			lerp(vy, cy, f * 0.6),
			size,
			alpha,
		)
	}
	drawTesseract(scene, pointer, time, cx, cy, rows, EDGE_ALPHA)
}

/** Builds one still frame, for reduced motion. */
export function settleScene(scene: Scene, pointer: Point) {
	scene.energy.fill(0)
	scene.clock = SETTLE_CLOCK
	for (let i = 0; i < SETTLE_STEPS; i++) advanceScene(scene, SETTLE_STEP_MS, pointer)
}

function blurEnergy(scene: Scene) {
	const { cols, rows, energy, scratch, glow } = scene
	const r = BLUR_RADIUS
	const inv = 1 / (2 * r + 1)
	for (let y = 0; y < rows; y++) {
		const row = y * cols
		let acc = 0
		for (let x = -r; x <= r; x++) acc += energy[row + Math.min(cols - 1, Math.max(0, x))]
		for (let x = 0; x < cols; x++) {
			scratch[row + x] = acc * inv
			acc += energy[row + Math.min(cols - 1, x + r + 1)] - energy[row + Math.max(0, x - r)]
		}
	}
	for (let x = 0; x < cols; x++) {
		let acc = 0
		for (let y = -r; y <= r; y++) acc += scratch[Math.min(rows - 1, Math.max(0, y)) * cols + x]
		for (let y = 0; y < rows; y++) {
			glow[y * cols + x] = acc * inv
			acc +=
				scratch[Math.min(rows - 1, y + r + 1) * cols + x] - scratch[Math.max(0, y - r) * cols + x]
		}
	}
}

/** Dithers the current frame into RGBA `pixels` (cols x rows) in the ink color. */
export function paintScene(scene: Scene, pixels: Uint8ClampedArray, ink: Rgb) {
	const { cols, rows, energy, glow, falloff } = scene
	blurEnergy(scene)
	for (let y = 0; y < rows; y++) {
		for (let x = 0; x < cols; x++) {
			const i = y * cols + x
			const light =
				(1 - Math.exp(-(energy[i] * ENERGY_GAIN + glow[i] * GLOW_STRENGTH))) * falloff[i]
			writePixel(pixels, i, ink, light > bayerThreshold(x, y))
		}
	}
}
