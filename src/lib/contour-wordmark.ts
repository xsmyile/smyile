import type { Rgb } from "./dither"
import { writePixel } from "./dither"

/** Distance of every inside cell from the glyph outline, in cells; 0 outside the glyphs. */
export type DistanceField = {
	cols: number
	rows: number
	distance: Float32Array
}

const INSIDE_ALPHA = 110
const UNSET = Number.POSITIVE_INFINITY
const STRAIGHT = 1
const DIAGONAL = Math.SQRT2
const CONTOUR_PERIOD = 4.2
const CONTOUR_WIDTH = 1.2
const OUTLINE_WIDTH = 1.5

/** Two-pass chamfer distance transform of the alpha channel of RGBA `pixels`. */
export function distanceField(
	pixels: Uint8ClampedArray,
	cols: number,
	rows: number,
): DistanceField {
	const distance = new Float32Array(cols * rows)
	for (let i = 0; i < distance.length; i++)
		distance[i] = pixels[i * 4 + 3] > INSIDE_ALPHA ? UNSET : 0

	for (let y = 0; y < rows; y++) {
		for (let x = 0; x < cols; x++) {
			const i = y * cols + x
			if (distance[i] === 0) continue
			let d = x === 0 || y === 0 ? STRAIGHT : distance[i]
			if (x > 0) d = Math.min(d, distance[i - 1] + STRAIGHT)
			if (y > 0) d = Math.min(d, distance[i - cols] + STRAIGHT)
			if (x > 0 && y > 0) d = Math.min(d, distance[i - cols - 1] + DIAGONAL)
			if (x < cols - 1 && y > 0) d = Math.min(d, distance[i - cols + 1] + DIAGONAL)
			distance[i] = d
		}
	}
	for (let y = rows - 1; y >= 0; y--) {
		for (let x = cols - 1; x >= 0; x--) {
			const i = y * cols + x
			if (distance[i] === 0) continue
			let d = x === cols - 1 || y === rows - 1 ? STRAIGHT : distance[i]
			if (x < cols - 1) d = Math.min(d, distance[i + 1] + STRAIGHT)
			if (y < rows - 1) d = Math.min(d, distance[i + cols] + STRAIGHT)
			if (x < cols - 1 && y < rows - 1) d = Math.min(d, distance[i + cols + 1] + DIAGONAL)
			if (x > 0 && y < rows - 1) d = Math.min(d, distance[i + cols - 1] + DIAGONAL)
			distance[i] = d
		}
	}
	return { cols, rows, distance }
}

/**
 * Paints the glyphs as their outline plus concentric inner contours; `flow` (in cells) shifts the
 * contours inward as it grows.
 */
export function paintContours(
	field: DistanceField,
	pixels: Uint8ClampedArray,
	ink: Rgb,
	flow: number,
) {
	const shift = CONTOUR_PERIOD - (flow % CONTOUR_PERIOD)
	for (let i = 0; i < field.distance.length; i++) {
		const d = field.distance[i]
		const on = d > 0 && (d < OUTLINE_WIDTH || (d + shift) % CONTOUR_PERIOD < CONTOUR_WIDTH)
		writePixel(pixels, i, ink, on)
	}
}
