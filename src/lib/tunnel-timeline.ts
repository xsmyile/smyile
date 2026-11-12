/**
 * Pure timeline of the backdrop: how fast the camera falls, which colors the glowing blocks take,
 * when the lattice twists into a spiral and how long the speed streaks get.
 */

import type { Rgb } from "./css-color"

const CRUISE_SPEED = 6
const DIVE_SPEED = 34
const DIVE_DECAY_S = 0.8
const FADE_IN_S = 1.2
const PHASE_S = 9
const BLEND_S = 2.5
const TWIST_CYCLE_S = 26
const TWIST_START_S = 12
const TWIST_IN_S = 3.5
const TWIST_HOLD_S = 2.5
const TWIST_OUT_S = 5
const TWIST_PEAK = 0.05
const STREAK_BASE = 0.01
const STREAK_PER_SPEED = 0.0035
const STREAK_MAX = 0.14

/** Pairs of block colors the fall cycles through, one pair per phase. */
const PALETTES: readonly (readonly [Rgb, Rgb])[] = [
	[
		[0.82, 0.95, 1],
		[0.45, 0.85, 0.95],
	],
	[
		[1, 0.3, 0.26],
		[0.35, 0.95, 0.85],
	],
	[
		[0.45, 1, 0.55],
		[0.95, 1, 0.4],
	],
	[
		[1, 0.3, 0.7],
		[0.45, 0.6, 1],
	],
]

function clamp01(v: number): number {
	return Math.min(1, Math.max(0, v))
}

function smootherstep(edge0: number, edge1: number, v: number): number {
	const t = clamp01((v - edge0) / (edge1 - edge0))
	return t * t * t * (t * (t * 6 - 15) + 10)
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
	return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

/** Base fall speed in world units per second: a fast dive on arrival settling into the cruise. */
export function baseSpeed(seconds: number): number {
	return CRUISE_SPEED + DIVE_SPEED * Math.exp(-seconds / DIVE_DECAY_S)
}

/** Brightness while the scene fades in from black, 0..1. */
export function fadeIn(seconds: number): number {
	return smootherstep(0, FADE_IN_S, seconds)
}

/** Block colors at a point of the timeline, cross-fading between phases. */
export function paletteAt(seconds: number): readonly [Rgb, Rgb] {
	const phase = Math.floor(seconds / PHASE_S)
	const into = seconds - phase * PHASE_S
	const current = PALETTES[phase % PALETTES.length]
	const next = PALETTES[(phase + 1) % PALETTES.length]
	const t = smootherstep(PHASE_S - BLEND_S, PHASE_S, into)
	return [mix(current[0], next[0], t), mix(current[1], next[1], t)]
}

/**
 * Spiral strength in radians per world unit of depth: zero most of the time, then a slow wind-in,
 * a short hold and a longer unwind, all with smootherstep easing so neither end snaps.
 */
export function twistAt(seconds: number): number {
	const t = (seconds % TWIST_CYCLE_S) - TWIST_START_S
	if (t <= 0) return 0
	const windIn = smootherstep(0, TWIST_IN_S, t)
	const unwind =
		1 - smootherstep(TWIST_IN_S + TWIST_HOLD_S, TWIST_IN_S + TWIST_HOLD_S + TWIST_OUT_S, t)
	return TWIST_PEAK * Math.min(windIn, unwind)
}

/** Length of the radial speed streaks for a fall speed: longer while diving or scrolling. */
export function streakFor(speed: number): number {
	return Math.min(STREAK_MAX, STREAK_BASE + Math.max(0, speed - CRUISE_SPEED) * STREAK_PER_SPEED)
}
